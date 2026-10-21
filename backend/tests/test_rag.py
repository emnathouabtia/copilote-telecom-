"""Tests du pipeline RAG (LangChain). Le LLM est remplacé par un faux pour ne pas
appeler l'API Groq pendant les tests ; le retrieval utilise la vraie base ChromaDB."""
from app.rag import pipeline


class FakeChain:
    def invoke(self, inputs):
        assert "context" in inputs and "question" in inputs
        return "réponse de test"


def test_retrieve_returns_documents():
    docs = pipeline.retrieve("CPU élevé sur un routeur", k=3)
    assert 1 <= len(docs) <= 3


def test_ask_copilote_structure(monkeypatch):
    monkeypatch.setattr(pipeline, "get_answer_chain", lambda: FakeChain())
    result = pipeline.ask_copilote("Lien micro-onde indisponible, que faire ?")
    assert result["response"] == "réponse de test"
    assert result["context_used"] is True
    assert isinstance(result["sources"], list) and result["sources"]
    assert "LangChain" in result["source"]
