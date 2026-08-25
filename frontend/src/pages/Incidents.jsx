import { useEffect, useState, useCallback } from "react";

const C = {
  bg: "#000000", surface: "#0a0a0a", surface2: "#111111",
  border: "#1f1f1f", border2: "#2a2a2a",
  accent: "#3b82f6", danger: "#ef4444", warning: "#f59e0b",
  success: "#22c55e", purple: "#a78bfa",
  text: "#e5e5e5", muted: "#525252", subtle: "#737373",
};

const STATUTS = ["OUVERT", "EN_COURS", "ESCALADE", "RESOLU", "CLOTURE"];
const PRIORITES = ["P1_CRITIQUE", "P2_HAUTE", "P3_MOYENNE", "P4_BASSE"];

function KPI({ label, value, color }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "18px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: color }} />
      <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "30px", fontWeight: "700", color, lineHeight: 1 }}>{value ?? "—"}</div>
    </div>
  );
}

function PriorityBadge({ value }) {
  const map = {
    P1_CRITIQUE: { color: C.danger, label: "P1 CRITIQUE" },
    P2_HAUTE: { color: C.warning, label: "P2 HAUTE" },
    P3_MOYENNE: { color: C.accent, label: "P3 MOYENNE" },
    P4_BASSE: { color: C.muted, label: "P4 BASSE" },
  };
  const { color, label } = map[value] || { color: C.muted, label: value };
  return (
    <span style={{ background: color + "18", color, border: `1px solid ${color}30`, borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: "600" }}>
      {label}
    </span>
  );
}

function StatutBadge({ value }) {
  const map = {
    OUVERT: C.danger, EN_COURS: C.warning,
    ESCALADE: C.purple, RESOLU: C.success, CLOTURE: C.muted,
  };
  const color = map[value] || C.muted;
  return (
    <span style={{ background: color + "18", color, border: `1px solid ${color}30`, borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: "600" }}>
      {value}
    </span>
  );
}

function MLBadge({ result, loading }) {
  if (loading) return <span style={{ color: C.muted, fontSize: "11px" }}>...</span>;
  if (!result) return null;
  const map = { ANOMALIE: C.danger, SUSPECT: C.warning, NORMAL: C.success };
  const color = map[result.label] || C.muted;
  return (
    <span style={{ background: color + "18", color, border: `1px solid ${color}30`, borderRadius: "6px", padding: "3px 8px", fontSize: "11px", fontWeight: "600" }}>
      {result.label}
    </span>
  );
}

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

