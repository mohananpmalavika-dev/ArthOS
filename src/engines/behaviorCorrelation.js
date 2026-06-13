function toNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateBehavioralCorrelationV2(assessment) {
  const { behaviour, awareness, profile } = assessment;
  const totalSavings =
    toNumber(profile.emergencySavingsFixed) + toNumber(profile.emergencySavingsDiscretionary);
  const monthlyExpenses = toNumber(profile.monthlyExpenses);
  const monthlyIncome = toNumber(profile.monthlyIncome);

  const lowAwareness =
    awareness.tracksExpenses !== "regularly" || awareness.knowsMonthlyExpenses !== "exact";
  const stressedSpending = ["very_likely", "sometimes"].includes(behaviour.spendWhenStressed);
  const boredSpending = ["very_likely", "sometimes"].includes(behaviour.spendWhenBored);
  const socialPressure = behaviour.socialInfluenceLevel !== "never";
  const lowSavings = totalSavings < monthlyExpenses * 2;
  const highDebt = toNumber(profile.totalDebt) > monthlyIncome * 0.5;

  const correlations = [];

  if ((stressedSpending || boredSpending) && lowAwareness) {
    correlations.push({
      title: "Financial Drift Risk",
      description:
        "Stress or boredom spending combined with weak expense awareness can cause your budget to drift far from plan."
    });
  }

  if (socialPressure && lowSavings) {
    correlations.push({
      title: "Lifestyle Inflation Risk",
      description:
        "Social influence plus modest savings means lifestyle inflation can erode your runway quickly."
    });
  }

  if (highDebt && totalSavings < monthlyExpenses * 3) {
    correlations.push({
      title: "Debt Strain Risk",
      description: "High debt with a thin cash buffer makes your runway fragile if income slows."
    });
  }

  if (correlations.length === 0) {
    correlations.push({
      title: "Behavioral Resilience",
      description:
        "Your current profile shows no immediate behavior-driven risk clusters, but continue tracking consistently."
    });
  }

  return correlations;
}
