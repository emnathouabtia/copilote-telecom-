from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import json
import asyncio
from datetime import datetime

load_dotenv()

app = FastAPI(
    title="Copilote Supervision Télécom",
    description="API de supervision télécom intelligente — SOTETEL",
    version="1.0.0"
)

# CORS — permet au frontend React de communiquer avec l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gestionnaire WebSocket — liste des clients connectés
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_text(json.dumps(message))

manager = ConnectionManager()
from app.routes.alerts import router as alerts_router
app.include_router(alerts_router)
# ── ROUTES DE BASE ──
from app.routes.incidents import router as incidents_router
app.include_router(incidents_router)
from app.routes.dashboard import router as dashboard_router
app.include_router(dashboard_router)
from app.routes.predict import router as predict_router
app.include_router(predict_router)

@app.get("/")
def root():
    return {
        "projet": "Copilote Supervision Télécom",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# ── WEBSOCKET ──

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast({"message": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ── ALERTES ──

@app.get("/alerts")
def get_alerts():
    return {
        "status": "ok",
        "data": [],
        "message": "Route alertes — à connecter à PostgreSQL"
    }

@app.post("/alerts")
async def create_alert(alert: dict):
    # Diffuser l'alerte en temps réel via WebSocket
    await manager.broadcast({
        "type": "new_alert",
        "data": alert,
        "timestamp": datetime.now().isoformat()
    })
    return {"status": "ok", "message": "Alerte reçue et diffusée"}

# ── INCIDENTS ──

@app.get("/incidents")
def get_incidents():
    return {
        "status": "ok",
        "data": [],
        "message": "Route incidents — à connecter à PostgreSQL"
    }

# ── DASHBOARD KPI ──

@app.get("/dashboard/kpi")
def get_kpi():
    return {
        "status": "ok",
        "data": {
            "alertes_actives": 0,
            "critiques": 0,
            "resolus_24h": 0,
            "mttr_minutes": 0,
            "disponibilite": 99.9
        }
    }

# ── PREDICT (placeholder ML) ──

@app.post("/predict")
def predict(data: dict):
    return {
        "status": "ok",
        "severite": "MAJEURE",
        "score": 0.75,
        "message": "Modèle ML — à brancher en Phase 3"
    }

# ── CHAT (placeholder LLM) ──

@app.post("/chat")
def chat(data: dict):
    return {
        "status": "ok",
        "response": "Copilote LLM — à brancher en Phase 4",
        "source": "placeholder"
    }