function clamp(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeInput(value, fallback = 50) {
  if (typeof value === 'number' && !Number.isNaN(value)) {
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

export function createInMemoryCognitionStore() {
  const cognitionMemory = new Map();

  function getScope(scope = 'global') {
    if (!cognitionMemory.has(scope)) {
      cognitionMemory.set(scope, {
        calibrationHistory: [],
        beliefHistory: {},
        cognitionSnapshots: []
      });
    }
    return cognitionMemory.get(scope);
  }

  return {
    loadCalibrationHistory(scope = 'global') {
      return getScope(scope).calibrationHistory;
    },
    saveCalibrationHistory(scope = 'global', history = []) {
      getScope(scope).calibrationHistory = history.slice(-100);
      return getScope(scope).calibrationHistory;
    },
    loadBeliefHistory(scope = 'global') {
      return getScope(scope).beliefHistory;
    },
    saveBeliefHistory(scope = 'global', history = {}) {
      getScope(scope).beliefHistory = history;
      return getScope(scope).beliefHistory;
    },
    loadCognitionSnapshots(scope = 'global') {
      return getScope(scope).cognitionSnapshots;
    },
    saveCognitionSnapshots(scope = 'global', snapshots = []) {
      getScope(scope).cognitionSnapshots = snapshots.slice(-30);
      return getScope(scope).cognitionSnapshots;
    }
  };
}

const defaultStore = createInMemoryCognitionStore();

function getStore(options = {}) {
  return options.store || defaultStore;
}

function getScope(options = {}) {
  return options.scope || options.userId || 'global';
}

export function bayesianBeliefUpdate(prior, evidence, priorWeight = 3, evidenceWeight = 1) {
  if (typeof prior !== 'number' || typeof evidence !== 'number') {
    return typeof prior === 'number' ? prior : typeof evidence === 'number' ? evidence : 0.5;
  }

  const scale01 = prior <= 1 && evidence <= 1;
  const pPrior = scale01 ? prior : clamp(prior) / 100;
  const pEvidence = scale01 ? evidence : clamp(evidence) / 100;
  const posterior =
    (evidenceWeight * pPrior + priorWeight * pEvidence) / (priorWeight + evidenceWeight);

  return scale01 ? Number(Number(posterior).toFixed(3)) : Math.round(posterior * 100);
}

export function credibleInterval(score, sampleSize) {
  const n = Math.max(1, sampleSize);
  const p = clamp(score) / 100;
  const se = Math.sqrt((p * (1 - p)) / n) * 1.96;
  const lower = clamp(Math.round((p - se) * 100));
  const upper = clamp(Math.round((p + se) * 100));
  return { lower, upper, width: upper - lower };
}

export function detectBeliefDrift(history, currentScore) {
  if (!Array.isArray(history) || history.length < 2) {
    return {
      drifted: false,
      direction: 'stable',
      drift: 0,
      historicalAverage: typeof currentScore === 'number' ? currentScore : null
    };
  }

  const values = history
    .map(item => (typeof item === 'number' ? item : item.score))
    .filter(value => typeof value === 'number');
  if (values.length === 0) {
    return { drifted: false, direction: 'stable', drift: 0, historicalAverage: currentScore };
  }

  const historicalAvg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const drift = Number((currentScore - historicalAvg).toFixed(2));
  const direction = drift > 0 ? 'upward' : drift < 0 ? 'downward' : 'stable';

  return {
    drifted: Math.abs(drift) > 5,
    direction,
    drift,
    historicalAverage: Number(historicalAvg.toFixed(2)),
    recentAverage: Number(currentScore)
  };
}

export function detectMultiDimensionDrift(beliefHistoryMap, currentScores) {
  const results = {};
  for (const [key, score] of Object.entries(currentScores)) {
    results[key] = detectBeliefDrift(beliefHistoryMap[key] || [], score);
  }
  return results;
}

export function appendCalibrationHistory(calibration, options = {}) {
  const store = getStore(options);
  const scope = getScope(options);
  const history = [...(store.loadCalibrationHistory(scope) || [])];
  history.push({
    ...calibration,
    timestamp: new Date().toISOString()
  });
  return store.saveCalibrationHistory(scope, history);
}

export function loadCalibrationHistory(options = {}) {
  return [...(getStore(options).loadCalibrationHistory(getScope(options)) || [])].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
}

export function calibrationTrend(options = {}) {
  const history = loadCalibrationHistory(options);
  if (history.length < 2) {
    return { trend: 'insufficient_data', currentGap: null, improvement: null };
  }

  const recent = history.slice(-5);
  const older = history.slice(0, 5);
  const recentAvgGap = recent.reduce((sum, item) => sum + item.calibrationGap, 0) / recent.length;
  const olderAvgGap = older.reduce((sum, item) => sum + item.calibrationGap, 0) / older.length;
  const improvement = Math.round(olderAvgGap - recentAvgGap);

  return {
    trend: improvement > 5 ? 'improving' : improvement < -5 ? 'worsening' : 'stable',
    currentGap: recent[recent.length - 1]?.calibrationGap || null,
    improvement,
    totalRecords: history.length
  };
}

export function recordBeliefObservation(dimension, score, options = {}) {
  const store = getStore(options);
  const scope = getScope(options);
  const history = { ...(store.loadBeliefHistory(scope) || {}) };
  history[dimension] = [...(history[dimension] || []), { score, timestamp: new Date().toISOString() }].slice(-50);
  store.saveBeliefHistory(scope, history);
}

export function loadBeliefHistory(options = {}) {
  return getStore(options).loadBeliefHistory(getScope(options)) || {};
}

export function saveCognitionSnapshot(profile, options = {}) {
  const store = getStore(options);
  const scope = getScope(options);
  const snapshots = [...(store.loadCognitionSnapshots(scope) || [])];
  snapshots.push({
    ...profile,
    savedAt: new Date().toISOString()
  });
  store.saveCognitionSnapshots(scope, snapshots);
}

export function loadCognitionSnapshots(options = {}) {
  return getStore(options).loadCognitionSnapshots(getScope(options)) || [];
}

const BELIEF_MAP = [
  { source: 'savingAnxiety', target: 'scarcityVsAbundance', weight: 0.35, polarity: 1 },
  { source: 'moneyScarcity', target: 'scarcityVsAbundance', weight: 0.3, polarity: 1 },
  { source: 'scarcityVsAbundance', target: 'scarcityVsAbundance', weight: 0.5, polarity: 1 },
  { source: 'moneyIdentity', target: 'moneyAsIdentity', weight: 0.4, polarity: 1 },
  { source: 'statusDriven', target: 'moneyAsIdentity', weight: 0.35, polarity: 1 },
  { source: 'socialInfluenceLevel', target: 'moneyAsIdentity', weight: 0.25, polarity: 1 },
  { source: 'moneySecurity', target: 'moneyAsSecurity', weight: 0.4, polarity: 1 },
  { source: 'fearOfPoverty', target: 'moneyAsSecurity', weight: 0.35, polarity: 1 },
  { source: 'moneyFreedom', target: 'moneyAsFreedom', weight: 0.4, polarity: 1 },
  { source: 'futureConfidence', target: 'moneyAsFreedom', weight: 0.25, polarity: 1 },
  { source: 'investmentInterest', target: 'growthOrientation', weight: 0.45, polarity: 1 },
  { source: 'presentFutureMindset', target: 'growthOrientation', weight: 0.3, polarity: 1 }
];

const BIAS_MAP = [
  { source: 'avoidFuturePlanning', target: 'presentBias', weight: 0.4, polarity: 1 },
  { source: 'presentBias', target: 'presentBias', weight: 0.35, polarity: 1 },
  { source: 'presentFutureMindset', target: 'presentBias', weight: 0.25, polarity: -1 },
  { source: 'holdingLosses', target: 'lossAversion', weight: 0.4, polarity: 1 },
  { source: 'lossAversion', target: 'lossAversion', weight: 0.35, polarity: 1 },
  { source: 'riskAversion', target: 'lossAversion', weight: 0.25, polarity: 1 },
  { source: 'overconfidence', target: 'optimismBias', weight: 0.4, polarity: 1 },
  { source: 'optimismBias', target: 'optimismBias', weight: 0.35, polarity: 1 },
  { source: 'futureConfidence', target: 'optimismBias', weight: 0.25, polarity: 1 },
  { source: 'anchoring', target: 'anchoringBias', weight: 0.5, polarity: 1 },
  { source: 'sunkCost', target: 'sunkCostBias', weight: 0.5, polarity: 1 }
];

const TRIGGER_MAP = [
  { source: 'spendWhenStressed', target: 'stress', weight: 0.45 },
  { source: 'stressLevel', target: 'stress', weight: 0.3 },
  { source: 'stress', target: 'stress', weight: 0.25 },
  { source: 'spendWhenBored', target: 'boredom', weight: 0.45 },
  { source: 'boredomSpending', target: 'boredom', weight: 0.3 },
  { source: 'boredom', target: 'boredom', weight: 0.25 },
  { source: 'socialInfluenceLevel', target: 'socialPressure', weight: 0.45 },
  { source: 'socialPressure', target: 'socialPressure', weight: 0.3 },
  { source: 'comparesLifestyleFreq', target: 'socialPressure', weight: 0.25 },
  { source: 'celebrationSpending', target: 'celebration', weight: 0.45 },
  { source: 'celebration', target: 'celebration', weight: 0.3 },
  { source: 'avoidBalanceDuringStress', target: 'anxietyAvoidance', weight: 0.5 }
];

function weightedScore(sourceValues, map) {
  const scores = {};
  const weights = {};

  for (const entry of map) {
    const raw = normalizeInput(sourceValues[entry.source]);
    const value = entry.polarity ? clamp(raw * entry.polarity) : raw;
    scores[entry.target] = (scores[entry.target] || 0) + value * entry.weight;
    weights[entry.target] = (weights[entry.target] || 0) + entry.weight;
  }

  for (const key of Object.keys(scores)) {
    scores[key] = weights[key] > 0 ? clamp(Math.round(scores[key] / weights[key])) : 50;
  }

  return scores;
}

export function analyzeMoneyBeliefs(responses = {}, priorBeliefs = null, options = {}) {
  const rawScores = weightedScore(responses || {}, BELIEF_MAP);
  const beliefScores = {};

  for (const [key, raw] of Object.entries(rawScores)) {
    const prior = priorBeliefs?.[key];
    beliefScores[key] =
      prior !== undefined && prior !== null
        ? bayesianBeliefUpdate(prior, raw, priorBeliefs?.[`${key}_confidence`] || 3, 1)
        : raw;
    recordBeliefObservation(key, beliefScores[key], options);
  }

  const beliefs = [];
  if (beliefScores.scarcityVsAbundance > 65) beliefs.push('Money as scarce resource - fear-driven conservation');
  if (beliefScores.scarcityVsAbundance < 35) beliefs.push('Money as abundant opportunity - growth-oriented mindset');
  if (beliefScores.moneyAsIdentity > 65) beliefs.push('Money as identity marker - status-driven financial behaviour');
  if (beliefScores.moneyAsIdentity < 35) beliefs.push('Money as neutral tool - utilitarian relationship with finances');
  if (beliefScores.moneyAsSecurity > 65) beliefs.push('Money as primary security - safety-driven accumulation');
  if (beliefScores.moneyAsFreedom > 65) beliefs.push('Money as freedom enabler - independence-driven financial goals');
  if (beliefScores.growthOrientation > 65) beliefs.push('Growth-oriented - believes money should work and multiply');
  if (beliefScores.growthOrientation < 35) beliefs.push('Conservation-oriented - believes retaining is safer than growing');

  const beliefHistory = loadBeliefHistory(options);
  const drift = detectMultiDimensionDrift(beliefHistory, beliefScores);
  const extremism = {};
  for (const [key, value] of Object.entries(beliefScores)) {
    if (value >= 85 || value <= 15) {
      extremism[key] = value;
    }
  }

  return {
    beliefScores,
    beliefs,
    patterns: beliefs,
    extremism,
    conservatism: clamp(
      (beliefScores.scarcityVsAbundance || 0) * 0.6 +
        (100 - (beliefScores.growthOrientation || 50)) * 0.4
    ),
    credibleIntervals: Object.fromEntries(
      Object.entries(beliefScores).map(([key, score]) => [
        key,
        credibleInterval(score, (beliefHistory[key] || []).length + 1)
      ])
    ),
    drift,
    bayesianUpdated: priorBeliefs !== null,
    timestamp: new Date().toISOString()
  };
}

export function detectBiases(responses = {}, events = []) {
  const biases = weightedScore(responses, BIAS_MAP);
  const eventImpacts = {
    impulse_purchase: { target: 'presentBias', perEvent: 5, max: 30 },
    ignored_recommendation: { target: 'anchoringBias', perEvent: 4, max: 25 },
    held_losing_investment: { target: 'lossAversion', perEvent: 6, max: 35 },
    regret_spending: { target: 'presentBias', perEvent: 3, max: 20 },
    overestimated_budget: { target: 'optimismBias', perEvent: 5, max: 30 },
    avoided_checking: { target: 'presentBias', perEvent: 4, max: 25 }
  };

  const eventCounts = {};
  for (const event of events) {
    const key = event.type || event.event;
    if (key && eventImpacts[key]) {
      eventCounts[key] = (eventCounts[key] || 0) + 1;
    }
  }

  for (const [eventType, impact] of Object.entries(eventImpacts)) {
    const count = eventCounts[eventType] || 0;
    if (count > 0) {
      biases[impact.target] = clamp(biases[impact.target] + Math.min(impact.max, count * impact.perEvent));
    }
  }

  return biases;
}

export function calibrateRiskPerception(userProfile = {}, behaviourHistory = [], options = {}) {
  const perceivedRisk = normalizeInput(userProfile.perceivedRisk || userProfile.riskAversion || 50);
  const actualRisk = normalizeInput(
    userProfile.actualRisk ||
      (userProfile.monthlyExpense && userProfile.monthlyIncome
        ? Math.max(
            0,
            Math.min(100, 100 - (userProfile.monthlyExpense / Math.max(1, userProfile.monthlyIncome)) * 100)
          )
        : 50)
  );

  const recentCals = loadCalibrationHistory(options).slice(-3);
  let bayesianRisk = perceivedRisk;
  if (recentCals.length > 0) {
    const avgGap = recentCals.reduce((sum, item) => sum + item.calibrationGap, 0) / recentCals.length;
    if (avgGap > 15 && recentCals.length >= 2) {
      bayesianRisk = Math.round(perceivedRisk * 0.6 + actualRisk * 0.4);
    }
  }

  const overconfidenceEvents = behaviourHistory.filter(
    event =>
      event.type === 'impulse_purchase' ||
      event.type === 'overestimated_budget' ||
      event.type === 'missed_payment'
  ).length;
  const calibrationDrift = Math.min(15, overconfidenceEvents * 2);
  const calibration = {
    perceivedRisk: bayesianRisk,
    actualRisk,
    calibrationGap: clamp(Math.abs(bayesianRisk - actualRisk) + calibrationDrift),
    calibrationDrift,
    calibrated: Math.abs(bayesianRisk - actualRisk) <= 10 && calibrationDrift <= 5,
    calibratedAt: new Date().toISOString(),
    adjustedRiskTolerance: Math.max(0, Math.min(1, bayesianRisk / 100))
  };

  appendCalibrationHistory(calibration, options);
  return calibration;
}

export function getEmotionalTriggers(userProfile = {}, events = []) {
  const triggers = weightedScore(userProfile, TRIGGER_MAP);
  const triggerTypeMap = {
    stress: 'stress',
    boredom: 'boredom',
    social: 'socialPressure',
    celebration: 'celebration',
    anxiety: 'anxietyAvoidance'
  };

  for (const event of events) {
    const triggerField = triggerTypeMap[event.trigger || event.category];
    if (triggerField && typeof event.intensity === 'number') {
      triggers[triggerField] = clamp(triggers[triggerField] + Math.round(event.intensity * 0.3));
    }
  }

  const nodes = Object.entries(triggers)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({ id: key, intensity: value }));
  const edges = [];
  if (triggers.stress > 60) edges.push({ from: 'stress', to: 'moneyAsSecurity', weight: 0.8 });
  if (triggers.boredom > 60) edges.push({ from: 'boredom', to: 'moneyAsFreedom', weight: 0.7 });
  if (triggers.socialPressure > 60) edges.push({ from: 'socialPressure', to: 'moneyAsIdentity', weight: 0.75 });
  if (triggers.celebration > 60) edges.push({ from: 'celebration', to: 'moneyAsFreedom', weight: 0.6 });
  if (triggers.anxietyAvoidance > 60) edges.push({ from: 'anxietyAvoidance', to: 'moneyAsSecurity', weight: 0.85 });

  return { triggers, nodes, edges, generatedAt: new Date().toISOString() };
}

export function generateRiskScore(user = {}, options = {}) {
  const cognitiveBiases = weightedScore(user, BIAS_MAP);
  const emotionalTriggers = weightedScore(user, TRIGGER_MAP);
  const calibration = calibrateRiskPerception(user, user.behaviourHistory || [], options);
  const biasWeights = {
    presentBias: 0.3,
    lossAversion: 0.25,
    optimismBias: 0.2,
    anchoringBias: 0.15,
    sunkCostBias: 0.1
  };

  const biasPenalty = Object.entries(cognitiveBiases).reduce(
    (sum, [key, value]) => sum + (biasWeights[key] || 0.2) * value,
    0
  );
  const triggerRisk = (emotionalTriggers.stress || 0) + (emotionalTriggers.socialPressure || 0);
  const triggerFactor = triggerRisk > 0 ? triggerRisk / 2 : 0;
  const calibrationPenalty = (calibration.calibrationGap || 0) * 0.3;
  let additionalRisk = 0;

  if (user.income && /variable|unstable|highly_variable/i.test(String(user.income))) additionalRisk += 10;
  if (user.debt && /significant|high/i.test(String(user.debt))) additionalRisk += 15;
  if (user.emergency_savings && /none|0|zero/i.test(String(user.emergency_savings))) additionalRisk += 10;

  return clamp(
    Math.round(
      (calibration.perceivedRisk || 50) * 0.25 +
        biasPenalty * 0.35 +
        triggerFactor * 0.25 +
        calibrationPenalty +
        additionalRisk
    )
  );
}

function riskLevelForScore(score) {
  if (score >= 75) {
    return 'high';
  }
  if (score >= 45) {
    return 'medium';
  }
  return 'low';
}

export function buildRiskProfile(user = {}, options = {}) {
  const profile = buildCognitionProfile(user, options);
  const riskScore = typeof profile.riskPerception === 'number' ? profile.riskPerception : generateRiskScore(user, options);

  return {
    contractVersion: 'cognition.risk-profile.v1',
    riskScore,
    riskLevel: riskLevelForScore(riskScore),
    profile
  };
}

export function buildCognitionProfile(user = {}, options = {}) {
  const priorBeliefs = user.priorBeliefScores || null;
  const beliefsData = analyzeMoneyBeliefs(user, priorBeliefs, options);
  const moneyBeliefs = beliefsData.beliefScores;
  const cognitiveBiases = weightedScore(user, BIAS_MAP);
  const perceivedRisk = normalizeInput(user.perceivedRisk || user.riskAversion || 50);
  const actualRisk = normalizeInput(
    user.actualRisk ||
      (user.monthlyExpense && user.monthlyIncome
        ? Math.max(
            0,
            Math.min(100, 100 - (user.monthlyExpense / Math.max(1, user.monthlyIncome)) * 100)
          )
        : 50),
    50
  );
  const emotionalTriggers = weightedScore(user, TRIGGER_MAP);
  const edges = [];
  if (emotionalTriggers.stress > 60) {
    edges.push({ from: 'stress', to: 'moneyAsSecurity', weight: 0.8, label: 'Stress triggers security spending' });
  }
  if (emotionalTriggers.boredom > 60) {
    edges.push({ from: 'boredom', to: 'moneyAsFreedom', weight: 0.7, label: 'Boredom triggers freedom spending' });
  }
  if (emotionalTriggers.socialPressure > 60) {
    edges.push({ from: 'socialPressure', to: 'moneyAsIdentity', weight: 0.75, label: 'Social pressure drives identity spending' });
  }
  if (emotionalTriggers.celebration > 60) {
    edges.push({ from: 'celebration', to: 'moneyAsFreedom', weight: 0.6, label: 'Celebration spending as reward' });
  }
  if (emotionalTriggers.anxietyAvoidance > 60) {
    edges.push({ from: 'anxietyAvoidance', to: 'moneyAsSecurity', weight: 0.85, label: 'Anxiety avoidance reinforces security hoarding' });
  }

  const profile = {
    moneyBeliefs,
    cognitiveBiases,
    riskCalibration: {
      perceivedRisk,
      actualRisk,
      calibrationGap: clamp(Math.abs(perceivedRisk - actualRisk)),
      calibrated: Math.abs(perceivedRisk - actualRisk) <= 10
    },
    emotionalTriggers,
    triggerGraph: {
      nodes: Object.entries(emotionalTriggers)
        .filter(([, value]) => value > 30)
        .map(([id, intensity]) => ({ id, intensity })),
      edges
    },
    generatedAt: new Date().toISOString()
  };

  appendCalibrationHistory(profile.riskCalibration, options);
  saveCognitionSnapshot(profile, options);

  const calibration = calibrateRiskPerception(user, user.behaviourHistory || [], options);
  const riskPerception = generateRiskScore(user, options);
  const beliefs = {
    moneyBeliefs: Object.entries(beliefsData.beliefScores || {}).map(([dimension, score]) => ({
      dimension,
      score
    })),
    patterns: beliefsData.beliefs || [],
    extremism: {}
  };

  return {
    contractVersion: 'cognition.profile.v1',
    ...profile,
    beliefs,
    calibration: {
      ...calibration,
      accuracy: Math.max(0, Math.min(1, 1 - (calibration.calibrationGap || 0) / 100)),
      adjustedRiskTolerance: calibration.adjustedRiskTolerance ?? calibration.perceivedRisk / 100
    },
    riskPerception: typeof riskPerception === 'number' ? riskPerception : riskPerception || 0
  };
}

export function createCognitionService(options = {}) {
  return {
    analyzeMoneyBeliefs(responses, priorBeliefs) {
      return analyzeMoneyBeliefs(responses, priorBeliefs, options);
    },
    buildCognitionProfile(user) {
      return buildCognitionProfile(user, options);
    },
    detectBiases,
    calibrateRiskPerception(userProfile, behaviourHistory) {
      return calibrateRiskPerception(userProfile, behaviourHistory, options);
    },
    getEmotionalTriggers,
    generateRiskScore(user) {
      return generateRiskScore(user, options);
    },
    buildRiskProfile(user) {
      return buildRiskProfile(user, options);
    },
    calibrationTrend() {
      return calibrationTrend(options);
    },
    loadBeliefHistory() {
      return loadBeliefHistory(options);
    },
    loadCognitionSnapshots() {
      return loadCognitionSnapshots(options);
    }
  };
}

export default {
  createCognitionService,
  createInMemoryCognitionStore,
  bayesianBeliefUpdate,
  credibleInterval,
  detectBeliefDrift,
  detectMultiDimensionDrift,
  appendCalibrationHistory,
  loadCalibrationHistory,
  calibrationTrend,
  recordBeliefObservation,
  loadBeliefHistory,
  saveCognitionSnapshot,
  loadCognitionSnapshots,
  analyzeMoneyBeliefs,
  buildCognitionProfile,
  detectBiases,
  calibrateRiskPerception,
  getEmotionalTriggers,
  generateRiskScore,
  buildRiskProfile
};
