import React, { memo, useEffect, useMemo, useState, lazy, Suspense, useCallback, startTransition } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  ChevronDown,
  CircleUserRound,
  Cpu,
  Download,
  LockKeyhole,
  LogIn,
  LogOut,
  MessageSquare,
  Network,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  ThumbsUp,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import {
  calculateFinancialHealthV2,
  componentMaximumsV2,
  formatCurrency as formatCurrencyV2,
  formatMonths as formatMonthsV2,
  initOfflineApiQueue,
} from "./lib/scoring-v2.js";
import {
  appendScoreHistory,
  appendAssessmentHistory,
  loadScoreHistory,
  loadWeeklyCheckins,
  getProgressSummary,
  calculateConsecutiveStreak,
} from "./engines/financialMemoryEngine.js";
import { buildTrajectoryNarrative } from "./engines/trajectoryNarrativeEngine.js";
import { buildFinancialTwinScenarios } from "./engines/financialTwinEngine.js";
import { buildCompleteTwin } from "./engines/digitalTwinEngine.js";
import { buildCognitionProfile } from "./engines/cognitionEngine.js";
import { evaluateHabitProgress } from "./engines/habitEngine.js";
import { forecastHealth, detectFutureRisk } from "./engines/forecastEngine.js";
import { predictionEngineForecastHealth } from "./engines/predictionEngine.js";
import { calculateConfidence } from "./engines/confidenceEngine.js";
import { generateAlerts } from "./engines/riskOpportunityEngine.js";
import { detectBiases as detectCognitiveBiases, calculateRiskCalibration } from "./engines/biasEngine.js";
import { trackGoalEvolution } from "./engines/goalEvolutionEngine.js";
import { generateMemoryInsight } from "./engines/contextualMemoryEngine.js";
import { opportunityForecast } from "./engines/opportunityForecastEngine.js";
import { FinancialCognitionGraph } from "./engines/cognitionGraph.js";
import { deriveMoneyBeliefs } from "./engines/moneyBeliefEngine.js";
import { UnifiedMemoryEngine } from "./engines/unifiedMemoryEngine.js";
import { createDefaultProviderMarketplace } from "./lib/providerMarketplace.js";
import { detectTriggers, identifyTriggerPatterns } from "./engines/emotionalTriggerEngine.js";
import { compareAlternatives } from "./engines/counterfactualEngine.js";
import { FinancialMindProfile } from "./lib/FinancialMindProfile.js";
import { mapSignalsToBehaviour } from "./engines/smsParser.js";

import { checkAndUnlockMilestones } from "./engines/milestoneEngine.js";
import { archiveOrphanedSession } from "./engines/assessmentTelemetry.js";
import { getUnreadCount, addNotification, notifyNewMilestones, checkCheckinReminder, detectAndNotifyScoreChange } from "./engines/notificationEngine.js";
import { initializeUserRetention, recordUserReturn, recordAssessmentCompletion } from "./engines/retentionEngine.js";
import BadgeDisplay from "./components/BadgeDisplay.jsx";
import NotificationPanel from "./components/NotificationPanel.jsx";
import NotificationToast from "./components/NotificationToast.jsx";
import FlowNavigation from "./components/FlowNavigation.jsx";
import PeerComparisonCard from "./components/PeerComparisonCard.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import RetentionDashboard from "./components/RetentionDashboard.jsx";
import CompletionDashboard from "./components/CompletionDashboard.jsx";
import SubscriptionManagement from "./components/SubscriptionManagement.jsx";
import FeaturePaywall from "./components/FeaturePaywall.jsx";
import AssessmentLimitNotice from "./components/AssessmentLimitNotice.jsx";
import { useSubscription } from "./hooks/useSubscription.js";
import { recordAssessment, getRemainingAssessments, getLastAssessmentDate } from "./lib/assessmentUsageTracker.js";
// Lazy-loaded feature components to reduce main bundle
const AnalyticsDashboard = lazy(() => import("./components/AnalyticsDashboard.jsx"));
const CognitionGraphView = lazy(() => import("./components/CognitionGraphView.jsx"));
const PartnerSdkDemo = lazy(() => import("./components/PartnerSdkDemo.jsx"));
const B2BPartnerPortal = lazy(() => import("./components/B2BPartnerPortal.jsx"));
const FinancialTwin = lazy(() => import("./components/FinancialTwin.jsx"));
const UserHistory = lazy(() => import("./components/UserHistory.jsx"));
const TraitMatrixVisualizer = lazy(() => import("./components/TraitMatrixVisualizer.jsx"));
const DigitalTwinDashboard = lazy(() => import("./components/DigitalTwinDashboard.jsx"));
const PredictionEngineDashboard = lazy(() => import("./components/PredictionEngineDashboard.jsx"));
// Always-needed components (in main bundle)
import OnboardingOverlay from "./components/OnboardingOverlay.jsx";
import AssessmentSection from "./components/AssessmentSection.jsx";
import SingleRecommendedAction from "./components/SingleRecommendedAction.jsx";
import BehaviourDrivers from "./components/BehaviourDrivers.jsx";
import SurvivalHero from "./components/SurvivalHero.jsx";
import CognitionGapCard from "./components/CognitionGapCard.jsx";
import { SMSIngestForm } from "./components/SMSIngestForm.jsx";
import FinancialMindProfileCard from "./components/FinancialMindProfileCard.jsx";
import EmotionalTriggersCard from "./components/EmotionalTriggersCard.jsx";
import MoneyBeliefsCard from "./components/MoneyBeliefsCard.jsx";
import { SalaryRoastGenerator } from "./components/SalaryRoastGenerator.jsx";
import { ScenarioForecast } from "./components/ScenarioForecast.jsx";
import { ForecastModelCard } from "./components/ForecastModelCard.jsx";
import { EnhancedInsightNarrative } from "./components/EnhancedInsightNarrative.jsx";
import SingleMostImportantInsight from "./components/SingleMostImportantInsight.jsx";
import ActionFollowUpPanel from "./components/ActionFollowUpPanel.jsx";
import DecisionSimulator from "./components/DecisionSimulator.jsx";
import { ConsequenceForecastCard } from "./components/ConsequenceForecastCard.jsx";
import { InterventionsPrescriptionCard } from "./components/InterventionsPrescriptionCard.jsx";
import { StrategicMetricsCard } from "./components/StrategicMetricsCard.jsx";
import DailyCheckinForm from "./components/DailyCheckinForm.jsx";
import ReminderPreferences from "./components/ReminderPreferences.jsx";
import DecisionHistory from "./components/DecisionHistory.jsx";
import RecordDecision from "./components/RecordDecision.jsx";
import { AreaChart, Area, XAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import "./premium-report.css";
import "./styles/retention-dashboard.css";


import {
  v2BehaviourQuestions,
  v2AwarenessQuestions,
  v2HabitsQuestions,
  v2DefaultAssessment,
} from "./data/questionnaire-v2.js";
import {
  NAV_ITEMS,
  HERO_STATS,
  HERO_ACTIONS,
  ASSESSMENT_BANNER,
  INSIGHT_TITLES,
  ADMIN_LABELS,
  INTELLIGENCE_ROWS,
  BUSINESS_CARDS,
} from "./lib/copy.js";


const STORAGE_KEY = "arth-os-assessment";

// Suspense loading fallback for lazy-loaded components
const LazyComponentFallback = () => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    fontSize: "14px",
    color: "#666",
  }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ marginBottom: "12px" }}>Loading component...</div>
      <div style={{ fontSize: "12px", color: "#999" }}>Please wait</div>
    </div>
  </div>
);

function makeEmptyAssessment() {
  const emptyBehaviour = Object.keys(v2DefaultAssessment.behaviour || {}).reduce((acc, k) => {
    acc[k] = "";
    return acc;
  }, {});

  const emptyAwareness = Object.keys(v2DefaultAssessment.awareness || {}).reduce((acc, k) => {
    acc[k] = "";
    return acc;
  }, {});

  const emptyHabits = Object.keys(v2DefaultAssessment.habits || {}).reduce((acc, k) => {
    acc[k] = "";
    return acc;
  }, {});

  const emptyProfile = Object.keys(v2DefaultAssessment.profile || {}).reduce((acc, k) => {
    acc[k] = undefined;
    return acc;
  }, {});

  return {
    mode: "v2",
    behaviour: emptyBehaviour,
    awareness: emptyAwareness,
    profile: emptyProfile,
    participant: {
      name: "",
      age: "",
      email: "",
    },
    habits: emptyHabits,
  };
}

const ASSESSMENT_SAVE_QUEUE_KEY = "arth-os-assessment-save-queue";

function isBrowser() {
  return typeof window !== "undefined";
}

function isLocalDevHost() {
  if (!isBrowser()) return false;
  const host = window.location.hostname || "";
  return host === "localhost" || host.startsWith("127.");
}

