// src/lib/copy.ts
// UI copy and configuration constants

// ── Type Definitions ──

interface NavItem {
  label: string;
  href: string;
}

interface IntelligenceRow {
  icon: string;
  title: string;
  copy: string;
}

interface BusinessCard {
  title: string;
  copy: string;
}

interface HeroStat {
  label: string;
  value: string;
}

interface HeroAction {
  label: string;
  href: string;
}

interface AssessmentBanner {
  title: string;
  cta: string;
  description: string;
}

interface ForecastLabels {
  today: string;
  sixMonths: string;
  oneYear: string;
  twoYears: string;
  callToAction: string;
}

interface InsightTitles {
  narrativeTitle: string;
  narrativeSubtitle: string;
  score: string;
  awarenessGap: string;
  futureRisk: string;
  behaviorCorrelation: string;
  liveInsights: string;
  viewAllInsights: string;
}

interface AdminLabels {
  dashboard: string;
  username: string;
  password: string;
  signIn: string;
  logout: string;
}

interface FieldSpec {
  placeholder: string;
  label: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface AssessmentFields {
  name: FieldSpec;
  age: FieldSpec;
  email: FieldSpec;
}

interface AssessmentOptionsConfig {
  incomeStability: SelectOption[];
  dependents: SelectOption[];
}

interface AssessmentSection {
  id: string;
  label: string;
  icon: string;
  conditional?: boolean;
}

interface AssessmentButtons {
  finishReviewScore: string;
  continue: string;
  previous: string;
  next: string;
}

interface TriggerOrBelief {
  key: string;
  label: string;
  icon: string;
}

interface B2BTab {
  id: string;
  label: string;
}

interface B2BUseCase {
  icon: string;
  title: string;
  desc: string;
}

interface FormFieldSpec {
  placeholder: string;
  required: boolean;
}

interface B2BFormFields {
  companyName: FormFieldSpec;
  contactEmail: FormFieldSpec;
  useCase: FormFieldSpec;
  apiKey: FormFieldSpec;
  partnerId: FormFieldSpec;
  webhookUrl: FormFieldSpec;
  adminApiKey: FormFieldSpec;
}

interface ValidationField {
  value: string;
  label: string;
}

interface SMSForm {
  placeholder: string;
  successMessage: string;
}

interface Simulator {
  placeholder: string;
  noDataMessage: string;
}

interface InsightsPanel {
  allInsights: string;
}

interface CommonActions {
  viewAll: string;
  viewFullResponse: string;
  viewRawResponse: string;
  learnMore: string;
  readMore: string;
  seeMore: string;
  participantData: string;
  profileInputs: string;
  behaviourAnswers: string;
  awarenessAnswers: string;
  habitsAnswers: string;
  generateReport: string;
  reportHint: string;
  reportPreviewTitle: string;
}

// ── Navigation ──

export const NAV_ITEMS: NavItem[] = [
  { label: "Assess", href: "#assessment" },
  { label: "Big Reveal", href: "/big-reveal" },
  { label: "Home", href: "/dashboard" },
  { label: "Reality", href: "/reality" },
  { label: "Why", href: "/why" },
  { label: "Future", href: "/future" },
  { label: "Future You", href: "/future-you" },
  { label: "Action", href: "/action" },
  { label: "Coach", href: "#coach" },
  { label: "Partners", href: "#b2b" },
  { label: "Advanced Insights", href: "#advanced" }
];

// ── Human-Friendly Feature Labels ──
// Maps technical component names to user-facing terminology

export const FEATURE_LABELS = {
  // Core components
  digitalTwin: "Future You",
  predictionEngine: "What Happens Next",
  cognitionGraph: "How Your Mind Influences Money",
  decisionSimulator: "Try Different Futures",
  financialDNA: "Your Financial Personality",
  longitudinalLearning: "Your Learning Journey",
  behavioralAnalysis: "Pattern Recognition",
  riskAndOpportunityEngine: "What Could Change",
  
  // Advanced Intelligence sections
  understand: "Understand",
  predict: "Predict",
  simulate: "Simulate",
  learn: "Learn",
  analyze: "Analyze",
  
  // Advanced menu items
  advancedIntelligence: "Advanced Intelligence",
  developerIntelligence: "Developer Intelligence",
  digitalTwinAnalytics: "Financial Projections",
  predictionEngineAccess: "Future Scenarios",
  cognitionGraphExplorer: "Behavioral Patterns",
  decisionSimulatorAccess: "Outcome Simulator",
  longitudinalLearningTimeline: "Decision History",
  
  // Engines grouped by value
  understandSection: [
    { id: "cognition-graph", label: "How Your Mind Influences Money", icon: "Brain" },
    { id: "financial-dna", label: "Your Financial Personality", icon: "Dna" },
    { id: "behavioral-analysis", label: "Pattern Recognition", icon: "Activity" }
  ],
  predictSection: [
    { id: "prediction-engine", label: "What Happens Next", icon: "TrendingUp" },
    { id: "forecast", label: "Your 12-Month Outlook", icon: "Calendar" },
    { id: "what-happens-next", label: "Impact Analysis", icon: "AlertCircle" }
  ],
  simulateSection: [
    { id: "decision-simulator", label: "Try Different Futures", icon: "GitBranch" },
    { id: "scenario-forecast", label: "Scenario Comparison", icon: "Layers" },
    { id: "outcome-simulator", label: "Outcome Simulator", icon: "Zap" }
  ],
  learnSection: [
    { id: "longitudinal-learning", label: "Your Learning Journey", icon: "Book" },
    { id: "memory-timeline", label: "Past Decisions", icon: "History" },
    { id: "insights-timeline", label: "Your Progress", icon: "Award" }
  ],
  analyzeSection: [
    { id: "digital-twin", label: "Financial Projections", icon: "Users" },
    { id: "analytics-dashboard", label: "Analytics Dashboard", icon: "BarChart3" },
    { id: "developer-intelligence", label: "System Debug", icon: "Wrench" }
  ]
};

// ── Hero Section ──

export const ENGINE_SIGNALS: string[] = [
  "Decodes Spending Patterns",
  "Detects Emotional Triggers",
  "Uncovers Money Personality",
  "Generates Financial Health Actions",
];

export const INTELLIGENCE_ROWS: IntelligenceRow[] = [
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

export const BUSINESS_CARDS: BusinessCard[] = [
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

export const HERO_STATS: HeroStat[] = [
  { label: "Behavior Signals", value: "24+" },
  { label: "BAS Dimensions", value: "3" },
  { label: "Financial Reality Score", value: "1" },
];

export const HERO_ACTIONS: HeroAction[] = [
  {
    label: "Build My Score",
    href: "#assessment",
  },
  {
    label: "View Intelligence",
    href: "#intelligence",
  },
];

// ── Assessment ──

export const ASSESSMENT_BANNER: AssessmentBanner = {
  title: "💬 Enrich Your Assessment",
  cta: "Add Banking Data (SMS)",
  description: "Import banking alerts to refine your assessment",
};

export const FORECAST_LABELS: ForecastLabels = {
  today: "Today",
  sixMonths: "In 6 Months",
  oneYear: "In 1 Year",
  twoYears: "In 2 Years",
  callToAction: "This trajectory assumes no changes. Below are interventions to reverse the trend.",
};

export const INSIGHT_TITLES: InsightTitles = {
  narrativeTitle: "Insight Narrative",
  narrativeSubtitle: "A concise behavioral narrative from your assessment.",
  score: "Score",
  awarenessGap: "Awareness Gap",
  futureRisk: "Future risk",
  behaviorCorrelation: "Behavioral correlation",
  liveInsights: "Live Insights",
  viewAllInsights: "View all insights",
};

export const ADMIN_LABELS: AdminLabels = {
  dashboard: "Admin Dashboard",
  username: "Username",
  password: "Password",
  signIn: "Sign In",
  logout: "Logout",
};

export const ASSESSMENT_FIELDS: AssessmentFields = {
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

export const ASSESSMENT_OPTIONS: AssessmentOptionsConfig = {
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

export const ASSESSMENT_SECTIONS: AssessmentSection[] = [
  { id: "behaviour", label: "Psychology", icon: "Brain" },
  { id: "awareness", label: "Clarity", icon: "BarChart3" },
  { id: "stability", label: "Resilience", icon: "ShieldCheck" },
  { id: "habits", label: "Habits", icon: "Activity", conditional: true },
];

export const ASSESSMENT_BUTTONS: AssessmentButtons = {
  finishReviewScore: "Finish & Review Score",
  continue: "Continue",
  previous: "Previous",
  next: "Next",
};

// ── Behavioral Insights ──

export const EMOTIONAL_TRIGGERS: TriggerOrBelief[] = [
  { key: "stressSpending", label: "Stress-Triggered Spending", icon: "😰" },
  { key: "boredomSpending", label: "Boredom Impulse Buying", icon: "😐" },
  { key: "socialPressure", label: "Social Pressure Spending", icon: "👥" },
  { key: "anxietyAvoidance", label: "Anxiety-Avoidance Behavior", icon: "🛡️" },
  { key: "celebratorySpending", label: "Celebration Overspending", icon: "🎉" },
];

export const MONEY_BELIEFS: TriggerOrBelief[] = [
  { key: "scarcityVsAbundance", label: "Scarcity vs Abundance", icon: "🌊" },
  { key: "moneyAsIdentity", label: "Money as Identity", icon: "🎭" },
  { key: "moneyAsSecurity", label: "Money as Security", icon: "🔒" },
  { key: "moneyAsFreedom", label: "Money as Freedom", icon: "🦅" },
];

// ── B2B ──

export const B2B_TABS: B2BTab[] = [
  { id: "overview", label: "📊 Overview" },
  { id: "register", label: "📝 Register Partner" },
  { id: "query", label: "🔍 Query Intelligence" },
  { id: "validate", label: "✓ Validate Key" },
  { id: "billing", label: "💰 Billing & Plans" },
  { id: "webhooks", label: "🔔 Webhooks" },
  { id: "admin", label: "🔐 Admin Panel" },
  { id: "docs", label: "📖 SDK Docs" },
];

export const B2B_USE_CASES: B2BUseCase[] = [
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

export const B2B_FORM_FIELDS: B2BFormFields = {
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

// ── Forms & Utilities ──

export const VALIDATION_FIELDS: ValidationField[] = [
  { value: "survival_months", label: "Time to Financial Crisis" },
  { value: "recommended_action", label: "Next Action to Take" },
];

export const SMS_FORM: SMSForm = {
  placeholder: `Example:\nCITI: ₹5,000 spent at Amazon on 1-Jan 02:30 PM. Bal: ₹45,000\nICICI: Debit ₹15,000 to acc XXXX2891 on 1-Jan. Avl Bal: ₹30,000`,
  successMessage: "Review extracted data below",
};

export const SIMULATOR: Simulator = {
  placeholder: "45000",
  noDataMessage: "Start the assessment to see scenarios",
};

export const INSIGHTS_PANEL: InsightsPanel = {
  allInsights: "All Insights",
};

export const COMMON_ACTIONS: CommonActions = {
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
