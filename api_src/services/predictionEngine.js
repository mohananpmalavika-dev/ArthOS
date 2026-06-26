import {
  autoSelectAndForecast,
  compareScenarios as compareScenarioInputs,
  generatePrediction,
  predictionEngineForecastHealth,
  simulateScenario as simulateScenarioInput
} from '../../src/engines/predictionEngine.js';
import { buildForecastExplanation } from './explainableAi.js';

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
  const forecast = generatePrediction(profile, history, options);

  return {
    contractVersion: 'prediction.forecast.v1',
    forecast,
    explanation: buildForecastExplanation({
      forecast,
      profile,
      history,
      predictionType: 'financial_profile_forecast'
    })
  };
}

export function forecastHealthScore(payload = {}) {
  const currentScore = Number(payload.currentScore ?? payload.profile?.currentScore ?? 50);
  const scoreHistory = toNumericSeries(payload.scoreHistory || payload.history);
  const profile = payload.profile || {};
  const seasonPeriod = toPositiveInteger(payload.seasonPeriod, 12);

  const forecast = predictionEngineForecastHealth(currentScore, scoreHistory, profile, seasonPeriod);

  return {
    contractVersion: 'prediction.health.v1',
    forecast,
    explanation: buildForecastExplanation({
      forecast,
      profile: { ...profile, currentScore },
      history: scoreHistory,
      predictionType: 'health_score_forecast'
    })
  };
}

export function runForecastModel(payload = {}) {
  const history = toNumericSeries(payload.history || payload.timeSeries);
  const horizon = toPositiveInteger(payload.horizon || payload.forecastHorizon, 180);
  const seasonPeriod = toPositiveInteger(payload.seasonPeriod, 0);

  const result = autoSelectAndForecast(history, horizon, seasonPeriod);

  return {
    contractVersion: 'prediction.model.v1',
    result,
    explanation: buildForecastExplanation({
      forecast: { result, confidence: result?.confidence, model: result?.model },
      history,
      predictionType: 'forecast_model'
    })
  };
}

export function simulateScenario(payload = {}) {
  const currentState = payload.currentState || payload.profile || {};
  const result = simulateScenarioInput(
    currentState,
    payload.changes || payload.scenario || {},
    payload.options || {}
  );

  return {
    contractVersion: 'prediction.scenario.v1',
    result,
    explanation: buildForecastExplanation({
      forecast: result,
      profile: currentState,
      history: toNumericSeries(payload.history || payload.scoreHistory),
      predictionType: 'scenario_simulation'
    })
  };
}

export function compareScenarios(payload = {}) {
  const currentState = payload.currentState || payload.profile || {};
  const scenarios = compareScenarioInputs(
    currentState,
    payload.scenarios || []
  );

  return {
    contractVersion: 'prediction.compare.v1',
    scenarios,
    explanation: buildForecastExplanation({
      forecast: { result: scenarios?.[0] || {} },
      profile: currentState,
      history: toNumericSeries(payload.history || payload.scoreHistory),
      predictionType: 'scenario_comparison'
    })
  };
}

export default {
  forecastFinancialProfile,
  forecastHealthScore,
  runForecastModel,
  simulateScenario,
  compareScenarios
};
