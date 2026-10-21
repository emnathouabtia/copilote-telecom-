"""Pipeline RAG du copilote de supervision (version LangChain).

Réutilise l'index ChromaDB existant (collection "base_connaissances") et le même
modèle d'embeddings (all-MiniLM-L6-v2) que le script d'indexation : aucune
ré-indexation n'est nécessaire.
"""
import os
from functools import lru_cache

from langchain_chroma import Chroma
from langchain_core.embeddings import Embeddings
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from sentence_transformers import SentenceTransformer

CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")
COLLECTION_NAME = "base_connaissances"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
TOP_K = 3


class MiniLMEmbeddings(Embeddings):
    """Adaptateur LangChain autour de sentence-transformers.

    Même appel encode() que dans ingest.py : les vecteurs sont identiques à ceux
    déjà stockés dans ChromaDB.
    """

    def __init__(self, model_name: str = EMBEDDING_MODEL):
        self._model = SentenceTransformer(model_name)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._model.encode(texts).tolist()

    def embed_query(self, text: str) -> list[float]:
        return self._model.encode(text).tolist()


vectorstore = Chroma(
    collection_name=COLLECTION_NAME,
    persist_directory=CHROMA_PATH,
    embedding_function=MiniLMEmbeddings(),
)

PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Tu es le copilote de supervision télécom de SOTETEL et tu assistes les "
            "opérateurs du NOC. Réponds en français, de façon concise, UNIQUEMENT à "
            "partir des fiches de procédure fournies. Si les fiches ne couvrent pas la "
            "question, dis-le clairement et n'invente aucune procédure. Structure la "
            "réponse : cause probable, actions N1, puis actions N2 si pertinent.",
        ),
        (
            "human",
            "Fiches de procédure :\n{context}\n\nQuestion de l'opérateur : {question}",
        ),
    ]
)


@lru_cache(maxsize=1)
def get_answer_chain():
    """Chaîne prompt -> LLM Groq -> texte (créée à la première utilisation)."""
    llm = ChatGroq(
        model=GROQ_MODEL,
        temperature=0.2,
        api_key=os.getenv("GROQ_API_KEY"),
    )
    return PROMPT | llm | StrOutputParser()


def retrieve(question: str, k: int = TOP_K):
    """Retourne les k fiches les plus proches (objets Document LangChain)."""
    return vectorstore.similarity_search(question, k=k)


def format_docs(docs) -> str:
    return "\n\n---\n\n".join(doc.page_content for doc in docs)


def search_knowledge_base(question: str, n_results: int = TOP_K) -> str:
    """Compatibilité avec l'ancienne version : retourne le contexte en texte."""
    return format_docs(retrieve(question, k=n_results))


def ask_copilote(question: str) -> dict:
    docs = retrieve(question)
    context = format_docs(docs)
    response = get_answer_chain().invoke({"context": context, "question": question})

    return {
        "question": question,
        "response": response,
        "context_used": bool(docs),
        "sources": [
            {
                "code_fiche": d.metadata.get("code_fiche", ""),
                "type_alerte": d.metadata.get("type_alerte", ""),
                "symptome": d.metadata.get("symptome", ""),
            }
            for d in docs
        ],
        "source": f"RAG (LangChain) + Groq {GROQ_MODEL}",
    }
