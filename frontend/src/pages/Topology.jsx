import { useEffect, useState } from "react";

const C = {
  bg: "#000000", surface: "#0a0a0a", surface2: "#111111",
  border: "#1f1f1f", accent: "#3b82f6", danger: "#ef4444",
  warning: "#f59e0b", success: "#22c55e", purple: "#a78bfa",
  text: "#e5e5e5", muted: "#525252",
};

const EQUIPEMENTS = [
  { id: "R1", label: "RTR-CORE-01", site: "Tunis", type: "ROUTEUR", x: 400, y: 80 },
  { id: "SW1", label: "SW-CORE-01", site: "Tunis", type: "SWITCH", x: 220, y: 200 },
  { id: "SW2", label: "SW-CORE-02", site: "Tunis", type: "SWITCH", x: 580, y: 200 },
  { id: "SRV1", label: "SRV-NMS-01", site: "Tunis", type: "SERVEUR", x: 100, y: 320 },
  { id: "SRV2", label: "SRV-OSS-01", site: "Sousse", type: "SERVEUR", x: 300, y: 320 },
  { id: "ENB1", label: "eNodeB-ARI-014", site: "Ariana", type: "ENODEB", x: 500, y: 320 },
  { id: "MW1", label: "MW-ARI-014", site: "Ariana", type: "MICROWAVE", x: 680, y: 320 },
  { id: "ENB2", label: "eNodeB-BIZ-022", site: "Bizerte", type: "ENODEB", x: 150, y: 440 },
  { id: "ENB3", label: "eNodeB-NAB-031", site: "Nabeul", type: "ENODEB", x: 400, y: 440 },
  { id: "ENER1", label: "ENER-NAB-031", site: "Nabeul", type: "ENERGIE", x: 620, y: 440 },
];

const LIENS = [
  { from: "R1", to: "SW1" }, { from: "R1", to: "SW2" },
  { from: "SW1", to: "SRV1" }, { from: "SW1", to: "SRV2" },
  { from: "SW2", to: "ENB1" }, { from: "SW2", to: "MW1" },
  { from: "SW1", to: "ENB2" }, { from: "R1", to: "ENB3" },
  { from: "ENB3", to: "ENER1" },
];

const TYPE_ICONS = {
  ROUTEUR: "🔀", SWITCH: "🔄", SERVEUR: "🖥️",
  ENODEB: "📶", MICROWAVE: "📡", ENERGIE: "⚡",
};

const TYPE_COLORS = {
  ROUTEUR: "#3b82f6", SWITCH: "#8b5cf6", SERVEUR: "#06b6d4",
  ENODEB: "#22c55e", MICROWAVE: "#f59e0b", ENERGIE: "#f97316",
};

function getStatusColor(code, alertes) {
  const equipAlertes = alertes.filter(a =>
    a.code_equipement && a.code_equipement.includes(code.replace("ENB", "ENB").replace("R1", "RTR"))
  );
  if (equipAlertes.some(a => a.severite === "CRITIQUE")) return "#ef4444";
  if (equipAlertes.some(a => a.severite === "MAJEURE")) return "#f59e0b";
  return "#22c55e";
}

