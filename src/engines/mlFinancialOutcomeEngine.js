/**
 * ML Financial Outcome Prediction Engine
 * Predicts future financial states and outcomes
 *
 * Predictions:
 * - 6/12/24 month wealth trajectories
 * - Probability of reaching financial goals
 * - Portfolio outcome distributions
 * - Risk of financial crisis (runway depletion)
 * - Income trajectory predictions
 */

import { mean, stdDev } from "./mlUtilities.js";
import { buildModelLineage } from "./modelRegistry.js";

function financialOutcomeGovernance(modelType, dataPoints = 0, metrics = null) {
  return buildModelLineage({
    modelType,
    metrics,
    dataPoints
  });
}

/**
 * Monte Carlo simulation for financial projections
 */
export function runMonteCarloProjection(currentState = {}, params = {}) {
  const {
    monthlyIncome = currentState.monthlyIncome || 50000,
    monthlyExpense = currentState.monthlyExpense || 40000,
    currentSavings = currentState.savings || 200000,
    investmentReturn = params.investmentReturn || 0.08, // 8% annual
    inflationRate = params.inflationRate || 0.03,
    incomeVolatility = params.incomeVolatility || 0.1,
    months = params.months || 12,
    simulations = params.simulations || 1000
  } = params;

  const projections = [];

  for (let sim = 0; sim < simulations; sim++) {
    let balance = currentSavings;
    const trajectory = [balance];

    for (let month = 0; month < months; month++) {
      // Variable income (with volatility)
      const volatileFactor = 1 + (Math.random() - 0.5) * incomeVolatility;
      const income = monthlyIncome * volatileFactor;

      // Inflation-adjusted expenses
      const inflatedExpense = monthlyExpense * Math.pow(1 + inflationRate / 12, month);

      // Monthly cashflow
      const netCashflow = income - inflatedExpense;
      balance += netCashflow;

      // Investment returns on balance (12% APR = 1% per month)
      const monthlyReturn = investmentReturn / 12;
      balance *= 1 + monthlyReturn;

      // Floor at zero
      balance = Math.max(0, balance);
      trajectory.push(balance);
    }

    projections.push(trajectory);
  }

  // Calculate statistics
  const endingBalances = projections.map(p => p[p.length - 1]);
  const endingMean = mean(endingBalances);
  const endingStd = stdDev(endingBalances);

  return {
    projections: projections.slice(0, 100), // Return sample for visualization
    statistics: {
      mean: endingMean,
      median: endingBalances.sort((a, b) => a - b)[Math.floor(endingBalances.length / 2)],
      stdDev: endingStd,
      min: Math.min(...endingBalances),
      max: Math.max(...endingBalances),
      p5: endingBalances.sort((a, b) => a - b)[Math.floor(endingBalances.length * 0.05)],
      p25: endingBalances.sort((a, b) => a - b)[Math.floor(endingBalances.length * 0.25)],
      p75: endingBalances.sort((a, b) => a - b)[Math.floor(endingBalances.length * 0.75)],
      p95: endingBalances.sort((a, b) => a - b)[Math.floor(endingBalances.length * 0.95)]
    },
    confidenceIntervals: {
      ci_90: [
        endingBalances.sort((a, b) => a - b)[Math.floor(endingBalances.length * 0.05)],
        endingBalances.sort((a, b) => a - b)[Math.floor(endingBalances.length * 0.95)]
      ],
      ci_68: [endingMean - endingStd, endingMean + endingStd]
    },
    riskMetrics: {
      probabilityOfNegativeReturn:
        endingBalances.filter(b => b < currentSavings).length / endingBalances.length,
      probabilityOfZeroBalance: endingBalances.filter(b => b <= 0).length / endingBalances.length,
      worstCase: Math.min(...endingBalances),
      bestCase: Math.max(...endingBalances)
    },
    modelGovernance: financialOutcomeGovernance("financial-monte-carlo", simulations)
  };
}

/**
 * Predict financial goal achievement probability
 */
export function predictGoalAchievement(currentState = {}, goal = {}, timeframeMonths = 12) {
  const {
    monthlyIncome = currentState.monthlyIncome || 50000,
    monthlyExpense = currentState.monthlyExpense || 40000,
    currentSavings = currentState.savings || 200000
  } = currentState;

  const { targetAmount = 500000, goalName = "Financial Goal" } = goal;

  // Simple linear projection
  const monthlySurplus = monthlyIncome - monthlyExpense;
  const projectedSavings = currentSavings + monthlySurplus * timeframeMonths;

  const achievementProbability = Math.min(1, projectedSavings / targetAmount);

  return {
    goalName,
    targetAmount,
    currentAmount: currentSavings,
    projectedAmount: projectedSavings,
    gap: Math.max(0, targetAmount - projectedSavings),
    timeframeMonths,
    achievementProbability: achievementProbability,
    achievementLikelihood:
      achievementProbability > 0.8
        ? "Very High"
        : achievementProbability > 0.6
          ? "High"
          : achievementProbability > 0.4
            ? "Moderate"
            : achievementProbability > 0.2
              ? "Low"
              : "Very Low",
    requiredMonthlySavings: Math.max(0, (targetAmount - currentSavings) / timeframeMonths),
    currentMonthlySavings: monthlySurplus,
    shortfallPerMonth: Math.max(
      0,
      (targetAmount - currentSavings) / timeframeMonths - monthlySurplus
    ),
    modelGovernance: financialOutcomeGovernance("goal-achievement", timeframeMonths)
  };
}

