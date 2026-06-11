import React, { memo, useEffect, useMemo, useState } from "react";

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
} from "./engines/financialMemoryEngine.js";
import { buildFinancialTwinScenarios } from "./engines/financialTwinEngine.js";
import { buildCognitionProfile } from "./engines/cognitionEngine.js";
import { evaluateHabitProgress } from "./engines/habitEngine.js";
import { forecastHealth, detectFutureRisk } from "./engines/forecastEngine.js";
import { mapSignalsToBehaviour } from "./engines/smsParser.js";

import AnalyticsDashboard from "./components/AnalyticsDashboard.jsx";
import PartnerSdkDemo from "./components/PartnerSdkDemo.jsx";
import FinancialTwin from "./components/FinancialTwin.jsx";
import UserHistory from "./components/UserHistory.jsx";
import AssessmentSection from "./components/AssessmentSection.jsx";
import TraitMatrixVisualizer from "./components/TraitMatrixVisualizer.jsx";
import SingleRecommendedAction from "./components/SingleRecommendedAction.jsx";
import BehaviourDrivers from "./components/BehaviourDrivers.jsx";
import SurvivalHero from "./components/SurvivalHero.jsx";
import CognitionGapCard from "./components/CognitionGapCard.jsx";
import { SMSIngestForm } from "./components/SMSIngestForm.jsx";
import { SalaryRoastGenerator } from "./components/SalaryRoastGenerator.jsx";
import { ScenarioForecast } from "./components/ScenarioForecast.jsx";
import { EnhancedInsightNarrative } from "./components/EnhancedInsightNarrative.jsx";
import DecisionSimulator from "./components/DecisionSimulator.jsx";
import { ConsequenceForecastCard } from "./components/ConsequenceForecastCard.jsx";
import { InterventionsPrescriptionCard } from "./components/InterventionsPrescriptionCard.jsx";
import { StrategicMetricsCard } from "./components/StrategicMetricsCard.jsx";
import DailyCheckinForm from "./components/DailyCheckinForm.jsx";
import DecisionHistory from "./components/DecisionHistory.jsx";
import RecordDecision from "./components/RecordDecision.jsx";
import { AreaChart, Area, XAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

import {
  v2BehaviourQuestions,
  v2AwarenessQuestions,
  v2HabitsQuestions,
  v2DefaultAssessment,
} from "./data/questionnaire-v2.js";



const STORAGE_KEY = "arth-os-assessment";

function makeEmptyAssessment() {
  // build an empty assessment shape so nothing is pre-selected
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

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "Assessments", href: "#assessment" },
  { label: "Simulator", href: "#simulator" },
  { label: "Insights", href: "#insights" },
  { label: "Reports", href: "#reports" },
];

const engineSignals = [
  "Decodes Spending Patterns",
  "Detects Emotional Triggers",
  "Uncovers Money Personality",
  "Generates Financial Health Actions",
];

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

const intelligenceRows = [
  {
    icon: Network,
    title: "AI Financial Intelligence",
    copy: "Connects financial signals with behavioral psychology.",
  },
  {
    icon: Cpu,
    title: "Behavior Pattern Detection",
    copy: "Reads impulse, avoidance and planning patterns in one score.",
  },
  {
    icon: Brain,
    title: "Psychology Driven Analysis",
    copy: "Turns choices into a practical financial behavior profile.",
  },
];

const businessCards = [
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
    // Prefer unified key, but also support legacy v2 key
    const unified = window.localStorage.getItem(STORAGE_KEY);
    if (unified) return normalizeV2Assessment(JSON.parse(unified));

    const legacyV2 = window.localStorage.getItem("arth-os-assessment-v2");
    if (legacyV2) return normalizeV2Assessment(JSON.parse(legacyV2));

    const legacyV1 = window.localStorage.getItem("arth-os-assessment-v1");
    if (legacyV1) return normalizeV2Assessment(normalizeV1Assessment(JSON.parse(legacyV1)));

    // fallback to empty v2 default shape
    return typeof v2DefaultAssessment !== "undefined" ? v2DefaultAssessment : {};
  } catch (error) {
    console.warn("Could not load initial assessment from localStorage:", error);
    return typeof v2DefaultAssessment !== "undefined" ? v2DefaultAssessment : {};
  }
}

