export function generateAlerts(user = {}) {
  const alerts = [];
  const survivalMonths = Number(user.survivalMonths || user.runway || 0);
  const income = Number(user.monthlyIncome || user.annualIncome || 0);
  const expense = Number(user.monthlyExpense || user.monthlySpending || 0);
  const savings = Number(user.savings || user.emergencySavings || 0);

  if (survivalMonths > 20) {
    alerts.push({
      type: "opportunity",
      title: "Investment Capacity Available",
      message: "Your runway is strong enough to explore higher-conviction investments without sacrificing stability.",
    });
  }

  if (survivalMonths < 3) {
    alerts.push({
      type: "risk",
      title: "Runway Risk Detected",
      message: "Your emergency buffer may not sustain the next 90 days under current spending patterns.",
    });
  }

  if (income > 0 && expense > 0 && income - expense > 5000) {
    alerts.push({
      type: "opportunity",
      title: "Surplus Cashflow Opportunity",
      message: "You have discretionary capacity to increase savings or invest in a resilience strategy.",
    });
  }

  if (savings > 0 && expense > 0 && savings / expense >= 3) {
    alerts.push({
      type: "opportunity",
      title: "Healthy Runway Alert",
      message: "You have a strong liquidity buffer for a career pivot, home purchase, or investment shift.",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      type: "info",
      title: "Balanced outlook",
      message: "No immediate alerts. Keep reinforcing positive habits and watch your runway closely.",
    });
  }

  return alerts;
}
