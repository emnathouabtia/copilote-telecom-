import { apiClient } from "./client";

export const getKpis = () => apiClient.get("/dashboard/kpi").then((r) => r.data);

export const getCategories = () =>
  apiClient.get("/dashboard/categories").then((r) => r.data);

export const getSeverites = () =>
  apiClient.get("/dashboard/severites").then((r) => r.data);