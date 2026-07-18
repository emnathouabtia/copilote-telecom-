import chromadb
import pandas as pd
from sentence_transformers import SentenceTransformer
import os

# Initialisation ChromaDB
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection("base_connaissances")

# Modèle d'embeddings
encoder = SentenceTransformer('all-MiniLM-L6-v2')

def ingest_knowledge_base(csv_path: str):
    df = pd.read_csv(csv_path, delimiter=';', encoding='utf-8-sig')
    print(f"Chargement de {len(df)} fiches...")
    
    for i, row in df.iterrows():
        # Texte complet de la fiche
        text = f"""
        Symptôme : {row.get('symptome', '')}
        Cause probable : {row.get('cause_probable', '')}
        Action N1 : {row.get('action_n1', '')}
        Action N2 : {row.get('action_n2', '')}
        Type alerte : {row.get('type_alerte', '')}
        """
        
        embedding = encoder.encode(text).tolist()
        
        collection.upsert(
            ids=[str(i)],
            documents=[text],
            embeddings=[embedding],
            metadatas=[{
                "code_fiche": str(row.get('code_fiche', '')),
                "type_alerte": str(row.get('type_alerte', '')),
                "symptome": str(row.get('symptome', ''))
            }]
        )
    
    print(f"Base RAG : {collection.count()} fiches vectorisées ✅")

if __name__ == "__main__":
    csv_path = r"C:\Users\-PC-\Desktop\copilote-telecom-\docs\05_base_connaissances.csv"
    ingest_knowledge_base(csv_path)