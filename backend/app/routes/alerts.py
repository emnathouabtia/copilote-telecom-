from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.database import get_db
from typing import Optional

router = APIRouter(prefix="/alerts", tags=["Alertes"])

@router.get("/")
def get_alerts(
    severite: Optional[str] = None,
    statut: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = """
        SELECT 
            a.id,
            a.type_alerte,
            a.severite,
            a.statut,
            a.valeur_mesuree,
            a.seuil,
            a.unite,
            a.message,
            a.metrique,
            a.date_alerte,
            a.cree_le,
            e.nom_equipement,
            e.code_equipement,
            s.nom_site
        FROM alertes a
        LEFT JOIN equipements e ON a.equipement_id = e.id
        LEFT JOIN sites s ON a.site_id = s.id
        WHERE 1=1
    """
    params = {}

    if severite:
        query += " AND a.severite = :severite"
        params["severite"] = severite

    if statut:
        query += " AND a.statut = :statut"
        params["statut"] = statut

    query += " ORDER BY a.date_alerte DESC LIMIT :limit"
    params["limit"] = limit

    result = db.execute(text(query), params).fetchall()

    return {
        "status": "ok",
        "count": len(result),
        "data": [dict(row._mapping) for row in result]
    }

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    stats = db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE statut NOT IN ('CONVERTIE_INCIDENT', 'IGNOREE')) as alertes_actives,
            COUNT(*) FILTER (WHERE severite = 'CRITIQUE' AND statut NOT IN ('CONVERTIE_INCIDENT', 'IGNOREE')) as critiques,
            COUNT(*) FILTER (WHERE statut = 'CONVERTIE_INCIDENT' 
                AND cree_le >= NOW() - INTERVAL '24 hours') as resolus_24h
        FROM alertes
    """)).fetchone()

    return {
        "status": "ok",
        "data": dict(stats._mapping)
    }
@router.post("/")
async def create_alert(alert: dict, db: Session = Depends(get_db)):
    # Fix: Use consistent status values
    # If your enum uses 'NOUVELLE' for new alerts, that's fine, 
    # but make sure it matches what's in your enum definition
    db.execute(text("""
        INSERT INTO alertes (
            type_alerte, severite, message,
            valeur_mesuree, seuil, unite,
            metrique, statut
        ) VALUES (
            :type_alerte, :severite, :message,
            :valeur_mesuree, :seuil, :unite,
            :metrique, :statut
        )
    """), alert)
    db.commit()
    return {"status": "ok", "message": "Alerte créée"}