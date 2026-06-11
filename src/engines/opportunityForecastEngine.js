export function opportunityForecast(profile = {}) {
  const savingsIncrease = Number(profile.suggestedSavingsIncrease || 3000);
  const expense = Number(profile.monthlyExpense || profile.monthlySpending || 1);
  const addedRunway = expense > 0 ? savingsIncrease * 12 / expense : 0;

  return {
    action: `Save ₹${Math.round(savingsIncrease)} more monthly`,
    benefit: `${addedRunway.toFixed(1)} extra months runway`,
    generatedAt: new Date().toISOString(),
  };
}
