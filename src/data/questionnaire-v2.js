// v2 question bank and default assessment
// Keys are namespaced by component for easier scoring and rendering.

export const v2BehaviourQuestions = [
  {
    key: "emotionalMoneyLevel",
    prompt: "How emotionally connected are you to money?",
    options: [
      { value: "extremely_emotional", label: "Extremely emotional" },
      { value: "somewhat_emotional", label: "Somewhat emotional" },
      { value: "mostly_practical", label: "Mostly practical" },
      { value: "fully_logical", label: "Fully logical" },
    ],
  },
  {
    key: "socialInfluenceLevel",
    prompt: "Do social environments influence your spending decisions?",
    options: [
      { value: "heavily", label: "Heavily" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" },
    ],
  },
  {
    key: "unplannedPurchaseFreq",
    prompt: "How often do you make unplanned purchases?",
    options: [
      { value: "very_frequently", label: "Very frequently" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" },
    ],
  },
  {
    key: "regretImpulseFreq",
    prompt: "How often do you regret impulse spending?",
    options: [
      { value: "almost_every_time", label: "Almost every time" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" },
    ],
  },
  {
    key: "presentFutureMindset",
    prompt: "Would you rather enjoy today or aggressively secure your future?",
    options: [
      { value: "enjoy_today", label: "Enjoy today fully" },
      { value: "balance_both", label: "Balance both" },
      { value: "secure_future", label: "Secure future first" },
      { value: "extreme_discipline", label: "Extreme financial discipline" },
    ],
  },
  {
    key: "avoidBalanceDuringStress",
    prompt: "Do you avoid checking your balance during stressful periods?",
    options: [
      { value: "almost_always", label: "Almost always" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" },
    ],
  },

  // v2 additions (behaviour): more habit/trigger questions
  {
    key: "spendWhenBored",
    prompt: "When you're bored, how likely are you to spend?",
    options: [
      { value: "very_likely", label: "Very likely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" },
    ],
  },
  {
    key: "spendWhenStressed",
    prompt: "When you're stressed, how likely are you to overspend?",
    options: [
      { value: "very_likely", label: "Very likely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" },
    ],
  },
  {
    key: "plannedPurchasesOnly",
    prompt: "Do you buy mostly from a pre-planned list?",
    options: [
      { value: "never", label: "Never" },
      { value: "occasionally", label: "Occasionally" },
      { value: "often", label: "Often" },
      { value: "always", label: "Always" },
    ],
  },
  {
    key: "cashflowAwareness",
    prompt: "Do you consider next-month cash flow before spending?",
    options: [
      { value: "no", label: "No" },
      { value: "sometimes", label: "Sometimes" },
      { value: "usually", label: "Usually" },
      { value: "always", label: "Always" },
    ],
  },
  {
    key: "subscriptionControl",
    prompt: "Do you review subscriptions monthly?",
    options: [
      { value: "never", label: "Never" },
      { value: "occasionally", label: "Occasionally" },
      { value: "monthly", label: "Monthly" },
      { value: "weekly", label: "Weekly" },
    ],
  },
  {
    key: "impulseWaitRule",
    prompt: "Do you use a waiting rule (e.g., 24 hours) for non-essential purchases?",
    options: [
      { value: "never", label: "Never" },
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "always", label: "Always" },
    ],
  },
];

export const v2AwarenessQuestions = [
  {
    key: "comparesLifestyleFreq",
    prompt: "Do you compare your lifestyle with people around you?",
    options: [
      { value: "constantly", label: "Constantly" },
      { value: "occasionally", label: "Occasionally" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" },
    ],
  },
  {
    key: "hasFinancialPlan",
    prompt: "Would you say you have a financial plan?",
    options: [
      { value: "clear_plan", label: "Yes, clear plan" },
      { value: "some_plan", label: "Some plan" },
      { value: "no_plan", label: "No plan" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  {
    key: "tracksExpenses",
    prompt: "Do you track your monthly expenses?",
    options: [
      { value: "regularly", label: "Regularly" },
      { value: "sometimes", label: "Sometimes" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" },
    ],
  },
  {
    key: "knowsTotalDebt",
    prompt: "Do you know your total debt?",
    options: [
      { value: "fully", label: "Yes, fully" },
      { value: "partially", label: "Partially" },
      { value: "not_sure", label: "Not sure" },
      { value: "no", label: "No" },
    ],
  },
  {
    key: "knowsMonthlyExpenses",
    prompt: "Do you know your monthly expenses?",
    options: [
      { value: "exact", label: "Yes, exact" },
      { value: "approximate", label: "Approximate" },
      { value: "not_really", label: "Not really" },
      { value: "no", label: "No" },
    ],
  },

  // v2 additions (awareness): tracking clarity
  {
    key: "tracksSavingsRate",
    prompt: "Do you know your savings rate (roughly)?",
    options: [
      { value: "know_exact", label: "Yes, approximate" },
      { value: "know_some", label: "I have a rough idea" },
      { value: "not_sure", label: "Not sure" },
      { value: "no", label: "No" },
    ],
  },
  {
    key: "budgetCycle",
    prompt: "Do you revisit your budget each month?",
    options: [
      { value: "never", label: "Never" },
      { value: "once_every_2_months", label: "Every 2 months" },
      { value: "monthly", label: "Monthly" },
      { value: "weekly", label: "Weekly" },
    ],
  },
  {
    key: "knowsTop3Expenses",
    prompt: "Do you know your top 3 expense categories?",
    options: [
      { value: "no", label: "No" },
      { value: "some", label: "Somewhat" },
      { value: "yes", label: "Yes" },
      { value: "very_clear", label: "Very clear" },
    ],
  },
];

export const v2ProfileQuestions = [
  {
    key: "monthlyLiabilities",
    label: "Fixed commitments (₹/month)",
  },
  {
    key: "monthlyIncome",
    label: "Monthly income (₹)",
  },
];

export const v2StabilityQuestions = [
  {
    key: "incomeStability",
    prompt: "Income stability",
    options: [
      { value: "very_consistent", label: "Very consistent" },
      { value: "mostly_consistent", label: "Mostly consistent" },
      { value: "somewhat_variable", label: "Somewhat variable" },
      { value: "highly_variable", label: "Highly variable" },
    ],
  },
  {
    key: "dependentsBucket",
    prompt: "Dependents",
    options: [
      { value: "0_1", label: "0-1" },
      { value: "2_3", label: "2-3" },
      { value: "4_5", label: "4-5" },
      { value: "6_plus", label: "6+" },
    ],
  },
];

export const v2HabitsQuestions = [
  {
    key: "habitCheckInsPerWeek",
    prompt: "How many times per week do you do a quick money check-in?",
    options: [
      { value: "0", label: "0" },
      { value: "1", label: "1" },
      { value: "2_3", label: "2-3" },
      { value: "4_plus", label: "4+" },
    ],
  },
  {
    key: "debtPaymentDiscipline",
    prompt: "When you promise yourself a debt/payment, how reliably do you follow through?",
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
      { value: "always", label: "Always" },
    ],
  },
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
    impulseWaitRule: "sometimes",
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
    knowsTop3Expenses: "some",
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
    averageInterestRatePct: 10, // used only for estimate (simple)
  },
  habits: {
    habitCheckInsPerWeek: "1",
    debtPaymentDiscipline: "sometimes",
  },
};

