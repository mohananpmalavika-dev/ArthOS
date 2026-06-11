/**
 * Scenario Forecasting Engine
 * Predicts financial future states at 30, 90, 180 days
 * Heuristic-based (later: time-series models)
 */

export function forecastScenarios(profile) {
  if (!profile) return null;

  const monthlyIncome = Number(profile.monthlyIncome) || 0;
  const monthlyExpenses = Number(profile.monthlyExpenses) || 0;
  const currentSavings = Number(profile.emergencySavingsFixed) + Number(profile.emergencySavingsDiscretionary) || 0;
  const monthlyDebt = Number(profile.monthlyLiabilities) || 0;
  const totalDebt = Number(profile.totalDebt) || 0;
  const incomeStability = profile.incomeStability || 'mostly_consistent';

  // Volatility factor based on income stability
  const volatilityFactors = {
    very_consistent: 1.0,
    mostly_consistent: 0.95,
    somewhat_variable: 0.85,
    highly_variable: 0.7,
  };
  const volatility = volatilityFactors[incomeStability] || 0.9;

  // Base scenario: no major changes
  const monthlyNetIncome = (monthlyIncome - monthlyExpenses) * volatility;

  // 30-day scenario
  const scenario30 = {
    days: 30,
    timeframe: '1 month',
    projectedSavings: Math.max(0, currentSavings + monthlyNetIncome),
    projectedDebt: Math.max(0, totalDebt - monthlyDebt),
    projectedRunway: calculateRunway(Math.max(0, currentSavings + monthlyNetIncome), monthlyExpenses),
    status: monthlyNetIncome > 0 ? 'improving' : monthlyNetIncome < -1000 ? 'deteriorating' : 'stable',
  };

  // 90-day scenario (3 months)
  const scenario90 = {
    days: 90,
    timeframe: '3 months',
    projectedSavings: Math.max(0, currentSavings + monthlyNetIncome * 3),
    projectedDebt: Math.max(0, totalDebt - monthlyDebt * 3),
    projectedRunway: calculateRunway(Math.max(0, currentSavings + monthlyNetIncome * 3), monthlyExpenses),
    status: monthlyNetIncome * 3 > 5000 ? 'improving' : monthlyNetIncome * 3 < -3000 ? 'deteriorating' : 'stable',
  };

  // 180-day scenario (6 months)
  const scenario180 = {
    days: 180,
    timeframe: '6 months',
    projectedSavings: Math.max(0, currentSavings + monthlyNetIncome * 6),
    projectedDebt: Math.max(0, totalDebt - monthlyDebt * 6),
    projectedRunway: calculateRunway(Math.max(0, currentSavings + monthlyNetIncome * 6), monthlyExpenses),
    status: monthlyNetIncome * 6 > 10000 ? 'improving' : monthlyNetIncome * 6 < -10000 ? 'deteriorating' : 'stable',
  };

  // Risk scenarios
  const riskScenarios = generateRiskScenarios(currentSavings, monthlyIncome, monthlyExpenses, totalDebt);

  return {
    baseline: {
      currentSavings,
      currentRunway: calculateRunway(currentSavings, monthlyExpenses),
      monthlyNetIncome,
    },
    scenarios: [scenario30, scenario90, scenario180],
    risks: riskScenarios,
    recommendation: generateForecastRecommendation(scenario180, profile),
  };
}

function calculateRunway(savings, monthlyExpenses) {
  if (monthlyExpenses <= 0) return 0;
  return savings / monthlyExpenses;
}

function generateRiskScenarios(savings, monthlyIncome, monthlyExpenses, totalDebt) {
  // Stress test: income drops 25%
  const incomeDropScenario = {
    name: 'Income drops 25%',
    monthlyNetIncome: (monthlyIncome * 0.75 - monthlyExpenses) * 0.9,
    runway30: calculateRunway(savings, monthlyExpenses),
    impact: 'high',
    probability: 'medium',
  };

  // Stress test: unexpected expense (₹20K)
  const unexpensedScenario = {
    name: 'Unexpected ₹20K expense',
    newSavings: Math.max(0, savings - 20000),
    runway30: calculateRunway(Math.max(0, savings - 20000), monthlyExpenses),
    impact: savings > 20000 ? 'low' : 'high',
    probability: 'medium',
  };

  // Debt acceleration
  const debtAccelScenario = {
    name: 'Debt increases 15%',
    totalDebtAfter: totalDebt * 1.15,
    impact: 'medium',
    probability: 'low',
  };

  return [incomeDropScenario, unexpensedScenario, debtAccelScenario];
}

