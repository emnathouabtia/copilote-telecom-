"""Reconstruit la base ChromaDB des fiches de procédure à partir du CSV.

Remplace l'ancien script d'indexation : le chemin du CSV est un argument
(plus de chemin Windows en dur) et la base est écrite avec la version de chromadb
installée dans l'environnement.

Usage (depuis backend/) :
    python -m app.rag.rebuild_index --csv ../docs/05_base_connaissances.csv
"""
import argparse

import pandas as pd

from app.rag.pipeline import vectorstore


def val(row, key: str) -> str:
    value = row.get(key, "")
    return "" if pd.isna(value) else str(value)


def build_text(row) -> str:
    return (
        f"Symptôme : {val(row, 'symptome')}\n"
        f"Cause probable : {val(row, 'cause_probable')}\n"
        f"Action N1 : {val(row, 'action_n1')}\n"
        f"Action N2 : {val(row, 'action_n2')}\n"
        f"Type alerte : {val(row, 'type_alerte')}"
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", default="../docs/05_base_connaissances.csv")
    args = parser.parse_args()

    df = pd.read_csv(args.csv, delimiter=";", encoding="utf-8-sig")
    print(f"Chargement de {len(df)} fiches...")

    vectorstore.add_texts(
        texts=[build_text(row) for _, row in df.iterrows()],
        metadatas=[
            {
                "code_fiche": val(row, "code_fiche"),
                "type_alerte": val(row, "type_alerte"),
                "symptome": val(row, "symptome"),
            }
            for _, row in df.iterrows()
        ],
        ids=[str(i) for i in range(len(df))],
    )
    print(f"Base RAG : {len(df)} fiches vectorisées")


if __name__ == "__main__":
    main()