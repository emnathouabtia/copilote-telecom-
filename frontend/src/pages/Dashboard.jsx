import { useEffect, useState, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const C = {
  bg: "#000000", surface: "#0a0a0a", surface2: "#111111",
  border: "#1f1f1f", border2: "#2a2a2a",
  accent: "#3b82f6", danger: "#ef4444", warning: "#f59e0b",
  success: "#22c55e", purple: "#a78bfa",
  text: "#e5e5e5", muted: "#525252", subtle: "#737373",
};

function KPI({ label, value, color, sub }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "18px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: color, opacity: 0.8 }} />
      <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>{label}</div>
      <div style={{ fontSize: "32px", fontWeight: "700", color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize: "11px", color: C.muted, marginTop: "6px" }}>{sub}</div>}
    </div>
  );
}

function Badge({ value }) {
  const map = { CRITIQUE: C.danger, MAJEURE: C.warning, MINEURE: C.accent, INFO: C.muted };
  const color = map[value] || C.muted;
  return (
    <span style={{ background: color + "18", color, border: `1px solid ${color}30`, borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: "600", letterSpacing: "0.03em" }}>
      {value}
    </span>
  );
}

function CopilotePanel({ onClose }) {
  const [chat, setChat] = useState([{ role: "assistant", text: "Bonjour. Je suis votre copilote télécom SOTETEL. Posez-moi une question sur un incident." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  const send = async () => {
    if (!input.trim()) return;
    const q = input;
    setChat(p => [...p, { role: "user", text: q }]);
    setInput(""); setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/chat/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q })
      });
      const d = await res.json();
      setChat(p => [...p, { role: "assistant", text: d.response }]);
    } catch {
      setChat(p => [...p, { role: "assistant", text: "Erreur de connexion." }]);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: "fixed", right: "24px", bottom: "90px", width: "380px", height: "520px",
      background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: "16px",
      boxShadow: "0 24px 80px rgba(0,0,0,0.8)", display: "flex", flexDirection: "column",
      zIndex: 1000, overflow: "hidden"
    }}>
      <div style={{ padding: "14px 16px", background: "#0d0d0d", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🤖</div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: C.text }}>Copilote IA</div>
            <div style={{ fontSize: "10px", color: C.success }}>● Groq · RAG · llama-3.3-70b</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {chat.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: "8px", alignItems: "flex-end" }}>
            {m.role === "assistant" && (
              <div style={{ width: "24px", height: "24px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0 }}>🤖</div>
            )}
            <div style={{
              background: m.role === "user" ? "#1d3557" : "#161616",
              border: `1px solid ${m.role === "user" ? "#2d4a7a" : C.border}`,
              color: C.text, padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 2px 14px" : "2px 14px 14px 14px",
              maxWidth: "82%", fontSize: "13px", lineHeight: "1.6"
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ width: "24px", height: "24px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>🤖</div>
            <div style={{ background: "#161616", border: `1px solid ${C.border}`, borderRadius: "2px 14px 14px 14px", padding: "10px 14px" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: "6px", height: "6px", background: C.accent, borderRadius: "50%", animation: `bounce 1s ${i*0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: "8px" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Question sur un incident..."
          style={{ flex: 1, padding: "10px 14px", background: "#0a0a0a", border: `1px solid ${C.border2}`, color: C.text, borderRadius: "8px", fontSize: "13px", outline: "none" }}
        />
        <button onClick={send} disabled={loading}
          style={{ padding: "10px 16px", background: loading ? "#1a1a1a" : "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "white", border: "none", borderRadius: "8px", cursor: loading ? "default" : "pointer", fontSize: "16px" }}>
          ➤
        </button>
      </div>
    </div>
  );
}

const TYPE_COLORS = {
  CPU_HIGH: "#ef4444", RAM_HIGH: "#f59e0b", DISK_FULL: "#8b5cf6",
  LINK_DOWN: "#3b82f6", SERVICE_DOWN: "#ec4899", POWER_FAIL: "#f97316",
  PING_LOSS: "#06b6d4", AUTH_FAILURE_SPIKE: "#84cc16",
};

export default function Dashboard() {
  const [kpi, setKpi] = useState(null);
  const [alertes, setAlertes] = useState([]);
  const [alertesParHeure, setAlertesParHeure] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiloteOpen, setCopiloteOpen] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/dashboard/kpi")
      .then(r => r.json()).then(d => setKpi(d.data)).catch(() => {});
    fetch("http://localhost:8000/alerts/")
      .then(r => r.json()).then(d => setAlertes(d.data || [])).catch(() => {}).finally(() => setLoading(false));
    fetch("http://localhost:8000/dashboard/alertes-par-heure")
      .then(r => r.json()).then(d => setAlertesParHeure(
        (d.data || []).map(r => ({ h: new Date(r.heure).getHours() + "h", total: Number(r.total), critiques: Number(r.critiques) }))
      )).catch(() => {});
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "new_alert") setAlertes(prev => [data.data, ...prev].slice(0, 100));
    };
    return () => ws.close();
  }, []);

  const barData = Object.entries(
    alertes.reduce((acc, a) => { acc[a.type_alerte] = (acc[a.type_alerte] || 0) + 1; return acc; }, {})
  ).map(([type, count]) => ({ type: type.replace("_", " "), count, color: TYPE_COLORS[type] || C.accent }));

  const riskScore = kpi ? Math.min(99, Math.round((kpi.critiques / Math.max(kpi.alertes_actives, 1)) * 100 + kpi.alertes_actives)) : 0;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', 'Segoe UI', sans-serif", color: C.text }}>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #000; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "12px" }}>
          <KPI label="Alertes actives" value={kpi?.alertes_actives} color={C.danger} sub="en cours" />
          <KPI label="Critiques" value={kpi?.critiques} color={C.danger} sub="priorité max" />
          <KPI label="Majeures" value={kpi?.majeures} color={C.warning} sub="surveillance" />
          <KPI label="Résolus 24h" value={kpi?.resolus_24h} color={C.success} sub="incidents clos" />
          <KPI label="Disponibilité" value={kpi ? `${kpi.disponibilite}%` : null} color={C.success} sub="SLA cible 99.5%" />
        </div>

        {/* GRAPHES */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px" }}>
            <div style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px", display: "flex", justifyContent: "space-between" }}>
              <span>Alertes / heure</span>
              <span style={{ color: C.accent }}>24h</span>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={alertesParHeure}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.accent} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.danger} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={C.danger} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" />
                <XAxis dataKey="h" tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#111", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, fontSize: "12px" }} />
                <Area type="monotone" dataKey="total" stroke={C.accent} fill="url(#g1)" strokeWidth={2} name="Total" />
                <Area type="monotone" dataKey="critiques" stroke={C.danger} fill="url(#g2)" strokeWidth={1.5} name="Critiques" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px" }}>
            <div style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Alertes par type</div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={barData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" horizontal={false} />
                <XAxis type="number" tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="type" type="category" tick={{ fill: C.subtle, fontSize: 9 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ background: "#111", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, fontSize: "12px" }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Alertes">
                  {barData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABLEAU */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: C.text }}>Incidents actifs</span>
            <span style={{ fontSize: "11px", color: C.danger, background: "#1a0000", border: "1px solid #3a0000", borderRadius: "6px", padding: "2px 10px" }}>{alertes.length} alertes</span>
          </div>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Chargement...</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Équipement", "Type", "Sévérité", "Valeur", "Métrique", "Statut"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.muted, fontWeight: "500", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alertes.slice(0, 12).map((a, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#0a0a0a"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "10px 16px", fontWeight: "600", color: C.text }}>{a.code_equipement || a.nom_equipement || "-"}</td>
                    <td style={{ padding: "10px 16px", color: C.subtle, fontFamily: "monospace", fontSize: "12px" }}>{a.type_alerte}</td>
                    <td style={{ padding: "10px 16px" }}><Badge value={a.severite} /></td>
                    <td style={{ padding: "10px 16px", color: C.text, fontVariantNumeric: "tabular-nums" }}>{a.valeur_mesuree} <span style={{ color: C.muted, fontSize: "11px" }}>{a.unite}</span></td>
                    <td style={{ padding: "10px 16px", color: C.muted, fontSize: "12px" }}>{a.metrique || "-"}</td>
                    <td style={{ padding: "10px 16px", color: C.muted, fontSize: "11px" }}>{a.statut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* BOUTON COPILOTE FLOTTANT */}
      <button
        onClick={() => setCopiloteOpen(!copiloteOpen)}
        style={{
          position: "fixed", right: "24px", bottom: "24px",
          width: "56px", height: "56px",
          background: copiloteOpen ? "#1a1a2e" : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          border: copiloteOpen ? `2px solid ${C.accent}` : "none",
          borderRadius: "16px", cursor: "pointer",
          boxShadow: copiloteOpen ? "none" : "0 8px 32px rgba(59,130,246,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "24px", transition: "all 0.2s ease", zIndex: 1001,
          transform: copiloteOpen ? "scale(0.95)" : "scale(1)"
        }}
        title="Ouvrir le copilote IA"
      >
        {copiloteOpen ? "✕" : "🤖"}
      </button>

      {/* PANEL COPILOTE */}
      {copiloteOpen && (
        <div style={{ animation: "fadeIn 0.2s ease" }}>
          <CopilotePanel onClose={() => setCopiloteOpen(false)} />
        </div>
      )}
    </div>
  );
}