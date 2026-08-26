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
@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT id, nom_complet, email, role, actif, cree_le
        FROM utilisateurs ORDER BY role, nom_complet
    """)).fetchall()
    return {"status": "ok", "data": [dict(r._mapping) for r in result]}

@router.post("/users")
def add_user(data: dict, db: Session = Depends(get_db)):
    try:
        db.execute(text("""
            INSERT INTO utilisateurs (nom_complet, email, role, mot_de_passe, actif)
            VALUES (:nom_complet, :email, :role, :mot_de_passe, true)
        """), data)
        db.commit()
        return {"status": "ok", "message": "Utilisateur ajoute"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.patch("/users/{user_id}/toggle")
def toggle_actif(user_id: str, data: dict, db: Session = Depends(get_db)):
    db.execute(text("UPDATE utilisateurs SET actif = :actif WHERE id = :id"),
               {"actif": data.get("actif"), "id": user_id})
    db.commit()
    return {"status": "ok"}

@router.patch("/users/{user_id}/role")
def update_role(user_id: str, data: dict, db: Session = Depends(get_db)):
    db.execute(text("UPDATE utilisateurs SET role = :role WHERE id = :id"),
               {"role": data.get("role"), "id": user_id})
    db.commit()
    return {"status": "ok"}