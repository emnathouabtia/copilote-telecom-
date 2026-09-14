"""
train_model_v2.py — Alternative supervisée au modèle IsolationForest initial.

Contexte : le dataset contient déjà une vraie étiquette (is_anomalie),
ce qui permet d'entraîner un classifieur supervisé plutôt que de deviner
les anomalies avec une méthode non supervisée. Ce script compare les deux
approches avec une vraie évaluation train/test (contrairement à
train_model.py qui évalue sur les données d'entraînement elles-mêmes).

Lancer avec : python ml/train_model_v2.py
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score, classification_report
import joblib
import mlflow
import mlflow.sklearn
import os

# ── Chargement des données ──
df = pd.read_csv('ml/datasets/alertes_ml_dataset.csv')
print(f"Dataset chargé : {len(df)} lignes")

# ── Prétraitement (identique à train_model.py) ──
le_type = LabelEncoder()
le_severite = LabelEncoder()
le_equipement = LabelEncoder()

df['type_encoded'] = le_type.fit_transform(df['type_alerte'])
df['severite_encoded'] = le_severite.fit_transform(df['severite'])
df['equipement_encoded'] = le_equipement.fit_transform(df['equipement'])

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
y = df['is_anomalie']

# Split train/test stratifié — évaluation honnête sur des données non vues
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

mlflow.set_experiment("copilote-telecom-model-comparison")

# ── Run 1 : IsolationForest sur split train/test (baseline, ré-évaluée proprement) ──
with mlflow.start_run(run_name="isolation_forest_holdout"):
    contamination = 0.25
    n_estimators = 100

    mlflow.log_param("model_type", "IsolationForest")
    mlflow.log_param("contamination", contamination)
    mlflow.log_param("n_estimators", n_estimators)
    mlflow.log_param("evaluation", "holdout_25pct")

    iso_model = IsolationForest(
        contamination=contamination,
        n_estimators=n_estimators,
        random_state=42
    )
    iso_model.fit(X_train)
    pred_iso = (iso_model.predict(X_test) == -1).astype(int)

    precision_iso = precision_score(y_test, pred_iso) * 100
    recall_iso = recall_score(y_test, pred_iso) * 100
    f1_iso = f1_score(y_test, pred_iso) * 100

    print("\n=== IsolationForest (non supervisé, holdout 25%) ===")
    print(f"Precision : {precision_iso:.1f}%  Recall : {recall_iso:.1f}%  F1 : {f1_iso:.1f}%")

    mlflow.log_metric("precision", precision_iso)
    mlflow.log_metric("recall", recall_iso)
    mlflow.log_metric("f1_score", f1_iso)

# ── Run 2 : Random Forest supervisé (utilise les vraies étiquettes) ──
with mlflow.start_run(run_name="random_forest_supervised"):
    n_estimators_rf = 200

    mlflow.log_param("model_type", "RandomForestClassifier")
    mlflow.log_param("n_estimators", n_estimators_rf)
    mlflow.log_param("evaluation", "holdout_25pct")

    rf_model = RandomForestClassifier(n_estimators=n_estimators_rf, random_state=42)
    rf_model.fit(X_train, y_train)
    pred_rf = rf_model.predict(X_test)

    accuracy_rf = accuracy_score(y_test, pred_rf) * 100
    precision_rf = precision_score(y_test, pred_rf) * 100
    recall_rf = recall_score(y_test, pred_rf) * 100
    f1_rf = f1_score(y_test, pred_rf) * 100

    print("\n=== Random Forest (supervisé, holdout 25%) ===")
    print(f"Accuracy : {accuracy_rf:.1f}%")
    print(f"Precision : {precision_rf:.1f}%  Recall : {recall_rf:.1f}%  F1 : {f1_rf:.1f}%")
    print("\n", classification_report(y_test, pred_rf, target_names=["Normal", "Anomalie"]))

    mlflow.log_metric("accuracy", accuracy_rf)
    mlflow.log_metric("precision", precision_rf)
    mlflow.log_metric("recall", recall_rf)
    mlflow.log_metric("f1_score", f1_rf)

    # Importance des features — utile pour expliquer le modèle en entretien
    importances = pd.Series(rf_model.feature_importances_, index=FEATURES).sort_values(ascending=False)
    print("\nImportance des features :")
    print(importances)

    # ── Sauvegarde du modèle ──
    os.makedirs('ml/models', exist_ok=True)
    joblib.dump(rf_model, 'ml/models/model_random_forest.pkl')
    mlflow.sklearn.log_model(rf_model, "random_forest_model")

    print("\nModèle sauvegardé dans ml/models/model_random_forest.pkl ✅")
    print(f"Run MLflow ID : {mlflow.active_run().info.run_id}")

print("\n" + "=" * 60)
print("COMPARAISON FINALE (sur les mêmes données de test)")
print("=" * 60)
print(f"{'Modèle':<25}{'Precision':<12}{'Recall':<12}{'F1':<10}")
print(f"{'IsolationForest':<25}{precision_iso:<12.1f}{recall_iso:<12.1f}{f1_iso:<10.1f}")
print(f"{'Random Forest':<25}{precision_rf:<12.1f}{recall_rf:<12.1f}{f1_rf:<10.1f}")
