import { createApiClient } from "./apiClient.js";

const api = createApiClient();

function unwrapEngineResult(response, key = "result") {
  if (!response || typeof response !== "object") {
    return response;
  }
  return response[key] ?? response.result ?? response.forecast ?? response.analysis ?? response;
}

export async function predictLoanDefault(customer, history) {
  const response = await api.post("/loan-default/predict", {
    body: { customer, history }
  });
  return unwrapEngineResult(response, "defaultRisk");
}

export async function calculateLoanHealthOnServer(customer) {
  const response = await api.post("/loan-health/calculate", {
    body: { customer }
  });
  return unwrapEngineResult(response);
}

export async function forecastOpportunityOnServer(profile) {
  const response = await api.post("/opportunity/forecast", {
    body: { profile }
  });
  return unwrapEngineResult(response, "forecast");
}
