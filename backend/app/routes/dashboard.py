from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# ── KPI principal (Emna) ──
@router.get("/kpi")
def get_kpi(db: Session = Depends(get_db)):
    alertes = db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE statut NOT IN ('CONVERTIE_INCIDENT', 'IGNOREE')) as alertes_actives,
            COUNT(*) FILTER (WHERE severite = 'CRITIQUE' AND statut NOT IN ('CONVERTIE_INCIDENT', 'IGNOREE')) as critiques,
            COUNT(*) FILTER (WHERE severite = 'MAJEURE' AND statut NOT IN ('CONVERTIE_INCIDENT', 'IGNOREE')) as majeures,
            COUNT(*) FILTER (WHERE severite = 'MINEURE' AND statut NOT IN ('CONVERTIE_INCIDENT', 'IGNOREE')) as mineures
        FROM alertes
    """)).fetchone()

    incidents = db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE statut = 'RESOLU'
                AND resolu_le >= NOW() - INTERVAL '24 hours') as resolus_24h,
            COUNT(*) FILTER (WHERE statut NOT IN ('RESOLU', 'FERME')) as incidents_actifs,
            ROUND(AVG(
                EXTRACT(EPOCH FROM (resolu_le - cree_le)) / 60
            ) FILTER (WHERE statut = 'RESOLU'), 0) as mttr_minutes
        FROM incidents
    """)).fetchone()

    equipements = db.execute(text("""
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE statut_operationnel = 'EN_SERVICE') as en_service
        FROM equipements
    """)).fetchone()

    alertes_data = dict(alertes._mapping)
    incidents_data = dict(incidents._mapping)
    equipements_data = dict(equipements._mapping)

    total_eq = equipements_data.get("total", 1) or 1
    en_service = equipements_data.get("en_service", 0) or 0
    disponibilite = round((en_service / total_eq) * 100, 1)

    return {
        "status": "ok",
        "data": {
            "alertes_actives": alertes_data.get("alertes_actives", 0),
            "critiques": alertes_data.get("critiques", 0),
            "majeures": alertes_data.get("majeures", 0),
            "mineures": alertes_data.get("mineures", 0),
            "resolus_24h": incidents_data.get("resolus_24h", 0),
            "incidents_actifs": incidents_data.get("incidents_actifs", 0),
            "mttr_minutes": incidents_data.get("mttr_minutes", 0),
            "disponibilite": disponibilite
        }
    }

@router.get("/alertes-par-heure")
def get_alertes_par_heure(db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT
            DATE_TRUNC('hour', date_alerte) as heure,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE severite = 'CRITIQUE') as critiques
        FROM alertes
        WHERE date_alerte >= NOW() - INTERVAL '24 hours'
        GROUP BY DATE_TRUNC('hour', date_alerte)
        ORDER BY heure ASC
    """)).fetchall()

    return {
        "status": "ok",
        "data": [dict(row._mapping) for row in result]
    }

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT categorie, COUNT(*) as total
        FROM incidents
        GROUP BY categorie
        ORDER BY total DESC
    """)).fetchall()
    return {"status": "ok", "data": [dict(row._mapping) for row in result]}

@router.get("/top-sites")
def get_top_sites(limit: int = 10, db: Session = Depends(get_db)):
    result = db.execute(text("""
        SELECT s.nom_site, COUNT(a.id) as total_alertes
        FROM alertes a
        LEFT JOIN sites s ON a.site_id = s.id
        GROUP BY s.nom_site
        ORDER BY total_alertes DESC
        LIMIT :limit
    """), {"limit": limit}).fetchall()
    return {"status": "ok", "data": [dict(row._mapping) for row in result]}