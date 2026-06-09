import { v2DefaultAssessment } from "../data/questionnaire-v2.js";

export const componentMaximumsV2 = {
  behaviour: 45,
  awareness: 30,
  stability: 25,
};

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value || 0)));
}

export function formatMonths(months) {
  if (!Number.isFinite(months) || months <= 0) return "0";
  if (months >= 60) return "60+";
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
    fully_logical: 10,
  },
  socialInfluenceLevel: {
    heavily: 0,
    sometimes: 4,
    rarely: 7.5,
    never: 10,
  },
  unplannedPurchaseFreq: {
    very_frequently: 0,
    sometimes: 4,
    rarely: 7.5,
    never: 10,
  },
  regretImpulseFreq: {
    almost_every_time: 0,
    sometimes: 4,
    rarely: 7.5,
    never: 10,
  },
  presentFutureMindset: {
    enjoy_today: 2,
    balance_both: 7,
    secure_future: 9,
    extreme_discipline: 10,
  },
  avoidBalanceDuringStress: {
    almost_always: 0,
    sometimes: 4,
    rarely: 7.5,
    never: 10,
  },

  // v2 additions
  spendWhenBored: {
    very_likely: 0,
    sometimes: 5,
    rarely: 7.5,
    never: 10,
  },
  spendWhenStressed: {
    very_likely: 0,
    sometimes: 5,
    rarely: 7.5,
    never: 10,
  },
  plannedPurchasesOnly: {
    never: 0,
    occasionally: 4.5,
    often: 7.5,
    always: 10,
  },
  cashflowAwareness: {
    no: 0,
    sometimes: 4,
    usually: 7.5,
    always: 10,
  },
  subscriptionControl: {
    never: 0,
    occasionally: 4,
    monthly: 7.5,
    weekly: 10,
  },
  impulseWaitRule: {
    never: 0,
    rarely: 4,
    sometimes: 7,
    always: 10,
  },
};

const awarenessScoreMaps = {
  comparesLifestyleFreq: {
    constantly: 0,
    occasionally: 3,
    rarely: 5,
    never: 6,
  },
  hasFinancialPlan: {
    clear_plan: 6,
    some_plan: 4,
    no_plan: 0,
    not_sure: 1.5,
  },
  tracksExpenses: {
    regularly: 6,
    sometimes: 4,
    rarely: 2,
    never: 0,
  },
  knowsTotalDebt: {
    fully: 6,
    partially: 4,
    not_sure: 2,
    no: 0,
  },
  knowsMonthlyExpenses: {
    exact: 6,
    approximate: 4,
    not_really: 2,
    no: 0,
  },

  // v2 additions
  tracksSavingsRate: {
    know_exact: 5,
    know_some: 4,
    not_sure: 2,
    no: 0,
  },
  budgetCycle: {
    never: 0,
    once_every_2_months: 2,
    monthly: 5,
    weekly: 6,
  },
  knowsTop3Expenses: {
    no: 0,
    some: 3,
    yes: 5,
    very_clear: 6,
  },
};

const incomeStabilityScores = {
  very_consistent: 6,
  mostly_consistent: 4.5,
  somewhat_variable: 2.5,
  highly_variable: 0,
};

const dependentsScores = {
  "0_1": 3,
  "2_3": 2,
  "4_5": 1,
  "6_plus": 0,
};

function getLiabilityScore(monthlyLiabilities, monthlyIncome) {
  if (monthlyLiabilities <= 0) return 3;
  if (monthlyIncome <= 0) return 0;

  const pressure = monthlyLiabilities / monthlyIncome;
  if (pressure <= 0.15) return 3;
  if (pressure <= 0.25) return 2;
  if (pressure <= 0.35) return 1;
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
      payoffConfidence: "High",
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
      payoffConfidence: "Low",
    };
  }

  // Simple amortization estimate using effective monthly interest rate.
  const monthlyRate = (interestAnnualPct / 100) / 12;

  if (monthlyRate <= 0) {
    const months = totalDebt / payment;
    return {
      payoffMonths: months,
      payoffMonthsDisplay: formatMonths(months),
      monthlyDebtRepaymentEstimate: payment,
      interestEffectiveMonthlyRate: monthlyRate,
      payoffConfidence: "Medium",
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
      payoffConfidence: "Low",
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
      payoffConfidence: "Low",
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
      payoffConfidence: "Low",
    };
  }

  return {
    payoffMonths: months,
    payoffMonthsDisplay: formatMonths(months),
    monthlyDebtRepaymentEstimate: payment,
    interestEffectiveMonthlyRate: monthlyRate,
    payoffConfidence: "Medium",
  };
}

