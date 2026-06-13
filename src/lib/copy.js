export const NAV_ITEMS = [
  { label: "Home", href: "#home" },
  { label: "Assess", href: "#assessment" },
  { label: "Reports", href: "#reports" },
  { label: "Cognition", href: "#cognition" },
  { label: "Simulator", href: "#simulator" },
  { label: "Decisions", href: "#decisions" },
  { label: "Memory", href: "#memory" },
  { label: "Predictions", href: "#predictions" },
  { label: "Partners", href: "#b2b" },
];

export const ENGINE_SIGNALS = [
  "Decodes Spending Patterns",
  "Detects Emotional Triggers",
  "Uncovers Money Personality",
  "Generates Financial Health Actions",
];

export const INTELLIGENCE_ROWS = [
  {
    icon: "Network",
    title: "AI Financial Intelligence",
    copy: "Connects financial signals with behavioral psychology.",
  },
  {
    icon: "Zap",
    title: "Behavior Pattern Detection",
    copy: "Reads impulse, avoidance and planning patterns in one score.",
  },
  {
    icon: "Brain",
    title: "Psychology Driven Analysis",
    copy: "Turns choices into a practical financial behavior profile.",
  },
];

export const BUSINESS_CARDS = [
  {
    title: "Behavior Layer AI",
    copy: "Traditional fintech tracks transactions. ARTH.OS analyzes emotional spending patterns and financial personality behavior.",
  },
  {
    title: "Privacy First Architecture",
    copy: "Assessment data stays in the browser until you choose to save or export it.",
  },
  {
    title: "Scalable Intelligence Engine",
    copy: "Built to evolve into behavioral finance infrastructure for future trust and credit systems.",
  },
];

export const HERO_STATS = [
  { label: "Behavior Signals", value: "24+" },
  { label: "BAS Dimensions", value: "3" },
  { label: "Financial Reality Score", value: "1" },
];

export const HERO_ACTIONS = [
  {
    label: "Build My Score",
    href: "#assessment",
  },
  {
    label: "View Intelligence",
    href: "#intelligence",
  },
];

export const ASSESSMENT_BANNER = {
  title: "💬 Enrich Your Assessment",
  cta: "Add Banking Data (SMS)",
  description: "Import banking alerts to refine your assessment",
};

export const FORECAST_LABELS = {
  today: "Today",
  sixMonths: "In 6 Months",
  oneYear: "In 1 Year",
  twoYears: "In 2 Years",
  callToAction: "This trajectory assumes no changes. Below are interventions to reverse the trend.",
};

export const INSIGHT_TITLES = {
  narrativeTitle: "Insight Narrative",
  narrativeSubtitle: "A concise behavioral narrative from your assessment.",
  score: "Score",
  awarenessGap: "Awareness Gap",
  futureRisk: "Future risk",
  behaviorCorrelation: "Behavioral correlation",
  liveInsights: "Live Insights",
  viewAllInsights: "View all insights",
};

export const ADMIN_LABELS = {
  dashboard: "Admin Dashboard",
  username: "Username",
  password: "Password",
  signIn: "Sign In",
  logout: "Logout",
};

export const ASSESSMENT_FIELDS = {
  name: {
    placeholder: "Your name",
    label: "Name",
  },
  age: {
    placeholder: "Age",
    label: "Age",
  },
  email: {
    placeholder: "you@domain.com",
    label: "Email",
  },
};

export const ASSESSMENT_OPTIONS = {
  incomeStability: [
    { value: "very_consistent", label: "Very consistent" },
    { value: "mostly_consistent", label: "Mostly consistent" },
    { value: "somewhat_variable", label: "Somewhat variable" },
    { value: "highly_variable", label: "Highly variable" },
  ],
  dependents: [
    { value: "0_1", label: "0-1" },
    { value: "2_3", label: "2-3" },
    { value: "4_5", label: "4-5" },
    { value: "6_plus", label: "6+" },
  ],
};

export const ASSESSMENT_SECTIONS = [
  { id: "behaviour", label: "Psychology", icon: "Brain" },
  { id: "awareness", label: "Clarity", icon: "BarChart3" },
  { id: "stability", label: "Resilience", icon: "ShieldCheck" },
  { id: "habits", label: "Habits", icon: "Activity", conditional: true },
];

