/**
 * L07: Financial Cognition Layer — v3 Production Upgrade
 *
 * Models money beliefs, cognitive biases, behavioural patterns, and emotional triggers
 * with weighted multi-factor analysis, Bayesian belief updating, temporal drift tracking,
 * and calibration history with server-side persistence.
 *
 * Blueprint spec: "Models money beliefs, cognitive biases, behavioural patterns"
 * Production features: Bayesian updating, drift detection, persistence-backed calibration.
 */

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

// ============================================================
// BAYESIAN BELIEF UPDATING
// ============================================================

/**
 * Bayesian update of a belief score given new evidence.
 * Uses a simple beta-distribution approximation:
 *   posterior_mean = (prior_weight * prior_mean + evidence_weight * evidence) / (prior_weight + evidence_weight)
 *
 * @param {number} prior - Previous belief score (0-100)
 * @param {number} evidence - New evidence score (0-100)
 * @param {number} priorWeight - Confidence in prior (higher = more stable)
 * @param {number} evidenceWeight - Weight of new evidence
 * @returns {number} Updated belief score
 */
export function bayesianBeliefUpdate(prior, evidence, priorWeight = 3, evidenceWeight = 1) {
  if (typeof prior !== "number" || typeof evidence !== "number") {
    return prior || evidence || 50;
  }
  const posterior =
    (priorWeight * clamp(prior) + evidenceWeight * clamp(evidence)) /
    (priorWeight + evidenceWeight);
  return Math.round(posterior);
}

/**
 * Compute Bayesian confidence interval (credible interval) around a belief score.
 * Narrower interval = higher confidence.
 * @param {number} score - Belief score (0-100)
 * @param {number} sampleSize - Number of observations
 * @returns {object} { lower, upper, width }
 */
export function credibleInterval(score, sampleSize) {
  const n = Math.max(1, sampleSize);
  const p = clamp(score) / 100;
  // Approximate standard error for a proportion
  const se = Math.sqrt((p * (1 - p)) / n) * 1.96; // 95% CI z-score
  const lower = clamp(Math.round((p - se) * 100));
  const upper = clamp(Math.round((p + se) * 100));
  return { lower, upper, width: upper - lower };
}

// ============================================================
// TEMPORAL DRIFT DETECTION
// ============================================================

/**
 * Detect belief drift by comparing recent belief estimates to historical average.
 * @param {Array<{score: number, timestamp: string}>} history - Chronological belief history
 * @param {number} currentScore - Most recent belief score
 * @returns {object} { drift, direction, significant }
 */
export function detectBeliefDrift(history, currentScore) {
  if (!Array.isArray(history) || history.length < 2) {
    return { drift: 0, direction: "stable", significant: false, historicalAverage: currentScore };
  }

  const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const recent = sorted.slice(-3); // Last 3 observations
  const historical = sorted.slice(0, -3);

  if (historical.length === 0) {
    return { drift: 0, direction: "stable", significant: false, historicalAverage: currentScore };
  }

  const historicalAvg = historical.reduce((s, h) => s + h.score, 0) / historical.length;
  const recentAvg = recent.reduce((s, h) => s + h.score, 0) / recent.length;
  const drift = Math.round(recentAvg - historicalAvg);

  return {
    drift,
    direction: drift > 10 ? "increasing" : drift < -10 ? "decreasing" : "stable",
    significant: Math.abs(drift) > 15,
    historicalAverage: Math.round(historicalAvg),
    recentAverage: Math.round(recentAvg)
  };
}

/**
 * Detect drift across all belief dimensions.
 * @param {object} beliefHistoryMap - { beliefName: [{score, timestamp}] }
 * @param {object} currentScores - { beliefName: score }
 * @returns {object} Drift analysis per dimension
 */
export function detectMultiDimensionDrift(beliefHistoryMap, currentScores) {
  const results = {};
  for (const [key, score] of Object.entries(currentScores)) {
    const history = beliefHistoryMap[key] || [];
    results[key] = detectBeliefDrift(history, score);
  }
  return results;
}

// ============================================================
// CALIBRATION HISTORY (Persisted)
// ============================================================

const CALIBRATION_HISTORY_KEY = "arth-os-calibration-history";
const BELIEF_HISTORY_KEY = "arth-os-belief-history";
const COGNITION_SNAPSHOT_KEY = "arth-os-cognition-snapshots";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeRead(key) {
  if (!isBrowser()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("[cognitionEngine] Failed to parse localStorage data:", {
      key,
      error: error?.message
    });
    return null;
  }
}

