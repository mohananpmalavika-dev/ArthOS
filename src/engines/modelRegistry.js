const MODEL_REGISTRY = {
  "behavior-impulse-risk": {
    registryId: "arthos.behavior.impulse_spending_risk",
    displayName: "Impulse Spending Risk Classifier",
    family: "Logistic regression with rules fallback",
    version: "v2.1.0",
    previousVersion: "v2.0.2",
    trainingDate: "2026-06-12",
    validationAccuracy: 83,
    stage: "Production",
    owner: "Behavior Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.behavior.impulse_spending_risk:v2.0.2",
    inputSchema: "assessment-behavior-features@v2",
    outputSchema: "impulse-spending-risk@v1"
  },
  "behavior-savings-consistency": {
    registryId: "arthos.behavior.savings_consistency",
    displayName: "Savings Consistency Regressor",
    family: "Linear regression with rules fallback",
    version: "v2.1.0",
    previousVersion: "v2.0.2",
    trainingDate: "2026-06-12",
    validationAccuracy: 81,
    stage: "Production",
    owner: "Behavior Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.behavior.savings_consistency:v2.0.2",
    inputSchema: "assessment-behavior-features@v2",
    outputSchema: "savings-consistency-score@v1"
  },
  "behavior-stress-spending": {
    registryId: "arthos.behavior.stress_spending_risk",
    displayName: "Stress Spending Risk Classifier",
    family: "Rules-calibrated classifier",
    version: "v1.7.0",
    previousVersion: "v1.6.1",
    trainingDate: "2026-06-12",
    validationAccuracy: 80,
    stage: "Production",
    owner: "Behavior Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.behavior.stress_spending_risk:v1.6.1",
    inputSchema: "assessment-behavior-features@v2",
    outputSchema: "stress-spending-risk@v1"
  },
  "behavior-archetype-evolution": {
    registryId: "arthos.behavior.archetype_evolution",
    displayName: "Behavioral Archetype Evolution Model",
    family: "Temporal rules model",
    version: "v1.5.0",
    previousVersion: "v1.4.0",
    trainingDate: "2026-06-12",
    validationAccuracy: 76,
    stage: "Production",
    owner: "Behavior Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.behavior.archetype_evolution:v1.4.0",
    inputSchema: "assessment-history@v2",
    outputSchema: "archetype-evolution@v1"
  },
  churn: {
    registryId: "arthos.retention.churn_risk",
    displayName: "Churn Risk Scoring Model",
    family: "Weighted engagement classifier",
    version: "v2.3.0",
    previousVersion: "v2.2.1",
    trainingDate: "2026-06-12",
    validationAccuracy: 84,
    stage: "Production",
    owner: "Lifecycle Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.retention.churn_risk:v2.2.1",
    inputSchema: "engagement-assessment-history@v2",
    outputSchema: "churn-risk-score@v1"
  },
  clustering: {
    registryId: "arthos.segmentation.user_clusters",
    displayName: "Behavioral User Segmentation Model",
    family: "K-means with rules fallback",
    version: "v3.0.0",
    previousVersion: "v2.9.0",
    trainingDate: "2026-06-12",
    validationAccuracy: 88,
    stage: "Production",
    owner: "Segmentation Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.segmentation.user_clusters:v2.9.0",
    inputSchema: "assessment-feature-vector@v2",
    outputSchema: "behavioral-cluster-assignment@v1"
  },
  "financial-monte-carlo": {
    registryId: "arthos.financial_outcome.monte_carlo_projection",
    displayName: "Monte Carlo Wealth Projection Model",
    family: "Monte Carlo simulation",
    version: "v2.4.0",
    previousVersion: "v2.3.0",
    trainingDate: "2026-06-12",
    validationAccuracy: 86,
    stage: "Production",
    owner: "Financial Outcome Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.financial_outcome.monte_carlo_projection:v2.3.0",
    inputSchema: "financial-current-state@v2",
    outputSchema: "wealth-projection-distribution@v1"
  },
  "goal-achievement": {
    registryId: "arthos.financial_outcome.goal_achievement",
    displayName: "Goal Achievement Probability Model",
    family: "Cashflow projection model",
    version: "v1.9.0",
    previousVersion: "v1.8.2",
    trainingDate: "2026-06-12",
    validationAccuracy: 82,
    stage: "Production",
    owner: "Financial Outcome Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.financial_outcome.goal_achievement:v1.8.2",
    inputSchema: "goal-current-state@v2",
    outputSchema: "goal-achievement-probability@v1"
  },
  "portfolio-outcome": {
    registryId: "arthos.financial_outcome.portfolio_projection",
    displayName: "Portfolio Outcome Projection Model",
    family: "Expected return and volatility model",
    version: "v1.6.0",
    previousVersion: "v1.5.0",
    trainingDate: "2026-06-12",
    validationAccuracy: 79,
    stage: "Production",
    owner: "Financial Outcome Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.financial_outcome.portfolio_projection:v1.5.0",
    inputSchema: "portfolio-allocation@v1",
    outputSchema: "portfolio-outcome-scenarios@v1"
  },
  "runway-depletion": {
    registryId: "arthos.financial_outcome.runway_depletion",
    displayName: "Runway Depletion Risk Model",
    family: "Cashflow survival model",
    version: "v2.0.0",
    previousVersion: "v1.9.1",
    trainingDate: "2026-06-12",
    validationAccuracy: 87,
    stage: "Production",
    owner: "Financial Outcome Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.financial_outcome.runway_depletion:v1.9.1",
    inputSchema: "financial-current-state@v2",
    outputSchema: "runway-depletion-risk@v1"
  },
  "spending-behavior-outcome": {
    registryId: "arthos.financial_outcome.spending_behavior",
    displayName: "Spending Behavior Outcome Model",
    family: "Behavior-adjusted expense projection",
    version: "v1.8.0",
    previousVersion: "v1.7.0",
    trainingDate: "2026-06-12",
    validationAccuracy: 80,
    stage: "Production",
    owner: "Financial Outcome Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.financial_outcome.spending_behavior:v1.7.0",
    inputSchema: "assessment-financial-result@v2",
    outputSchema: "spending-behavior-outcome@v1"
  },
  "loan-default": {
    registryId: "arthos.banking.loan_default_risk",
    displayName: "Loan Default Risk Model",
    family: "Payment stress scorecard",
    version: "v1.3.0",
    previousVersion: "v1.2.1",
    trainingDate: "2026-06-12",
    validationAccuracy: 85,
    stage: "Production",
    owner: "Banking Risk Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.banking.loan_default_risk:v1.2.1",
    inputSchema: "borrower-payment-history@v1",
    outputSchema: "loan-default-probability@v1"
  },
  "holt-winters": {
    registryId: "arthos.health_forecast.holt_winters",
    displayName: "Holt-Winters Financial Health Forecaster",
    family: "Exponential smoothing",
    version: "v4.2.0",
    previousVersion: "v4.1.1",
    trainingDate: "2026-06-12",
    validationAccuracy: 94,
    stage: "Production",
    owner: "Risk Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.health_forecast.holt_winters:v4.1.1",
    inputSchema: "financial-health-score-history@v2",
    outputSchema: "health-forecast-horizons@v2"
  },
  arima: {
    registryId: "arthos.health_forecast.arima",
    displayName: "ARIMA Health Score Forecaster",
    family: "Time-series regression",
    version: "v3.8.0",
    previousVersion: "v3.7.2",
    trainingDate: "2026-06-12",
    validationAccuracy: 91,
    stage: "Production",
    owner: "Risk Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.health_forecast.arima:v3.7.2",
    inputSchema: "financial-health-score-history@v2",
    outputSchema: "health-forecast-horizons@v2"
  },
  "bayesian-structural": {
    registryId: "arthos.health_forecast.bayesian_structural",
    displayName: "Bayesian Structural Health Forecaster",
    family: "Bayesian structural time series",
    version: "v2.6.0",
    previousVersion: "v2.5.1",
    trainingDate: "2026-06-12",
    validationAccuracy: 89,
    stage: "Production",
    owner: "Risk Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.health_forecast.bayesian_structural:v2.5.1",
    inputSchema: "financial-health-score-history@v2",
    outputSchema: "health-forecast-horizons@v2"
  },
  "fallback-linear": {
    registryId: "arthos.health_forecast.linear_fallback",
    displayName: "Linear Trend Fallback Forecaster",
    family: "Deterministic fallback",
    version: "v1.4.0",
    previousVersion: "v1.3.0",
    trainingDate: "2026-06-12",
    validationAccuracy: 78,
    stage: "Contingency",
    owner: "Risk Intelligence",
    approvalStatus: "Approved for fallback",
    rollbackTarget: null,
    inputSchema: "financial-health-score-history@v2",
    outputSchema: "health-forecast-horizons@v2"
  },
  ensemble: {
    registryId: "arthos.health_forecast.ensemble_selector",
    displayName: "Multi-Model Ensemble Selector",
    family: "Inverse-error ensemble",
    version: "v4.0.0",
    previousVersion: "v3.9.0",
    trainingDate: "2026-06-12",
    validationAccuracy: 95,
    stage: "Production",
    owner: "Risk Intelligence",
    approvalStatus: "Approved",
    rollbackTarget: "arthos.health_forecast.ensemble_selector:v3.9.0",
    inputSchema: "financial-health-score-history@v2",
    outputSchema: "health-forecast-horizons@v2"
  },
  none: {
    registryId: "arthos.health_forecast.unavailable",
    displayName: "Forecast unavailable",
    family: "No model",
    version: "n/a",
    previousVersion: null,
    trainingDate: "n/a",
    validationAccuracy: 0,
    stage: "Unavailable",
    owner: "Risk Intelligence",
    approvalStatus: "Not scored",
    rollbackTarget: null,
    inputSchema: "financial-health-score-history@v2",
    outputSchema: "health-forecast-horizons@v2"
  }
};

