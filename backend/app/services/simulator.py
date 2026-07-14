
"""
Simulateur d'alertes télécom (backend/app/services/simulator.py)

Remplace une vraie plateforme de supervision (NMS avec SNMP/Syslog) absente
pendant le stage. Génère des alertes réalistes et les insère directement
dans la table `alertes`, en piochant des sites/équipements/services déjà
créés par 02_seed_postgresql.sql.

Usage:
    python simulator.py            # génère 20 alertes d'un coup et s'arrête
    python simulator.py --loop     # génère une alerte aléatoire toutes les X secondes, en continu
"""
import argparse
import random
import time
import uuid

import psycopg2
import psycopg2.extras
DB_DSN = "dbname=copilote_supervision user=origin password=origin host=localhost port=5432"

# Un "profil" par type d'alerte : quelle métrique, quelle unité, quel seuil,
# et dans quelle fourchette générer une valeur (parfois au-dessus du seuil,
# pour simuler une vraie panne).
ALERT_PROFILES = {
    "CPU_HIGH": {"metrique": "CPU", "unite": "%", "seuil": 90, "range": (10, 100)},
    "RAM_HIGH": {"metrique": "RAM", "unite": "%", "seuil": 90, "range": (10, 100)},
    "DISK_FULL": {"metrique": "DISK", "unite": "%", "seuil": 95, "range": (20, 100)},
    "LINK_DOWN": {"metrique": "LINK_STATUS", "unite": "etat", "seuil": 1, "range": (0, 1)},
    "SERVICE_DOWN": {"metrique": "SERVICE_STATUS", "unite": "etat", "seuil": 1, "range": (0, 1)},
    "PING_LOSS": {"metrique": "PACKET_LOSS", "unite": "%", "seuil": 80, "range": (0, 100)},
    "POWER_FAIL": {"metrique": "POWER_STATUS", "unite": "etat", "seuil": 1, "range": (0, 1)},
    "AUTH_FAILURE_SPIKE": {"metrique": "AUTH_FAILURES", "unite": "tentatives", "seuil": 20, "range": (0, 50)},
}

SEVERITES = ["INFO", "MINEURE", "MAJEURE", "CRITIQUE"]


def get_connection():
    return psycopg2.connect(DB_DSN, cursor_factory=psycopg2.extras.RealDictCursor)


def load_reference_data(cur):
    """Récupère les sites/équipements/services déjà créés par le seed,
    pour générer des alertes cohérentes (pas d'IDs inventés)."""
    cur.execute("SELECT id, code_site FROM sites")
    sites = cur.fetchall()
    cur.execute("SELECT id, code_equipement, site_id FROM equipements")
    equipements = cur.fetchall()
    cur.execute("SELECT id, code_service FROM services_telecom")
    services = cur.fetchall()
    return sites, equipements, services


def generate_alert(equipements, services):
    equip = random.choice(equipements)
    service = random.choice(services)
    type_alerte = random.choice(list(ALERT_PROFILES.keys()))
    profile = ALERT_PROFILES[type_alerte]

    valeur = round(random.uniform(*profile["range"]), 2)
    severite = random.choices(SEVERITES, weights=[10, 30, 35, 25])[0]

    return {
        "external_alarm_id": f"SIM-{uuid.uuid4().hex[:8].upper()}",
        "source_system": "SIMULATEUR_STAGE",
        "equipement_id": equip["id"],
        "site_id": equip["site_id"],
        "service_id": service["id"],
        "type_alerte": type_alerte,
        "severite": severite,
        "message": f"{profile['metrique']} anormal sur {equip['code_equipement']} : {valeur}{profile['unite']}",
        "metrique": profile["metrique"],
        "valeur_mesuree": valeur,
        "seuil": profile["seuil"],
        "unite": profile["unite"],
        "fingerprint": f"{equip['code_equipement']}-{type_alerte}",
    }


def insert_alert(cur, alert: dict):
    cur.execute(
        """
        INSERT INTO alertes (
            external_alarm_id, source_system, site_id, equipement_id, service_id,
            type_alerte, severite, message, metrique, valeur_mesuree, seuil, unite, fingerprint
        ) VALUES (%(external_alarm_id)s, %(source_system)s, %(site_id)s, %(equipement_id)s, %(service_id)s,
                  %(type_alerte)s, %(severite)s, %(message)s, %(metrique)s, %(valeur_mesuree)s,
                  %(seuil)s, %(unite)s, %(fingerprint)s)
        """,
        alert,
    )


def run_batch(n: int):
    conn = get_connection()
    cur = conn.cursor()
    _, equipements, services = load_reference_data(cur)
    if not equipements or not services:
        print("Aucun équipement/service trouvé — exécute d'abord 02_seed_postgresql.sql")
        return

    for _ in range(n):
        alert = generate_alert(equipements, services)
        insert_alert(cur, alert)
        print(f"Alerte générée : {alert['type_alerte']} ({alert['severite']}) sur {alert['fingerprint']}")

    conn.commit()
    cur.close()
    conn.close()
    print(f"\n{n} alertes insérées dans la table `alertes`.")


def run_loop(interval_seconds: int):
    conn = get_connection()
    cur = conn.cursor()
    _, equipements, services = load_reference_data(cur)
    print(f"Simulateur en continu (Ctrl+C pour arrêter), une alerte toutes les {interval_seconds}s...")
    try:
        while True:
            alert = generate_alert(equipements, services)
            insert_alert(cur, alert)
            conn.commit()
            print(f"[{time.strftime('%H:%M:%S')}] Alerte générée : {alert['type_alerte']} ({alert['severite']})")
            time.sleep(interval_seconds)
    except KeyboardInterrupt:
        print("\nSimulateur arrêté.")
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--loop", action="store_true", help="génère des alertes en continu au lieu d'un lot unique")
    parser.add_argument("--n", type=int, default=20, help="nombre d'alertes à générer en mode batch")
    parser.add_argument("--interval", type=int, default=10, help="secondes entre 2 alertes en mode --loop")
    args = parser.parse_args()

    if args.loop:
        run_loop(args.interval)
    else:
        run_batch(args.n)
