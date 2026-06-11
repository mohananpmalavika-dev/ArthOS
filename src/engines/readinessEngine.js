/**
 * Financial Readiness Engine
 * Measures preparedness for financial shocks and disruptions
 * Different from health score - focuses on shock resilience
 *
 * Formula: (emergencyFundCoverage * 0.3 + incomeStability * 0.3 + debtResilience * 0.4)
 */

/**
 * Calculate Financial Readiness Score
 * Higher readiness = better positioned to handle income loss / unexpected expense
 */
export function calculateFinancialReadiness(profile, behaviour, stability) {
  if (!profile || !stability) {
    return {
      readiness: 0,
      band: "Unable to calculate",
      narrative: "",
      componentBreakdown: {
        emergencyFund: 0,
        incomeStability: 0,
        debtResilience: 0,
      },
    };
  }

  // Component 1: Emergency Fund Coverage
  // How many months of runway do you have?
  const survivalMonths = stability.survivalMonthsRaw || 0;
  const emergencyFundCoverageScore = calculateEmergencyFundScore(survivalMonths);

  // Component 2: Income Stability
  // How predictable/diversified is your income?
  const incomeStabilityOptions = {
    very_consistent: 100,
    mostly_consistent: 75,
    somewhat_variable: 50,
    highly_variable: 25,
  };
  const incomeStabilityScore = incomeStabilityOptions[profile.incomeStability] || 0;

  // Component 3: Debt Resilience
  // Can you cover debt payments if income drops?
  const debtResilienceScore = calculateDebtResilienceScore(profile, stability);

  // Weighted formula: emergency fund is most important
  const readiness = Math.round(
    emergencyFundCoverageScore * 0.35 +
    incomeStabilityScore * 0.3 +
    debtResilienceScore * 0.35
  );

  return {
    readiness: Math.max(0, Math.min(100, readiness)),
    band: getReadinessBand(readiness),
    narrative: getReadinessNarrative(readiness, survivalMonths, incomeStabilityScore, debtResilienceScore),
    componentBreakdown: {
      emergencyFund: emergencyFundCoverageScore,
      incomeStability: incomeStabilityScore,
      debtResilience: debtResilienceScore,
    },
    strengths: getReadinessStrengths(emergencyFundCoverageScore, incomeStabilityScore, debtResilienceScore),
    weaknesses: getReadinessWeaknesses(emergencyFundCoverageScore, incomeStabilityScore, debtResilienceScore),
  };
}

/**
 * Score emergency fund based on survival months
 * 0-1 months = 0 (critically low)
 * 1-3 months = 40 (minimum baseline)
 * 3-6 months = 70 (good)
 * 6+ months = 100 (excellent)
 */
function calculateEmergencyFundScore(survivalMonths) {
  if (survivalMonths < 0.5) return 0;
  if (survivalMonths < 1) return 15;
  if (survivalMonths < 2) return 35;
  if (survivalMonths < 3) return 50;
  if (survivalMonths < 6) return 75;
  if (survivalMonths < 12) return 90;
  return 100;
}

/**
 * Score debt resilience
 * Can debt payments be maintained if income drops 25%?
 */
function calculateDebtResilienceScore(profile, stability) {
  const monthlyIncome = Number.parseFloat(profile.monthlyIncome) || 0;
  const monthlyExpenses = Number.parseFloat(profile.monthlyExpenses) || 0;
  const monthlyLiabilities = Number.parseFloat(profile.monthlyLiabilities) || 0;

  if (monthlyIncome <= 0) return 0;

  // If income drops 25%, can you still cover debt?
  const reducedIncome = monthlyIncome * 0.75;
  const incomeAfterExpenses = reducedIncome - monthlyExpenses;

  // If you can cover liabilities from reduced income, high score
  if (incomeAfterExpenses >= monthlyLiabilities) {
    return 100;
  }

  // Partial coverage
  if (incomeAfterExpenses >= monthlyLiabilities * 0.7) {
    return 80;
  }

  if (incomeAfterExpenses >= monthlyLiabilities * 0.5) {
    return 60;
  }

  if (incomeAfterExpenses >= monthlyLiabilities * 0.3) {
    return 40;
  }

  // Cannot cover debt if income drops 25%
  return 20;
}

/**
 * Map readiness score to band
 */
function getReadinessBand(readiness) {
  if (readiness <= 20) return "Critically Unprepared";
  if (readiness <= 40) return "Unprepared";
  if (readiness <= 60) return "Partially Prepared";
  if (readiness <= 80) return "Well Prepared";
  return "Highly Prepared";
}

/**
 * Generate readiness narrative
 */
