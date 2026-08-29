
-- =========================================================
-- Données initiales PostgreSQL
-- Projet : Copilote intelligent de supervision télécom orienté incidents
-- =========================================================

INSERT INTO utilisateurs (nom_complet, email, role) VALUES
('Encadrant SOTETEL', 'encadrant@sotetel.tn', 'ADMIN'),
('Doaa Ben Marzouk', 'benmarzoukdoua@gmail.com', 'SUPERVISEUR'),
('Emna Thouabtia', 'emna.thouabtia@enicar.ucar.tn', 'SUPERVISEUR'),
('Technicien N1', 'technicien.n1@sotetel.tn', 'TECHNICIEN')
ON CONFLICT (email) DO NOTHING;

INSERT INTO regions (code, nom) VALUES
('TN-TUN', 'Tunis'),
('TN-ARI', 'Ariana'),
('TN-BIZ', 'Bizerte'),
('TN-NAB', 'Nabeul'),
('TN-SOU', 'Sousse')
ON CONFLICT (code) DO NOTHING;

INSERT INTO services_telecom (code_service, nom_service, type_service, criticite_service, sla_cible_minutes) VALUES
('SUP-NOC', 'Supervision NOC', 'SUPERVISION', 5, 60),
('MW-BACKHAUL', 'Backhaul Microwave', 'TRANSMISSION', 5, 120),
('IP-MPLS', 'Service IP/MPLS', 'RESEAU', 5, 120),
('RAN-4G', 'Accès Radio 4G', 'RADIO', 4, 180),
('ENERGIE-SITE', 'Énergie et environnement site', 'ENERGIE', 4, 180),
('APP-OSS', 'Application OSS interne', 'APPLICATIF', 3, 240)
ON CONFLICT (code_service) DO NOTHING;

INSERT INTO sites (code_site, nom_site, region_id, type_site, criticite_site, latitude, longitude, adresse) VALUES
('TUN-POP-001', 'POP Tunis Centre', (SELECT id FROM regions WHERE code='TN-TUN'), 'POP', 5, 36.8065000, 10.1815000, 'Tunis Centre'),
('ARI-BTS-014', 'Site Radio Ariana 014', (SELECT id FROM regions WHERE code='TN-ARI'), 'ENODEB', 4, 36.8665000, 10.1940000, 'Ariana'),
('BIZ-BTS-022', 'Site Radio Bizerte 022', (SELECT id FROM regions WHERE code='TN-BIZ'), 'ENODEB', 3, 37.2746000, 9.8739000, 'Bizerte'),
('NAB-BTS-031', 'Site Radio Nabeul 031', (SELECT id FROM regions WHERE code='TN-NAB'), 'ENODEB', 3, 36.4561000, 10.7376000, 'Nabeul'),
('SOU-DC-001', 'Datacenter Sousse', (SELECT id FROM regions WHERE code='TN-SOU'), 'DATACENTER', 5, 35.8256000, 10.6084000, 'Sousse')
ON CONFLICT (code_site) DO NOTHING;

INSERT INTO equipements (site_id, code_equipement, nom_equipement, type_equipement, constructeur, modele, adresse_ip, criticite_equipement) VALUES
((SELECT id FROM sites WHERE code_site='TUN-POP-001'), 'TUN-RTR-CORE-01', 'Routeur Core Tunis 01', 'ROUTEUR', 'Cisco', 'ASR', '10.10.1.1', 5),
((SELECT id FROM sites WHERE code_site='TUN-POP-001'), 'TUN-SRV-NMS-01', 'Serveur NMS Tunis 01', 'SERVEUR', 'Dell', 'PowerEdge', '10.10.1.20', 5),
((SELECT id FROM sites WHERE code_site='ARI-BTS-014'), 'ARI-ENB-014', 'eNodeB Ariana 014', 'ENODEB', 'Huawei', 'BTS3900', '10.20.14.1', 4),
((SELECT id FROM sites WHERE code_site='ARI-BTS-014'), 'ARI-MW-014', 'Lien MW Ariana 014', 'MICROWAVE', 'Huawei', 'RTN', '10.20.14.2', 4),
((SELECT id FROM sites WHERE code_site='BIZ-BTS-022'), 'BIZ-ENB-022', 'eNodeB Bizerte 022', 'ENODEB', 'Nokia', 'AirScale', '10.30.22.1', 3),
((SELECT id FROM sites WHERE code_site='NAB-BTS-031'), 'NAB-ENER-031', 'Système énergie Nabeul 031', 'ENERGIE', 'Delta', 'PowerSystem', '10.40.31.5', 4),
((SELECT id FROM sites WHERE code_site='SOU-DC-001'), 'SOU-SRV-OSS-01', 'Serveur OSS Sousse 01', 'SERVEUR', 'HP', 'ProLiant', '10.50.1.15', 4)
ON CONFLICT (code_equipement) DO NOTHING;

