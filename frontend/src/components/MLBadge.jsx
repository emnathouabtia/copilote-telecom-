const LABEL_CLASS = {
  ANOMALIE: "badge-P1_CRITIQUE",
  SUSPECT: "badge-P2_HAUTE",
  NORMAL: "badge-P4_BASSE",
};

/**
 * Petit badge à côté d'une ligne d'incident, affichant le résultat
 * du modèle ML (IsolationForest) : ANOMALIE / SUSPECT / NORMAL.
 * `result` = objet renvoyé par predictAnomaly(), ou null pendant le chargement.
 */
export default function MLBadge({ result, loading }) {
  if (loading) {
    return <span className="badge badge-P4_BASSE" style={{ opacity: 0.6 }}>ML…</span>;
  }
  if (!result || result.status !== "ok") {
    return <span className="badge badge-P4_BASSE" style={{ opacity: 0.4 }}>ML n/d</span>;
  }

  // NOTE : le champ `label` renvoyé par le backend utilise un seuil (-0.3) mal
  // calibré par rapport à l'échelle réelle du modèle (scores ~±0.05), ce qui le
  // rend peu fiable (voir score_anomalie / label contradictoires en pratique).
  // On se fie donc au booléen `anomaly`, basé directement sur model.predict(),
  // qui lui reste correct. À retirer une fois predict.py corrigé côté Emna.
  const displayLabel = result.anomaly ? "ANOMALIE" : "NORMAL";
  const badgeClass = result.anomaly ? "badge-P1_CRITIQUE" : "badge-P4_BASSE";

  return (
    <span className={`badge ${badgeClass}`} title={`score ${result.score}`}>
      {displayLabel}
    </span>
  );
}