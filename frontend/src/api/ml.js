import { apiClient } from "./client";

/**
 * Appelle POST /predict/ avec les champs attendus par le modèle IsolationForest.
 * Champs attendus par le backend : type_alerte, severite, equipement,
 * valeur_mesuree, seuil, heure, jour_semaine.
 */
export const predictAnomaly = (payload) =>
  apiClient.post("/predict/", payload).then((r) => r.data);

export const getPredictHealth = () =>
  apiClient.get("/predict/health").then((r) => r.data);