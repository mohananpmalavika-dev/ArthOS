function clamp(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeInput(value, fallback = 50) {
  if (typeof value === "number" && !Number.isNaN(value)) {
    if (value >= 0 && value <= 1) {
      return clamp(value * 100);
    }
    if (value >= 0 && value <= 10) {
      return clamp(value * 10);
    }
    return clamp(value);
  }
  return fallback;
}

export function detectBiases(user = {}) {
  return {
    presentBias: normalizeInput(user.presentFutureMindset ?? user.avoidFuturePlanning ?? 50),
    lossAversion: normalizeInput(user.lossAversion ?? user.holdingLosses ?? 50),
    optimismBias: normalizeInput(user.futureConfidence ?? user.overconfidence ?? 50),
    anchoringBias: normalizeInput(user.anchoring ?? 50),
    sunkCostBias: normalizeInput(user.sunkCost ?? 50)
  };
}

export function calculateRiskCalibration(perceivedRisk = 50, actualRisk = 50) {
  const p = normalizeInput(perceivedRisk);
  const a = normalizeInput(actualRisk);
  const gap = clamp(p - a);

  return {
    perceivedRisk: p,
    actualRisk: a,
    calibrationGap: gap,
    calibrated: Math.abs(p - a) <= 10,
    generatedAt: new Date().toISOString()
  };
}
