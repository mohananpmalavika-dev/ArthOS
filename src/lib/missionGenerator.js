// Simple mission generation heuristics for Weekly Mission
export function generateMission(profile = {}, result = {}) {
  const runway = Number(result?.survivalMonths || result?.survivalMonthsDisplay || 0) || 0;
  const investmentScore = Number(profile?.investmentScore || profile?.portfolioScore || 0) || 0;
  const debtRatio = Number(profile?.debtRatio || 0) || 0;
  // Default mission values
  const emergencyTarget = 2000; // ₹2,000 sample

  // Emergency buffer if runway is low or debt is high
  if (runway < 1 || debtRatio > 0.6) {
    const saved = Number(profile?.savingsTowardEmergency || 0);
    const progress = Math.min(1, saved / emergencyTarget);
    return {
      id: "emergency-buffer",
      title: "Emergency Buffer",
      subtitle: `Save ₹${emergencyTarget.toLocaleString()}`,
      targetAmount: emergencyTarget,
      saved: saved,
      progress,
      daysRemaining: 4,
      reward: { health: 6, runwayMonths: 0.4 },
      gamify: {
        level: profile?.level || 4,
        title: profile?.levelTitle || "Financial Explorer",
        xp: profile?.xp || 1240,
        nextXP: profile?.nextXP || 1500,
      },
    };
  }

  // Debt reduction mission if debtRatio significant
  if (debtRatio > 0.25) {
    const target = Math.max(2000, Math.round(debtRatio * 5000));
    const saved = Number(profile?.debtRepaymentSaved || 0);
    return {
      id: "debt-reduction",
      title: "Debt Reduction",
      subtitle: `Pay down ₹${target.toLocaleString()}`,
      targetAmount: target,
      saved,
      progress: Math.min(1, saved / target),
      daysRemaining: 7,
      reward: { health: 4, runwayMonths: 0.1 },
      gamify: {
        level: profile?.level || 3,
        title: profile?.levelTitle || "Budgeter",
        xp: profile?.xp || 820,
        nextXP: profile?.nextXP || 1000,
      },
    };
  }

  // Default: Save More mission
  const defaultTarget = 2000;
  const saved = Number(profile?.monthlySaved || 0);
  return {
    id: "save-more",
    title: "Save More",
    subtitle: `Save ₹${defaultTarget.toLocaleString()}`,
    targetAmount: defaultTarget,
    saved,
    progress: Math.min(1, saved / defaultTarget),
    daysRemaining: 5,
    reward: { health: 3, runwayMonths: 0.2 },
    gamify: {
      level: profile?.level || 2,
      title: profile?.levelTitle || "Saver",
      xp: profile?.xp || 420,
      nextXP: profile?.nextXP || 600,
    },
  };
}

export function formatCurrencyINR(amount) {
  try {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
  } catch (e) {
    return String(amount);
  }
}
