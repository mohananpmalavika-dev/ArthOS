import { buildForecastGovernance } from "./modelRegistry.js";

/**
 * L09: Prediction Engine — v4 Production Upgrade
 *
 * Sophisticated multi-model forecasting engine with:
 * - ARIMA (Auto-Regressive Integrated Moving Average)
 * - Holt-Winters Exponential Smoothing (with seasonality)
 * - Bayesian Structural Time Series (simplified)
 * - Ensemble (weighted model combination)
 * - Auto-selection: picks the best model for your data
 * - Model validation: MAE, RMSE, MAPE, AIC
 * - Regime-aware adjustments
 *
 * Blueprint spec: "30 day forecast | 90 day forecast | 180 day forecast | Scenario simulation"
 *
 * Exports a unified prediction API that wraps all models.
 */

function clamp(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, value);
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function toArray(arr) {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr.filter(v => typeof v === "number" && Number.isFinite(v));
}

// ============================================================
// STATIONARITY TEST (Augmented Dickey-Fuller approximation)
// ============================================================

/**
 * Quick stationarity check using variance of differenced series.
 * Returns { isStationary, d (differencing order) }
 */
function checkStationarity(series) {
  const data = toArray(series);
  if (data.length < 4) {
    return { isStationary: true, d: 0 };
  }

  // Variance ratio test: compare variance of raw vs differenced
  const rawVariance = variance(data);
  const diff1 = difference(data, 1);
  const diff1Variance = variance(diff1);

  // If differencing reduces variance significantly, series is non-stationary
  const ratio = diff1Variance > 0 ? rawVariance / diff1Variance : 1;

  if (ratio > 2.5) {
    // Try second difference
    const diff2 = difference(diff1, 1);
    const diff2Variance = variance(diff2);
    const ratio2 = diff1Variance > 0 && diff2Variance > 0 ? diff1Variance / diff2Variance : 1;
    return { isStationary: ratio2 <= 2.5, d: ratio2 > 2.5 ? 2 : 1 };
  }

  return { isStationary: true, d: 0 };
}

function variance(values) {
  if (values.length < 2) {
    return 0;
  }
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
}

function difference(series, order) {
  let data = [...series];
  for (let d = 0; d < order; d++) {
    const diffed = [];
    for (let i = 1; i < data.length; i++) {
      diffed.push(data[i] - data[i - 1]);
    }
    data = diffed;
  }
  return data;
}

// ============================================================
// MODEL VALIDATION METRICS
// ============================================================

export function computeMetrics(actual, predicted) {
  if (!actual.length || !predicted.length || actual.length !== predicted.length) {
    return { mae: 0, rmse: 0, mape: 0, aic: 0, r2: 0 };
  }

  const n = Math.min(actual.length, predicted.length);
  let sumAbsError = 0;
  let sumSqError = 0;
  let sumPctError = 0;
  const meanActual = actual.reduce((s, v) => s + v, 0) / n;

  for (let i = 0; i < n; i++) {
    const error = actual[i] - predicted[i];
    sumAbsError += Math.abs(error);
    sumSqError += error * error;
    if (actual[i] !== 0) {
      sumPctError += Math.abs(error / actual[i]);
    }
  }

  const mae = sumAbsError / n;
  const rmse = Math.sqrt(sumSqError / n);
  const mape = (sumPctError / n) * 100;

  // AIC approximation: n * ln(RSS/n) + 2k (k = number of parameters, approximate)
  const rss = sumSqError;
  const aic = n > 0 && rss > 0 ? n * Math.log(rss / n) + 2 * 3 : 0;

  // R²
  const ssTotal = actual.reduce((s, v) => s + (v - meanActual) ** 2, 0);
  const r2 = ssTotal > 0 ? 1 - rss / ssTotal : 0;

  return {
    mae: round2(mae),
    rmse: round2(rmse),
    mape: round2(mape),
    aic: round2(aic),
    r2: round2(r2)
  };
}

// ============================================================
// HOLT-WINTERS EXPONENTIAL SMOOTHING
// ============================================================

/**
 * Holt-Winters with optional seasonality.
 * If seasonPeriod is 0 or data is too short, falls back to Holt's linear (double exponential).
 *
 * Returns forecast array and model metadata.
 */
