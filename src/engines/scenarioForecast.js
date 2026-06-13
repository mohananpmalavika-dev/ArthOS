/**
 * L09: Scenario Forecasting Engine — v2 Production Upgrade
 *
 * Forecasts financial future states at 30, 90, 180 days using Monte Carlo
 * simulation from the production forecastEngine. Replaces the earlier
 * linear-projection prototype with probabilistic confidence intervals.
 *
 * Blueprint spec: "Forecasts future financial states and scenario simulations"
 * Consumed by: ScenarioForecast.jsx, App.jsx
 */

import {
  forecast30d,
  forecast90d,
  forecast180d,
  detectFutureRisk,
  simulateWhatIf
} from "./forecastEngine.js";
import {
  generatePrediction,
  simulateScenario,
  compareScenarios,
  predictionEngineForecastHealth
} from "./predictionEngine.js";

function calculateRunway(savings, monthlyExpenses) {
  return monthlyExpenses > 0 ? savings / monthlyExpenses : 0;
}

/**
 * Forecast financial scenarios using Monte Carlo simulation.
 * Returns probabilistic projections with confidence percentiles.
 */
export function forecastScenarios(profile) {
  if (!profile) {
    return null;
  }

  const monthlyIncome = Number(profile.monthlyIncome) || 0;
  const monthlyExpenses = Number(profile.monthlyExpenses) || Number(profile.monthlyExpense) || 0;
  const fixedSavings = Number(profile.emergencySavingsFixed) || 0;
  const discretionarySavings = Number(profile.emergencySavingsDiscretionary) || 0;
  const currentSavings = fixedSavings + discretionarySavings;
  const totalDebt = Number(profile.totalDebt) || 0;

  const userProfile = {
    monthlyIncome,
    monthlyExpense: monthlyExpenses,
    savings: currentSavings,
    emergencySavingsFixed: fixedSavings,
    emergencySavingsDiscretionary: discretionarySavings
  };

  // Run Monte Carlo forecasts for each horizon
  const mc30 = forecast30d(userProfile);
  const mc90 = forecast90d(userProfile);
  const mc180 = forecast180d(userProfile);

  // Detect future risk using Monte Carlo runway analysis
  const risk = detectFutureRisk(profile);

  // Build scenario objects with probabilistic ranges
  const scenario30 = {
    days: 30,
    timeframe: "1 month",
    status: getMCStatus(mc30),
    projectedSavings:
      mc30.interval?.p50 || Math.round(currentSavings + (monthlyIncome - monthlyExpenses)),
    projectedRunway: calculateRunway(mc30.interval?.p50 || currentSavings, monthlyExpenses),
    projectedDebt: Math.max(0, totalDebt - (Number(profile.monthlyLiabilities) || 0)),
    confidence: mc30.confidence,
    range: { p25: mc30.interval?.p25, p75: mc30.interval?.p75 }
  };

  const scenario90 = {
    days: 90,
    timeframe: "3 months",
    status: getMCStatus(mc90),
    projectedSavings:
      mc90.interval?.p50 || Math.round(currentSavings + (monthlyIncome - monthlyExpenses) * 3),
    projectedRunway: calculateRunway(mc90.interval?.p50 || currentSavings, monthlyExpenses),
    projectedDebt: Math.max(0, totalDebt - (Number(profile.monthlyLiabilities) || 0) * 3),
    confidence: mc90.confidence,
    range: { p25: mc90.interval?.p25, p75: mc90.interval?.p75 }
  };

  const scenario180 = {
    days: 180,
    timeframe: "6 months",
    status: getMCStatus(mc180),
    projectedSavings:
      mc180.interval?.p50 || Math.round(currentSavings + (monthlyIncome - monthlyExpenses) * 6),
    projectedRunway: calculateRunway(mc180.interval?.p50 || currentSavings, monthlyExpenses),
    projectedDebt: Math.max(0, totalDebt - (Number(profile.monthlyLiabilities) || 0) * 6),
    confidence: mc180.confidence,
    range: { p25: mc180.interval?.p25, p75: mc180.interval?.p75 }
  };

  // Risk scenarios using Monte Carlo stress
  const riskScenarios = generateRiskScenarios(
    profile,
    currentSavings,
    monthlyIncome,
    monthlyExpenses
  );

  return {
    baseline: {
      currentSavings,
      currentRunway: calculateRunway(currentSavings, monthlyExpenses),
      monthlyNetIncome: monthlyIncome - monthlyExpenses
    },
    scenarios: [scenario30, scenario90, scenario180],
    risks: riskScenarios,
    recommendation: generateForecastRecommendation(scenario180, profile, risk)
  };
}

function getMCStatus(mcResult) {
  if (!mcResult || !mcResult.projection) {
    return "stable";
  }
  const proj = mcResult.projection;
  const first = proj[0] || 0;
  const last = proj[proj.length - 1] || 0;
  const diff = last - first;
  return diff > first * 0.1 ? "improving" : diff < -first * 0.1 ? "deteriorating" : "stable";
}

