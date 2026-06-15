// v2 question bank and default assessment
// Keys are namespaced by component for easier scoring and rendering.
//
// IMPORTANT: Questions are ORDERED so gate questions appear BEFORE
// the questions they skip. This ensures the adaptive question engine
// can filter out skipped questions before the user sees them.
//
// Gate questions (with 'triggerOn' in adaptiveQuestionEngine.js)
// MUST precede their 'skipKeys' targets in this array.
//
// G3 IMPROVEMENT: Each question now has an optional `context` field
// explaining "why this matters" to reduce drop-off from confusion.
// Express mode `expressPriority` tags help filter to highest-signal Qs.

// ──────────────────────────────────────────────
// Express Mode Priority Levels
// ──────────────────────────────────────────────
// 'critical' – always shown in express mode (highest signal)
// 'high'     – shown if user has time
// 'normal'   – skipped in express mode (still shown in full mode)



export const v2BehaviourQuestions = [
  // ── GATE QUESTIONS (must come first) ──
  {
    key: "emotionalMoneyLevel",
    prompt: "How emotionally connected are you to money?",
    context:
      "This is the single biggest predictor of financial behaviour — understanding your emotional relationship reveals why you spend the way you do.",
    expressPriority: "critical",
    options: [
      { value: "extremely_emotional", label: "Extremely emotional" },
      { value: "somewhat_emotional", label: "Somewhat emotional" },
      { value: "mostly_practical", label: "Mostly practical" },
      { value: "fully_logical", label: "Fully logical" }
    ]
  },
  {
    key: "socialInfluenceLevel",
    prompt: "Do social environments influence your spending decisions?",
    context:
      "Social pressure is a hidden expense — knowing your susceptibility helps us protect you from lifestyle inflation.",
    expressPriority: "critical",
    options: [
      { value: "heavily", label: "Heavily" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" }
    ]
  },
  {
    key: "presentFutureMindset",
    prompt: "Would you rather enjoy today or aggressively secure your future?",
    context:
      "This tension reveals whether you're set up for long-term wealth or trapped in short-term thinking.",
    expressPriority: "critical",
    options: [
      { value: "enjoy_today", label: "Enjoy today fully" },
      { value: "balance_both", label: "Balance both" },
      { value: "secure_future", label: "Secure future first" },
      { value: "extreme_discipline", label: "Extreme financial discipline" }
    ]
  },
  {
    key: "impulseWaitRule",
    prompt: "Do you use a waiting rule (e.g., 24 hours) for non-essential purchases?",
    context:
      "A waiting rule is the single most effective tool against impulse spending — even partial adoption helps.",
    expressPriority: "high",
    options: [
      { value: "never", label: "Never" },
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "always", label: "Always" }
    ]
  },
  {
    key: "plannedPurchasesOnly",
    prompt: "Do you buy mostly from a pre-planned list?",
    context:
      "Planned buying prevents the 'just one more thing' spiral that quietly drains thousands.",
    expressPriority: "high",
    options: [
      { value: "never", label: "Never" },
      { value: "occasionally", label: "Occasionally" },
      { value: "often", label: "Often" },
      { value: "always", label: "Always" }
    ]
  },
  {
    key: "cashflowAwareness",
    prompt: "Do you consider next-month cash flow before spending?",
    context:
      "Knowing your future cash position stops today's small purchase from becoming tomorrow's shortfall.",
    expressPriority: "high",
    options: [
      { value: "no", label: "No" },
      { value: "sometimes", label: "Sometimes" },
      { value: "usually", label: "Usually" },
      { value: "always", label: "Always" }
    ]
  },

  // ── FOLLOW-UP QUESTIONS (skipped by gate answers above) ──
  {
    key: "subscriptionControl",
    prompt: "Do you review subscriptions monthly?",
    context:
      "Subscriptions are silent cash leaks — monthly reviews cut waste without changing your lifestyle.",
    expressPriority: "normal",
    options: [
      { value: "never", label: "Never" },
      { value: "occasionally", label: "Occasionally" },
      { value: "monthly", label: "Monthly" },
      { value: "weekly", label: "Weekly" }
    ]
  },
  {
    key: "unplannedPurchaseFreq",
    prompt: "How often do you make unplanned purchases?",
    context:
      "Unplanned purchases reveal the gap between your budget and reality — closing it is where real savings live.",
    expressPriority: "normal",
    options: [
      { value: "very_frequently", label: "Very frequently" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" }
    ]
  },
  {
    key: "regretImpulseFreq",
    prompt: "How often do you regret impulse spending?",
    context:
      "The regret gap is a measure of misalignment between your values and your spending. Small, not zero.",
    expressPriority: "normal",
    options: [
      { value: "almost_every_time", label: "Almost every time" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" }
    ]
  },
  {
    key: "spendWhenBored",
    prompt: "When you're bored, how likely are you to spend?",
    context:
      "Boredom spending is one of the most common — and most preventable — drains on disposable income.",
    expressPriority: "normal",
    options: [
      { value: "very_likely", label: "Very likely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" }
    ]
  },
  {
    key: "spendWhenStressed",
    prompt: "When you're stressed, how likely are you to overspend?",
    context:
      "Stress spending is a coping mechanism — recognising it is the first step to breaking the cycle.",
    expressPriority: "normal",
    options: [
      { value: "very_likely", label: "Very likely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" }
    ]
  },
  {
    key: "avoidBalanceDuringStress",
    prompt: "Do you avoid checking your balance during stressful periods?",
    context:
      "Avoidance amplifies financial stress — checking your balance breaks the anxiety-feedback loop.",
    expressPriority: "normal",
    options: [
      { value: "almost_always", label: "Almost always" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" }
    ]
  }
];

export const v2AwarenessQuestions = [
  // ── GATE QUESTIONS (must come first) ──
  {
    key: "comparesLifestyleFreq",
    prompt: "Do you compare your lifestyle with people around you?",
    context:
      "Comparison spending is the most expensive emotion — knowing its role helps you spend on purpose, not on impulse.",
    expressPriority: "critical",
    options: [
      { value: "constantly", label: "Constantly" },
      { value: "occasionally", label: "Occasionally" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" }
    ]
  },
  {
    key: "hasFinancialPlan",
    prompt: "Would you say you have a financial plan?",
    context: "A plan turns hope into a strategy. Even a rough one beats no plan by a wide margin.",
    expressPriority: "critical",
    options: [
      { value: "clear_plan", label: "Yes, clear plan" },
      { value: "some_plan", label: "Some plan" },
      { value: "no_plan", label: "No plan" },
      { value: "not_sure", label: "Not sure" }
    ]
  },
  {
    key: "tracksExpenses",
    prompt: "Do you track your monthly expenses?",
    context:
      "Tracking is the single highest-leverage habit — it alone reduces overspending by 20-30%.",
    expressPriority: "critical",
    options: [
      { value: "regularly", label: "Regularly" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" }
    ]
  },
  {
    key: "knowsTotalDebt",
    prompt: "Do you know your total debt?",
    context:
      "Debt you don't know about grows faster than debt you track — awareness is the first step to repayment.",
    expressPriority: "high",
    options: [
      { value: "fully", label: "Yes, fully" },
      { value: "partially", label: "Partially" },
      { value: "not_sure", label: "Not sure" },
      { value: "no", label: "No" }
    ]
  },
  {
    key: "knowsMonthlyExpenses",
    prompt: "Do you know your monthly expenses?",
    context:
      "If you don't know the number, you can't control it. This is the foundation of every budget.",
    expressPriority: "high",
    options: [
      { value: "exact", label: "Yes, exact" },
      { value: "approximate", label: "Approximate" },
      { value: "not_really", label: "Not really" },
      { value: "no", label: "No" }
    ]
  },

  // ── FOLLOW-UP QUESTIONS (skipped by gate answers above) ──
  {
    key: "tracksSavingsRate",
    prompt: "Do you know your savings rate (roughly)?",
    context:
      "Your savings rate is the single metric that correlates most with long-term financial independence.",
    expressPriority: "normal",
    options: [
      { value: "know_exact", label: "Yes, approximate" },
      { value: "know_some", label: "I have a rough idea" },
      { value: "not_sure", label: "Not sure" },
      { value: "no", label: "No" }
    ]
  },
  {
    key: "budgetCycle",
    prompt: "Do you revisit your budget each month?",
    context:
      "Monthly reviews keep your budget alive — without them, plans drift and spending creeps up.",
    expressPriority: "normal",
    options: [
      { value: "never", label: "Never" },
      { value: "once_every_2_months", label: "Every 2 months" },
      { value: "monthly", label: "Monthly" },
      { value: "weekly", label: "Weekly" }
    ]
  },
  {
    key: "knowsTop3Expenses",
    prompt: "Do you know your top 3 expense categories?",
    context:
      "Identifying top 3 expenses gives you 80% of the insight with 20% of the effort — Pareto's principle for your money.",
    expressPriority: "normal",
    options: [
      { value: "no", label: "No" },
      { value: "some", label: "Somewhat" },
      { value: "yes", label: "Yes" },
      { value: "very_clear", label: "Very clear" }
    ]
  }
];

export const v2ProfileQuestions = [
  {
    key: "monthlyLiabilities",
    label: "Fixed commitments (₹/month)"
  },
  {
    key: "monthlyIncome",
    label: "Monthly income (₹)"
  }
];

export const v2StabilityQuestions = [
  {
    key: "incomeStability",
    prompt: "Income stability",
    options: [
      { value: "very_consistent", label: "Very consistent" },
      { value: "mostly_consistent", label: "Mostly consistent" },
      { value: "somewhat_variable", label: "Somewhat variable" },
      { value: "highly_variable", label: "Highly variable" }
    ]
  },
  {
    key: "dependentsBucket",
    prompt: "Dependents",
    options: [
      { value: "0_1", label: "0-1" },
      { value: "2_3", label: "2-3" },
      { value: "4_5", label: "4-5" },
      { value: "6_plus", label: "6+" }
    ]
  }
];

export const v2HabitsQuestions = [
  // ── GATE QUESTIONS ──
  {
    key: "debtPaymentDiscipline",
    prompt: "When you promise yourself a debt/payment, how reliably do you follow through?",
    context:
      "Follow-through is the bridge between intention and financial health — this alone predicts progress more than any plan.",
    expressPriority: "critical",
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
      { value: "always", label: "Always" }
    ]
  },

  // ── FOLLOW-UP QUESTIONS ──
  {
    key: "habitCheckInsPerWeek",
    prompt: "How many times per week do you do a quick money check-in?",
    context:
      "Frequent small check-ins build financial awareness without the overhead of formal budgeting.",
    expressPriority: "normal",
    options: [
      { value: "0", label: "0" },
      { value: "1", label: "1" },
      { value: "2_3", label: "2-3" },
      { value: "4_plus", label: "4+" }
    ]
  }
];

export const v2DefaultAssessment = {
  mode: "v2",
  behaviour: {
    emotionalMoneyLevel: "somewhat_emotional",
    socialInfluenceLevel: "sometimes",
    unplannedPurchaseFreq: "sometimes",
    regretImpulseFreq: "sometimes",
    presentFutureMindset: "balance_both",
    avoidBalanceDuringStress: "sometimes",

    // v2 additions
    spendWhenBored: "sometimes",
    spendWhenStressed: "sometimes",
    plannedPurchasesOnly: "occasionally",
    cashflowAwareness: "sometimes",
    subscriptionControl: "occasionally",
    impulseWaitRule: "sometimes"
  },
  awareness: {
    comparesLifestyleFreq: "occasionally",
    hasFinancialPlan: "some_plan",
    tracksExpenses: "sometimes",
    knowsTotalDebt: "partially",
    knowsMonthlyExpenses: "approximate",

    // v2 additions
    tracksSavingsRate: "not_sure",
    budgetCycle: "once_every_2_months",
    knowsTop3Expenses: "some"
  },
  profile: {
    monthlyExpenses: 50000,
    emergencySavingsFixed: 50000,
    emergencySavingsDiscretionary: 40000,
    totalDebt: 160000,
    monthlyIncome: 90000,
    incomeStability: "mostly_consistent",
    dependentsBucket: "0_1",
    monthlyLiabilities: 18000,

    // debt schedule inputs (v2)
    debtRepaymentRatePctOfIncome: 0.12, // heuristic % of income to debt repayment
    averageInterestRatePct: 10 // used only for estimate (simple)
  },
  participant: {
    name: "",
    age: "",
    email: ""
  },
  habits: {
    habitCheckInsPerWeek: "1",
    debtPaymentDiscipline: "sometimes"
  }
};