INSERT INTO equipement_service (equipement_id, service_id)
SELECT e.id, s.id FROM equipements e CROSS JOIN services_telecom s
WHERE (e.code_equipement='TUN-RTR-CORE-01' AND s.code_service IN ('IP-MPLS','SUP-NOC'))
   OR (e.code_equipement='TUN-SRV-NMS-01' AND s.code_service IN ('SUP-NOC','APP-OSS'))
   OR (e.code_equipement='ARI-ENB-014' AND s.code_service IN ('RAN-4G'))
   OR (e.code_equipement='ARI-MW-014' AND s.code_service IN ('MW-BACKHAUL'))
   OR (e.code_equipement='BIZ-ENB-022' AND s.code_service IN ('RAN-4G'))
   OR (e.code_equipement='NAB-ENER-031' AND s.code_service IN ('ENERGIE-SITE'))
   OR (e.code_equipement='SOU-SRV-OSS-01' AND s.code_service IN ('APP-OSS','SUP-NOC'))
ON CONFLICT DO NOTHING;

INSERT INTO base_connaissances (code_fiche, categorie, symptome, cause_probable, action_n1, action_n2, niveau_escalade, prevention) VALUES
('KB-CPU-001', 'SYSTEME', 'CPU élevé', 'Processus consommateur, boucle applicative, charge anormale ou attaque par surcharge.', 'Vérifier les processus actifs, la charge système, les logs et l’historique des alertes.', 'Escalader vers administrateur système si CPU demeure > 90 % après diagnostic.', 'N2_SYSTEME', 'Mettre en place seuils adaptés, capacity planning et rotation des processus lourds.'),
('KB-RAM-001', 'SYSTEME', 'Mémoire saturée', 'Fuite mémoire, service bloqué, charge applicative élevée.', 'Vérifier consommation mémoire par processus et redémarrage contrôlé si autorisé.', 'Escalader vers équipe système/applicative.', 'N2_SYSTEME', 'Surveiller tendances RAM et revoir dimensionnement.'),
('KB-DISK-001', 'INFRASTRUCTURE', 'Disque saturé', 'Accumulation de logs, sauvegardes non purgées, fichiers temporaires volumineux.', 'Identifier répertoires volumineux, vérifier logs, appliquer purge/rotation si autorisée.', 'Escalader vers administrateur système.', 'N2_SYSTEME', 'Activer rotation logs et alertes à seuil progressif.'),
('KB-LINK-001', 'RESEAU', 'Lien indisponible', 'Coupure lien, interface down, équipement distant indisponible, problème énergie.', 'Vérifier ping, état interface, alarmes équipement, voisinage et historique.', 'Escalader vers transmission/réseau terrain.', 'N2_RESEAU', 'Prévoir supervision redondance et analyse des coupures récurrentes.'),
('KB-SERV-001', 'SERVICE', 'Service arrêté', 'Crash applicatif, dépendance indisponible, erreur configuration, saturation ressources.', 'Vérifier statut service, logs applicatifs, dépendances et redémarrage si autorisé.', 'Escalader vers équipe applicative.', 'N2_APPLICATIF', 'Mettre en place healthcheck et redémarrage contrôlé.'),
('KB-PING-001', 'RESEAU', 'Perte supervision', 'Équipement injoignable, routage, firewall, lien interrompu ou panne énergie.', 'Tester connectivité, traceroute, vérifier NMS et état du site.', 'Escalader N2 réseau ou terrain selon criticité.', 'N2_RESEAU', 'Mettre en place corrélation avec alarmes énergie/lien.'),
('KB-POWER-001', 'ENVIRONNEMENT_SITE', 'Panne énergie site', 'Défaut secteur, batterie faible, redresseur en défaut, groupe indisponible.', 'Vérifier alarmes énergie, autonomie batterie et état redresseur.', 'Escalader équipe énergie/terrain.', 'N2_TERRAIN', 'Plan de maintenance préventive énergie.'),
('KB-SEC-001', 'SECURITE', 'Tentatives accès anormales', 'Brute force SSH, scan réseau, tentative compromission.', 'Vérifier logs d’authentification, source IP, fréquence et comptes ciblés.', 'Escalader cybersécurité si activité persistante.', 'N2_SECURITE', 'Durcir accès, MFA, filtrage IP, alerting sécurité.')
ON CONFLICT (code_fiche) DO NOTHING;

