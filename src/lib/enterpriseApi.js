import { createApiClient } from "./apiClient.js";

export function createEnterpriseApi({ getAccessToken, getTenantId, debug = false } = {}) {
  const api = createApiClient({ getAccessToken, getTenantId, debug });

  return {
    getPortfolio: ({ range = "7d" } = {}) =>
      api.get("/enterprise/portfolio", { params: { range } }),
    getCustomers: ({ q, risk = "all" } = {}) =>
      api.get("/enterprise/customers", { params: { q, risk } }),
    getCustomer: (customerId) =>
      api.get(`/enterprise/customers/${encodeURIComponent(customerId)}`),
    getRiskAlerts: () => api.get("/enterprise/risk-alerts"),
    getAnalytics: ({ range = "90d" } = {}) =>
      api.get("/enterprise/analytics", { params: { range } }),
    getSettings: () => api.get("/enterprise/settings"),
  };
}
