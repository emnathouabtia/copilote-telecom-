from fastapi import APIRouter, Depends
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
            i.titre,
            i.description,
            i.priorite,
            i.statut,
            i.categorie,
            i.cree_le,
            i.resolu_le,
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

    query += " ORDER BY i.cree_le DESC LIMIT :limit"
    params["limit"] = limit

    result = db.execute(text(query), params).fetchall()

    return {
        "status": "ok",
        "count": len(result),
        "data": [dict(row._mapping) for row in result]
    }