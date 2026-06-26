import { opportunityForecast } from '../../src/engines/opportunityForecastEngine.js';

export function forecastOpportunity(payload = {}) {
  return {
    contractVersion: 'opportunity.forecast.v1',
    ...opportunityForecast(payload.profile || payload.customer || payload)
  };
}

export default {
  forecastOpportunity
};