export function holtWinters(
  series,
  forecastHorizon,
  seasonPeriod = 0,
  alpha = 0.3,
  beta = 0.1,
  gamma = 0.1
) {
  const data = toArray(series);
  if (data.length < 3) {
    return fallbackForecast(data, forecastHorizon);
  }

  const n = data.length;
  const hasSeasonality = seasonPeriod > 1 && n >= seasonPeriod * 2;

  // Initialize
  let level = data[0];
  let trend = data.length > 1 ? data[1] - data[0] : 0;

  const season = [];
  if (hasSeasonality) {
    for (let i = 0; i < seasonPeriod; i++) {
      season[i] = data[i] / level;
    }
  }

  const fitted = [level];

  for (let t = 1; t < n; t++) {
    const lastLevel = level;
    const lastTrend = trend;

    if (hasSeasonality) {
      const seasonal = season[t % seasonPeriod] || 1;
      level = alpha * (data[t] / seasonal) + (1 - alpha) * (level + trend);
      trend = beta * (level - lastLevel) + (1 - beta) * lastTrend;
      season[t % seasonPeriod] =
        gamma * (data[t] / level) + (1 - gamma) * (season[t % seasonPeriod] || 1);
      fitted.push(level * (season[t % seasonPeriod] || 1));
    } else {
      level = alpha * data[t] + (1 - alpha) * (level + trend);
      trend = beta * (level - lastLevel) + (1 - beta) * lastTrend;
      fitted.push(level);
    }
  }

  // Generate forecasts
  const forecasts = [];
  for (let h = 1; h <= forecastHorizon; h++) {
    if (hasSeasonality && seasonPeriod > 0) {
      const s = season[(n + h - 1) % seasonPeriod] || 1;
      forecasts.push((level + h * trend) * s);
    } else {
      forecasts.push(level + h * trend);
    }
  }

  // Compute residuals for confidence intervals
  const residuals = data.map((v, i) => v - fitted[i]);
  const residualStd =
    residuals.length > 1
      ? Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / (residuals.length - 1))
      : Math.abs(data[data.length - 1] * 0.1);

  // Compute metrics on fit
  const metrics = computeMetrics(data, fitted);

  return {
    model: "holt-winters",
    forecasts,
    fitted,
    level,
    trend,
    season,
    seasonPeriod,
    hasSeasonality,
    residualStd,
    alpha,
    beta,
    gamma,
    metrics,
    name: hasSeasonality ? "Holt-Winters (seasonal)" : "Holt's Linear Trend"
  };
}

// ============================================================
// ARIMA (Auto-Regressive Integrated Moving Average)
// ============================================================

/**
 * ARIMA(p,d,q) implementation.
 * - p: autoregressive order
 * - d: differencing order
 * - q: moving average order
 *
 * Uses Yule-Walker for AR estimation and moment-based MA estimation.
 */
export function arima(series, p = 1, d = null, q = 1, forecastHorizon = 180) {
  const data = toArray(series);

  if (data.length < 3) {
    return fallbackForecast(data, forecastHorizon);
  }

  // Auto-detect differencing order if not provided
  if (d === null) {
    const stationarity = checkStationarity(data);
    d = stationarity.d;
  }

  // Difference the series
  const diffed = difference(data, d);
  const nDiff = diffed.length;

  if (nDiff < p + q + 1) {
    return fallbackForecast(data, forecastHorizon);
  }

  // Estimate AR coefficients using Yule-Walker
  const arCoeffs = estimateAR(diffed, p);

  // Estimate residuals (for MA component)
  const arResiduals = [];
  for (let t = p; t < nDiff; t++) {
    let pred = 0;
    for (let i = 0; i < p; i++) {
      pred += arCoeffs[i] * diffed[t - 1 - i];
    }
    arResiduals.push(diffed[t] - pred);
  }

  // Estimate MA coefficients
  const maCoeffs = estimateMA(arResiduals, q);

  // Generate forecasts
  const forecasts = [];
  const combined = [...diffed];
  const errors = [...arResiduals];

  for (let h = 0; h < forecastHorizon; h++) {
    let pred = 0;
    const idx = combined.length;

    // AR component
    for (let i = 0; i < p; i++) {
      const lag = combined.length - 1 - i;
      pred += (arCoeffs[i] || 0) * (lag >= 0 ? combined[lag] : combined[0] * 0.5);
    }

    // MA component
    for (let i = 0; i < q; i++) {
      const lag = errors.length - 1 - i;
      pred += (maCoeffs[i] || 0) * (lag >= 0 ? errors[lag] : 0);
    }

    combined.push(pred);
    errors.push(0); // Use 0 for future errors
    forecasts.push(pred);
  }

  // Undo differencing to get forecasts in original scale
  const undiffedForecasts = undifference(forecasts, data, d);

  // Also compute fitted values (in-sample)
  const fitted = [];
  for (let t = 0; t < nDiff; t++) {
    let pred = 0;
    for (let i = 0; i < p; i++) {
      const lag = t - 1 - i;
      pred += (arCoeffs[i] || 0) * (lag >= 0 ? diffed[lag] : 0);
    }
    for (let i = 0; i < q; i++) {
      const lag = t - p - i;
      pred += (maCoeffs[i] || 0) * (lag >= 0 && lag < arResiduals.length ? arResiduals[lag] : 0);
    }
    fitted.push(pred);
  }

  // Undifference fitted values
  const undiffedFitted = undifference(fitted, data, d);

  // Compute metrics on original scale
  const metrics = computeMetrics(data.slice(d), undiffedFitted);

  // Confidence intervals
  const residuals = data.map((v, i) => {
    const f =
      i < undiffedFitted.length ? undiffedFitted[i] : undiffedFitted[undiffedFitted.length - 1];
    return v - f;
  });
  const residualStd =
    residuals.length > 1
      ? Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / (residuals.length - 1))
      : Math.abs(data[data.length - 1] * 0.1);

  return {
    model: `ARIMA(${p},${d},${q})`,
    forecasts: undiffedForecasts,
    fitted: undiffedFitted,
    arCoeffs,
    maCoeffs,
    residualStd,
    p,
    d,
    q,
    metrics,
    name: `ARIMA(${p},${d},${q})`
  };
}