function safeWrite(key, value) {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("[cognitionEngine] Failed to persist calibration to localStorage:", {
      key,
      error: error?.message,
      code: error?.code
    });
  }
}

/**
 * Append a calibration record to persisted history.
 * @param {object} calibration - { perceivedRisk, actualRisk, calibrationGap, calibrated }
 * @returns {Array} Updated calibration history
 */
export function appendCalibrationHistory(calibration) {
  const history = safeRead(CALIBRATION_HISTORY_KEY) || [];
  history.push({
    ...calibration,
    timestamp: new Date().toISOString()
  });
  // Keep last 100 entries
  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }
  safeWrite(CALIBRATION_HISTORY_KEY, history);
  return history;
}

/**
 * Load full calibration history.
 * @returns {Array} Sorted by timestamp ascending
 */
export function loadCalibrationHistory() {
  const history = safeRead(CALIBRATION_HISTORY_KEY) || [];
  return history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

/**
 * Get calibration trend — is the user getting better calibrated over time?
 */
export function calibrationTrend() {
  const history = loadCalibrationHistory();
  if (history.length < 2) {
    return { trend: "insufficient_data", currentGap: null, improvement: null };
  }

  const recent = history.slice(-5);
  const older = history.slice(0, 5);
  const recentAvgGap = recent.reduce((s, c) => s + c.calibrationGap, 0) / recent.length;
  const olderAvgGap = older.reduce((s, c) => s + c.calibrationGap, 0) / older.length;
  const improvement = Math.round(olderAvgGap - recentAvgGap);

  return {
    trend: improvement > 5 ? "improving" : improvement < -5 ? "worsening" : "stable",
    currentGap: recent[recent.length - 1]?.calibrationGap || null,
    improvement,
    totalRecords: history.length
  };
}

/**
 * Record a belief observation to history for drift tracking.
 * @param {string} dimension - Belief dimension name
 * @param {number} score - Belief score
 */
export function recordBeliefObservation(dimension, score) {
  const history = safeRead(BELIEF_HISTORY_KEY) || {};
  if (!history[dimension]) {
    history[dimension] = [];
  }
  history[dimension].push({ score, timestamp: new Date().toISOString() });
  // Keep last 50 per dimension
  if (history[dimension].length > 50) {
    history[dimension].splice(0, history[dimension].length - 50);
  }
  safeWrite(BELIEF_HISTORY_KEY, history);
}

/**
 * Load belief observation history for all dimensions.
 */
export function loadBeliefHistory() {
  return safeRead(BELIEF_HISTORY_KEY) || {};
}

/**
 * Save a full cognition snapshot for trend analysis.
 */
export function saveCognitionSnapshot(profile) {
  const snapshots = safeRead(COGNITION_SNAPSHOT_KEY) || [];
  snapshots.push({
    ...profile,
    savedAt: new Date().toISOString()
  });
  if (snapshots.length > 30) {
    snapshots.splice(0, snapshots.length - 30);
  }
  safeWrite(COGNITION_SNAPSHOT_KEY, snapshots);
}

/**
 * Load cognition snapshot history.
 */
export function loadCognitionSnapshots() {
  return safeRead(COGNITION_SNAPSHOT_KEY) || [];
}

// ============================================================
// WEIGHT MATRIX: Maps questionnaire responses to belief/bias dimensions
// ============================================================

const BELIEF_MAP = [
  { source: "savingAnxiety", target: "scarcityVsAbundance", weight: 0.35, polarity: 1 },
  { source: "moneyScarcity", target: "scarcityVsAbundance", weight: 0.3, polarity: 1 },
  { source: "scarcityVsAbundance", target: "scarcityVsAbundance", weight: 0.5, polarity: 1 },
  { source: "moneyIdentity", target: "moneyAsIdentity", weight: 0.4, polarity: 1 },
  { source: "statusDriven", target: "moneyAsIdentity", weight: 0.35, polarity: 1 },
  { source: "socialInfluenceLevel", target: "moneyAsIdentity", weight: 0.25, polarity: 1 },
  { source: "moneySecurity", target: "moneyAsSecurity", weight: 0.4, polarity: 1 },
  { source: "fearOfPoverty", target: "moneyAsSecurity", weight: 0.35, polarity: 1 },
  { source: "moneyFreedom", target: "moneyAsFreedom", weight: 0.4, polarity: 1 },
  { source: "futureConfidence", target: "moneyAsFreedom", weight: 0.25, polarity: 1 },
  { source: "investmentInterest", target: "growthOrientation", weight: 0.45, polarity: 1 },
  { source: "presentFutureMindset", target: "growthOrientation", weight: 0.3, polarity: 1 }
];

const BIAS_MAP = [
  { source: "avoidFuturePlanning", target: "presentBias", weight: 0.4, polarity: 1 },
  { source: "presentBias", target: "presentBias", weight: 0.35, polarity: 1 },
  { source: "presentFutureMindset", target: "presentBias", weight: 0.25, polarity: -1 },
  { source: "holdingLosses", target: "lossAversion", weight: 0.4, polarity: 1 },
  { source: "lossAversion", target: "lossAversion", weight: 0.35, polarity: 1 },
  { source: "riskAversion", target: "lossAversion", weight: 0.25, polarity: 1 },
  { source: "overconfidence", target: "optimismBias", weight: 0.4, polarity: 1 },
  { source: "optimismBias", target: "optimismBias", weight: 0.35, polarity: 1 },
  { source: "futureConfidence", target: "optimismBias", weight: 0.25, polarity: 1 },
  { source: "anchoring", target: "anchoringBias", weight: 0.5, polarity: 1 },
  { source: "sunkCost", target: "sunkCostBias", weight: 0.5, polarity: 1 }
];

const TRIGGER_MAP = [
  { source: "spendWhenStressed", target: "stress", weight: 0.45 },
  { source: "stressLevel", target: "stress", weight: 0.3 },
  { source: "stress", target: "stress", weight: 0.25 },
  { source: "spendWhenBored", target: "boredom", weight: 0.45 },
  { source: "boredomSpending", target: "boredom", weight: 0.3 },
  { source: "boredom", target: "boredom", weight: 0.25 },
  { source: "socialInfluenceLevel", target: "socialPressure", weight: 0.45 },
  { source: "socialPressure", target: "socialPressure", weight: 0.3 },
  { source: "comparesLifestyleFreq", target: "socialPressure", weight: 0.25 },
  { source: "celebrationSpending", target: "celebration", weight: 0.45 },
  { source: "celebration", target: "celebration", weight: 0.3 },
  { source: "avoidBalanceDuringStress", target: "anxietyAvoidance", weight: 0.5 }
];

function weightedScore(sourceValues, map) {
  const scores = {};
  const weights = {};

  for (const entry of map) {
    const raw = normalizeInput(sourceValues[entry.source]);
    const val = entry.polarity ? clamp(raw * entry.polarity) : raw;
    scores[entry.target] = (scores[entry.target] || 0) + val * entry.weight;
    weights[entry.target] = (weights[entry.target] || 0) + entry.weight;
  }

  for (const key of Object.keys(scores)) {
    scores[key] = weights[key] > 0 ? clamp(Math.round(scores[key] / weights[key])) : 50;
  }

  return scores;
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Analyze money beliefs using weighted multi-factor model with Bayesian updating.
 * Returns belief dimension scores, credible intervals, and drift analysis.
 */
export function analyzeMoneyBeliefs(responses = {}, priorBeliefs = null) {
  const safe = responses || {};
  const rawScores = weightedScore(safe, BELIEF_MAP);

  // Apply Bayesian update if prior beliefs are provided
  const beliefScores = {};
  for (const [key, raw] of Object.entries(rawScores)) {
    const prior = priorBeliefs?.[key];
    if (prior !== undefined && prior !== null) {
      const priorWeight = priorBeliefs?.[`${key}_confidence`] || 3;
      beliefScores[key] = bayesianBeliefUpdate(prior, raw, priorWeight, 1);
    } else {
      beliefScores[key] = raw;
    }
    // Record for drift tracking
    recordBeliefObservation(key, beliefScores[key]);
  }

  const beliefs = [];
  if (beliefScores.scarcityVsAbundance > 65) {
    beliefs.push("Money as scarce resource — fear-driven conservation");
  }
  if (beliefScores.scarcityVsAbundance < 35) {
    beliefs.push("Money as abundant opportunity — growth-oriented mindset");
  }
  if (beliefScores.moneyAsIdentity > 65) {
    beliefs.push("Money as identity marker — status-driven financial behaviour");
  }
  if (beliefScores.moneyAsIdentity < 35) {
    beliefs.push("Money as neutral tool — utilitarian relationship with finances");
  }
  if (beliefScores.moneyAsSecurity > 65) {
    beliefs.push("Money as primary security — safety-driven accumulation");
  }
  if (beliefScores.moneyAsFreedom > 65) {
    beliefs.push("Money as freedom enabler — independence-driven financial goals");
  }
  if (beliefScores.growthOrientation > 65) {
    beliefs.push("Growth-oriented — believes money should work and multiply");
  }
  if (beliefScores.growthOrientation < 35) {
    beliefs.push("Conservation-oriented — believes retaining is safer than growing");
  }

  // Load history for drift
  const beliefHistory = loadBeliefHistory();
  const drift = detectMultiDimensionDrift(beliefHistory, beliefScores);

  return {
    beliefScores,
    beliefs,
    conservatism: clamp(
      (beliefScores.scarcityVsAbundance || 0) * 0.6 +
        (100 - (beliefScores.growthOrientation || 50)) * 0.4
    ),
    credibleIntervals: Object.fromEntries(
      Object.entries(beliefScores).map(([key, score]) => {
        const history = beliefHistory[key] || [];
        return [key, credibleInterval(score, history.length + 1)];
      })
    ),
    drift,
    bayesianUpdated: priorBeliefs !== null,
    timestamp: new Date().toISOString()
  };
}

/**
 * Build full cognition profile with all L07 dimensions.
 */
export function buildCognitionProfile(user = {}) {
  const priorBeliefs = user.priorBeliefScores || null;
  const moneyBeliefs = analyzeMoneyBeliefs(user, priorBeliefs).beliefScores;

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

  // Build trigger graph edges
  const edges = [];
  if (emotionalTriggers.stress > 60) {
    edges.push({
      from: "stress",
      to: "moneyAsSecurity",
      weight: 0.8,
      label: "Stress triggers security spending"
    });
  }
  if (emotionalTriggers.boredom > 60) {
    edges.push({
      from: "boredom",
      to: "moneyAsFreedom",
      weight: 0.7,
      label: "Boredom triggers freedom spending"
    });
  }
  if (emotionalTriggers.socialPressure > 60) {
    edges.push({
      from: "socialPressure",
      to: "moneyAsIdentity",
      weight: 0.75,
      label: "Social pressure drives identity spending"
    });
  }
  if (emotionalTriggers.celebration > 60) {
    edges.push({
      from: "celebration",
      to: "moneyAsFreedom",
      weight: 0.6,
      label: "Celebration spending as reward"
    });
  }
  if (emotionalTriggers.anxietyAvoidance > 60) {
    edges.push({
      from: "anxietyAvoidance",
      to: "moneyAsSecurity",
      weight: 0.85,
      label: "Anxiety avoidance reinforces security hoarding"
    });
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
        .filter(([, v]) => v > 30)
        .map(([id, intensity]) => ({ id, intensity })),
      edges
    },
    generatedAt: new Date().toISOString()
  };

  // Persist calibration history
  appendCalibrationHistory(profile.riskCalibration);

  // Persist cognition snapshot
  saveCognitionSnapshot(profile);

  return profile;
}

/**
 * Detect biases with behaviour event correlation and Bayesian updating.
 */
export function detectBiases(responses = {}, events = []) {
  const biases = weightedScore(responses, BIAS_MAP);

  // Amplify biases based on behavioural event patterns
  const eventImpacts = {
    impulse_purchase: { target: "presentBias", perEvent: 5, max: 30 },
    ignored_recommendation: { target: "anchoringBias", perEvent: 4, max: 25 },
    held_losing_investment: { target: "lossAversion", perEvent: 6, max: 35 },
    regret_spending: { target: "presentBias", perEvent: 3, max: 20 },
    overestimated_budget: { target: "optimismBias", perEvent: 5, max: 30 },
    avoided_checking: { target: "presentBias", perEvent: 4, max: 25 }
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
      const additional = Math.min(impact.max, count * impact.perEvent);
      biases[impact.target] = clamp(biases[impact.target] + additional);
    }
  }

  return biases;
}

