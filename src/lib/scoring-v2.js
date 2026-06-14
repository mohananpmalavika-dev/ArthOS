import { v2DefaultAssessment } from "../data/questionnaire-v2.js";

// L02: BAST™ Processing Engine - Blueprint-compliant 40/30/30 weighting
export const componentMaximumsV2 = {
  behaviour: 40, // 40% composite weight
  awareness: 30, // 30% composite weight
  stability: 30 // 30% composite weight
};

// Composite weights for normalization to /1000 scale
export const compositeWeightsV2 = {
  behaviour: 0.4,
  awareness: 0.3,
  stability: 0.3
};

// Health score bands for /1000 scale
export const healthScoreBandsV2 = {
  critical: { min: 0, max: 199, label: "Critical" },
  fragile: { min: 200, max: 399, label: "Fragile" },
  developing: { min: 400, max: 599, label: "Developing" },
  resilient: { min: 600, max: 799, label: "Resilient" },
  sovereign: { min: 800, max: 1000, label: "Sovereign" }
};

export function formatCurrency(value) {
  // Support configurable locale and currency via environment variables
  // Defaults to en-IN/INR for backward compatibility
  const locale =
    typeof window !== "undefined"
      ? window.APP_LOCALE || import.meta.env.VITE_APP_LOCALE || "en-IN"
      : process.env.APP_LOCALE || "en-IN";

  const currency =
    typeof window !== "undefined"
      ? window.APP_CURRENCY || import.meta.env.VITE_APP_CURRENCY || "INR"
      : process.env.APP_CURRENCY || "INR";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0
  }).format(Math.max(0, Math.round(value || 0)));
}