function estimateAR(series, p) {
  if (p === 0) {
    return [];
  }
  const n = series.length;
  if (n < p + 1) {
    return Array(p).fill(0);
  }

  // Auto-correlation function
  const mean = series.reduce((s, v) => s + v, 0) / n;
  const centered = series.map(v => v - mean);

  const acf = [];
  for (let lag = 0; lag <= p; lag++) {
    let num = 0;
    let den = 0;
    for (let i = 0; i < n - lag; i++) {
      num += centered[i] * centered[i + lag];
      den += centered[i] * centered[i];
    }
    acf.push(den > 0 ? num / den : 0);
  }

  // Yule-Walker equations (simplified — toeplitz solve using Levinson-Durbin)
  const coeffs = yuleWalker(acf, p);
  return coeffs;
}

function yuleWalker(acf, p) {
  if (p === 0) {
    return [];
  }

  // Simple approximation: use first p lags
  // Build the Toeplitz matrix R and solve R*a = r
  // For small p, use direct inversion
  const R = [];
  const r = [];
  for (let i = 0; i < p; i++) {
    r.push(acf[i + 1] || 0);
    R[i] = [];
    for (let j = 0; j < p; j++) {
      R[i][j] = acf[Math.abs(i - j)] || 0;
    }
  }

  // Solve using Gaussian elimination (small p is safe)
  return gaussElimination(R, r, p);
}

function gaussElimination(A, b, n) {
  const aug = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-10) {
      continue;
    }

    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / pivot;
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Back substitution
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= aug[i][j] * x[j];
    }
    x[i] = aug[i][i] !== 0 ? sum / aug[i][i] : 0;
  }

  return x;
}

function estimateMA(residuals, q) {
  if (q === 0 || residuals.length < q + 1) {
    return Array(q).fill(0);
  }

  // Moment-based MA estimation using autocorrelation of residuals
  const n = residuals.length;
  const mean = residuals.reduce((s, v) => s + v, 0) / n;
  const centered = residuals.map(v => v - mean);

  const acf = [];
  for (let lag = 1; lag <= q; lag++) {
    let num = 0;
    let den = 0;
    for (let i = 0; i < n - lag; i++) {
      num += centered[i] * centered[i + lag];
      den += centered[i] * centered[i];
    }
    acf.push(den > 0 ? num / den : 0);
  }

  // For small q, use approximation: theta_j = -rho_j
  const coeffs = acf.map(r => -r);
  return coeffs;
}

function undifference(forecasts, originalData, d) {
  if (d === 0) {
    return forecasts;
  }

  const lastValue = originalData[originalData.length - 1];
  if (d === 1) {
    // Each forecast is the cumulative sum from the last original value
    let cum = lastValue;
    return forecasts.map(f => {
      cum = cum + f;
      return cum;
    });
  }

  if (d === 2) {
    const lastTwo = originalData.slice(-2);
    let cum = lastTwo[1];
    let prev = lastTwo[0];
    return forecasts.map(f => {
      const next = cum + f;
      cum = next + (cum - prev);
      prev = cum - (cum - prev);
      return cum;
    });
  }

  return forecasts;
}

