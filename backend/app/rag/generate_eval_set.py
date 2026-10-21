"""Génère un brouillon de jeu de test pour évaluer le retrieval.

Pour chaque fiche de la base de connaissances, le LLM écrit des questions telles
qu'un opérateur les poserait, avec des mots différents de ceux de la fiche.
IMPORTANT : relis et corrige le fichier produit à la main avant de l'utiliser.

Usage (depuis backend/) :
    python -m app.rag.generate_eval_set --csv ../docs/05_base_connaissances.csv
"""
import argparse
import json
import os
import re
import time

import pandas as pd
from langchain_groq import ChatGroq

PROMPT = """Tu aides à construire un jeu de test pour un assistant de supervision télécom.
Voici une fiche de procédure :

Symptôme : {symptome}
Cause probable : {cause}
Type d'alerte : {type_alerte}

Écris {n} questions différentes qu'un opérateur de NOC poserait face à ce problème,
en situation réelle. Utilise des formulations variées, évite de recopier les mots du
symptôme, ne cite jamais le code de la fiche. Réponds UNIQUEMENT par un tableau JSON
de chaînes de caractères."""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", default="../docs/05_base_connaissances.csv")
    parser.add_argument("--out", default="app/rag/eval_questions.json")
    parser.add_argument("--per-fiche", type=int, default=2)
    args = parser.parse_args()

    llm = ChatGroq(
        model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
        temperature=0.7,
        api_key=os.getenv("GROQ_API_KEY"),
    )
    df = pd.read_csv(args.csv, delimiter=";", encoding="utf-8-sig")

    items = []
    for _, row in df.iterrows():
        prompt = PROMPT.format(
            symptome=row.get("symptome", ""),
            cause=row.get("cause_probable", ""),
            type_alerte=row.get("type_alerte", ""),
            n=args.per_fiche,
        )
        raw = llm.invoke(prompt).content
        match = re.search(r"\[.*\]", raw, re.S)
        if not match:
            print(f"Réponse inexploitable pour {row.get('code_fiche')}, ignorée")
            continue
        for question in json.loads(match.group(0)):
            items.append(
                {
                    "question": question,
                    "expected_code_fiche": str(row.get("code_fiche", "")),
                    "expected_type_alerte": str(row.get("type_alerte", "")),
                }
            )
        time.sleep(1)  # limite de débit de l'API

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"{len(items)} questions écrites dans {args.out} : à relire à la main.")


if __name__ == "__main__":
    main()
