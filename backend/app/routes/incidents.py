from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.database import get_db
from typing import Optional

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("/")
def get_incidents(
    priorite: Optional[str] = None,
    statut: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = """
        SELECT
            i.id,
            i.reference,
            i.titre,
            i.description,
            i.priorite,
            i.statut,
            i.severite,
            i.score_criticite,
            i.cause_probable,
            i.action_recommandee,
            i.categorie,
            i.date_creation,
            i.date_resolution,
            e.nom_equipement,
            e.code_equipement,
            s.nom_site
        FROM incidents i
        LEFT JOIN equipements e ON i.equipement_id = e.id
        LEFT JOIN sites s ON e.site_id = s.id
        WHERE 1=1
    """
    params = {}

    if priorite:
        query += " AND i.priorite = :priorite"
        params["priorite"] = priorite

    if statut:
        query += " AND i.statut = :statut"
        params["statut"] = statut

    query += " ORDER BY i.score_criticite DESC LIMIT :limit"
    params["limit"] = limit

    result = db.execute(text(query), params).fetchall()
    return {
        "status": "ok",
        "count": len(result),
        "data": [dict(row._mapping) for row in result]
    }

@router.get("/{incident_id}")
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT i.*, e.nom_equipement, s.nom_site
        FROM incidents i
        LEFT JOIN equipements e ON i.equipement_id = e.id
        LEFT JOIN sites s ON e.site_id = s.id
        WHERE i.id = :id
    """), {"id": incident_id}).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Incident introuvable")

    return {"status": "ok", "data": dict(result._mapping)}

@router.patch("/{incident_id}/statut")
def update_statut(incident_id: str, data: dict, db: Session = Depends(get_db)):
    nouveau_statut = data.get("statut")
    if not nouveau_statut:
        return {"status": "error", "message": "Statut manquant"}

    db.execute(text("""
        UPDATE incidents SET statut = :statut WHERE id = :id
    """), {"statut": nouveau_statut, "id": incident_id})
    db.commit()
    return {"status": "ok", "message": f"Statut mis a jour : {nouveau_statut}"}

@router.delete("/{incident_id}")
def delete_incident(incident_id: str, db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM incidents WHERE id = :id"), {"id": incident_id})
    db.commit()
    return {"status": "ok", "message": "Incident supprime"}