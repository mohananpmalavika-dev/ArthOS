// Forecast Engine - v0 prototypes with probabilistic forecasts

function clamp(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, value);
}

export function forecast30d(userProfile, history = []) {
  const recent = history.slice(-30).map((h) => h.balance || 0);
  const delta = recent.length >= 2 ? recent[recent.length - 1] - recent[0] : 0;
  const daily = delta / Math.max(1, recent.length);
  const projection = Array.from({ length: 30 }, (_, i) => Math.round((recent[recent.length - 1] || 0) + daily * (i + 1)));
  return { horizon: 30, projection, generatedAt: new Date().toISOString() };
}

export function forecast90d(userProfile, history = []) {
  const base = forecast30d(userProfile, history).projection.slice(0, 30);
  const last = base[base.length - 1] || 0;
  const growth = Math.round(last * 0.02);
  const projection = [...base];
  for (let i = 0; i < 60; i++) projection.push(last + growth * (i + 1));
  return { horizon: 90, projection, generatedAt: new Date().toISOString() };
}

export function forecast180d(userProfile, history = []) {
  const p90 = forecast90d(userProfile, history).projection;
  const last = p90[p90.length - 1] || 0;
  const growth = Math.round(last * 0.03);
  const projection = [...p90];
  for (let i = 0; i < 90; i++) projection.push(last + growth * (i + 1));
  return { horizon: 180, projection, generatedAt: new Date().toISOString() };
}

export function forecastHealth(currentScore, monthlyImprovement = 0) {
  return {
    day30: clamp(currentScore + monthlyImprovement),
    day90: clamp(currentScore + monthlyImprovement * 3),
    day180: clamp(currentScore + monthlyImprovement * 6),
  };
}

export function detectFutureRisk(profile = {}) {
  const savings = Number(profile.savings || profile.emergencySavings || 0);
  const expense = Number(profile.monthlyExpense || profile.monthlySpending || 1);
  const runway = expense > 0 ? savings / expense : 0;
  const riskScore = clamp(Math.round(100 - Math.min(100, runway * 10)));
  const level = riskScore > 70 ? 'High' : riskScore > 40 ? 'Medium' : 'Low';

  return {
    runway: Math.round(runway * 10) / 10,
    riskScore,
    riskLevel: level,
    message: runway < 3 ? 'Short runway - consider buffering savings.' : 'Runway looks stable for the near term.',
  };
}

export function simulateWhatIf(profile = {}, deltaMonthlySaving = 1000) {
  const currentScore = Number(profile.currentScore || 50);
  const improvement = Number(deltaMonthlySaving) / Math.max(1, Number(profile.monthlyExpense || profile.monthlySpending || 1));
  return {
    scenario: `Save ₹${deltaMonthlySaving} more monthly`,
    projectedDay30: clamp(currentScore + improvement),
    projectedDay90: clamp(currentScore + improvement * 3),
    projectedDay180: clamp(currentScore + improvement * 6),
    generatedAt: new Date().toISOString(),
  };
}

export function riskAlertEngine(projection) {
  const hasNegative = projection.some((p) => p < 0);
  const maxDrop = Math.min(0, Math.min(...projection) - Math.max(...projection));
  const alerts = [];
  if (hasNegative) alerts.push({ level: 'high', message: 'Projected negative balance within horizon' });
  if (Math.abs(maxDrop) > 5000) alerts.push({ level: 'medium', message: 'Large projected drop in balance' });
  return alerts;
}