function getBehaviourScore(behaviour) {
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
    "impulseWaitRule",
  ];

  const values = keys.map(
    (k) => behaviourScoreMaps[k]?.[behaviour?.[k]] ?? 0,
  );
  const average = values.reduce((t, v) => t + v, 0) / Math.max(1, values.length);
  return roundToOne((average / 10) * componentMaximumsV2.behaviour);
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
    "knowsTop3Expenses",
  ];

  const total = keys.reduce(
    (sum, k) => sum + (awarenessScoreMaps[k]?.[awareness?.[k]] ?? 0),
    0,
  );
  // normalize: max roughly equals 6*5 + a few additions; clamp to 30
  const maxPossible = 6 * 5 + 6 + 6 + 6; // 5 legacy *6 + 3 additions *6
  const score = (total / maxPossible) * componentMaximumsV2.awareness;
  return roundToOne(clamp(score, 0, componentMaximumsV2.awareness));
}


const CRISIS_ELASTICITY_FACTOR = 0.4; // Assumes 40% of variable lifestyle cost can be frozen in crisis mode

function getStabilityScore(profile) {
  const monthlyExpenses = toNumber(profile.monthlyExpenses);
  const fixedSavings = toNumber(profile.emergencySavingsFixed);
  const discretionarySavings = toNumber(profile.emergencySavingsDiscretionary);
  const totalDebt = toNumber(profile.totalDebt);
  const monthlyIncome = toNumber(profile.monthlyIncome);
  const monthlyLiabilities = toNumber(profile.monthlyLiabilities);

  const totalSavings = fixedSavings + discretionarySavings;
  const survivalMonthsRaw =
    monthlyExpenses > 0 && totalSavings > 0 ? totalSavings / monthlyExpenses : 0;

  const variableExpenses = Math.max(0, monthlyExpenses - monthlyLiabilities);
  const bareMinimumBurn = monthlyLiabilities + variableExpenses * (1 - CRISIS_ELASTICITY_FACTOR);
  const bareMinimumSurvivalMonthsRaw =
    bareMinimumBurn > 0 && totalSavings > 0 ? totalSavings / bareMinimumBurn : 0;

  const fixedBufferMonths = monthlyExpenses > 0 ? fixedSavings / monthlyExpenses : 0;
  const discretionaryBufferMonths = monthlyExpenses > 0 ? discretionarySavings / monthlyExpenses : 0;

  const emergencyScore = Math.min(survivalMonthsRaw, 6) * 1.5;
  const debtScore = getDebtScore(totalDebt, monthlyIncome);
  const incomeScore = incomeStabilityScores[profile.incomeStability] ?? 0;
  const dependentsScore = dependentsScores[profile.dependentsBucket] ?? 0;
  const liabilityScore = getLiabilityScore(monthlyLiabilities, monthlyIncome);

  const raw = emergencyScore + debtScore + incomeScore + dependentsScore + liabilityScore;
  const normalized = clamp((raw / 20) * componentMaximumsV2.stability, 0, componentMaximumsV2.stability);

  return {
    score: roundToOne(normalized),
    survivalMonthsRaw,
    bareMinimumSurvivalMonthsRaw,
    fixedBufferMonths,
    discretionaryBufferMonths,
    fixedEmergencySavings: fixedSavings,
    discretionaryEmergencySavings: discretionarySavings,
    totalEmergencySavings: totalSavings,
  };
}

function getDebtScore(totalDebt, monthlyIncome) {
  if (totalDebt <= 0) return 4;
  if (monthlyIncome <= 0) return 0;

  const debtMonths = totalDebt / monthlyIncome;
  if (debtMonths <= 1) return 3.5;
  if (debtMonths <= 3) return 2.8;
  if (debtMonths <= 6) return 2.0;
  if (debtMonths <= 12) return 1.0;
  return 0.2;
}