function loadQueuedAssessmentSaves() {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(ASSESSMENT_SAVE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistQueuedAssessmentSaves(queue) {
  if (!isBrowser()) return;

  try {
    if (queue.length) {
      window.localStorage.setItem(ASSESSMENT_SAVE_QUEUE_KEY, JSON.stringify(queue));
    } else {
      window.localStorage.removeItem(ASSESSMENT_SAVE_QUEUE_KEY);
    }
  } catch {
    // ignore storage failures
  }
}

function enqueueAssessmentSave(payload) {
  if (!isBrowser()) return;
  const queue = loadQueuedAssessmentSaves();
  queue.push({ payload, queuedAt: new Date().toISOString() });
  persistQueuedAssessmentSaves(queue);
}

async function flushQueuedAssessmentSaves() {
  if (!isBrowser()) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const queue = loadQueuedAssessmentSaves();
  if (!queue.length) return;

  const remaining = [];
  for (const queued of queue) {
    try {
      const response = await fetch("/api/saveAssessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queued.payload),
      });
      if (!response.ok) {
        remaining.push(queued);
      }
    } catch {
      remaining.push(queued);
    }
  }

  persistQueuedAssessmentSaves(remaining);
}

const ICON_REGISTRY = { Network, Cpu, Brain };
const intelligenceRows = INTELLIGENCE_ROWS.map((row) => ({
  ...row,
  icon: ICON_REGISTRY[row.icon] ?? Network,
}));
const businessCards = BUSINESS_CARDS;

function buildLiveInsightCards(result, assessment) {
  const lowestComponent = result.componentRows?.[0];
  const stressPattern = assessment.behaviour?.spendWhenStressed;
  const impulsePattern = assessment.behaviour?.regretImpulseFreq;
  const planState = assessment.awareness?.hasFinancialPlan;
  const focusLabel = lowestComponent?.label ?? "Behaviour";

  return [
    {
      icon: Brain,
      title: "Behavior Pattern",
      copy: `${result.personalityType ?? "Current"} profile detected from your active responses.`,
      time: "Live now",
      tone: "purple",
    },
    {
      icon: BarChart3,
      title: "Spending Signal",
      copy: stressPattern
        ? `Stress-spend response is currently marked ${stressPattern.replaceAll("_", " ")}.`
        : "Answer emotion prompts to reveal stress-spend patterns.",
      time: "Live now",
      tone: "cyan",
    },
    {
      icon: ShieldCheck,
      title: "Risk Exposure",
      copy: `${result.futureRiskLabel ?? "Risk"} based on your current stability inputs.`,
      time: "Live now",
      tone: "purple",
    },
    {
      icon: Target,
      title: "Focus Opportunity",
      copy: `${focusLabel} is the next area to strengthen as your answers update.`,
      time: planState || impulsePattern ? "Live now" : "Needs input",
      tone: "cyan",
    },
  ];
}

const sectionIcons = {
  behaviour: Brain,
  awareness: BarChart3,
  stability: ShieldCheck,
};

const incomeStabilityOptions = [
  { value: "very_consistent", label: "Very consistent" },
  { value: "mostly_consistent", label: "Mostly consistent" },
  { value: "somewhat_variable", label: "Somewhat variable" },
  { value: "highly_variable", label: "Highly variable" },
];

const dependentsOptions = [
  { value: "0_1", label: "0-1" },
  { value: "2_3", label: "2-3" },
  { value: "4_5", label: "4-5" },
  { value: "6_plus", label: "6+" },
];


function normalizeV2Assessment(assessment) {
  const profile = assessment?.profile ?? {};
  if (
    profile.emergencySavingsFixed !== undefined ||
    profile.emergencySavingsDiscretionary !== undefined
  ) {
    return {
      ...assessment,
      participant: {
        ...v2DefaultAssessment.participant,
        ...assessment?.participant,
      },
      profile: {
        ...v2DefaultAssessment.profile,
        ...profile,
      },
    };
  }

  const emergencySavings = Number.parseFloat(profile.emergencySavings) || 0;
  const fixed = Math.min(emergencySavings, 50000);
  const discretionary = Math.max(0, emergencySavings - fixed);

  return {
    ...assessment,
    participant: {
      ...v2DefaultAssessment.participant,
      ...assessment?.participant,
    },
    profile: {
      ...v2DefaultAssessment.profile,
      ...profile,
      emergencySavingsFixed: fixed,
      emergencySavingsDiscretionary: discretionary,
    },
  };
}

function normalizeV1Assessment(assessment) {
  const profile = assessment?.profile ?? {};
  const legacySavings = Number.parseFloat(profile.emergencySavings) || 0;
  const fixed = Number.parseFloat(profile.emergencySavingsFixed) || 0;
  const discretionary = Number.parseFloat(profile.emergencySavingsDiscretionary) || 0;

  return {
    ...v2DefaultAssessment,
    ...assessment,
    participant: {
      ...v2DefaultAssessment.participant,
      ...assessment?.participant,
    },
    behaviour: {
      ...v2DefaultAssessment.behaviour,
      ...assessment?.behaviour,
    },
    awareness: {
      ...v2DefaultAssessment.awareness,
      ...assessment?.awareness,
    },
    profile: {
      ...v2DefaultAssessment.profile,
      ...profile,
      emergencySavings: legacySavings || fixed + discretionary,
    },
  };
}

function loadInitialAssessment() {
  try {
    const unified = window.localStorage.getItem(STORAGE_KEY);
    if (unified) return normalizeV2Assessment(JSON.parse(unified));

    const legacyV2 = window.localStorage.getItem("arth-os-assessment-v2");
    if (legacyV2) return normalizeV2Assessment(JSON.parse(legacyV2));

    const legacyV1 = window.localStorage.getItem("arth-os-assessment-v1");
    if (legacyV1) return normalizeV2Assessment(normalizeV1Assessment(JSON.parse(legacyV1)));

    return typeof v2DefaultAssessment !== "undefined" ? v2DefaultAssessment : {};
  } catch (error) {
    console.warn("Could not load initial assessment from localStorage:", error);
    return typeof v2DefaultAssessment !== "undefined" ? v2DefaultAssessment : {};
  }
}

export default function App() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [assessment, setAssessment] = useState(() => makeEmptyAssessment());
  const [saveState, setSaveState] = useState("Ready");
  const [queuedSaveCount, setQueuedSaveCount] = useState(() => (isBrowser() ? loadQueuedAssessmentSaves().length : 0));
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [resetTrigger, setResetTrigger] = useState(0);
  const [pendingFollowUps, setPendingFollowUps] = useState([]);
  const [activeHash, setActiveHash] = useState(
    isBrowser() ? window.location.hash || "#home" : "#home"
  );
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (!isBrowser()) return false;
    return window.localStorage.getItem("arth-os-onboarding-complete") !== "true";
  });

  const currentUserId = isAuthenticated && user ? user.id : null;
  const effectiveUserId = currentUserId || assessment.participant?.email || 'demo';

  const saveStatusLabel = queuedSaveCount > 0
    ? isOnline
      ? `Upload pending (${queuedSaveCount})`
      : `Saved offline (${queuedSaveCount})`
    : saveState === "Unsaved"
      ? "Unsaved changes"
      : saveState;

  const saveStatusClass = queuedSaveCount > 0
    ? isOnline
      ? "upload-pending"
      : "saved-offline"
    : saveState.toLowerCase().replace(/\s+/g, "-");

  const refreshQueuedSaveCount = () => {
    if (!isBrowser()) return;
    setQueuedSaveCount(loadQueuedAssessmentSaves().length);
  };

  const enqueueAssessmentSaveAndRefresh = (payload) => {
    enqueueAssessmentSave(payload);
    refreshQueuedSaveCount();
  };

  const flushQueuedAssessmentSavesAndRefresh = async () => {
    await flushQueuedAssessmentSaves();
    refreshQueuedSaveCount();
  };
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: "", password: "" });
  const [adminLoginError, setAdminLoginError] = useState("");
  const [adminReport, setAdminReport] = useState(null);
  const [smsEnrichment, setSmsEnrichment] = useState(null);
  const [showSmsForm, setShowSmsForm] = useState(false);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [twinScenarios, setTwinScenarios] = useState(null);
  const [digitalTwin, setDigitalTwin] = useState(null);
  const [weeklyCheckins, setWeeklyCheckins] = useState([]);
  const [historyTimespan, setHistoryTimespan] = useState("all");
  const [decisionsRefresh, setDecisionsRefresh] = useState(0);
  const [memoryTimeline, setMemoryTimeline] = useState([]);
  const [showFullMemoryTimeline, setShowFullMemoryTimeline] = useState(false);
  const memoryEngine = useMemo(() => new UnifiedMemoryEngine(), []);
  const [marketplaceRecommendations, setMarketplaceRecommendations] = useState([]);
  const [backendMarketplaceRecommendations, setBackendMarketplaceRecommendations] = useState([]);
  const [backendRiskAlerts, setBackendRiskAlerts] = useState([]);
  const [decisionHistoryCount, setDecisionHistoryCount] = useState(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [notificationBadgeCount, setNotificationBadgeCount] = useState(0);
  const [newlyUnlockedMilestones, setNewlyUnlockedMilestones] = useState([]);

  // Subscription & Paywall Management
  const { tier, subscription, loading: subscriptionLoading, error: subscriptionError, checkFeature, checkAssessmentAvailable, upgradeSubscription } = useSubscription(currentUserId);
  const [paywallFeature, setPaywallFeature] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [remainingAssessments, setRemainingAssessments] = useState(getRemainingAssessments('free'));
  const [nextAvailableAssessmentDate, setNextAvailableAssessmentDate] = useState(getLastAssessmentDate());

  // Refresh notification badge count whenever modal opens or periodically
  const refreshNotificationCount = useCallback(() => {
    setNotificationBadgeCount(getUnreadCount());
  }, []);

  // Calculate financial health scores — must be before useEffect hooks that depend on it
  const result = useMemo(() => calculateFinancialHealthV2(assessment), [assessment]);

  useEffect(() => {
    if (isBrowser()) {
      refreshNotificationCount();
      const interval = setInterval(refreshNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [refreshNotificationCount]);

  useEffect(() => {
    if (!isBrowser()) return;

    setRemainingAssessments(getRemainingAssessments(tier));
    setNextAvailableAssessmentDate(getLastAssessmentDate());
  }, [tier, subscriptionLoading]);

  const handleOpenPaywall = (feature) => {
    setPaywallFeature(feature);
    setShowPaywall(true);
  };

  const handleClosePaywall = () => {
    setPaywallFeature(null);
    setShowPaywall(false);
  };

  const handleUpgradeFromPaywall = async () => {
    const success = await upgradeSubscription('plus');
    if (success) {
      handleClosePaywall();
      setRemainingAssessments(getRemainingAssessments('plus'));
    }
  };

  const handleDismissMilestone = (badgeId) => {
    setNewlyUnlockedMilestones((current) => current.filter((b) => b.id !== badgeId));
  };

  // Detect score changes and check milestones each time score updates
  const prevScoreRef = React.useRef(0);
  useEffect(() => {
    if (!isBrowser()) return;
    if (result.healthScore <= 0) return;

    const prev = prevScoreRef.current;
    if (prev > 0 && result.healthScore !== prev) {
      // Score changed — fire in-app notification
      detectAndNotifyScoreChange(result.healthScore, prev);
      refreshNotificationCount();
    }
    prevScoreRef.current = result.healthScore;
  }, [result.healthScore, refreshNotificationCount]);

  // Check and unlock milestones on score/checkin changes
  useEffect(() => {
    if (!isBrowser()) return;
    if (result.healthScore <= 0) return;

    const milestones = checkAndUnlockMilestones({
      currentScore: result.healthScore,
      firstScore: scoreHistory.length > 0 ? scoreHistory[0]?.score : null,
      assessmentCount: scoreHistory.length,
      streak: calculateConsecutiveStreak(weeklyCheckins),
      decisionCount: decisionHistoryCount,
      hasSmsEnrichment: !!smsEnrichment,
      hasTwinSimulation: !!twinScenarios,
      hasDigitalTwin: !!digitalTwin,
      hasPartnerConnection: false,
    });

    if (milestones.length > 0) {
      setNewlyUnlockedMilestones((current) => [...current, ...milestones]);
      notifyNewMilestones(milestones);
      refreshNotificationCount();
    }
  }, [result.healthScore, scoreHistory, weeklyCheckins, decisionHistoryCount, smsEnrichment, twinScenarios, digitalTwin, refreshNotificationCount]);

  // When auth state changes, set the email in the assessment participant
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setAssessment((current) => ({
        ...current,
        participant: {
          ...current.participant,
          email: user.email,
          name: user.name || current.participant.name,
        },
      }));
    }
  }, [isAuthenticated, user?.email, user?.name]);

  useEffect(() => {
    if (!isBrowser()) return;
    setWeeklyCheckins(loadWeeklyCheckins());
    setMemoryTimeline(memoryEngine.getHistory());
  }, [memoryEngine]);

  // Initialize user retention tracking on app load
  useEffect(() => {
    if (!isBrowser()) return;
    const userId = currentUserId || assessment.participant?.email || 'demo';
    initializeUserRetention(userId);
  }, [currentUserId, assessment.participant?.email]);

  // Track user activity for retention metrics (max once per day per session)
  useEffect(() => {
    if (!isBrowser()) return;
    const userId = currentUserId || assessment.participant?.email || 'demo';
    
    const handleUserActivity = () => {
      recordUserReturn(userId);
    };

    // Record return on: focus (page becomes visible), clicks, and scroll
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleUserActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleUserActivity);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleUserActivity);
    };
  }, [currentUserId, assessment.participant?.email]);

  useEffect(() => {
    if (!isBrowser()) return;
    const userId = currentUserId || assessment.participant?.email || 'demo';
    void fetch(`/api/decision?userId=${encodeURIComponent(userId)}`)
      .then((response) => response.json())
      .then((data) => {
        setDecisionHistoryCount(Array.isArray(data.decisions) ? data.decisions.length : 0);
      })
      .catch(() => {
        setDecisionHistoryCount(0);
      });
  }, [currentUserId, assessment.participant?.email, decisionsRefresh]);

  // Fetch pending follow-ups when user is authenticated
  useEffect(() => {
    if (!isBrowser() || !currentUserId) return;
    void fetch(`/api/follow-up/pending?userId=${encodeURIComponent(currentUserId)}`, {
      headers: { 'x-user-id': currentUserId },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.followUps && Array.isArray(data.followUps)) {
          setPendingFollowUps(data.followUps);
        }
      })
      .catch((e) => {
        console.error('Error fetching follow-ups:', e);
        setPendingFollowUps([]);
      });
  }, [currentUserId]);

  useEffect(() => {
    const market = createDefaultProviderMarketplace();
    setMarketplaceRecommendations(
      market.recommend({
        ...assessment.profile,
        ...assessment.behaviour,
        monthlyExpense: assessment.profile.monthlyExpense || assessment.profile.monthlySpending,
        savings: Number(assessment.profile.emergencySavingsFixed || 0) + Number(assessment.profile.emergencySavingsDiscretionary || 0),
      }),
    );
  }, [assessment.profile, assessment.behaviour]);

  useEffect(() => {
    const handleHashChange = () => startTransition(() => setActiveHash(window.location.hash || "#home"));
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Detect and archive orphaned assessment sessions (user left mid-assessment)
  useEffect(() => {
    if (!isBrowser()) return;
    archiveOrphanedSession();
  }, []);

  useEffect(() => {
    if (!isBrowser()) return;

    initOfflineApiQueue();
    refreshQueuedSaveCount();
    setIsOnline(navigator.onLine);
    void flushQueuedAssessmentSavesAndRefresh();
    archiveOrphanedSession();

    function handleOnline() {
      setIsOnline(true);
      void flushQueuedAssessmentSavesAndRefresh();
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isBrowser()) return;
    if (window.localStorage.getItem("arth-os-onboarding-complete") === "true") {
      setShowOnboarding(false);
    }
  }, []);

  const dismissOnboarding = () => {
    if (isBrowser()) {
      window.localStorage.setItem("arth-os-onboarding-complete", "true");
    }
    setShowOnboarding(false);
  };

  useEffect(() => {
    if (!isBrowser()) return;

    const payload = {
      user: {
        ...assessment.profile,
        ...assessment.behaviour,
        survivalMonths: result.survivalMonthsRaw,
      },
      profile: assessment.profile,
    };

    void fetch("/api/risk-opportunity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.alerts)) {
          setBackendRiskAlerts(data.alerts);
        }
        if (Array.isArray(data.recommendations)) {
          setBackendMarketplaceRecommendations(data.recommendations);
        }
      })
      .catch(() => {
        setBackendRiskAlerts([]);
      });
  }, [assessment.profile, assessment.behaviour, result.survivalMonthsRaw]);

  const cognitionProfile = useMemo(
    () => buildCognitionProfile({
      ...assessment.profile,
      ...assessment.behaviour,
      ...assessment.awareness,
    }),
    [assessment.profile, assessment.behaviour, assessment.awareness],
  );
  const biasProfile = useMemo(
    () => detectCognitiveBiases({
      ...assessment.profile,
      ...assessment.behaviour,
      ...assessment.awareness,
    }),
    [assessment.profile, assessment.behaviour, assessment.awareness],
  );
  const futureRisk = useMemo(() => detectFutureRisk(assessment.profile), [assessment.profile]);
  const riskCalibration = useMemo(
    () => calculateRiskCalibration(
      cognitionProfile.riskCalibration.perceivedRisk,
      cognitionProfile.riskCalibration.actualRisk,
    ),
    [cognitionProfile.riskCalibration.perceivedRisk, cognitionProfile.riskCalibration.actualRisk],
  );
  const habitProgress = useMemo(() => evaluateHabitProgress(weeklyCheckins), [weeklyCheckins]);
  const forecastHealthValues = useMemo(() => {
    return forecastHealth(
      result.healthScore,
      Math.round(habitProgress.score / 8),
      scoreHistory.length,
      decisionHistoryCount,
    );
  }, [result.healthScore, habitProgress.score, scoreHistory.length, decisionHistoryCount]);

  // New: Prediction Engine (multi-model ensemble) forecasts
  const predictionEngineForecast = useMemo(() => {
    try {
      return predictionEngineForecastHealth(
        result.healthScore,
        scoreHistory.map((s) => s.score || s),
        assessment.profile,
        12 // monthly seasonality
      );
    } catch (e) {
      return null;
    }
  }, [result.healthScore, scoreHistory, assessment.profile]);
  const memoryInsight = useMemo(() => generateMemoryInsight(weeklyCheckins), [weeklyCheckins]);
  const opportunity = useMemo(() => opportunityForecast(assessment.profile), [assessment.profile]);
  const goalEvolution = useMemo(
    () => trackGoalEvolution(
      assessment.profile.previousGoal || assessment.profile.goal || assessment.profile.goalDescription,
      assessment.profile.currentGoal || assessment.profile.goal || assessment.profile.goalDescription,
    ),
    [
      assessment.profile.previousGoal,
      assessment.profile.goal,
      assessment.profile.goalDescription,
      assessment.profile.currentGoal,
    ],
  );
  const trajectoryNarrative = useMemo(() => buildTrajectoryNarrative(scoreHistory), [scoreHistory]);
  const riskAlerts = useMemo(
    () => generateAlerts({
      ...assessment.profile,
      ...assessment.behaviour,
      survivalMonths: result.survivalMonthsRaw,
    }),
    [assessment.profile, assessment.behaviour, result.survivalMonthsRaw],
  );
  const displayedRiskAlerts = useMemo(
    () => (backendRiskAlerts.length > 0 ? backendRiskAlerts : riskAlerts),
    [backendRiskAlerts, riskAlerts],
  );
  const fullMemoryEvents = useMemo(() => [...memoryTimeline].reverse(), [memoryTimeline]);
  const displayedMemoryEvents = useMemo(() => {
    return showFullMemoryTimeline ? fullMemoryEvents : fullMemoryEvents.slice(0, 3);
  }, [fullMemoryEvents, showFullMemoryTimeline]);
  
  const moneyBeliefs = useMemo(() => deriveMoneyBeliefs({
    ...assessment.profile,
    ...assessment.behaviour,
  }), [assessment.profile, assessment.behaviour]);
  
  const emotionalTriggers = useMemo(() => detectTriggers({
    ...assessment.profile,
    ...assessment.behaviour,
  }), [assessment.profile, assessment.behaviour]);
  
  const triggerPatterns = useMemo(
    () => identifyTriggerPatterns(emotionalTriggers, weeklyCheckins),
    [emotionalTriggers, weeklyCheckins],
  );

  const financialCognitionGraph = useMemo(() => {
    const graph = new FinancialCognitionGraph();
    graph.beliefs = moneyBeliefs.beliefs || [];
    graph.biases = [
      { id: 'presentBias', value: biasProfile.presentBias },
      { id: 'lossAversion', value: biasProfile.lossAversion },
      { id: 'optimismBias', value: biasProfile.optimismBias },
    ].filter((item) => item.value !== undefined);
    graph.emotions = Object.entries(emotionalTriggers || {})
      .filter(([key, value]) => typeof value === 'number' && value > 0)
      .map(([key, value]) => ({ id: key, value }));
    graph.decisions = [
      { id: 'spendWhenStressed', value: assessment.behaviour.spendWhenStressed || null },
      { id: 'regretImpulseFreq', value: assessment.behaviour.regretImpulseFreq || null },
    ].filter((item) => item.value !== null);
    graph.outcomes = [{ id: 'healthScore', value: result.healthScore }];
    graph.connect('beliefs', 'biases');
    graph.connect('biases', 'emotions');
    graph.connect('emotions', 'decisions');
    graph.connect('decisions', 'outcomes');
    return graph;
  }, [moneyBeliefs.beliefs, biasProfile, emotionalTriggers, assessment.behaviour, result.healthScore]);

  const cognitionGraphData = useMemo(() => {
    const nodes = [];
    const addGroup = (items, group) => {
      (Array.isArray(items) ? items : []).forEach((item, index) => {
        const id = `${group}-${item.id || index}`;
        nodes.push({
          id,
          title: item.label || item.id || `${group} ${index + 1}`,
          group,
        });
      });
    };

    addGroup(financialCognitionGraph.beliefs, 'beliefs');
    addGroup(financialCognitionGraph.biases, 'biases');
    addGroup(financialCognitionGraph.emotions, 'emotions');
    addGroup(financialCognitionGraph.decisions, 'decisions');
    addGroup(financialCognitionGraph.outcomes, 'outcomes');

    const edges = (financialCognitionGraph.connections || []).map((connection, index) => ({
      source: connection.source,
      target: connection.target,
      id: `edge-${index}`,
    }));

    return { nodes, edges };
  }, [financialCognitionGraph]);
  
  const financialMindProfile = useMemo(() => {
    const profile = new FinancialMindProfile({ userId: assessment.participant?.email || 'anonymous' });
    if (moneyBeliefs.beliefs) {
      moneyBeliefs.beliefs.forEach(b => profile.addBelief(b));
    }
    profile.updateBiases(biasProfile);
    profile.updateEmotionalTriggers(emotionalTriggers);
    return profile;
  }, [moneyBeliefs.beliefs, biasProfile, emotionalTriggers, assessment.participant?.email]);
  
  const scoreProgress = useMemo(() => getProgressSummary(scoreHistory), [scoreHistory]);

  useEffect(() => {
    if (!isBrowser()) return;
    const history = loadScoreHistory();
    setScoreHistory(history);
  }, []);

  useEffect(() => {
    if (!isBrowser()) return;
    if (typeof result?.healthScore !== "number" || Number.isNaN(result.healthScore)) return;
    if (result.healthScore <= 0) return;

    const updatedHistory = appendScoreHistory(result.healthScore);
    setScoreHistory(updatedHistory);
    appendAssessmentHistory(result);
    
    // Record assessment completion for retention metrics
    const userId = currentUserId || assessment.participant?.email || 'demo';
    recordAssessmentCompletion(userId);
    
    memoryEngine.addEvent({
      type: 'assessment_result',
      score: result.healthScore,
      personalityType: result.personalityType,
      stabilityMonths: result.survivalMonthsRaw,
      source: 'assessment',
    });
    memoryEngine.addEvent({
      type: 'trajectory_snapshot',
      score: result.healthScore,
      date: new Date().toISOString(),
    });
    setMemoryTimeline(memoryEngine.getHistory());
    setTwinScenarios(buildFinancialTwinScenarios(result, assessment.profile));
    
    // Build complete digital twin for simulation and forecasting
    const completeTwin = buildCompleteTwin(result, assessment.profile, {
      assessments: [result],
      history: memoryEngine.getHistory(),
    });
    setDigitalTwin(completeTwin);
  }, [result.healthScore, assessment.profile, result, memoryEngine]);

  const ui = {
    behaviourQuestions: v2BehaviourQuestions,
    awarenessQuestions: v2AwarenessQuestions,
    habitsQuestions: v2HabitsQuestions,
    componentMaximums: componentMaximumsV2,
    formatCurrency: formatCurrencyV2,
    extraCards: {
      debtSchedule: true,
      habits: true,
    },
  };

  const reportRoutes = ["#reports", "#cognition", "#simulator", "#decisions", "#memory", "#history"];
  const isWorkflowRoute = activeHash === "#assessment" || activeHash === "#simulator";
  const isReportsRoute = reportRoutes.includes(activeHash);
  const showHeroSection = activeHash === "#home" || activeHash === "#intelligence" || (!isWorkflowRoute && !isReportsRoute);
  const showAssessmentSection = activeHash === "#assessment";
  const showReportsSection = isReportsRoute;



  function updateGroup(group, key, value) {
    setAssessment((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [key]: value,
      },
    }));
    setSaveState("Unsaved");
  }

  function saveAssessment() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assessment));
    } catch (e) {
      console.warn("Could not save locally:", e);
    }

    if (tier === 'free' && !checkAssessmentAvailable()) {
      window.alert('Free tier assessments are limited to one per month. Upgrade to Plus for unlimited assessments.');
      handleOpenPaywall('unlimited_assessments');
      return;
    }

    const payload = { assessment, result: calculateFinancialHealthV2(assessment) };
    if (isBrowser()) {
      if (!isOnline) {
        enqueueAssessmentSaveAndRefresh(payload);
        setSaveState("Saved offline");
        return;
      }

      setSaveState("Upload pending");
      fetch("/api/saveAssessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(async (resp) => {
          const body = await resp.text().catch(() => null);
          if (!resp.ok) {
            enqueueAssessmentSaveAndRefresh(payload);
            setSaveState("Saved offline");
            console.warn("Remote save failed, queued for retry:", resp.statusText, body);
            return;
          }

          const pendingCount = loadQueuedAssessmentSaves().length;
          if (pendingCount > 0) {
            void flushQueuedAssessmentSavesAndRefresh();
            setSaveState("Upload pending");
          } else {
            setSaveState("Saved");
          }

          if (tier === 'free') {
            recordAssessment();
            setRemainingAssessments(getRemainingAssessments('free'));
            setNextAvailableAssessmentDate(getLastAssessmentDate());
          }

          console.log("Remote save response:", resp.status, body);
        })
        .catch((err) => {
          enqueueAssessmentSaveAndRefresh(payload);
          setSaveState("Saved offline");
          console.warn("Remote save error, queued for retry:", err);
        });
    }
  }

  function handleAdminLogin(event) {
    event.preventDefault();
    if (adminCredentials.username === "ankit" && adminCredentials.password === "admin") {
      setAdminLoggedIn(true);
      setAdminLoginError("");
      startTransition(() => setActiveHash("#admin"));
      return;
    }

    setAdminLoginError("Invalid username or password. Please try again.");
  }

  function handleAdminLogout() {
    setAdminLoggedIn(false);
    setAdminCredentials({ username: "", password: "" });
    setAdminLoginError("");
    window.location.hash = "#home";
  }

  function generateAdminReport() {
    const report = {
      assessment,
      result,
      createdAt: new Date().toISOString(),
    };
    setAdminReport(report);
  }

  function resetAssessment() {
    setAssessment(makeEmptyAssessment());
    setSmsEnrichment(null);
    setShowSmsForm(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem("arth-os-wizard-step");
    } catch (error) {
      console.warn("Could not clear reset storage:", error);
    }
    setSaveState("Ready");
    setResetTrigger((current) => current + 1);
  }

  function handleSmsEnrichment(signals, transactions) {
    const behaviourUpdates = mapSignalsToBehaviour(signals);
    setSmsEnrichment({ signals, transactions, behaviourUpdates });
    setShowSmsForm(false);
    if (signals) {
      setAssessment((current) => ({
        ...current,
        behaviour: {
          ...current.behaviour,
          ...behaviourUpdates,
        },
      }));
      setSaveState("Unsaved");
    }
  }

  function handleDailyCheckin({ behaviourUpdates }) {
    if (!behaviourUpdates) return;
    setAssessment((current) => ({
      ...current,
      behaviour: {
        ...current.behaviour,
        ...behaviourUpdates,
      },
    }));
    setSaveState("Unsaved");
  }


  function exportReport() {
    if (!isBrowser()) return;
    window.print();
  }

  return (
    <div className="app-shell">
      <Header
        activeHash={activeHash}
        saveState={saveState}
        saveStatusLabel={saveStatusLabel}
        saveStatusClass={saveStatusClass}
        onExport={exportReport}
        onReset={resetAssessment}
        onSave={saveAssessment}
        isAuthenticated={isAuthenticated}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={logout}
        notificationBadgeCount={notificationBadgeCount}
        onToggleNotification={() => setShowNotificationPanel((prev) => !prev)}
      />

      {!showAuthModal && (
        <FlowNavigation
          activeHash={activeHash}
          onNavigate={(hash) => {
            startTransition(() => {
              setActiveHash(hash);
              window.location.hash = hash;
            });
          }}
        />
      )}

      <NotificationPanel
        isOpen={showNotificationPanel}
        onClose={() => setShowNotificationPanel(false)}
      />

      <NotificationToast />

      {showOnboarding && (
        <OnboardingOverlay onComplete={dismissOnboarding} />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="auth-modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
            {authMode === "login" ? (
              <LoginPage
                onSwitchToRegister={() => setAuthMode("register")}
                onClose={() => setShowAuthModal(false)}
              />
            ) : (
              <RegisterPage
                onSwitchToLogin={() => setAuthMode("login")}
                onClose={() => setShowAuthModal(false)}
              />
            )}
          </div>
        </div>
      )}

      <main>
        {activeHash === "#b2b" ? (
          <Suspense fallback={<LazyComponentFallback />}>
            <B2BPartnerPortal
              userId={effectiveUserId}
              assessment={assessment}
            />
          </Suspense>
        ) : activeHash === "#predictions" ? (
          <Suspense fallback={<LazyComponentFallback />}>
            <ErrorBoundary>
              <PredictionEngineDashboard userId={effectiveUserId} />
            </ErrorBoundary>
          </Suspense>
        ) : activeHash === "#admin" ? (
          <AdminSection
            assessment={assessment}
            result={result}
            adminLoggedIn={adminLoggedIn}
            adminCredentials={adminCredentials}
            adminLoginError={adminLoginError}
            adminReport={adminReport}
            onAdminCredentialChange={setAdminCredentials}
            onAdminLogin={handleAdminLogin}
            onAdminLogout={handleAdminLogout}
            onGenerateReport={generateAdminReport}
          />
        ) : (
          <>
            {showHeroSection && (
              <HeroSection
                assessment={assessment}
                result={result}
              />
            )}
            {showAssessmentSection && (
              <ErrorBoundary>
              {tier === 'free' && remainingAssessments === 0 && (
                <AssessmentLimitNotice
                  tier={tier}
                  remaining={remainingAssessments}
                  nextAvailableDate={nextAvailableAssessmentDate}
                  onUpgradeClick={() => handleOpenPaywall('unlimited_assessments')}
                />
              )}
              <AssessmentSection
                assessment={assessment}
                result={result}
                onChange={updateGroup}
                onSaveAssessment={saveAssessment}
                ui={ui}
                resetTrigger={resetTrigger}
              />
              {showPaywall && (
                <FeaturePaywall
                  isOpen={showPaywall}
                  feature={paywallFeature}
                  currentTier={tier}
                  onClose={handleClosePaywall}
                  onUpgradeClick={handleUpgradeFromPaywall}
                />
              )}
            </ErrorBoundary>
          )}

            {showSmsForm && activeHash === "#assessment" && (
              <section style={{ maxWidth: "1200px", margin: "20px auto", padding: "0 16px" }}>
                <div className="section-card">
                  <h2 style={{ marginBottom: "20px" }}>Enrich Your Assessment with Banking Data</h2>
                  <SMSIngestForm
                    onEnrichment={handleSmsEnrichment}
                    onCancel={() => setShowSmsForm(false)}
                  />
                </div>
              </section>
            )}

            {smsEnrichment && (
              <section className="premium-inline-badge-wrap" style={{ maxWidth: "1200px", margin: "20px auto", padding: "0 16px" }}>
                <div className="premium-success-badge">
                  ✓ Your assessment has been enriched with {smsEnrichment.transactions?.length || 0} banking transactions
                </div>
              </section>
            )}


            {showReportsSection && (
            <section className="assessment-summary-grid flow-report-grid" id="reports">
              <div className="summary-main-column">
                {/* MOST IMPORTANT INSIGHT — Center of the MVP Experience */}
                <Suspense fallback={<LazyComponentFallback />}>
                  <ErrorBoundary>
                    <SingleMostImportantInsight assessmentResult={result} assessment={assessment} />
                  </ErrorBoundary>
                </Suspense>
                
                {/* ACTION FOLLOW-UP PANEL — Day 7 & Day 30 Check-Ins */}
                <Suspense fallback={<LazyComponentFallback />}>
                  <ErrorBoundary>
                    <ActionFollowUpPanel userId={currentUserId} followUps={pendingFollowUps} />
                  </ErrorBoundary>
                </Suspense>
                
                <Suspense fallback={<LazyComponentFallback />}>
                  <ErrorBoundary>
                    <AnalyticsDashboard result={result} />
                  </ErrorBoundary>
                </Suspense>

                {/* Retention & Cohort Analytics Dashboard */}
                <Suspense fallback={<LazyComponentFallback />}>
                  <ErrorBoundary>
                    <RetentionDashboard />
                  </ErrorBoundary>
                </Suspense>

                {/* Assessment Completion Rate Dashboard */}
                <Suspense fallback={<LazyComponentFallback />}>
                  <ErrorBoundary>
                    <CompletionDashboard />
                  </ErrorBoundary>
                </Suspense>

                {currentUserId && (
                  <section className="summary-card">
                    <SubscriptionManagement userId={currentUserId} />
                  </section>
                )}

                {/* Digital Twin Dashboard - Flight Simulator for Financial Life */}
                <Suspense fallback={<LazyComponentFallback />}>
                  <ErrorBoundary>
                    <DigitalTwinDashboard twin={digitalTwin} assessment={result} />
                  </ErrorBoundary>
                </Suspense>
                
                <section className="summary-card">
                  <div className="premium-report-section-header">
                    <h2 className="premium-report-section-title">🔥 Financial Roast</h2>
                  </div>
                  <SalaryRoastGenerator
                    assessmentResult={result}
                    profile={assessment.profile}
                  />
                </section>
                <section className="summary-card">
                  <div className="premium-report-section-header">
                    <h2 className="premium-report-section-title">📊 Financial Forecast</h2>
                    <p className="premium-report-block-subtitle">GBM Monte Carlo projections with stress test scenarios.</p>
                  </div>
                  <ScenarioForecast
                    profile={assessment.profile}
                    assessmentResult={result}
                    predictionEngineForecast={predictionEngineForecast}
                  />
                </section>
                <section className="summary-card">
                  <div className="premium-report-section-header">
                    <h2 className="premium-report-section-title">🤖 Multi-Model Ensemble Forecast</h2>
                    <p className="premium-report-block-subtitle">
                      Auto-selected best model from ARIMA · Holt-Winters · Bayesian Structural · Ensemble
                    </p>
                  </div>
                  <ForecastModelCard forecast={predictionEngineForecast} />
                </section>
                <section className="summary-card premium-report-block" id="cognition">
                  <div className="premium-report-block-header">
                    <h2 className="premium-report-block-title">🧠 Cognition & Future Risk</h2>
                    <p className="premium-report-block-subtitle">
                      See your cognitive calibration, runway risk, and forecasted health trajectory.
                    </p>
                  </div>
                  <div className="premium-report-grid">
                    <div className="premium-report-grid-2">
                      <div className="premium-metric-tile">
                        <div className="premium-metric-kicker">Calibration gap</div>
                        <div className="premium-metric-value">{riskCalibration.calibrationGap}%</div>
                        <div className="premium-metric-desc">Perceived vs. actual risk alignment.</div>
                      </div>
                      <div className="premium-metric-tile">
                        <div className="premium-metric-kicker">Near-term runway</div>
                        <div className="premium-metric-value">{futureRisk.runway} months</div>
                        <div className="premium-metric-desc">{futureRisk.message}</div>
                      </div>
                    </div>
                    <div className="premium-report-grid-3">
                      <div className="premium-metric-tile">
                        <div className="premium-metric-kicker">30 day health (p50)</div>
                        <div className="premium-metric-value">{forecastHealthValues.day30?.p50 ?? '—'}</div>
                        <div className="premium-metric-desc">Range: {forecastHealthValues.day30?.p25 ?? '—'}–{forecastHealthValues.day30?.p75 ?? '—'}</div>
                      </div>
                      <div className="premium-metric-tile">
                        <div className="premium-metric-kicker">90 day health (p50)</div>
                        <div className="premium-metric-value">{forecastHealthValues.day90?.p50 ?? '—'}</div>
                        <div className="premium-metric-desc">Range: {forecastHealthValues.day90?.p25 ?? '—'}–{forecastHealthValues.day90?.p75 ?? '—'}</div>
                      </div>
                      <div className="premium-metric-tile">
                        <div className="premium-metric-kicker">180 day health (p50)</div>
                        <div className="premium-metric-value">{forecastHealthValues.day180?.p50 ?? '—'}</div>
                        <div className="premium-metric-desc">Range: {forecastHealthValues.day180?.p25 ?? '—'}–{forecastHealthValues.day180?.p75 ?? '—'}</div>
                      </div>
                    </div>
                    <div className="premium-report-grid-2">
                      <div className="premium-metric-tile">
                        <div className="premium-metric-kicker">Forecast confidence</div>
                        <div className="premium-metric-value">{forecastHealthValues.confidence}%</div>
                        <div className="premium-metric-desc">Based on {scoreHistory.length} historical datapoints and {decisionHistoryCount} decisions tracked.</div>
                      </div>
                      <div className="premium-metric-tile">
                        <div className="premium-metric-kicker">Cognitive bias load</div>
                        <div className="premium-metric-value">
                          {Math.round((biasProfile.presentBias + biasProfile.lossAversion + biasProfile.optimismBias + biasProfile.anchoringBias + biasProfile.sunkCostBias) / 5)}%
                        </div>
                        <div className="premium-metric-desc">Average exposure across your core bias dimensions.</div>
                      </div>
                      <div className="premium-metric-tile">
                        <div className="premium-metric-kicker">Opportunity forecast</div>
                        <div className="premium-metric-value premium-metric-value-compact">{opportunity.action}</div>
                        <div className="premium-metric-desc">{opportunity.benefit}</div>
                      </div>
                    </div>
                    <div className="premium-report-grid-2">
                      <div className="premium-metric-tile">
                        <div className="premium-metric-kicker">Cognition graph</div>
                        <div className="premium-metric-value">{financialCognitionGraph.beliefs.length + financialCognitionGraph.biases.length + financialCognitionGraph.emotions.length + financialCognitionGraph.decisions.length + financialCognitionGraph.outcomes.length} elements</div>
                        <div className="premium-metric-desc">{financialCognitionGraph.connections.length} connections modeling belief → bias → outcome.</div>
                      </div>
                      <div className="premium-metric-tile">
                        <div className="premium-metric-kicker">Risk calibration</div>
                        <div className="premium-metric-value">{riskCalibration.calibrated ? "Aligned" : "Misaligned"}</div>
                        <div className="premium-metric-desc">Perception gap is {riskCalibration.calibrationGap}%.</div>
                      </div>
                    </div>
                    <div className="premium-metric-tile premium-metric-tile-wide">
                      <strong className="premium-metric-heading">Risk & opportunity alerts</strong>
                      <ul className="risk-alert-list">
                        {displayedRiskAlerts.map((alert, index) => (
                          <li key={`${alert.type}-${index}`} className={`risk-alert risk-alert-${alert.type}`}>
                            <strong>{alert.title}</strong>
                            <span>{alert.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {(backendMarketplaceRecommendations.length > 0 || marketplaceRecommendations.length > 0) && (
                      <div className="premium-metric-tile premium-metric-tile-wide">
                        <strong className="premium-metric-heading">Marketplace recommendations</strong>
                        <p className="premium-metric-longtext">
                          {backendMarketplaceRecommendations.length > 0
                            ? backendMarketplaceRecommendations.map((provider) => provider.name).join(', ')
                            : marketplaceRecommendations.map((provider) => provider.name).join(', ')}
                        </p>
                      </div>
                    )}
                    {memoryInsight && (
                      <div className="premium-metric-tile premium-metric-tile-wide">
                        <strong className="premium-metric-heading">Memory Insight</strong>
                        <p className="premium-metric-longtext">{memoryInsight.insight}</p>
                      </div>
                    )}
                    <div className="premium-metric-tile premium-metric-tile-wide">
                      <strong className="premium-metric-heading">Score trajectory</strong>
                      <p className="premium-metric-longtext">{trajectoryNarrative}</p>
                    </div>
                    <div className="premium-metric-tile premium-metric-tile-wide">
                      <strong className="premium-metric-heading">Cognition graph explorer</strong>
                      <Suspense fallback={<LazyComponentFallback />}>
                        <CognitionGraphView nodes={cognitionGraphData.nodes} edges={cognitionGraphData.edges} />
                      </Suspense>
                    </div>
                    <div className="premium-metric-tile premium-metric-tile-wide">
                      <strong className="premium-metric-heading">Unified memory</strong>
                      <p className="premium-metric-longtext">{memoryTimeline.length} memory events stored across your financial history.</p>
                      {displayedMemoryEvents.length > 0 ? (
                        <>
                          <ul className="memory-timeline-list">
                            {displayedMemoryEvents.map((event, index) => (
                              <li key={`${event.type}-${event.timestamp}-${index}`}>
                                <strong>{event.type.replaceAll('_', ' ')}</strong>: {event.score !== undefined ? `score ${event.score}` : event.name || event.description || 'event recorded'}
                                <span> · {new Date(event.timestamp).toLocaleDateString()}</span>
                              </li>
                            ))}
                          </ul>
                          {memoryTimeline.length > 3 && (
                            <button
                              type="button"
                              className="memory-toggle-button"
                              onClick={() => setShowFullMemoryTimeline((current) => !current)}
                            >
                              {showFullMemoryTimeline ? "Show recent events" : "View full memory timeline"}
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="premium-metric-longtext">Complete an assessment to start building your financial memory timeline.</p>
                      )}
                    </div>
                    {marketplaceRecommendations.length > 0 && (
                      <div className="premium-metric-tile premium-metric-tile-wide">
                        <strong className="premium-metric-heading">OS marketplace</strong>
                        <p className="premium-metric-longtext">
                          Recommended providers: {marketplaceRecommendations.map((provider) => provider.name).join(", ")}.
                        </p>
                      </div>
                    )}
                    {(goalEvolution.previousGoal || goalEvolution.currentGoal) && (
                      <div className="premium-metric-tile premium-metric-tile-wide">
                        <span className="premium-metric-kicker">Goal evolution</span>
                        <div className="premium-metric-value premium-metric-value-compact">
                          {goalEvolution.changed ? "Goal path shifted" : "Goal path stable"}
                        </div>
                        <div className="premium-metric-desc">
                          {goalEvolution.changed
                            ? `Moved from ${goalEvolution.previousGoal || "previous"} to ${goalEvolution.currentGoal || "current"}.`
                            : "Your current goal remains consistent."}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="summary-card premium-report-block">
                  <MoneyBeliefsCard moneyBeliefs={moneyBeliefs} />
                  <EmotionalTriggersCard triggers={emotionalTriggers} patterns={triggerPatterns} />
                  <FinancialMindProfileCard profile={financialMindProfile} />
                </section>

                <ErrorBoundary>
                  <DecisionSimulator
                    id="simulator"
                    profile={assessment.profile}
                    behaviour={assessment.behaviour}
                  />
                </ErrorBoundary>
              </div>

              <div className="assessment-summary-sidebar">
                <Suspense fallback={<LazyComponentFallback />}>
                  <ErrorBoundary>
                    <FinancialTwin
                      personalityType={result.personalityType}
                      behaviourScore={result.behaviourScore}
                      awarenessScore={result.awarenessScore}
                      scenarios={twinScenarios}
                    />
                  </ErrorBoundary>
                </Suspense>
                <PeerComparisonCard userScore={result.healthScore} />
                <FinancialDNA result={result} />
                {isAuthenticated ? (
                  <div className="summary-card padded" style={{ marginTop: "18px" }}>
                    <div className="auth-status-card">
                      <CircleUserRound size={20} />
                      <span>Signed in as <strong>{user?.name || user?.email}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="summary-card padded" style={{ marginTop: "18px" }}>
                    <div className="auth-status-card">
                      <LogIn size={20} />
                      <span>
                        <button
                          type="button"
                          className="auth-link-btn"
                          onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
                        >
                          Sign in
                        </button>
                        {" "}or{" "}
                        <button
                          type="button"
                          className="auth-link-btn"
                          onClick={() => { setAuthMode("register"); setShowAuthModal(true); }}
                        >
                          create an account
                        </button>
                        {" "}to persist data across devices
                      </span>
                    </div>
                  </div>
                )}
                <UpgradeJourney result={result} currentScore={result.healthScore} />
                {!showSmsForm && !smsEnrichment && (
                  <section className="enrichment-banner">
                    <p className="enrichment-banner-title">{ASSESSMENT_BANNER.title}</p>
                    <button type="button" className="enrichment-button" onClick={() => setShowSmsForm(true)}>
                      {ASSESSMENT_BANNER.cta}
                    </button>
                    <p className="enrichment-copy">{ASSESSMENT_BANNER.description}</p>
                  </section>
                )}

                <section className="summary-card padded" style={{ marginTop: "18px" }}>
                  <PartnerSdkDemo
                    userId={effectiveUserId}
                    assessment={assessment}
                  />
                </section>
              </div>

              <section id="memory" className="summary-span">
                <div className="summary-card">
                  <div className="premium-report-section-header">
                    <h2 className="premium-report-section-title">🧠 Memory Timeline</h2>
                    <p className="premium-report-block-subtitle">
                      A dedicated memory view for your recorded financial events, reflections and decision milestones.
                    </p>
                  </div>
                  {memoryTimeline.length > 0 ? (
                    <>
                      <div className="premium-report-grid-2">
                        <div className="premium-metric-tile">
                          <div className="premium-metric-kicker">Memory events</div>
                          <div className="premium-metric-value">{memoryTimeline.length}</div>
                          <div className="premium-metric-desc">Events captured from assessments, forecasts, and decisions.</div>
                        </div>
                        <div className="premium-metric-tile">
                          <div className="premium-metric-kicker">Latest entry</div>
                          <div className="premium-metric-value">
                            {new Date(fullMemoryEvents[0]?.timestamp || Date.now()).toLocaleDateString()}
                          </div>
                          <div className="premium-metric-desc">Most recent financial memory update.</div>
                        </div>
                      </div>
                      <ul className="memory-timeline-list memory-timeline-page-list">
                        {fullMemoryEvents.map((event, index) => (
                          <li key={`${event.type}-${event.timestamp}-${index}`}>
                            <strong>{event.type.replaceAll('_', ' ')}</strong>
                            <span>{event.score !== undefined ? `Score ${event.score}` : event.name || event.description || 'Event recorded'}</span>
                            <span>{new Date(event.timestamp).toLocaleDateString()} · {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="premium-metric-longtext">No financial memory events yet. Keep using the app to build a richer timeline of your financial journey.</p>
                  )}
                </div>
              </section>
              
              <section id="history" className="summary-span">
                <Suspense fallback={<LazyComponentFallback />}>
                  <ErrorBoundary>
                    <UserHistory
                      className="summary-span"
                      currentScore={result.healthScore}
                      personalityType={result.personalityType}
                    />
                  </ErrorBoundary>
                </Suspense>
              </section>
              
              <section className="summary-span">
                <div className="summary-card premium-report-block" style={{ padding: "24px" }}>
                  <div className="premium-report-block-header">
                    <h2 className="premium-report-block-title">{INSIGHT_TITLES.narrativeTitle}</h2>
                    <p className="premium-report-block-subtitle">{INSIGHT_TITLES.narrativeSubtitle}</p>
                  </div>
                  <ErrorBoundary>
                    <EnhancedInsightNarrative
                      assessmentResult={result}
                      assessment={assessment}
                    />
                  </ErrorBoundary>
                </div>
              </section>
            </section>
            )}

            {showReportsSection && (
            <div className="flow-insights-section" id="insights">
              <div className="diagnostics-grid">
                <SurvivalHero survivalMonths={result.survivalMonthsRaw} />
                <CognitionGapCard perceived={result.awarenessGapDisplay} actual={result.survivalMonthsDisplay} />
                <BehaviourDrivers drivers={deriveDrivers(result, assessment)} />
              </div>
              <SingleRecommendedAction result={result} assessment={assessment} />
              <TraitMatrixVisualizer result={result} assessment={assessment} />

              <ConsequenceForecastCard result={result} assessment={assessment} />
              <InterventionsPrescriptionCard result={result} assessment={assessment} />
              <StrategicMetricsCard 
                result={result} 
                profile={assessment?.profile} 
                behaviour={assessment?.behaviour}
                stability={assessment?.stability}
              />
              <DailyCheckinForm onCheckin={handleDailyCheckin} />
              <ReminderPreferences userId={currentUserId} />
              <section id="decisions" className="summary-card premium-report-block decision-overview-section">
                <div className="premium-report-block-header">
                  <h2 className="premium-report-block-title">Decisions</h2>
                  <p className="premium-report-block-subtitle">
                    Track your choices, review recent outcomes, and keep decision-making aligned to your financial goals.
                  </p>
                </div>
                <div className="decision-section-grid">
                  <DecisionHistory userId={effectiveUserId} refreshSignal={decisionsRefresh} />
                  <RecordDecision userId={effectiveUserId} onSaved={() => {
                    setDecisionsRefresh((c) => c + 1);
                  }} />
                </div>
              </section>
            </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function deriveDrivers(result, assessment) {
  if (!result) return [];
  const drivers = [];
  const spendWhenStressed = assessment.behaviour?.spendWhenStressed;
  if (spendWhenStressed && spendWhenStressed !== "never") {
    drivers.push({ title: "Stress Spending", impact: -18 });
  }
  const impulse = assessment.behaviour?.regretImpulseFreq;
  if (impulse && impulse !== "never") {
    drivers.push({ title: "Impulse Purchases", impact: -12 });
  }
  if ((result.awarenessGapDisplay || 0) > 2) {
    drivers.push({ title: "Poor Expense Tracking", impact: -9 });
  }

  if (drivers.length === 0) {
    drivers.push({ title: "Low savings rate", impact: -8 });
    drivers.push({ title: "Irregular income", impact: -6 });
  }

  return drivers;
}

function ScoreRing({ score }) {
  const normalizedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const ringData = [
    { value: normalizedScore },
    { value: 100 - normalizedScore },
  ];

  return (
    <div className="score-ring-chart" style={{ "--score": normalizedScore }}>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={ringData}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            innerRadius={72}
            outerRadius={96}
            paddingAngle={3}
          >
            <Cell fill="var(--purple-96)" />
            <Cell fill="var(--white-08)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="score-ring-label">
        <strong>{normalizedScore}</strong>
        <small>/100</small>
      </div>
    </div>
  );
}

function FinancialDNA({ result }) {
  if (!result) return null;

  const behaviourPct = Math.min(100, Math.round((result.behaviourScore / componentMaximumsV2.behaviour) * 100));
  const awarenessPct = Math.min(100, Math.round((result.awarenessScore / componentMaximumsV2.awareness) * 100));
  const stabilityPct = Math.min(100, Math.round((result.stabilityScore / componentMaximumsV2.stability) * 100));

  const dnaMetrics = [
    { label: "Behavioral Control", value: behaviourPct },
    { label: "Awareness Clarity", value: awarenessPct },
    { label: "Financial Stability", value: stabilityPct },
  ];

  return (
    <section className="financial-dna-card">
      <div className="result-heading">
        <ShieldCheck size={19} />
        <div>
          <h2>Financial DNA</h2>
          <span>Why your money profile behaves this way</span>
        </div>
      </div>
      <div className="dna-grid">
        {dnaMetrics.map((item) => (
          <div className="dna-item" key={item.label}>
            <div>
              <span>{item.label}</span>
              <strong>{item.value}%</strong>
            </div>
            <div className="dna-track" aria-hidden="true">
              <span style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function UpgradeJourney({ result, currentScore }) {
  const journeyData = [
    { month: "Week 1", healthScore: Math.max(0, currentScore - 28) },
    { month: "Week 2", healthScore: Math.max(0, currentScore - 21) },
    { month: "Week 3", healthScore: Math.max(0, currentScore - 14) },
    { month: "Week 4", healthScore: Math.max(0, currentScore - 7) },
    { month: "Today", healthScore: currentScore },
  ];

  return (
    <section className="journey-card">
      <div className="result-heading">
        <TrendingUp size={19} />
        <div>
          <h2>Progress Journey</h2>
          <span>How your financial strength is trending</span>
        </div>
      </div>
      <div className="journey-chart-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={journeyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="journeyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--purple)" stopOpacity={0.7} />
                <stop offset="100%" stopColor="var(--purple)" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--white-76)", fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="healthScore"
              stroke="var(--purple)"
              strokeWidth={3}
              fill="url(#journeyGrad)"
              fillOpacity={1}
              activeDot={{ r: 5, fill: "var(--white)", stroke: "var(--purple)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function AdminSection({
  assessment,
  result,
  adminLoggedIn,
  adminCredentials,
  adminLoginError,
  adminReport,
  onAdminCredentialChange,
  onAdminLogin,
  onAdminLogout,
  onGenerateReport,
}) {
  return (
    <section className="admin-section">
      <div className="admin-panel">
        <div className="admin-header">
          <div>
            <span className="admin-label">{ADMIN_LABELS.dashboard}</span>
          </div>
          {adminLoggedIn && (
            <button type="button" className="ghost-button admin-logout-btn" onClick={onAdminLogout}>
              {ADMIN_LABELS.logout}
            </button>
          )}
        </div>

        {!adminLoggedIn ? (
          <form className="admin-login-card" onSubmit={onAdminLogin} autoComplete="off">
            <label>
              {ADMIN_LABELS.username}
              <input
                type="text"
                autoComplete="username"
                value={adminCredentials.username}
                onChange={(event) => onAdminCredentialChange({
                  ...adminCredentials,
                  username: event.target.value,
                })}
              />
            </label>
            <label>
              {ADMIN_LABELS.password}
              <input
                type="password"
                autoComplete="current-password"
                value={adminCredentials.password}
                onChange={(event) => onAdminCredentialChange({
                  ...adminCredentials,
                  password: event.target.value,
                })}
              />
            </label>
            {adminLoginError && <p className="admin-login-error">{adminLoginError}</p>}
            <button type="submit" className="primary-link admin-login-btn">
              {ADMIN_LABELS.signIn}
            </button>
          </form>
        ) : (
          <>
            <div className="admin-summary-grid">
              <div className="admin-card">
                <h3>{ADMIN_LABELS.participantData}</h3>
                <pre>{JSON.stringify(assessment.participant, null, 2)}</pre>
              </div>
              <div className="admin-card">
                <h3>{ADMIN_LABELS.profileInputs}</h3>
                <pre>{JSON.stringify(assessment.profile, null, 2)}</pre>
              </div>
              <div className="admin-card">
                <h3>{ADMIN_LABELS.behaviourAnswers}</h3>
                <pre>{JSON.stringify(assessment.behaviour, null, 2)}</pre>
              </div>
              <div className="admin-card">
                <h3>{ADMIN_LABELS.awarenessAnswers}</h3>
                <pre>{JSON.stringify(assessment.awareness, null, 2)}</pre>
              </div>
              {assessment.habits && (
                <div className="admin-card admin-habits-card">
                  <h3>{ADMIN_LABELS.habitsAnswers}</h3>
                  <pre>{JSON.stringify(assessment.habits, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="admin-actions-row">
              <button type="button" className="admin-generate-btn" onClick={onGenerateReport}>
                {ADMIN_LABELS.generateReport}
              </button>
              <span className="admin-report-hint">{ADMIN_LABELS.reportHint}</span>
            </div>

            {adminReport && (
              <div className="admin-report-preview">
                <h3>Generated report preview</h3>
                <pre>{JSON.stringify(adminReport, null, 2)}</pre>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Header({
  activeHash,
  saveState,
  saveStatusLabel,
  saveStatusClass,
  onExport,
  onReset,
  onSave,
  isAuthenticated,
  user,
  onOpenAuth,
  onLogout,
  notificationBadgeCount = 0,
  onToggleNotification,
}) {

  return (
    <header className="topbar">
      <a className="brand" href="#home" aria-label="ARTH.OS home">

        <span className="logo-word">
          ARTH.<span>OS</span>
        </span>
        <small>POWERED BY SANKHYA</small>
      </a>

      <nav className="nav-links" aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => (
          <a
            href={item.href}
            key={item.label}
            className={activeHash === item.href ? "active" : ""}
            aria-current={activeHash === item.href ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="model-header-actions" aria-label="Product actions">
        <span className={`header-sync save-state-${saveStatusClass}`}>
          {saveStatusLabel}
        </span>
        <button type="button" className="model-icon-btn" title="Search">
          <Search size={18} />
        </button>
        <button type="button" className="model-icon-btn notification-btn" title="Notifications" onClick={onToggleNotification}>
          <Bell size={18} />
          {notificationBadgeCount > 0 && <span className="notification-badge-dot">{notificationBadgeCount}</span>}
        </button>
        <button type="button" className="model-icon-btn" title="Export report as PDF" onClick={onExport}>
          <Download size={18} />
        </button>

        {/* Auth button */}
        {isAuthenticated && user ? (
          <div className="auth-header-group">
            <span className="auth-header-user" title={user.email}>
              <CircleUserRound size={16} />
              <span>{user.name || user.email?.split("@")[0]}</span>
            </span>
            <button type="button" className="model-icon-btn" title="Sign out" onClick={onLogout}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button type="button" className="model-icon-btn" title="Sign in" onClick={onOpenAuth}>
            <LogIn size={18} />
          </button>
        )}

        <a className="model-avatar-btn" href="#admin" aria-label="Admin dashboard">
          <span>A</span>
          <ChevronDown size={15} />
        </a>
        <a className="model-start-btn" href="#assessment">
          Start Assessment
        </a>
      </div>

    </header>
  );
}

const sIcons = { behaviour: Brain, awareness: BarChart3, stability: ShieldCheck };

function HeroSection({ assessment, result }) {
  const scorePreview = Math.max(0, Math.min(100, Math.round(result.healthScore ?? 0)));
  const scoreLabel = result.categoryBand?.label ?? "Live profile";
  const liveInsights = buildLiveInsightCards(result, assessment);
  const metricRows = [
    {
      label: "Financial Health Behavior Score",
      value: scorePreview,
      width: `${scorePreview}%`,
    },
    {
      label: "Behavior Control",
      value: Math.round(result.behaviourScore ?? 0),
      width: `${Math.min(100, ((result.behaviourScore ?? 0) / componentMaximumsV2.behaviour) * 100)}%`,
    },
    {
      label: "Awareness Signal",
      value: Math.round(result.awarenessScore ?? 0),
      width: `${Math.min(100, ((result.awarenessScore ?? 0) / componentMaximumsV2.awareness) * 100)}%`,
    },
  ];
  const perceivedRunway = Number(result.blindSpotPerceived) || 8;
  const actualRunway = Number(result.blindSpotActual) || 4;
  const blindSpot = Number(result.blindSpotGap) || Math.max(perceivedRunway - actualRunway, 0);

  return (
    <section className="model-screen" id="home">
      <div className="model-hero-grid">
        <div className="model-hero-copy">
          <h1>
            <span>Decode the financial blindspots</span>
            your money leaves behind.
          </h1>
          <p>
            ARTH.OS turns behavior, awareness and stability into a private intelligence layer for
            clearer financial decisions.
          </p>
          <div className="hero-stat-card">
            {HERO_STATS.map((item) => (
              <div className="metric" key={item.label}>
                <span>{item.value}</span>
                <label>{item.label}</label>
              </div>
            ))}
          </div>
          <div className="model-hero-actions">
            {HERO_ACTIONS.map((action) => (
              <a key={action.label} className={action.href === "#assessment" ? "model-primary-cta" : "model-secondary-cta"} href={action.href}>
                {action.label}
                <ArrowRight size={18} />
              </a>
            ))}
          </div>
        </div>

        <article className="model-engine-panel" id="intelligence">
          <div className="model-panel-title">
            <span className="model-orb" />
            <h2>ARTH.OS Intelligence Engine</h2>
          </div>
          <div className="model-engine-content">
            <div className="model-score-block">
              <span>Live Score</span>
              <ScoreRing score={scorePreview} />
              <p>{scoreLabel}</p>
              <small>Updated just now</small>
            </div>

            <section className="awareness-card">
              <h3>The Visibility Blindspot</h3>
              <div className="gap-grid">
                <div>
                  <h1>{perceivedRunway}</h1>
                  <label>You Believe</label>
                </div>
                <div>
                  <h1>{actualRunway}</h1>
                  <label>Reality</label>
                </div>
                <div>
                  <h1>{blindSpot}</h1>
                  <label>Gap</label>
                </div>
              </div>
              <p className="awareness-copy">
                You overestimate your financial runway by {blindSpot} months.
              </p>
            </section>

            <div className="model-metric-stack">
              {metricRows.map((row) => (
                <div className="model-metric-row" key={row.label}>
                  <div>
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                  <div className="model-metric-track" aria-hidden="true">
                    <span style={{ width: row.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="model-engine-footer">
            <span>Scoring based on 12 behavioral dimensions</span>
            <a href="#assessment">
              View full breakdown
              <ArrowRight size={17} />
            </a>
          </div>
        </article>

        <aside className="model-insights-rail">
          <div className="model-insights-header">
            <h2>Live Insights</h2>
            <div>
              <a className="model-view-insights">View all</a>
            </div>
          </div>

          <div className="model-insight-list">
            {liveInsights.map((it, idx) => {
              const Icon = it.icon;
              return (
                <div className={`model-insight-card tone-${it.tone}`} key={idx}>
                  <div className="insight-icon"><Icon size={18} /></div>
                  <div className="insight-content">
                    <strong>{it.title}</strong>
                    <p>{it.copy}</p>
                    <small>{it.time}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