// ============================================================
// BAYESIAN STRUCTURAL TIME SERIES (simplified)
// ============================================================

/**
 * Simplified Bayesian structural time series.
 * Uses a local linear trend model with conjugate priors.
 *
 * Posterior estimates are computed via Kalman filter with
 * variance learning.
 */
export function bayesianStructural(series, forecastHorizon = 180) {
  const data = toArray(series);
  if (data.length < 3) {
    return fallbackForecast(data, forecastHorizon);
  }

  const n = data.length;

  // Priors
  const priorLevelMean = data[0];
  const priorTrendMean = data.length > 1 ? data[1] - data[0] : 0;
  const priorLevelVar = Math.abs(data[0] * 0.5) || 1;
  const priorTrendVar = Math.abs(((data[data.length - 1] - data[0]) / n) * 0.5) || 0.1;
  const obsVar = Math.abs(variance(data) * 0.8) || 1;

  // Kalman filter
  let level = priorLevelMean;
  let trend = priorTrendMean;
  let levelVar = priorLevelVar;
  let trendVar = priorTrendVar;

  const fitted = [level];
  const posteriors = [{ level, trend, levelVar, trendVar }];

  for (let t = 1; t < n; t++) {
    // Predict
    const predLevel = level + trend;
    const predVar = levelVar + trendVar + obsVar;

    // Update
    const kalmanGain = predVar / (predVar + obsVar);
    const innovation = data[t] - predLevel;

    level = predLevel + kalmanGain * innovation;
    levelVar = (1 - kalmanGain) * predVar;

    // Trend update (slower)
    const trendKalmanGain = trendVar / (trendVar + obsVar * 0.1);
    trend = trend + trendKalmanGain * innovation * 0.1;
    trendVar = (1 - trendKalmanGain) * trendVar + 0.01;

    fitted.push(level);
    posteriors.push({ level, trend, levelVar, trendVar });
  }

  // Generate forecasts with credible intervals
  const forecasts = [];
  const lower90 = [];
  const upper90 = [];
  const lower50 = [];
  const upper50 = [];

  for (let h = 1; h <= forecastHorizon; h++) {
    const predLevel = level + h * trend;
    const predVar = levelVar + h * h * trendVar + h * obsVar;
    const std = Math.sqrt(predVar);

    forecasts.push(predLevel);
    lower90.push(predLevel - 1.645 * std);
    upper90.push(predLevel + 1.645 * std);
    lower50.push(predLevel - 0.674 * std);
    upper50.push(predLevel + 0.674 * std);
  }

  // Compute metrics
  const metrics = computeMetrics(data, fitted);

  return {
    model: "bayesian-structural",
    forecasts,
    fitted,
    lower90,
    upper90,
    lower50,
    upper50,
    finalLevel: level,
    finalTrend: trend,
    levelVar,
    trendVar,
    obsVar,
    metrics,
    posteriors: posteriors.slice(-10), // Last 10 posteriors for reference
    name: "Bayesian Structural"
  };
}

// ============================================================
// FALLBACK FORECAST
// ============================================================

function fallbackForecast(data, horizon) {
  if (data.length === 0) {
    return {
      model: "fallback",
      forecasts: Array(horizon).fill(50),
      fitted: [],
      residualStd: 10,
      name: "Fallback (no data)",
      metrics: { mae: 0, rmse: 0, mape: 0, aic: 0, r2: 0 }
    };
  }

  const lastValue = data[data.length - 1];
  // Simple linear trend
  const slope = data.length > 1 ? (data[data.length - 1] - data[0]) / data.length : 0;
  const forecasts = Array.from({ length: horizon }, (_, i) =>
    Math.max(0, lastValue + slope * (i + 1))
  );
  const fitted = data;

  const residuals = data.map((v, i) => {
    const trendVal = data[0] + slope * i;
    return v - trendVal;
  });
  const residualStd =
    residuals.length > 1
      ? Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / (residuals.length - 1))
      : Math.abs(lastValue * 0.1);
  const metrics = computeMetrics(data, fitted);

  return {
    model: "fallback-linear",
    forecasts,
    fitted,
    residualStd,
    metrics,
    name: "Linear Trend (fallback)"
  };
}

