import {
  autoSelectAndForecast,
  compareScenarios as compareScenarioInputs,
  generatePrediction,
  predictionEngineForecastHealth,
  simulateScenario as simulateScenarioInput
} from '../../src/engines/predictionEngine.js';

function toNumericSeries(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => {
      if (typeof item === 'number') {
        return item;
      }
      if (item && typeof item === 'object') {
        return Number(item.value ?? item.score ?? item.healthScore ?? item.amount);
      }
      return Number(item);
    })
    .filter(item => Number.isFinite(item));
}

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.round(parsed);
}

function normalizePredictionOptions(options = {}) {
  return {
    seasonPeriod: toPositiveInteger(options.seasonPeriod, 0),
    includeEnsemble: options.includeEnsemble !== false
  };
}

export function forecastFinancialProfile(payload = {}) {
  const profile = payload.profile || payload.currentState || {};
  const history = toNumericSeries(payload.history || payload.scoreHistory || payload.timeSeries);
  const options = normalizePredictionOptions(payload.options || payload);

  return {
    contractVersion: 'prediction.forecast.v1',
    forecast: generatePrediction(profile, history, options)
  };
}

export function forecastHealthScore(payload = {}) {
  const currentScore = Number(payload.currentScore ?? payload.profile?.currentScore ?? 50);
  const scoreHistory = toNumericSeries(payload.scoreHistory || payload.history);
  const profile = payload.profile || {};
  const seasonPeriod = toPositiveInteger(payload.seasonPeriod, 12);

  return {
    contractVersion: 'prediction.health.v1',
    forecast: predictionEngineForecastHealth(currentScore, scoreHistory, profile, seasonPeriod)
  };
}

export function runForecastModel(payload = {}) {
  const history = toNumericSeries(payload.history || payload.timeSeries);
  const horizon = toPositiveInteger(payload.horizon || payload.forecastHorizon, 180);
  const seasonPeriod = toPositiveInteger(payload.seasonPeriod, 0);

  return {
    contractVersion: 'prediction.model.v1',
    result: autoSelectAndForecast(history, horizon, seasonPeriod)
  };
}

export function simulateScenario(payload = {}) {
  return {
    contractVersion: 'prediction.scenario.v1',
    result: simulateScenarioInput(
      payload.currentState || payload.profile || {},
      payload.changes || payload.scenario || {},
      payload.options || {}
    )
  };
}

export function compareScenarios(payload = {}) {
  return {
    contractVersion: 'prediction.compare.v1',
    scenarios: compareScenarioInputs(
      payload.currentState || payload.profile || {},
      payload.scenarios || []
    )
  };
}

export default {
  forecastFinancialProfile,
  forecastHealthScore,
  runForecastModel,
  simulateScenario,
  compareScenarios
};
