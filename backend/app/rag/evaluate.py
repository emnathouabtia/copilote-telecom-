"""Évalue la qualité du retrieval du copilote RAG.

Pour chaque question du jeu de test, on regarde si la bonne fiche
(expected_code_fiche) est retrouvée parmi les k premières :
  - hit@1 : la bonne fiche est en première position
  - hit@3 : la bonne fiche est dans le top-3 (ce que reçoit le LLM)
  - MRR   : moyenne de 1/rang de la bonne fiche (0 si absente)

Usage (depuis backend/) :
    python -m app.rag.evaluate
    python -m app.rag.evaluate --mlflow     # enregistre aussi les métriques dans MLflow
"""
import argparse
import json

from app.rag.pipeline import TOP_K, retrieve


def evaluate(questions: list[dict], k: int = TOP_K) -> dict:
    hit1 = hit_k = 0
    rr_sum = 0.0
    failures = []

    for item in questions:
        docs = retrieve(item["question"], k=k)
        codes = [d.metadata.get("code_fiche", "") for d in docs]
        expected = item["expected_code_fiche"]

        if expected in codes:
            rank = codes.index(expected) + 1
            hit_k += 1
            rr_sum += 1 / rank
            if rank == 1:
                hit1 += 1
        else:
            failures.append(
                {"question": item["question"], "attendu": expected, "obtenu": codes}
            )

    n = len(questions)
    return {
        "n_questions": n,
        "hit_at_1": hit1 / n,
        f"hit_at_{k}": hit_k / n,
        "mrr": rr_sum / n,
        "failures": failures,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--questions", default="app/rag/eval_questions.json")
    parser.add_argument("--out", default="app/rag/eval_results.json")
    parser.add_argument("--mlflow", action="store_true")
    args = parser.parse_args()

    with open(args.questions, encoding="utf-8") as f:
        questions = json.load(f)

    results = evaluate(questions)
    print(f"Questions : {results['n_questions']}")
    print(f"hit@1     : {results['hit_at_1']:.1%}")
    print(f"hit@{TOP_K}     : {results[f'hit_at_{TOP_K}']:.1%}")
    print(f"MRR       : {results['mrr']:.3f}")
    print(f"Échecs    : {len(results['failures'])}")
    for fail in results["failures"][:10]:
        print(f"  - {fail['question']!r} -> attendu {fail['attendu']}, obtenu {fail['obtenu']}")

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    if args.mlflow:
        import mlflow

        mlflow.set_experiment("copilote-rag-evaluation")
        with mlflow.start_run(run_name="rag_langchain_retrieval"):
            mlflow.log_param("top_k", TOP_K)
            mlflow.log_param("embedding_model", "all-MiniLM-L6-v2")
            mlflow.log_metric("hit_at_1", results["hit_at_1"])
            mlflow.log_metric(f"hit_at_{TOP_K}", results[f"hit_at_{TOP_K}"])
            mlflow.log_metric("mrr", results["mrr"])
            mlflow.log_artifact(args.out)


if __name__ == "__main__":
    main()
