/**
 * AI Insight Generation Engine
 * Produces personalized financial insights powered by pattern detection + heuristics
 * Designed to be replaceable by a real LLM later
 */

export function generatePersonalizedInsights(assessmentResult, assessment) {
  if (!assessmentResult || !assessment) return [];

  const {
    behaviourScore,
    awarenessScore,
    stabilityScore,
    personalityType,
    survivalMonthsRaw,
    survivalDaysRaw,    // L04: Blueprint-compliant days calculation
    futureRiskLabel,
    lowestComponent,
    diagnosis,
  } = assessmentResult;

  const profile = assessment.profile || {};
  const behaviour = assessment.behaviour || {};
  const monthlyIncome = Number(profile.monthlyIncome) || 0;
  const monthlyExpenses = Number(profile.monthlyExpenses) || 0;
  const totalDebt = Number(profile.totalDebt) || 0;

  const insights = [];

  // 1. BEHAVIOUR INSIGHTS
  if (behaviourScore < 25) {
    insights.push({
      id: 'behaviour_critical',
      category: 'Behaviour',
      priority: 'critical',
      headline: 'Your spending behaviour is the biggest risk.',
      insight:
        'Impulse purchases and emotional spending are eroding your runway. Even small daily habits compound into months of lost buffer.',
      actionable: 'Pick ONE trigger (social spending, bored shopping, stress relief) and replace it this week.',
      signal: `Behaviour Score: ${Math.round(behaviourScore)}/45`,
    });
  } else if (behaviourScore < 35) {
    insights.push({
      id: 'behaviour_moderate',
      category: 'Behaviour',
      priority: 'high',
      headline: 'Your habits are inconsistent.',
      insight: "Some days you're disciplined. Other days, not so much. This inconsistency is expensive.",
      actionable: 'Track your spending for 7 days without judging. Just observe the pattern.',
      signal: `Behaviour Score: ${Math.round(behaviourScore)}/45`,
    });
  } else if (behaviourScore >= 35) {
    insights.push({
      id: 'behaviour_strong',
      category: 'Behaviour',
      priority: 'low',
      headline: 'Your financial discipline is solid.',
      insight: "You have habits that work. Keep them. They're your foundation.",
      actionable: null,
      signal: `Behaviour Score: ${Math.round(behaviourScore)}/45`,
    });
  }

  // 2. AWARENESS INSIGHTS
  if (awarenessScore < 10) {
    insights.push({
      id: 'awareness_blind',
      category: 'Awareness',
      priority: 'critical',
      headline: 'You don\'t know your own financial reality.',
      insight:
        "You're operating on feeling, not data. This is the most dangerous place to be. One surprise shock and you're in crisis.",
      actionable: 'List your monthly expenses from memory. Then track for 7 days. Compare. This gap is your blind spot.',
      signal: `Awareness Score: ${Math.round(awarenessScore)}/30`,
    });
  } else if (awarenessScore < 18) {
    insights.push({
      id: 'awareness_partial',
      category: 'Awareness',
      priority: 'high',
      headline: 'You have gaps in your financial visibility.',
      insight: `You know some things (probably income), but not others (probably exact debt or expenses).`,
      actionable: 'Spend 30 minutes this week getting exact numbers for: total debt, fixed expenses, and savings.',
      signal: `Awareness Score: ${Math.round(awarenessScore)}/30`,
    });
  } else {
    insights.push({
      id: 'awareness_good',
      category: 'Awareness',
      priority: 'low',
      headline: 'You have good visibility into your finances.',
      insight: 'You know where you stand. This is rare. Use it to your advantage.',
      actionable: null,
      signal: `Awareness Score: ${Math.round(awarenessScore)}/30`,
    });
  }

  // 3. STABILITY INSIGHTS
  if (survivalMonthsRaw < 1) {
    insights.push({
      id: 'stability_critical',
      category: 'Stability',
      priority: 'critical',
      headline: 'You have less than 1 month of runway.',
      insight:
        "You're one missed payment away from crisis. Any disruption (job loss, medical emergency) is a catastrophe.",
      actionable: 'Make emergency savings your ONLY financial goal for the next 60 days. Target: 1 month of expenses.',
      signal: `Survival Window: ${Math.round(survivalDaysRaw || survivalMonthsRaw * 30)} days`,  // L04: Use actual days calculation
    });
  } else if (survivalMonthsRaw < 3) {
    insights.push({
      id: 'stability_fragile',
      category: 'Stability',
      priority: 'high',
      headline: `Your buffer is fragile (${Math.round(survivalMonthsRaw)} months).`,
      insight: 'You have some protection, but not enough. A single emergency drains your reserves.',
      actionable: 'Build to 3 months of expenses. Then add another month. Pace: ₹5-10K per month.',
      signal: `Survival Window: ${Math.round(survivalMonthsRaw)} months`,
    });
  } else if (survivalMonthsRaw < 6) {
    insights.push({
      id: 'stability_moderate',
      category: 'Stability',
      priority: 'medium',
      headline: `You have moderate stability (${Math.round(survivalMonthsRaw)} months).`,
      insight: "Most emergencies won't destroy you. But you could be more resilient.",
      actionable: 'Target 6 months of buffer. Then start building discretionary savings.',
      signal: `Survival Window: ${Math.round(survivalMonthsRaw)} months`,
    });
  } else {
    insights.push({
      id: 'stability_strong',
      category: 'Stability',
      priority: 'low',
      headline: 'You have strong financial resilience.',
      insight: 'Your buffer is solid. You can weather most surprises without panic.',
      actionable: null,
      signal: `Survival Window: ${Math.round(survivalMonthsRaw)} months`,
    });
  }

  // 4. DEBT INSIGHTS
  if (totalDebt > 0) {
    const debtToIncome = totalDebt / (monthlyIncome * 12 || 1);
    if (debtToIncome > 2) {
      insights.push({
        id: 'debt_high',
        category: 'Debt',
        priority: 'critical',
        headline: `Your debt-to-income ratio is ${(debtToIncome * 100).toFixed(0)}%. Too high.`,
        insight: 'You owe more than 2 years of your gross income. This is unsustainable.',
        actionable: 'Create a debt payoff plan. Increase monthly repayment by ₹5K if possible.',
        signal: `Total Debt: ₹${Math.round(totalDebt / 100000) * 100}K`,
      });
    }
  }

  // 5. INCOME-EXPENSE ALIGNMENT
  const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0;
  if (savingsRate < 0) {
    insights.push({
      id: 'expenses_exceed_income',
      category: 'Cash Flow',
      priority: 'critical',
      headline: 'Your expenses exceed your income.',
      insight: "You're spending more than you earn. This is burning your savings by ₹" + Math.round(Math.abs(monthlyIncome - monthlyExpenses)) + ' per month.',
      actionable: 'Cut expenses or increase income. Right now, pick the easier one and do it.',
      signal: `Monthly Deficit: ₹${Math.round(Math.abs(monthlyIncome - monthlyExpenses))}`,
    });
  } else if (savingsRate < 0.1) {
    insights.push({
      id: 'savings_minimal',
      category: 'Cash Flow',
      priority: 'high',
      headline: "You're barely saving.",
      insight: `Your savings rate is ${(savingsRate * 100).toFixed(0)}%. You're one disruption away from debt.`,
      actionable: 'Find ₹2-5K per month to save. Cut one discretionary category (delivery, subscriptions, etc).',
      signal: `Monthly Savings: ₹${Math.round(monthlyIncome * savingsRate)}`,
    });
  }

  // 6. PERSONALITY-SPECIFIC INSIGHTS
  const personalityInsights = {
    Builder: {
      id: 'personality_builder',
      headline: 'Your strength is discipline. Your risk is rigidity.',
      insight:
        "You plan everything. But life is messy. Leave room for flexibility, or you'll burn out.",
      actionable: 'Review your budget quarterly, not daily. Let small deviations breathe.',
    },
    Survivor: {
      id: 'personality_survivor',
      headline: 'Your strength is caution. Your risk is stagnation.',
      insight:
        'You avoid downside well. But you also miss upside. A little growth beats perpetual safety.',
      actionable: 'Allocate 5-10% of savings to a small growth opportunity (investment, skill, side income).',
    },
    Optimizer: {
      id: 'personality_optimizer',
      headline: 'Your strength is balance. Your risk is analysis paralysis.',
      insight: 'You analyze everything. Sometimes you need to just decide and move.',
      actionable: 'Set a decision deadline. After 1 week of analysis, commit to a choice.',
    },
    Dreamer: {
      id: 'personality_dreamer',
      headline: 'Your strength is vision. Your risk is wishful thinking.',
      insight: "Your goals are inspiring. But they're disconnected from your current cash flow.",
      actionable: 'Break your big goal into 12-month milestones. Each with a monthly cost.',
    },
    'Risk Taker': {
      id: 'personality_risk_taker',
      headline: 'Your strength is agility. Your risk is volatility.',
      insight: 'You move fast and grab opportunities. But you also make expensive mistakes.',
      actionable: "Before any major decision, sleep on it. If it's good, it'll still be good tomorrow.",
    },
  };

  const personalityInsight = personalityInsights[personalityType];
  if (personalityInsight) {
    insights.push({
      ...personalityInsight,
      category: 'Personality',
      priority: 'medium',
      signal: `Type: ${personalityType}`,
    });
  }

  return insights.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Detect behavioral patterns and anomalies
 */
export function detectBehaviouralPatterns(assessment, historicalData) {
  const patterns = [];

  const behaviour = assessment.behaviour || {};

  // Pattern 1: Stress spending
  if (behaviour.spendWhenStressed === 'very_likely' || behaviour.spendWhenBored === 'very_likely') {
    patterns.push({
      id: 'stress_spending',
      name: 'Stress Spending Trigger',
      severity: 'high',
      description: "You're likely to spend money when stressed or bored.",
      evidence: 'Self-assessment indicates high emotional spending.',
    });
  }

  // Pattern 2: Impulse override
  if (behaviour.unplannedPurchaseFreq === 'very_frequently' || behaviour.impulseWaitRule === 'never') {
    patterns.push({
      id: 'impulse_override',
      name: 'Impulse Override Pattern',
      severity: 'high',
      description: 'You often buy without planning. This erodes savings.',
      evidence: 'Assessment shows minimal waiting rules or planning.',
    });
  }

  // Pattern 3: Awareness denial
  if (behaviour.comparesLifestyleFreq === 'constantly') {
    patterns.push({
      id: 'social_comparison',
      name: 'Social Comparison Bias',
      severity: 'medium',
      description: 'You compare lifestyle frequently. This drives emotional spending.',
      evidence: 'High comparison frequency detected.',
    });
  }

  return patterns;
}