/**
 * Predict portfolio asset allocation outcomes
 */
export function predictPortfolioOutcomes(portfolio = {}, timeframeYears = 5) {
  const { stocks = 0, bonds = 0, cash = 0, realEstate = 0 } = portfolio;

  const total = stocks + bonds + cash + realEstate;
  const stockPct = stocks / total;
  const bondPct = bonds / total;
  const cashPct = cash / total;
  const reaPct = realEstate / total;

  // Expected returns (historical averages)
  const expectedReturns = {
    stocks: 0.1, // 10% annual
    bonds: 0.045, // 4.5% annual
    cash: 0.045, // 4.5% annual (money market)
    realEstate: 0.07 // 7% annual
  };

  // Volatility (standard deviation)
  const volatilities = {
    stocks: 0.18,
    bonds: 0.05,
    cash: 0.01,
    realEstate: 0.12
  };

  const portfolioExpectedReturn =
    stockPct * expectedReturns.stocks +
    bondPct * expectedReturns.bonds +
    cashPct * expectedReturns.cash +
    reaPct * expectedReturns.realEstate;

  // Simplified portfolio volatility (correlation not accounted)
  const portfolioVolatility = Math.sqrt(
    Math.pow(stockPct * volatilities.stocks, 2) +
      Math.pow(bondPct * volatilities.bonds, 2) +
      Math.pow(cashPct * volatilities.cash, 2) +
      Math.pow(reaPct * volatilities.realEstate, 2)
  );

  // Wealth projection over timeframe
  const projectedValue = total * Math.pow(1 + portfolioExpectedReturn, timeframeYears);
  const bestCase =
    total * Math.pow(1 + portfolioExpectedReturn + portfolioVolatility, timeframeYears);
  const worstCase =
    total * Math.pow(1 + portfolioExpectedReturn - portfolioVolatility, timeframeYears);

  return {
    currentValue: total,
    projectedValue: projectedValue,
    timeframeYears: timeframeYears,
    expectedReturn: portfolioExpectedReturn * 100, // As percentage
    portfolioVolatility: portfolioVolatility * 100,
    scenarios: {
      base: projectedValue,
      optimistic: bestCase,
      pessimistic: worstCase
    },
    allocation: {
      stocks: stockPct * 100,
      bonds: bondPct * 100,
      cash: cashPct * 100,
      realEstate: reaPct * 100
    },
    riskProfile:
      portfolioVolatility > 0.15
        ? "Aggressive"
        : portfolioVolatility > 0.1
          ? "Moderate-High"
          : portfolioVolatility > 0.05
            ? "Moderate"
            : "Conservative",
    recommendation:
      portfolioVolatility > 0.2
        ? "Consider reducing equity exposure"
        : portfolioVolatility < 0.03
          ? "Current allocation is very conservative"
          : "Current allocation is well-balanced",
    modelGovernance: financialOutcomeGovernance("portfolio-outcome", timeframeYears)
  };
}

/**
 * Predict runway depletion risk
 */
export function predictRunwayDepletionRisk(currentState = {}, projectionMonths = 24) {
  const {
    savings = currentState.savings || 0,
    monthlyExpense = currentState.monthlyExpense || 40000,
    monthlyIncome = currentState.monthlyIncome || 0
  } = currentState;

  const monthlyDeficit = monthlyExpense - monthlyIncome;

  let balance = savings;
  let depletionMonth = null;
  const trajectory = [savings];

  for (let month = 1; month <= projectionMonths; month++) {
    balance -= monthlyDeficit;
    trajectory.push(Math.max(0, balance));

    if (balance <= 0 && !depletionMonth) {
      depletionMonth = month;
    }
  }

  const runwayMonths =
    depletionMonth !== null
      ? depletionMonth
      : projectionMonths + Math.floor(savings / Math.max(1, monthlyDeficit));

  return {
    currentBalance: savings,
    monthlyDeficit: monthlyDeficit,
    runwayMonths: runwayMonths,
    riskLevel:
      runwayMonths < 3
        ? "Critical"
        : runwayMonths < 6
          ? "High"
          : runwayMonths < 12
            ? "Moderate"
            : "Low",
    depletionMonth: depletionMonth,
    trajectory: trajectory,
    actions: getRunwayRiskActions(runwayMonths, monthlyDeficit),
    modelGovernance: financialOutcomeGovernance("runway-depletion", projectionMonths)
  };
}

/**
 * Get actions to address runway risk
 */
