/**
 * Carte KPI pour le haut du dashboard.
 * Usage : <KPICard label="Incidents critiques" value={7} tone="critical" />
 */
export default function KPICard({ label, value, tone = "neutral", suffix = "" }) {
  return (
    <div className={`kpi-card tone-${tone}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">
        {value}
        {suffix && <span style={{ fontSize: 16, marginLeft: 4, opacity: 0.7 }}>{suffix}</span>}
      </span>
    </div>
  );
}