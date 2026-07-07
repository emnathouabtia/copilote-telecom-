"""
Routes du dashboard - chaque endpoint appelle directement une vue SQL déjà
définie dans 01_schema_postgresql.sql (v_dashboard_incidents, etc.) ou une
requête équivalente à celles de 07_requetes_dashboard.sql.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.db import fetch_all, fetch_one

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis")
def get_kpis():
    """Cartes KPI en haut du dashboard : total, ouverts, résolus, P1, P2, score moyen."""
    return fetch_one("SELECT * FROM v_dashboard_incidents")


@router.get("/categories")
def get_categories():
    """Répartition des incidents par catégorie, pour le graphe en barres."""
    return fetch_all("SELECT * FROM v_incidents_par_categorie")


@router.get("/severites")
def get_severites():
    """Répartition des alertes par sévérité."""
    return fetch_all("SELECT * FROM v_alertes_par_severite")


@router.get("/top-sites")
def get_top_sites(limit: int = 10):
    """Top des sites/équipements les plus instables."""
    return fetch_all("SELECT * FROM v_top_sites_instables LIMIT %s", (limit,))


@router.get("/incidents")
def get_incidents_prioritaires(limit: int = 50):
    """File priorisée des incidents ouverts, triée par score décroissant -
    c'est la liste de travail principale de l'opérateur."""
    return fetch_all(
        """
        SELECT reference, date_creation, titre, categorie, severite,
               priorite, score_criticite, statut, cause_probable, action_recommandee
        FROM incidents
        WHERE statut IN ('OUVERT', 'EN_COURS', 'ESCALADE')
        ORDER BY score_criticite DESC, date_creation ASC
        LIMIT %s
        """,
        (limit,),
    )


@router.get("/incidents/{reference}")
def get_incident_detail(reference: str):
    """Fiche détail d'un incident (ouverte quand l'opérateur clique une ligne)."""
    incident = fetch_one("SELECT * FROM incidents WHERE reference = %s", (reference,))
    if incident:
        incident["historique"] = fetch_all(
            "SELECT * FROM historique_incidents WHERE incident_id = %s ORDER BY date_action DESC",
            (incident["id"],),
        )
    return incident


# --- Temps réel -----------------------------------------------------------
# Le frontend ouvre une connexion WebSocket au chargement du dashboard.
# Chaque fois que rules_engine.py crée un nouvel incident, il suffit d'appeler
# `await manager.broadcast(...)` (ex. via une file Redis pub/sub en production)
# pour pousser l'événement à tous les clients connectés, sans qu'ils aient à
# recharger la page ou repoller l'API.

class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, message: dict):
        for ws in list(self.active):
            await ws.send_json(message)


manager = ConnectionManager()


@router.websocket("/ws")
async def dashboard_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # garde la connexion ouverte
    except WebSocketDisconnect:
        manager.disconnect(websocket)