// ============================================================
// ENSEMBLE MODEL (weighted combination)
// ============================================================

/**
 * Ensemble model that combines multiple models with optimal weights.
 * Weights are proportional to inverse of RMSE (lower error = higher weight).
 */
export function ensembleForecast(models, historicalData, forecastHorizon) {
  if (!models || models.length === 0) {
    return fallbackForecast(historicalData, forecastHorizon);
  }

  // Compute weights based on inverse error
  let totalWeight = 0;
  const weighted = models.map(m => {
    const rmse = m.metrics?.rmse || 1;
    const weight = 1 / Math.max(rmse, 0.01);
    totalWeight += weight;
    return { model: m, weight };
  });

  // Normalize weights
  const normalizedModels = weighted.map(w => ({
    ...w,
    weight: totalWeight > 0 ? w.weight / totalWeight : 1 / weighted.length
  }));

  // Combine forecasts
  const ensembleForecasts = [];
  for (let h = 0; h < forecastHorizon; h++) {
    let forecast = 0;
    for (const m of normalizedModels) {
      forecast += (m.model.forecasts[h] || 0) * m.weight;
    }
    ensembleForecasts.push(forecast);
  }

  // Compute ensemble residual std as weighted average
  const ensembleResidualStd = normalizedModels.reduce(
    (s, m) => s + (m.model.residualStd || 0) * m.weight,
    0
  );

  // Weighted metrics
  const ensembleRMSE = normalizedModels.reduce(
    (s, m) => s + (m.model.metrics?.rmse || 0) * m.weight,
    0
  );

  return {
    model: "ensemble",
    forecasts: ensembleForecasts,
    models: normalizedModels.map(m => ({
      name: m.model.name || m.model.model,
      weight: round2(m.weight * 100) + "%",
      rmse: m.model.metrics?.rmse
    })),
    residualStd: round2(ensembleResidualStd),
    metrics: { rmse: round2(ensembleRMSE) },
    name: `Ensemble (${normalizedModels.length} models)`
  };
}

// ============================================================
// AUTO-SELECTION: Pick the best model for your data
// ============================================================

/**
 * Automatically select the best model and generate forecasts.
 * Runs all applicable models and returns the best one plus the ensemble.
 */
export function autoSelectAndForecast(historicalData, forecastHorizon = 180, seasonPeriod = 0) {
  const data = toArray(historicalData);
  if (data.length === 0) {
    return fallbackForecast(data, forecastHorizon);
  }

  const models = [];

  // Always try Holt-Winters
  try {
    const hw = holtWinters(data, forecastHorizon, seasonPeriod);
    models.push(hw);
  } catch (e) {
    // Skip
  }

  // Try ARIMA variants
  try {
    const arima1 = arima(data, 1, null, 1, forecastHorizon);
    models.push(arima1);
  } catch (e) {
    // Skip
  }

  try {
    const arima2 = arima(data, 2, null, 1, forecastHorizon);
    models.push(arima2);
  } catch (e) {
    // Skip
  }

  try {
    const arima3 = arima(data, 1, null, 2, forecastHorizon);
    models.push(arima3);
  } catch (e) {
    // Skip
  }

  // Try Bayesian structural
  try {
    const bayes = bayesianStructural(data, forecastHorizon);
    models.push(bayes);
  } catch (e) {
    // Skip
  }

  // Always include fallback
  const fallback = fallbackForecast(data, forecastHorizon);
  models.push(fallback);

  // Find best model by RMSE (lowest wins)
  let bestModel = models[0];
  for (const m of models) {
    if ((m.metrics?.rmse || Infinity) < (bestModel.metrics?.rmse || Infinity)) {
      bestModel = m;
    }
  }

  // Build ensemble from all successful models (excluding fallback if others exist)
  const ensembleModels = models.filter(m => m.model !== "fallback-linear" || models.length <= 2);
  const ensemble = ensembleForecast(ensembleModels, data, forecastHorizon);

  return {
    bestModel,
    ensemble,
    allModels: models.map(m => ({
      name: m.name || m.model,
      modelType: m.model,
      metrics: m.metrics,
      isBest: m === bestModel
    })),
    modelCount: models.length,
    generatedAt: new Date().toISOString()
  };
}

// ============================================================
// PREDICTION ENGINE: Unified API
// ============================================================

