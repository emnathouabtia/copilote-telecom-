from fastapi import APIRouter
from sqlalchemy import text
from app.models.database import get_db
from fastapi import Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(data: dict, db: Session = Depends(get_db)):
    email = data.get("email", "")
    password = data.get("password", "")

    if not email or not password:
        return {"status": "error", "message": "Email et mot de passe requis"}

    user = db.execute(text("""
        SELECT id, nom_complet, email, role, mot_de_passe, actif
        FROM utilisateurs
        WHERE email = :email
    """), {"email": email}).fetchone()

    if not user:
        return {"status": "error", "message": "Utilisateur introuvable"}

    user = dict(user._mapping)

    if not user["actif"]:
        return {"status": "error", "message": "Compte désactivé"}

    if user["mot_de_passe"] != password:
        return {"status": "error", "message": "Mot de passe incorrect"}

    return {
        "status": "ok",
        "user": {
            "id": str(user["id"]),
            "nom_complet": user["nom_complet"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT id, nom_complet, email, role, actif, cree_le
        FROM utilisateurs
        ORDER BY role, nom_complet
    """)).fetchall()
    return {"status": "ok", "data": [dict(r._mapping) for r in result]}