
-- =========================================================
-- Base de données PostgreSQL
-- Projet : Copilote intelligent de supervision télécom orienté incidents
-- Durée : mini-projet stage d'été 45 jours
-- Version : MVP pédagogique/professionnel
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- 1. Types ENUM
-- =========================
DO $$ BEGIN
    CREATE TYPE role_utilisateur AS ENUM ('ADMIN', 'SUPERVISEUR', 'TECHNICIEN', 'LECTEUR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE statut_alerte AS ENUM ('NOUVELLE', 'NORMALISEE', 'CORRELEE', 'IGNOREE', 'CONVERTIE_INCIDENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE statut_incident AS ENUM ('OUVERT', 'EN_COURS', 'ESCALADE', 'RESOLU', 'CLOTURE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE severite AS ENUM ('INFO', 'MINEURE', 'MAJEURE', 'CRITIQUE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE priorite AS ENUM ('P1_CRITIQUE', 'P2_HAUTE', 'P3_MOYENNE', 'P4_BASSE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE categorie_incident AS ENUM ('SYSTEME', 'RESEAU', 'SERVICE', 'APPLICATIF', 'INFRASTRUCTURE', 'ENVIRONNEMENT_SITE', 'SECURITE', 'INCONNU');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =========================
-- 2. Référentiels métier
-- =========================
CREATE TABLE IF NOT EXISTS utilisateurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_complet VARCHAR(120) NOT NULL,
    email VARCHAR(160) UNIQUE NOT NULL,
    role role_utilisateur NOT NULL DEFAULT 'LECTEUR',
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_site VARCHAR(50) UNIQUE NOT NULL,
    nom_site VARCHAR(150) NOT NULL,
    region_id INT REFERENCES regions(id),
    type_site VARCHAR(50) NOT NULL CHECK (type_site IN ('BTS', 'NODEB', 'ENODEB', 'GNODEB', 'POP', 'DATACENTER', 'AGENCE', 'AUTRE')),
    criticite_site INT NOT NULL CHECK (criticite_site BETWEEN 1 AND 5),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    adresse TEXT,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services_telecom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_service VARCHAR(50) UNIQUE NOT NULL,
    nom_service VARCHAR(150) NOT NULL,
    type_service VARCHAR(80) NOT NULL,
    criticite_service INT NOT NULL CHECK (criticite_service BETWEEN 1 AND 5),
    sla_cible_minutes INT NOT NULL DEFAULT 240,
    actif BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS equipements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id),
    code_equipement VARCHAR(80) UNIQUE NOT NULL,
    nom_equipement VARCHAR(150) NOT NULL,
    type_equipement VARCHAR(80) NOT NULL,
    constructeur VARCHAR(80),
    modele VARCHAR(80),
    adresse_ip INET,
    criticite_equipement INT NOT NULL CHECK (criticite_equipement BETWEEN 1 AND 5),
    statut_operational VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipement_service (
    equipement_id UUID REFERENCES equipements(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services_telecom(id) ON DELETE CASCADE,
    PRIMARY KEY (equipement_id, service_id)
);

-- =========================
-- 3. Alertes et incidents
-- =========================
CREATE TABLE IF NOT EXISTS alertes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_alarm_id VARCHAR(120),
    source_system VARCHAR(80) NOT NULL DEFAULT 'SIMULATEUR',
    date_alerte TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    site_id UUID REFERENCES sites(id),
    equipement_id UUID REFERENCES equipements(id),
    service_id UUID REFERENCES services_telecom(id),
    type_alerte VARCHAR(80) NOT NULL,
    severite severite NOT NULL,
    message TEXT NOT NULL,
    metrique VARCHAR(80),
    valeur_mesuree NUMERIC(12,2),
    seuil NUMERIC(12,2),
    unite VARCHAR(20),
    statut statut_alerte NOT NULL DEFAULT 'NOUVELLE',
    fingerprint VARCHAR(160),
    donnees_brutes JSONB,
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alertes_date ON alertes(date_alerte DESC);
CREATE INDEX IF NOT EXISTS idx_alertes_severite ON alertes(severite);
CREATE INDEX IF NOT EXISTS idx_alertes_statut ON alertes(statut);
CREATE INDEX IF NOT EXISTS idx_alertes_fingerprint ON alertes(fingerprint);

CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(40) UNIQUE NOT NULL,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_detection TIMESTAMP,
    date_resolution TIMESTAMP,
    alerte_source_id UUID REFERENCES alertes(id),
    site_id UUID REFERENCES sites(id),
    equipement_id UUID REFERENCES equipements(id),
    service_id UUID REFERENCES services_telecom(id),
    titre VARCHAR(200) NOT NULL,
    description TEXT,
    categorie categorie_incident NOT NULL DEFAULT 'INCONNU',
    severite severite NOT NULL,
    priorite priorite NOT NULL DEFAULT 'P3_MOYENNE',
    score_criticite NUMERIC(5,2) NOT NULL DEFAULT 0,
    cause_probable TEXT,
    action_recommandee TEXT,
    niveau_escalade VARCHAR(50) DEFAULT 'N1',
    statut statut_incident NOT NULL DEFAULT 'OUVERT',
    assigne_a UUID REFERENCES utilisateurs(id),
    cree_par UUID REFERENCES utilisateurs(id),
    commentaire_cloture TEXT,
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modifie_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidents_reference ON incidents(reference);
CREATE INDEX IF NOT EXISTS idx_incidents_statut ON incidents(statut);
CREATE INDEX IF NOT EXISTS idx_incidents_priorite ON incidents(priorite);
CREATE INDEX IF NOT EXISTS idx_incidents_score ON incidents(score_criticite DESC);

CREATE TABLE IF NOT EXISTS incident_alertes (
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    alerte_id UUID REFERENCES alertes(id) ON DELETE CASCADE,
    type_lien VARCHAR(40) NOT NULL DEFAULT 'SOURCE',
    PRIMARY KEY (incident_id, alerte_id)
);

CREATE TABLE IF NOT EXISTS historique_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    date_action TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    utilisateur_id UUID REFERENCES utilisateurs(id),
    action VARCHAR(100) NOT NULL,
    ancien_statut VARCHAR(40),
    nouveau_statut VARCHAR(40),
    commentaire TEXT
);

-- =========================
-- 4. Base de connaissances et moteur de règles
-- =========================
CREATE TABLE IF NOT EXISTS base_connaissances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_fiche VARCHAR(50) UNIQUE NOT NULL,
    categorie categorie_incident NOT NULL,
    symptome VARCHAR(200) NOT NULL,
    cause_probable TEXT NOT NULL,
    action_n1 TEXT NOT NULL,
    action_n2 TEXT,
    niveau_escalade VARCHAR(50) NOT NULL DEFAULT 'N1',
    prevention TEXT,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regles_diagnostic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_regle VARCHAR(50) UNIQUE NOT NULL,
    nom_regle VARCHAR(150) NOT NULL,
    categorie categorie_incident NOT NULL,
    type_alerte VARCHAR(80) NOT NULL,
    condition_expression TEXT NOT NULL,
    severite_min severite NOT NULL DEFAULT 'MINEURE',
    poids_severite NUMERIC(5,2) NOT NULL DEFAULT 40,
    poids_service NUMERIC(5,2) NOT NULL DEFAULT 25,
    poids_site NUMERIC(5,2) NOT NULL DEFAULT 20,
    poids_repetition NUMERIC(5,2) NOT NULL DEFAULT 10,
    poids_duree NUMERIC(5,2) NOT NULL DEFAULT 5,
    score_min_priorite_haute NUMERIC(5,2) NOT NULL DEFAULT 70,
    fiche_connaissance_id UUID REFERENCES base_connaissances(id),
    actif BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS recommandations_incident (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    regle_id UUID REFERENCES regles_diagnostic(id),
    fiche_connaissance_id UUID REFERENCES base_connaissances(id),
    cause_probable TEXT NOT NULL,
    action_recommandee TEXT NOT NULL,
    score_confiance NUMERIC(5,2) NOT NULL DEFAULT 0.80,
    explique_par TEXT,
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 5. Paramétrage scoring
-- =========================
CREATE TABLE IF NOT EXISTS parametres_scoring (
    id SERIAL PRIMARY KEY,
    nom_parametre VARCHAR(80) UNIQUE NOT NULL,
    valeur NUMERIC(10,2) NOT NULL,
    description TEXT
);

-- =========================
-- 6. Vues utiles dashboard
-- =========================
CREATE OR REPLACE VIEW v_dashboard_incidents AS
SELECT
    COUNT(*) AS total_incidents,
    COUNT(*) FILTER (WHERE statut IN ('OUVERT','EN_COURS','ESCALADE')) AS incidents_ouverts,
    COUNT(*) FILTER (WHERE statut = 'RESOLU') AS incidents_resolus,
    COUNT(*) FILTER (WHERE priorite = 'P1_CRITIQUE') AS incidents_p1,
    COUNT(*) FILTER (WHERE priorite = 'P2_HAUTE') AS incidents_p2,
    ROUND(AVG(score_criticite),2) AS score_moyen
FROM incidents;

CREATE OR REPLACE VIEW v_incidents_par_categorie AS
SELECT categorie, COUNT(*) AS total
FROM incidents
GROUP BY categorie
ORDER BY total DESC;

CREATE OR REPLACE VIEW v_alertes_par_severite AS
SELECT severite, COUNT(*) AS total
FROM alertes
GROUP BY severite
ORDER BY total DESC;

CREATE OR REPLACE VIEW v_top_sites_instables AS
SELECT s.code_site, s.nom_site, COUNT(i.id) AS total_incidents, ROUND(AVG(i.score_criticite),2) AS score_moyen
FROM incidents i
JOIN sites s ON s.id = i.site_id
GROUP BY s.code_site, s.nom_site
ORDER BY total_incidents DESC, score_moyen DESC;

-- =========================
-- 7. Fonction simple de calcul de priorité
-- =========================
CREATE OR REPLACE FUNCTION calculer_priorite(score NUMERIC)
RETURNS priorite AS $$
BEGIN
    IF score >= 85 THEN
        RETURN 'P1_CRITIQUE';
    ELSIF score >= 70 THEN
        RETURN 'P2_HAUTE';
    ELSIF score >= 45 THEN
        RETURN 'P3_MOYENNE';
    ELSE
        RETURN 'P4_BASSE';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- 8. Trigger modification incident
-- =========================
CREATE OR REPLACE FUNCTION set_modifie_le()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modifie_le = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_incidents_modifie_le ON incidents;
CREATE TRIGGER trg_incidents_modifie_le
BEFORE UPDATE ON incidents
FOR EACH ROW EXECUTE FUNCTION set_modifie_le();
