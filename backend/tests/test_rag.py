"""Tests du pipeline RAG (LangChain).

Ils utilisent une petite base ChromaDB temporaire (3 fiches), créée pendant le test,
et un faux LLM : pas besoin de la base du dépôt ni de l'API Groq.
"""
import pytest
from langchain_chroma import Chroma

from app.rag import pipeline

FICHES = [
    (
        "Symptôme : charge CPU élevée sur un routeur, utilisation du processeur "
        "supérieure à 90 %\nCause probable : processus gourmand ou trafic anormal\n"
        "Action N1 : vérifier les processus en cours",
        {"code_fiche": "F001", "type_alerte": "CPU_HIGH", "symptome": "CPU élevé"},
    ),
    (
        "Symptôme : lien micro-onde indisponible, perte de liaison entre deux sites\n"
        "Cause probable : désalignement d'antenne ou coupure d'alimentation\n"
        "Action N1 : vérifier l'alignement des antennes et l'alimentation",
        {"code_fiche": "F002", "type_alerte": "LINK_DOWN", "symptome": "Lien indisponible"},
    ),
    (
        "Symptôme : disque saturé sur un serveur, espace libre insuffisant\n"
        "Cause probable : journaux volumineux\nAction N1 : purger les anciens journaux",
        {"code_fiche": "F003", "type_alerte": "DISK_FULL", "symptome": "Disque saturé"},
    ),
]


class FakeChain:
    def invoke(self, inputs):
        assert "context" in inputs and "question" in inputs
        return "réponse de test"


@pytest.fixture(scope="module")
def embeddings():
    return pipeline.MiniLMEmbeddings()


@pytest.fixture
def small_store(tmp_path, monkeypatch, embeddings):
    store = Chroma(
        collection_name="test_fiches",
        persist_directory=str(tmp_path),
        embedding_function=embeddings,
    )
    store.add_texts(
        texts=[texte for texte, _ in FICHES],
        metadatas=[meta for _, meta in FICHES],
    )
    monkeypatch.setattr(pipeline, "vectorstore", store)
    return store


def test_retrieve_finds_the_right_fiche(small_store):
    docs = pipeline.retrieve("Le processeur du routeur est à 95 %, que faire ?", k=3)
    assert len(docs) == 3
    assert docs[0].metadata["code_fiche"] == "F001"


def test_ask_copilote_structure(small_store, monkeypatch):
    monkeypatch.setattr(pipeline, "get_answer_chain", lambda: FakeChain())
    result = pipeline.ask_copilote("Lien micro-onde indisponible, que faire ?")
    assert result["response"] == "réponse de test"
    assert result["context_used"] is True
    assert result["sources"] and result["sources"][0]["code_fiche"]
    assert "LangChain" in result["source"]