function generateForecastRecommendation(scenario180, profile) {
  const monthlyIncome = Number(profile.monthlyIncome) || 0;
  const monthlyExpenses = Number(profile.monthlyExpenses) || 0;
  const monthlyNetIncome = monthlyIncome - monthlyExpenses;
  const runway = scenario180.projectedRunway;

  if (scenario180.status === 'deteriorating') {
    return {
      text: 'Your financial situation is declining. Cut expenses or increase income in the next 30 days.',
      severity: 'critical',
      action: 'Reduce discretionary spending or pursue side income.',
    };
  }

  if (runway < 1) {
    return {
      text: 'In 6 months, your runway will be critical. Start building emergency savings NOW.',
      severity: 'high',
      action: 'Target ₹5-10K emergency savings per month.',
    };
  }

  if (runway < 3 && monthlyNetIncome > 0) {
    return {
      text: "You're on track to reach 3 months runway by month 6. Keep going.",
      severity: 'medium',
      action: 'Maintain current savings discipline. Then increase by 10% next quarter.',
    };
  }

  if (runway >= 6) {
    return {
      text: "You're building strong financial resilience. Consider allocating 5-10% to growth.",
      severity: 'low',
      action: 'Explore higher-yield savings or small investments.',
    };
  }

  return {
    text: 'Your forecast shows stable finances. Maintain current discipline.',
    severity: 'low',
    action: null,
  };
}

/**
 * Generate what-if scenarios for decision testing
 */
export function simulateDecisionImpact(profile, decision) {
  /**
   * decision = {
   *   type: 'expense' | 'income_change' | 'savings_increase',
   *   amount: number,
   *   duration: 'one_time' | 'recurring',
   * }
   */

  if (!decision || !profile) return null;

  const currentSavings = Number(profile.emergencySavingsFixed) + Number(profile.emergencySavingsDiscretionary) || 0;
  const monthlyIncome = Number(profile.monthlyIncome) || 0;
  const monthlyExpenses = Number(profile.monthlyExpenses) || 0;

  let impactAmount = 0;
  let newSavings = currentSavings;
  let newIncome = monthlyIncome;
  let newExpenses = monthlyExpenses;

  if (decision.type === 'expense') {
    if (decision.duration === 'one_time') {
      newSavings = Math.max(0, currentSavings - decision.amount);
    } else {
      newExpenses = monthlyExpenses + decision.amount;
    }
  } else if (decision.type === 'income_change') {
    newIncome = monthlyIncome + decision.amount;
  } else if (decision.type === 'savings_increase') {
    newExpenses = Math.max(0, monthlyExpenses - decision.amount);
  }

  const oldRunway = currentSavings / (monthlyExpenses || 1);
  const newRunway = newSavings / (newExpenses || 1);
  const runwayDelta = newRunway - oldRunway;

  return {
    currentState: {
      savings: currentSavings,
      runway: oldRunway,
    },
    projectedState: {
      savings: newSavings,
      runway: newRunway,
    },
    impact: {
      savingsDelta: newSavings - currentSavings,
      runwayDelta,
      recommendation:
        newRunway < 1
          ? '⚠️ This decision would push you into critical zone.'
          : newRunway < 3
          ? 'Proceed with caution.'
          : '✅ Safe to proceed.',
    },
  };
}

/**
 * Estimate monthly cashflow breakdown
 */
export function estimateCashflowBreakdown(profile) {
  const monthlyIncome = Number(profile.monthlyIncome) || 0;
  const monthlyExpenses = Number(profile.monthlyExpenses) || 0;
  const monthlyLiabilities = Number(profile.monthlyLiabilities) || 0;
  const monthlyDebtRepayment = Number(profile.monthlyDebtRepayment) || 0;

  const discretionaryExpenses = Math.max(0, monthlyExpenses - monthlyLiabilities);
  const availableAfterEssentials = monthlyIncome - (monthlyExpenses + monthlyDebtRepayment);

  return {
    income: monthlyIncome,
    essentials: monthlyLiabilities,
    discretionary: discretionaryExpenses,
    debtRepayment: monthlyDebtRepayment,
    savingsOpportunity: Math.max(0, availableAfterEssentials),
    savingsPercentage: monthlyIncome > 0 ? ((availableAfterEssentials / monthlyIncome) * 100).toFixed(1) : 0,
  };
}
