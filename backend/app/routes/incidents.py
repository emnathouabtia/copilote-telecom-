"""
Routes de gestion des incidents : liste filtrable, détail, changement de statut,
assignation à un technicien. Complète routes/dashboard.py (Emna) qui, lui,
n'expose que les vues agrégées en lecture seule pour le dashboard.
"""
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.models.incident import IncidentUpdate
from app.services.db import fetch_all, fetch_one, get_connection

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("")
def list_incidents(statut: Optional[str] = None, priorite: Optional[str] = None, limit: int = 100):
    """Liste des incidents, filtrable par statut et priorité."""
    query = "SELECT * FROM incidents WHERE 1=1"
    params = []
    if statut:
        query += " AND statut = %s"
        params.append(statut)
    if priorite:
        query += " AND priorite = %s"
        params.append(priorite)
    query += " ORDER BY score_criticite DESC, date_creation ASC LIMIT %s"
    params.append(limit)
    return fetch_all(query, tuple(params))


@router.get("/{reference}")
def get_incident(reference: str):
    incident = fetch_one("SELECT * FROM incidents WHERE reference = %s", (reference,))
    if not incident:
        raise HTTPException(status_code=404, detail="Incident introuvable")
    incident["historique"] = fetch_all(
        "SELECT * FROM historique_incidents WHERE incident_id = %s ORDER BY date_action DESC",
        (incident["id"],),
    )
    return incident


@router.patch("/{reference}")
def update_incident(reference: str, payload: IncidentUpdate):
    incident = fetch_one("SELECT id, statut FROM incidents WHERE reference = %s", (reference,))
    if not incident:
        raise HTTPException(status_code=404, detail="Incident introuvable")

    fields, values = [], []
    for field, value in payload.model_dump(exclude_unset=True).items():
        fields.append(f"{field} = %s")
        values.append(value)

    if not fields:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")

    values.append(incident["id"])
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE incidents SET {', '.join(fields)} WHERE id = %s", tuple(values))
            if "statut" in payload.model_dump(exclude_unset=True):
                cur.execute(
                    """
                    INSERT INTO historique_incidents (incident_id, action, ancien_statut, nouveau_statut)
                    VALUES (%s, 'CHANGEMENT_STATUT', %s, %s)
                    """,
                    (incident["id"], incident["statut"], payload.statut),
                )
        conn.commit()
    finally:
        conn.close()

    return fetch_one("SELECT * FROM incidents WHERE reference = %s", (reference,))


@router.post("/{reference}/escalade")
def escalade_incident(reference: str, commentaire: Optional[str] = None):
    """Raccourci pratique : passe l'incident en statut ESCALADE."""
    return update_incident(reference, IncidentUpdate(statut="ESCALADE"))
