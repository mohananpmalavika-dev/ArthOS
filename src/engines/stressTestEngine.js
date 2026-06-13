/**
 * L11: Stress Test Engine — v2 Production Upgrade
 *
 * Runs Monte Carlo stress test scenarios on the financial twin:
 * - Job loss (100% income loss)
 * - 50% income reduction
 * - Medical emergency (₹50K-₹2L expense shock)
 * - Market downturn (portfolio loss)
 *
 * Each scenario uses Monte Carlo simulation to produce probabilistic
 * runway and health impact distributions.
 *
 * Blueprint spec: "Full simulation environment for financial futures"
 */

function clamp(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toNumber(value) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Monte Carlo simulation for a stress scenario.
 * Projects balance trajectory with random variance.
 */
function monteCarloStress(savings, monthlyNet, monthlyExpenses, months, volatility = 0.3) {
  const trajectories = [];

  for (let i = 0; i < 200; i++) {
    const path = [];
    let balance = savings;
    for (let m = 0; m < months; m++) {
      const variance =
        volatility > 0 ? (Math.random() - 0.5) * 2 * volatility * Math.abs(monthlyNet) : 0;
      balance = Math.max(0, balance + monthlyNet + variance);
      path.push(balance);
    }
    trajectories.push(path);
  }

  // Compute percentiles at each month
  const percentiles = [];
  for (let m = 0; m < months; m++) {
    const values = trajectories.map(t => t[m]).sort((a, b) => a - b);
    percentiles.push({
      month: m + 1,
      p10: values[Math.floor(0.1 * values.length)],
      p25: values[Math.floor(0.25 * values.length)],
      p50: values[Math.floor(0.5 * values.length)],
      p75: values[Math.floor(0.75 * values.length)],
      p90: values[Math.floor(0.9 * values.length)]
    });
  }

  // Survival month = first month where p50 drops below 0
  const survival = percentiles.find(p => p.p50 <= 0);
  return {
    percentiles,
    survivalMonths: survival ? survival.month : months,
    survivalDays: (survival ? survival.month : months) * 30
  };
}

/**
 * Run comprehensive stress tests on the financial twin.
 * Accepts the same twin shape as financialTwinEngine.js.
 */
export function stressTestTwin(twin = {}) {
  const income = toNumber(twin.monthlyIncome || 0);
  const expenses = toNumber(twin.expenses || twin.monthlyExpense || twin.monthlySpending || 0);
  const savings =
    toNumber(twin.savings || twin.emergencySavings || 0) +
    toNumber(twin.emergencySavingsFixed || 0) +
    toNumber(twin.emergencySavingsDiscretionary || 0);
  const healthScore = clamp(twin.healthScore || 50);
  const homeLoanEmi = toNumber(twin.homeLoanEmi || 0);
  const fixedLiabilities = toNumber(twin.monthlyLiabilities || 0);
  const elasticityFactor = toNumber(twin.activeElasticityFactor) || 0.4;

  // Baseline runway
  const baseRunway = expenses > 0 ? savings / Math.max(1, expenses) : 0;

  // ── SCENARIO 1: 50% Income Loss ──
  const reducedIncome50 = income * 0.5;
  const crisisExpenses50 =
    fixedLiabilities + Math.max(0, expenses - fixedLiabilities) * (1 - elasticityFactor * 0.5);
  const mc50 = monteCarloStress(
    savings,
    reducedIncome50 - crisisExpenses50,
    crisisExpenses50,
    12,
    0.3
  );

  // ── SCENARIO 2: Full Job Loss (100% income loss) ──
  const crisisExpenses100 =
    fixedLiabilities + Math.max(0, expenses - fixedLiabilities) * (1 - elasticityFactor * 0.8);
  const mc100 = monteCarloStress(savings, -crisisExpenses100, crisisExpenses100, 12, 0.2);

  // ── SCENARIO 3: Medical Emergency (₹75K) ──
  const medicalCost = 75000;
  const savingsAfterMedical = Math.max(0, savings - medicalCost);
  const mcMedical = monteCarloStress(savingsAfterMedical, income - expenses, expenses, 6, 0.25);

  // ── SCENARIO 4: Home Purchase Stress ──
  const withEmiExpenses = expenses + homeLoanEmi;
  const mcHome = monteCarloStress(savings, income - withEmiExpenses, withEmiExpenses, 24, 0.3);

  // ── Aggregate severity ──
  const worstSurvival = Math.min(
    mc50.survivalMonths,
    mc100.survivalMonths,
    mcMedical.survivalMonths
  );
  const severity =
    worstSurvival < 3
      ? "critical"
      : worstSurvival < 6
        ? "high"
        : worstSurvival < 12
          ? "moderate"
          : "low";

  // Health impact estimation
  const healthImpactMap = {
    critical: Math.round(healthScore * 0.6),
    high: Math.round(healthScore * 0.4),
    moderate: Math.round(healthScore * 0.2),
    low: Math.round(healthScore * 0.1)
  };

  return {
    scenario: "Comprehensive Stress Test",
    severity,
    baseRunway: Math.round(baseRunway * 10) / 10,
    // Backward-compatible aliases for FinancialTwin component
    runway: Math.round(baseRunway * 10) / 10,
    healthImpact: clamp(healthImpactMap[severity]),

    // Per-scenario results
    incomeLoss50: {
      survivalMonths: mc50.survivalMonths,
      survivalDays: mc50.survivalDays,
      severity:
        mc50.survivalMonths < 3
          ? "critical"
          : mc50.survivalMonths < 6
            ? "high"
            : mc50.survivalMonths < 12
              ? "moderate"
              : "low",
      healthImpact: healthImpactMap[severity],
      percentiles: mc50.percentiles.filter(
        (_, i) => i % 2 === 0 || i === mc50.percentiles.length - 1
      )
    },
    jobLoss: {
      survivalMonths: mc100.survivalMonths,
      survivalDays: mc100.survivalDays,
      severity:
        mc100.survivalMonths < 3 ? "critical" : mc100.survivalMonths < 6 ? "high" : "moderate",
      healthScore: Math.max(0, healthScore - 120),
      percentiles: mc100.percentiles.filter(
        (_, i) => i % 2 === 0 || i === mc100.percentiles.length - 1
      )
    },
    medicalEmergency: {
      cost: medicalCost,
      survivalMonths: mcMedical.survivalMonths,
      survivalDays: mcMedical.survivalDays,
      severity:
        mcMedical.survivalMonths < 3
          ? "critical"
          : mcMedical.survivalMonths < 6
            ? "high"
            : "moderate",
      percentiles: mcMedical.percentiles.filter(
        (_, i) => i % 2 === 0 || i === mcMedical.percentiles.length - 1
      )
    },
    homePurchase: {
      emi: homeLoanEmi,
      dti: income > 0 ? Math.round(((expenses + homeLoanEmi) / income) * 100) : 0,
      affordability: income - expenses - homeLoanEmi > 0,
      survivalMonths: mcHome.survivalMonths,
      survivalDays: mcHome.survivalDays,
      severity:
        mcHome.survivalMonths < 6 ? "critical" : mcHome.survivalMonths < 12 ? "high" : "moderate",
      percentiles: mcHome.percentiles.filter(
        (_, i) => i % 3 === 0 || i === mcHome.percentiles.length - 1
      )
    },

    // Composite summary
    worstCaseSurvival: worstSurvival,
    worstCaseDays: worstSurvival * 30,
    overallHealthImpact: clamp(healthImpactMap[severity]),
    recommendation:
      worstSurvival < 3
        ? "⚠️ Critical: savings would be depleted within 3 months in a stress scenario. Strengthen emergency buffer immediately."
        : worstSurvival < 6
          ? "⚠️ High risk: stress scenarios deplete savings within 6 months. Target 6+ months of expenses."
          : worstSurvival < 12
            ? "Moderate resilience: buffer provides limited cushion. Consider increasing savings rate."
            : "✅ Strong resilience: savings buffer can absorb most common financial shocks.",

    generatedAt: new Date().toISOString()
  };
}
