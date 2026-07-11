import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
import joblib
import mlflow
import mlflow.sklearn
import os

# ── Chargement des données ──
df = pd.read_csv('ml/datasets/alertes_ml_dataset.csv')
print(f"Dataset chargé : {len(df)} lignes")

# ── Prétraitement ──
le_type = LabelEncoder()
le_severite = LabelEncoder()
le_equipement = LabelEncoder()

df['type_encoded'] = le_type.fit_transform(df['type_alerte'])
df['severite_encoded'] = le_severite.fit_transform(df['severite'])
df['equipement_encoded'] = le_equipement.fit_transform(df['equipement'])

# Features utilisées par le modèle
FEATURES = [
    'valeur_mesuree',
    'seuil',
    'ratio_seuil',
    'heure',
    'jour_semaine',
    'type_encoded',
    'severite_encoded',
    'equipement_encoded'
]

X = df[FEATURES]

# ── MLflow tracking ──
mlflow.set_experiment("copilote-telecom-isolation-forest")

with mlflow.start_run():
    # Paramètres du modèle
    contamination = 0.25
    n_estimators = 100
    random_state = 42

    mlflow.log_param("contamination", contamination)
    mlflow.log_param("n_estimators", n_estimators)
    mlflow.log_param("features", FEATURES)

    # ── Entraînement ──
    model = IsolationForest(
        contamination=contamination,
        n_estimators=n_estimators,
        random_state=random_state
    )
    model.fit(X)
    print("Modèle entraîné ✅")

    # ── Évaluation rapide ──
    df['anomaly_score'] = model.decision_function(X)
    df['prediction'] = model.predict(X)
    df['is_anomaly'] = df['prediction'].apply(lambda x: 1 if x == -1 else 0)

    # Comparer avec les vraies anomalies
    vrais_positifs = ((df['is_anomaly'] == 1) & (df['is_anomalie'] == 1)).sum()
    total_anomalies = df['is_anomalie'].sum()
    precision = round(vrais_positifs / df['is_anomaly'].sum() * 100, 1) if df['is_anomaly'].sum() > 0 else 0
    recall = round(vrais_positifs / total_anomalies * 100, 1) if total_anomalies > 0 else 0

    print(f"Anomalies détectées : {df['is_anomaly'].sum()}")
    print(f"Precision : {precision}%")
    print(f"Recall : {recall}%")

    mlflow.log_metric("precision", precision)
    mlflow.log_metric("recall", recall)
    mlflow.log_metric("anomalies_detectees", int(df['is_anomaly'].sum()))

    # ── Sauvegarde modèle + encodeurs ──
    os.makedirs('ml/models', exist_ok=True)

    joblib.dump(model, 'ml/models/model_isolation_forest.pkl')
    joblib.dump(le_type, 'ml/models/encoder_type.pkl')
    joblib.dump(le_severite, 'ml/models/encoder_severite.pkl')
    joblib.dump(le_equipement, 'ml/models/encoder_equipement.pkl')
    joblib.dump(FEATURES, 'ml/models/features.pkl')

    mlflow.sklearn.log_model(model, "isolation_forest_model")

    print("Modèle sauvegardé dans ml/models/ ✅")
    print(f"Run MLflow ID : {mlflow.active_run().info.run_id}")