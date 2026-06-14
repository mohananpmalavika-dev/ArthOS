import React, {
  memo,
  useEffect,
  useMemo,
  useState,
  lazy,
  Suspense,
  useCallback,
  startTransition
} from "react";
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
  Zap,
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
  WalletCards
} from "lucide-react";
import {
  calculateFinancialHealthV2,
  componentMaximumsV2,
  formatCurrency as formatCurrencyV2,
  formatMonths as formatMonthsV2,
  initOfflineApiQueue
} from "./lib/scoring-v2.js";
import {
  appendScoreHistory,
  appendAssessmentHistory,
  loadScoreHistory,
  loadWeeklyCheckins,
  getProgressSummary,
  calculateConsecutiveStreak
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
import {
  detectBiases as detectCognitiveBiases,
  calculateRiskCalibration
} from "./engines/biasEngine.js";
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
import {
  getUnreadCount,
  addNotification,
  notifyNewMilestones,
  checkCheckinReminder,
  detectAndNotifyScoreChange
} from "./engines/notificationEngine.js";
import {
  initializeUserRetention,
  recordUserReturn,
  recordAssessmentCompletion
} from "./engines/retentionEngine.js";
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
import { PanelMinimizeButton } from "./components/PanelMinimizer.jsx";
import { useSubscription } from "./hooks/useSubscription.js";
import { useAssessmentState } from "./hooks/useAssessmentState.js";
import { useNotificationState } from "./hooks/useNotificationState.js";
import { useHistoricalData } from "./hooks/useHistoricalData.js";
import { useUIState } from "./hooks/useUIState.js";
import {
  recordAssessment,
  getRemainingAssessments,
  getLastAssessmentDate
} from "./lib/assessmentUsageTracker.js";
// App utilities (extracted for modularity)
import {
  makeEmptyAssessment,
  isBrowser,
  isLocalDevHost,
  normalizeV2Assessment,
  normalizeV1Assessment,
  loadInitialAssessment,
  deriveDrivers,
  LazyComponentFallback as UtilLazyComponentFallback,
  STORAGE_KEY,
  ASSESSMENT_SAVE_QUEUE_KEY
} from "./lib/app-utils.jsx";
import {
  loadQueuedAssessmentSaves,
  persistQueuedAssessmentSaves,
  enqueueAssessmentSave,
  flushQueuedAssessmentSaves
} from "./lib/appAssessmentQueue.js";
import {
  buildLiveInsightCards,
  SECTION_ICONS,
  INCOME_STABILITY_OPTIONS,
  DEPENDENTS_OPTIONS
} from "./lib/assessmentCardBuilder.js";
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
const AiCoachInterface = lazy(() => import("./components/AiCoachInterface.jsx"));
const LongitudinalLearningDashboard = lazy(() => import("./components/LongitudinalLearningDashboard.jsx"));
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
import ExportPDF from "./components/ExportPDF.jsx";
import RealityScreen from "./components/RealityScreen.jsx";
import MindDashboard from "./components/MindDashboard.jsx";
import FutureScreen from "./components/FutureScreen.jsx";
import ActionScreen from "./components/ActionScreen.jsx";
import CoachScreen from "./components/CoachScreen.jsx";
import { ConsequenceForecastCard } from "./components/ConsequenceForecastCard.jsx";
import { InterventionsPrescriptionCard } from "./components/InterventionsPrescriptionCard.jsx";
import { StrategicMetricsCard } from "./components/StrategicMetricsCard.jsx";
import DailyCheckinForm from "./components/DailyCheckinForm.jsx";
import Header from "./components/Header.jsx";
import AdminSection from "./components/AdminSection.jsx";
import ReminderPreferences from "./components/ReminderPreferences.jsx";
import DecisionHistory from "./components/DecisionHistory.jsx";
import RecordDecision from "./components/RecordDecision.jsx";
import CollapsiblePanel from "./components/CollapsiblePanel.jsx";
import { AreaChart, Area, XAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import "./premium-report.css";
import "./styles/retention-dashboard.css";

import {
  v2BehaviourQuestions,
  v2AwarenessQuestions,
  v2HabitsQuestions,
  v2DefaultAssessment
} from "./data/questionnaire-v2.js";
import {
  NAV_ITEMS,
  HERO_STATS,
  HERO_ACTIONS,
  ASSESSMENT_BANNER,
  INSIGHT_TITLES,
  ADMIN_LABELS,
  INTELLIGENCE_ROWS,
  BUSINESS_CARDS
} from "./lib/copy.ts";

// Suspense loading fallback (imported from app-utils)
const LazyComponentFallback = UtilLazyComponentFallback;

// Icon registry for intelligence rows
const ICON_REGISTRY = { Network, Zap, Brain };
const intelligenceRows = INTELLIGENCE_ROWS.map(row => ({
  ...row,
  icon: ICON_REGISTRY[row.icon] ?? Network
}));
const businessCards = BUSINESS_CARDS;

const PRODUCT_FLOW_STAGES = [
  {
    hash: "#home",
    aliases: ["#intelligence"],
    label: "Discover",
    caption: "Signal map",
    icon: Sparkles
  },
  {
    hash: "#assessment",
    label: "Assess",
    caption: "Behavior score",
    icon: Brain
  },
  {
    hash: "#reports",
    aliases: ["#cognition"],
    label: "Diagnose",
    caption: "Risk and bias",
    icon: BarChart3
  },
  {
    hash: "#simulator",
    label: "Simulate",
    caption: "Scenario lab",
    icon: Target
  },
  {
    hash: "#decisions",
    label: "Decide",
    caption: "Action ledger",
    icon: ThumbsUp
  },
  {
    hash: "#memory",
    aliases: ["#history"],
    label: "Remember",
    caption: "Learning loop",
    icon: Network
  }
];

function normalizeScore(result) {
  return Math.max(0, Math.min(100, Math.round((result?.healthScore ?? 0) / 10)));
}

function ProductFlowMap({ activeHash = "#home", result }) {
  const currentHash = activeHash || "#home";
  const activeIndex = Math.max(
    0,
    PRODUCT_FLOW_STAGES.findIndex(
      stage => stage.hash === currentHash || stage.aliases?.includes(currentHash)
    )
  );
  const score = normalizeScore(result);
  const category = result?.categoryBand?.label || "Live profile";

  return (
    <section className="flow-command-center" aria-label="Financial intelligence flow">
      <div className="flow-command-summary">
        <span className="flow-command-mark">
          <Sparkles size={18} />
        </span>
        <div>
          <h2>Financial Intelligence Flow</h2>
          <p>Signals, diagnosis, simulation, decisions, and memory in one operating path.</p>
        </div>
      </div>

      <div className="flow-command-metrics" aria-label="Current financial intelligence status">
        <div>
          <span>Live score</span>
          <strong>{score}/100</strong>
        </div>
        <div>
          <span>Risk posture</span>
          <strong>{category}</strong>
        </div>
        <div>
          <span>Current phase</span>
          <strong>{PRODUCT_FLOW_STAGES[activeIndex]?.label}</strong>
        </div>
      </div>

      <div
        className="flow-stage-rail"
        style={{ "--flow-progress": `${(activeIndex / (PRODUCT_FLOW_STAGES.length - 1)) * 100}%` }}
      >
        {PRODUCT_FLOW_STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const active = index === activeIndex;
          const completed = index < activeIndex;

          return (
            <a
              href={stage.hash}
              key={stage.hash}
              className={`flow-stage-node ${active ? "active" : ""} ${
                completed ? "completed" : ""
              }`}
              aria-current={active ? "step" : undefined}
            >
              <span className="flow-stage-icon">
                <Icon size={15} />
              </span>
              <span>
                <strong>{stage.label}</strong>
                <small>{stage.caption}</small>
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function ReportsFlowHeader({ result, decisionHistoryCount, memoryTimeline }) {
  const score = normalizeScore(result);
  const reportSections = [
    {
      href: "#reports",
      label: "Signal",
      caption: "Score and export",
      icon: Sparkles
    },
    {
      href: "#forecast",
      label: "Forecast",
      caption: "Runway and scenarios",
      icon: BarChart3
    },
    {
      href: "#cognition",
      label: "Cognition",
      caption: "Bias and calibration",
      icon: Brain
    },
    {
      href: "#simulator",
      label: "Simulate",
      caption: "What-if choices",
      icon: Target
    },
    {
      href: "#memory",
      label: "Memory",
      caption: "Learning timeline",
      icon: Network
    },
    {
      href: "#insights",
      label: "Action",
      caption: "Next move",
      icon: ThumbsUp
    },
    {
      href: "#decisions",
      label: "Decisions",
      caption: "Decision ledger",
      icon: Save
    }
  ];
  const reportMetrics = [
    {
      label: "Health score",
      value: `${score}/100`,
      detail: result?.categoryBand?.label || "Live profile"
    },
    {
      label: "Survival runway",
      value: result?.survivalMonthsDisplay || `${result?.survivalMonthsRaw ?? 0} mo`,
      detail: "Modeled resilience"
    },
    {
      label: "Decision history",
      value: decisionHistoryCount,
      detail: "Tracked choices"
    },
    {
      label: "Memory events",
      value: memoryTimeline.length,
      detail: "Learning signals"
    }
  ];

  return (
    <section className="flow-report-hero" aria-labelledby="report-flow-title">
      <div className="flow-report-copy">
        <div className="report-eyebrow-row">
          <span>Intelligence report</span>
          <span>Professional flow</span>
        </div>
        <h1 id="report-flow-title">Financial behavior, risk, and next action in one readable flow.</h1>
        <p>
          Start with the strongest signal, then move through forecast, cognition, simulation,
          decision history, and memory without losing context.
        </p>
        <nav className="report-menu-flow" aria-label="Report sections">
          {reportSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <a href={section.href} className="report-menu-step" key={section.href}>
                <span className="report-menu-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="report-menu-icon">
                  <Icon size={18} />
                </span>
                <span className="report-menu-copy">
                  <strong>{section.label}</strong>
                  <small>{section.caption}</small>
                </span>
              </a>
            );
          })}
        </nav>
      </div>
      <div className="flow-kpi-strip">
        {reportMetrics.map(metric => (
          <div className="flow-kpi-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

// Note: buildLiveInsightCards, SECTION_ICONS, INCOME_STABILITY_OPTIONS, DEPENDENTS_OPTIONS
// are now imported from assessmentCardBuilder.js
const sectionIcons = SECTION_ICONS;
const incomeStabilityOptions = INCOME_STABILITY_OPTIONS;
const dependentsOptions = DEPENDENTS_OPTIONS;

// Note: normalizeV2Assessment, normalizeV1Assessment, loadInitialAssessment imported from app-utils.js

export default function App() {
  const { user, token, isAuthenticated, loading: authLoading, logout } = useAuth();

  // Initialize custom hooks for organized state management
  const assessmentState = useAssessmentState();
  const notificationState = useNotificationState();
  const historicalData = useHistoricalData();
  const uiState = useUIState();

  // Destructure for convenient access
  const {
    assessment,
    setAssessment,
    saveState,
    setSaveState,
    queuedSaveCount,
    setQueuedSaveCount,
    isOnline,
    setIsOnline,
    resetTrigger,
    saveStatusLabel,
    saveStatusClass,
    refreshQueuedSaveCount,
    enqueueAssessmentSaveAndRefresh,
    flushQueuedAssessmentSavesAndRefresh
  } = assessmentState;

  const {
    showNotificationPanel,
    setShowNotificationPanel,
    notificationBadgeCount,
    setNotificationBadgeCount,
    newlyUnlockedMilestones,
    setNewlyUnlockedMilestones,
    pendingFollowUps,
    setPendingFollowUps
  } = notificationState;

  const {
    scoreHistory,
    setScoreHistory,
    twinScenarios,
    setTwinScenarios,
    digitalTwin,
    setDigitalTwin,
    weeklyCheckins,
    setWeeklyCheckins,
    historyTimespan,
    setHistoryTimespan,
    memoryTimeline,
    setMemoryTimeline,
    showFullMemoryTimeline,
    setShowFullMemoryTimeline,
    memoryEngine
  } = historicalData;

  const {
    activeHash,
    setActiveHash,
    showOnboarding,
    setShowOnboarding,
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    paywallFeature,
    setPaywallFeature,
    smsEnrichment,
    setSmsEnrichment,
    showSmsForm,
    setShowSmsForm,
    navigateTo,
    completeOnboarding,
    resetOnboarding
  } = uiState;

  // Admin-related states (not yet in hooks - kept for now)
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: "", password: "" });
  const [adminLoginError, setAdminLoginError] = useState("");
  const [adminReport, setAdminReport] = useState(null);

  // Minimize states for panels
  const [minimizeMemoryTimeline, setMinimizeMemoryTimeline] = useState(false);

  // Marketplace and other secondary states (not yet in hooks)
  const [marketplaceRecommendations, setMarketplaceRecommendations] = useState([]);
  const [backendMarketplaceRecommendations, setBackendMarketplaceRecommendations] = useState([]);
  const [backendRiskAlerts, setBackendRiskAlerts] = useState([]);
  const [decisionHistoryCount, setDecisionHistoryCount] = useState(0);
  const [decisionsRefresh, setDecisionsRefresh] = useState(0);

  // Subscription & Paywall Management
  const currentUserId = isAuthenticated && user ? user.id : null;
  const {
    tier,
    subscription,
    loading: subscriptionLoading,
    error: subscriptionError,
    checkFeature,
    checkAssessmentAvailable,
    upgradeSubscription
  } = useSubscription(currentUserId);
  const [showPaywall, setShowPaywall] = useState(false);
  const [remainingAssessments, setRemainingAssessments] = useState(getRemainingAssessments("free"));
  const [nextAvailableAssessmentDate, setNextAvailableAssessmentDate] =
    useState(getLastAssessmentDate());

  const effectiveUserId = currentUserId || assessment.participant?.email || "demo";

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
    if (!isBrowser()) {
      return;
    }

    setRemainingAssessments(getRemainingAssessments(tier));
    setNextAvailableAssessmentDate(getLastAssessmentDate());
  }, [tier, subscriptionLoading]);

  const handleOpenPaywall = feature => {
    setPaywallFeature(feature);
    setShowPaywall(true);
  };

  const handleClosePaywall = () => {
    setPaywallFeature(null);
    setShowPaywall(false);
  };

  const handleUpgradeFromPaywall = async () => {
    const success = await upgradeSubscription("plus");
    if (success) {
      handleClosePaywall();
      setRemainingAssessments(getRemainingAssessments("plus"));
    }
  };

  const handleDismissMilestone = badgeId => {
    setNewlyUnlockedMilestones(current => current.filter(b => b.id !== badgeId));
  };

  // Detect score changes and check milestones each time score updates
  const prevScoreRef = React.useRef(0);
  useEffect(() => {
    if (!isBrowser()) {
      return;
    }
    if (result.healthScore <= 0) {
      return;
    }

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
    if (!isBrowser()) {
      return;
    }
    if (result.healthScore <= 0) {
      return;
    }

    const milestones = checkAndUnlockMilestones({
      currentScore: result.healthScore,
      firstScore: scoreHistory.length > 0 ? scoreHistory[0]?.score : null,
      assessmentCount: scoreHistory.length,
      streak: calculateConsecutiveStreak(weeklyCheckins),
      decisionCount: decisionHistoryCount,
      hasSmsEnrichment: !!smsEnrichment,
      hasTwinSimulation: !!twinScenarios,
      hasDigitalTwin: !!digitalTwin,
      hasPartnerConnection: false
    });

    if (milestones.length > 0) {
      setNewlyUnlockedMilestones(current => [...current, ...milestones]);
      notifyNewMilestones(milestones);
      refreshNotificationCount();
    }
  }, [
    result.healthScore,
    scoreHistory,
    weeklyCheckins,
    decisionHistoryCount,
    smsEnrichment,
    twinScenarios,
    digitalTwin,
    refreshNotificationCount
  ]);

  // When auth state changes, set the email in the assessment participant
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setAssessment(current => ({
        ...current,
        participant: {
          ...current.participant,
          email: user.email,
          name: user.name || current.participant.name
        }
      }));
    }
  }, [isAuthenticated, user?.email, user?.name]);

  useEffect(() => {
    if (!isBrowser()) {
      return;
    }
    setWeeklyCheckins(loadWeeklyCheckins());
    setMemoryTimeline(memoryEngine.getHistory());
  }, [memoryEngine]);

  // Initialize user retention tracking on app load
  useEffect(() => {
    if (!isBrowser()) {
      return;
    }
    const userId = currentUserId || assessment.participant?.email || "demo";
    initializeUserRetention(userId);
  }, [currentUserId, assessment.participant?.email]);

  // Track user activity for retention metrics (max once per day per session)
  useEffect(() => {
    if (!isBrowser()) {
      return;
    }
    const userId = currentUserId || assessment.participant?.email || "demo";

    const handleUserActivity = () => {
      recordUserReturn(userId);
    };

    // Record return on: focus (page becomes visible), clicks, and scroll
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleUserActivity();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("click", handleUserActivity);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("click", handleUserActivity);
    };
  }, [currentUserId, assessment.participant?.email]);

  useEffect(() => {
    if (!isBrowser()) {
      return;
    }
    const userId = currentUserId || assessment.participant?.email || "demo";
    void fetch(`/api/decision?userId=${encodeURIComponent(userId)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("API returned non-JSON response");
        }
        return response.json();
      })
      .then(data => {
        setDecisionHistoryCount(Array.isArray(data.decisions) ? data.decisions.length : 0);
      })
      .catch(err => {
        console.error("Error fetching decision history:", err);
        setDecisionHistoryCount(0);
      });
  }, [currentUserId, assessment.participant?.email, decisionsRefresh]);

  // Fetch pending follow-ups when user is authenticated
  useEffect(() => {
    if (!isBrowser() || !currentUserId) {
      return;
    }
    void fetch(`/api/follow-up/pending?userId=${encodeURIComponent(currentUserId)}`, {
      headers: { "x-user-id": currentUserId }
    })
      .then(response => {
        // Check if response is ok and is JSON
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("API returned non-JSON response");
        }
        return response.json();
      })
      .then(data => {
        if (data.followUps && Array.isArray(data.followUps)) {
          setPendingFollowUps(data.followUps);
        }
      })
      .catch(e => {
        console.error("Error fetching follow-ups:", e);
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
        savings:
          Number(assessment.profile.emergencySavingsFixed || 0) +
          Number(assessment.profile.emergencySavingsDiscretionary || 0)
      })
    );
  }, [assessment.profile, assessment.behaviour]);

  // Detect and archive orphaned assessment sessions (user left mid-assessment)
  useEffect(() => {
    if (!isBrowser()) {
      return;
    }
    archiveOrphanedSession();
  }, []);

  useEffect(() => {
    if (!isBrowser()) {
      return;
    }

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

  // Onboarding completion is handled by useUIState hook
  // completeOnboarding is available from uiState and manages both state and localStorage

  const dismissOnboarding = () => {
    completeOnboarding();
  };

  useEffect(() => {
    if (!isBrowser()) {
      return;
    }

    const payload = {
      user: {
        ...assessment.profile,
        ...assessment.behaviour,
        survivalMonths: result.survivalMonthsRaw
      },
      profile: assessment.profile
    };

    void fetch("/api/risk-opportunity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("API returned non-JSON response");
        }
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data.alerts)) {
          setBackendRiskAlerts(data.alerts);
        }
        if (Array.isArray(data.recommendations)) {
          setBackendMarketplaceRecommendations(data.recommendations);
        }
      })
      .catch(err => {
        console.error("Error fetching risk-opportunity:", err);
        setBackendRiskAlerts([]);
      });
  }, [assessment.profile, assessment.behaviour, result.survivalMonthsRaw]);

  const cognitionProfile = useMemo(
    () =>
      buildCognitionProfile({
        ...assessment.profile,
        ...assessment.behaviour,
        ...assessment.awareness
      }),
    [assessment.profile, assessment.behaviour, assessment.awareness]
  );
  const biasProfile = useMemo(
    () =>
      detectCognitiveBiases({
        ...assessment.profile,
        ...assessment.behaviour,
        ...assessment.awareness
      }),
    [assessment.profile, assessment.behaviour, assessment.awareness]
  );
  const futureRisk = useMemo(() => detectFutureRisk(assessment.profile), [assessment.profile]);
  const riskCalibration = useMemo(
    () =>
      calculateRiskCalibration(
        cognitionProfile.riskCalibration.perceivedRisk,
        cognitionProfile.riskCalibration.actualRisk
      ),
    [cognitionProfile.riskCalibration.perceivedRisk, cognitionProfile.riskCalibration.actualRisk]
  );
  const habitProgress = useMemo(() => evaluateHabitProgress(weeklyCheckins), [weeklyCheckins]);
  const forecastHealthValues = useMemo(() => {
    return forecastHealth(
      result.healthScore,
      Math.round(habitProgress.score / 8),
      scoreHistory.length,
      decisionHistoryCount
    );
  }, [result.healthScore, habitProgress.score, scoreHistory.length, decisionHistoryCount]);

  // New: Prediction Engine (multi-model ensemble) forecasts
  const predictionEngineForecast = useMemo(() => {
    try {
      return predictionEngineForecastHealth(
        result.healthScore,
        scoreHistory.map(s => s.score || s),
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
    () =>
      trackGoalEvolution(
        assessment.profile.previousGoal ||
          assessment.profile.goal ||
          assessment.profile.goalDescription,
        assessment.profile.currentGoal ||
          assessment.profile.goal ||
          assessment.profile.goalDescription
      ),
    [
      assessment.profile.previousGoal,
      assessment.profile.goal,
      assessment.profile.goalDescription,
      assessment.profile.currentGoal
    ]
  );
  const trajectoryNarrative = useMemo(() => buildTrajectoryNarrative(scoreHistory), [scoreHistory]);
  const riskAlerts = useMemo(
    () =>
      generateAlerts({
        ...assessment.profile,
        ...assessment.behaviour,
        survivalMonths: result.survivalMonthsRaw
      }),
    [assessment.profile, assessment.behaviour, result.survivalMonthsRaw]
  );
  const displayedRiskAlerts = useMemo(
    () => (backendRiskAlerts.length > 0 ? backendRiskAlerts : riskAlerts),
    [backendRiskAlerts, riskAlerts]
  );
  const fullMemoryEvents = useMemo(() => [...memoryTimeline].reverse(), [memoryTimeline]);
  const displayedMemoryEvents = useMemo(() => {
    return showFullMemoryTimeline ? fullMemoryEvents : fullMemoryEvents.slice(0, 3);
  }, [fullMemoryEvents, showFullMemoryTimeline]);

  const moneyBeliefs = useMemo(
    () =>
      deriveMoneyBeliefs({
        ...assessment.profile,
        ...assessment.behaviour
      }),
    [assessment.profile, assessment.behaviour]
  );

  const emotionalTriggers = useMemo(
    () =>
      detectTriggers({
        ...assessment.profile,
        ...assessment.behaviour
      }),
    [assessment.profile, assessment.behaviour]
  );

  const triggerPatterns = useMemo(
    () => identifyTriggerPatterns(emotionalTriggers, weeklyCheckins),
    [emotionalTriggers, weeklyCheckins]
  );

  const financialCognitionGraph = useMemo(() => {
    const graph = new FinancialCognitionGraph();
    graph.beliefs = moneyBeliefs.beliefs || [];
    graph.biases = [
      { id: "presentBias", value: biasProfile.presentBias },
      { id: "lossAversion", value: biasProfile.lossAversion },
      { id: "optimismBias", value: biasProfile.optimismBias }
    ].filter(item => item.value !== undefined);
    graph.emotions = Object.entries(emotionalTriggers || {})
      .filter(([key, value]) => typeof value === "number" && value > 0)
      .map(([key, value]) => ({ id: key, value }));
    graph.decisions = [
      { id: "spendWhenStressed", value: assessment.behaviour.spendWhenStressed || null },
      { id: "regretImpulseFreq", value: assessment.behaviour.regretImpulseFreq || null }
    ].filter(item => item.value !== null);
    graph.outcomes = [{ id: "healthScore", value: result.healthScore }];
    graph.connect("beliefs", "biases");
    graph.connect("biases", "emotions");
    graph.connect("emotions", "decisions");
    graph.connect("decisions", "outcomes");
    return graph;
  }, [
    moneyBeliefs.beliefs,
    biasProfile,
    emotionalTriggers,
    assessment.behaviour,
    result.healthScore
  ]);

  const cognitionGraphData = useMemo(() => {
    const nodes = [];
    const addGroup = (items, group) => {
      (Array.isArray(items) ? items : []).forEach((item, index) => {
        const id = `${group}-${item.id || index}`;
        nodes.push({
          id,
          title: item.label || item.id || `${group} ${index + 1}`,
          group
        });
      });
    };

    addGroup(financialCognitionGraph.beliefs, "beliefs");
    addGroup(financialCognitionGraph.biases, "biases");
    addGroup(financialCognitionGraph.emotions, "emotions");
    addGroup(financialCognitionGraph.decisions, "decisions");
    addGroup(financialCognitionGraph.outcomes, "outcomes");

    const edges = (financialCognitionGraph.connections || []).map((connection, index) => ({
      source: connection.source,
      target: connection.target,
      id: `edge-${index}`
    }));

    return { nodes, edges };
  }, [financialCognitionGraph]);

  const financialMindProfile = useMemo(() => {
    const profile = new FinancialMindProfile({
      userId: assessment.participant?.email || "anonymous"
    });
    if (moneyBeliefs.beliefs) {
      moneyBeliefs.beliefs.forEach(b => profile.addBelief(b));
    }
    profile.updateBiases(biasProfile);
    profile.updateEmotionalTriggers(emotionalTriggers);
    return profile;
  }, [moneyBeliefs.beliefs, biasProfile, emotionalTriggers, assessment.participant?.email]);

  const scoreProgress = useMemo(() => getProgressSummary(scoreHistory), [scoreHistory]);

  useEffect(() => {
    if (!isBrowser()) {
      return;
    }
    const history = loadScoreHistory();
    setScoreHistory(history);
  }, []);

  useEffect(() => {
    if (!isBrowser()) {
      return;
    }
    if (typeof result?.healthScore !== "number" || Number.isNaN(result.healthScore)) {
      return;
    }
    if (result.healthScore <= 0) {
      return;
    }

    const updatedHistory = appendScoreHistory(result.healthScore);
    setScoreHistory(updatedHistory);
    appendAssessmentHistory(result);

    // Record assessment completion for retention metrics
    const userId = currentUserId || assessment.participant?.email || "demo";
    recordAssessmentCompletion(userId);

    memoryEngine.addEvent({
      type: "assessment_result",
      score: result.healthScore,
      personalityType: result.personalityType,
      stabilityMonths: result.survivalMonthsRaw,
      source: "assessment"
    });
    memoryEngine.addEvent({
      type: "trajectory_snapshot",
      score: result.healthScore,
      date: new Date().toISOString()
    });
    setMemoryTimeline(memoryEngine.getHistory());
    setTwinScenarios(buildFinancialTwinScenarios(result, assessment.profile));

    // Build complete digital twin for simulation and forecasting
    const completeTwin = buildCompleteTwin(result, assessment.profile, {
      assessments: [result],
      history: memoryEngine.getHistory()
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
      habits: true
    }
  };

  const reportRoutes = [
    "#reports",
    "#cognition",
    "#simulator",
    "#decisions",
    "#memory",
    "#history"
  ];
  const isWorkflowRoute = activeHash === "#assessment" || activeHash === "#simulator";
  const isReportsRoute = reportRoutes.includes(activeHash);
  const showHeroSection =
    activeHash === "#home" ||
    activeHash === "#intelligence" ||
    (!isWorkflowRoute && !isReportsRoute);
  const showAssessmentSection = activeHash === "#assessment";
  const showReportsSection = isReportsRoute;

  function updateGroup(group, key, value) {
    setAssessment(current => ({
      ...current,
      [group]: {
        ...current[group],
        [key]: value
      }
    }));
    setSaveState("Unsaved");
  }

  function saveAssessment() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assessment));
    } catch (e) {
      console.warn("Could not save locally:", e);
    }

    if (tier === "free" && !checkAssessmentAvailable()) {
      window.alert(
        "Free tier assessments are limited to one per month. Upgrade to Plus for unlimited assessments."
      );
      handleOpenPaywall("unlimited_assessments");
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

      // Build headers with JWT token for authenticated users
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      fetch("/api/saveAssessment", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      })
        .then(async resp => {
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

          if (tier === "free") {
            recordAssessment();
            setRemainingAssessments(getRemainingAssessments("free"));
            setNextAvailableAssessmentDate(getLastAssessmentDate());
          }

          console.log("Remote save response:", resp.status, body);
        })
        .catch(err => {
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
      createdAt: new Date().toISOString()
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
    setResetTrigger(current => current + 1);
  }

  function handleSmsEnrichment(signals, transactions) {
    const behaviourUpdates = mapSignalsToBehaviour(signals);
    setSmsEnrichment({ signals, transactions, behaviourUpdates });
    setShowSmsForm(false);
    if (signals) {
      setAssessment(current => ({
        ...current,
        behaviour: {
          ...current.behaviour,
          ...behaviourUpdates
        }
      }));
      setSaveState("Unsaved");
    }
  }

  function handleDailyCheckin({ behaviourUpdates }) {
    if (!behaviourUpdates) {
      return;
    }
    setAssessment(current => ({
      ...current,
      behaviour: {
        ...current.behaviour,
        ...behaviourUpdates
      }
    }));
    setSaveState("Unsaved");
  }

  function exportReport() {
    if (!isBrowser()) {
      return;
    }
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
        onToggleNotification={() => setShowNotificationPanel(prev => !prev)}
      />

      {!showAuthModal && (
        <FlowNavigation
          activeHash={activeHash}
          onNavigate={hash => {
            startTransition(() => {
              setActiveHash(hash);
              window.location.hash = hash;
            });
          }}
        />
      )}

      {!showAuthModal && <ProductFlowMap activeHash={activeHash} result={result} />}

      <NotificationPanel
        isOpen={showNotificationPanel}
        onClose={() => setShowNotificationPanel(false)}
      />

      <NotificationToast />

      {showOnboarding && <OnboardingOverlay onComplete={dismissOnboarding} />}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="auth-modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-container" onClick={e => e.stopPropagation()}>
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
            <B2BPartnerPortal userId={effectiveUserId} assessment={assessment} />
          </Suspense>
        ) : activeHash === "#predictions" ? (
          <Suspense fallback={<LazyComponentFallback />}>
            <ErrorBoundary>
              <PredictionEngineDashboard userId={effectiveUserId} />
            </ErrorBoundary>
          </Suspense>
        ) : activeHash === "#ai-coach" ? (
          <Suspense fallback={<LazyComponentFallback />}>
            <ErrorBoundary>
              <AiCoachInterface userId={effectiveUserId} />
            </ErrorBoundary>
          </Suspense>
        ) : activeHash === "#longitudinal" ? (
          <Suspense fallback={<LazyComponentFallback />}>
            <ErrorBoundary>
              <LongitudinalLearningDashboard userId={effectiveUserId} />
            </ErrorBoundary>
          </Suspense>
        ) : activeHash === "#reality" ? (
          <RealityScreen result={result} assessment={assessment} />
        ) : activeHash === "#mind" ? (
          <MindDashboard
            result={result}
            moneyBeliefs={moneyBeliefs}
            biasProfile={biasProfile}
            emotionalTriggers={emotionalTriggers}
            financialMindProfile={financialMindProfile}
          />
        ) : activeHash === "#future" ? (
          <FutureScreen result={result} assessment={assessment} />
        ) : activeHash === "#action" ? (
          <ActionScreen
            result={result}
            assessment={assessment}
            onAssessmentUpdate={(updates) => updateGroup('behaviour', null, updates)}
          />
        ) : activeHash === "#coach" ? (
          <CoachScreen userId={effectiveUserId} result={result} assessment={assessment} />
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
            {showHeroSection && <HeroSection assessment={assessment} result={result} />}
            {showAssessmentSection && (
              <ErrorBoundary>
                {tier === "free" && remainingAssessments === 0 && (
                  <AssessmentLimitNotice
                    tier={tier}
                    remaining={remainingAssessments}
                    nextAvailableDate={nextAvailableAssessmentDate}
                    onUpgradeClick={() => handleOpenPaywall("unlimited_assessments")}
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
              <section
                className="premium-inline-badge-wrap"
                style={{ maxWidth: "1200px", margin: "20px auto", padding: "0 16px" }}
              >
                <div className="premium-success-badge">
                  ✓ Your assessment has been enriched with {smsEnrichment.transactions?.length || 0}{" "}
                  banking transactions
                </div>
              </section>
            )}

            {showReportsSection && (
              <>
                <ReportsFlowHeader
                  result={result}
                  decisionHistoryCount={decisionHistoryCount}
                  memoryTimeline={memoryTimeline}
                />
                <section className="assessment-summary-grid flow-report-grid" id="reports">
                  <div className="summary-main-column">
                  {/* MOST IMPORTANT INSIGHT — Center of the MVP Experience */}
                  <Suspense fallback={<LazyComponentFallback />}>
                    <ErrorBoundary>
                      <SingleMostImportantInsight
                        assessmentResult={result}
                        assessment={assessment}
                      />
                    </ErrorBoundary>
                  </Suspense>

                  {/* PDF EXPORT — Save Results */}
                  <section className="summary-card">
                    <ExportPDF result={result} assessmentData={assessment} />
                  </section>

                  {/* ACTION FOLLOW-UP PANEL — Day 7 & Day 30 Check-Ins */}
                  <Suspense fallback={<LazyComponentFallback />}>
                    <ErrorBoundary>
                      <ActionFollowUpPanel userId={currentUserId} followUps={pendingFollowUps} />
                    </ErrorBoundary>
                  </Suspense>

                  {result ? (
                    <Suspense fallback={<LazyComponentFallback />}>
                      <ErrorBoundary>
                        <AnalyticsDashboard result={result} />
                      </ErrorBoundary>
                    </Suspense>
                  ) : (
                    <div className="summary-card">
                      <p>Analytics unavailable — complete an assessment to populate insights.</p>
                    </div>
                  )}

                  {/* Retention & Cohort Analytics Dashboard */}
                  {result ? (
                    <Suspense fallback={<LazyComponentFallback />}>
                      <ErrorBoundary>
                        <RetentionDashboard result={result} />
                      </ErrorBoundary>
                    </Suspense>
                  ) : (
                    <div className="summary-card">
                      <p>Retention analytics unavailable — complete an assessment to enable.</p>
                    </div>
                  )}

                  {/* Assessment Completion Rate Dashboard */}
                  {result ? (
                    <Suspense fallback={<LazyComponentFallback />}>
                      <ErrorBoundary>
                        <CompletionDashboard result={result} />
                      </ErrorBoundary>
                    </Suspense>
                  ) : (
                    <div className="summary-card">
                      <p>Completion metrics unavailable — complete an assessment to populate.</p>
                    </div>
                  )}

                  {currentUserId && (
                    <section className="summary-card">
                      <SubscriptionManagement userId={currentUserId} />
                    </section>
                  )}

                  {/* Digital Twin Dashboard - Flight Simulator for Financial Life */}
                  {digitalTwin ? (
                    <Suspense fallback={<LazyComponentFallback />}>
                      <ErrorBoundary>
                        <DigitalTwinDashboard twin={digitalTwin} assessment={result} />
                      </ErrorBoundary>
                    </Suspense>
                  ) : (
                    <div className="summary-card">
                      <p>Digital Twin unavailable — run an assessment to build your twin.</p>
                    </div>
                  )}

                  <CollapsiblePanel
                    className="summary-card"
                    headerClassName="premium-report-section-header"
                    titleClassName="premium-report-section-title"
                    title="Financial Roast"
                    icon={<Zap size={20} />}
                  >
                    <div className="premium-report-section-header">
                      <h2 className="premium-report-section-title">🔥 Financial Roast</h2>
                    </div>
                    <SalaryRoastGenerator assessmentResult={result} profile={assessment.profile} />
                  </CollapsiblePanel>
                  <CollapsiblePanel
                    id="forecast"
                    className="summary-card"
                    headerClassName="premium-report-section-header"
                    titleClassName="premium-report-section-title"
                    subtitleClassName="premium-report-block-subtitle"
                    title="Financial Forecast"
                    subtitle="GBM Monte Carlo projections with stress test scenarios."
                    icon={<BarChart3 size={20} />}
                  >
                    <div className="premium-report-section-header">
                      <h2 className="premium-report-section-title">📊 Financial Forecast</h2>
                      <p className="premium-report-block-subtitle">
                        GBM Monte Carlo projections with stress test scenarios.
                      </p>
                    </div>
                    <ScenarioForecast
                      profile={assessment.profile}
                      assessmentResult={result}
                      predictionEngineForecast={predictionEngineForecast}
                    />
                  </CollapsiblePanel>
                  <CollapsiblePanel
                    className="summary-card"
                    headerClassName="premium-report-section-header"
                    titleClassName="premium-report-section-title"
                    subtitleClassName="premium-report-block-subtitle"
                    title="Multi-Model Ensemble Forecast"
                    subtitle="Auto-selected best model from ARIMA, Holt-Winters, Bayesian Structural, and Ensemble."
                    icon={<Brain size={20} />}
                  >
                    <div className="premium-report-section-header">
                      <h2 className="premium-report-section-title">
                        🤖 Multi-Model Ensemble Forecast
                      </h2>
                      <p className="premium-report-block-subtitle">
                        Auto-selected best model from ARIMA · Holt-Winters · Bayesian Structural ·
                        Ensemble
                      </p>
                    </div>
                    {predictionEngineForecast && predictionEngineForecast.horizons && predictionEngineForecast.horizons.day30 ? (
                      <Suspense fallback={<LazyComponentFallback />}>
                        <ErrorBoundary>
                          <ForecastModelCard forecast={predictionEngineForecast} />
                        </ErrorBoundary>
                      </Suspense>
                    ) : (
                      <div className="forecast-empty-state">
                        <p>Forecast unavailable — complete an assessment to generate model forecasts.</p>
                      </div>
                    )}
                  </CollapsiblePanel>
                  <section className="summary-card premium-report-block" id="cognition">
                    <div className="premium-report-block-header">
                      <h2 className="premium-report-block-title">🧠 Cognition & Future Risk</h2>
                      <p className="premium-report-block-subtitle">
                        See your cognitive calibration, runway risk, and forecasted health
                        trajectory.
                      </p>
                    </div>
                    <div className="premium-report-grid">
                      <div className="premium-report-grid-2">
                        <div className="premium-metric-tile">
                          <div className="premium-metric-kicker">Calibration gap</div>
                          <div className="premium-metric-value">
                            {riskCalibration.calibrationGap}%
                          </div>
                          <div className="premium-metric-desc">
                            Perceived vs. actual risk alignment.
                          </div>
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
                          <div className="premium-metric-value">
                            {forecastHealthValues.day30?.p50 ?? "—"}
                          </div>
                          <div className="premium-metric-desc">
                            Range: {forecastHealthValues.day30?.p25 ?? "—"}–
                            {forecastHealthValues.day30?.p75 ?? "—"}
                          </div>
                        </div>
                        <div className="premium-metric-tile">
                          <div className="premium-metric-kicker">90 day health (p50)</div>
                          <div className="premium-metric-value">
                            {forecastHealthValues.day90?.p50 ?? "—"}
                          </div>
                          <div className="premium-metric-desc">
                            Range: {forecastHealthValues.day90?.p25 ?? "—"}–
                            {forecastHealthValues.day90?.p75 ?? "—"}
                          </div>
                        </div>
                        <div className="premium-metric-tile">
                          <div className="premium-metric-kicker">180 day health (p50)</div>
                          <div className="premium-metric-value">
                            {forecastHealthValues.day180?.p50 ?? "—"}
                          </div>
                          <div className="premium-metric-desc">
                            Range: {forecastHealthValues.day180?.p25 ?? "—"}–
                            {forecastHealthValues.day180?.p75 ?? "—"}
                          </div>
                        </div>
                      </div>
                      <div className="premium-report-grid-2">
                        <div className="premium-metric-tile">
                          <div className="premium-metric-kicker">Forecast confidence</div>
                          <div className="premium-metric-value">
                            {forecastHealthValues.confidence}%
                          </div>
                          <div className="premium-metric-desc">
                            Based on {scoreHistory.length} historical datapoints and{" "}
                            {decisionHistoryCount} decisions tracked.
                          </div>
                        </div>
                        <div className="premium-metric-tile">
                          <div className="premium-metric-kicker">Cognitive bias load</div>
                          <div className="premium-metric-value">
                            {Math.round(
                              (biasProfile.presentBias +
                                biasProfile.lossAversion +
                                biasProfile.optimismBias +
                                biasProfile.anchoringBias +
                                biasProfile.sunkCostBias) /
                                5
                            )}
                            %
                          </div>
                          <div className="premium-metric-desc">
                            Average exposure across your core bias dimensions.
                          </div>
                        </div>
                        <div className="premium-metric-tile">
                          <div className="premium-metric-kicker">Opportunity forecast</div>
                          <div className="premium-metric-value premium-metric-value-compact">
                            {opportunity.action}
                          </div>
                          <div className="premium-metric-desc">{opportunity.benefit}</div>
                        </div>
                      </div>
                      <div className="premium-report-grid-2">
                        <div className="premium-metric-tile">
                          <div className="premium-metric-kicker">Cognition graph</div>
                          <div className="premium-metric-value">
                            {financialCognitionGraph.beliefs.length +
                              financialCognitionGraph.biases.length +
                              financialCognitionGraph.emotions.length +
                              financialCognitionGraph.decisions.length +
                              financialCognitionGraph.outcomes.length}{" "}
                            elements
                          </div>
                          <div className="premium-metric-desc">
                            {financialCognitionGraph.connections.length} connections modeling belief
                            → bias → outcome.
                          </div>
                        </div>
                        <div className="premium-metric-tile">
                          <div className="premium-metric-kicker">Risk calibration</div>
                          <div className="premium-metric-value">
                            {riskCalibration.calibrated ? "Aligned" : "Misaligned"}
                          </div>
                          <div className="premium-metric-desc">
                            Perception gap is {riskCalibration.calibrationGap}%.
                          </div>
                        </div>
                      </div>
                      <div className="premium-metric-tile premium-metric-tile-wide">
                        <strong className="premium-metric-heading">
                          Risk & opportunity alerts
                        </strong>
                        <ul className="risk-alert-list">
                          {displayedRiskAlerts.map((alert, index) => (
                            <li
                              key={`${alert.type}-${index}`}
                              className={`risk-alert risk-alert-${alert.type}`}
                            >
                              <strong>{alert.title}</strong>
                              <span>{alert.message}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {(backendMarketplaceRecommendations.length > 0 ||
                        marketplaceRecommendations.length > 0) && (
                        <div className="premium-metric-tile premium-metric-tile-wide">
                          <strong className="premium-metric-heading">
                            Marketplace recommendations
                          </strong>
                          <p className="premium-metric-longtext">
                            {backendMarketplaceRecommendations.length > 0
                              ? backendMarketplaceRecommendations
                                  .map(provider => provider.name)
                                  .join(", ")
                              : marketplaceRecommendations
                                  .map(provider => provider.name)
                                  .join(", ")}
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
                          <CognitionGraphView
                            nodes={cognitionGraphData.nodes}
                            edges={cognitionGraphData.edges}
                          />
                        </Suspense>
                      </div>
                      <div className="premium-metric-tile premium-metric-tile-wide">
                        <strong className="premium-metric-heading">Unified memory</strong>
                        <p className="premium-metric-longtext">
                          {memoryTimeline.length} memory events stored across your financial
                          history.
                        </p>
                        {displayedMemoryEvents.length > 0 ? (
                          <>
                            <ul className="memory-timeline-list">
                              {displayedMemoryEvents.map((event, index) => (
                                <li key={`${event.type}-${event.timestamp}-${index}`}>
                                  <strong>{event.type.replaceAll("_", " ")}</strong>:{" "}
                                  {event.score !== undefined
                                    ? `score ${event.score}`
                                    : event.name || event.description || "event recorded"}
                                  <span> · {new Date(event.timestamp).toLocaleDateString()}</span>
                                </li>
                              ))}
                            </ul>
                            {memoryTimeline.length > 3 && (
                              <button
                                type="button"
                                className="memory-toggle-button"
                                onClick={() => setShowFullMemoryTimeline(current => !current)}
                              >
                                {showFullMemoryTimeline
                                  ? "Show recent events"
                                  : "View full memory timeline"}
                              </button>
                            )}
                          </>
                        ) : (
                          <p className="premium-metric-longtext">
                            Complete an assessment to start building your financial memory timeline.
                          </p>
                        )}
                      </div>
                      {marketplaceRecommendations.length > 0 && (
                        <div className="premium-metric-tile premium-metric-tile-wide">
                          <strong className="premium-metric-heading">OS marketplace</strong>
                          <p className="premium-metric-longtext">
                            Recommended providers:{" "}
                            {marketplaceRecommendations.map(provider => provider.name).join(", ")}.
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
                    <EmotionalTriggersCard
                      triggers={emotionalTriggers}
                      patterns={triggerPatterns}
                    />
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
                        <span>
                          Signed in as <strong>{user?.name || user?.email}</strong>
                        </span>
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
                            onClick={() => {
                              setAuthMode("login");
                              setShowAuthModal(true);
                            }}
                          >
                            Sign in
                          </button>{" "}
                          or{" "}
                          <button
                            type="button"
                            className="auth-link-btn"
                            onClick={() => {
                              setAuthMode("register");
                              setShowAuthModal(true);
                            }}
                          >
                            create an account
                          </button>{" "}
                          to persist data across devices
                        </span>
                      </div>
                    </div>
                  )}
                  <UpgradeJourney result={result} currentScore={result.healthScore} />
                  {!showSmsForm && !smsEnrichment && (
                    <section className="enrichment-banner">
                      <p className="enrichment-banner-title">{ASSESSMENT_BANNER.title}</p>
                      <button
                        type="button"
                        className="enrichment-button"
                        onClick={() => setShowSmsForm(true)}
                      >
                        {ASSESSMENT_BANNER.cta}
                      </button>
                      <p className="enrichment-copy">{ASSESSMENT_BANNER.description}</p>
                    </section>
                  )}

                  <section className="summary-card padded" style={{ marginTop: "18px" }}>
                    <PartnerSdkDemo userId={effectiveUserId} assessment={assessment} />
                  </section>
                </div>

                <section id="memory" className="summary-span">
                  <div className={`summary-card ${minimizeMemoryTimeline ? 'is-minimized' : ''}`}>
                    <div className="premium-report-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <h2 className="premium-report-section-title">🧠 Memory Timeline</h2>
                        {!minimizeMemoryTimeline && (
                          <p className="premium-report-block-subtitle">
                            A dedicated memory view for your recorded financial events, reflections and
                            decision milestones.
                          </p>
                        )}
                      </div>
                      <PanelMinimizeButton
                        isMinimized={minimizeMemoryTimeline}
                        onToggle={() => setMinimizeMemoryTimeline(!minimizeMemoryTimeline)}
                        title="Memory Timeline"
                      />
                    </div>
                    {!minimizeMemoryTimeline && (
                      <>
                        {memoryTimeline.length > 0 ? (
                          <>
                            <div className="premium-report-grid-2">
                              <div className="premium-metric-tile">
                                <div className="premium-metric-kicker">Memory events</div>
                                <div className="premium-metric-value">{memoryTimeline.length}</div>
                                <div className="premium-metric-desc">
                                  Events captured from assessments, forecasts, and decisions.
                                </div>
                              </div>
                              <div className="premium-metric-tile">
                                <div className="premium-metric-kicker">Latest entry</div>
                                <div className="premium-metric-value">
                                  {new Date(
                                    fullMemoryEvents[0]?.timestamp || Date.now()
                                  ).toLocaleDateString()}
                                </div>
                                <div className="premium-metric-desc">
                                  Most recent financial memory update.
                                </div>
                              </div>
                            </div>
                            <ul className="memory-timeline-list memory-timeline-page-list">
                              {fullMemoryEvents.map((event, index) => (
                                <li key={`${event.type}-${event.timestamp}-${index}`}>
                                  <strong>{event.type.replaceAll("_", " ")}</strong>
                                  <span>
                                    {event.score !== undefined
                                      ? `Score ${event.score}`
                                      : event.name || event.description || "Event recorded"}
                                  </span>
                                  <span>
                                    {new Date(event.timestamp).toLocaleDateString()} ·{" "}
                                    {new Date(event.timestamp).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p className="premium-metric-longtext">
                            No financial memory events yet. Keep using the app to build a richer
                            timeline of your financial journey.
                          </p>
                        )}
                      </>
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
                  <CollapsiblePanel
                    className="summary-card premium-report-block"
                    headerClassName="premium-report-block-header"
                    titleClassName="premium-report-block-title"
                    subtitleClassName="premium-report-block-subtitle"
                    title={INSIGHT_TITLES.narrativeTitle}
                    subtitle={INSIGHT_TITLES.narrativeSubtitle}
                    icon={<Sparkles size={20} />}
                  >
                    <div className="premium-report-block-header">
                      <h2 className="premium-report-block-title">
                        {INSIGHT_TITLES.narrativeTitle}
                      </h2>
                      <p className="premium-report-block-subtitle">
                        {INSIGHT_TITLES.narrativeSubtitle}
                      </p>
                    </div>
                    <ErrorBoundary>
                      <EnhancedInsightNarrative assessmentResult={result} assessment={assessment} />
                    </ErrorBoundary>
                  </CollapsiblePanel>
                </section>
                </section>
              </>
            )}

            {showReportsSection && (
              <div className="flow-insights-section" id="insights">
                <div className="diagnostics-grid">
                  <SurvivalHero survivalMonths={result.survivalMonthsRaw} />
                  <CognitionGapCard
                    perceived={result.awarenessGapDisplay}
                    actual={result.survivalMonthsDisplay}
                  />
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
                <CollapsiblePanel
                  id="decisions"
                  className="summary-card premium-report-block decision-overview-section"
                  headerClassName="premium-report-block-header"
                  titleClassName="premium-report-block-title"
                  subtitleClassName="premium-report-block-subtitle"
                  title="Decisions"
                  subtitle="Track your choices, review recent outcomes, and keep decision-making aligned to your financial goals."
                  icon={<Target size={20} />}
                >
                  <div className="premium-report-block-header">
                    <h2 className="premium-report-block-title">Decisions</h2>
                    <p className="premium-report-block-subtitle">
                      Track your choices, review recent outcomes, and keep decision-making aligned
                      to your financial goals.
                    </p>
                  </div>
                  <div className="decision-section-grid">
                    <DecisionHistory userId={effectiveUserId} refreshSignal={decisionsRefresh} />
                    <RecordDecision
                      userId={effectiveUserId}
                      onSaved={() => {
                        setDecisionsRefresh(c => c + 1);
                      }}
                    />
                  </div>
                </CollapsiblePanel>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Note: deriveDrivers imported from app-utils.js

function ScoreRing({ score }) {
  const normalizedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const ringData = [{ value: normalizedScore }, { value: 100 - normalizedScore }];

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
  if (!result) {
    return null;
  }

  const behaviourPct = Math.min(
    100,
    Math.round((result.behaviourScore / componentMaximumsV2.behaviour) * 100)
  );
  const awarenessPct = Math.min(
    100,
    Math.round((result.awarenessScore / componentMaximumsV2.awareness) * 100)
  );
  const stabilityPct = Math.min(
    100,
    Math.round((result.stabilityScore / componentMaximumsV2.stability) * 100)
  );

  const dnaMetrics = [
    { label: "Behavioral Control", value: behaviourPct },
    { label: "Awareness Clarity", value: awarenessPct },
    { label: "Financial Stability", value: stabilityPct }
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
        {dnaMetrics.map(item => (
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
    { month: "Today", healthScore: currentScore }
  ];

  return (
    <CollapsiblePanel
      className="journey-card"
      headerClassName="result-heading"
      title="Progress Journey"
      subtitle="How your financial strength is trending"
      icon={<TrendingUp size={19} />}
    >
      <div className="journey-chart-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={journeyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="journeyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--purple)" stopOpacity={0.7} />
                <stop offset="100%" stopColor="var(--purple)" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--white-76)", fontSize: 12 }}
            />
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
    </CollapsiblePanel>
  );
}



const sIcons = { behaviour: Brain, awareness: BarChart3, stability: ShieldCheck };

function HeroSection({ assessment, result }) {
  if (!result || !result.healthScore) {
    return null;
  }

  const scorePreview = Math.max(0, Math.min(100, Math.round((result.healthScore ?? 0) / 10)));
  const scoreLabel = result.categoryBand?.label;
  const liveInsights = buildLiveInsightCards(result, assessment);
  const metricRows = [
    {
      label: "Financial Health Behavior Score",
      value: scorePreview,
      width: `${scorePreview}%`
    },
    {
      label: "Behavior Control",
      value: Math.round(result.behaviourScore ?? 0),
      width: `${Math.min(100, ((result.behaviourScore ?? 0) / componentMaximumsV2.behaviour) * 100)}%`
    },
    {
      label: "Awareness Signal",
      value: Math.round(result.awarenessScore ?? 0),
      width: `${Math.min(100, ((result.awarenessScore ?? 0) / componentMaximumsV2.awareness) * 100)}%`
    }
  ];
  const perceivedRunway = Number(result.blindSpotPerceived);
  const actualRunway = Number(result.blindSpotActual);
  const blindSpot = Number(result.blindSpotGap);
  const hasBlindSpotData = !isNaN(perceivedRunway) && !isNaN(actualRunway) && !isNaN(blindSpot);

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
            {HERO_STATS.map(item => (
              <div className="metric" key={item.label}>
                <span>{item.value}</span>
                <label>{item.label}</label>
              </div>
            ))}
          </div>
          <div className="model-hero-actions">
            {HERO_ACTIONS.map(action => (
              <a
                key={action.label}
                className={
                  action.href === "#assessment" ? "model-primary-cta" : "model-secondary-cta"
                }
                href={action.href}
              >
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

            {hasBlindSpotData && (
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
            )}

            <div className="model-metric-stack">
              {metricRows.map(row => (
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
              <a className="model-view-insights" href="#reports">
                View all
              </a>
            </div>
          </div>

          <div className="model-insight-list">
            {liveInsights.map((it, idx) => {
              const Icon = it.icon;
              return (
                <div className={`model-insight-card tone-${it.tone}`} key={idx}>
                  <div className="insight-icon">
                    <Icon size={18} />
                  </div>
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
