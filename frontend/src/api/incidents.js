import { apiClient } from "./client";

export const getIncidents = (params = {}) =>
  apiClient.get("/incidents/", { params }).then((r) => r.data);

export const getIncident = (reference) =>
  apiClient.get(`/incidents/${reference}`).then((r) => r.data);

export const updateIncidentStatus = (reference, statut) =>
  apiClient.patch(`/incidents/${reference}`, { statut }).then((r) => r.data);

export const escaladeIncident = (reference) =>
  apiClient.post(`/incidents/${reference}/escalade`).then((r) => r.data);