function getRunwayRiskActions(runwayMonths, monthlyDeficit) {
  const actions = [];

  if (runwayMonths < 1) {
    actions.push("URGENT: Seek immediate income increase or expense reduction");
    actions.push("Explore emergency assistance or loans");
    actions.push("Prepare for potential lifestyle downgrade");
  } else if (runwayMonths < 3) {
    actions.push("Reduce expenses by 20-30% minimum");
    actions.push("Pursue income increase opportunities (side gig, job change)");
    actions.push("Cut non-essential spending immediately");
  } else if (runwayMonths < 6) {
    actions.push("Create structured expense reduction plan");
    actions.push("Build additional income streams");
    actions.push("Review major expense categories for optimization");
  } else if (runwayMonths < 12) {
    actions.push("Increase savings rate to build buffer");
    actions.push("Optimize expenses through renegotiation");
    actions.push("Plan for income growth to reach 12-month runway");
  }

  return actions;
}

/**
 * Predict behavioral spending patterns and their financial impact
 */
export function predictSpendingBehaviorOutcome(assessment, result, projectionMonths = 12) {
  const baselineExpense = result?.monthlyExpense || 40000;

  // Assess spending control factors
  const awarenessScore = result?.awarenessScore || 0;
  const behaviourScore = result?.behaviourScore || 0;
  const impulsePenalty = (1 - behaviourScore / 45) * 0.15; // Up to 15% overspend
  const awarenessBonus = (awarenessScore / 30) * 0.1; // Up to 10% savings

  const adjustedMonthlyExpense = baselineExpense * (1 + impulsePenalty - awarenessBonus);
  const monthlyDifference = adjustedMonthlyExpense - baselineExpense;
  const projectedOverspend = monthlyDifference * projectionMonths;

  return {
    baselineMonthlyExpense: baselineExpense,
    predictedMonthlyExpense: adjustedMonthlyExpense,
    monthlyDifference: monthlyDifference,
    projectionMonths: projectionMonths,
    projectedOverspend: projectedOverspend,
    modelGovernance: financialOutcomeGovernance("spending-behavior-outcome", projectionMonths),
    impactCategory: monthlyDifference > 0 ? "Overspending Risk" : "Savings Opportunity",
    spendingTrajectory: monthlyDifference > 0 ? "Increasing" : "Decreasing",
    recommendation:
      monthlyDifference > 0
        ? `Your behavior patterns suggest ~₹${Math.abs(monthlyDifference).toLocaleString("en-IN")} overspend per month. Implement controls to prevent ${Math.abs(projectedOverspend).toLocaleString("en-IN")} loss over ${projectionMonths} months.`
        : `Your awareness and behavior control enable savings of ~₹${Math.abs(monthlyDifference).toLocaleString("en-IN")} per month.`
  };
}

/**
 * Generate comprehensive financial outcome report
 */
export function generateFinancialOutcomeReport(assessment, result, projectionParams = {}) {
  const currentState = {
    savings: result?.emergencySavings || result?.savings || 0,
    monthlyIncome: result?.monthlyIncome || 0,
    monthlyExpense: result?.monthlyExpense || 0
  };

  return {
    timestamp: new Date().toISOString(),
    currentState: currentState,
    modelGovernance: {
      projection12Month: financialOutcomeGovernance(
        "financial-monte-carlo",
        projectionParams.simulations || 1000
      ),
      goalAchievement: financialOutcomeGovernance("goal-achievement", 60),
      runwayRisk: financialOutcomeGovernance("runway-depletion", 24),
      spendingOutcome: financialOutcomeGovernance("spending-behavior-outcome", 12),
      portfolioOutcome: result?.portfolio ? financialOutcomeGovernance("portfolio-outcome", 5) : null
    },

    // 12-month projection
    projection12Month: runMonteCarloProjection(currentState, {
      months: 12,
      ...projectionParams
    }),

    // Goal tracking
    goalAchievement: predictGoalAchievement(
      currentState,
      {
        targetAmount: result?.financialGoal || 1000000,
        goalName: "Financial Independence Fund"
      },
      60
    ),

    // Runway risk
    runwayRisk: predictRunwayDepletionRisk(currentState, 24),

    // Spending behavior impact
    spendingOutcome: predictSpendingBehaviorOutcome(assessment, result, 12),

    // Portfolio prediction (if available)
    portfolioOutcome: result?.portfolio ? predictPortfolioOutcomes(result.portfolio, 5) : null,

    // Overall financial health trend
    healthTrend:
      result?.healthScore > 70 ? "Strong" : result?.healthScore > 50 ? "Moderate" : "Weak",
    riskTrend: result?.riskScore > 70 ? "High" : result?.riskScore > 50 ? "Moderate" : "Low",

    // Key recommendations
    keyRecommendations: [
      currentState.monthlyIncome > currentState.monthlyExpense
        ? "Your income exceeds expenses. Increase savings rate to accelerate goals."
        : "Income is insufficient. Increase income or reduce expenses.",
      result?.runwayMonths < 6
        ? "Build your emergency fund to 6+ months of expenses."
        : "Maintain emergency fund and invest surplus.",
      result?.awarenessScore < 15
        ? "Improve awareness through tracking and review cycles."
        : "Use high awareness to identify new optimization opportunities."
    ]
  };
}