/**
 * Calibrate risk perception with Bayesian updating and drift tracking.
 */
export function calibrateRiskPerception(userProfile = {}, behaviourHistory = []) {
  const historyImpact = Math.min(25, behaviourHistory.length * 1.5);
  const perceivedRisk = normalizeInput(userProfile.perceivedRisk || userProfile.riskAversion || 50);
  const actualRisk = normalizeInput(
    userProfile.actualRisk ||
      (userProfile.monthlyExpense && userProfile.monthlyIncome
        ? Math.max(
            0,
            Math.min(
              100,
              100 - (userProfile.monthlyExpense / Math.max(1, userProfile.monthlyIncome)) * 100
            )
          )
        : 50)
  );

  // Bayesian update: blend with historical calibration if available
  const calHistory = loadCalibrationHistory();
  const recentCals = calHistory.slice(-3);
  let bayesianRisk = perceivedRisk;
  if (recentCals.length > 0) {
    const avgGap = recentCals.reduce((s, c) => s + c.calibrationGap, 0) / recentCals.length;
    if (avgGap > 15 && recentCals.length >= 2) {
      // User has consistently been mis-calibrated — adjust perceived risk toward actual
      bayesianRisk = Math.round(perceivedRisk * 0.6 + actualRisk * 0.4);
    }
  }

  const overconfidenceEvents = behaviourHistory.filter(
    e =>
      e.type === "impulse_purchase" ||
      e.type === "overestimated_budget" ||
      e.type === "missed_payment"
  ).length;
  const calibrationDrift = Math.min(15, overconfidenceEvents * 2);

  const calibration = {
    perceivedRisk: bayesianRisk,
    actualRisk,
    calibrationGap: clamp(Math.abs(bayesianRisk - actualRisk) + calibrationDrift),
    calibrationDrift,
    calibrated: Math.abs(bayesianRisk - actualRisk) <= 10 && calibrationDrift <= 5,
    calibratedAt: new Date().toISOString()
  };

  appendCalibrationHistory(calibration);
  return calibration;
}

