export const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Assess", href: "/assessment" },
  { label: "Reports", href: "/reports" },
  { label: "Money Mindset", href: "/reality" },
  { label: "Money Scenarios", href: "/future" },
  { label: "Money Decisions", href: "/decision" },
  { label: "What I've Learned", href: "/learning" },
  { label: "Your Future", href: "/forecast" },
  { label: "Connect", href: "/dashboard/settings" }
];

export const ENGINE_SIGNALS = [
  "Understands Your Spending",
  "Spots Money Triggers",
  "Finds Your Money Style",
  "Suggests Money Moves"
];

export const INTELLIGENCE_ROWS = [
  {
    icon: "Network",
    title: "Smart Money Insights",
    copy: "Connects your money habits with how you think about money."
  },
  {
    icon: "Zap",
    title: "Spending Pattern Detection",
    copy: "Spots your habits - quick decisions, avoiding hard choices, and planning patterns."
  },
  {
    icon: "Brain",
    title: "How You Think About Money",
    copy: "Turns what you do with money into your unique money profile."
  }
];

export const BUSINESS_CARDS = [
  {
    title: "Learns How You Handle Money",
    copy: "Most apps just show you transactions. We learn your real money habits and patterns - how you spend when stressed, what makes you hesitate, and how you plan."
  },
  {
    title: "Your Privacy Matters",
    copy: "Your information stays on your device until you decide to save or share it. No tracking, no sharing."
  },
  {
    title: "Grows With You",
    copy: "Built to become smarter about money for banks, lenders, and apps - helping create fairer systems that understand real people."
  }
];

export const HERO_STATS = [
  { label: "Money Habits Tracked", value: "24+" },
  { label: "Your Money Profile Areas", value: "3" },
  { label: "Money Health Score", value: "1" }
];

export const HERO_ACTIONS = [
  {
    label: "Start My Assessment",
    href: "/assessment"
  },
  {
    label: "See My Results",
    href: "/reports"
  }
];

export const ASSESSMENT_BANNER = {
  title: "💬 Enrich Your Assessment",
  cta: "Add Banking Data (SMS)",
  description: "Import banking alerts to refine your assessment"
};

export const FORECAST_LABELS = {
  today: "Today",
  sixMonths: "In 6 Months",
  oneYear: "In 1 Year",
  twoYears: "In 2 Years",
  callToAction: "This trajectory assumes no changes. Below are interventions to reverse the trend."
};

export const INSIGHT_TITLES = {
  narrativeTitle: "Your Money Story",
  narrativeSubtitle: "What your answers tell us about how you handle money.",
  score: "Score",
  awarenessGap: "Reality Check",
  futureRisk: "What could happen",
  behaviorCorrelation: "What this means",
  liveInsights: "Insights",
  viewAllInsights: "See all insights"
};

export const ADMIN_LABELS = {
  dashboard: "Admin Dashboard",
  username: "Username",
  password: "Password",
  signIn: "Sign In",
  logout: "Logout"
};

export const ASSESSMENT_FIELDS = {
  name: {
    placeholder: "Your name",
    label: "Name"
  },
  age: {
    placeholder: "Age",
    label: "Age"
  },
  email: {
    placeholder: "you@domain.com",
    label: "Email"
  }
};

export const ASSESSMENT_OPTIONS = {
  incomeStability: [
    { value: "very_consistent", label: "Very consistent" },
    { value: "mostly_consistent", label: "Mostly consistent" },
    { value: "somewhat_variable", label: "Somewhat variable" },
    { value: "highly_variable", label: "Highly variable" }
  ],
  dependents: [
    { value: "0_1", label: "0-1" },
    { value: "2_3", label: "2-3" },
    { value: "4_5", label: "4-5" },
    { value: "6_plus", label: "6+" }
  ]
};

export const ASSESSMENT_SECTIONS = [
  { id: "behaviour", label: "How You Think", icon: "Brain" },
  { id: "awareness", label: "What You Know", icon: "BarChart3" },
  { id: "stability", label: "Are You Prepared", icon: "ShieldCheck" },
  { id: "habits", label: "What You Do", icon: "Activity", conditional: true }
];