function getPerceivedSurvivalMonths(actualSurvivalMonths, awarenessScore) {
  const awarenessFactor = clamp(
    awarenessScore / componentMaximumsV2.awareness,
    0,
    1,
  );
  const perceptionBias = 1 + (0.35 * (1 - awarenessFactor));
  return actualSurvivalMonths * perceptionBias;
}

function getAwarenessGap(awarenessScore, survivalMonthsRaw) {
  const perceivedSurvivalMonths = getPerceivedSurvivalMonths(
    survivalMonthsRaw,
    awarenessScore,
  );
  const awarenessBias = perceivedSurvivalMonths - survivalMonthsRaw;
  return {
    perceivedSurvivalMonths,
    actualSurvivalMonths: survivalMonthsRaw,
    awarenessGap: Math.abs(awarenessBias),
    awarenessBias,
  };
}

function getBlindSpotInsight(awarenessMetrics) {
  const {
    perceivedSurvivalMonths,
    actualSurvivalMonths,
    awarenessGap,
  } = awarenessMetrics;

  const headline = perceivedSurvivalMonths > actualSurvivalMonths
    ? `You believe you can survive ${formatMonths(perceivedSurvivalMonths)} months without income.`
    : perceivedSurvivalMonths < actualSurvivalMonths
      ? `You are more conservative than your actual runway suggests.`
      : `Your survival perception is tightly aligned with your actual runway.`;

  const summary = perceivedSurvivalMonths > actualSurvivalMonths
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
          : "aligned",
  };
}

function getPersonalityReport(personalityType) {
  const profiles = {
    Reactor: {
      strengths: [
        "Acts quickly",
        "Takes opportunities",
      ],
      risks: [
        "Emotional spending",
        "Social influence",
      ],
      dangerZone: "Stress periods",
      recommendedRule: "Use a 24-hour purchase delay for non-essential decisions.",
    },
    Survivor: {
      strengths: [
        "Stays cautious",
        "Protects short-term safety",
      ],
      risks: [
        "Misses growth opportunities",
        "Stays in a comfort zone",
      ],
      dangerZone: "Sudden income shock",
      recommendedRule: "Build a small automated buffer before large commitments.",
    },
    Planner: {
      strengths: [
        "Plans ahead",
        "Tracks commitments",
      ],
      risks: [
        "Overplanning",
        "Analysis paralysis",
      ],
      dangerZone: "Unexpected shocks",
      recommendedRule: "Review the plan monthly and keep 3 months liquid.",
    },
    Builder: {
      strengths: [
        "Disciplined",
        "Focuses on growth",
      ],
      risks: [
        "Underestimates stress",
        "Neglects liquidity",
      ],
      dangerZone: "Burnout from overly rigid budgets",
      recommendedRule: "Keep a separate cash reserve for surprises.",
    },
  };

  return {
    title: personalityType,
    ...(profiles[personalityType] ?? profiles.Survivor),
  };
}

function getFutureRiskProfile(profile) {
  const monthlyIncome = toNumber(profile.monthlyIncome);
  const monthlyExpenses = toNumber(profile.monthlyExpenses);
  const totalDebt = toNumber(profile.totalDebt);
  const monthlyLiabilities = toNumber(profile.monthlyLiabilities);

  const savingsRate = monthlyIncome > 0
    ? clamp((monthlyIncome - monthlyExpenses) / monthlyIncome, 0, 1)
    : 0;
  const debtBurden = monthlyIncome > 0
    ? clamp(totalDebt / (monthlyIncome * 12), 0, 1)
    : 1;
  const liabilityPressure = monthlyIncome > 0
    ? clamp(monthlyLiabilities / monthlyIncome, 0, 1)
    : 1;
  const stabilityFactor = clamp(
    (incomeStabilityScores[profile.incomeStability] ?? 0) / 6,
    0,
    1,
  );

  const score = Math.round(
    clamp(
      savingsRate * 0.35 +
        (1 - debtBurden) * 0.25 +
        (1 - liabilityPressure) * 0.2 +
        stabilityFactor * 0.2,
      0,
      1,
    ) * 100,
  );

  const label = score >= 70
    ? "Low Risk"
    : score >= 50
    ? "Moderate Risk"
    : score >= 30
    ? "High Risk"
    : "Critical Risk";

  return { score, label };
}

