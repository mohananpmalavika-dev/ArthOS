// Cognition Layer - Blueprint-aligned profile builder and risk model

function clamp(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeInput(value, fallback = 50) {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    if (value >= 0 && value <= 1) return clamp(value * 100);
    if (value >= 0 && value <= 10) return clamp(value * 10);
    return clamp(value);
  }
  return fallback;
}

export function analyzeMoneyBeliefs(responses = {}) {
  const conservatism = normalizeInput(responses.riskAversion, 50);
  const scarcityBias = normalizeInput(responses.savingAnxiety, 50);
  const growthOrientation = normalizeInput(responses.investmentInterest, 50);

  return {
    conservatism,
    scarcityBias,
    growthOrientation,
    timestamp: new Date().toISOString(),
  };
}

export function buildCognitionProfile(user = {}) {
  const moneyBeliefs = {
    scarcityVsAbundance: normalizeInput(user.savingAnxiety || user.moneyScarcity || user.scarcityVsAbundance, 50),
    moneyAsIdentity: normalizeInput(user.moneyIdentity || 50),
    moneyAsSecurity: normalizeInput(user.moneySecurity || 50),
    moneyAsFreedom: normalizeInput(user.moneyFreedom || 50),
  };

  const cognitiveBiases = {
    presentBias: normalizeInput(user.avoidFuturePlanning || user.presentBias || 50),
    lossAversion: normalizeInput(user.holdingLosses || user.lossAversion || 50),
    optimismBias: normalizeInput(user.overconfidence || user.optimismBias || 50),
    sunkCostBias: normalizeInput(user.sunkCost || 50),
    anchoringBias: normalizeInput(user.anchoring || 50),
  };

  const perceivedRisk = normalizeInput(user.perceivedRisk || user.riskAversion || 50);
  const actualRisk = normalizeInput(
    user.actualRisk ||
      (user.monthlyExpense && user.monthlyIncome
        ? Math.max(0, Math.min(100, 100 - (user.monthlyExpense / Math.max(1, user.monthlyIncome)) * 100))
        : 50),
    50
  );

  const emotionalTriggers = {
    boredom: normalizeInput(user.boredomSpending || user.boredom || 50),
    stress: normalizeInput(user.stressLevel || user.stress || 50),
    socialPressure: normalizeInput(user.socialPressure || 50),
    celebration: normalizeInput(user.celebrationSpending || user.celebration || 50),
  };

  return {
    moneyBeliefs,
    cognitiveBiases,
    riskCalibration: {
      perceivedRisk,
      actualRisk,
      calibrationGap: clamp(Math.abs(perceivedRisk - actualRisk)),
    },
    emotionalTriggers,
    generatedAt: new Date().toISOString(),
  };
}

export function detectBiases(responses = {}, events = []) {
  const biases = {
    lossAversion: 0,
    presentBias: 0,
    optimismBias: 0,
    anchoring: 0,
  };

  if (normalizeInput(responses.holdingLosses) > 70) biases.lossAversion += 40;
  if (normalizeInput(responses.avoidFuturePlanning) > 60) biases.presentBias += 45;
  if (normalizeInput(responses.overconfidence) > 60) biases.optimismBias += 40;

  events.forEach((e) => {
    if (e.type === 'impulse_purchase') biases.presentBias += 8;
    if (e.type === 'ignored_recommendation') biases.anchoring += 6;
  });

  Object.keys(biases).forEach((k) => {
    biases[k] = clamp(biases[k]);
  });

  return biases;
}

export function calibrateRiskPerception(userProfile = {}, behaviourHistory = []) {
  const historyImpact = Math.min(30, behaviourHistory.length * 2);
  const perceivedRisk = normalizeInput(userProfile.perceivedRisk || userProfile.riskAversion || 50);
  const actualRisk = normalizeInput(
    userProfile.actualRisk ||
      (userProfile.monthlyExpense && userProfile.monthlyIncome
        ? Math.max(0, Math.min(100, 100 - (userProfile.monthlyExpense / Math.max(1, userProfile.monthlyIncome)) * 100))
        : 50)
  );

  return {
    perceivedRisk,
    actualRisk,
    calibrationGap: clamp(Math.abs(perceivedRisk - actualRisk) + historyImpact / 2),
    calibratedAt: new Date().toISOString(),
  };
}

export function getEmotionalTriggers(userProfile = {}, events = []) {
  const triggers = {
    boredom: normalizeInput(userProfile.boredomSpending || userProfile.boredom || 50),
    stress: normalizeInput(userProfile.stressLevel || userProfile.stress || 50),
    socialPressure: normalizeInput(userProfile.socialPressure || 50),
    celebration: normalizeInput(userProfile.celebrationSpending || userProfile.celebration || 50),
  };

  const nodes = Object.entries(triggers).map(([key, value]) => ({ id: key, intensity: value }));
  const edges = [];
  if (triggers.stress > 60) edges.push({ from: 'stress', to: 'moneyAsSecurity', weight: 0.8 });
  if (triggers.celebration > 60) edges.push({ from: 'celebration', to: 'moneyAsFreedom', weight: 0.7 });

  return { triggers, nodes, edges, generatedAt: new Date().toISOString() };
}

export function generateRiskScore(user = {}) {
  const profile = buildCognitionProfile(user);
  const calibration = calibrateRiskPerception(user, user.behaviourHistory || []);
  const biasPenalty = Object.values(profile.cognitiveBiases).reduce((sum, next) => sum + next, 0) / 5;
  const triggerRisk = (profile.emotionalTriggers.stress + profile.emotionalTriggers.socialPressure) / 2;
  const raw = 100 - ((calibration.perceivedRisk + biasPenalty + triggerRisk) / 3);
  const score = clamp(raw);
  return {
    riskScore: score,
    riskLevel: score > 70 ? 'High' : score > 40 ? 'Moderate' : 'Low',
    profile,
    calibratedAt: calibration.calibratedAt,
  };
}