export const ASSESSMENT_BUTTONS = {
  finishReviewScore: "Done & See Results",
  continue: "Continue",
  previous: "Previous",
  next: "Next"
};

export const MONEY_MOMENTS = [
  { key: "stressSpending", label: "I Spend When Stressed", icon: "😰" },
  { key: "boredomSpending", label: "Bored Shopping", icon: "😐" },
  { key: "socialPressure", label: "Peer Pressure Spending", icon: "👥" },
  { key: "anxietyAvoidance", label: "Avoiding the Hard Stuff", icon: "🛡️" },
  { key: "celebratorySpending", label: "Celebration Splurges", icon: "🎉" }
];

// Keeping old name for backwards compatibility
export const EMOTIONAL_TRIGGERS = MONEY_MOMENTS;

export const MONEY_BELIEFS = [
  { key: "scarcityVsAbundance", label: "Do I Have Enough?", icon: "🌊" },
  { key: "moneyAsIdentity", label: "Money Means I'm...", icon: "🎭" },
  { key: "moneyAsSecurity", label: "Money Keeps Me Safe", icon: "🔒" },
  { key: "moneyAsFreedom", label: "Money = Freedom", icon: "🦅" }
];

export const B2B_TABS = [
  { id: "overview", label: "📊 Overview" },
  { id: "register", label: "📝 Register Partner" },
  { id: "query", label: "🔍 Query Intelligence" },
  { id: "validate", label: "✓ Validate Key" },
  { id: "billing", label: "💰 Billing & Plans" },
  { id: "webhooks", label: "🔔 Webhooks" },
  { id: "admin", label: "🔐 Admin Panel" },
  { id: "docs", label: "📖 SDK Docs" }
];

export const B2B_USE_CASES = [
  {
    icon: "🏦",
    title: "Banking & Lending",
    desc: "Embed health scores into loan underwriting, detect borrower risk signals before default."
  },
  {
    icon: "💳",
    title: "Personal Finance Apps",
    desc: "Give users deep behavioral insights instead of just transaction tracking."
  },
  {
    icon: "🏥",
    title: "Insurance",
    desc: "Assess risk perception, calibrate premiums based on behavioral financial health."
  },
  {
    icon: "🏢",
    title: "Employer Benefits",
    desc: "Offer financial wellness as a workplace benefit with personalized intelligence."
  }
];

export const B2B_FORM_FIELDS = {
  companyName: {
    placeholder: "Company name *",
    required: true
  },
  contactEmail: {
    placeholder: "Contact email *",
    required: true
  },
  useCase: {
    placeholder: "Use case (e.g., 'Embed score into loan app')",
    required: false
  },
  apiKey: {
    placeholder: "Paste your API key (arth_...)",
    required: true
  },
  partnerId: {
    placeholder: "Partner ID",
    required: true
  },
  webhookUrl: {
    placeholder: "https://your-api.com/webhooks/arthos",
    required: true
  },
  adminApiKey: {
    placeholder: "Admin API key",
    required: true
  }
};

export const VALIDATION_FIELDS = [
  { value: "survival_months", label: "How Long Until Money Runs Out" },
  { value: "recommended_action", label: "What to Do Next" }
];

export const SMS_FORM = {
  placeholder: `Example:\nCITI: ₹5,000 spent at Amazon on 1-Jan 02:30 PM. Bal: ₹45,000\nICICI: Debit ₹15,000 to acc XXXX2891 on 1-Jan. Avl Bal: ₹30,000`,
  successMessage: "Review extracted data below"
};

export const SIMULATOR = {
  placeholder: "45000",
  noDataMessage: "Start the assessment to see scenarios"
};

export const INSIGHTS_PANEL = {
  allInsights: "All Insights"
};

export const COMMON_ACTIONS = {
  viewAll: "See all",
  viewFullResponse: "See full response",
  viewRawResponse: "See full details",
  learnMore: "Learn more",
  readMore: "Read more",
  seeMore: "See more",
  participantData: "Your info",
  profileInputs: "What you told us",
  behaviourAnswers: "How you spend",
  awarenessAnswers: "What you know",
  habitsAnswers: "What you do",
  generateReport: "Create report",
  reportHint: "This shows the same report you can review.",
  reportPreviewTitle: "Your report"
};