export function formatMonths(months) {
  if (!Number.isFinite(months) || months <= 0) {
    return "0";
  }
  if (months >= 60) {
    return "60+";
  }
  return Number.isInteger(months) ? String(months) : months.toFixed(1);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const behaviourScoreMaps = {
  emotionalMoneyLevel: {
    extremely_emotional: 0,
    somewhat_emotional: 4,
    mostly_practical: 7.5,
    fully_logical: 10
  },
  socialInfluenceLevel: {
    heavily: 0,
    sometimes: 4,
    rarely: 7.5,
    never: 10
  },
  unplannedPurchaseFreq: {
    very_frequently: 0,
    sometimes: 4,
    rarely: 7.5,
    never: 10
  },
  regretImpulseFreq: {
    almost_every_time: 0,
    sometimes: 4,
    rarely: 7.5,
    never: 10
  },
  presentFutureMindset: {
    enjoy_today: 2,
    balance_both: 7,
    secure_future: 9,
    extreme_discipline: 10
  },
  avoidBalanceDuringStress: {
    almost_always: 0,
    sometimes: 4,
    rarely: 7.5,
    never: 10
  },

  // v2 additions
  spendWhenBored: {
    very_likely: 0,
    sometimes: 5,
    rarely: 7.5,
    never: 10
  },
  spendWhenStressed: {
    very_likely: 0,
    sometimes: 5,
    rarely: 7.5,
    never: 10
  },
  plannedPurchasesOnly: {
    never: 0,
    occasionally: 4.5,
    often: 7.5,
    always: 10
  },
  cashflowAwareness: {
    no: 0,
    sometimes: 4,
    usually: 7.5,
    always: 10
  },
  subscriptionControl: {
    never: 0,
    occasionally: 4,
    monthly: 7.5,
    weekly: 10
  },
  impulseWaitRule: {
    never: 0,
    rarely: 4,
    sometimes: 7,
    always: 10
  }
};

const awarenessScoreMaps = {
  comparesLifestyleFreq: {
    constantly: 0,
    occasionally: 3,
    rarely: 5,
    never: 6
  },
  hasFinancialPlan: {
    clear_plan: 6,
    some_plan: 4,
    no_plan: 0,
    not_sure: 1.5
  },
  tracksExpenses: {
    regularly: 6,
    sometimes: 4,
    rarely: 2,
    never: 0
  },
  knowsTotalDebt: {
    fully: 6,
    partially: 4,
    not_sure: 2,
    no: 0
  },
  knowsMonthlyExpenses: {
    exact: 6,
    approximate: 4,
    not_really: 2,
    no: 0
  },

  // v2 additions
  tracksSavingsRate: {
    know_exact: 5,
    know_some: 4,
    not_sure: 2,
    no: 0
  },
  budgetCycle: {
    never: 0,
    once_every_2_months: 2,
    monthly: 5,
    weekly: 6
  },
  knowsTop3Expenses: {
    no: 0,
    some: 3,
    yes: 5,
    very_clear: 6
  }
};

const incomeStabilityScores = {
  very_consistent: 6,
  mostly_consistent: 4.5,
  somewhat_variable: 2.5,
  highly_variable: 0
};

const dependentsScores = {
  "0_1": 3,
  "2_3": 2,
  "4_5": 1,
  "6_plus": 0
};

function getLiabilityScore(monthlyLiabilities, monthlyIncome) {
  if (monthlyLiabilities <= 0) {
    return 3;
  }
  if (monthlyIncome <= 0) {
    return 0;
  }

  const pressure = monthlyLiabilities / monthlyIncome;
  if (pressure <= 0.15) {
    return 3;
  }
  if (pressure <= 0.25) {
    return 2;
  }
  if (pressure <= 0.35) {
    return 1;
  }
  return 0;
}

function getDebtScheduleEstimate(profile) {
  const totalDebt = toNumber(profile.totalDebt);
  if (totalDebt <= 0) {
    return {
      payoffMonths: 0,
      payoffMonthsDisplay: "0",
      monthlyDebtRepaymentEstimate: 0,
      interestEffectiveMonthlyRate: 0,
      payoffConfidence: "High"
    };
  }

  const monthlyIncome = toNumber(profile.monthlyIncome);
  const monthlyExpenses = toNumber(profile.monthlyExpenses);
  const monthlyLiabilities = toNumber(profile.monthlyLiabilities);

  const ratePct = toNumber(profile.debtRepaymentRatePctOfIncome);
  const interestAnnualPct = toNumber(profile.averageInterestRatePct);

  // Heuristic: available repayment budget cannot exceed (income - (expenses + liabilities)).
  // But we allow some optimism by taking max(0.35, ...)
  const incomeAfterEssentials = Math.max(0, monthlyIncome - (monthlyExpenses + monthlyLiabilities));
  const preferredMonthly = monthlyIncome * (ratePct / 100);
  const payment = clamp(preferredMonthly, 0, Math.max(0, incomeAfterEssentials * 1.05));

  if (payment <= 0) {
    return {
      payoffMonths: Infinity,
      payoffMonthsDisplay: "∞",
      monthlyDebtRepaymentEstimate: 0,
      interestEffectiveMonthlyRate: 0,
      payoffConfidence: "Low"
    };
  }

  // Simple amortization estimate using effective monthly interest rate.
  const monthlyRate = interestAnnualPct / 100 / 12;

  if (monthlyRate <= 0) {
    const months = totalDebt / payment;
    return {
      payoffMonths: months,
      payoffMonthsDisplay: formatMonths(months),
      monthlyDebtRepaymentEstimate: payment,
      interestEffectiveMonthlyRate: monthlyRate,
      payoffConfidence: "Medium"
    };
  }

  // months ≈ ln( (p*r)/(p*r - balance*r0) ) / ln(1+r)
  const r = monthlyRate;
  const B = totalDebt;
  const P = payment;
  // Guard for P <= B*r (would never amortize)
  if (P <= B * r) {
    return {
      payoffMonths: Infinity,
      payoffMonthsDisplay: "∞",
      monthlyDebtRepaymentEstimate: payment,
      interestEffectiveMonthlyRate: monthlyRate,
      payoffConfidence: "Low"
    };
  }

  // Correct amortization estimate (months to payoff):
  // n = ln(P / (P - B*r)) / ln(1+r)
  const denom = P - B * r;
  if (denom <= 0) {
    return {
      payoffMonths: Infinity,
      payoffMonthsDisplay: "∞",
      monthlyDebtRepaymentEstimate: payment,
      interestEffectiveMonthlyRate: monthlyRate,
      payoffConfidence: "Low"
    };
  }

  const ratio = P / denom;
  const months = Math.log(ratio) / Math.log(1 + r);

  if (!Number.isFinite(months) || months <= 0) {
    return {
      payoffMonths: Infinity,
      payoffMonthsDisplay: "∞",
      monthlyDebtRepaymentEstimate: payment,
      interestEffectiveMonthlyRate: monthlyRate,
      payoffConfidence: "Low"
    };
  }

  return {
    payoffMonths: months,
    payoffMonthsDisplay: formatMonths(months),
    monthlyDebtRepaymentEstimate: payment,
    interestEffectiveMonthlyRate: monthlyRate,
    payoffConfidence: "Medium"
  };
}

/**
 * Estimate monthly impulse spend from frequency data when explicit amount is missing.
 * Uses unplanned purchase frequency as a proxy for what % of expenses is impulsive.
 */
function estimateMonthlyImpulseSpend(behaviour, monthlyIncome, monthlyExpenses) {
  const freq = behaviour?.unplannedPurchaseFreq;
  const freqFraction = {
    very_frequently: 0.20,
    sometimes: 0.08,
    rarely: 0.03,
    never: 0
  }[freq] ?? 0.05;

  // Estimate from expenses (more realistic than income for spend-based estimate)
  const baseEstimate = Math.max(monthlyExpenses, monthlyIncome * 0.3) * freqFraction;
  // Cap at a reasonable fraction of income
  return Math.min(baseEstimate, monthlyIncome * 0.5);
}

/**
 * Calculate income-proportional impulse penalty.
 *
 * Behaviour Impact = Frequency × Amount × Income %
 * Penalty = min(10, ImpulseSpendPct × 100)
 *
 * Where ImpulseSpendPct = Monthly Impulse Spend / Monthly Income
 *
 * This makes penalty proportional to financial impact:
 * - Rich user spending ₹500 impulsively → small penalty
 * - Poor user spending ₹500 impulsively → larger penalty
 */
function calculateImpulsePenalty(behaviour, profile = {}) {
  const monthlyIncome = toNumber(profile.monthlyIncome);
  const monthlyExpenses = toNumber(profile.monthlyExpenses);
  let monthlyImpulseSpend = toNumber(profile.monthlyImpulseSpend);

  // If explicit monthlyImpulseSpend is not provided, estimate from frequency data
  if (monthlyImpulseSpend <= 0) {
    monthlyImpulseSpend = estimateMonthlyImpulseSpend(behaviour, monthlyIncome, monthlyExpenses);
  }

  if (monthlyIncome <= 0 || monthlyImpulseSpend <= 0) {
    return 0;
  }

  const impulseSpendPct = Math.min(1, monthlyImpulseSpend / monthlyIncome);
  // Penalty = min(10, ImpulseSpendPct × 100) — capped at 10 (max penalty on 0-10 scale)
  const penalty = Math.min(10, impulseSpendPct * 100);
  return penalty;
}

function getBehaviourScore(behaviour, profile = {}) {
  // Iterate explicit schema keys to avoid skew if an assessment object is
  // missing/extra properties (e.g., loading partially from storage).
  const keys = [
    "emotionalMoneyLevel",
    "socialInfluenceLevel",
    "unplannedPurchaseFreq",
    "regretImpulseFreq",
    "presentFutureMindset",
    "avoidBalanceDuringStress",
    // v2 additions
    "spendWhenBored",
    "spendWhenStressed",
    "plannedPurchasesOnly",
    "cashflowAwareness",
    "subscriptionControl",
    "impulseWaitRule"
  ];

  const values = keys.map(k => behaviourScoreMaps[k]?.[behaviour?.[k]] ?? 0);
  const baseAverage = values.reduce((t, v) => t + v, 0) / Math.max(1, values.length);

  // Apply income-proportional impulse penalty
  const impulsePenalty = calculateImpulsePenalty(behaviour, profile);
  const adjustedAverage = Math.max(0, baseAverage - impulsePenalty);

  return roundToOne(
    clamp((adjustedAverage / 10) * componentMaximumsV2.behaviour, 0, componentMaximumsV2.behaviour)
  );
}

function getAwarenessScore(awareness) {
  // Iterate explicit schema keys to avoid skew if an assessment object is
  // missing/extra properties.
  const keys = [
    "comparesLifestyleFreq",
    "hasFinancialPlan",
    "tracksExpenses",
    "knowsTotalDebt",
    "knowsMonthlyExpenses",
    // v2 additions
    "tracksSavingsRate",
    "budgetCycle",
    "knowsTop3Expenses"
  ];

  const total = keys.reduce((sum, k) => sum + (awarenessScoreMaps[k]?.[awareness?.[k]] ?? 0), 0);
  // normalize: max roughly equals 6*5 + a few additions; clamp to 30
  const maxPossible = 6 * 5 + 6 + 6 + 6; // 5 legacy *6 + 3 additions *6
  const score = (total / maxPossible) * componentMaximumsV2.awareness;
  return roundToOne(clamp(score, 0, componentMaximumsV2.awareness));
}

const BASELINE_ELASTICITY_FACTOR = 0.4;

export function calculateDynamicElasticity(behaviour = {}) {
  let frictionPoints = 0;
  let answeredSignals = 0;

  function addFriction(key, pointsByValue) {
    const value = behaviour?.[key];
    if (!value) {
      return;
    }
    answeredSignals += 1;
    frictionPoints += pointsByValue[value] ?? 0;
  }

  addFriction("emotionalMoneyLevel", {
    extremely_emotional: 25,
    somewhat_emotional: 12
  });
  addFriction("socialInfluenceLevel", {
    heavily: 25,
    sometimes: 10
  });
  addFriction("unplannedPurchaseFreq", {
    very_frequently: 25,
    sometimes: 15
  });
  addFriction("impulseWaitRule", {
    never: 25,
    rarely: 10
  });

  if (answeredSignals === 0) {
    return BASELINE_ELASTICITY_FACTOR;
  }

  const maxElasticityOffset = 0.5;
  const degradationDelta = (clamp(frictionPoints, 0, 100) / 100) * 0.35;
  return Number(clamp(maxElasticityOffset - degradationDelta, 0.15, 0.5).toFixed(3));
}

/**
 * Calculate savings rate score (0-5 raw) based on monthly cashflow health.
 * Savings Rate = max(0, (Income - Expenses) / Income)
 *
 * Linear mapping: score = min(5, savingsRate * 12.5)
 *   0%   → 0.0
 *   10%  → 1.25
 *   20%  → 2.5
 *   30%  → 3.75
 *   40%+ → 5.0
 */
function getSavingsRateScore(monthlyIncome, monthlyExpenses) {
  if (monthlyIncome <= 0) return 0;
  const savingsRate = Math.max(0, (monthlyIncome - monthlyExpenses) / monthlyIncome);
  return Math.min(5, savingsRate * 12.5);
}

function getStabilityScore(profile, behaviour) {
  const monthlyExpenses = toNumber(profile.monthlyExpenses);
  const fixedSavings = toNumber(profile.emergencySavingsFixed);
  const discretionarySavings = toNumber(profile.emergencySavingsDiscretionary);
  const totalDebt = toNumber(profile.totalDebt);
  const monthlyIncome = toNumber(profile.monthlyIncome);
  const monthlyLiabilities = toNumber(profile.monthlyLiabilities);
  const activeElasticityFactor = calculateDynamicElasticity(behaviour);

  const totalSavings = fixedSavings + discretionarySavings;

  // L04: Blueprint-compliant Survival Window calculation
  // Formula: (Liquid Assets ÷ Monthly Expenses) × 30 days
  // Liquid Assets = totalSavings, Monthly Expenses = monthlyExpenses
  const survivalDaysRaw =
    monthlyExpenses > 0 && totalSavings > 0 ? (totalSavings / monthlyExpenses) * 30 : 0;
  const survivalMonthsRaw = survivalDaysRaw / 30; // Convert to months for scoring

  const variableExpenses = Math.max(0, monthlyExpenses - monthlyLiabilities);
  const bareMinimumBurn = monthlyLiabilities + variableExpenses * (1 - activeElasticityFactor);
  const bareMinimumSurvivalDaysRaw =
    bareMinimumBurn > 0 && totalSavings > 0 ? (totalSavings / bareMinimumBurn) * 30 : 0;
  const bareMinimumSurvivalMonthsRaw = bareMinimumSurvivalDaysRaw / 30;

  const fixedBufferMonths = monthlyExpenses > 0 ? fixedSavings / monthlyExpenses : 0;
  const discretionaryBufferMonths =
    monthlyExpenses > 0 ? discretionarySavings / monthlyExpenses : 0;

  // Savings rate (cashflow health) — 20% of stability component
  const savingsRateScore = getSavingsRateScore(monthlyIncome, monthlyExpenses);
  const savingsRate = monthlyIncome > 0
    ? Math.max(0, (monthlyIncome - monthlyExpenses) / monthlyIncome)
    : 0;

  // Legacy sub-scores — 80% of stability component
  // Logarithmic scaling rewards larger buffers without capping at 6 months
  const emergencyScore = survivalMonthsRaw > 0 ? Math.log(survivalMonthsRaw + 1) : 0;
  const debtScore = getDebtScore(totalDebt, monthlyIncome);
  const incomeScore = incomeStabilityScores[profile.incomeStability] ?? 0;
  const dependentsScore = dependentsScores[profile.dependentsBucket] ?? 0;
  const liabilityScore = getLiabilityScore(monthlyLiabilities, monthlyIncome);

  // Raw max: legacy = 25 (9+4+6+3+3), savings rate = 5, total = 30
  // Divisor was 20 before adding savings rate; now 25 so savings rate is 20% (5/25)
  const raw = emergencyScore + debtScore + incomeScore + dependentsScore + liabilityScore + savingsRateScore;
  const normalized = clamp(
    (raw / 25) * componentMaximumsV2.stability,
    0,
    componentMaximumsV2.stability
  );

  return {
    score: roundToOne(normalized),
    survivalDaysRaw, // L04: Days as per blueprint formula
    survivalMonthsRaw, // L04: Months (survivalDaysRaw / 30)
    bareMinimumSurvivalDaysRaw, // L04: Minimum viable survival in days
    bareMinimumSurvivalMonthsRaw, // L04: Minimum viable survival in months
    activeElasticityFactor,
    fixedBufferMonths,
    discretionaryBufferMonths,
    fixedEmergencySavings: fixedSavings,
    discretionaryEmergencySavings: discretionarySavings,
    totalEmergencySavings: totalSavings,
    // Cashflow health metrics
    savingsRate: roundToOne(savingsRate),
    savingsRateScore: roundToOne(savingsRateScore),
    monthlyCashflow: roundToOne(monthlyIncome - monthlyExpenses)
  };
}

function getDebtScore(totalDebt, monthlyIncome) {
  if (totalDebt <= 0) {
    return 4;
  }
  if (monthlyIncome <= 0) {
    return 0;
  }

  const debtMonths = totalDebt / monthlyIncome;
  if (debtMonths <= 1) {
    return 3.5;
  }
  if (debtMonths <= 3) {
    return 2.8;
  }
  if (debtMonths <= 6) {
    return 2.0;
  }
  if (debtMonths <= 12) {
    return 1.0;
  }
  return 0.2;
}

function getPerceivedSurvivalMonths(actualSurvivalMonths, awarenessScore) {
  const awarenessFactor = clamp(awarenessScore / componentMaximumsV2.awareness, 0, 1);
  const perceptionBias = 1 + 0.35 * (1 - awarenessFactor);
  return actualSurvivalMonths * perceptionBias;
}

function getAwarenessGap(awarenessScore, survivalMonthsRaw) {
  const perceivedSurvivalMonths = getPerceivedSurvivalMonths(survivalMonthsRaw, awarenessScore);
  const awarenessBias = perceivedSurvivalMonths - survivalMonthsRaw;
  return {
    perceivedSurvivalMonths,
    actualSurvivalMonths: survivalMonthsRaw,
    awarenessGap: Math.abs(awarenessBias),
    awarenessBias
  };
}

export function calculateAdvancedCognitiveDrift(awareness = {}, actualSurvivalMonths = 0) {
  let cognitiveOverconfidenceDrift = 0;

  if (awareness.knowsMonthlyExpenses === "exact" && awareness.tracksExpenses === "never") {
    cognitiveOverconfidenceDrift += 2.2;
  }

  if (awareness.knowsTotalDebt === "fully" && awareness.budgetCycle === "never") {
    cognitiveOverconfidenceDrift += 1.5;
  }

  if (awareness.tracksSavingsRate === "know_exact" && awareness.knowsTop3Expenses === "no") {
    cognitiveOverconfidenceDrift += 1.8;
  }

  const awarenessScore = getAwarenessScore(awareness);
  const awarenessFactor = clamp(1 - awarenessScore / componentMaximumsV2.awareness, 0, 1);
  const baseBias = 1 + 0.38 * awarenessFactor;
  const rawPerceived = actualSurvivalMonths * baseBias;
  const perceivedSurvivalMonths = rawPerceived + cognitiveOverconfidenceDrift;
  const awarenessBias = perceivedSurvivalMonths - actualSurvivalMonths;

  return {
    perceivedSurvivalMonths,
    actualSurvivalMonths,
    awarenessGap: Math.abs(awarenessBias),
    awarenessBias,
    cognitiveOverconfidenceDrift
  };
}

function getBlindSpotInsight(awarenessMetrics) {
  const { perceivedSurvivalMonths, actualSurvivalMonths, awarenessGap } = awarenessMetrics;

  const headline =
    perceivedSurvivalMonths > actualSurvivalMonths
      ? `You believe you can survive ${formatMonths(perceivedSurvivalMonths)} months without income.`
      : perceivedSurvivalMonths < actualSurvivalMonths
        ? `You are more conservative than your actual runway suggests.`
        : `Your survival perception is tightly aligned with your actual runway.`;

  const summary =
    perceivedSurvivalMonths > actualSurvivalMonths
      ? `Actual survival time is ${formatMonths(actualSurvivalMonths)} months, meaning you are overestimating your financial security by ${formatMonths(awarenessGap)} months.`
      : perceivedSurvivalMonths < actualSurvivalMonths
        ? `Actual survival time is ${formatMonths(actualSurvivalMonths)} months, meaning you are underestimating your financial security by ${formatMonths(awarenessGap)} months.`
        : `Your perceived and actual survival times match, so your runway awareness is strong.`;

  return {
    headline,
    summary,
    perceivedSurvivalMonthsDisplay: formatMonths(perceivedSurvivalMonths),
    actualSurvivalMonthsDisplay: formatMonths(actualSurvivalMonths),
    gapDisplay: formatMonths(awarenessGap),
    direction:
      perceivedSurvivalMonths > actualSurvivalMonths
        ? "overestimated"
        : perceivedSurvivalMonths < actualSurvivalMonths
          ? "underestimated"
          : "aligned"
  };
}

function getPersonalityReport(personalityType) {
  const profiles = {
    Builder: {
      strengths: ["Disciplined savings", "Long-term focus"],
      risks: ["Overly rigid plans", "Ignoring lifestyle flexibility"],
      dangerZone: "Burnout from strict budgets",
      recommendedRule: "Keep a flexible emergency bucket and review commitments quarterly."
    },
    Survivor: {
      strengths: ["Protects safety", "Avoids downside risk"],
      risks: ["Underinvesting in growth", "Staying too conservative"],
      dangerZone: "Income shock after long-term stagnation",
      recommendedRule:
        "Build a basic buffer, then allocate a small growth bucket for higher confidence choices."
    },
    Optimizer: {
      strengths: ["Tracks decisions", "Balances risk and reward"],
      risks: ["Analysis paralysis", "Micromanaging cash flow"],
      dangerZone: "Missing quick timing windows",
      recommendedRule:
        "Set clear review rituals and avoid overreacting to short-term spending noise."
    },
    Dreamer: {
      strengths: ["Creative planning", "Big-picture mindset"],
      risks: ["Wishful assumptions", "Underestimated expenses"],
      dangerZone: "Reality shock when plans meet cash flow",
      recommendedRule: "Translate aspirations into a concrete 30-day spending plan."
    },
    "Risk Taker": {
      strengths: ["Moves fast", "Grabs opportunities"],
      risks: ["Volatile cash flow", "Emotional spending"],
      dangerZone: "High-stress market or income swings",
      recommendedRule: "Pause major commitments and build a 2-month safety runway first."
    }
  };

  return {
    title: personalityType,
    ...(profiles[personalityType] ?? profiles.Survivor)
  };
}

function getFutureRiskProfile(profile) {
  const monthlyIncome = toNumber(profile.monthlyIncome);
  const monthlyExpenses = toNumber(profile.monthlyExpenses);
  const totalDebt = toNumber(profile.totalDebt);
  const monthlyLiabilities = toNumber(profile.monthlyLiabilities);

  const savingsRate =
    monthlyIncome > 0 ? clamp((monthlyIncome - monthlyExpenses) / monthlyIncome, 0, 1) : 0;
  const debtBurden = monthlyIncome > 0 ? clamp(totalDebt / (monthlyIncome * 12), 0, 1) : 1;
  const liabilityPressure = monthlyIncome > 0 ? clamp(monthlyLiabilities / monthlyIncome, 0, 1) : 1;
  const stabilityFactor = clamp((incomeStabilityScores[profile.incomeStability] ?? 0) / 6, 0, 1);

  const score = Math.round(
    clamp(
      savingsRate * 0.35 +
        (1 - debtBurden) * 0.25 +
        (1 - liabilityPressure) * 0.2 +
        stabilityFactor * 0.2,
      0,
      1
    ) * 100
  );

  const label =
    score >= 70
      ? "Low Risk"
      : score >= 50
        ? "Moderate Risk"
        : score >= 30
          ? "High Risk"
          : "Critical Risk";

  return { score, label };
}

// PERSONALITY TYPE CALCULATION
// ────────────────────────────────────────────────────────────────────────────
// Internal trait scoring uses camelCase keys (private implementation detail).
// Output is standardized to Title Case (public API): "Builder", "Survivor", "Optimizer", "Dreamer", "Risk Taker"
// This ensures consistency with ARCHETYPES lookups in FinancialTwin.jsx
// ────────────────────────────────────────────────────────────────────────────
function getPersonalityType(behaviour) {
  const traits = {
    builder: 0,
    survivor: 0,
    optimizer: 0,
    dreamer: 0,
    riskTaker: 0 // Internal camelCase; output will be "Risk Taker" (Title Case with space)
  };

  if (behaviour.presentFutureMindset === "enjoy_today") {
    traits.riskTaker += 2;
  }
  if (behaviour.presentFutureMindset === "balance_both") {
    traits.dreamer += 2;
  }
  if (behaviour.presentFutureMindset === "secure_future") {
    traits.optimizer += 1;
  }
  if (behaviour.presentFutureMindset === "extreme_discipline") {
    traits.builder += 2;
  }

  if (behaviour.unplannedPurchaseFreq === "very_frequently") {
    traits.riskTaker += 2;
  }
  if (behaviour.unplannedPurchaseFreq === "sometimes") {
    traits.dreamer += 1;
  }
  if (behaviour.unplannedPurchaseFreq === "rarely") {
    traits.optimizer += 1;
  }
  if (behaviour.unplannedPurchaseFreq === "never") {
    traits.builder += 1;
  }

  if (behaviour.spendWhenStressed === "very_likely") {
    traits.riskTaker += 2;
  }
  if (behaviour.spendWhenStressed === "sometimes") {
    traits.dreamer += 1;
  }
  if (behaviour.spendWhenStressed === "rarely") {
    traits.optimizer += 1;
  }
  if (behaviour.spendWhenStressed === "never") {
    traits.builder += 1;
  }

  if (behaviour.plannedPurchasesOnly === "always") {
    traits.builder += 2;
  }
  if (behaviour.plannedPurchasesOnly === "often") {
    traits.optimizer += 1;
  }
  if (behaviour.plannedPurchasesOnly === "occasionally") {
    traits.dreamer += 1;
  }
  if (behaviour.plannedPurchasesOnly === "never") {
    traits.riskTaker += 2;
  }

  if (behaviour.impulseWaitRule === "always") {
    traits.builder += 2;
  }
  if (behaviour.impulseWaitRule === "sometimes") {
    traits.optimizer += 1;
  }
  if (behaviour.impulseWaitRule === "rarely") {
    traits.dreamer += 1;
  }
  if (behaviour.impulseWaitRule === "never") {
    traits.riskTaker += 2;
  }

  if (behaviour.subscriptionControl === "weekly") {
    traits.builder += 1;
  }
  if (behaviour.subscriptionControl === "monthly") {
    traits.optimizer += 1;
  }
  if (behaviour.subscriptionControl === "occasionally") {
    traits.dreamer += 1;
  }
  if (behaviour.subscriptionControl === "never") {
    traits.riskTaker += 1;
  }

  const winner = Object.entries(traits).sort((a, b) => b[1] - a[1])[0]?.[0];
  // Standardized personality type names (matches ARCHETYPES keys in FinancialTwin.jsx)
  const labels = {
    builder: "Builder",
    survivor: "Survivor",
    optimizer: "Optimizer",
    dreamer: "Dreamer",
    riskTaker: "Risk Taker" // Note: Title Case with space (not "risk_taker", which is for CSS)
  };

  return labels[winner] ?? "Survivor";
}

function getHealthBand(score) {
  if (score <= 19) {
    return { label: "Financially Critical", tone: "critical" };
  }
  if (score <= 39) {
    return { label: "Financially Fragile", tone: "warning" };
  }
  if (score <= 59) {
    return { label: "Financially Developing", tone: "caution" };
  }
  if (score <= 79) {
    return { label: "Financially Resilient", tone: "steady" };
  }
  return { label: "Financially Sovereign", tone: "strong" };
}

// L02: Health band for /1000 normalized composite score
function getHealthBandV2(score) {
  if (score < 200) {
    return { label: "Financially Critical", tone: "critical", band: "critical" };
  }
  if (score < 400) {
    return { label: "Financially Fragile", tone: "warning", band: "fragile" };
  }
  if (score < 600) {
    return { label: "Financially Developing", tone: "caution", band: "developing" };
  }
  if (score < 800) {
    return { label: "Financially Resilient", tone: "steady", band: "resilient" };
  }
  return { label: "Financially Sovereign", tone: "strong", band: "sovereign" };
}

function getRecommendedAction(assessment, components) {
  // ONE primary action: target the lowest component; if stability is lowest and survival is low -> emergency savings.
  const lowestKey = components.sort((a, b) => a.score - b.score)[0].key;

  const monthlyExpenses = toNumber(assessment.profile.monthlyExpenses);
  const survivalMonths = components.find(c => c.key === "stability").survivalMonthsRaw;

  if (lowestKey === "behaviour") {
    if (assessment.behaviour.unplannedPurchaseFreq !== "never") {
      return "Use a 24-hour waiting rule for non-essential purchases this month.";
    }
    return "Cut one trigger: remove one social-spend pathway (e.g., shopping places) this week.";
  }

  if (lowestKey === "awareness") {
    if (assessment.awareness.tracksExpenses !== "regularly") {
      return "Track every expense for the next 14 days (no exceptions) and total it.";
    }
    return "Write a 1-page monthly money plan (income → expenses → savings → debt).";
  }

  // stability driver
  const fixedSavings = toNumber(assessment.profile.emergencySavingsFixed);
  const fixedBufferMonths = monthlyExpenses > 0 ? fixedSavings / monthlyExpenses : 0;

  if (fixedBufferMonths < 1) {
    return `Build a 1-month fixed buffer of ${formatCurrency(monthlyExpenses)} before adding discretionary savings.`;
  }

  if (survivalMonths < 2) {
    const target = monthlyExpenses * 0.85;
    return `Build emergency savings of ${formatCurrency(target)} within 60 days.`;
  }

  const debtSchedule = getDebtScheduleEstimate(assessment.profile);
  if (debtSchedule.payoffMonths === Infinity || debtSchedule.payoffMonths > 18) {
    return "Increase debt repayment by 1 step this month (even +₹2,000 counts).";
  }

  return "Maintain your current emergency + debt plan for the next 30 days.";
}

function getDiagnosis(assessment, lowestComponent, futureRiskLabel, awarenessMetrics) {
  const monthlyExpenses = toNumber(assessment.profile.monthlyExpenses);
  const totalSavings =
    toNumber(assessment.profile.emergencySavingsFixed) +
    toNumber(assessment.profile.emergencySavingsDiscretionary);
  const gapMonths = awarenessMetrics.awarenessGap;

  if (lowestComponent.key === "behaviour") {
    return {
      headline: "Your biggest problem is behavior, not just the score.",
      problem:
        "Impulse spending during stress and weak waiting rules are the largest driver of your cash runway risk.",
      explanation: `Your behavior score is the weakest of the three engines. In this profile, emotional and social spending patterns are eroding your available runway even when your income looks stable. This makes growth harder and makes your emergency savings less reliable over time.`,
      focus: "Improve your purchase discipline and spend controls first."
    };
  }

  if (lowestComponent.key === "awareness") {
    return {
      headline: "Your largest blind spot is runway awareness.",
      problem: `You are overestimating your runway by ${formatMonths(gapMonths)} months compared to actual cash runway.`,
      explanation: `Your awareness score is the softest signal. This means the biggest risk isn't a single number, it is how much you trust your own financial perception instead of the math. That gap is the place where surprise shocks become crises.`,
      focus: "Track expenses and top expenses clearly before acting on other decisions."
    };
  }

  return {
    headline: "Your biggest problem is runway stability.",
    problem:
      totalSavings <= 0
        ? "You currently have no emergency buffer, which makes every decision high risk."
        : `Your survival runway is the weakest piece of your profile. ${formatMonths(totalSavings)} of cash against ${formatCurrency(monthlyExpenses)} monthly burn leaves little room for surprise shocks.`,
    explanation: `Your stability score is the lowest engine. This means your emergency buffer and debt structure are the primary levers to protect your runway. Without stronger cash reserves, even moderate spending can push you into critical risk.`,
    focus: "Prioritize emergency savings and manageable debt repayment pacing."
  };
}

function applyCommitmentToEmergencyBuffers(profile, itemCost) {
  const fixedSavings = toNumber(profile.emergencySavingsFixed);
  const discretionarySavings = toNumber(profile.emergencySavingsDiscretionary);
  let remainingCommitment = Math.max(0, itemCost);

  const discretionaryDrawdown = Math.min(discretionarySavings, remainingCommitment);
  remainingCommitment -= discretionaryDrawdown;

  const fixedDrawdown = Math.min(fixedSavings, remainingCommitment);

  return {
    ...profile,
    emergencySavingsDiscretionary: Math.max(0, discretionarySavings - discretionaryDrawdown),
    emergencySavingsFixed: Math.max(0, fixedSavings - fixedDrawdown)
  };
}

export function simulateCommitmentImpact(profile = {}, simulatedItemCost = 0, behaviour) {
  const itemCost = Math.max(0, toNumber(simulatedItemCost));
  const monthlyExpenses = toNumber(profile.monthlyExpenses);
  const fixedSavings = toNumber(profile.emergencySavingsFixed);
  const discretionarySavings = toNumber(profile.emergencySavingsDiscretionary);
  const totalSavings = fixedSavings + discretionarySavings;

  const currentRunway = monthlyExpenses > 0 ? totalSavings / monthlyExpenses : 0;

  if (itemCost <= 0) {
    return {
      commitmentCost: 0,
      runwayImpactMonths: 0,
      newRunway: roundToOne(currentRunway),
      stabilityLoss: 0,
      currentRunway: roundToOne(currentRunway),
      postSimulatedSavings: totalSavings,
      simulatedProfile: profile
    };
  }

  const simulatedProfile = applyCommitmentToEmergencyBuffers(profile, itemCost);
  const postSimulatedSavings =
    toNumber(simulatedProfile.emergencySavingsFixed) +
    toNumber(simulatedProfile.emergencySavingsDiscretionary);
  const simulatedRunway = monthlyExpenses > 0 ? postSimulatedSavings / monthlyExpenses : 0;
  const initialStability = calculateStabilityScoreV2(profile, behaviour).score;
  const postSimulatedStability = calculateStabilityScoreV2(simulatedProfile, behaviour).score;

  return {
    commitmentCost: itemCost,
    runwayImpactMonths: roundToOne(Math.max(0, currentRunway - simulatedRunway)),
    newRunway: roundToOne(simulatedRunway),
    stabilityLoss: roundToOne(Math.max(0, initialStability - postSimulatedStability)),
    currentRunway: roundToOne(currentRunway),
    postSimulatedSavings,
    simulatedProfile
  };
}

export function calculateDecisionSimulatorV2(profile = {}, purchaseCost = 0, behaviour) {
  const impact = simulateCommitmentImpact(profile, purchaseCost, behaviour);
  const fee = impact.commitmentCost;
  const currentRunway = impact.currentRunway;
  const forecastRunway = impact.newRunway;
  const runwayDelta = impact.runwayImpactMonths;
  const remainingSavings = impact.postSimulatedSavings;
  const baselineBand = getSurvivalBand(currentRunway).label;
  const forecastBand = getSurvivalBand(forecastRunway).label;

  const recommendation = (() => {
    if (fee <= 0) {
      return "Enter a purchase amount to see the runway impact.";
    }
    if (remainingSavings <= 0) {
      return "Do not make this purchase. It would eliminate your emergency runway entirely.";
    }
    if (forecastRunway <= 1) {
      return "Wait. This purchase would leave you with a critically low runway.";
    }
    if (forecastRunway <= 3) {
      return "Delay until you have at least 3 months of runway after this purchase.";
    }
    if (runwayDelta > 2) {
      return "Consider saving a bit more first, as this purchase removes over 2 months of runway.";
    }
    return "This purchase is possible, but keep at least 3 months of buffer after you buy it.";
  })();

  return {
    purchaseCost: fee,
    currentRunway,
    forecastRunway,
    runwayDelta,
    runwayImpactMonths: impact.runwayImpactMonths,
    newRunway: impact.newRunway,
    stabilityLoss: impact.stabilityLoss,
    baselineRisk: baselineBand,
    forecastRisk: forecastBand,
    recommendation
  };
}

function roundToOne(value) {
  return Math.round(value * 10) / 10;
}

function toNumber(value) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function calculateBehaviourScoreV2(behaviour, profile) {
  return getBehaviourScore(behaviour, profile);
}

export function calculateAwarenessScoreV2(awareness) {
  return getAwarenessScore(awareness);
}

export function calculateStabilityScoreV2(profile, behaviour) {
  return getStabilityScore(profile, behaviour);
}

export function calculateDebtScheduleEstimateV2(profile) {
  return getDebtScheduleEstimate(profile);
}

export function calculateHabitsMetricsV2(habits) {
  return getHabitsMetrics(habits);
}

export function calculateFutureRiskV2(profile) {
  return getFutureRiskProfile(profile);
}

export function calculatePersonalityTypeV2(behaviour) {
  return getPersonalityType(behaviour);
}

export function calculateAwarenessGapV2(awarenessOrScore, survivalMonthsRaw) {
  if (typeof awarenessOrScore === "object" && awarenessOrScore !== null) {
    return calculateAdvancedCognitiveDrift(awarenessOrScore, survivalMonthsRaw);
  }

  return getAwarenessGap(awarenessOrScore, survivalMonthsRaw);
}

export function calculateBlindSpotV2(awarenessMetrics) {
  return getBlindSpotInsight(awarenessMetrics);
}

export function calculatePersonalityReportV2(personalityType) {
  return getPersonalityReport(personalityType);
}

export function calculateFinancialHealthV2(assessment) {
  const safe = assessment || v2DefaultAssessment;

  const behaviourScore = calculateBehaviourScoreV2(safe.behaviour, safe.profile);
  const awarenessScore = calculateAwarenessScoreV2(safe.awareness);
  const stability = calculateStabilityScoreV2(safe.profile, safe.behaviour);
  const futureRisk = calculateFutureRiskV2(safe.profile);
  const personalityType = calculatePersonalityTypeV2(safe.behaviour);
  const personalityReport = calculatePersonalityReportV2(personalityType);
  const awarenessMetrics = calculateAdvancedCognitiveDrift(
    safe.awareness,
    stability.survivalMonthsRaw
  );
  const blindSpot = calculateBlindSpotV2(awarenessMetrics);

  // L02: Calculate composite health score using 40/30/30 weighting, normalized to /1000
  const normalisedBehaviour =
    (behaviourScore / componentMaximumsV2.behaviour) * 1000 * compositeWeightsV2.behaviour;
  const normalisedAwareness =
    (awarenessScore / componentMaximumsV2.awareness) * 1000 * compositeWeightsV2.awareness;
  const normalisedStability =
    (stability.score / componentMaximumsV2.stability) * 1000 * compositeWeightsV2.stability;
  const healthScore = Math.round(normalisedBehaviour + normalisedAwareness + normalisedStability);
  const categoryBand = getHealthBandV2(healthScore);

  // L02: Component scoring with 0-100 internal scale for diagnostic clarity
  const componentRows = [
    {
      key: "behaviour",
      label: "Behaviour",
      score: behaviourScore,
      max: componentMaximumsV2.behaviour,
      band: getBehaviourBand(behaviourScore),
      compositeContribution: normalisedBehaviour
    },
    {
      key: "awareness",
      label: "Awareness",
      score: awarenessScore,
      max: componentMaximumsV2.awareness,
      band: getAwarenessBand(awarenessScore),
      compositeContribution: normalisedAwareness
    },
    {
      key: "stability",
      label: "Stability",
      score: stability.score,
      max: componentMaximumsV2.stability,
      band: getStabilityBand(stability.score),
      compositeContribution: normalisedStability
    }
  ].map(row => ({
    ...row,
    percent: Math.round((row.score / row.max) * 100),
    compositePercent: Math.round((row.compositeContribution / healthScore) * 100)
  }));

  componentRows.sort((a, b) => a.percent - b.percent);
  const lowest = componentRows[0];
  const highest = [...componentRows].sort((a, b) => b.percent - a.percent)[0];

  const debtSchedule = calculateDebtScheduleEstimateV2(safe.profile);
  const habits = calculateHabitsMetricsV2(safe.habits);

  const componentsForAction = [
    { key: "behaviour", score: behaviourScore },
    { key: "awareness", score: awarenessScore },
    {
      key: "stability",
      score: stability.score,
      survivalMonthsRaw: stability.survivalMonthsRaw
    }
  ];
  const recommendedActionText = getRecommendedAction(safe, componentsForAction);

  const survivalBand = getSurvivalBand(stability.survivalMonthsRaw);
  const diagnosis = getDiagnosis(safe, lowest, futureRisk.label, awarenessMetrics);

  return {
    mode: "v2",
    behaviourScore,
    awarenessScore,
    stabilityScore: stability.score,
    healthScore,
    categoryBand,

    // Cashflow health metrics (new — 20% of stability component)
    savingsRate: stability.savingsRate,
    savingsRateScore: stability.savingsRateScore,
    monthlyCashflow: stability.monthlyCashflow,

    survivalMonthsRaw: stability.survivalMonthsRaw,
    survivalMonthsDisplay: formatMonths(stability.survivalMonthsRaw),
    bareMinimumSurvivalMonthsRaw: stability.bareMinimumSurvivalMonthsRaw,
    bareMinimumSurvivalMonthsDisplay: formatMonths(stability.bareMinimumSurvivalMonthsRaw),
    activeElasticityFactor: stability.activeElasticityFactor,
    activeElasticityPercent: Math.round(stability.activeElasticityFactor * 100),
    survivalBand,
    fixedBufferMonths: stability.fixedBufferMonths,
    discretionaryBufferMonths: stability.discretionaryBufferMonths,
    fixedBufferMonthsDisplay: formatMonths(stability.fixedBufferMonths),
    discretionaryBufferMonthsDisplay: formatMonths(stability.discretionaryBufferMonths),
    fixedBufferAmount: stability.fixedEmergencySavings,
    discretionaryBufferAmount: stability.discretionaryEmergencySavings,
    totalEmergencySavings: stability.totalEmergencySavings,

    componentRows,
    lowestComponent: lowest,
    strongestComponent: highest,

    recommendedActionText,

    debtSchedule,
    habits,
    futureRiskScore: futureRisk.score,
    futureRiskLabel: futureRisk.label,
    personalityType,
    personalityReport,
    awarenessMetrics,
    blindSpot,
    diagnosis,
    perceivedSurvivalMonths: awarenessMetrics.perceivedSurvivalMonths,
    perceivedSurvivalMonthsDisplay: formatMonths(awarenessMetrics.perceivedSurvivalMonths),
    actualSurvivalMonths: awarenessMetrics.actualSurvivalMonths,
    awarenessGap: awarenessMetrics.awarenessGap,
    awarenessGapDisplay: formatMonths(awarenessMetrics.awarenessGap),
    blindSpotHeadline: blindSpot.headline,
    blindSpotSummary: blindSpot.summary,
    blindSpotPerceived: blindSpot.perceivedSurvivalMonthsDisplay,
    blindSpotActual: blindSpot.actualSurvivalMonthsDisplay,
    blindSpotGap: blindSpot.gapDisplay,
    blindSpotDirection: blindSpot.direction,

    summary: `${categoryBand.label} financial health with ${survivalBand.label.toLowerCase()}.`
  };
}

function getBehaviourBand(score) {
  if (score <= 15) {
    return "Critical behaviour risk";
  }
  if (score <= 27) {
    return "Needs behaviour correction";
  }
  if (score <= 35) {
    return "Mostly controlled";
  }
  return "Strong financial discipline";
}

function getAwarenessBand(score) {
  if (score <= 9) {
    return "Low visibility";
  }
  if (score <= 18) {
    return "Basic awareness";
  }
  if (score <= 24) {
    return "Solid tracking";
  }
  return "High clarity";
}

function getStabilityBand(score) {
  if (score <= 8) {
    return "Fragile stability";
  }
  if (score <= 16) {
    return "Some cushion";
  }
  if (score <= 20) {
    return "Resilient";
  }
  return "Very stable";
}

function getSurvivalBand(months) {
  if (months <= 1) {
    return { label: "Immediate risk", tone: "critical" };
  }
  if (months <= 3) {
    return { label: "Fragile cushion", tone: "warning" };
  }
  if (months <= 6) {
    return { label: "Improving stability", tone: "steady" };
  }
  if (months <= 12) {
    return { label: "Strong buffer", tone: "strong" };
  }
  return { label: "Highly resilient", tone: "strong" };
}

function getHabitsMetrics(habits) {
  const checkInMap = {
    0: 0,
    1: 1,
    "2_3": 2.5,
    "4_plus": 4
  };

  const reliabilityMap = {
    rarely: 0.25,
    sometimes: 0.55,
    often: 0.78,
    always: 0.95
  };

  const checkInsPerWeek = checkInMap[habits.habitCheckInsPerWeek] ?? 0;
  const reliability = reliabilityMap[habits.debtPaymentDiscipline] ?? 0.4;

  // streak proxy: check-ins translate into streak strength. 0..100
  const habitScore = clamp(Math.round((checkInsPerWeek / 4) * 60 + reliability * 40), 0, 100);

  const estimatedStreakDays = Math.round((checkInsPerWeek / 4) * 30 + reliability * 20);
  const weeklyAdherencePct = Math.round(reliability * 100);

  return {
    habitScore,
    estimatedStreakDays,
    weeklyAdherencePct
  };
}

// ============================================
// Anonymous Telemetry Module (Privacy-First)
// ============================================

/**
 * Build a privacy-compliant anonymous telemetry payload from assessment results.
 * No PII, no timestamps, no IP tracking — just numeric indicators and behavioral categories.
 */
export function buildAnonymousTelemetryPayload(assessmentResult, coreAssessment) {
  const profile = coreAssessment?.profile || {};
  const monthlyIncome = toNumber(profile.monthlyIncome);
  const monthlyExpenses = toNumber(profile.monthlyExpenses);

  return {
    telemetry_metadata: {
      schema_version: "2.0.0",
      mode_executed: "v2"
    },
    scores: {
      financial_health_score: assessmentResult.healthScore,
      behaviour_score: Math.round(assessmentResult.behaviourScore * 10) / 10,
      awareness_score: Math.round(assessmentResult.awarenessScore * 10) / 10,
      stability_score: Math.round(assessmentResult.stabilityScore * 10) / 10,
      habits_score: assessmentResult.habits?.habitScore ?? 0
    },
    predictive_analytics: {
      personality_type: assessmentResult.personalityType,
      future_risk_label: assessmentResult.futureRiskLabel,
      future_risk_score: assessmentResult.futureRiskScore,
      awareness_gap_months: Number((assessmentResult.awarenessGap || 0).toFixed(2))
    },
    runway_metrics: {
      nominal_survival_months: Number((assessmentResult.survivalMonthsRaw || 0).toFixed(2)),
      crisis_optimized_survival_months: Number(
        (assessmentResult.bareMinimumSurvivalMonthsRaw || 0).toFixed(2)
      ),
      perceived_survival_months: Number((assessmentResult.perceivedSurvivalMonths || 0).toFixed(2)),
      dynamic_elasticity_percent: assessmentResult.activeElasticityPercent ?? 0
    },
    financial_ratios: {
      savings_rate_proxied:
        monthlyIncome > 0
          ? Number(((monthlyIncome - monthlyExpenses) / monthlyIncome).toFixed(2))
          : 0,
      debt_to_income_months:
        monthlyIncome > 0
          ? Number((toNumber(profile.totalDebt) / (monthlyIncome * 12)).toFixed(2))
          : 0,
      fixed_liability_pressure:
        monthlyIncome > 0
          ? Number((toNumber(profile.monthlyLiabilities) / monthlyIncome).toFixed(2))
          : 0
    },
    lowest_performing_driver: assessmentResult.lowestComponent?.key || "unknown"
  };
}

/**
 * A browser-only queue for failed endpoint delivery.
 * This ensures production UX does not break when /api routes are temporarily unavailable.
 */
const OFFLINE_QUEUE_KEYS = {
  telemetry: "arth-os-offline-telemetry",
  feedback: "arth-os-offline-feedback"
};

function isBrowser() {
  return typeof window !== "undefined";
}

function isLocalDev() {
  if (!isBrowser()) {
    return false;
  }
  const host = window.location.hostname || "";
  return host === "localhost" || host.startsWith("127.");
}

function hasLocalStorage() {
  if (!isBrowser()) {
    return false;
  }
  try {
    return typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function readQueue(queueKey) {
  if (!hasLocalStorage()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(queueKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queueKey, queue) {
  if (!hasLocalStorage()) {
    return;
  }
  try {
    window.localStorage.setItem(queueKey, JSON.stringify(queue));
  } catch {
    // ignore storage errors
  }
}

function enqueueOfflinePayload(queueKey, payload) {
  if (!hasLocalStorage()) {
    return;
  }
  const queue = readQueue(queueKey);
  queue.push({ payload, queuedAt: new Date().toISOString() });
  writeQueue(queueKey, queue);
}

async function dispatchToEndpoint(targetUrl, payload, keepalive = true) {
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive
  });
  return response.ok;
}

async function flushQueue(queueKey, targetUrl, label) {
  if (!hasLocalStorage() || !isBrowser() || isLocalDev()) {
    return;
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return;
  }

  const queue = readQueue(queueKey);
  if (!queue.length) {
    return;
  }

  const remaining = [];
  for (const item of queue) {
    try {
      const success = await dispatchToEndpoint(targetUrl, item.payload);
      if (!success) {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  if (remaining.length) {
    writeQueue(queueKey, remaining);
    console.info(`[${label}] ${remaining.length} queued payload(s) remain.`);
  } else {
    window.localStorage.removeItem(queueKey);
    console.info(`[${label}] Flushed queued payloads.`);
  }
}

export async function flushOfflineApiQueues() {
  await flushQueue(OFFLINE_QUEUE_KEYS.telemetry, "/api/telemetry", "Telemetry");
  await flushQueue(OFFLINE_QUEUE_KEYS.feedback, "/api/feedback", "Feedback");
}

export function initOfflineApiQueue() {
  if (!isBrowser()) {
    return;
  }

  const flush = () => {
    void flushOfflineApiQueues();
  };

  window.addEventListener("online", flush);
  setTimeout(flush, 1000);
}

async function postWithFallback(targetUrl, payload, queueKey, label, keepalive = true) {
  if (isLocalDev()) {
    console.info(`[${label}] Local development host detected. Endpoint dispatch skipped.`);
    return true;
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enqueueOfflinePayload(queueKey, payload);
    console.info(`[${label}] Offline. Payload queued for later delivery.`);
    return true;
  }

  try {
    const success = await dispatchToEndpoint(targetUrl, payload, keepalive);
    if (!success) {
      enqueueOfflinePayload(queueKey, payload);
      console.warn(`[${label}] Request failed. Payload queued for later delivery.`);
    }
    return true;
  } catch (error) {
    enqueueOfflinePayload(queueKey, payload);
    console.warn(`[${label}] Network error queued for later delivery:`, error?.message || error);
    return true;
  }
}

export async function dispatchAnonymousTelemetry(telemetryPayload, endpointUrl) {
  const browserEndpoint =
    isBrowser() && (window?.VITE_TELEMETRY_ENDPOINT || window?.REACT_APP_TELEMETRY_ENDPOINT);
  const targetUrl = endpointUrl || browserEndpoint || "https://api.arth-os.dev/telemetry";
  const success = await postWithFallback(
    targetUrl,
    telemetryPayload,
    OFFLINE_QUEUE_KEYS.telemetry,
    "Telemetry",
    true
  );
  if (success) {
    console.log("[Telemetry] Captured cleanly under privacy guidelines.");
  }
  return success;
}

export async function dispatchAnonymousFeedback(feedbackPayload, endpointUrl) {
  const browserEndpoint =
    isBrowser() && (window?.VITE_FEEDBACK_ENDPOINT || window?.REACT_APP_FEEDBACK_ENDPOINT);
  const targetUrl = endpointUrl || browserEndpoint || "/api/feedback";
  return await postWithFallback(
    targetUrl,
    feedbackPayload,
    OFFLINE_QUEUE_KEYS.feedback,
    "Feedback",
    false
  );
}

export async function dispatchAnonymousFeedbackEvent(feedbackPayload, endpointUrl) {
  return await dispatchAnonymousFeedback(feedbackPayload, endpointUrl);
}