export default function Topology() {
  const [alertes, setAlertes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [hoverId, setHoverId] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/alerts/?limit=200")
      .then(r => r.json()).then(d => setAlertes(d.data || [])).catch(() => {});
  }, []);

  const selectedEquip = EQUIPEMENTS.find(e => e.id === selected);
  const selectedAlertes = selected ? alertes.filter(a =>
    a.code_equipement && a.code_equipement.includes(selected)
  ) : [];

  const critiques = alertes.filter(a => a.severite === "CRITIQUE").length;
  const majeures = alertes.filter(a => a.severite === "MAJEURE").length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: C.text }}>
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }`}</style>

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* TITRE */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "20px", fontWeight: "700" }}>Topologie Réseau</div>
            <div style={{ fontSize: "12px", color: C.muted, marginTop: "2px" }}>Infrastructure télécom SOTETEL — Vue temps réel</div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ background: "#1a0000", border: "1px solid #3a0000", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", color: C.danger }}>
              🔴 {critiques} critiques
            </span>
            <span style={{ background: "#1a1000", border: "1px solid #3a2000", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", color: C.warning }}>
              🟡 {majeures} majeures
            </span>
            <span style={{ background: "#001a00", border: "1px solid #003a00", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", color: C.success }}>
              🟢 {EQUIPEMENTS.length - critiques} OK
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px" }}>

          {/* SVG TOPOLOGIE */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px", overflow: "hidden" }}>
            <div style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
              Cliquez sur un équipement pour voir ses alertes
            </div>
            <svg viewBox="0 0 780 540" width="100%" style={{ fontFamily: "'Inter', sans-serif" }}>
              {/* Grille de fond */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#111" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="780" height="540" fill="url(#grid)" />

              {/* Labels de sites */}
              {["Tunis", "Ariana", "Bizerte", "Nabeul", "Sousse"].map((site, i) => (
                <text key={site} x={[380, 580, 120, 400, 290][i]} y={[30, 270, 400, 400, 270][i]}
                  fill="#333" fontSize="11" textAnchor="middle" fontWeight="500">{site}</text>
              ))}

              {/* LIENS */}
              {LIENS.map((lien, i) => {
                const from = EQUIPEMENTS.find(e => e.id === lien.from);
                const to = EQUIPEMENTS.find(e => e.id === lien.to);
                if (!from || !to) return null;
                const isActive = hoverId === lien.from || hoverId === lien.to ||
                                 selected === lien.from || selected === lien.to;
                return (
                  <line key={i}
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={isActive ? C.accent : "#222"}
                    strokeWidth={isActive ? 2 : 1}
                    strokeDasharray={isActive ? "none" : "4 2"}
                  />
                );
              })}

              {/* EQUIPEMENTS */}
              {EQUIPEMENTS.map((eq) => {
                const status = getStatusColor(eq.id, alertes);
                const isSelected = selected === eq.id;
                const isHovered = hoverId === eq.id;
                const color = TYPE_COLORS[eq.type] || C.accent;

                return (
                  <g key={eq.id} style={{ cursor: "pointer" }}
                    onClick={() => setSelected(isSelected ? null : eq.id)}
                    onMouseEnter={() => setHoverId(eq.id)}
                    onMouseLeave={() => setHoverId(null)}>

                    {/* Halo status */}
                    <circle cx={eq.x} cy={eq.y} r={isSelected ? 36 : isHovered ? 32 : 28}
                      fill={status + "15"} stroke={status + "40"} strokeWidth={isSelected ? 2 : 1} />

                    {/* Cercle principal */}
                    <circle cx={eq.x} cy={eq.y} r={22}
                      fill={isSelected ? color + "40" : "#111"}
                      stroke={isSelected ? color : color + "80"}
                      strokeWidth={isSelected ? 2.5 : 1.5} />

                    {/* Indicateur status */}
                    <circle cx={eq.x + 16} cy={eq.y - 16} r={6}
                      fill={status} stroke="#000" strokeWidth={1.5} />

                    {/* Icône */}
                    <text x={eq.x} y={eq.y + 5} textAnchor="middle" fontSize="14">{TYPE_ICONS[eq.type]}</text>

                    {/* Label */}
                    <text x={eq.x} y={eq.y + 38} textAnchor="middle" fontSize="9"
                      fill={isSelected ? C.text : C.muted} fontWeight={isSelected ? "600" : "400"}>
                      {eq.label}
                    </text>
                    <text x={eq.x} y={eq.y + 50} textAnchor="middle" fontSize="8" fill="#444">
                      {eq.site}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* LÉGENDE */}
            <div style={{ display: "flex", gap: "16px", marginTop: "12px", flexWrap: "wrap" }}>
              {Object.entries(TYPE_ICONS).map(([type, icon]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: C.muted }}>
                  <span>{icon}</span>
                  <span style={{ color: TYPE_COLORS[type] }}>{type}</span>
                </div>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
                {[["🔴", "Critique", C.danger], ["🟡", "Majeure", C.warning], ["🟢", "Normal", C.success]].map(([icon, label, color]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color }}>
                    <span>{icon}</span><span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PANNEAU DÉTAIL */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Info équipement sélectionné */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px" }}>
              {selectedEquip ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <div style={{ width: "36px", height: "36px", background: TYPE_COLORS[selectedEquip.type] + "20", border: `1px solid ${TYPE_COLORS[selectedEquip.type]}40`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                      {TYPE_ICONS[selectedEquip.type]}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600" }}>{selectedEquip.label}</div>
                      <div style={{ fontSize: "11px", color: C.muted }}>{selectedEquip.site} · {selectedEquip.type}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                    Alertes actives ({selectedAlertes.length})
                  </div>

                  {selectedAlertes.length === 0 ? (
                    <div style={{ fontSize: "12px", color: C.success, padding: "10px", background: "#001a00", borderRadius: "6px", textAlign: "center" }}>
                      ✅ Aucune alerte
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {selectedAlertes.slice(0, 5).map((a, i) => {
                        const color = a.severite === "CRITIQUE" ? C.danger : a.severite === "MAJEURE" ? C.warning : C.accent;
                        return (
                          <div key={i} style={{ background: color + "10", border: `1px solid ${color}25`, borderRadius: "6px", padding: "8px 10px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "600", color }}>{a.type_alerte}</div>
                            <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>
                              {a.valeur_mesuree} {a.unite} · {a.statut}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "20px", color: C.muted, fontSize: "13px" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>🗺️</div>
                  Sélectionnez un équipement pour voir ses détails
                </div>
              )}
            </div>

            {/* Stats réseau */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px" }}>
              <div style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                État du réseau
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { label: "Équipements total", value: EQUIPEMENTS.length, color: C.accent },
                  { label: "Alertes critiques", value: critiques, color: C.danger },
                  { label: "Alertes majeures", value: majeures, color: C.warning },
                  { label: "Total alertes", value: alertes.length, color: C.muted },
                ].map((stat) => (
                  <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: C.surface2, borderRadius: "6px" }}>
                    <span style={{ fontSize: "12px", color: C.muted }}>{stat.label}</span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}