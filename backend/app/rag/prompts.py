"""
backend/app/rag/prompts.py

Contient les templates de texte envoyés au LLM (Groq/Ollama). Ce fichier ne
fait aucun appel réseau lui-même — il construit juste les chaînes de
caractères. C'est `pipeline.py` (Emna) qui appelle `build_prompt()` avec les
fiches trouvées par ChromaDB, puis passe le résultat à `llm.py`.
"""

SYSTEM_PROMPT = """Tu es le copilote intelligent de supervision télécom de SOTETEL.

Ton rôle : aider l'opérateur du centre de supervision (NOC) à comprendre un
incident et à savoir quoi faire, en te basant UNIQUEMENT sur les informations
fournies ci-dessous (l'incident et les fiches de la base de connaissances).

Règles strictes :
- Ne jamais inventer de cause ou d'action qui ne figure pas dans le contexte fourni.
- Si le contexte ne permet pas de répondre avec certitude, dis-le clairement
  plutôt que de deviner.
- Réponds en français, de façon concise et actionnable (l'opérateur doit
  pouvoir agir immédiatement après avoir lu ta réponse).
- Structure ta réponse en 3 parties courtes : cause probable, action
  immédiate à faire, et niveau d'escalade si nécessaire.
"""


def format_incident(incident: dict) -> str:
    """Résumé texte d'un incident, à insérer dans le prompt."""
    return (
        f"- Référence : {incident.get('reference', 'N/A')}\n"
        f"- Titre : {incident.get('titre', 'N/A')}\n"
        f"- Catégorie : {incident.get('categorie', 'N/A')}\n"
        f"- Sévérité : {incident.get('severite', 'N/A')}\n"
        f"- Priorité : {incident.get('priorite', 'N/A')}\n"
        f"- Équipement : {incident.get('nom_equipement', 'N/A')} "
        f"({incident.get('code_equipement', 'N/A')})\n"
        f"- Site : {incident.get('nom_site', 'N/A')}"
    )


def format_fiches_contexte(fiches: list[dict]) -> str:
    """
    Formate les fiches renvoyées par la recherche ChromaDB.
    Chaque fiche doit être un dict avec les clés stockées dans les metadatas
    par ingest.py : code_fiche, categorie, action_n1, action_n2,
    niveau_escalade, prevention (+ éventuellement un score de similarité).
    """
    if not fiches:
        return "Aucune fiche pertinente trouvée dans la base de connaissances."

    blocs = []
    for i, fiche in enumerate(fiches, start=1):
        bloc = (
            f"Fiche {i} ({fiche.get('code_fiche', 'N/A')} — "
            f"{fiche.get('categorie', 'N/A')}) :\n"
            f"  Action N1 : {fiche.get('action_n1', 'N/A')}\n"
        )
        if fiche.get("action_n2"):
            bloc += f"  Action N2 (si N1 insuffisant) : {fiche['action_n2']}\n"
        bloc += f"  Niveau d'escalade habituel : {fiche.get('niveau_escalade', 'N/A')}\n"
        if fiche.get("prevention"):
            bloc += f"  Prévention : {fiche['prevention']}\n"
        blocs.append(bloc)

    return "\n".join(blocs)


def build_prompt(incident: dict, fiches_contexte: list[dict], question: str) -> dict:
    """
    Assemble le prompt complet à envoyer au LLM.

    Retourne un dict {"system": ..., "user": ...} — à `pipeline.py` de le
    transformer dans le format attendu par l'API du LLM choisi (Groq/Ollama).
    """
    user_prompt = f"""Voici l'incident en cours :
{format_incident(incident)}

Voici les fiches de la base de connaissances les plus proches trouvées par le
système de recherche :
{format_fiches_contexte(fiches_contexte)}

Question de l'opérateur : {question}

Réponds en te basant uniquement sur ce qui précède."""

    return {"system": SYSTEM_PROMPT, "user": user_prompt}