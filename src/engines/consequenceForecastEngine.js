/**
 * Consequence Forecast Engine
 * Predicts health score trajectory if current behavior patterns continue
 * This is the core defensibility feature: what happens if nothing changes?
 */

import { formatMonths as formatMonthsV2 } from "../lib/scoring-v2.js";

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
      trajectoryData: []
    };
  }

  const healthScore = result.healthScore || 0;
  const behaviourScore = result.behaviourScore || 0;
  const awarenessScore = result.awarenessScore || 0;
  const stabilityScore = result.stabilityScore || 0;

  const decayRate = calculateDecayRate(behaviourScore, awarenessScore, stabilityScore);

  // Calculate projections at different time points
  const today = healthScore;
  const threeMonths = Math.max(20, today * Math.pow(1 - decayRate, 3));
  const sixMonths = Math.max(20, today * Math.pow(1 - decayRate, 6));
  const oneYear = Math.max(20, today * Math.pow(1 - decayRate, 12));
  const twoYears = Math.max(20, today * Math.pow(1 - decayRate, 24));

  // Build trajectory data for charting
  const trajectoryData = [];
  for (let month = 0; month <= 24; month += 3) {
    trajectoryData.push({
      month: month === 0 ? "Today" : `${month}mo`,
      healthScore: Math.max(20, Math.round(today * Math.pow(1 - decayRate, month) * 10) / 10),
      monthNumber: month
    });
  }

  return {
    today: Math.round(today * 10) / 10,
    threeMonths: Math.round(threeMonths * 10) / 10,
    sixMonths: Math.round(sixMonths * 10) / 10,
    oneYear: Math.round(oneYear * 10) / 10,
    twoYears: Math.round(twoYears * 10) / 10,
    trajectoryData,
    decayRate: Math.round(decayRate * 1000) / 10, // As percentage
    riskLevel: getRiskLevel(oneYear),
    consequence: getConsequenceNarrative(today, oneYear)
  };
}

function getRiskLevel(projectedOneYearScore) {
  if (projectedOneYearScore <= 30) {
    return "Critical";
  }
  if (projectedOneYearScore <= 45) {
    return "High";
  }
  if (projectedOneYearScore <= 60) {
    return "Moderate";
  }
  if (projectedOneYearScore <= 75) {
    return "Manageable";
  }
  return "Healthy";
}

function getConsequenceNarrative(currentScore, projectedOneYearScore) {
  const delta = currentScore - projectedOneYearScore;

  if (delta <= 0) {
    return "Current patterns suggest your financial health may remain stable or improve with conscious effort.";
  }

  if (delta <= 5) {
    return "Small gaps compound slowly. Without intervention, you may lose 5-8 points over the next year.";
  }

  if (delta <= 15) {
    return "Your current behavior patterns carry moderate drift risk. Within a year, your health could drop significantly.";
  }

  if (delta <= 25) {
    return "Current patterns are unsustainable. Without changes, financial stress could intensify within months.";
  }

  return "Critical trajectory: Your behavioral patterns create cascading financial deterioration. Intervention needed immediately.";
}

/**
 * Calculate consequence gap: difference between current and projected score
 * This is what makes the forecast actionable
 */
export function calculateConsequenceGap(result) {
  const trajectory = projectHealthTrajectory(result);
  return {
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

  if (trajectory.oneYear <= 30) {
    return {
      severity: "critical",
      message:
        "Your trajectory suggests critical financial stress within 12 months without intervention.",
      recommendation: "Start interventions immediately."
    };
  }

  if (trajectory.oneYear <= 45) {
    return {
      severity: "high",
      message:
        "Without behavioral changes, financial stability could become challenging within a year.",
      recommendation: "Prioritize the recommended interventions."
    };
  }

  if (trajectory.sixMonths < result.healthScore - 10) {
    return {
      severity: "moderate",
      message: "Current patterns suggest noticeable decline over 6 months.",
      recommendation: "Consider small changes now to prevent larger problems."
    };
  }

  return null;
}