function getPersonalityType(behaviour) {
  const traits = {
    reactor: 0,
    survivor: 0,
    planner: 0,
    builder: 0,
  };

  if (behaviour.presentFutureMindset === "enjoy_today") traits.reactor += 2;
  if (behaviour.presentFutureMindset === "balance_both") traits.survivor += 1;
  if (behaviour.presentFutureMindset === "secure_future") traits.planner += 1;
  if (behaviour.presentFutureMindset === "extreme_discipline") traits.builder += 2;

  if (behaviour.unplannedPurchaseFreq === "very_frequently") traits.reactor += 2;
  if (behaviour.unplannedPurchaseFreq === "sometimes") traits.survivor += 1;
  if (behaviour.unplannedPurchaseFreq === "rarely") traits.planner += 1;

  if (behaviour.spendWhenStressed === "very_likely") traits.reactor += 2;
  if (behaviour.spendWhenStressed === "sometimes") traits.survivor += 1;
  if (behaviour.spendWhenStressed === "rarely") traits.planner += 1;
  if (behaviour.spendWhenStressed === "never") traits.builder += 1;

  if (behaviour.plannedPurchasesOnly === "always") traits.builder += 2;
  if (behaviour.plannedPurchasesOnly === "often") traits.planner += 1;
  if (behaviour.plannedPurchasesOnly === "occasionally") traits.survivor += 1;
  if (behaviour.plannedPurchasesOnly === "never") traits.reactor += 1;

  if (behaviour.impulseWaitRule === "always") traits.builder += 2;
  if (behaviour.impulseWaitRule === "sometimes") traits.survivor += 1;
  if (behaviour.impulseWaitRule === "rarely") traits.reactor += 1;

  if (behaviour.subscriptionControl === "weekly") traits.builder += 1;
  if (behaviour.subscriptionControl === "monthly") traits.planner += 1;
  if (behaviour.subscriptionControl === "occasionally") traits.survivor += 1;
  if (behaviour.subscriptionControl === "never") traits.reactor += 1;

  const winner = Object.entries(traits).sort((a, b) => b[1] - a[1])[0]?.[0];
  const labels = {
    reactor: "Reactor",
    survivor: "Survivor",
    planner: "Planner",
    builder: "Builder",
  };

  return labels[winner] ?? "Survivor";
}

function getHealthBand(score) {
  if (score <= 25) return { label: "Critical", tone: "critical" };
  if (score <= 50) return { label: "Vulnerable", tone: "warning" };
  if (score <= 75) return { label: "Stable", tone: "steady" };
  return { label: "Healthy", tone: "strong" };
}