export default function App() {
  const [assessment, setAssessment] = useState(() => makeEmptyAssessment());
  const [saveState, setSaveState] = useState("Ready");
  const [queuedSaveCount, setQueuedSaveCount] = useState(() => (isBrowser() ? loadQueuedAssessmentSaves().length : 0));
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [resetTrigger, setResetTrigger] = useState(0);
  const [activeHash, setActiveHash] = useState(
    isBrowser() ? window.location.hash || "#home" : "#home"
  );

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
  const [weeklyCheckins, setWeeklyCheckins] = useState([]);
  const [historyTimespan, setHistoryTimespan] = useState("all");
  const [decisionsRefresh, setDecisionsRefresh] = useState(0);

  useEffect(() => {
    if (!isBrowser()) return;
    setWeeklyCheckins(loadWeeklyCheckins());
  }, []);

  useEffect(() => {
    const handleHashChange = () => setActiveHash(window.location.hash || "#home");
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (!isBrowser() || activeHash === "#admin") return;

    const target = document.getElementById(activeHash.replace("#", ""));
    if (!target) return;

    window.requestAnimationFrame(() => {
      const topbar = document.querySelector(".topbar");
      const headerOffset = (topbar?.getBoundingClientRect().height ?? 0) + 12;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
    });
  }, [activeHash]);

  // Clear any persisted state on initial load so the user must actively select answers
  useEffect(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem("arth-os-assessment-v2");
      window.localStorage.removeItem("arth-os-assessment-v1");
      window.localStorage.removeItem("arth-os-wizard-step");
      // Keep score history to preserve financial memory across sessions
    } catch (error) {
      console.warn("Could not clear localStorage on page load:", error);
    }
  }, []);

  useEffect(() => {
    if (!isBrowser()) return;
    initOfflineApiQueue();
    refreshQueuedSaveCount();
    setIsOnline(navigator.onLine);
    void flushQueuedAssessmentSavesAndRefresh();

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

  const result = useMemo(() => calculateFinancialHealthV2(assessment), [assessment]);
  const cognitionProfile = useMemo(
    () => buildCognitionProfile({
      ...assessment.profile,
      ...assessment.behaviour,
      ...assessment.awareness,
    }),
    [assessment.profile, assessment.behaviour, assessment.awareness],
  );
  const futureRisk = useMemo(() => detectFutureRisk(assessment.profile), [assessment.profile]);
  const habitProgress = useMemo(() => evaluateHabitProgress(weeklyCheckins), [weeklyCheckins]);
  const forecastHealthValues = useMemo(() => forecastHealth(result.healthScore, Math.round(habitProgress.score / 8)), [result.healthScore, habitProgress.score]);
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
    setTwinScenarios(buildFinancialTwinScenarios(result, assessment.profile));
  }, [result.healthScore, assessment.profile, result]);

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

  const isWorkflowRoute = activeHash === "#assessment" || activeHash === "#simulator";
  const isReportsRoute = activeHash === "#reports";
  const showHeroSection = !isWorkflowRoute && !isReportsRoute;
  const showAssessmentSection = !isReportsRoute;



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
      setActiveHash("#admin");
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
    const report = {
      assessment,
      result,
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "arth-os-financial-health-report.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-shell">
      <Header
        activeHash={activeHash}
        saveState={saveState}
        onExport={exportReport}
        onReset={resetAssessment}
        onSave={saveAssessment}
      />

      <main>
        {activeHash === "#admin" ? (
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
              <AssessmentSection
                assessment={assessment}
                result={result}
                onChange={updateGroup}
                onSaveAssessment={saveAssessment}
                ui={ui}
                resetTrigger={resetTrigger}
              />
            )}

            {/* SMS Ingest Form (Optional enrichment) */}
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

            {/* SMS Enrichment Applied Badge */}
            {smsEnrichment && (
              <section style={{ maxWidth: "1200px", margin: "20px auto", padding: "0 16px" }}>
                <div style={{
                  padding: "12px 16px",
                  backgroundColor: "#dcfce7",
                  border: "2px solid #22c55e",
                  borderRadius: "8px",
                  color: "#166534"
                }}>
                  ✓ Your assessment has been enriched with {smsEnrichment.transactions?.length || 0} banking transactions
                </div>
              </section>
            )}

            <section className="assessment-summary-grid" id="reports">
              <div className="summary-main-column">
                <AnalyticsDashboard result={result} />
                {/* Salary Roast Generator */}
                <section className="summary-card">
                  <div style={{ padding: "20px 0", borderBottom: "1px solid #e5e7eb", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                      🔥 Financial Roast
                    </h2>
                  </div>
                  <SalaryRoastGenerator
                    assessmentResult={result}
                    profile={assessment.profile}
                  />
                </section>
                {/* Scenario Forecasting */}
                <section className="summary-card">
                  <div style={{ padding: "20px 0", borderBottom: "1px solid #e5e7eb", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                      📊 Financial Forecast
                    </h2>
                  </div>
                  <ScenarioForecast
                    profile={assessment.profile}
                    assessmentResult={result}
                  />
                </section>
                <section className="summary-card" style={{ padding: "24px" }}>
                  <div style={{ paddingBottom: "16px", borderBottom: "1px solid #e5e7eb", marginBottom: "18px" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>🧠 Cognition & Future Risk</h2>
                    <p style={{ margin: "8px 0 0", color: "#475569", fontSize: 14 }}>
                      See your cognitive calibration, runway risk, and forecasted health trajectory.
                    </p>
                  </div>
                  <div style={{ display: "grid", gap: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                      <div style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "12px", background: "#f8fafc" }}>
                        <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Calibration gap
                        </div>
                        <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>
                          {cognitionProfile.riskCalibration.calibrationGap}%
                        </div>
                        <div style={{ marginTop: 6, color: "#475569", fontSize: 13 }}>
                          Perceived vs. actual risk alignment.
                        </div>
                      </div>
                      <div style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "12px", background: "#f8fafc" }}>
                        <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Near-term runway
                        </div>
                        <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>
                          {futureRisk.runway} months
                        </div>
                        <div style={{ marginTop: 6, color: "#475569", fontSize: 13 }}>
                          {futureRisk.message}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "14px" }}>
                      <div style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "12px", background: "#fff" }}>
                        <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          30 day health
                        </div>
                        <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>
                          {forecastHealthValues.day30}
                        </div>
                      </div>
                      <div style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "12px", background: "#fff" }}>
                        <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          90 day health
                        </div>
                        <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>
                          {forecastHealthValues.day90}
                        </div>
                      </div>
                      <div style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "12px", background: "#fff" }}>
                        <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          180 day health
                        </div>
                        <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>
                          {forecastHealthValues.day180}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                {/* Decision Simulator - Phase 3 Strategic Engine */}
                <DecisionSimulator
                  id="simulator"
                  profile={assessment.profile}
                  behaviour={assessment.behaviour}
                />
              </div>

              <div className="assessment-summary-sidebar">
                <FinancialTwin
                  personalityType={result.personalityType}
                  behaviourScore={result.behaviourScore}
                  awarenessScore={result.awarenessScore}
                  scenarios={twinScenarios}
                />
                <FinancialDNA result={result} />
                <UpgradeJourney result={result} currentScore={result.healthScore} />
                {/* SMS Integration Button in Sidebar */}
                {!showSmsForm && !smsEnrichment && (
                  <section style={{ padding: "20px", backgroundColor: "#eff6ff", border: "2px solid #93c5fd", borderRadius: "8px" }}>
                    <p style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>💬 Enrich Your Assessment</p>
                    <button
                      onClick={() => setShowSmsForm(true)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#2563eb"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "#3b82f6"}
                    >
                      Add Banking Data (SMS)
                    </button>
                    <p style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>
                      Import banking alerts to refine your assessment
                    </p>
                  </section>
                )}

                <section className="summary-card" style={{ padding: "20px", marginTop: "18px" }}>
                  <PartnerSdkDemo
                    userId={assessment.participant?.email || 'demo'}
                    assessment={assessment}
                  />
                </section>
              </div>

              {/* Full-width centered UserHistory spanning both columns */}
              <UserHistory
                className="summary-span"
                currentScore={result.healthScore}
                personalityType={result.personalityType}
              />
              
              {/* Enhanced Insights */}
              <section className="summary-span">
                <div className="summary-card">
                  <div style={{ padding: "20px 0", borderBottom: "1px solid #e5e7eb", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                      💡 Personalized Insights
                    </h2>
                  </div>
                  <EnhancedInsightNarrative
                    assessmentResult={result}
                    assessment={assessment}
                  />
                </div>
              </section>
            </section>

            {/* Advanced Diagnostic Components */}
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px" }}>
              <div className="diagnostics-grid">
                <SurvivalHero survivalMonths={result.survivalMonthsRaw} />
                <CognitionGapCard perceived={result.awarenessGapDisplay} actual={result.survivalMonthsDisplay} />
                <BehaviourDrivers drivers={deriveDrivers(result, assessment)} />
              </div>
              <SingleRecommendedAction result={result} assessment={assessment} />
              <TraitMatrixVisualizer result={result} assessment={assessment} />

              {/* Strategic Defensibility Layer - Phase 4 Core Engines */}
              <ConsequenceForecastCard result={result} assessment={assessment} />
              <InterventionsPrescriptionCard result={result} assessment={assessment} />
              <StrategicMetricsCard 
                result={result} 
                profile={assessment?.profile} 
                behaviour={assessment?.behaviour}
                stability={assessment?.stability}
              />
              <DailyCheckinForm onCheckin={handleDailyCheckin} />
              {/* Decisions UI */}
              <section id="decisions" style={{ marginTop: 20 }}>
                <h2 style={{ fontSize: 18, marginBottom: 12 }}>Decisions</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
                  <div>
                    {/* Decision history list */}
                    <DecisionHistory userId={assessment.participant?.email || 'demo'} refreshSignal={decisionsRefresh} />
                  </div>
                  <div>
                    {/* Decision recording form */}
                    <RecordDecision userId={assessment.participant?.email || 'demo'} onSaved={() => {
                      // soft refresh decision list
                      setDecisionsRefresh((c) => c + 1);
                    }} />
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function deriveDrivers(result, assessment) {
  if (!result) return [];
  // Simple heuristic mapping for MVP
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

  // Fallback sample drivers if none derived
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
    <div className="score-ring-chart">
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
            <Cell fill="rgba(139, 92, 246, 0.96)" />
            <Cell fill="rgba(255, 255, 255, 0.08)" />
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
  // Build journey data from current health score; in production, this would come from history
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
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.76)", fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="healthScore"
              stroke="#8b5cf6"
              strokeWidth={3}
              fill="url(#journeyGrad)"
              fillOpacity={1}
              activeDot={{ r: 5, fill: "#fff", stroke: "#8b5cf6", strokeWidth: 2 }}
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
            <span className="admin-label">Admin Dashboard</span>
          </div>
          {adminLoggedIn && (
            <button type="button" className="ghost-button admin-logout-btn" onClick={onAdminLogout}>
              Logout
            </button>
          )}
        </div>

        {!adminLoggedIn ? (
          <form className="admin-login-card" onSubmit={onAdminLogin} autoComplete="off">
            <label>
              Username
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
              Password
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
              Sign In
            </button>
          </form>
        ) : (
          <>
            <div className="admin-summary-grid">
              <div className="admin-card">
                <h3>Participant data</h3>
                <pre>{JSON.stringify(assessment.participant, null, 2)}</pre>
              </div>
              <div className="admin-card">
                <h3>Profile inputs</h3>
                <pre>{JSON.stringify(assessment.profile, null, 2)}</pre>
              </div>
              <div className="admin-card">
                <h3>Behaviour answers</h3>
                <pre>{JSON.stringify(assessment.behaviour, null, 2)}</pre>
              </div>
              <div className="admin-card">
                <h3>Awareness answers</h3>
                <pre>{JSON.stringify(assessment.awareness, null, 2)}</pre>
              </div>
              {assessment.habits && (
                <div className="admin-card admin-habits-card">
                  <h3>Habits answers</h3>
                  <pre>{JSON.stringify(assessment.habits, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="admin-actions-row">
              <button type="button" className="admin-generate-btn" onClick={onGenerateReport}>
                Generate report
              </button>
              <span className="admin-report-hint">This produces the same report payload visible for review.</span>
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
  onExport,
  onReset,
  onSave,
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
        {navItems.map((item) => (
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
        <button type="button" className="model-icon-btn notification-btn" title="Notifications">
          <Bell size={18} />
          <span />
        </button>
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
            <span>See the financial blindspots</span>
            you don't know you have.
          </h1>
          <p>
            ARTH.OS measures Behavior, Awareness and Stability to reveal the hidden risks shaping your
            financial future.
          </p>
          <div className="hero-stat-card">
            <div className="metric">
              <span>24+</span>
              <label>Behavior Signals</label>
            </div>
            <div className="metric">
              <span>3</span>
              <label>BAS Dimensions</label>
            </div>
            <div className="metric">
              <span>1</span>
              <label>Financial Reality Score</label>
            </div>
          </div>
          <div className="model-hero-actions">
            <a className="model-primary-cta" href="#assessment">
              Start Score
              <ArrowRight size={18} />
            </a>
            <a className="model-secondary-cta" href="#intelligence">
              See Intelligence
              <ArrowRight size={18} />
            </a>
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

        <aside className="model-insights-rail" id="insights" aria-label="Live insights">
          <div className="model-insights-header">
            <div>
              <Sparkles size={18} />
              <h2>Live Insights</h2>
            </div>
            <span>Live</span>
          </div>
          <div className="model-insight-list">
            {liveInsights.map(({ icon: Icon, title, copy, time, tone }) => (
              <article className={`model-insight-card tone-${tone}`} key={title}>
                <div className="model-insight-icon">
                  <Icon size={24} />
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <span>{time}</span>
                </div>
              </article>
            ))}
          </div>
          <a className="model-view-insights" href="#reports">
            View all insights
            <ArrowRight size={18} />
          </a>
        </aside>
      </div>

    </section>
  );
}

function IntelligenceSection() {
  return (
    <section className="feature-section" id="ai">
      <div className="section-copy">
        <h2>
          ARTH.OS detects hidden <span>financial behavior.</span>
        </h2>
        <p>
          It turns human money choices into a behavioral signal layer for
          planning, resilience and financial self-awareness.
        </p>
      </div>
      <div className="intelligence-layout">
        <div className="intelligence-list">
          {intelligenceRows.map(({ icon: Icon, title, copy }) => (
            <article className="intelligence-row" key={title}>
              <Icon size={28} />
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="brain-frame" aria-hidden="true">
          <div className="code-stack">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="brain-core">
            <Brain size={92} />
          </div>
          <div className="node-cluster">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
    </section>
  );
}

function BusinessSection() {
  return (
    <section className="business-section" id="business">
      <h2>
        Built for the future of <span>financial intelligence.</span>
      </h2>
      <p>
        ARTH.OS is not another budgeting application. It is a Behavioral Finance
        Intelligence Engine designed to understand how humans emotionally
        interact with money.
      </p>
      <div className="business-grid">
        {businessCards.map((card) => (
          <article className="business-card" key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FounderSection() {
  return (
    <section className="founder-section" id="founder">
      <div>
        <h2>
          Building India's Behavior <span>Intelligence Layer.</span>
        </h2>
        <p>
          Most financial systems only understand numbers. Human behavior drives
          every financial decision.
        </p>
        <div className="founder-stats">
          <div>
            <strong>AI + Psychology</strong>
            <span>Core Foundation</span>
          </div>
          <div>
            <strong>Privacy First</strong>
            <span>No Statement Storage</span>
          </div>
          <div>
            <strong>India Built</strong>
            <span>Global Vision</span>
          </div>
        </div>
      </div>
      <aside className="founder-card">
        <h3>Ankit Chakravorty</h3>
        <span>Founder & CEO - Sankhya</span>
        <blockquote>
          India does not need another budgeting app. It needs an intelligence
          layer that understands human financial behavior before collapse
          happens.
        </blockquote>
      </aside>
    </section>
  );
}

const ScoreOverview = memo(function ScoreOverview({ result }) {
  return (

    <section className={`result-card score-card tone-${result.categoryBand.tone}`}>
      <div className="score-copy">
        <span className="metric-label">Health Score</span>
        <h1>{result.healthScore}/100</h1>
        <strong>{result.categoryBand.label}</strong>
        <p>{result.summary}</p>
      </div>
      <ScoreDial score={result.healthScore} tone={result.categoryBand.tone} />
    </section>
  );
});

const ScoreDial = memo(function ScoreDial({ score, tone }) {

  const radius = 63;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className={`score-dial dial-${tone}`} aria-hidden="true">
      <svg viewBox="0 0 160 160">
        <circle className="track" cx="80" cy="80" r={radius} />
        <circle
          className="progress"
          cx="80"
          cy="80"
          r={radius}
          strokeDasharray={`${progress} ${circumference - progress}`}
        />
      </svg>
      <span>{score}</span>
    </div>
  );
});

const ComponentBreakdown = memo(function ComponentBreakdown({ result }) {

  const orderedRows = [...result.componentRows].sort((a, b) => {
    const order = { behaviour: 0, awareness: 1, stability: 2 };
    return order[a.key] - order[b.key];
  });

  return (
    <section className="result-card">
      <div className="result-heading">
        <WalletCards size={19} />
        <h2>Breakdown</h2>
      </div>
      <div className="breakdown-list">
        {orderedRows.map((row) => {
          const Icon = sectionIcons[row.key];
          return (
            <div className="breakdown-row" key={row.key}>
              <div>
                <Icon size={18} />
                <span>{row.label}</span>
              </div>
              <strong>
                {row.score}/{row.max}
              </strong>
              <div className="bar-track" aria-hidden="true">
                <span style={{ width: `${row.percent}%` }} />
              </div>
              <small>{row.band}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
});

const BlindSpotPanel = memo(function BlindSpotPanel({ result }) {
  const gapMessage =
    result.blindSpotDirection === "overestimated"
      ? `You are overestimating your runway by ${result.blindSpotGap} months.`
      : result.blindSpotDirection === "underestimated"
      ? `You are underestimating your runway by ${result.blindSpotGap} months.`
      : "Your perceived runway matches your actual cash runway.";

  return (
    <section className="result-card blindspot-panel">
      <div className="result-heading">
        <Activity size={19} />
        <div>
          <h2>Your Financial Blind Spot</h2>
          <span>What your score hides about actual runway</span>
        </div>
      </div>
      <div className="blindspot-copy">
        <p>{result.blindSpotHeadline}</p>
        <p>{result.blindSpotSummary}</p>
      </div>
      <div className="insight-grid">
        <div className="insight-stat">
          <span>Perceived runway</span>
          <strong>{result.blindSpotPerceived} mos</strong>
        </div>
        <div className="insight-stat">
          <span>Actual runway</span>
          <strong>{result.blindSpotActual} mos</strong>
        </div>
        <div className="insight-stat">
          <span>Blind spot size</span>
          <strong>{result.blindSpotGap} mos</strong>
        </div>
        <div className="insight-stat">
          <span>Risk signal</span>
          <strong>{result.futureRiskLabel}</strong>
        </div>
      </div>
      <div className="insight-meta">
        <div>
          <span>Financial personality</span>
          <strong>{result.personalityReport.title}</strong>
        </div>
        <p>{gapMessage}</p>
      </div>
    </section>
  );
});

const SurvivalBlock = memo(function SurvivalBlock({ result, assessment }) {

  const expenseValue = Number.parseFloat(assessment.profile.monthlyExpenses) || 0;
  const fixedValue = Number.parseFloat(assessment.profile.emergencySavingsFixed) || 0;
  const discretionaryValue = Number.parseFloat(assessment.profile.emergencySavingsDiscretionary) || 0;
  const savingsValue = Number.parseFloat(assessment.profile.emergencySavings) || 0;
  const totalSavingsValue = fixedValue + discretionaryValue;

  const milestones = [1, 3, 6, 12];

  return (
    <section className="result-card">
      <div className="result-heading">
        <AlertTriangle size={19} />
        <h2>Income Stop</h2>
      </div>
      <div className="survival-number">
        <strong>{result.survivalMonthsDisplay}</strong>
        <span>months</span>
      </div>
      <p className={`status-line tone-text-${result.survivalBand.tone}`}>
        {result.survivalBand.label}
      </p>

          <div className="dual-survival-grid">
            <div>
              <span>As-Is Lifestyle</span>
              <strong>{result.survivalMonthsDisplay} mos</strong>
            </div>
            <div>
              <span>Crisis Mode Optimized</span>
              <strong>{result.bareMinimumSurvivalMonthsDisplay} mos</strong>
            </div>
          </div>
          <div className="survival-insight-grid">
            <div>
              <span>Perceived runway</span>
              <strong>{result.perceivedSurvivalMonthsDisplay} mos</strong>
            </div>
            <div>
              <span>Awareness gap</span>
              <strong>{result.awarenessGapDisplay} mos</strong>
            </div>
          </div>
          <div className="emergency-goal">
            <span>Emergency fund target</span>
            <strong>6 months</strong>
            <span>
              Need: {formatCurrencyV2(Math.max(0, expenseValue * 6 - totalSavingsValue))}
            </span>
          </div>
          <p className="buffer-summary">
            Fixed: {result.fixedBufferMonthsDisplay} / Discretionary: {result.discretionaryBufferMonthsDisplay}
          </p>

      <div className="survival-rail" aria-hidden="true">
        {milestones.map((month) => (
          <span
            key={month}
            className={result.survivalMonthsRaw >= month ? "active" : ""}
          />
        ))}
      </div>

          <div className="money-pair">
            <span>Fixed buffer: {formatCurrencyV2(fixedValue)}</span>
            <span>Discretionary buffer: {formatCurrencyV2(discretionaryValue)}</span>
          </div>
          <div className="money-pair">
            <span>Total: {formatCurrencyV2(totalSavingsValue)}</span>
            <span>{formatCurrencyV2(expenseValue)} monthly burn</span>
          </div>

    </section>
  );
});

const ActionBlock = memo(function ActionBlock({ result }) {

  return (
    <section className="result-card action-card">

      <div className="result-heading">
        <Target size={19} />
        <h2>Recommended Action</h2>
      </div>
      <p>{result.recommendedActionText}</p>


          <div className="driver-grid">
            <div>
              <span>Strength</span>
              <strong>{result.strongestComponent?.label ?? "-"}</strong>
            </div>
            <div>
              <span>Risk</span>
              <strong>{result.lowestComponent?.label ?? "-"}</strong>
            </div>
          </div>
          <div className="future-risk-grid">
            <div>
              <span>Future risk</span>
              <strong>{result.futureRiskLabel}</strong>
            </div>
            <div>
              <span>Personality</span>
              <strong>{result.personalityType}</strong>
            </div>
          </div>

    </section>
  );
});

const DiagnosisPanel = memo(function DiagnosisPanel({ result }) {
  const diagnosis = result.diagnosis || {};

  return (
    <section className="result-card diagnosis-card">
      <div className="result-heading">
        <ShieldCheck size={19} />
        <h2>Diagnosis</h2>
      </div>
      <p className="diagnosis-headline">{diagnosis.headline}</p>
      <p className="diagnosis-problem"><strong>{diagnosis.problem}</strong></p>
      <p>{diagnosis.explanation}</p>
      <div className="diagnosis-focus">
        <strong>Priority focus:</strong> {diagnosis.focus}
      </div>
    </section>
  );
});