/**
 * Get emotional triggers with trigger graph construction and event overlay.
 */
export function getEmotionalTriggers(userProfile = {}, events = []) {
  const triggers = weightedScore(userProfile, TRIGGER_MAP);

  if (events.length > 0) {
    const triggerTypeMap = {
      stress: "stress",
      boredom: "boredom",
      social: "socialPressure",
      celebration: "celebration",
      anxiety: "anxietyAvoidance"
    };
    for (const event of events) {
      const triggerField = triggerTypeMap[event.trigger || event.category];
      if (triggerField && typeof event.intensity === "number") {
        triggers[triggerField] = clamp(triggers[triggerField] + Math.round(event.intensity * 0.3));
      }
    }
  }

  const nodes = Object.entries(triggers)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ id: key, intensity: value }));

  const edges = [];
  if (triggers.stress > 60) {
    edges.push({ from: "stress", to: "moneyAsSecurity", weight: 0.8 });
  }
  if (triggers.boredom > 60) {
    edges.push({ from: "boredom", to: "moneyAsFreedom", weight: 0.7 });
  }
  if (triggers.socialPressure > 60) {
    edges.push({ from: "socialPressure", to: "moneyAsIdentity", weight: 0.75 });
  }
  if (triggers.celebration > 60) {
    edges.push({ from: "celebration", to: "moneyAsFreedom", weight: 0.6 });
  }
  if (triggers.anxietyAvoidance > 60) {
    edges.push({ from: "anxietyAvoidance", to: "moneyAsSecurity", weight: 0.85 });
  }

  return { triggers, nodes, edges, generatedAt: new Date().toISOString() };
}

