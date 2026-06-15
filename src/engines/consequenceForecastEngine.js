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

  const healthScore = result.healthScore || 0; // internal 0..1000
  const behaviourScore = result.behaviourScore || 0;

  // Profile drivers
  const profile = result.profile || {};
  const monthlyIncome = toNumber(profile.monthlyIncome);
  const monthlyExpenses = toNumber(profile.monthlyExpenses);
  const totalSavings = toNumber(profile.emergencySavingsFixed) + toNumber(profile.emergencySavingsDiscretionary);
  const totalDebt = toNumber(profile.totalDebt);

  const monthlySurplus = Math.max(0, monthlyIncome - monthlyExpenses);
  const emergencyFundMonths = monthlyExpenses > 0 ? totalSavings / monthlyExpenses : 0;
  const debtRatio = monthlyIncome > 0 ? totalDebt / (monthlyIncome * 12) : 1;

  // Behaviour factor normalized 0..1 (1 = worst behaviour)
  const behaviourFactor = 1 - clamp(behaviourScore / componentMaximumsV2.behaviour, 0, 1);

  // Driver-based annual percent change estimate (conservative bounds)
  const baseAnnual = -0.02; // small base decay
  const surplusEffect = monthlyIncome > 0 ? (monthlySurplus / monthlyIncome) * 0.6 : 0; // up to +60% p.a. at extreme
  const emergencyEffect = Math.min(0.25, (Math.min(emergencyFundMonths, 60) / 60) * 0.25); // up to +25%
  const debtPenalty = clamp(debtRatio, 0, 1) * 0.5; // up to -50%
  const behaviourPenalty = behaviourFactor * 0.25; // up to -25%

  let annualPercent = baseAnnual + surplusEffect + emergencyEffect - debtPenalty - behaviourPenalty;
  annualPercent = clamp(annualPercent, -0.5, 0.5);
  const monthlyRate = annualPercent / 12;

  const today = healthScore;

  const trajectoryData = [];
  const baseConfidence = 80; // starting confidence in projections
  const decayPerMonth = 1.2; // confidence decay per month

  for (let month = 0; month <= 24; month += 1) {
    const projected = Math.max(0, today * Math.pow(1 + monthlyRate, month));
    const confidence = Math.max(10, Math.round(baseConfidence - month * decayPerMonth));
    const volatility = Math.min(0.6, Math.abs(monthlyRate) * 1.5 + 0.02);
    const uncertainty = Math.min(0.6, (1 - confidence / 100) + volatility);

    trajectoryData.push({
      month: month === 0 ? "Today" : `${month}mo`,
      monthNumber: month,
      healthScore: Math.round(projected),
      lower: Math.round(Math.max(0, projected * (1 - uncertainty))),
      upper: Math.round(projected * (1 + uncertainty)),
      confidence
    });
  }

  // Aggregate points at typical UX intervals
  const threeMonths = trajectoryData.find(d => d.monthNumber === 3)?.healthScore ?? 0;
  const sixMonths = trajectoryData.find(d => d.monthNumber === 6)?.healthScore ?? 0;
  const oneYear = trajectoryData.find(d => d.monthNumber === 12)?.healthScore ?? 0;
  const twoYears = trajectoryData.find(d => d.monthNumber === 24)?.healthScore ?? 0;

  const decayRatePct = Math.round(annualPercent * 1000) / 10;

  // Use normalized score for risk level text (0-100)
  const normalizedOneYear = normalizeScore(oneYear);

  return {
    today: Math.round(today),
    threeMonths: Math.round(threeMonths),
    sixMonths: Math.round(sixMonths),
    oneYear: Math.round(oneYear),
    twoYears: Math.round(twoYears),
    trajectoryData,
    decayRate: decayRatePct,
    riskLevel: getRiskLevel(normalizedOneYear),
    consequence: getConsequenceNarrative(normalizeScore(today), normalizedOneYear)
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
