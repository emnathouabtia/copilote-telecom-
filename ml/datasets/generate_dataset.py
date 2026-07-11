import pandas as pd
import numpy as np
import random
import os

random.seed(42)
np.random.seed(42)

# Types d'alertes avec leurs métriques et seuils
ALERT_CONFIGS = {
    'CPU_HIGH':     {'metrique': 'CPU',          'unite': '%',     'seuil': 85,  'normal': (20, 84),  'anomalie': (90, 100)},
    'RAM_HIGH':     {'metrique': 'RAM',          'unite': '%',     'seuil': 90,  'normal': (20, 89),  'anomalie': (91, 100)},
    'DISK_FULL':    {'metrique': 'DISK',         'unite': '%',     'seuil': 90,  'normal': (10, 89),  'anomalie': (91, 100)},
    'LINK_DOWN':    {'metrique': 'LINK_STATUS',  'unite': 'etat',  'seuil': 1,   'normal': (0, 0),    'anomalie': (0, 0)},
    'SERVICE_DOWN': {'metrique': 'SERVICE',      'unite': 'etat',  'seuil': 1,   'normal': (1, 1),    'anomalie': (0, 0)},
    'POWER_FAIL':   {'metrique': 'VOLTAGE',      'unite': 'V',     'seuil': 48,  'normal': (48, 54),  'anomalie': (0, 40)},
    'PING_LOSS':    {'metrique': 'PACKET_LOSS',  'unite': '%',     'seuil': 10,  'normal': (0, 9),    'anomalie': (30, 100)},
    'AUTH_FAILURE': {'metrique': 'AUTH_FAIL',    'unite': 'count', 'seuil': 5,   'normal': (0, 4),    'anomalie': (20, 100)},
}

SEVERITES = ['CRITIQUE', 'MAJEURE', 'MINEURE']
EQUIPEMENTS = ['TUN-RTR-CORE-01', 'ARI-ENB-014', 'BIZ-ENB-022', 'NAB-ENER-031', 'SOU-SRV-OSS-01']

rows = []

# Générer 300 alertes normales + 100 anomalies = 400 total
for i in range(400):
    alert_type = random.choice(list(ALERT_CONFIGS.keys()))
    config = ALERT_CONFIGS[alert_type]
    is_anomalie = i >= 300  # les 100 dernières sont des anomalies

    if is_anomalie:
        low, high = config['anomalie']
        severite = random.choice(['CRITIQUE', 'MAJEURE'])
    else:
        low, high = config['normal']
        severite = random.choice(SEVERITES)

    valeur = round(random.uniform(low, high), 2) if low != high else low
    seuil = config['seuil']
    ratio_seuil = round(valeur / seuil, 4) if seuil != 0 else 0

    rows.append({
        'type_alerte': alert_type,
        'metrique': config['metrique'],
        'valeur_mesuree': valeur,
        'seuil': seuil,
        'unite': config['unite'],
        'ratio_seuil': ratio_seuil,
        'severite': severite,
        'equipement': random.choice(EQUIPEMENTS),
        'heure': random.randint(0, 23),
        'jour_semaine': random.randint(0, 6),
        'is_anomalie': 1 if is_anomalie else 0
    })

df = pd.DataFrame(rows).sample(frac=1, random_state=42).reset_index(drop=True)

# Créer le dossier si nécessaire
os.makedirs('ml/datasets', exist_ok=True)
output_path = 'ml/datasets/alertes_ml_dataset.csv'
df.to_csv(output_path, index=False)

print(f"Dataset généré : {len(df)} lignes")
print(f"Sauvegardé dans : {output_path}")
print(f"\nRépartition anomalies :")
print(df['is_anomalie'].value_counts())
print(f"\nRépartition sévérités :")
print(df['severite'].value_counts())
print(f"\nRépartition types d'alertes :")
print(df['type_alerte'].value_counts())