INSERT INTO regles_diagnostic (code_regle, nom_regle, categorie, type_alerte, condition_expression, severite_min, fiche_connaissance_id) VALUES
('REG-CPU-90', 'Classification CPU critique', 'SYSTEME', 'CPU_HIGH', 'valeur_mesuree >= 90', 'MAJEURE', (SELECT id FROM base_connaissances WHERE code_fiche='KB-CPU-001')),
('REG-RAM-90', 'Classification RAM critique', 'SYSTEME', 'RAM_HIGH', 'valeur_mesuree >= 90', 'MAJEURE', (SELECT id FROM base_connaissances WHERE code_fiche='KB-RAM-001')),
('REG-DISK-95', 'Classification disque saturé', 'INFRASTRUCTURE', 'DISK_FULL', 'valeur_mesuree >= 95', 'MAJEURE', (SELECT id FROM base_connaissances WHERE code_fiche='KB-DISK-001')),
('REG-LINK-DOWN', 'Classification lien indisponible', 'RESEAU', 'LINK_DOWN', 'valeur_mesuree = 0', 'CRITIQUE', (SELECT id FROM base_connaissances WHERE code_fiche='KB-LINK-001')),
('REG-SERVICE-DOWN', 'Classification service arrêté', 'SERVICE', 'SERVICE_DOWN', 'valeur_mesuree = 0', 'MAJEURE', (SELECT id FROM base_connaissances WHERE code_fiche='KB-SERV-001')),
('REG-PING-LOSS', 'Classification perte supervision', 'RESEAU', 'PING_LOSS', 'valeur_mesuree >= 80', 'MAJEURE', (SELECT id FROM base_connaissances WHERE code_fiche='KB-PING-001')),
('REG-POWER-FAIL', 'Classification énergie site', 'ENVIRONNEMENT_SITE', 'POWER_FAIL', 'valeur_mesuree = 0', 'CRITIQUE', (SELECT id FROM base_connaissances WHERE code_fiche='KB-POWER-001')),
('REG-SEC-LOGIN', 'Classification accès suspects', 'SECURITE', 'AUTH_FAILURE_SPIKE', 'valeur_mesuree >= 20', 'MAJEURE', (SELECT id FROM base_connaissances WHERE code_fiche='KB-SEC-001'))
ON CONFLICT (code_regle) DO NOTHING;

INSERT INTO parametres_scoring (nom_parametre, valeur, description) VALUES
('POIDS_SEVERITE', 40, 'Poids de la sévérité technique dans le score global'),
('POIDS_SERVICE', 25, 'Poids de la criticité du service impacté'),
('POIDS_SITE', 20, 'Poids de la criticité du site ou équipement'),
('POIDS_REPETITION', 10, 'Poids de la répétition des alertes'),
('POIDS_DUREE', 5, 'Poids de la durée de l’incident')
ON CONFLICT (nom_parametre) DO NOTHING;
