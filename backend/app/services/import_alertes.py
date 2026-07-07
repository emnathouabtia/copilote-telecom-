"""
Importe les alertes du fichier 06_modele_import_alertes.json dans la table `alertes`,
en résolvant les clés étrangères vers sites / equipements / services_telecom
via leurs codes (code_site, code_equipement, code_service).

Usage:
    python import_alertes.py chemin/vers/06_modele_import_alertes.json
"""
import json
import sys
import psycopg2

DB_DSN = "dbname=copilote_supervision user=postgres password=postgres host=localhost port=5432"


def get_id(cur, table, code_column, code_value):
    if code_value is None:
        return None
    cur.execute(f"SELECT id FROM {table} WHERE {code_column} = %s", (code_value,))
    row = cur.fetchone()
    return row[0] if row else None


def import_alertes(json_path: str):
    with open(json_path, encoding="utf-8") as f:
        payload = json.load(f)

    alerts = payload["alerts"]
    conn = psycopg2.connect(DB_DSN)
    conn.autocommit = False
    cur = conn.cursor()

    inserted, skipped = 0, 0
    for a in alerts:
        site_id = get_id(cur, "sites", "code_site", a.get("code_site"))
        equip_id = get_id(cur, "equipements", "code_equipement", a.get("code_equipement"))
        service_id = get_id(cur, "services_telecom", "code_service", a.get("code_service"))

        cur.execute(
            """
            INSERT INTO alertes (
                external_alarm_id, source_system, date_alerte,
                site_id, equipement_id, service_id,
                type_alerte, severite, message, metrique,
                valeur_mesuree, seuil, unite, statut, fingerprint
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING
            """,
            (
                a.get("external_alarm_id"),
                a.get("source_system"),
                a.get("date_alerte"),
                site_id,
                equip_id,
                service_id,
                a.get("type_alerte"),
                a.get("severite"),
                a.get("message"),
                a.get("metrique"),
                a.get("valeur_mesuree"),
                a.get("seuil"),
                a.get("unite"),
                a.get("statut", "NOUVELLE"),
                a.get("fingerprint"),
            ),
        )
        if cur.rowcount == 1:
            inserted += 1
        else:
            skipped += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f"Import terminé : {inserted} alertes insérées, {skipped} ignorées (déjà présentes).")


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "06_modele_import_alertes.json"
    import_alertes(path)
