import { useEffect, useState, useCallback } from "react";
import KPICard from "../components/KPICard";
import Chart from "../components/Chart";
import LiveStatusDot from "../components/LiveStatusDot";
import { getIncidents, updateIncidentStatus, escaladeIncident } from "../api/incidents";
import { getKpis, getCategories } from "../api/dashboard";

const STATUTS = ["OUVERT", "EN_COURS", "ESCALADE", "RESOLU", "CLOTURE"];
const PRIORITES = ["P1_CRITIQUE", "P2_HAUTE", "P3_MOYENNE", "P4_BASSE"];

function severiteClass(severite) {
  const map = {
    CRITIQUE: "severite-critique",
    MAJEURE: "severite-majeure",
    MINEURE: "severite-mineure",
    INFO: "severite-info",
  };
  return map[severite] ?? "";
}

// Normalise une réponse API qui peut être soit un tableau brut,
// soit un objet {status, count, data: [...]} comme /incidents/.
function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [categories, setCategories] = useState([]);
  const [statutFilter, setStatutFilter] = useState("");
  const [prioriteFilter, setPrioriteFilter] = useState("");
  const [expandedRef, setExpandedRef] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const incidentsData = await getIncidents({
        ...(statutFilter && { statut: statutFilter }),
        ...(prioriteFilter && { priorite: prioriteFilter }),
      });
      setIncidents(normalizeList(incidentsData));
    } catch (err) {
      console.error("Erreur incidents", err);
    }

    try {
      const kpisData = await getKpis();
      setKpis(kpisData.data ?? kpisData);
    } catch (err) {
      console.error("Erreur KPIs", err);
    }

    try {
      const categoriesData = await getCategories();
      setCategories(normalizeList(categoriesData));
    } catch (err) {
      console.error("Erreur catégories", err);
    }

    setLoading(false);
  }, [statutFilter, prioriteFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatutChange = async (reference, statut) => {
    await updateIncidentStatus(reference, statut);
    loadData();
  };

  const handleEscalade = async (reference) => {
    await escaladeIncident(reference);
    loadData();
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Supervision — Incidents</h1>
          <p className="page-subtitle">Copilote intelligent de supervision télécom</p>
        </div>
        <LiveStatusDot connected={true} />
      </header>

      <section className="kpi-grid">
        <KPICard label="Alertes actives" value={kpis?.alertes_actives ?? "—"} tone="neutral" />
        <KPICard label="Critiques" value={kpis?.critiques ?? "—"} tone="critical" />
        <KPICard label="Incidents actifs" value={kpis?.incidents_actifs ?? "—"} tone="warning" />
        <KPICard label="Résolus (24h)" value={kpis?.resolus_24h ?? "—"} tone="success" />
      </section>

      <section className="panel">
        <h2 className="panel-title">Répartition par catégorie</h2>
        <Chart type="bar" data={categories} dataKey="total" nameKey="categorie" />
      </section>

      <section className="filters">
        <select className="select" value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
          <option value="">tous les statuts</option>
          {STATUTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select className="select" value={prioriteFilter} onChange={(e) => setPrioriteFilter(e.target.value)}>
          <option value="">toutes priorités</option>
          {PRIORITES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <button className="btn btn-refresh" onClick={loadData}>actualiser</button>
      </section>

      <section className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Référence</th>
              <th>Titre</th>
              <th>Priorité</th>
              <th>Score</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="cell-empty">chargement...</td></tr>
            )}
            {!loading && incidents.length === 0 && (
              <tr><td colSpan={6} className="cell-empty">aucun incident pour ces filtres</td></tr>
            )}
            {incidents.map((inc) => (
              <>
                <tr
                  key={inc.reference}
                  onClick={() => setExpandedRef(expandedRef === inc.reference ? null : inc.reference)}
                  className={severiteClass(inc.severite)}
                >
                  <td className="ref-cell">{inc.reference}</td>
                  <td>{inc.titre}</td>
                  <td><span className={`badge badge-${inc.priorite}`}>{inc.priorite}</span></td>
                  <td className="score-cell">{inc.score_criticite}</td>
                  <td>
                    <select
                      className="select"
                      value={inc.statut}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatutChange(inc.reference, e.target.value)}
                    >
                      {STATUTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-link"
                      onClick={(e) => { e.stopPropagation(); handleEscalade(inc.reference); }}
                    >
                      escalader
                    </button>
                  </td>
                </tr>
                {expandedRef === inc.reference && (
                  <tr className="detail-row">
                    <td colSpan={6}>
                      <p>
                        <span className="detail-label">cause probable</span>
                        {inc.cause_probable ?? "non renseignée"}
                      </p>
                      <p style={{ marginTop: 4 }}>
                        <span className="detail-label">action recommandée</span>
                        {inc.action_recommandee ?? "non renseignée"}
                      </p>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}