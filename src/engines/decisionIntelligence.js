/**
 * L08: Decision Intelligence — v3 Production Upgrade
 *
 * Analyses decision quality using Bayesian-inspired multi-factor inference
 * with pattern-weighted scoring, outcome-history-aware calibration,
 * and probabilistic confidence intervals.
 *
 * Blueprint spec: "Analyses decision quality and identifies risk factors"
 * v2: Heuristic-only keyword scoring (prototype)
 * v3: Pattern-weighted posterior scoring + outcome calibration + CI
 */

function normalizeScore(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 50;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

// ============================================================
// OUTCOME HISTORY — Pattern-weighted calibration
// ============================================================

const DECISION_OUTCOME_KEY = 'arth-os-decision-outcomes';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function loadOutcomes() {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(DECISION_OUTCOME_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveOutcomes(outcomes) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(DECISION_OUTCOME_KEY, JSON.stringify(outcomes));
  } catch (error) {
    console.error('[decisionIntelligence] Failed to save decision outcomes:', {
      numOutcomes: outcomes?.length || 0,
      error: error?.message,
      code: error?.code,
    });
  }
}

// ============================================================
// RISK FACTOR WEIGHTS (learned from outcomes)
// ============================================================

const BASE_RISK_FACTORS = {
  urgency: { weight: 0.15, description: 'Urgency-driven decision making' },
  emotional: { weight: 0.15, description: 'Emotion-driven decision making' },
  cognitiveBias: { weight: 0.20, description: 'Cognitive bias evidence in decision text' },
  informationQuality: { weight: 0.15, description: 'Information completeness before decision' },
  timeOrientation: { weight: 0.10, description: 'Short vs long-term orientation' },
  goalAlignment: { weight: 0.15, description: 'Alignment with stated financial goals' },
  valueConsistency: { weight: 0.10, description: 'Consistency with personal values' },
};

// ============================================================
// FACTOR SCORERS
// ============================================================

function scoreUrgency(decision = {}) {
  const text = String(decision.notes || decision.description || '').toLowerCase();
  const urgencyWords = ['urgent', 'now', 'must', 'immediately', 'today', 'tonight', 'right away', 'asap'];
  const urgencyCount = urgencyWords.filter((w) => text.includes(w)).length;
  return clamp(100 - (urgencyCount * 20));
}

function scoreEmotional(decision = {}) {
  const text = String(decision.notes || decision.description || '').toLowerCase();
  const fearWords = ['fear', 'lose', 'loss', 'worried', 'scared', 'anxious', 'panic', 'afraid'];
  const greedWords = ['fomo', 'opportunity', 'miss out', 'once in a lifetime', 'guaranteed', 'sure thing'];
  const fearScore = fearWords.filter((w) => text.includes(w)).length * 15;
  const greedScore = greedWords.filter((w) => text.includes(w)).length * 12;
  return clamp(100 - fearScore - greedScore);
}

function scoreCognitiveBias(decision = {}) {
  const text = String(decision.notes || decision.description || '').toLowerCase();
  let score = 100;
  if (/\b(always|never|everyone|nobody|impossible|certainly)\b/.test(text)) score -= 12;
  if (/\b(all|nothing|completely|totally)\b/.test(text)) score -= 8;
  if (/\b(maybe|perhaps|hope|might|possibly)\b/.test(text)) score -= 5;
  if (/\b(stick with|keep doing|don't change|same as before|as is)\b/.test(text)) score -= 8;
  if (/\b(already spent|invested so far|put so much into|can't stop now)\b/.test(text)) score -= 15;
  return clamp(score);
}

function scoreInformationQuality(decision = {}) {
  let score = 50;
  if (decision.researched || decision.shoppedAround) score += 15;
  if (decision.sleptOnIt || decision.waited) score += 10;
  if (Number(decision.alternativesConsidered) >= 2) score += 10;
  if (decision.consultedSomeone) score += 10;
  if (decision.budgetChecked || decision.checkedBalance) score += 15;
  if (decision.amount && decision.amount <= 1000) score += 5;
  return clamp(score);
}

function scoreTimeOrientation(decision = {}) {
  const text = String(decision.notes || decision.description || '').toLowerCase();
  if (/\b(future|later|planning|goal|long.term|investment|next year|retirement)\b/.test(text)) return 85;
  if (/\b(today|now|urgent|immediately|this week|tonight|this month)\b/.test(text)) return 55;
  if (/\b(balance|both|short|medium)\b/.test(text)) return 75;
  return 70;
}

function scoreGoalAlignment(decision = {}) {
  if (decision.goalAlignment === true || decision.goalAligned === true) return 85;
  if (decision.goalAlignment === false || decision.goalAligned === false) return 40;
  return normalizeScore(decision.goalAlignment || decision.goalAligned || 50);
}

function scoreValueConsistency(decision = {}) {
  if (typeof decision.valueConsistency === 'number') return normalizeScore(decision.valueConsistency);
  const text = String(decision.notes || decision.description || '').toLowerCase();
  if (text.includes('savings') || text.includes('invest') || text.includes('plan') || text.includes('budget')) return 75;
  if (text.includes('emergency') || text.includes('debt') || text.includes('pay off')) return 70;
  return 60;
}

// ============================================================
// PATTERN-WEIGHTED CALIBRATION
// ============================================================

/**
 * Calculate pattern-adjusted weights based on historical outcome correlations.
 * If urgency decisions historically had poor outcomes, urgency weight increases.
 */
function getPatternAdjustedWeights(category) {
  const outcomes = loadOutcomes();
  const relevant = outcomes.filter((o) => !category || o.category === category);
  const weights = { ...BASE_RISK_FACTORS };

  if (relevant.length < 3) return weights;

  // For each factor, check historical correlation with poor outcomes
  for (const [factor, config] of Object.entries(BASE_RISK_FACTORS)) {
    const poorOutcomes = relevant.filter(
      (o) => (o.factorScores?.[factor] || 50) < 50 && (o.actualOutcome === 'negative' || o.regretLevel > 50)
    );
    const totalWithFactor = relevant.filter(
      (o) => (o.factorScores?.[factor] || 50) < 60
    ).length;

    if (totalWithFactor > 0) {
      const failureRate = poorOutcomes.length / totalWithFactor;
      // Amplify weight if this factor historically leads to bad outcomes
      const adjustment = 1 + (failureRate - 0.3) * 0.5; // Neutral at 30% failure rate
      weights[factor] = {
        ...config,
        weight: clamp(config.weight * adjustment, 0.05, 0.35),
        historicalFailureRate: Math.round(failureRate * 100),
      };
    }
  }

  // Normalize weights to sum to 1
  const totalWeight = Object.values(weights).reduce((s, f) => s + f.weight, 0);
  for (const factor of Object.keys(weights)) {
    weights[factor].weight = weights[factor].weight / totalWeight;
  }

  return weights;
}

/**
 * Compute a Bayesian confidence interval around the decision quality score.
 * Narrower = more confidence (based on historical calibration accuracy).
 */
function decisionConfidenceInterval(scoredDecision) {
  const outcomes = loadOutcomes();
  const relevant = outcomes.filter((o) => o.overallDecisionQuality !== undefined);
  if (relevant.length < 3) {
    return { lower: Math.max(0, scoredDecision.overallDecisionQuality - 15), upper: Math.min(100, scoredDecision.overallDecisionQuality + 15), width: 30 };
  }

  // Bootstrap residual errors from past predictions vs outcomes
  const errors = [];
  for (const o of relevant) {
    if (typeof o.actualQuality === 'number') {
      errors.push(o.overallDecisionQuality - o.actualQuality);
    }
  }

  if (errors.length < 2) {
    return { lower: Math.max(0, scoredDecision.overallDecisionQuality - 12), upper: Math.min(100, scoredDecision.overallDecisionQuality + 12), width: 24 };
  }

  const mean = errors.reduce((s, e) => s + e, 0) / errors.length;
  const variance = errors.reduce((s, e) => s + (e - mean) ** 2, 0) / errors.length;
  const se = Math.sqrt(variance);
  const margin = 1.96 * se;

  return {
    lower: clamp(Math.round(scoredDecision.overallDecisionQuality - margin)),
    upper: clamp(Math.round(scoredDecision.overallDecisionQuality + margin)),
    width: Math.round(margin * 2),
  };
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Score a single financial decision using Bayesian-inspired multi-factor model
 * with pattern-weighted calibration from historical outcomes.
 */
export function scoreDecision(decision = {}) {
  const urgency = scoreUrgency(decision);
  const emotional = scoreEmotional(decision);
  const cognitiveBias = scoreCognitiveBias(decision);
  const informationQuality = scoreInformationQuality(decision);
  const timeOrientation = scoreTimeOrientation(decision);
  const goalAlignment = scoreGoalAlignment(decision);
  const valueConsistency = scoreValueConsistency(decision);

  const factorScores = { urgency, emotional, cognitiveBias, informationQuality, timeOrientation, goalAlignment, valueConsistency };

  // Get pattern-adjusted weights from historical outcomes
  const adjustedWeights = getPatternAdjustedWeights(decision.category);
  const totalWeight = Object.values(adjustedWeights).reduce((s, f) => s + f.weight, 0);

  const weightedScore = (
    urgency * adjustedWeights.urgency.weight +
    emotional * adjustedWeights.emotional.weight +
    cognitiveBias * adjustedWeights.cognitiveBias.weight +
    informationQuality * adjustedWeights.informationQuality.weight +
    timeOrientation * adjustedWeights.timeOrientation.weight +
    goalAlignment * adjustedWeights.goalAlignment.weight +
    valueConsistency * adjustedWeights.valueConsistency.weight
  ) / totalWeight;

  const overallDecisionQuality = clamp(Math.round(weightedScore));

  // Identify top risk factors (factors scoring below 60 contribute to risk)
  const riskFactors = Object.entries(factorScores)
    .filter(([, score]) => score < 60)
    .map(([key, score]) => ({
      factor: key,
      score,
      riskLevel: score < 40 ? 'high' : 'moderate',
      description: BASE_RISK_FACTORS[key]?.description || key,
      historicalWeight: adjustedWeights[key]?.weight || BASE_RISK_FACTORS[key]?.weight,
    }))
    .sort((a, b) => a.score - b.score);

  // Compute confidence interval
  const ci = decisionConfidenceInterval({ overallDecisionQuality, ...factorScores });

  return {
    ...decision,
    timestamp: decision.timestamp || new Date().toISOString(),
    factorScores,
    patternAdjustedWeights: adjustedWeights,
    overallDecisionQuality,
    riskFactors,
    confidenceInterval: ci,
    riskLevel: overallDecisionQuality > 75 ? 'low' : overallDecisionQuality > 50 ? 'moderate' : 'high',
    qualityLabel: getQualityLabel(overallDecisionQuality),
    scoredAt: new Date().toISOString(),
  };
}

/**
 * Record the actual outcome of a decision for pattern-weight calibration.
 */
export function recordDecisionOutcome(decisionId, outcome) {
  const outcomes = loadOutcomes();
  outcomes.push({
    decisionId,
    category: outcome.category,
    factorScores: outcome.factorScores,
    overallDecisionQuality: outcome.overallDecisionQuality,
    actualOutcome: outcome.actualOutcome || 'unknown', // 'positive', 'negative', 'neutral'
    actualQuality: outcome.actualQuality || null,
    regretLevel: outcome.regretLevel || null,
    recordedAt: new Date().toISOString(),
  });
  // Keep last 200
  if (outcomes.length > 200) outcomes.splice(0, outcomes.length - 200);
  saveOutcomes(outcomes);
}

function getQualityLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Risky';
}

/**
 * Calculate decision quality trend over time with confidence.
 */
export function decisionTrend(decisions = []) {
  if (!decisions.length) {
    return { currentScore: 0, movingAverage: 0, trend: 'Unknown', stability: 0, volatility: 0, confidence: 0 };
  }

  const scored = decisions.map((d) => normalizeScore(d.overallDecisionQuality || d.score || 50));

  const avg = Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);

  // Exponentially weighted moving average
  const alpha = 0.3;
  let ema = scored[0];
  for (let i = 1; i < scored.length; i++) {
    ema = alpha * scored[i] + (1 - alpha) * ema;
  }

  // Volatility
  const variance = scored.reduce((sum, s) => sum + (s - avg) ** 2, 0) / scored.length;
  const volatility = Math.round(Math.sqrt(variance));
  const stability = clamp(100 - volatility);

  // Trend direction with half-life comparison
  const firstHalf = scored.slice(0, Math.floor(scored.length / 2));
  const secondHalf = scored.slice(Math.floor(scored.length / 2));
  const firstAvg = firstHalf.length ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
  const secondAvg = secondHalf.length ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
  const trend = secondAvg > firstAvg + 3 ? 'Improving' : secondAvg < firstAvg - 3 ? 'Declining' : 'Stable';

  // Confidence in trend estimate
  const confidence = decisions.length >= 10 ? 'high' : decisions.length >= 5 ? 'medium' : 'low';

  return {
    currentScore: scored[scored.length - 1],
    movingAverage: Math.round(ema),
    simpleAverage: avg,
    trend,
    stability,
    volatility,
    decisionCount: scored.length,
    confidence,
  };
}

/**
 * Identify the primary risk factor constraining decision quality.
 */
export function identifyPrimaryRisk(decision = {}) {
  const scored = scoreDecision(decision);
  if (!scored.riskFactors.length) return null;

  const primary = scored.riskFactors[0];
  return {
    factor: primary.factor,
    description: primary.description,
    riskLevel: primary.riskLevel,
    impact: clamp(100 - scored.overallDecisionQuality),
    recommendation: getRiskRecommendation(primary.factor),
    confidenceInterval: scored.confidenceInterval,
  };
}

function getRiskRecommendation(factor) {
  const recommendations = {
    urgency: 'Pause before acting. If it is truly urgent, wait 1 hour — urgency fades with reflection.',
    emotional: 'Name the emotion driving this decision. Write it down. Revisit the decision tomorrow.',
    cognitiveBias: 'List 2-3 alternatives before deciding. Check if "always"/"never" statements hold evidence.',
    informationQuality: 'Gather 3 data points before deciding. Even 10 minutes of research improves quality.',
    timeOrientation: 'Map the decision to a 6-month time horizon. How will it look then?',
    goalAlignment: 'Reconnect with your primary financial goal. Does this decision advance it?',
    valueConsistency: 'Write down your personal values. Score each option against them on a scale of 1-10.',
  };
  return recommendations[factor] || 'Review the decision context and identify what information is missing.';
}

/**
 * Compare two decision paths with confidence.
 */
export function counterfactualAnalysis(actualDecision = {}, alternativeScenario = {}) {
  const actualScore = scoreDecision(actualDecision);
  const alternativeScore = alternativeScenario.overallDecisionQuality
    ? { overallDecisionQuality: alternativeScenario.overallDecisionQuality }
    : scoreDecision(alternativeScenario);

  const delta = alternativeScore.overallDecisionQuality - actualScore.overallDecisionQuality;

  return {
    actualScore: actualScore.overallDecisionQuality,
    alternativeScore: alternativeScore.overallDecisionQuality,
    actualConfidence: actualScore.confidenceInterval,
    delta,
    betterChoice: delta > 0 ? 'alternative' : delta < 0 ? 'actual' : 'equal',
    insight: delta > 5
      ? `Had you chosen differently, your decision quality would have been ${delta} points higher.`
      : delta < -5
        ? `Your actual choice was ${Math.abs(delta)} points better than the alternative.`
        : 'Both paths yielded comparable decision quality.',
  };
}

/**
 * Predict decision quality trajectory based on historical trend with confidence.
 */
export function predictDecisionTrajectory(decisions = [], horizon = 30) {
  const trend = decisionTrend(decisions);
  if (decisions.length < 3) {
    return {
      confidence: 'low',
      prediction: 'Insufficient data to predict trajectory. Complete 3+ decisions for a forecast.',
      currentScore: trend.currentScore,
    };
  }

  const scores = decisions.map((d) => normalizeScore(d.overallDecisionQuality || d.score || 50));
  const recentScores = scores.slice(-5);
  const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const avgOlder = scores.slice(0, Math.max(1, scores.length - 5)).reduce((a, b) => a + b, 0) / Math.max(1, scores.length - 5);
  const slope = avgRecent - avgOlder;

  const projected = clamp(Math.round(avgRecent + slope * Math.min(horizon / 30, 3)));

  return {
    confidence: scores.length >= 10 ? 'high' : scores.length >= 5 ? 'medium' : 'low',
    currentScore: trend.currentScore,
    projectedScore: projected,
    direction: projected > trend.currentScore + 5 ? 'improving' : projected < trend.currentScore - 5 ? 'declining' : 'stable',
    volatility: trend.volatility,
    recommendation: projected < 50
      ? 'Decision quality is trending downward. Consider pausing major financial decisions until patterns stabilize.'
      : projected > 75
        ? 'Decision quality is strong and trending well. Maintain your current approach.'
        : 'Decision quality is moderate. Focus on the risk factors identified in recent decisions.',
  };
}
