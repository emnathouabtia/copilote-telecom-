from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.database import get_db
import joblib
import numpy as np
import os

router = APIRouter(prefix="/predict", tags=["ML Predict"])

# ── Chargement du modèle au démarrage ──
BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
MODELS_PATH = os.path.join(BASE, "ml", "models")

try:
    model = joblib.load(os.path.join(MODELS_PATH, "model_isolation_forest.pkl"))
    encoder_type = joblib.load(os.path.join(MODELS_PATH, "encoder_type.pkl"))
    encoder_severite = joblib.load(os.path.join(MODELS_PATH, "encoder_severite.pkl"))
    encoder_equipement = joblib.load(os.path.join(MODELS_PATH, "encoder_equipement.pkl"))
    features = joblib.load(os.path.join(MODELS_PATH, "features.pkl"))
    print("Modèle ML chargé ✅")
except Exception as e:
    model = None
    print(f"Modèle ML non chargé : {e}")

def encode_safe(encoder, value):
    try:
        return int(encoder.transform([value])[0])
    except:
        return 0

@router.post("/")
def predict_anomaly(alert: dict):
    if model is None:
        return {"status": "error", "message": "Modèle ML non disponible"}

    try:
        type_encoded = encode_safe(encoder_type, alert.get("type_alerte", "CPU_HIGH"))
        severite_encoded = encode_safe(encoder_severite, alert.get("severite", "MINEURE"))
        equipement_encoded = encode_safe(encoder_equipement, alert.get("equipement", "TUN-RTR-CORE-01"))

        valeur = float(alert.get("valeur_mesuree", 0))
        seuil = float(alert.get("seuil", 1))
        ratio_seuil = round(valeur / seuil, 4) if seuil != 0 else 0

        X = np.array([[
            valeur,
            seuil,
            ratio_seuil,
            int(alert.get("heure", 12)),
            int(alert.get("jour_semaine", 0)),
            type_encoded,
            severite_encoded,
            equipement_encoded
        ]])

        score = float(model.decision_function(X)[0])
        prediction = int(model.predict(X)[0])
        is_anomaly = prediction == -1

        if score < -0.3:
            label = "ANOMALIE"
        elif score < 0:
            label = "SUSPECT"
        else:
            label = "NORMAL"

        return {
            "status": "ok",
            "anomaly": is_anomaly,
            "score": round(score, 4),
            "label": label,
            "details": {
                "type_alerte": alert.get("type_alerte"),
                "severite": alert.get("severite"),
                "valeur_mesuree": valeur,
                "ratio_seuil": ratio_seuil
            }
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/health")
def predict_health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_type": "IsolationForest"
    }