function getReadinessNarrative(readiness, survivalMonths, incomeStability, debtResilience) {
  if (readiness <= 20) {
    return "You are not prepared for financial shocks. A single emergency would create crisis. Build emergency savings immediately.";
  }

  if (readiness <= 40) {
    return "Your readiness is low. You have some buffer but limited resilience to income loss or major unexpected costs.";
  }

  if (readiness <= 60) {
    return "You're partially prepared. You have some emergency funds and moderate income stability, but debt resilience could improve.";
  }

  if (readiness <= 80) {
    return "You're well prepared. You have reasonable emergency savings and income stability. You can handle most financial shocks.";
  }

  return "You're highly prepared for financial shocks. Strong emergency fund, stable income, and good debt resilience position you well.";
}

/**
 * Identify readiness strengths
 */
function getReadinessStrengths(emergencyScore, incomeScore, debtScore) {
  const strengths = [];

  if (emergencyScore >= 75) {
    strengths.push({
      area: "Emergency Savings",
      description: "Strong emergency fund provides solid shock buffer.",
    });
  }

  if (incomeScore >= 75) {
    strengths.push({
      area: "Income Stability",
      description: "Your income is consistent and predictable.",
    });
  }

  if (debtScore >= 75) {
    strengths.push({
      area: "Debt Resilience",
      description: "You can maintain debt payments even if income fluctuates.",
    });
  }

  return strengths.length > 0
    ? strengths
    : [{ area: "General", description: "Consider building strength in any area below." }];
}

/**
 * Identify readiness weaknesses
 */
function getReadinessWeaknesses(emergencyScore, incomeScore, debtScore) {
  const weaknesses = [];

  if (emergencyScore < 50) {
    weaknesses.push({
      area: "Emergency Savings",
      description: "Build emergency fund to 3-6 months of expenses.",
      priority: "High",
    });
  }

  if (incomeScore < 50) {
    weaknesses.push({
      area: "Income Stability",
      description: "Consider diversifying income or negotiating more stable arrangements.",
      priority: "Medium",
    });
  }

  if (debtScore < 50) {
    weaknesses.push({
      area: "Debt Resilience",
      description: "Your debt obligations exceed what you could cover if income dropped.",
      priority: "High",
    });
  }

  return weaknesses;
}

/**
 * Calculate how much additional emergency savings needed to reach target readiness
 */
export function getEmergencySavingsGap(profile, targetReadiness = 75) {
  const monthlyExpenses = Number.parseFloat(profile.monthlyExpenses) || 0;

  // Target: 3-6 months of expenses
  const targetMonthsLow = 3;
  const targetMonthsHigh = 6;

  const targetSavingsLow = monthlyExpenses * targetMonthsLow;
  const targetSavingsHigh = monthlyExpenses * targetMonthsHigh;
  const targetSavingsMid = (targetSavingsLow + targetSavingsHigh) / 2;

  const currentSavings =
    (Number.parseFloat(profile.emergencySavingsFixed) || 0) +
    (Number.parseFloat(profile.emergencySavingsDiscretionary) || 0);

  const gap = Math.max(0, targetSavingsMid - currentSavings);

  return {
    currentSavings: Math.round(currentSavings),
    targetSavings: Math.round(targetSavingsMid),
    gap: Math.round(gap),
    monthsToTarget: Math.ceil(gap / (monthlyExpenses * 0.1)), // Assume 10% of income to savings
  };
}

/**
 * Get actionable readiness recommendations
 */
export function getReadinessRecommendations(readiness, componentScores) {
  const recommendations = [];

  if (componentScores.emergencyFund < 50) {
    recommendations.push({
      action: "Build Emergency Fund",
      details: "Target 3-6 months of essential expenses saved in accessible account.",
      impact: "High - Most important readiness factor",
      timeline: "3-6 months",
    });
  }

  if (componentScores.incomeStability < 50) {
    recommendations.push({
      action: "Increase Income Stability",
      details: "Explore side income, skill development, or more predictable work.",
      impact: "Medium - Reduces shock vulnerability",
      timeline: "1-3 months to explore",
    });
  }

  if (componentScores.debtResilience < 50) {
    recommendations.push({
      action: "Reduce Debt Burden",
      details: "Pay down high-interest debt or renegotiate payment terms.",
      impact: "High - Critical if income is unstable",
      timeline: "Ongoing",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      action: "Maintain Readiness",
      details: "You're well prepared. Focus on maintaining current emergency fund and monitoring debt.",
      impact: "Medium - Keep resilience strong",
      timeline: "Quarterly review",
    });
  }

  return recommendations;
}
