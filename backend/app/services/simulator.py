import csv
import requests
import time
from datetime import datetime

API_URL = "http://localhost:8000/alerts/"
CSV_PATH = r"C:\Users\-PC-\Desktop\copilote-telecom-\docs\03_alertes_simulees.csv"

def send_alert(alert):
    try:
        response = requests.post(API_URL, json=alert)
        print(response.status_code, alert.get('type_alerte'), alert.get('severite'))
    except Exception as e:
        print("Erreur:", e)

def run_simulator(interval_seconds=5):
    print("Simulateur demarre")
    while True:
        try:
            with open(CSV_PATH, encoding='utf-8-sig') as f:
                reader = csv.DictReader(f, delimiter=';')
                for row in reader:
                    alert = {
                        "type_alerte": row.get("type_alerte", ""),
                        "severite": row.get("severite", "MINEURE"),
                        "message": str(row.get("message_alerte", "")),
                        "valeur_mesuree": float(row.get("valeur_mesuree", 0) or 0),
                        "seuil": float(row.get("seuil", 0) or 0),
                        "unite": row.get("unite_mesure", ""),
                        "metrique": row.get("metrique", ""),
                    }
                    send_alert(alert)
                    time.sleep(interval_seconds)
        except FileNotFoundError:
            print("CSV non trouve:", CSV_PATH)
            break
        except Exception as e:
            print("Erreur:", e)
            time.sleep(10)

if __name__ == "__main__":
    run_simulator(interval_seconds=5)
