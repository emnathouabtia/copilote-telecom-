from fastapi import APIRouter
from app.rag.pipeline import ask_copilote

router = APIRouter(prefix="/chat", tags=["Copilote LLM"])

@router.post("/")
def chat(data: dict):
    question = data.get("question", "")
    if not question:
        return {"status": "error", "message": "Question manquante"}
    
    result = ask_copilote(question)
    return {"status": "ok", **result}

@router.get("/health")
def chat_health():
    return {"status": "ok", "service": "Groq LLM + ChromaDB RAG"}