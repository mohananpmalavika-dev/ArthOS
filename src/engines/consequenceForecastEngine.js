/**
 * Consequence Forecast Engine
 * Predicts health score trajectory if current behavior patterns continue
 * This is the core defensibility feature: what happens if nothing changes?
 */

import { formatMonths as formatMonthsV2, componentMaximumsV2, normalizeScore } from "../lib/scoring-v2.js";

function toNumber(v) {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

/**
 * Calculate trajectory decay based on behavioral patterns
 * Lower awareness + lower behavior = faster degradation
 * This models real financial deterioration
 */

function getConsequenceNarrative(currentScore, projectedOneYearScore) {
  const delta = projectedOneYearScore - currentScore;

  if (delta >= 0) {
    return 'Current patterns suggest your financial health may remain stable or improve with conscious effort.';
  }

  if (delta >= -5) {
    return 'Small gaps compound slowly. Without intervention, you may lose a few points over the next year.';
  }

  if (delta >= -15) {
    return 'Your current behavior patterns carry moderate drift risk. Within a year, your health could drop significantly.';
  }

  if (delta >= -25) {
    return 'Current patterns are unsustainable. Without changes, financial stress could intensify within months.';
  }

  return 'Critical trajectory: Your behavioral patterns create cascading financial deterioration. Intervention needed immediately.';
}

function getHealthBand(score) {
  if (score <= 250) {
    return 'critical';
  }
  if (score <= 400) {
    return 'fragile';
  }
  if (score <= 600) {
    return 'developing';
  }
  if (score <= 800) {
    return 'resilient';
  }
  return 'sovereign';
}

/**
 * Translate projected health score into a user-facing risk label.
 * (Fixes runtime crash: getRiskLevel was referenced but not defined.)
 */
function getRiskLevel(score) {
  const s = toNumber(score);

  if (s <= 250) return 'critical';
  if (s <= 400) return 'high';
  if (s <= 600) return 'moderate';
  if (s <= 800) return 'low';
  return 'minimal';
}


function getTrendRate(trend) {
  const normalizedTrend = String(trend || '').toLowerCase();
  if (normalizedTrend.includes('improving') || normalizedTrend.includes('positive')) {
    return 0.03;
  }
  if (normalizedTrend.includes('declining') || normalizedTrend.includes('negative')) {
    return -0.04;
  }
  if (normalizedTrend.includes('rapidly')) {
    return -0.08;
  }
  return 0.0;
}

function buildProjection(currentScore, rate, months) {
  const projected = Math.max(0, currentScore * Math.pow(1 + rate, months));
  const lower = Math.round(projected * 0.88);
  const upper = Math.round(projected * 1.12);
  const confidence = Math.max(0.25, Math.min(0.95, 1 - Math.abs(rate) * (months / 12) * 0.35));

  return {
    months,
    projected_score: Math.round(projected),
    health_band: getHealthBand(projected),
    confidence,
    confidence_lower: lower,
    confidence_upper: upper
  };
}

/**
 * Calculate trajectory decay based on behavioral patterns
 * Lower awareness + lower behavior = faster degradation
 * This models real financial deterioration
 */
function calculateDecayRate(behaviourScore, awarenessScore, stabilityScore) {
  const maxBehaviour = 45;
  const maxAwareness = 30;
  const maxStability = 25;

  const behaviourFactor = 1 - behaviourScore / maxBehaviour;
  const awarenessFactor = 1 - awarenessScore / maxAwareness;
  const stabilityFactor = 1 - stabilityScore / maxStability;

  // Low awareness amplifies decay (people don't notice problems)
  const awarenessPenalty = awarenessFactor > 0.5 ? 1.5 : 1;

  // Decay formula: 2% base + behavioral weakness + awareness penalty
  const decayRate = (0.02 + behaviourFactor * 0.015 + awarenessFactor * 0.01) * awarenessPenalty;

  return Math.min(0.08, decayRate); // Cap at 8% per period
}

/**
 * Project health score over time periods
 * Assumes no intervention (current behavior continues)
 */
export function projectHealthTrajectory(result) {
  if (!result) {
    return {
      today: 0,
      threeMonths: 0,
      sixMonths: 0,
      oneYear: 0,
      twoYears: 0,
      trajectoryData: [],
      projections: []
    };
  }

  const currentScore = toNumber(result.current_score ?? result.healthScore ?? 0);
  const trend = result.score_trend ?? result.trend;
  const monthlyRate = getTrendRate(trend);

  const projections = [3, 6, 12].map((months) => buildProjection(currentScore, monthlyRate, months));
  const twoYearProjection = buildProjection(currentScore, monthlyRate, 24);

  const trajectoryData = projections.map((projection) => ({
    month: `${projection.months} months`,
    monthNumber: projection.months,
    healthScore: projection.projected_score,
    lower: projection.confidence_lower,
    upper: projection.confidence_upper,
    confidence: Math.round(projection.confidence * 100)
  }));

  return {
    today: Math.round(currentScore),
    threeMonths: projections[0].projected_score,
    sixMonths: projections[1].projected_score,
    oneYear: projections[2].projected_score,
    twoYears: twoYearProjection.projected_score,
    trajectoryData,
    projections,
    decayRate: Math.round(monthlyRate * 1000) / 10,
    // Risk level is derived from projected health score (lower score => higher risk)
    riskLevel: getHealthBand(projections[2].projected_score),
    consequence: getConsequenceNarrative(currentScore, projections[2].projected_score)
  };
}

/**
 * Calculate consequence gap: difference between current and projected score
 * This is what makes the forecast actionable
 */
export function calculateConsequenceGap(result) {
  const trajectory = projectHealthTrajectory(result);
  const gapSize = Math.round(trajectory.oneYear - trajectory.today);
  const currentBand = getHealthBand(trajectory.today);
  const futureBand = getHealthBand(trajectory.oneYear);

  return {
    gap_size: gapSize,
    direction: gapSize >= 0 ? 'positive' : 'negative',
    band_transitions: currentBand === futureBand ? [] : [{ from: currentBand, to: futureBand }],
    timeframe_months: 12,
    gapSixMonths: trajectory.today - trajectory.sixMonths,
    gapOneYear: trajectory.today - trajectory.oneYear,
    gapTwoYears: trajectory.today - trajectory.twoYears,
    deteriorationPerMonth: trajectory.decayRate
  };
}

/**
 * Get risk warning if trajectory crosses threshold
 */
export function getTrajectoryWarning(result) {
  const trajectory = projectHealthTrajectory(result);
  const warnings = [];
  let severity = 'none';
  let message = 'No immediate trajectory warning.';
  const recommended_actions = [];

  if (trajectory.oneYear <= 30) {
    severity = 'critical';
    message = 'Your trajectory suggests critical financial stress within 12 months without intervention.';
    recommended_actions.push('Start interventions immediately.');
  } else if (trajectory.oneYear <= 45) {
    severity = 'high';
    message = 'Without behavioral changes, financial stability could become challenging within a year.';
    recommended_actions.push('Prioritize the recommended interventions.');
  } else if (result.was_band && result.health_band && result.was_band !== result.health_band) {
    severity = 'moderate';
    message = `Your health band has changed from ${result.was_band} to ${result.health_band}.`;
    recommended_actions.push('Review your trajectory and act now.');
  } else if (trajectory.oneYear < trajectory.today) {
    severity = 'low';
    message = 'Slight decline expected over the next year. Consider small improvements.';
    recommended_actions.push('Monitor spending and savings habits.');
  }

  if (recommended_actions.length > 0) {
    return {
      severity,
      message,
      recommendation: recommended_actions[0],
      recommended_actions
    };
  }

  return {
    severity,
    message,
    recommendation: '',
    recommended_actions
  };
}