/**
 * Main prediction function. Generates forecasts at 30, 90, 180 day horizons.
 * Uses auto-selection with multi-model ensemble.
 *
 * @param {Object} profile - User profile with financial data
 * @param {Array} history - Historical data points (e.g., score history, balance history)
 * @param {Object} options
 * @param {number} options.seasonPeriod - Seasonality period (e.g., 12 for monthly)
 * @param {boolean} options.includeEnsemble - Whether to include ensemble forecast
 * @returns {Object} Forecasts with confidence intervals at all horizons
 */
export function generatePrediction(profile, history = [], options = {}) {
  const { seasonPeriod = 0, includeEnsemble = true, _synthetic = false } = options;
  const data = toArray(history);

  if (data.length === 0) {
    // Prevent infinite recursion if synthetic generation already attempted
    if (_synthetic) {
      // Return safe forecast structure with null values if we can't generate valid data
      const nullForecast = {
        point: null,
        p50: null,
        p25: null,
        p75: null,
        p10: null,
        p90: null,
        p5: null,
        p95: null,
        mean: null
      };
      const generatedAt = new Date().toISOString();
      const modelGovernance = buildForecastGovernance({
        selectedModel: "none",
        selectedModelType: "none",
        selectedMetrics: { rmse: 0, mae: 0 },
        generatedAt,
        dataPoints: 0
      });

      return {
        horizons: {
          day30: nullForecast,
          day90: nullForecast,
          day180: nullForecast
        },
        model: 'none',
        modelType: 'fallback',
        modelMetrics: { rmse: 0, mae: 0 },
        ensembleModel: null,
        confidence: 0,
        trendDirection: 'unknown',
        modelGovernance,
        generatedAt
      };
    }
    
    // Generate synthetic history from profile if no real history
    const baseValue = profile?.currentScore || profile?.healthScore || 50;
    const syntheticHistory = Array.from({ length: 6 }, (_, i) =>
      Math.max(0, baseValue - 3 + i * 1.2 + Math.random() * 2)
    );
    return generatePrediction(profile, syntheticHistory, { ...options, _synthetic: true });
  }

  const result = autoSelectAndForecast(data, 180, seasonPeriod);

  // Extract horizon forecasts
  const getHorizon = days => {
    if (!result.bestModel.forecasts[days - 1]) {
      return null;
    }
    const forecast = result.bestModel.forecasts[days - 1];
    const residualStd = result.bestModel.residualStd || Math.abs(forecast * 0.1);

    // For Bayesian, use credible intervals; otherwise, use residual-based
    const hasBayesianIntervals = result.bestModel.lower90 && result.bestModel.upper90;

    const range = confidence => {
      const z = confidence === 0.95 ? 1.96 : confidence === 0.8 ? 1.28 : 0.674;
      return z * residualStd;
    };

    return {
      point: clamp(Math.round(forecast)),
      p50: clamp(Math.round(forecast)),
      p25: clamp(Math.round(forecast - 0.674 * residualStd)),
      p75: clamp(Math.round(forecast + 0.674 * residualStd)),
      p10: clamp(Math.round(forecast - 1.28 * residualStd)),
      p90: clamp(Math.round(forecast + 1.28 * residualStd)),
      p5: clamp(Math.round(forecast - 1.96 * residualStd)),
      p95: clamp(Math.round(forecast + 1.96 * residualStd)),
      mean: clamp(Math.round(forecast))
    };
  };

  const day30 = getHorizon(30);
  const day90 = getHorizon(90);
  const day180 = getHorizon(180);
  const ensembleModel = includeEnsemble
    ? {
        name: result.ensemble.name,
        forecasts: result.ensemble.forecasts,
        models: result.ensemble.models,
        rmse: result.ensemble.metrics.rmse
      }
    : null;
  const modelGovernance = buildForecastGovernance({
    selectedModel: result.bestModel.name,
    selectedModelType: result.bestModel.model,
    selectedMetrics: result.bestModel.metrics,
    allModels: result.allModels,
    ensemble: ensembleModel,
    generatedAt: result.generatedAt,
    dataPoints: data.length
  });

  return {
    horizons: {
      day30,
      day90,
      day180
    },
    model: result.bestModel.name,
    modelType: result.bestModel.model,
    modelMetrics: result.bestModel.metrics,
    ensembleModel,
    allModels: result.allModels,
    dataPoints: data.length,
    confidence: computePredictionConfidence(result.bestModel, data.length),
    modelGovernance,
    generatedAt: result.generatedAt
  };
}