export const ASSESSMENT_BUTTONS = {
  finishReviewScore: "Finish & Review Score",
  continue: "Continue",
  previous: "Previous",
  next: "Next",
};

export const EMOTIONAL_TRIGGERS = [
  { key: "stressSpending", label: "Stress-Triggered Spending", icon: "😰" },
  { key: "boredomSpending", label: "Boredom Impulse Buying", icon: "😐" },
  { key: "socialPressure", label: "Social Pressure Spending", icon: "👥" },
  { key: "anxietyAvoidance", label: "Anxiety-Avoidance Behavior", icon: "🛡️" },
  { key: "celebratorySpending", label: "Celebration Overspending", icon: "🎉" },
];

export const MONEY_BELIEFS = [
  { key: "scarcityVsAbundance", label: "Scarcity vs Abundance", icon: "🌊" },
  { key: "moneyAsIdentity", label: "Money as Identity", icon: "🎭" },
  { key: "moneyAsSecurity", label: "Money as Security", icon: "🔒" },
  { key: "moneyAsFreedom", label: "Money as Freedom", icon: "🦅" },
];

export const B2B_TABS = [
  { id: "overview", label: "📊 Overview" },
  { id: "register", label: "📝 Register Partner" },
  { id: "query", label: "🔍 Query Intelligence" },
  { id: "validate", label: "✓ Validate Key" },
  { id: "billing", label: "💰 Billing & Plans" },
  { id: "webhooks", label: "🔔 Webhooks" },
  { id: "admin", label: "🔐 Admin Panel" },
  { id: "docs", label: "📖 SDK Docs" },
];

export const B2B_USE_CASES = [
  {
    icon: "🏦",
    title: "Banking & Lending",
    desc: "Embed health scores into loan underwriting, detect borrower risk signals before default.",
  },
  {
    icon: "💳",
    title: "Personal Finance Apps",
    desc: "Give users deep behavioral insights instead of just transaction tracking.",
  },
  {
    icon: "🏥",
    title: "Insurance",
    desc: "Assess risk perception, calibrate premiums based on behavioral financial health.",
  },
  {
    icon: "🏢",
    title: "Employer Benefits",
    desc: "Offer financial wellness as a workplace benefit with personalized intelligence.",
  },
];

export const B2B_FORM_FIELDS = {
  companyName: {
    placeholder: "Company name *",
    required: true,
  },
  contactEmail: {
    placeholder: "Contact email *",
    required: true,
  },
  useCase: {
    placeholder: "Use case (e.g., 'Embed score into loan app')",
    required: false,
  },
  apiKey: {
    placeholder: "Paste your API key (arth_...)",
    required: true,
  },
  partnerId: {
    placeholder: "Partner ID",
    required: true,
  },
  webhookUrl: {
    placeholder: "https://your-api.com/webhooks/arthos",
    required: true,
  },
  adminApiKey: {
    placeholder: "Admin API key",
    required: true,
  },
};

export const VALIDATION_FIELDS = [
  { value: "survival_months", label: "Time to Financial Crisis" },
  { value: "recommended_action", label: "Next Action to Take" },
];

export const SMS_FORM = {
  placeholder: `Example:\nCITI: ₹5,000 spent at Amazon on 1-Jan 02:30 PM. Bal: ₹45,000\nICICI: Debit ₹15,000 to acc XXXX2891 on 1-Jan. Avl Bal: ₹30,000`,
  successMessage: "Review extracted data below",
};

export const SIMULATOR = {
  placeholder: "45000",
  noDataMessage: "Start the assessment to see scenarios",
};

export const INSIGHTS_PANEL = {
  allInsights: "All Insights",
};

export const COMMON_ACTIONS = {
  viewAll: "View all",
  viewFullResponse: "View full validation response",
  viewRawResponse: "View raw intelligence response",
  learnMore: "Learn more",
  readMore: "Read more",
  seeMore: "See more",
  participantData: "Participant data",
  profileInputs: "Profile inputs",
  behaviourAnswers: "Behaviour answers",
  awarenessAnswers: "Awareness answers",
  habitsAnswers: "Habits answers",
  generateReport: "Generate report",
  reportHint: "This produces the same report payload visible for review.",
  reportPreviewTitle: "Generated report preview",
};
