/**
 * L11: Financial Digital Twin — v3 Production Upgrade
 *
 * Full simulation environment for financial futures with Monte Carlo confidence
 * intervals, multi-lifecycle scenarios (savings, debt, income, job loss, home,
 * career change), stress testing, and probabilistic runway projections.
 *
 * Blueprint spec: "Full simulation environment for financial futures"
 * v2: Basic what-if heuristics + Monte Carlo on runway
 * v3: Lifecycle scenario orchestration + probabilistic twin state + regime-aware stress
 */

import { stressTestTwin } from "./stressTestEngine.js";
import { estimateCashflowBreakdown } from "./scenarioForecast.js";

function clamp(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, value);
}

function clampScore(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 50;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toNumber(value) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

// ============================================================
// PROBABILISTIC TWIN STATE
// ============================================================

/**
 * Build a probabilistic twin state from profile and behaviour data.
 * Each dimension has a distribution (median, lower, upper) rather than a point estimate.
 */
export function buildProbabilisticTwinState(profile = {}, behaviour = {}) {
  const monthlyIncome = toNumber(profile.monthlyIncome);
  const monthlyExpenses = toNumber(profile.expenses || profile.monthlyExpense || profile.monthlySpending || 0);
  const fixedSavings = toNumber(profile.emergencySavingsFixed || 0);
  const discretionarySavings = toNumber(profile.emergencySavingsDiscretionary || 0);
  const totalSavings = fixedSavings + discretionarySavings;
  const totalDebt = toNumber(profile.totalDebt || 0);
  const monthlyLiabilities = toNumber(profile.monthlyLiabilities || 0);
  const elasticityFactor = toNumber(behaviour.activeElasticityFactor || 0.4);

  // Probabilistic estimates with default variance
  const incomeVolatility = monthlyIncome * 0.05; // 5% monthly variance
  const expenseVolatility = monthlyExpenses * 0.08; // 8% monthly variance

  return {
    monthlyIncome: {
      median: monthlyIncome,
      lower: clamp(monthlyIncome - incomeVolatility),
      upper: monthlyIncome + incomeVolatility,
    },
    monthlyExpenses: {
      median: monthlyExpenses,
      lower: clamp(monthlyExpenses - expenseVolatility),
      upper: monthlyExpenses + expenseVolatility,
    },
    savings: {
      median: totalSavings,
      lower: clamp(totalSavings * 0.9),
      upper: totalSavings * 1.1,
    },
    totalDebt: {
      median: totalDebt,
      lower: clamp(totalDebt * 0.95),
      upper: totalDebt * 1.05,
    },
    monthlyLiabilities,
    elasticityFactor,
    netCashflow: {
      median: monthlyIncome - monthlyExpenses,
      lower: clamp((monthlyIncome - incomeVolatility) - (monthlyExpenses + expenseVolatility)),
      upper: (monthlyIncome + incomeVolatility) - clamp(monthlyExpenses - expenseVolatility),
    },
    baseRunway: monthlyExpenses > 0 ? totalSavings / monthlyExpenses : 0,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================
// SIMULATION CORE
// ============================================================

function projectRunway(savings, monthlyNet, monthlyExpenses, months, volatility = 0) {
  const trajectory = [];
  let balance = savings;

  for (let m = 0; m < months; m++) {
    const variance = volatility > 0 ? (Math.random() - 0.5) * volatility * Math.abs(monthlyNet) : 0;
    balance = Math.max(0, balance + monthlyNet + variance);
    trajectory.push({
      month: m + 1,
      balance: Math.round(balance),
      runway: monthlyExpenses > 0 ? balance / monthlyExpenses : 0,
    });
  }

  return trajectory;
}

function monteCarloRunway(savings, monthlyNet, monthlyExpenses, months, iterations = 500) {
  const allTrajectories = [];

  for (let i = 0; i < iterations; i++) {
    const traj = projectRunway(savings, monthlyNet, monthlyExpenses, months, 0.3);
    allTrajectories.push(traj);
  }

  const percentiles = [];
  for (let m = 0; m < months; m++) {
    const balances = allTrajectories.map((t) => t[m].balance).sort((a, b) => a - b);
    percentiles.push({
      month: m + 1,
      p5: balances[Math.floor(0.05 * balances.length)],
      p25: balances[Math.floor(0.25 * balances.length)],
      p50: balances[Math.floor(0.50 * balances.length)],
      p75: balances[Math.floor(0.75 * balances.length)],
      p95: balances[Math.floor(0.95 * balances.length)],
      mean: Math.round(balances.reduce((s, v) => s + v, 0) / balances.length),
    });
  }

  return { percentiles, finalState: percentiles[percentiles.length - 1] };
}

// ============================================================
// SCENARIO SIMULATORS
// ============================================================

function simulateBaseline(twin) {
  const monthlyIncome = toNumber(twin.monthlyIncome);
  const monthlyExpenses = toNumber(twin.expenses || twin.monthlyExpense || twin.monthlySpending || twin.monthlyExpenses || 0);
  const savings = toNumber(twin.savings || twin.emergencySavings || 0) +
    toNumber(twin.emergencySavingsFixed || 0) +
    toNumber(twin.emergencySavingsDiscretionary || 0);
  const currentRunway = monthlyExpenses > 0 ? savings / monthlyExpenses : 0;
  const monthlyNet = monthlyIncome - monthlyExpenses;

  const mc = monteCarloRunway(savings, monthlyNet, monthlyExpenses, 24);

  return {
    name: 'Baseline',
    currentSavings: Math.round(savings),
    currentRunway: Math.round(currentRunway * 10) / 10,
    monthlyNet: Math.round(monthlyNet),
    sixMonth: mc.percentiles[5] || null,
    twelveMonth: mc.percentiles[11] || null,
    twentyFourMonth: mc.finalState,
    confidence: mc.percentiles,
    recommendation: currentRunway < 3
      ? 'Baseline trajectory shows critical runway. Intervention needed.'
      : currentRunway < 6
        ? 'Baseline is stable but fragile. Consider strengthening reserves.'
        : 'Baseline shows healthy runway. Maintain current habits.',
  };
}

export function simulateSavings(baseRunway, amount) {
  const bonusRunway = Math.round(amount / 5000) || 0;
  return Math.max(0, baseRunway + bonusRunway);
}

function simulateEnhancedSavings(twin, additionalMonthlySavings) {
  const monthlyIncome = toNumber(twin.monthlyIncome);
  const monthlyExpenses = toNumber(twin.expenses || twin.monthlyExpense || twin.monthlySpending || twin.monthlyExpenses || 0);
  const savings = toNumber(twin.savings || twin.emergencySavings || 0) +
    toNumber(twin.emergencySavingsFixed || 0) +
    toNumber(twin.emergencySavingsDiscretionary || 0);
  const currentRunway = monthlyExpenses > 0 ? savings / monthlyExpenses : 0;
  const newMonthlyExpenses = Math.max(0, monthlyExpenses - additionalMonthlySavings);
  const newMonthlyNet = monthlyIncome - newMonthlyExpenses;

  const mc = monteCarloRunway(savings, newMonthlyNet, newMonthlyExpenses, 24);
  const projectedRunway = mc.twentyFourMonth?.runway || 0;

  return {
    name: `Save ₹${additionalMonthlySavings}/mo more`,
    delta: -additionalMonthlySavings,
    newMonthlyExpenses: Math.round(newMonthlyExpenses),
    newMonthlyNet: Math.round(newMonthlyNet),
    currentRunway: Math.round(currentRunway * 10) / 10,
    projectedRunway: Math.round(projectedRunway * 10) / 10,
    improvement: Math.round((projectedRunway - currentRunway) * 10) / 10,
    sixMonth: mc.percentiles[5],
    twelveMonth: mc.percentiles[11],
    confidence: mc.percentiles,
    payoff: projectedRunway > currentRunway
      ? `${Math.round((projectedRunway - currentRunway) * 10) / 10} months additional runway`
      : 'Minimal improvement — consider larger savings target',
  };
}

export function simulateDebtReduction(baseRunway, amount) {
  const runwayGain = Math.round(amount / 7500) || 0;
  return Math.max(0, baseRunway + runwayGain + 1);
}

function simulateDebtPaydown(twin, monthlyExtraDebtPayment) {
  const monthlyIncome = toNumber(twin.monthlyIncome);
  const monthlyExpenses = toNumber(twin.expenses || twin.monthlyExpense || twin.monthlySpending || twin.monthlyExpenses || 0);
  const totalDebt = toNumber(twin.totalDebt);
  const savings = toNumber(twin.savings || twin.emergencySavings || 0) +
    toNumber(twin.emergencySavingsFixed || 0) +
    toNumber(twin.emergencySavingsDiscretionary || 0);
  const currentRunway = monthlyExpenses > 0 ? savings / monthlyExpenses : 0;

  const totalPayment = monthlyExtraDebtPayment * 12;
  const remainingDebt = Math.max(0, totalDebt - totalPayment);
  const interestSaved = totalDebt * 0.10;
  const runwayAfter = monthlyExpenses > 0 ? (savings + interestSaved) / monthlyExpenses : 0;

  return {
    name: `Pay ₹${monthlyExtraDebtPayment}/mo extra on debt`,
    monthlyExtraPayment: monthlyExtraDebtPayment,
    totalDebt,
    remainingDebtAfter12Mo: Math.round(remainingDebt),
    interestSaved12Mo: Math.round(interestSaved),
    currentRunway: Math.round(currentRunway * 10) / 10,
    projectedRunway: Math.round(runwayAfter * 10) / 10,
    runwayImprovement: Math.round((runwayAfter - currentRunway) * 10) / 10,
    debtFreeMonths: monthlyExtraDebtPayment > 0 ? Math.ceil(totalDebt / monthlyExtraDebtPayment) : 'N/A',
  };
}

export function simulateSalaryIncrease(baseRunway, amount) {
  const runwayGain = Math.round(amount / 10000) || 0;
  return Math.max(0, baseRunway + runwayGain + 2);
}

function simulateIncomeChange(twin, additionalMonthlyIncome, label = 'Income Increase') {
  const monthlyIncome = toNumber(twin.monthlyIncome);
  const monthlyExpenses = toNumber(twin.expenses || twin.monthlyExpense || twin.monthlySpending || twin.monthlyExpenses || 0);
  const savings = toNumber(twin.savings || twin.emergencySavings || 0) +
    toNumber(twin.emergencySavingsFixed || 0) +
    toNumber(twin.emergencySavingsDiscretionary || 0);
  const currentRunway = monthlyExpenses > 0 ? savings / monthlyExpenses : 0;
  const newMonthlyIncome = monthlyIncome + additionalMonthlyIncome;
  const newMonthlyNet = newMonthlyIncome - monthlyExpenses;

  const mc = monteCarloRunway(savings, newMonthlyNet, monthlyExpenses, 24);

  return {
    name: label,
    delta: additionalMonthlyIncome,
    newMonthlyIncome: Math.round(newMonthlyIncome),
    newMonthlyNet: Math.round(newMonthlyNet),
    currentRunway: Math.round(currentRunway * 10) / 10,
    projectedRunway: Math.round((mc.twentyFourMonth?.runway || 0) * 10) / 10,
    improvement: Math.round(((mc.twentyFourMonth?.runway || 0) - currentRunway) * 10) / 10,
    sixMonth: mc.percentiles[5],
    twelveMonth: mc.percentiles[11],
    confidence: mc.percentiles,
  };
}

export function simulateJobLoss(currentRunway) {
  return Math.max(0, currentRunway - 5);
}

function simulateIncomeShock(twin, incomeReductionPct, label = 'Income Shock') {
  const monthlyIncome = toNumber(twin.monthlyIncome);
  const monthlyExpenses = toNumber(twin.expenses || twin.monthlyExpense || twin.monthlySpending || twin.monthlyExpenses || 0);
  const savings = toNumber(twin.savings || twin.emergencySavings || 0) +
    toNumber(twin.emergencySavingsFixed || 0) +
    toNumber(twin.emergencySavingsDiscretionary || 0);
  const fixedLiabilities = toNumber(twin.monthlyLiabilities || 0) || 0;
  const elasticityFactor = toNumber(twin.activeElasticityFactor) || 0.4;
  const currentRunway = monthlyExpenses > 0 ? savings / monthlyExpenses : 0;

  const reducedIncome = monthlyIncome * (1 - incomeReductionPct / 100);
  const flexibleExpenses = Math.max(0, monthlyExpenses - fixedLiabilities);
  const reducedFlexibleExpenses = flexibleExpenses * (1 - elasticityFactor * (incomeReductionPct / 100));
  const crisisExpenses = fixedLiabilities + reducedFlexibleExpenses;
  const crisisNet = reducedIncome - crisisExpenses;

  const mc = monteCarloRunway(savings, crisisNet, crisisExpenses, 12);
  const survivalDays = mc.percentiles.find((p) => p.p50 <= 0)?.month || 12;

  return {
    name: `${label} (${incomeReductionPct}% reduction)`,
    incomeReductionPct,
    reducedIncome: Math.round(reducedIncome),
    crisisExpenses: Math.round(crisisExpenses),
    crisisNet: Math.round(crisisNet),
    currentRunway: Math.round(currentRunway * 10) / 10,
    survivalMonths: survivalDays,
    survivalDays: Math.round(survivalDays * 30),
    severity: survivalDays < 3 ? 'critical' : survivalDays < 6 ? 'high' : survivalDays < 12 ? 'moderate' : 'low',
    sixMonth: mc.percentiles[5],
    recommendation: survivalDays < 3
      ? '⚠️ Immediate risk: income shock would deplete savings within 3 months.'
      : survivalDays < 6
        ? '⚠️ High risk: build emergency buffer to at least 6 months of expenses.'
        : survivalDays < 12
          ? 'Moderate risk: current buffer provides some cushion.'
          : 'Resilient: savings buffer can absorb this shock.',
  };
}

/**
 * Scenario: Home purchase with EMI.
 */
export function simulateHomePurchase(twin = {}, emi = 0) {
  const income = toNumber(twin.monthlyIncome || 0);
  const expenses = toNumber(twin.expenses || twin.monthlyExpense || twin.monthlySpending || twin.monthlyExpenses || 0);
  const disposable = income - expenses - emi;
  return {
    disposableIncome: Math.round(disposable),
    affordability: disposable > 0,
    debtToIncome: income > 0 ? Math.round(((expenses + emi) / income) * 100) : 0,
    recommendation: disposable > 0
      ? `Affordable at ₹${Math.round(disposable)}/mo disposable income post-EMI.`
      : `EMI of ₹${emi} exceeds disposable income — consider lower EMI or higher down payment.`,
  };
}

/**
 * Scenario: Career change with new income.
 */
export function simulateCareerChange(twin = {}, newIncome = 0) {
  const monthlyIncome = toNumber(twin.monthlyIncome || 0);
  const monthlyExpenses = toNumber(twin.expenses || twin.monthlyExpense || twin.monthlySpending || twin.monthlyExpenses || 0);
  const savings = toNumber(twin.savings || twin.emergencySavings || 0) +
    toNumber(twin.emergencySavingsFixed || 0) +
    toNumber(twin.emergencySavingsDiscretionary || 0);
  const currentRunway = monthlyExpenses > 0 ? savings / monthlyExpenses : 0;
  const delta = newIncome - monthlyIncome;
  const newMonthlyNet = newIncome - monthlyExpenses;
  const newRunway = monthlyExpenses > 0 && newMonthlyNet > 0
    ? savings / monthlyExpenses + (newMonthlyNet * 12) / monthlyExpenses
    : Math.max(0, currentRunway + delta * 12);

  return {
    incomeDelta: Math.round(delta),
    newIncome: Math.round(newIncome),
    newMonthlyNet: Math.round(newMonthlyNet),
    projectedRunway: Math.round(newRunway * 10) / 10,
    projectedHealthDelta: Math.round(delta / 1000),
    direction: delta > 0 ? 'improvement' : delta < 0 ? 'decline' : 'neutral',
  };
}

/**
 * Scenario: Life event (marriage, child, education, medical).
 */
export function simulateLifeEvent(twin = {}, eventType = '', monthlyCostImpact = 0) {
  const monthlyIncome = toNumber(twin.monthlyIncome || 0);
  const monthlyExpenses = toNumber(twin.expenses || twin.monthlyExpense || twin.monthlySpending || twin.monthlyExpenses || 0);
  const savings = toNumber(twin.savings || twin.emergencySavings || 0) +
    toNumber(twin.emergencySavingsFixed || 0) +
    toNumber(twin.emergencySavingsDiscretionary || 0);
  const currentRunway = monthlyExpenses > 0 ? savings / monthlyExpenses : 0;
  const newExpenses = monthlyExpenses + monthlyCostImpact;
  const newRunway = newExpenses > 0 ? savings / newExpenses : 0;

  return {
    name: `${eventType}: +₹${monthlyCostImpact}/mo`,
    eventType,
    monthlyCostImpact,
    currentRunway: Math.round(currentRunway * 10) / 10,
    newRunway: Math.round(newRunway * 10) / 10,
    delta: Math.round((newRunway - currentRunway) * 10) / 10,
    severity: newRunway < 3 ? 'critical' : newRunway < 6 ? 'high' : 'moderate',
    recommendation: newRunway < 3
      ? `⚠️ ${eventType} would critically reduce runway to ${newRunway.toFixed(1)} months. Plan ahead.`
      : newRunway < 6
        ? `Caution: ${eventType} reduces runway to ${newRunway.toFixed(1)} months. Build buffer first.`
        : `${eventType} impact is manageable with current savings buffer.`,
  };
}

// ============================================================
// STRESS TEST
// ============================================================

export { stressTestTwin } from "./stressTestEngine.js";

// ============================================================
// FULL TWIN BUILDER (v3)
// ============================================================

/**
 * Build all financial twin scenarios from assessment result + profile.
 * Returns a comprehensive simulation object with all lifecycle scenario projections
 * and probabilistic twin state.
 */
export function buildFinancialTwinScenarios(result, profile) {
  if (!result || !profile) {
    return {
      baseRunway: 0,
      survivalNow: 0,
      baseline: null,
      scenarios: [],
      stressTest: null,
      probabilisticState: null,
      generatedAt: new Date().toISOString(),
    };
  }

  const baseRunway = Number(result?.survivalMonthsRaw || 0);
  const fixedSavings = toNumber(profile?.emergencySavingsFixed || 0);
  const discretionarySavings = toNumber(profile?.emergencySavingsDiscretionary || 0);
  const totalSavings = fixedSavings + discretionarySavings;
  const monthlyExpenses = toNumber(profile?.monthlyExpense || profile?.monthlySpending || 0);
  const monthlyIncome = toNumber(profile?.monthlyIncome || 0);

  const twin = {
    monthlyIncome,
    expenses: monthlyExpenses,
    savings: totalSavings,
    emergencySavingsFixed: fixedSavings,
    emergencySavingsDiscretionary: discretionarySavings,
    totalDebt: toNumber(profile?.totalDebt || 0),
    monthlyLiabilities: toNumber(profile?.monthlyLiabilities || 0),
    healthScore: result.healthScore,
    activeElasticityFactor: result.activeElasticityFactor || 0.4,
  };

  // Build probabilistic twin state
  const probabilisticState = buildProbabilisticTwinState(profile, result);

  // Run all lifecycle scenario simulations
  const scenarios = [];

  // 1. Savings scenarios (₹5K, ₹10K, ₹15K)
  for (const amount of [5000, 10000, 15000]) {
    scenarios.push(simulateEnhancedSavings(twin, amount));
  }

  // 2. Debt scenarios (₹5K, ₹10K)
  for (const amount of [5000, 10000]) {
    scenarios.push(simulateDebtPaydown(twin, amount));
  }

  // 3. Income scenarios (₹10K raise, ₹20K raise, side income ₹5K)
  scenarios.push(simulateIncomeChange(twin, 10000, '₹10K Annual Raise'));
  scenarios.push(simulateIncomeChange(twin, 20000, '₹20K Annual Raise'));
  scenarios.push(simulateIncomeChange(twin, 5000, '₹5K Side Income'));

  // 4. Income shock scenarios (25%, 50%)
  scenarios.push(simulateIncomeShock(twin, 25, '25% Income Reduction'));
  scenarios.push(simulateIncomeShock(twin, 50, '50% Income Reduction'));

  // 5. Life event scenarios (marriage, child, medical)
  scenarios.push(simulateLifeEvent(twin, 'Marriage Expenses', monthlyExpenses * 0.2));
  scenarios.push(simulateLifeEvent(twin, 'Child Education', monthlyExpenses * 0.15));
  scenarios.push(simulateLifeEvent(twin, 'Medical Emergency', monthlyExpenses * 0.5));

  // 6. Home purchase simulation
  const homeEmi = toNumber(profile?.homeLoanEmi || 0) || monthlyIncome * 0.35;
  const homePurchaseSim = simulateHomePurchase(twin, homeEmi);

  // 7. Career change projection
  const careerChangeSim = simulateCareerChange(twin, monthlyIncome * 1.2);

  // 8. Baseline
  const baseline = simulateBaseline(twin);

  // 9. Stress test
  const stressTest = stressTestTwin({
    ...twin,
    monthlyIncome: twin.monthlyIncome,
    expenses: twin.expenses,
    savings: totalSavings,
    homeLoanEmi: homeEmi,
  });

  // Sort scenarios by impact
  scenarios.sort((a, b) => {
    const aImpact = a.improvement || a.projectedRunway || 0;
    const bImpact = b.improvement || b.projectedRunway || 0;
    return bImpact - aImpact;
  });

  const positiveScenarios = scenarios.filter((s) => (s.improvement || 0) >= 0 || (s.survivalMonths || 12) >= 6);
  const riskScenarios = scenarios.filter((s) => (s.improvement || 0) < 0 || (s.survivalMonths || 12) < 6);

  const cashflowBreakdown = estimateCashflowBreakdown(profile);

  return {
    baseRunway: Math.round(baseRunway * 10) / 10,
    survivalNow: Math.round(baseRunway),
    totalSavings: Math.round(totalSavings),
    monthlyExpenses: Math.round(monthlyExpenses),
    monthlyIncome: Math.round(monthlyIncome),

    probabilisticState,

    baseline,
    positiveScenarios: positiveScenarios.slice(0, 5),
    topOpportunities: positiveScenarios.slice(0, 2).map((s) => ({
      name: s.name,
      impact: s.improvement || s.projectedRunway || 0,
    })),

    riskScenarios: riskScenarios.slice(0, 3),
    topRisks: riskScenarios.slice(0, 2).map((s) => ({
      name: s.name,
      severity: s.severity || 'high',
    })),

    allScenarios: scenarios,

    homePurchase: homePurchaseSim,
    careerChange: careerChangeSim,

    stressTest,

    cashflowBreakdown,

    scenarioCount: scenarios.length + 1, // +1 for baseline

    generatedAt: new Date().toISOString(),
  };
}

// ============================================================
// BACKWARD-COMPATIBLE EXPORTS
// ============================================================

export {
  simulateEnhancedSavings,
  simulateDebtPaydown,
  simulateIncomeChange,
  simulateIncomeShock,
  simulateBaseline,
};
