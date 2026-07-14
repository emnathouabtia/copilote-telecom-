"""
Moteur de règles - lit les alertes NOUVELLES, les classe via `regles_diagnostic`,
calcule un score pondéré (poids dans `parametres_scoring`) et crée les incidents
correspondants, en s'appuyant sur les relations déjà définies dans le schéma :

    alertes -> regles_diagnostic (par type_alerte)
    regles_diagnostic -> base_connaissances (cause probable / action recommandée)
    alertes -> sites / services_telecom (criticité)

Usage:
    python rules_engine.py
"""
import re
import uuid
from datetime import datetime, timezone

import psycopg2
import psycopg2.extras

DB_DSN = "dbname=copilote_supervision user=origin password=origin host=localhost port=5432"

SEVERITE_SCORE = {"INFO": 10, "MINEURE": 40, "MAJEURE": 70, "CRITIQUE": 100}

CONDITION_RE = re.compile(r"valeur_mesuree\s*(>=|<=|=|>|<)\s*(-?\d+(?:\.\d+)?)")


def condition_matches(condition_expression: str, valeur_mesuree) -> bool:
    """Évalue en toute sécurité une condition du type 'valeur_mesuree >= 90'
    sans jamais appeler eval() sur du texte venant de la base."""
    if valeur_mesuree is None:
        return False
    m = CONDITION_RE.search(condition_expression)
    if not m:
        return False
    op, threshold = m.group(1), float(m.group(2))
    v = float(valeur_mesuree)
    return {
        ">=": v >= threshold,
        "<=": v <= threshold,
        "=": v == threshold,
        ">": v > threshold,
        "<": v < threshold,
    }[op]


def load_weights(cur):
    cur.execute("SELECT nom_parametre, valeur FROM parametres_scoring")
    return {row[0]: float(row[1]) for row in cur.fetchall()}


def load_rules(cur):
    cur.execute(
        """
        SELECT r.id, r.type_alerte, r.condition_expression, r.categorie,
               r.severite_min, r.score_min_priorite_haute,
               k.cause_probable, k.action_n1, k.niveau_escalade
        FROM regles_diagnostic r
        LEFT JOIN base_connaissances k ON k.id = r.fiche_connaissance_id
        WHERE r.actif = TRUE
        """
    )
    rules = {}
    for row in cur.fetchall():
        rules.setdefault(row[1], []).append(
            {
                "id": row[0],
                "condition_expression": row[2],
                "categorie": row[3],
                "cause_probable": row[6],
                "action_n1": row[7],
                "niveau_escalade": row[8],
            }
        )
    return rules


def priorite_from_score(score: float) -> str:
    if score >= 85:
        return "P1_CRITIQUE"
    if score >= 70:
        return "P2_HAUTE"
    if score >= 45:
        return "P3_MOYENNE"
    return "P4_BASSE"


def process_alertes():
    conn = psycopg2.connect(DB_DSN)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    weights = load_weights(cur)
    rules = load_rules(cur)

    cur.execute(
        """
        SELECT a.id, a.fingerprint, a.type_alerte, a.severite, a.valeur_mesuree,
               a.site_id, a.equipement_id, a.service_id, a.message, a.date_alerte,
               COALESCE(s.criticite_site, 3) AS criticite_site,
               COALESCE(sv.criticite_service, 3) AS criticite_service
        FROM alertes a
        LEFT JOIN sites s ON s.id = a.site_id
        LEFT JOIN services_telecom sv ON sv.id = a.service_id
        WHERE a.statut = 'NOUVELLE'
        """
    )
    alertes = cur.fetchall()

    created = 0
    for al in alertes:
        applicable = rules.get(al["type_alerte"], [])
        match = next(
            (r for r in applicable if condition_matches(r["condition_expression"], al["valeur_mesuree"])),
            None,
        )
        if match is None:
            continue

        cur.execute(
            "SELECT COUNT(*) FROM alertes WHERE fingerprint = %s AND date_alerte >= NOW() - INTERVAL '24 hours'",
            (al["fingerprint"],),
        )
        repetitions = cur.fetchone()[0]

        score = (
            weights.get("POIDS_SEVERITE", 40) * SEVERITE_SCORE.get(al["severite"], 50) / 100
            + weights.get("POIDS_SERVICE", 25) * al["criticite_service"] / 5
            + weights.get("POIDS_SITE", 20) * al["criticite_site"] / 5
            + weights.get("POIDS_REPETITION", 10) * min(repetitions, 5) / 5
            + weights.get("POIDS_DUREE", 5) * 0
        )
        score = round(min(score, 100), 2)
        priorite = priorite_from_score(score)
        reference = f"INC-{datetime.now(timezone.utc):%Y}-{uuid.uuid4().hex[:6].upper()}"

        cur.execute(
            """
            INSERT INTO incidents (
                reference, alerte_source_id, site_id, equipement_id, service_id,
                titre, categorie, severite, priorite, score_criticite,
                cause_probable, action_recommandee, niveau_escalade
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
            """,
            (
                reference, al["id"], al["site_id"], al["equipement_id"], al["service_id"],
                f"Incident {al['type_alerte']} - {al['message']}",
                match["categorie"], al["severite"], priorite, score,
                match["cause_probable"], match["action_n1"], match["niveau_escalade"],
            ),
        )
        incident_id = cur.fetchone()[0]

        cur.execute(
            "INSERT INTO incident_alertes (incident_id, alerte_id) VALUES (%s,%s)",
            (incident_id, al["id"]),
        )
        cur.execute(
            "UPDATE alertes SET statut = 'CONVERTIE_INCIDENT' WHERE id = %s",
            (al["id"],),
        )
        cur.execute(
            """
            INSERT INTO historique_incidents (incident_id, action, nouveau_statut, commentaire)
            VALUES (%s, 'CREATION_AUTOMATIQUE', 'OUVERT', %s)
            """,
            (incident_id, f"Créé par le moteur de règles ({match['id']})"),
        )
        created += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f"{created} incident(s) créé(s) à partir des alertes NOUVELLES.")


if __name__ == "__main__":
    process_alertes()