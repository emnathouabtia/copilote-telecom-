"""
backend/app/rag/ingest.py

Lit toutes les fiches de `base_connaissances` (17 après les 9 nouvelles),
les transforme en embeddings, et les stocke dans ChromaDB pour que le RAG
puisse retrouver la fiche la plus pertinente face à une question de l'opérateur.

Modèle d'embeddings utilisé : sentence-transformers (local, léger, tourne
sur CPU) — téléchargé une seule fois au premier lancement, aucune donnée
envoyée sur internet ensuite. Choix cohérent avec la contrainte du cahier
des charges d'éviter une IA générative connectée en continu à internet.

Usage :
    python ingest.py
"""
import psycopg2
import psycopg2.extras
import chromadb
from sentence_transformers import SentenceTransformer

DB_DSN = "dbname=copilote_supervision user=origin password=origin host=localhost port=5432"
CHROMA_PATH = "./chroma_data"
COLLECTION_NAME = "base_connaissances"
EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"  # supporte le français


def load_fiches():
    conn = psycopg2.connect(DB_DSN, cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, code_fiche, categorie, symptome, cause_probable,
               action_n1, action_n2, niveau_escalade, prevention
        FROM base_connaissances
        WHERE actif = TRUE
        """
    )
    fiches = cur.fetchall()
    cur.close()
    conn.close()
    return fiches


def build_document(fiche) -> str:
    """Texte complet de la fiche, ce sur quoi la similarité sémantique sera calculée."""
    return (
        f"Symptôme : {fiche['symptome']}. "
        f"Cause probable : {fiche['cause_probable']} "
        f"Action recommandée : {fiche['action_n1']}"
    )


def ingest():
    print("Chargement des fiches depuis PostgreSQL...")
    fiches = load_fiches()
    print(f"{len(fiches)} fiches actives trouvées.")

    print(f"Chargement du modèle d'embeddings ({EMBEDDING_MODEL})...")
    model = SentenceTransformer(EMBEDDING_MODEL)

    client = chromadb.PersistentClient(path=CHROMA_PATH)
    # Repart d'une collection propre à chaque ingestion complète, pour éviter
    # les doublons si une fiche a été modifiée entre deux exécutions.
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collection = client.create_collection(COLLECTION_NAME)

    documents = [build_document(f) for f in fiches]
    embeddings = model.encode(documents, show_progress_bar=True).tolist()

    collection.add(
        ids=[str(f["id"]) for f in fiches],
        embeddings=embeddings,
        documents=documents,
        metadatas=[
            {
                "code_fiche": f["code_fiche"],
                "categorie": f["categorie"],
                "action_n1": f["action_n1"],
                "action_n2": f["action_n2"] or "",
                "niveau_escalade": f["niveau_escalade"],
                "prevention": f["prevention"] or "",
            }
            for f in fiches
        ],
    )

    print(f"{len(fiches)} fiches vectorisées et stockées dans ChromaDB ({CHROMA_PATH}).")


if __name__ == "__main__":
    ingest()