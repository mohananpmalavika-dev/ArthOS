export function simulateSavings(currentRunway, amount) {
  const bonusMonths = Math.round(amount / 5000) || 0;
  return Math.max(0, currentRunway + bonusMonths);
}

export function simulateDebtReduction(currentRunway, amount) {
  const runwayGain = Math.round(amount / 7500) || 0;
  return Math.max(0, currentRunway + runwayGain + 1);
}

export function simulateSalaryIncrease(currentRunway, amount) {
  const runwayGain = Math.round(amount / 10000) || 0;
  return Math.max(0, currentRunway + runwayGain + 2);
}

export function simulateJobLoss(currentRunway) {
  return Math.max(0, currentRunway - 5);
}

export function buildFinancialTwinScenarios(result, profile) {
  // Safely handle undefined or empty result/profile
  if (!result || !profile) {
    return {
      baseRunway: 0,
      survivalNow: 0,
      survivalIfSave5000: 0,
      survivalIfDebtReduced: 0,
      survivalIfSalaryIncrease: 0,
      survivalIfJobLoss: 0,
    };
  }

  const baseRunway = Number(result?.survivalMonthsRaw || 0);
  const savingsBuffer = Number(profile?.emergencySavingsFixed || 0) + Number(profile?.emergencySavingsDiscretionary || 0);
  const salaryEstimate = Number(profile?.annualIncome || profile?.monthlyIncome || 0);
  const jobLossRunway = simulateJobLoss(baseRunway);
  const savingsRunway = simulateSavings(baseRunway, Math.min(savingsBuffer, 20000));
  const debtRunway = simulateDebtReduction(baseRunway, Number(profile?.totalDebt || 0) * 0.05);
  const salaryRunway = simulateSalaryIncrease(baseRunway, salaryEstimate ? salaryEstimate * 0.1 : 0);

  return {
    baseRunway,
    survivalNow: Math.round(baseRunway),
    survivalIfSave5000: Math.round(savingsRunway),
    survivalIfDebtReduced: Math.round(debtRunway),
    survivalIfSalaryIncrease: Math.round(salaryRunway),
    survivalIfJobLoss: Math.round(jobLossRunway),
  };
}
