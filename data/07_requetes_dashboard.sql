
-- Requêtes utiles pour dashboard du MVP

-- 1. KPI principaux
SELECT * FROM v_dashboard_incidents;

-- 2. Incidents par catégorie
SELECT * FROM v_incidents_par_categorie;

-- 3. Alertes par sévérité
SELECT * FROM v_alertes_par_severite;

-- 4. Top sites instables
SELECT * FROM v_top_sites_instables LIMIT 10;

-- 5. Liste priorisée des incidents ouverts
SELECT
    reference,
    date_creation,
    titre,
    categorie,
    severite,
    priorite,
    score_criticite,
    statut,
    cause_probable,
    action_recommandee
FROM incidents
WHERE statut IN ('OUVERT', 'EN_COURS', 'ESCALADE')
ORDER BY score_criticite DESC, date_creation ASC;

-- 6. Historique des alertes critiques des 7 derniers jours
SELECT
    a.date_alerte,
    s.code_site,
    e.code_equipement,
    a.type_alerte,
    a.severite,
    a.message,
    a.valeur_mesuree,
    a.seuil,
    a.statut
FROM alertes a
LEFT JOIN sites s ON s.id = a.site_id
LEFT JOIN equipements e ON e.id = a.equipement_id
WHERE a.severite IN ('MAJEURE','CRITIQUE')
  AND a.date_alerte >= CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY a.date_alerte DESC;
