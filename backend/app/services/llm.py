from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """Tu es un copilote intelligent de supervision télécom pour SOTETEL Tunisie.
Tu aides les opérateurs NOC à diagnostiquer et résoudre les incidents réseau.
Tu réponds toujours en français, de manière concise et actionnable.
Tu bases tes réponses sur les informations fournies dans le contexte.
Si tu ne sais pas, dis-le clairement."""

def generate_response(question: str, context: str = "") -> str:
    messages = []
    
    if context:
        messages.append({
            "role": "system",
            "content": f"{SYSTEM_PROMPT}\n\nContexte des incidents similaires :\n{context}"
        })
    else:
        messages.append({
            "role": "system", 
            "content": SYSTEM_PROMPT
        })
    
    messages.append({
        "role": "user",
        "content": question
    })
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=500,
        temperature=0.3
    )
    
    return response.choices[0].message.content