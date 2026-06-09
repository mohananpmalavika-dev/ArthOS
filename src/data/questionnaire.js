export const behaviourQuestions = [
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
      { value: "extreme_discipline", label: "Extreme discipline" },
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
];

export const awarenessQuestions = [
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
];

export const incomeStabilityOptions = [
  { value: "very_consistent", label: "Very consistent" },
  { value: "mostly_consistent", label: "Mostly consistent" },
  { value: "somewhat_variable", label: "Somewhat variable" },
  { value: "highly_variable", label: "Highly variable" },
];

export const dependentsOptions = [
  { value: "0_1", label: "0-1" },
  { value: "2_3", label: "2-3" },
  { value: "4_5", label: "4-5" },
  { value: "6_plus", label: "6+" },
];

export const defaultAssessment = {
  behaviour: {
    emotionalMoneyLevel: "somewhat_emotional",
    socialInfluenceLevel: "sometimes",
    unplannedPurchaseFreq: "sometimes",
    regretImpulseFreq: "sometimes",
    presentFutureMindset: "balance_both",
    avoidBalanceDuringStress: "sometimes",
  },
  awareness: {
    comparesLifestyleFreq: "occasionally",
    hasFinancialPlan: "some_plan",
    tracksExpenses: "sometimes",
    knowsTotalDebt: "partially",
    knowsMonthlyExpenses: "approximate",
  },
  profile: {
    monthlyExpenses: 50000,
    emergencySavings: 90000,
    totalDebt: 160000,
    monthlyIncome: 90000,
    incomeStability: "mostly_consistent",
    dependentsBucket: "0_1",
    monthlyLiabilities: 18000,
  },
};