export default function Incidents({ role }) {
  const [incidents, setIncidents] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [statutFilter, setStatutFilter] = useState("");
  const [prioriteFilter, setPrioriteFilter] = useState("");
  const [expandedRef, setExpandedRef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mlResults, setMlResults] = useState({});
  const [mlLoading, setMlLoading] = useState({});
  const [statutModal, setStatutModal] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    let loadedIncidents = [];
    try {
      const params = new URLSearchParams();
      if (statutFilter) params.append("statut", statutFilter);
      if (prioriteFilter) params.append("priorite", prioriteFilter);
      const res = await fetch(`http://localhost:8000/incidents/?${params}`);
      const data = await res.json();
      loadedIncidents = normalizeList(data);
      setIncidents(loadedIncidents);
    } catch (err) { console.error(err); }

    try {
      const res = await fetch("http://localhost:8000/dashboard/kpi");
      const data = await res.json();
      setKpi(data.data);
    } catch (err) { console.error(err); }

    setLoading(false);

    loadedIncidents.forEach((inc) => {
      if (!inc.id) return;
      setMlLoading(prev => ({ ...prev, [inc.id]: true }));
      fetch("http://localhost:8000/predict/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type_alerte: inc.type_alerte || "CPU_HIGH",
          severite: inc.severite || "MINEURE",
          equipement: inc.code_equipement || "TUN-RTR-CORE-01",
          valeur_mesuree: inc.valeur_mesuree || 0,
          seuil: inc.seuil || 85,
          heure: new Date(inc.date_creation).getHours(),
          jour_semaine: new Date(inc.date_creation).getDay(),
        })
      })
        .then(r => r.json())
        .then(result => setMlResults(prev => ({ ...prev, [inc.id]: result })))
        .catch(err => console.error("ML error", err))
        .finally(() => setMlLoading(prev => ({ ...prev, [inc.id]: false })));
    });
  }, [statutFilter, prioriteFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleChangeStatut = (id, statutActuel) => {
    setStatutModal({ id, statutActuel });
  };

  const confirmChangeStatut = async (id, nouveauStatut) => {
    try {
      await fetch(`http://localhost:8000/incidents/${id}/statut`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: nouveauStatut })
      });
      setStatutModal(null);
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet incident ?")) return;
    try {
      await fetch(`http://localhost:8000/incidents/${id}`, { method: "DELETE" });
      loadData();
    } catch (err) { console.error(err); }
  };

  const canEdit = role === "ADMIN" || role === "TECHNICIEN" || role === "SUPERVISEUR";
  const canDelete = role === "ADMIN";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', 'Segoe UI', sans-serif", color: C.text }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        select option { background: #111; color: #e5e5e5; }
      `}</style>

      {/* Modal changement statut */}
      {statutModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "24px", width: "360px" }}>
            <div style={{ fontSize: "14px", fontWeight: "600", color: C.text, marginBottom: "6px" }}>Changer le statut</div>
            <div style={{ fontSize: "12px", color: C.muted, marginBottom: "16px" }}>
              Statut actuel : <span style={{ color: C.text, fontWeight: "600" }}>{statutModal.statutActuel}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {STATUTS.map(s => (
                <button key={s} onClick={() => confirmChangeStatut(statutModal.id, s)}
                  style={{
                    padding: "10px 14px",
                    background: s === statutModal.statutActuel ? "#1a1a2e" : "#111",
                    border: `1px solid ${s === statutModal.statutActuel ? C.accent : "#2a2a2a"}`,
                    color: s === statutModal.statutActuel ? C.accent : C.text,
                    borderRadius: "8px", cursor: "pointer", fontSize: "12px",
                    textAlign: "left", fontWeight: s === statutModal.statutActuel ? "600" : "400"
                  }}>
                  {s}
                </button>
              ))}
            </div>
            <button onClick={() => setStatutModal(null)}
              style={{ marginTop: "12px", width: "100%", padding: "8px", background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
          <KPI label="Alertes actives" value={kpi?.alertes_actives} color={C.danger} />
          <KPI label="Critiques" value={kpi?.critiques} color={C.danger} />
          <KPI label="Incidents actifs" value={kpi?.incidents_actifs} color={C.warning} />
          <KPI label="Resolus 24h" value={kpi?.resolus_24h} color={C.success} />
        </div>

        {/* FILTRES */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "14px 20px", display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Filtres</span>
          <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)}
            style={{ background: C.surface2, border: `1px solid ${C.border2}`, color: C.text, borderRadius: "8px", padding: "8px 12px", fontSize: "12px", outline: "none", cursor: "pointer" }}>
            <option value="">Tous les statuts</option>
            {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={prioriteFilter} onChange={e => setPrioriteFilter(e.target.value)}
            style={{ background: C.surface2, border: `1px solid ${C.border2}`, color: C.text, borderRadius: "8px", padding: "8px 12px", fontSize: "12px", outline: "none", cursor: "pointer" }}>
            <option value="">Toutes priorites</option>
            {PRIORITES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={loadData}
            style={{ background: "#1a1a2e", border: `1px solid ${C.accent}30`, color: C.accent, borderRadius: "8px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", fontWeight: "500" }}>
            Actualiser
          </button>
          <span style={{ marginLeft: "auto", fontSize: "11px", color: C.muted }}>{incidents.length} incident(s)</span>
        </div>

        {/* TABLEAU */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "600" }}>Liste des incidents</span>
            <span style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase" }}>Tries par score decroissant</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Reference", "Titre", "Priorite", "Severite", "Score", "ML", "Statut", "Details",
                  ...(canEdit ? ["Actions"] : [])
                ].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.muted, fontWeight: "500", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} style={{ padding: "40px", textAlign: "center", color: C.muted }}>Chargement...</td></tr>}
              {!loading && incidents.length === 0 && <tr><td colSpan={9} style={{ padding: "40px", textAlign: "center", color: C.muted }}>Aucun incident</td></tr>}
              {incidents.map((inc) => (
                <>
                  <tr key={inc.id}
                    onClick={() => setExpandedRef(expandedRef === inc.id ? null : inc.id)}
                    style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: expandedRef === inc.id ? "#0a0a0a" : "transparent" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#0a0a0a"}
                    onMouseLeave={e => e.currentTarget.style.background = expandedRef === inc.id ? "#0a0a0a" : "transparent"}>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "12px", color: C.accent }}>{inc.reference}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "500", color: C.text }}>{inc.titre}</td>
                    <td style={{ padding: "12px 16px" }}><PriorityBadge value={inc.priorite} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: inc.severite === "CRITIQUE" ? C.danger : inc.severite === "MAJEURE" ? C.warning : C.accent, fontWeight: "600", fontSize: "12px" }}>{inc.severite}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: inc.score_criticite > 70 ? C.danger : inc.score_criticite > 40 ? C.warning : C.success, fontWeight: "600" }}>{inc.score_criticite}</td>
                    <td style={{ padding: "12px 16px" }}><MLBadge result={mlResults[inc.id]} loading={mlLoading[inc.id]} /></td>
                    <td style={{ padding: "12px 16px" }}><StatutBadge value={inc.statut} /></td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "10px", color: C.muted }}>{expandedRef === inc.id ? "fermer" : "details"}</td>
                    {canEdit && (
                      <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleChangeStatut(inc.id, inc.statut)}
                            style={{ background: "#1a1a2e", border: `1px solid ${C.accent}30`, color: C.accent, borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>
                            Statut
                          </button>
                          {canDelete && (
                            <button onClick={() => handleDelete(inc.id)}
                              style={{ background: "#1a0000", border: `1px solid ${C.danger}30`, color: C.danger, borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>
                              Supprimer
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                  {expandedRef === inc.id && (
                    <tr style={{ borderBottom: `1px solid ${C.border}`, background: "#050505" }}>
                      <td colSpan={9} style={{ padding: "16px 20px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "12px 16px" }}>
                            <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", marginBottom: "6px" }}>Cause probable</div>
                            <div style={{ fontSize: "13px", lineHeight: "1.6" }}>{inc.cause_probable || "Non renseignee"}</div>
                          </div>
                          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "12px 16px" }}>
                            <div style={{ fontSize: "10px", color: C.muted, textTransform: "uppercase", marginBottom: "6px" }}>Action recommandee</div>
                            <div style={{ fontSize: "13px", lineHeight: "1.6" }}>{inc.action_recommandee || "Non renseignee"}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: "10px", fontSize: "11px", color: C.muted }}>
                          Cree le : {inc.date_creation ? new Date(inc.date_creation).toLocaleString("fr-FR") : "—"}
                          {inc.nom_equipement && ` · Equipement : ${inc.nom_equipement}`}
                          {inc.nom_site && ` · Site : ${inc.nom_site}`}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}