function getRecommendedAction(assessment, components) {
  // ONE primary action: target the lowest component; if stability is lowest and survival is low -> emergency savings.
  const lowestKey = components.sort((a, b) => a.score - b.score)[0].key;

  const monthlyExpenses = toNumber(assessment.profile.monthlyExpenses);
  const survivalMonths = components.find((c) => c.key === "stability").survivalMonthsRaw;

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

function roundToOne(value) {
  return Math.round(value * 10) / 10;
}

function toNumber(value) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function calculateBehaviourScoreV2(behaviour) {
  return getBehaviourScore(behaviour);
}

export function calculateAwarenessScoreV2(awareness) {
  return getAwarenessScore(awareness);
}

export function calculateStabilityScoreV2(profile) {
  return getStabilityScore(profile);
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

export function calculateAwarenessGapV2(awarenessScore, survivalMonthsRaw) {
  return getAwarenessGap(awarenessScore, survivalMonthsRaw);
}

export function calculateBlindSpotV2(awarenessMetrics) {
  return getBlindSpotInsight(awarenessMetrics);
}

export function calculatePersonalityReportV2(personalityType) {
  return getPersonalityReport(personalityType);
}

export function calculateFinancialHealthV2(assessment) {
  const safe = assessment || v2DefaultAssessment;

  const behaviourScore = calculateBehaviourScoreV2(safe.behaviour);
  const awarenessScore = calculateAwarenessScoreV2(safe.awareness);
  const stability = calculateStabilityScoreV2(safe.profile);

  const healthScore = Math.round(
    behaviourScore + awarenessScore + stability.score,
  );
  const categoryBand = getHealthBand(healthScore);

  const componentRows = [
    {
      key: "behaviour",
      label: "Behaviour",
      score: behaviourScore,
      max: componentMaximumsV2.behaviour,
      band: getBehaviourBand(behaviourScore),
    },
    {
      key: "awareness",
      label: "Awareness",
      score: awarenessScore,
      max: componentMaximumsV2.awareness,
      band: getAwarenessBand(awarenessScore),
    },
    {
      key: "stability",
      label: "Stability",
      score: stability.score,
      max: componentMaximumsV2.stability,
      band: getStabilityBand(stability.score),
    },
  ].map((row) => ({
    ...row,
    percent: Math.round((row.score / row.max) * 100),
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
      survivalMonthsRaw: stability.survivalMonthsRaw,
    },
  ];
  const recommendedActionText = getRecommendedAction(
    safe,
    componentsForAction,
  );

  const survivalBand = getSurvivalBand(stability.survivalMonthsRaw);

  return {
    mode: "v2",
    behaviourScore,
    awarenessScore,
    stabilityScore: stability.score,
    healthScore,
    categoryBand,
    survivalMonthsRaw: stability.survivalMonthsRaw,
    survivalMonthsDisplay: formatMonths(stability.survivalMonthsRaw),
    bareMinimumSurvivalMonthsRaw: stability.bareMinimumSurvivalMonthsRaw,
    bareMinimumSurvivalMonthsDisplay: formatMonths(
      stability.bareMinimumSurvivalMonthsRaw,
    ),
    survivalBand,
    fixedBufferMonths: stability.fixedBufferMonths,
    discretionaryBufferMonths: stability.discretionaryBufferMonths,
    fixedBufferMonthsDisplay: formatMonths(stability.fixedBufferMonths),
    discretionaryBufferMonthsDisplay: formatMonths(
      stability.discretionaryBufferMonths,
    ),
    fixedBufferAmount: stability.fixedEmergencySavings,
    discretionaryBufferAmount: stability.discretionaryEmergencySavings,
    totalEmergencySavings: stability.totalEmergencySavings,

    componentRows,
    lowestComponent: lowest,
    strongestComponent: highest,

    recommendedActionText,

    debtSchedule,
    habits,

    summary: `${categoryBand.label} financial health with ${survivalBand.label.toLowerCase()}.`,
  };
}


function getBehaviourBand(score) {
  if (score <= 15) return "Critical behaviour risk";
  if (score <= 27) return "Needs behaviour correction";
  if (score <= 35) return "Mostly controlled";
  return "Strong financial discipline";
}

function getAwarenessBand(score) {
  if (score <= 9) return "Low visibility";
  if (score <= 18) return "Basic awareness";
  if (score <= 24) return "Solid tracking";
  return "High clarity";
}

function getStabilityBand(score) {
  if (score <= 8) return "Fragile stability";
  if (score <= 16) return "Some cushion";
  if (score <= 20) return "Resilient";
  return "Very stable";
}

function getSurvivalBand(months) {
  if (months <= 1) return { label: "Immediate risk", tone: "critical" };
  if (months <= 3) return { label: "Fragile cushion", tone: "warning" };
  if (months <= 6) return { label: "Improving stability", tone: "steady" };
  if (months <= 12) return { label: "Strong buffer", tone: "strong" };
  return { label: "Highly resilient", tone: "strong" };
}

function getHabitsMetrics(habits) {
  const checkInMap = {
    "0": 0,
    "1": 1,
    "2_3": 2.5,
    "4_plus": 4,
  };

  const reliabilityMap = {
    rarely: 0.25,
    sometimes: 0.55,
    often: 0.78,
    always: 0.95,
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
    weeklyAdherencePct,
  };
}

