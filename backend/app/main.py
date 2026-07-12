from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

#from app.routes.dashboard import router as dashboard_router
from app.routes.incidents import router as incidents_router

app = FastAPI(title="Copilote supervision télécom - API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

#app.include_router(dashboard_router)
app.include_router(incidents_router)


@app.get("/health")
def health():
    return {"status": "ok"}
