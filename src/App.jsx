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

import AnalyticsDashboard from "./components/AnalyticsDashboard.jsx";
import FinancialTwin from "./components/FinancialTwin.jsx";
import UserHistory from "./components/UserHistory.jsx";
import AssessmentSection from "./components/AssessmentSection.jsx";

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
  const [resetTrigger, setResetTrigger] = useState(0);
  const [activeHash, setActiveHash] = useState(
    isBrowser() ? window.location.hash || "#home" : "#home"
  );
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: "", password: "" });
  const [adminLoginError, setAdminLoginError] = useState("");
  const [adminReport, setAdminReport] = useState(null);

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
      window.localStorage.removeItem("arth-os-score-history");
    } catch (error) {
      console.warn("Could not clear localStorage on page load:", error);
    }
  }, []);

  useEffect(() => {
    initOfflineApiQueue();
    void flushQueuedAssessmentSaves();

    function handleOnline() {
      void flushQueuedAssessmentSaves();
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const result = useMemo(() => calculateFinancialHealthV2(assessment), [assessment]);

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
      setSaveState("Saved");
    } catch (e) {
      console.warn("Could not save locally:", e);
    }

    const payload = { assessment, result: calculateFinancialHealthV2(assessment) };
    if (isBrowser()) {
      fetch("/api/saveAssessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(async (resp) => {
          const body = await resp.text().catch(() => null);
          if (!resp.ok) {
            enqueueAssessmentSave(payload);
            console.warn("Remote save failed, queued for retry:", resp.statusText, body);
          } else {
            console.log("Remote save response:", resp.status, body);
          }
        })
        .catch((err) => {
          enqueueAssessmentSave(payload);
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
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem("arth-os-wizard-step");
    } catch (error) {
      console.warn("Could not clear reset storage:", error);
    }
    setSaveState("Ready");
    setResetTrigger((current) => current + 1);
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

            <section className="assessment-summary-grid" id="reports">
              <div className="summary-main-column">
                <AnalyticsDashboard result={result} />
              </div>

              <div className="assessment-summary-sidebar">
                <FinancialTwin
                  personalityType={result.personalityType}
                  behaviourScore={result.behaviourScore}
                  awarenessScore={result.awarenessScore}
                />
              </div>

              {/* Full-width centered UserHistory spanning both columns */}
              <UserHistory
                className="summary-span"
                currentScore={result.healthScore}
                personalityType={result.personalityType}
              />
            </section>
          </>
        )}
      </main>
    </div>
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
        <span className={`header-sync save-state-${saveState.toLowerCase()}`}>
          {saveState}
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
  return (
    <section className="model-screen" id="home">
      <div className="model-hero-grid">
        <div className="model-hero-copy">
          <h1>
            <span>ARTH.OS</span>
            decodes financial behavior
          </h1>
          <p>
            Our proprietary intelligence engine analyzes how you think, feel,
            and decide with money-so you can make better choices and build lasting wealth.
          </p>
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
              <div className="model-score-ring" style={{ "--score": `${scorePreview}%` }}>
                <strong>{scorePreview}</strong>
                <small>/100</small>
              </div>
              <p>{scoreLabel}</p>
              <small>Updated just now</small>
            </div>

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
