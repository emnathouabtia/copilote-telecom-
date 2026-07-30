import { apiClient } from "./client";

/**
 * Envoie une question au copilote LLM, avec l'incident courant en contexte.
 * Route attendue côté backend (Emna) : POST /chat/
 * Payload envoyé : { incident_id, question }
 * Réponse attendue : { status, reponse, fiches_utilisees: [...] }
 * (à ajuster dès que sa route existe réellement)
 */
export const askCopilote = (incidentId, question) =>
  apiClient.post("/chat/", { incident_id: incidentId, question }).then((r) => r.data);