function computePredictionConfidence(model, dataPoints) {
  const rmse = model.metrics?.rmse || 50;
  const r2 = model.metrics?.r2 || 0;
  const dataScore = Math.min(30, dataPoints * 3);
  const errorScore = Math.max(0, 50 - rmse);
  const fitScore = Math.round(r2 * 20);
  return Math.min(100, Math.max(10, dataScore + errorScore + fitScore));
}

// ============================================================
// HEALTH SCORE FORECAST (uses prediction engine)
// ============================================================

/**
 * Forecast health score using the multi-model prediction engine.
 * Replaces the GBM-only forecastHealth in forecastEngine.js.
 */
export function predictionEngineForecastHealth(
  currentScore,
  scoreHistory = [],
  profile = {},
  seasonPeriod = 12
) {
  // Build time series from score history
  let history = toArray(scoreHistory);

  // If no history, synthesize from current score and profile
  if (history.length < 3) {
    const monthlyImprovement = profile?.monthlyImprovement || 0;
    history = [];
    for (let i = 5; i >= 0; i--) {
      history.push(Math.max(0, currentScore - i * 2 + monthlyImprovement * i));
    }
  }

  const prediction = generatePrediction({ ...profile, currentScore }, history, { seasonPeriod });

  // Build trajectory path for charting
  const trajectory = history.map((v, i) => ({
    month: -(history.length - i),
    value: Math.round(v),
    actual: true
  }));

  // Add forecast points at regular intervals
  for (let d = 1; d <= 180; d += 10) {
    const f = prediction.horizons[d <= 30 ? "day30" : d <= 90 ? "day90" : "day180"];
    if (f) {
      trajectory.push({
        month: d / 30,
        value: f.p50,
        p5: f.p5,
        p95: f.p95,
        actual: false
      });
    }
  }

  return {
    day30: prediction.horizons.day30,
    day90: prediction.horizons.day90,
    day180: prediction.horizons.day180,
    confidence: prediction.confidence,
    model: prediction.model,
    modelType: prediction.modelType,
    modelMetrics: prediction.modelMetrics,
    ensemble: prediction.ensembleModel,
    ensembleModel: prediction.ensembleModel,
    allModels: prediction.allModels,
    modelGovernance: prediction.modelGovernance,
    trajectory,
    dataPoints: history.length,
    generatedAt: prediction.generatedAt
  };
}

// ============================================================
// SCENARIO SIMULATION (multi-parameter what-if)
// ============================================================

/**
 * Enhanced scenario simulation with multiple what-if parameter changes.
 * Supports adjusting income, expenses, savings, debt simultaneously.
 */
