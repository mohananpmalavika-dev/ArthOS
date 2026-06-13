const behaviourScores = {
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
  }
};

const awarenessScores = {
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

export const componentMaximums = {
  behaviour: 40,
  awareness: 30,
  stability: 30
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

  if (months >= 36) {
    return "36+";
  }

  return Number.isInteger(months) ? String(months) : months.toFixed(1);
}

export function calculateFinancialHealth(assessment) {
  const behaviourScore = calculateBehaviourScore(assessment.behaviour);
  const awarenessScore = calculateAwarenessScore(assessment.awareness);
  const stability = calculateStabilityScore(assessment.profile);
  const healthScore = Math.round(behaviourScore + awarenessScore + stability.score);
  const categoryBand = getHealthBand(healthScore);
  const survivalBand = getSurvivalBand(stability.survivalMonthsRaw);
  const componentRows = getComponentRows({
    behaviour: behaviourScore,
    awareness: awarenessScore,
    stability: stability.score
  });
  const lowest = componentRows[0];
  const highest = [...componentRows].sort((a, b) => b.percent - a.percent)[0];
  const recommendedActionText = getRecommendedAction(
    lowest.key,
    assessment,
    stability.survivalMonthsRaw
  );

  return {
    behaviourScore,
    awarenessScore,
    stabilityScore: stability.score,
    healthScore,
    categoryBand,
    survivalMonthsRaw: stability.survivalMonthsRaw,
    survivalMonthsDisplay: formatMonths(stability.survivalMonthsRaw),
    survivalBand,
    componentRows,
    lowestComponent: lowest,
    strongestComponent: highest,
    recommendedActionText,
    summary: `${categoryBand.label} financial health with ${survivalBand.label.toLowerCase()}.`
  };
}

function calculateBehaviourScore(behaviour) {
  const values = Object.entries(behaviourScores).map(([key, scoreMap]) => {
    return scoreMap[behaviour[key]] ?? 0;
  });
  const average = values.reduce((total, value) => total + value, 0) / values.length;
  return roundToOne((average / 10) * componentMaximums.behaviour);
}

function calculateAwarenessScore(awareness) {
  return roundToOne(
    Object.entries(awarenessScores).reduce((total, [key, scoreMap]) => {
      return total + (scoreMap[awareness[key]] ?? 0);
    }, 0)
  );
}

function calculateStabilityScore(profile) {
  const monthlyExpenses = toNumber(profile.monthlyExpenses);
  const emergencySavings = toNumber(profile.emergencySavings);
  const totalDebt = toNumber(profile.totalDebt);
  const monthlyIncome = toNumber(profile.monthlyIncome);
  const monthlyLiabilities = toNumber(profile.monthlyLiabilities);
  const survivalMonthsRaw =
    monthlyExpenses > 0 && emergencySavings > 0 ? emergencySavings / monthlyExpenses : 0;

  const emergencyScore = Math.min(survivalMonthsRaw, 6) * 2;
  const debtScore = getDebtScore(totalDebt, monthlyIncome);
  const incomeScore = incomeStabilityScores[profile.incomeStability] ?? 0;
  const dependentsScore = dependentsScores[profile.dependentsBucket] ?? 0;
  const liabilityScore = getLiabilityScore(monthlyLiabilities, monthlyIncome);

  return {
    score: roundToOne(emergencyScore + debtScore + incomeScore + dependentsScore + liabilityScore),
    survivalMonthsRaw
  };
}

function getDebtScore(totalDebt, monthlyIncome) {
  if (totalDebt <= 0) {
    return 6;
  }

  if (monthlyIncome <= 0) {
    return 0;
  }

  const debtMonths = totalDebt / monthlyIncome;

  if (debtMonths <= 1) {
    return 5.5;
  }
  if (debtMonths <= 3) {
    return 4.5;
  }
  if (debtMonths <= 6) {
    return 3;
  }
  if (debtMonths <= 12) {
    return 1.5;
  }
  return 0;
}

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

function getComponentRows(scores) {
  return [
    {
      key: "behaviour",
      label: "Behaviour",
      score: scores.behaviour,
      max: componentMaximums.behaviour,
      band: getBehaviourBand(scores.behaviour)
    },
    {
      key: "awareness",
      label: "Awareness",
      score: scores.awareness,
      max: componentMaximums.awareness,
      band: getAwarenessBand(scores.awareness)
    },
    {
      key: "stability",
      label: "Stability",
      score: scores.stability,
      max: componentMaximums.stability,
      band: getStabilityBand(scores.stability)
    }
  ]
    .map(row => ({
      ...row,
      percent: Math.round((row.score / row.max) * 100)
    }))
    .sort((a, b) => a.percent - b.percent);
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

function getBehaviourBand(score) {
  if (score <= 13) {
    return "Critical behaviour risk";
  }
  if (score <= 26) {
    return "Needs behaviour correction";
  }
  if (score <= 34) {
    return "Mostly controlled";
  }
  return "Strong financial discipline";
}

function getAwarenessBand(score) {
  if (score <= 9) {
    return "Low visibility";
  }
  if (score <= 19) {
    return "Basic awareness";
  }
  if (score <= 24) {
    return "Solid tracking";
  }
  return "High clarity";
}

function getStabilityBand(score) {
  if (score <= 9) {
    return "Fragile stability";
  }
  if (score <= 19) {
    return "Some cushion";
  }
  if (score <= 24) {
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

function getRecommendedAction(driverKey, assessment, survivalMonths) {
  if (driverKey === "behaviour") {
    if (assessment.behaviour.unplannedPurchaseFreq !== "never") {
      return "Reduce unplanned purchases by 20% this month.";
    }

    return "Add a 24-hour pause before any non-essential purchase this month.";
  }

  if (driverKey === "awareness") {
    if (assessment.awareness.tracksExpenses !== "regularly") {
      return "Track every expense for the next 14 days and record the total.";
    }

    return "Write a one-page monthly money plan before the next salary cycle.";
  }

  const monthlyExpenses = toNumber(assessment.profile.monthlyExpenses);

  if (survivalMonths < 2) {
    return `Build emergency savings of ${formatCurrency(monthlyExpenses)} within 60 days.`;
  }

  if (survivalMonths <= 6) {
    return `Add ${formatCurrency(monthlyExpenses * 0.5)} to emergency savings within 60 days.`;
  }

  return "Move one high-interest debt payment forward by 7 days this month.";
}

function toNumber(value) {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
}

function roundToOne(value) {
  return Math.round(value * 10) / 10;
}
