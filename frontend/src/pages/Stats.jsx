import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

const C = {
  bg: "#000000", surface: "#0a0a0a", surface2: "#111111",
  border: "#1f1f1f", accent: "#3b82f6", danger: "#ef4444",
  warning: "#f59e0b", success: "#22c55e", purple: "#a78bfa",
  text: "#e5e5e5", muted: "#525252",
};

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#a78bfa", "#ec4899", "#06b6d4", "#84cc16"];

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: color }} />
      <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "32px", fontWeight: "700", color, lineHeight: 1 }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize: "11px", color: C.muted, marginTop: "6px" }}>{sub}</div>}
    </div>
  );
}

export default function Stats() {
  const [kpi, setKpi] = useState(null);
  const [alertes, setAlertes] = useState([]);
  const [alertesParHeure, setAlertesParHeure] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/dashboard/kpi")
      .then(r => r.json()).then(d => setKpi(d.data)).catch(() => {});
    fetch("http://localhost:8000/alerts/?limit=200")
      .then(r => r.json()).then(d => setAlertes(d.data || [])).catch(() => {});
    fetch("http://localhost:8000/dashboard/alertes-par-heure")
      .then(r => r.json()).then(d => setAlertesParHeure(
        (d.data || []).map(r => ({ h: new Date(r.heure).getHours() + "h", total: Number(r.total), critiques: Number(r.critiques) }))
      )).catch(() => {});
  }, []);

  // Répartition par sévérité
  const severiteData = alertes.reduce((acc, a) => {
    acc[a.severite] = (acc[a.severite] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(severiteData).map(([name, value]) => ({ name, value }));

  // Répartition par type
  const typeData = Object.entries(
    alertes.reduce((acc, a) => { acc[a.type_alerte] = (acc[a.type_alerte] || 0) + 1; return acc; }, {})
  ).map(([type, count]) => ({ type: type.replace("_", " "), count }))
   .sort((a, b) => b.count - a.count);

  // Répartition par statut
  const statutData = Object.entries(
    alertes.reduce((acc, a) => { acc[a.statut] = (acc[a.statut] || 0) + 1; return acc; }, {})
  ).map(([statut, count]) => ({ statut, count }));

  const totalAlertes = alertes.length;
  const tauxCritique = totalAlertes > 0 ? Math.round((severiteData["CRITIQUE"] || 0) / totalAlertes * 100) : 0;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: C.text }}>
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }`}</style>

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* TITRE */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: C.text }}>Statistiques & Rapports</div>
            <div style={{ fontSize: "12px", color: C.muted, marginTop: "2px" }}>Analyse des alertes et incidents — SOTETEL</div>
          </div>
          <div style={{ fontSize: "11px", color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "6px 12px" }}>
            {totalAlertes} alertes analysées
          </div>
        </div>

        {/* KPI STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
          <StatCard label="Total alertes" value={totalAlertes} color={C.accent} sub="dans la BDD" />
          <StatCard label="Taux critique" value={`${tauxCritique}%`} color={C.danger} sub="des alertes" />
          <StatCard label="MTTR moyen" value={kpi?.mttr_minutes ? `${kpi.mttr_minutes} min` : "—"} color={C.warning} sub="temps résolution" />
          <StatCard label="Disponibilité" value={kpi ? `${kpi.disponibilite}%` : "—"} color={C.success} sub="SLA réseau" />
        </div>

        {/* GRAPHES ROW 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

          {/* Pie chart sévérité */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px" }}>
            <div style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>
              Répartition par sévérité
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Line chart évolution */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px" }}>
            <div style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>
              Évolution alertes / heure
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={alertesParHeure}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" />
                <XAxis dataKey="h" tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} />
                <Tooltip contentStyle={{ background: "#111", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px", color: C.muted }} />
                <Line type="monotone" dataKey="total" stroke={C.accent} strokeWidth={2} dot={false} name="Total" />
                <Line type="monotone" dataKey="critiques" stroke={C.danger} strokeWidth={1.5} dot={false} name="Critiques" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPHES ROW 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>

          {/* Bar chart types */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px" }}>
            <div style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>
              Alertes par type
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" />
                <XAxis dataKey="type" tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} />
                <Tooltip contentStyle={{ background: "#111", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, fontSize: "12px" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Alertes">
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Statuts */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px" }}>
            <div style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>
              Statuts des alertes
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              {statutData.map((s, i) => {
                const pct = totalAlertes > 0 ? Math.round(s.count / totalAlertes * 100) : 0;
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: C.text }}>{s.statut}</span>
                      <span style={{ color: C.muted }}>{s.count} ({pct}%)</span>
                    </div>
                    <div style={{ height: "4px", background: C.border, borderRadius: "2px" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: "2px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RÉSUMÉ TEXTUEL */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "12px" }}>Analyse automatique</div>
          <div style={{ fontSize: "13px", color: C.muted, lineHeight: "1.8" }}>
            Le réseau SOTETEL présente <span style={{ color: C.text, fontWeight: "600" }}>{totalAlertes} alertes</span> dont{" "}
            <span style={{ color: C.danger, fontWeight: "600" }}>{severiteData["CRITIQUE"] || 0} critiques ({tauxCritique}%)</span>.{" "}
            {tauxCritique > 50
              ? "⚠️ Le taux d'alertes critiques est élevé — une intervention prioritaire est recommandée."
              : tauxCritique > 20
              ? "⚡ Le taux d'alertes critiques est modéré — une surveillance accrue est conseillée."
              : "✅ Le réseau est globalement stable avec un faible taux d'alertes critiques."
            }{" "}
            Le type d'alerte le plus fréquent est{" "}
            <span style={{ color: C.accent, fontWeight: "600" }}>{typeData[0]?.type || "—"}</span>{" "}
            avec <span style={{ color: C.text, fontWeight: "600" }}>{typeData[0]?.count || 0} occurrences</span>.
          </div>
        </div>
      </div>
    </div>
  );
}