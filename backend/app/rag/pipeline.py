import chromadb
from sentence_transformers import SentenceTransformer
from app.services.llm import generate_response

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection("base_connaissances")
encoder = SentenceTransformer('all-MiniLM-L6-v2')

def search_knowledge_base(question: str, n_results: int = 3) -> str:
    embedding = encoder.encode(question).tolist()
    
    count = collection.count()
    if count == 0:
        return ""
    
    results = collection.query(
        query_embeddings=[embedding],
        n_results=min(n_results, count)
    )
    
    if not results['documents'][0]:
        return ""
    
    context = "\n\n---\n\n".join(results['documents'][0])
    return context

def ask_copilote(question: str) -> dict:
    context = search_knowledge_base(question)
    response = generate_response(question, context)
    
    return {
        "question": question,
        "response": response,
        "context_used": bool(context),
        "source": "RAG + Groq llama-3.3-70b"
    }