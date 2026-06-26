function normalizeScore(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 50;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

const BASE_RISK_FACTORS = {
  urgency: { weight: 0.15, description: 'Urgency-driven decision making' },
  emotional: { weight: 0.15, description: 'Emotion-driven decision making' },
  cognitiveBias: { weight: 0.2, description: 'Cognitive bias evidence in decision text' },
  informationQuality: { weight: 0.15, description: 'Information completeness before decision' },
  timeOrientation: { weight: 0.1, description: 'Short vs long-term orientation' },
  goalAlignment: { weight: 0.15, description: 'Alignment with stated financial goals' },
  valueConsistency: { weight: 0.1, description: 'Consistency with personal values' }
};

export function createInMemoryDecisionOutcomeStore() {
  const outcomeMemory = new Map();

  return {
    load(scope = 'global') {
      return outcomeMemory.get(scope) || [];
    },
    save(scope = 'global', outcomes = []) {
      outcomeMemory.set(scope, outcomes.slice(-200));
      return outcomeMemory.get(scope);
    }
  };
}

const defaultOutcomeStore = createInMemoryDecisionOutcomeStore();

function loadOutcomes({ outcomeStore = defaultOutcomeStore, scope = 'global', outcomes } = {}) {
  if (Array.isArray(outcomes)) {
    return outcomes;
  }
  return outcomeStore.load(scope) || [];
}

function saveOutcomes(outcomes, { outcomeStore = defaultOutcomeStore, scope = 'global' } = {}) {
  return outcomeStore.save(scope, outcomes);
}

function scoreUrgency(decision = {}) {
  const text = String(decision.notes || decision.description || '').toLowerCase();
  const urgencyWords = [
    'urgent',
    'now',
    'must',
    'immediately',
    'today',
    'tonight',
    'right away',
    'asap'
  ];
  const urgencyCount = urgencyWords.filter(word => text.includes(word)).length;
  return clamp(100 - urgencyCount * 20);
}

function scoreEmotional(decision = {}) {
  const text = String(decision.notes || decision.description || '').toLowerCase();
  const fearWords = ['fear', 'lose', 'loss', 'worried', 'scared', 'anxious', 'panic', 'afraid'];
  const greedWords = [
    'fomo',
    'opportunity',
    'miss out',
    'once in a lifetime',
    'guaranteed',
    'sure thing'
  ];
  const fearScore = fearWords.filter(word => text.includes(word)).length * 15;
  const greedScore = greedWords.filter(word => text.includes(word)).length * 12;
  return clamp(100 - fearScore - greedScore);
}

function scoreCognitiveBias(decision = {}) {
  const text = String(decision.notes || decision.description || '').toLowerCase();
  let score = 100;
  if (/\b(always|never|everyone|nobody|impossible|certainly)\b/.test(text)) {
    score -= 12;
  }
  if (/\b(all|nothing|completely|totally)\b/.test(text)) {
    score -= 8;
  }
  if (/\b(maybe|perhaps|hope|might|possibly)\b/.test(text)) {
    score -= 5;
  }
  if (/\b(stick with|keep doing|don't change|same as before|as is)\b/.test(text)) {
    score -= 8;
  }
  if (/\b(already spent|invested so far|put so much into|can't stop now)\b/.test(text)) {
    score -= 15;
  }
  return clamp(score);
}

function scoreInformationQuality(decision = {}) {
  let score = 50;
  if (decision.researched || decision.shoppedAround) {
    score += 15;
  }
  if (decision.sleptOnIt || decision.waited) {
    score += 10;
  }
  if (Number(decision.alternativesConsidered) >= 2) {
    score += 10;
  }
  if (decision.consultedSomeone) {
    score += 10;
  }
  if (decision.budgetChecked || decision.checkedBalance) {
    score += 15;
  }
  if (decision.amount && decision.amount <= 1000) {
    score += 5;
  }
  return clamp(score);
}

function scoreTimeOrientation(decision = {}) {
  const text = String(decision.notes || decision.description || '').toLowerCase();
  if (/\b(future|later|planning|goal|long.term|investment|next year|retirement)\b/.test(text)) {
    return 85;
  }
  if (/\b(today|now|urgent|immediately|this week|tonight|this month)\b/.test(text)) {
    return 55;
  }
  if (/\b(balance|both|short|medium)\b/.test(text)) {
    return 75;
  }
  return 70;
}

function scoreGoalAlignment(decision = {}) {
  if (decision.goalAlignment === true || decision.goalAligned === true) {
    return 85;
  }
  if (decision.goalAlignment === false || decision.goalAligned === false) {
    return 40;
  }
  return normalizeScore(decision.goalAlignment || decision.goalAligned || 50);
}

function scoreValueConsistency(decision = {}) {
  if (typeof decision.valueConsistency === 'number') {
    return normalizeScore(decision.valueConsistency);
  }
  const text = String(decision.notes || decision.description || '').toLowerCase();
  if (
    text.includes('savings') ||
    text.includes('invest') ||
    text.includes('plan') ||
    text.includes('budget')
  ) {
    return 75;
  }
  if (text.includes('emergency') || text.includes('debt') || text.includes('pay off')) {
    return 70;
  }
  return 60;
}

function getPatternAdjustedWeights(category, persistenceOptions = {}) {
  const outcomes = loadOutcomes(persistenceOptions);
  const relevant = outcomes.filter(outcome => !category || outcome.category === category);
  const weights = Object.fromEntries(
    Object.entries(BASE_RISK_FACTORS).map(([key, value]) => [key, { ...value }])
  );

  if (relevant.length < 3) {
    return weights;
  }

  for (const [factor, config] of Object.entries(BASE_RISK_FACTORS)) {
    const poorOutcomes = relevant.filter(
      outcome =>
        (outcome.factorScores?.[factor] || 50) < 50 &&
        (outcome.actualOutcome === 'negative' || outcome.regretLevel > 50)
    );
    const totalWithFactor = relevant.filter(
      outcome => (outcome.factorScores?.[factor] || 50) < 60
    ).length;

    if (totalWithFactor > 0) {
      const failureRate = poorOutcomes.length / totalWithFactor;
      const adjustment = 1 + (failureRate - 0.3) * 0.5;
      weights[factor] = {
        ...config,
        weight: clamp(config.weight * adjustment, 0.05, 0.35),
        historicalFailureRate: Math.round(failureRate * 100)
      };
    }
  }

  const totalWeight = Object.values(weights).reduce((sum, factor) => sum + factor.weight, 0);
  for (const factor of Object.keys(weights)) {
    weights[factor].weight = weights[factor].weight / totalWeight;
  }

  return weights;
}

function decisionConfidenceInterval(scoredDecision, persistenceOptions = {}) {
  const outcomes = loadOutcomes(persistenceOptions);
  const relevant = outcomes.filter(outcome => outcome.overallDecisionQuality !== undefined);
  if (relevant.length < 3) {
    return {
      lower: Math.max(0, scoredDecision.overallDecisionQuality - 15),
      upper: Math.min(100, scoredDecision.overallDecisionQuality + 15),
      width: 30
    };
  }

  const errors = [];
  for (const outcome of relevant) {
    if (typeof outcome.actualQuality === 'number') {
      errors.push(outcome.overallDecisionQuality - outcome.actualQuality);
    }
  }

  if (errors.length < 2) {
    return {
      lower: Math.max(0, scoredDecision.overallDecisionQuality - 12),
      upper: Math.min(100, scoredDecision.overallDecisionQuality + 12),
      width: 24
    };
  }

  const mean = errors.reduce((sum, error) => sum + error, 0) / errors.length;
  const variance = errors.reduce((sum, error) => sum + (error - mean) ** 2, 0) / errors.length;
  const margin = 1.96 * Math.sqrt(variance);

  return {
    lower: clamp(Math.round(scoredDecision.overallDecisionQuality - margin)),
    upper: clamp(Math.round(scoredDecision.overallDecisionQuality + margin)),
    width: Math.round(margin * 2)
  };
}

function getQualityLabel(score) {
  if (score >= 90) {
    return 'Excellent';
  }
  if (score >= 75) {
    return 'Good';
  }
  if (score >= 60) {
    return 'Fair';
  }
  if (score >= 40) {
    return 'Poor';
  }
  return 'Risky';
}

function getRiskRecommendation(factor) {
  const recommendations = {
    urgency: 'Pause before acting. If it is truly urgent, wait 1 hour; urgency fades with reflection.',
    emotional: 'Name the emotion driving this decision. Write it down. Revisit the decision tomorrow.',
    cognitiveBias: 'List 2-3 alternatives before deciding. Check whether absolute statements hold evidence.',
    informationQuality: 'Gather 3 data points before deciding. Even 10 minutes of research improves quality.',
    timeOrientation: 'Map the decision to a 6-month time horizon. How will it look then?',
    goalAlignment: 'Reconnect with your primary financial goal. Does this decision advance it?',
    valueConsistency: 'Write down your personal values. Score each option against them on a scale of 1-10.'
  };
  return recommendations[factor] || 'Review the decision context and identify what information is missing.';
}

export function scoreDecision(decision = {}, persistenceOptions = {}) {
  const urgency = scoreUrgency(decision);
  const emotional = scoreEmotional(decision);
  const cognitiveBias = scoreCognitiveBias(decision);
  const informationQuality = scoreInformationQuality(decision);
  const timeOrientation = scoreTimeOrientation(decision);
  const goalAlignment = scoreGoalAlignment(decision);
  const valueConsistency = scoreValueConsistency(decision);

  const factorScores = {
    urgency,
    emotional,
    cognitiveBias,
    informationQuality,
    timeOrientation,
    goalAlignment,
    valueConsistency
  };

  const adjustedWeights = getPatternAdjustedWeights(decision.category, persistenceOptions);
  const totalWeight = Object.values(adjustedWeights).reduce((sum, factor) => sum + factor.weight, 0);
  const weightedScore =
    (urgency * adjustedWeights.urgency.weight +
      emotional * adjustedWeights.emotional.weight +
      cognitiveBias * adjustedWeights.cognitiveBias.weight +
      informationQuality * adjustedWeights.informationQuality.weight +
      timeOrientation * adjustedWeights.timeOrientation.weight +
      goalAlignment * adjustedWeights.goalAlignment.weight +
      valueConsistency * adjustedWeights.valueConsistency.weight) /
    totalWeight;

  const overallDecisionQuality = clamp(Math.round(weightedScore));
  const riskFactors = Object.entries(factorScores)
    .filter(([, score]) => score < 60)
    .map(([key, score]) => ({
      factor: key,
      score,
      riskLevel: score < 40 ? 'high' : 'moderate',
      description: BASE_RISK_FACTORS[key]?.description || key,
      historicalWeight: adjustedWeights[key]?.weight || BASE_RISK_FACTORS[key]?.weight
    }))
    .sort((a, b) => a.score - b.score);

  const confidenceInterval = decisionConfidenceInterval(
    { overallDecisionQuality, ...factorScores },
    persistenceOptions
  );

  return {
    ...decision,
    timestamp: decision.timestamp || new Date().toISOString(),
    factorScores,
    patternAdjustedWeights: adjustedWeights,
    overallDecisionQuality,
    riskFactors,
    confidenceInterval,
    riskLevel:
      overallDecisionQuality > 75 ? 'low' : overallDecisionQuality > 50 ? 'moderate' : 'high',
    qualityLabel: getQualityLabel(overallDecisionQuality),
    scoredAt: new Date().toISOString()
  };
}

export function recordDecisionOutcome(decisionId, outcome = {}, persistenceOptions = {}) {
  const outcomes = loadOutcomes(persistenceOptions);
  const record = {
    decisionId,
    category: outcome.category,
    factorScores: outcome.factorScores,
    overallDecisionQuality: outcome.overallDecisionQuality,
    actualOutcome: outcome.actualOutcome || 'unknown',
    actualQuality: outcome.actualQuality || null,
    regretLevel: outcome.regretLevel || null,
    recordedAt: new Date().toISOString()
  };

  const updatedOutcomes = [...outcomes, record].slice(-200);
  saveOutcomes(updatedOutcomes, persistenceOptions);
  return record;
}

export function decisionTrend(decisions = []) {
  if (!decisions.length) {
    return {
      currentScore: 0,
      movingAverage: 0,
      trend: 'Unknown',
      stability: 0,
      volatility: 0,
      confidence: 0
    };
  }

  const scored = decisions.map(decision =>
    normalizeScore(decision.overallDecisionQuality || decision.score || 50)
  );
  const avg = Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
  const alpha = 0.3;
  let ema = scored[0];
  for (let i = 1; i < scored.length; i++) {
    ema = alpha * scored[i] + (1 - alpha) * ema;
  }

  const variance = scored.reduce((sum, score) => sum + (score - avg) ** 2, 0) / scored.length;
  const volatility = Math.round(Math.sqrt(variance));
  const stability = clamp(100 - volatility);
  const firstHalf = scored.slice(0, Math.floor(scored.length / 2));
  const secondHalf = scored.slice(Math.floor(scored.length / 2));
  const firstAvg = firstHalf.length ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
  const secondAvg = secondHalf.length
    ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    : 0;
  const trend =
    secondAvg > firstAvg + 3 ? 'Improving' : secondAvg < firstAvg - 3 ? 'Declining' : 'Stable';

  return {
    currentScore: scored[scored.length - 1],
    movingAverage: Math.round(ema),
    simpleAverage: avg,
    trend,
    stability,
    volatility,
    decisionCount: scored.length,
    confidence: decisions.length >= 10 ? 'high' : decisions.length >= 5 ? 'medium' : 'low'
  };
}

export function identifyPrimaryRisk(decision = {}, persistenceOptions = {}) {
  const scored = scoreDecision(decision, persistenceOptions);
  if (!scored.riskFactors.length) {
    return null;
  }

  const primary = scored.riskFactors[0];
  return {
    factor: primary.factor,
    description: primary.description,
    riskLevel: primary.riskLevel,
    impact: clamp(100 - scored.overallDecisionQuality),
    recommendation: getRiskRecommendation(primary.factor),
    confidenceInterval: scored.confidenceInterval
  };
}

export function counterfactualAnalysis(actualDecision = {}, alternativeScenario = {}, persistenceOptions = {}) {
  const actualScore = scoreDecision(actualDecision, persistenceOptions);
  const alternativeScore = alternativeScenario.overallDecisionQuality
    ? { overallDecisionQuality: alternativeScenario.overallDecisionQuality }
    : scoreDecision(alternativeScenario, persistenceOptions);
  const delta = alternativeScore.overallDecisionQuality - actualScore.overallDecisionQuality;

  return {
    actualScore: actualScore.overallDecisionQuality,
    alternativeScore: alternativeScore.overallDecisionQuality,
    actualConfidence: actualScore.confidenceInterval,
    delta,
    betterChoice: delta > 0 ? 'alternative' : delta < 0 ? 'actual' : 'equal',
    insight:
      delta > 5
        ? `Had you chosen differently, your decision quality would have been ${delta} points higher.`
        : delta < -5
          ? `Your actual choice was ${Math.abs(delta)} points better than the alternative.`
          : 'Both paths yielded comparable decision quality.'
  };
}

export function predictDecisionTrajectory(decisions = [], horizon = 30) {
  const trend = decisionTrend(decisions);
  if (decisions.length < 3) {
    return {
      confidence: 'low',
      prediction: 'Insufficient data to predict trajectory. Complete 3+ decisions for a forecast.',
      currentScore: trend.currentScore
    };
  }

  const scores = decisions.map(decision =>
    normalizeScore(decision.overallDecisionQuality || decision.score || 50)
  );
  const recentScores = scores.slice(-5);
  const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const older = scores.slice(0, Math.max(1, scores.length - 5));
  const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;
  const slope = avgRecent - avgOlder;
  const projected = clamp(Math.round(avgRecent + slope * Math.min(horizon / 30, 3)));

  return {
    confidence: scores.length >= 10 ? 'high' : scores.length >= 5 ? 'medium' : 'low',
    currentScore: trend.currentScore,
    projectedScore: projected,
    direction:
      projected > trend.currentScore + 5
        ? 'improving'
        : projected < trend.currentScore - 5
          ? 'declining'
          : 'stable',
    volatility: trend.volatility,
    recommendation:
      projected < 50
        ? 'Decision quality is trending downward. Consider pausing major financial decisions until patterns stabilize.'
        : projected > 75
          ? 'Decision quality is strong and trending well. Maintain your current approach.'
          : 'Decision quality is moderate. Focus on the risk factors identified in recent decisions.'
  };
}

export function createDecisionIntelligenceService(options = {}) {
  return {
    scoreDecision(decision) {
      return scoreDecision(decision, options);
    },
    recordDecisionOutcome(decisionId, outcome) {
      return recordDecisionOutcome(decisionId, outcome, options);
    },
    decisionTrend,
    identifyPrimaryRisk(decision) {
      return identifyPrimaryRisk(decision, options);
    },
    counterfactualAnalysis(actualDecision, alternativeScenario) {
      return counterfactualAnalysis(actualDecision, alternativeScenario, options);
    },
    predictDecisionTrajectory
  };
}

export default {
  createDecisionIntelligenceService,
  createInMemoryDecisionOutcomeStore,
  scoreDecision,
  recordDecisionOutcome,
  decisionTrend,
  identifyPrimaryRisk,
  counterfactualAnalysis,
  predictDecisionTrajectory
};