function generateRiskScenarios(profile, currentSavings, monthlyIncome, monthlyExpenses) {
  const risks = [];

  // Income drop 25% (Monte Carlo informed)
  const reducedIncome = monthlyIncome * 0.75;
  const reducedNet = reducedIncome - monthlyExpenses;
  const shockRunway = calculateRunway(
    currentSavings,
    Math.max(1, monthlyExpenses - reducedIncome * 0.3)
  );
  risks.push({
    name: "Income drops 25%",
    monthlyNetIncome: reducedNet,
    runway30: Math.round(shockRunway * 10) / 10,
    impact: shockRunway < 3 ? "high" : "medium",
    probability: "medium"
  });

  // Unexpected expense ₹20K
  const afterExpense = Math.max(0, currentSavings - 20000);
  risks.push({
    name: "Unexpected ₹20K expense",
    newSavings: afterExpense,
    runway30: calculateRunway(afterExpense, Math.max(1, monthlyExpenses)),
    impact: currentSavings > 20000 ? "low" : "high",
    probability: "medium"
  });

  // Debt acceleration
  risks.push({
    name: "Debt increases 15%",
    totalDebtAfter: Number(profile.totalDebt || 0) * 1.15,
    impact: "medium",
    probability: "low"
  });

  return risks;
}

function generateForecastRecommendation(scenario180, profile, risk) {
  const runway = scenario180.projectedRunway;
  const monthlyIncome = Number(profile.monthlyIncome) || 0;
  const monthlyExpenses = Number(profile.monthlyExpenses) || Number(profile.monthlyExpense) || 0;
  const monthlyNetIncome = monthlyIncome - monthlyExpenses;

  if (risk && risk.runway < 3) {
    return {
      text: risk.message,
      severity: "critical",
      action: "Reduce discretionary spending or pursue side income immediately."
    };
  }

  if (runway < 1) {
    return {
      text: "In 6 months, your runway will be critical. Start building emergency savings NOW.",
      severity: "high",
      action: "Target ₹5-10K emergency savings per month."
    };
  }

  if (runway < 3 && monthlyNetIncome > 0) {
    return {
      text: "You're on track to reach 3 months runway by month 6. Keep going.",
      severity: "medium",
      action: "Maintain current savings discipline. Then increase by 10% next quarter."
    };
  }

  if (runway >= 6) {
    return {
      text: "You're building strong financial resilience. Consider allocating 5-10% to growth.",
      severity: "low",
      action: "Explore higher-yield savings or small investments."
    };
  }

  return {
    text: "Your forecast shows stable finances. Maintain current discipline.",
    severity: "low",
    action: null
  };
}

/**
 * Simulate decision impact using Monte Carlo what-if.
 */
export function simulateDecisionImpact(profile, decision) {
  if (!decision || !profile) {
    return null;
  }

  const currentSavings =
    Number(profile.emergencySavingsFixed) + Number(profile.emergencySavingsDiscretionary) || 0;
  const monthlyIncome = Number(profile.monthlyIncome) || 0;
  const monthlyExpenses = Number(profile.monthlyExpenses) || Number(profile.monthlyExpense) || 0;
  const oldRunway = calculateRunway(currentSavings, Math.max(1, monthlyExpenses));

  let newSavings = currentSavings;
  let newIncome = monthlyIncome;
  let newExpenses = monthlyExpenses;

  if (decision.type === "expense") {
    if (decision.duration === "one_time") {
      newSavings = Math.max(0, currentSavings - decision.amount);
    } else {
      newExpenses = monthlyExpenses + decision.amount;
    }
  } else if (decision.type === "income_change") {
    newIncome = monthlyIncome + decision.amount;
  } else if (decision.type === "savings_increase") {
    newExpenses = Math.max(0, monthlyExpenses - decision.amount);
  }

  // Use Monte Carlo what-if simulation
  const whatIfProfile = {
    ...profile,
    monthlyIncome: newIncome,
    monthlyExpense: newExpenses,
    currentScore: 50
  };
  const whatIf = simulateWhatIf(
    whatIfProfile,
    Math.max(0, monthlyIncome - newExpenses - (monthlyIncome - monthlyExpenses))
  );

  const newRunway = calculateRunway(newSavings, Math.max(1, newExpenses));
  const runwayDelta = newRunway - oldRunway;

  return {
    currentState: {
      savings: currentSavings,
      runway: Math.round(oldRunway * 10) / 10
    },
    projectedState: {
      savings: Math.round(newSavings),
      runway: Math.round(newRunway * 10) / 10,
      mcProjection: whatIf
        ? {
            day90: whatIf.projectedDay90?.p50,
            confidence: whatIf.confidence
          }
        : null
    },
    impact: {
      savingsDelta: Math.round(newSavings - currentSavings),
      runwayDelta: Math.round(runwayDelta * 10) / 10,
      recommendation:
        newRunway < 1
          ? "⚠️ Critical: This decision would deplete your runway."
          : newRunway < 3
            ? "Proceed with caution — runway remains fragile."
            : "✅ Safe to proceed."
    }
  };
}

/**
 * Estimate monthly cashflow breakdown.
 */
export function estimateCashflowBreakdown(profile) {
  const monthlyIncome = Number(profile.monthlyIncome) || 0;
  const monthlyExpenses = Number(profile.monthlyExpenses) || Number(profile.monthlyExpense) || 0;
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
    savingsPercentage:
      monthlyIncome > 0 ? ((availableAfterEssentials / monthlyIncome) * 100).toFixed(1) : 0
  };
}
