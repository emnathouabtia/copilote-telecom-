import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# ── TESTS ROUTES DE BASE ──

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

# ── TESTS ALERTES ──

def test_get_alerts():
    response = client.get("/alerts/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "data" in data

def test_get_alerts_stats():
    response = client.get("/alerts/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

# ── TESTS INCIDENTS ──

def test_get_incidents():
    response = client.get("/incidents/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "data" in data

def test_get_incidents_filter_statut():
    response = client.get("/incidents/?statut=OUVERT")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

# ── TESTS DASHBOARD ──

def test_dashboard_kpi():
    response = client.get("/dashboard/kpi")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "alertes_actives" in data["data"]

def test_dashboard_alertes_par_heure():
    response = client.get("/dashboard/alertes-par-heure")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

# ── TESTS ML ──

def test_predict_health():
    response = client.get("/predict/health")
    assert response.status_code == 200
    assert response.json()["model_loaded"] == True

def test_predict_normal():
    response = client.post("/predict/", json={
        "type_alerte": "CPU_HIGH",
        "severite": "MINEURE",
        "valeur_mesuree": 45,
        "seuil": 85,
        "equipement": "TUN-RTR-CORE-01",
        "heure": 10,
        "jour_semaine": 2
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "label" in data
    assert data["label"] in ["NORMAL", "SUSPECT", "ANOMALIE"]

def test_predict_critique():
    response = client.post("/predict/", json={
        "type_alerte": "LINK_DOWN",
        "severite": "CRITIQUE",
        "valeur_mesuree": 0,
        "seuil": 1,
        "equipement": "BIZ-ENB-022",
        "heure": 3,
        "jour_semaine": 6
    })
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

# ── TESTS AUTH ──

def test_login_success():
    response = client.post("/auth/login", json={
        "email": "emna.thouabtia@enicar.ucar.tn",
        "password": "emna123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "user" in data
    assert data["user"]["role"] == "SUPERVISEUR"

def test_login_wrong_password():
    response = client.post("/auth/login", json={
        "email": "emna.thouabtia@enicar.ucar.tn",
        "password": "mauvais_mot_de_passe"
    })
    assert response.status_code == 200
    assert response.json()["status"] == "error"

def test_login_unknown_user():
    response = client.post("/auth/login", json={
        "email": "inconnu@test.tn",
        "password": "test123"
    })
    assert response.status_code == 200
    assert response.json()["status"] == "error"

def test_get_users():
    response = client.get("/auth/users")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "data" in data

# ── TESTS CHAT ──

def test_chat_missing_question():
    response = client.post("/chat/", json={})
    assert response.status_code == 200
    assert response.json()["status"] == "error"

def test_chat_health():
    response = client.get("/chat/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"