export function simulateScenario(currentState = {}, changes = {}, options = {}) {
  const {
    horizon = 180,
    iterations = 3 // Number of models to try
  } = options;

  const currentIncome = Number(currentState.monthlyIncome) || 0;
  const currentExpenses = Number(currentState.monthlyExpense || currentState.monthlySpending || 0);
  const currentSavings =
    Number(currentState.emergencySavingsFixed || 0) +
    Number(currentState.emergencySavingsDiscretionary || 0) +
    Number(currentState.savings || 0);
  const currentDebt = Number(currentState.totalDebt || 0);
  const currentScore = Number(currentState.currentScore || currentState.healthScore || 50);

  // Apply changes
  const incomeDelta = Number(changes.incomeDelta) || 0;
  const expenseDelta = Number(changes.expenseDelta) || 0;
  const savingsDelta = Number(changes.savingsDelta) || 0;
  const debtDelta = Number(changes.debtDelta) || 0;

  const newIncome = currentIncome + incomeDelta;
  const newExpenses = currentExpenses + expenseDelta;
  const newSavings = Math.max(0, currentSavings + savingsDelta);
  const newDebt = Math.max(0, currentDebt + debtDelta);

  // Build new cashflow
  const monthlyNet = newIncome - newExpenses;
  const runway = newExpenses > 0 ? newSavings / newExpenses : 0;

  // Simulate score trajectory
  // Synthesize history that reflects the current state, then apply changes
  const baseHistory = Array.from({ length: 6 }, (_, i) =>
    Math.max(0, currentScore - 10 + i * 2 - (i < 3 ? debtDelta * 0.01 : -savingsDelta * 0.005))
  );

  // Add the current score
  baseHistory.push(currentScore);

  // Create a modified history that reflects the scenario
  const scenarioHistory = baseHistory.map((v, i) => {
    // Apply scenario effect proportionally
    const effect = (incomeDelta - expenseDelta + savingsDelta * 0.5 - debtDelta * 0.3) / 10000;
    return Math.max(0, v + effect * (i / baseHistory.length));
  });

  // Generate prediction on scenario history
  const prediction = generatePrediction(
    { currentScore: scenarioHistory[scenarioHistory.length - 1] },
    scenarioHistory,
    { seasonPeriod: 0 }
  );

  // Also compute deterministic projections for comparison
  const scoreImpact = (incomeDelta - expenseDelta + savingsDelta * 0.5) / 1000;
  const debtImpact = debtDelta * -0.02;

  return {
    scenario: {
      name: changes.name || "Custom Scenario",
      description: changes.description || "",
      changes: {
        incomeDelta,
        expenseDelta,
        savingsDelta,
        debtDelta
      }
    },
    currentState: {
      income: currentIncome,
      expenses: currentExpenses,
      savings: currentSavings,
      debt: currentDebt,
      monthlyNet: currentIncome - currentExpenses,
      runway: currentExpenses > 0 ? (currentSavings / currentExpenses).toFixed(1) : "∞"
    },
    projectedState: {
      income: newIncome,
      expenses: newExpenses,
      savings: newSavings,
      debt: newDebt,
      monthlyNet,
      runway: runway.toFixed(1)
    },
    forecast: {
      day30: prediction.horizons.day30,
      day90: prediction.horizons.day90,
      day180: prediction.horizons.day180,
      model: prediction.model,
      confidence: prediction.confidence
    },
    impact: {
      monthlyNetDelta: monthlyNet - (currentIncome - currentExpenses),
      savingsDelta: newSavings - currentSavings,
      debtDelta: newDebt - currentDebt,
      runwayDelta:
        Math.round((runway - (currentExpenses > 0 ? currentSavings / currentExpenses : 0)) * 10) /
        10,
      scoreImpact: round2(scoreImpact + debtImpact),
      healthScoreProjection: clamp(Math.round(currentScore + scoreImpact + debtImpact))
    },
    recommendation: generateScenarioRecommendation(
      runway,
      monthlyNet,
      newDebt,
      currentScore + scoreImpact + debtImpact
    )
  };
}

function generateScenarioRecommendation(runway, monthlyNet, debt, projectedScore) {
  if (runway < 1) {
    return {
      text: "⚠️ Critical: This scenario would deplete your runway to less than 1 month.",
      severity: "critical",
      action: "Avoid this scenario or increase savings by ₹20,000+ before proceeding."
    };
  }
  if (runway < 3) {
    return {
      text: `⚠️ Warning: Runway drops to ${runway.toFixed(1)} months — below the safety threshold.`,
      severity: "high",
      action: "Build savings to at least 3x monthly expenses before making this change."
    };
  }
  if (monthlyNet <= 0 && debt > 0) {
    return {
      text: `⚠️ Negative cashflow with outstanding debt — risk of debt spiral.`,
      severity: "high",
      action: "Reduce expenses or increase income to achieve positive cashflow."
    };
  }
  if (runway >= 6 && monthlyNet > 0) {
    return {
      text: `✅ Scenario looks healthy: ${runway.toFixed(1)} months runway, positive cashflow.`,
      severity: "low",
      action: "Safe to proceed. Monitor for 30 days after implementation."
    };
  }
  return {
    text: `Scenario yields ${runway.toFixed(1)} months runway. Net cashflow: ₹${Math.round(monthlyNet)}/mo.`,
    severity: "medium",
    action:
      monthlyNet > 0
        ? "Maintain positive cashflow and build toward 6-month runway."
        : "Improve cashflow before proceeding."
  };
}

// ============================================================
// MULTI-SCENARIO COMPARISON
// ============================================================

/**
 * Run multiple scenario simulations and return a comparison.
 */
export function compareScenarios(currentState, scenarios = []) {
  if (!scenarios.length) {
    return [];
  }

  return scenarios.map(scenario => {
    const result = simulateScenario(currentState, scenario.changes, { horizon: 180 });
    return {
      name: scenario.name || result.scenario.name,
      description: scenario.description || "",
      projectedRunway: result.projectedState.runway,
      monthlyNet: result.projectedState.monthlyNet,
      projectedScore: result.impact.healthScoreProjection,
      scoreDelta: result.impact.scoreImpact,
      confidence: result.forecast.confidence,
      recommendation: result.recommendation
    };
  });
}

// ============================================================
// EXPORTS
// ============================================================

export { fallbackForecast };