/**
 * Generate risk score from full cognition profile.
 * Uses weighted bias penalty, trigger risk, and calibration data.
 */
export function generateRiskScore(user = {}) {
  const profile = buildCognitionProfile(user);
  const calibration = calibrateRiskPerception(user, user.behaviourHistory || []);

  // Weighted bias penalty — some biases matter more than others
  const biasWeights = {
    presentBias: 0.3,
    lossAversion: 0.25,
    optimismBias: 0.2,
    anchoringBias: 0.15,
    sunkCostBias: 0.1
  };
  const biasPenalty = Object.entries(profile.cognitiveBiases).reduce(
    (sum, [key, val]) => sum + (biasWeights[key] || 0.2) * val,
    0
  );

  // Trigger risk factor
  const triggerRisk =
    (profile.emotionalTriggers.stress + profile.emotionalTriggers.socialPressure) / 2;

  // Calibration penalty — bigger gaps = higher risk
  const calibrationPenalty = profile.riskCalibration.calibrationGap * 0.3;

  const raw =
    100 -
    (calibration.perceivedRisk * 0.25 +
      biasPenalty * 0.35 +
      triggerRisk * 0.25 +
      calibrationPenalty);

  const score = clamp(Math.round(raw));

  return {
    riskScore: score,
    riskLevel: score > 70 ? "High" : score > 40 ? "Moderate" : "Low",
    profile,
    calibratedAt: calibration.calibratedAt,
    biasPenalty: clamp(Math.round(biasPenalty)),
    triggerRisk: clamp(Math.round(triggerRisk)),
    calibrationPenalty: clamp(Math.round(calibrationPenalty))
  };
}