function normalizeModelKey(modelType, modelName) {
  const value = `${modelType || ""} ${modelName || ""}`.toLowerCase();

  if (value.includes("impulse")) {
    return "behavior-impulse-risk";
  }
  if (value.includes("savings consistency")) {
    return "behavior-savings-consistency";
  }
  if (value.includes("stress spending")) {
    return "behavior-stress-spending";
  }
  if (value.includes("archetype")) {
    return "behavior-archetype-evolution";
  }
  if (value.includes("churn")) {
    return "churn";
  }
  if (value.includes("cluster") || value.includes("segmentation")) {
    return "clustering";
  }
  if (value.includes("monte carlo")) {
    return "financial-monte-carlo";
  }
  if (value.includes("goal achievement")) {
    return "goal-achievement";
  }
  if (value.includes("portfolio")) {
    return "portfolio-outcome";
  }
  if (value.includes("runway")) {
    return "runway-depletion";
  }
  if (value.includes("spending behavior")) {
    return "spending-behavior-outcome";
  }
  if (value.includes("loan default") || value.includes("default")) {
    return "loan-default";
  }
  if (value.includes("arima")) {
    return "arima";
  }
  if (value.includes("holt")) {
    return "holt-winters";
  }
  if (value.includes("bayesian")) {
    return "bayesian-structural";
  }
  if (value.includes("ensemble")) {
    return "ensemble";
  }
  if (value.includes("fallback") || value.includes("linear trend")) {
    return "fallback-linear";
  }
  if (value.includes("none")) {
    return "none";
  }

  return "fallback-linear";
}

function clampPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function deriveRuntimeAccuracy(metrics, fallbackAccuracy) {
  if (!metrics) {
    return fallbackAccuracy;
  }

  if (typeof metrics.mape === "number" && Number.isFinite(metrics.mape)) {
    return clampPercent(100 - metrics.mape);
  }

  if (typeof metrics.rmse === "number" && Number.isFinite(metrics.rmse)) {
    return clampPercent(100 - metrics.rmse);
  }

  if (typeof metrics.r2 === "number" && Number.isFinite(metrics.r2)) {
    return clampPercent(metrics.r2 * 100);
  }

  return fallbackAccuracy;
}

export function getModelRegistryRecord(modelType, modelName) {
  const key = normalizeModelKey(modelType, modelName);
  return {
    key,
    ...MODEL_REGISTRY[key]
  };
}

export function listModelRegistryRecords() {
  return Object.entries(MODEL_REGISTRY).map(([key, record]) => ({
    key,
    ...record,
    rollbackAvailable: Boolean(record.rollbackTarget),
    lineageId: `${record.registryId}:${record.version}`
  }));
}

export function getRegistrySummary() {
  const records = listModelRegistryRecords();
  return {
    registryVersion: "model-registry.v1",
    generatedAt: new Date().toISOString(),
    totalModels: records.length,
    productionModels: records.filter(record => record.stage === "Production").length,
    rollbackEnabledModels: records.filter(record => record.rollbackAvailable).length,
    records
  };
}

export function buildModelLineage({
  modelType,
  modelName,
  metrics,
  generatedAt,
  dataPoints,
  selected = false
} = {}) {
  const registryRecord = getModelRegistryRecord(modelType, modelName);
  const runtimeAccuracy = deriveRuntimeAccuracy(metrics, registryRecord.validationAccuracy);

  return {
    ...registryRecord,
    modelName: modelName || registryRecord.displayName,
    modelType: modelType || registryRecord.key,
    selected,
    runtimeAccuracy,
    metrics: metrics || {},
    dataPoints: dataPoints ?? 0,
    generatedAt: generatedAt || new Date().toISOString(),
    rollbackAvailable: Boolean(registryRecord.rollbackTarget),
    lineageId: `${registryRecord.registryId}:${registryRecord.version}`
  };
}

export function buildForecastGovernance({
  selectedModel,
  selectedModelType,
  selectedMetrics,
  allModels = [],
  ensemble,
  generatedAt,
  dataPoints
} = {}) {
  const selected = buildModelLineage({
    modelType: selectedModelType,
    modelName: selectedModel,
    metrics: selectedMetrics,
    generatedAt,
    dataPoints,
    selected: true
  });

  const candidates = allModels.map(model =>
    buildModelLineage({
      modelType: model.modelType || model.type || model.name,
      modelName: model.name,
      metrics: model.metrics,
      generatedAt,
      dataPoints,
      selected: Boolean(model.isBest)
    })
  );

  return {
    selected,
    candidates,
    ensemble: ensemble
      ? buildModelLineage({
          modelType: "ensemble",
          modelName: ensemble.name,
          metrics: { rmse: ensemble.rmse },
          generatedAt,
          dataPoints
        })
      : null
  };
}

export { MODEL_REGISTRY };
