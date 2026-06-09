import { memo, useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Download,
  LockKeyhole,
  MessageSquare,
  Network,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  ThumbsUp,
  WalletCards,
} from "lucide-react";
import {
  calculateFinancialHealthV2,
  calculateDecisionSimulatorV2,
  componentMaximumsV2,
  formatCurrency as formatCurrencyV2,
  formatMonths as formatMonthsV2,
  buildAnonymousTelemetryPayload,
  dispatchAnonymousTelemetry,
} from "./lib/scoring-v2.js";

import AnalyticsDashboard from "./components/AnalyticsDashboard.jsx";
import ValidationFeedbackForm from "./components/ValidationFeedbackForm.jsx";

import {
  v2BehaviourQuestions,
  v2AwarenessQuestions,
  v2HabitsQuestions,
  v2DefaultAssessment,
} from "./data/questionnaire-v2.js";



const STORAGE_KEY = "arth-os-assessment";


const navItems = [
  { label: "Home", href: "#home" },
  { label: "AI", href: "#ai" },
  { label: "Business", href: "#business" },
  { label: "Founder", href: "#founder" },
  { label: "Investors", href: "#assessment" },
];

const engineSignals = [
  "Decodes Spending Patterns",
  "Detects Emotional Triggers",
  "Uncovers Money Personality",
  "Generates Financial Health Actions",
];

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
  } catch {
    return typeof v2DefaultAssessment !== "undefined" ? v2DefaultAssessment : {};
  }
}

export default function App() {
  const [assessment, setAssessment] = useState(() => loadInitialAssessment());
  const [saveState, setSaveState] = useState("Ready");

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

  async function dispatchAnonymousTelemetryEvent(telemetryPayload) {
    try {
      await dispatchAnonymousTelemetry(telemetryPayload);
    } catch (error) {
      console.warn("Telemetry event could not be sent:", error?.message || error);
    }
  }

  async function dispatchAnonymousFeedbackEvent(feedbackPayload) {
    try {
      const feedbackUrl = "https://api.arth-os.dev/feedback" || process.env.REACT_APP_FEEDBACK_ENDPOINT;
      await fetch(feedbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackPayload),
        keepalive: true,
      });
      console.log("[Feedback] Captured cleanly.");
    } catch (error) {
      console.warn("[Feedback] Transmission deferred:", error?.message || error);
    }
  }



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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assessment));
    setSaveState("Saved");
  }

  function resetAssessment() {
    setAssessment(v2DefaultAssessment);
    window.localStorage.removeItem(STORAGE_KEY);
    setSaveState("Ready");
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
        saveState={saveState}
        onExport={exportReport}
        onReset={resetAssessment}
        onSave={saveAssessment}
      />


      <main>
        <HeroSection result={result} />
        <IntelligenceSection />
        <BusinessSection />
        <FounderSection />
        <AssessmentSection
          assessment={assessment}
          result={result}
          onChange={updateGroup}
          ui={ui}
        />
      </main>
    </div>
  );
}

function Header({

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
          <a href={item.href} key={item.label}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="toolbar" aria-label="Assessment actions">
        <span className={`save-state save-state-${saveState.toLowerCase()}`}>
          {saveState}
        </span>


        <button type="button" className="icon-button" onClick={onSave} title="Save">
          <Save size={18} />
          <span>Save</span>
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onExport}
          title="Export report"
        >
          <Download size={18} />
          <span>Export</span>
        </button>
        <button type="button" className="ghost-button" onClick={onReset} title="Reset">
          <RotateCcw size={18} />
          <span>Reset</span>
        </button>
      </div>

    </header>
  );
}

function HeroSection({ result }) {
  return (
    <section className="hero-section" id="home">
      <div className="hero-copy">
        <div className="hero-pill">
          <Sparkles size={16} />
          <span>ARTH.OS by SANKHYA</span>
        </div>
        <h1>
          <span>
            ARTH.<em>OS</em>
          </span>{" "}
          decodes financial behavior.
        </h1>
        <p>
          ARTH.OS combines behavioral psychology, AI and financial intelligence
          to decode emotional spending, stress spending and hidden money habits.
        </p>
        <div className="hero-actions">
          <a className="primary-link" href="#assessment">
            Start Score
            <ArrowRight size={18} />
          </a>
          <a className="secondary-link" href="#ai">
            See Intelligence
          </a>
        </div>
      </div>

      <aside className="engine-card" aria-label="ARTH.OS intelligence engine">
        <div className="engine-chip">
          <Sparkles size={16} />
          <span>ARTH.OS Intelligence Engine</span>
        </div>
        <div className="engine-metric">
          <strong>99.99%</strong>
          <span>Behavior Intelligence Accuracy</span>
        </div>
        <div className="engine-list">
          {engineSignals.map((signal) => (
            <div key={signal}>{signal}</div>
          ))}
        </div>
        <div className="engine-footer">
          <span>Live Score</span>
          <strong>{result.healthScore}/100</strong>
        </div>
      </aside>
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

function AssessmentSection({ assessment, result, onChange, ui }) {
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const saved = window.localStorage.getItem("arth-os-wizard-step");
      return saved ? Math.min(parseInt(saved, 10), 4) : 0;
    } catch {
      return 0;
    }
  });
  const [showFeedback, setShowFeedback] = useState(false);

  const mode = result?.mode || "v2";
  const steps = [
    { id: "behaviour", label: "Psychology", icon: Brain },
    { id: "awareness", label: "Clarity", icon: BarChart3 },
    { id: "stability", label: "Resilience", icon: ShieldCheck },
    ...(mode === "v2" ? [{ id: "habits", label: "Habits", icon: Activity }] : []),
  ];

  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;

  const handleStepChange = (newStep) => {
    setCurrentStep(newStep);
    try {
      window.localStorage.setItem("arth-os-wizard-step", String(newStep));
    } catch (e) {
      console.warn("Could not persist step:", e);
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      handleStepChange(currentStep + 1);
      return;
    }

    const payload = buildAnonymousTelemetryPayload(result, assessment);
    await dispatchAnonymousTelemetryEvent(payload);
    setShowFeedback(true);
  };

  const handlePrev = () => handleStepChange(Math.max(currentStep - 1, 0));

  return (
    <section className="assessment-section" id="assessment">
      <div className="assessment-heading">
        <span>Guided Experience</span>
        <h2>
          Run your Financial Health <em>Behavior Score.</em>
        </h2>
        <p>
          Complete the guided assessment step-by-step. The intelligence metrics panel
          updates instantly in real time.
        </p>
      </div>

      <div className="workspace">
        <section className="form-stack" aria-label="Financial health assessment">
          {!showFeedback && (
            <div className="wizard-progress-track" aria-label="Assessment progress">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`wizard-node ${idx <= currentStep ? "active" : ""} ${
                    idx === currentStep ? "current" : ""
                  }`}
                >
                  <div className="wizard-node-marker">{idx + 1}</div>
                  <span className="wizard-node-label">{step.label}</span>
                  {idx < steps.length - 1 && <div className="wizard-node-connector" />}
                </div>
              ))}
            </div>
          )}

          {!showFeedback && currentStep === 0 && (
            <QuestionSection
              icon={Brain}
              title="Psychology"
              score={`${result.behaviourScore}/${ui.componentMaximums.behaviour}`}
              questions={ui.behaviourQuestions}
              values={assessment.behaviour}
              onChange={(key, value) => onChange("behaviour", key, value)}
            />
          )}

          {!showFeedback && currentStep === 1 && (
            <QuestionSection
              icon={BarChart3}
              title="Clarity"
              score={`${result.awarenessScore}/${ui.componentMaximums.awareness}`}
              questions={ui.awarenessQuestions}
              values={assessment.awareness}
              onChange={(key, value) => onChange("awareness", key, value)}
            />
          )}

          {!showFeedback && currentStep === 2 && (
            <ProfileSection
              values={assessment.profile}
              score={`${result.stabilityScore}/${ui.componentMaximums.stability}`}
              onChange={(key, value) => onChange("profile", key, value)}
            />
          )}

          {!showFeedback && currentStep === 3 && mode === "v2" && (
            <QuestionSection
              icon={Activity}
              title="Habits"
              score={`${result.habits.habitScore}/100`}
              questions={ui.habitsQuestions}
              values={assessment.habits}
              onChange={(key, value) => onChange("habits", key, value)}
            />
          )}

          {!showFeedback && (
            <div className="wizard-nav-footer">
            <button
              type="button"
              className="ghost-button"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button type="button" className="wizard-primary-btn" onClick={handleNext}>
              {isLastStep ? "Finish & Review Score" : "Continue"}
              {!isLastStep && <ChevronRight size={16} />}
            </button>
          </div>
          )}

          {showFeedback && (
            <ValidationFeedbackForm
              healthScore={result.healthScore}
              onSubmitFeedback={async (feedbackPayload) => {
                await dispatchAnonymousFeedbackEvent(feedbackPayload);
                window.location.href = "#home";
              }}
            />
          )}
        </section>

        <aside className="result-stack" aria-label="Financial health result">
          <ScoreOverview result={result} />
          <ComponentBreakdown result={result} />
          <BlindSpotPanel result={result} />
          <DiagnosisPanel result={result} />
          <SurvivalBlock result={result} assessment={assessment} />
          <DecisionSimulator profile={assessment.profile} />
          <ActionBlock result={result} />
          <DiagnosticAnalyticsDashboard result={result} />
          <AnalyticsDashboard result={result} />
        </aside>
      </div>
    </section>
  );
}

const DiagnosticAnalyticsDashboard = memo(function DiagnosticAnalyticsDashboard({ result }) {
  if (result.mode !== "v2") return null;

  return (
    <section className="result-card analytics-dashboard-card">
      <div className="result-heading">
        <Sparkles size={19} />
        <h2>Advanced Psychological Telemetry</h2>
      </div>
      <div className="analytics-summary-grid">
        <div className="analytics-metric">
          <span>Money Archetype</span>
          <strong>{result.personalityType}</strong>
        </div>
        <div className="analytics-metric">
          <span>Future Risk</span>
          <strong>{result.futureRiskScore}/100</strong>
          <small>{result.futureRiskLabel}</small>
        </div>
        <div className="analytics-metric">
          <span>Visibility Blindspot</span>
          <strong>{result.awarenessGapDisplay} mos</strong>
        </div>
      </div>
      <p className="analytics-dashboard-copy">
        💡 <strong>What this means:</strong> Based on your visibility score, you are likely to miscalculate your actual survival runway limits by approximately <strong>{result.awarenessGapDisplay} months</strong> due to unidentified spending avoidance behaviors.
      </p>
    </section>
  );
});

function QuestionSection({ icon: Icon, title, score, questions, values, onChange }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <Icon size={20} />
          <h2>{title}</h2>
        </div>
        <span>{score}</span>
      </div>

      <div className="question-list">
        {questions.map((question) => (
          <div className="question-row" key={question.key}>
            <label className="question-label" id={`${question.key}-label`}>
              {question.prompt}
            </label>
            <SegmentedControl
              labelledBy={`${question.key}-label`}
              name={question.key}
              options={question.options}
              value={values[question.key]}
              onChange={(value) => onChange(question.key, value)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}


function ProfileSection({ values, score, onChange }) {
  return (
    <section className="panel">

      <div className="panel-heading">
        <div>
          <ShieldCheck size={20} />
          <h2>Stability</h2>
        </div>
        <span>{score}</span>
      </div>

      <div className="numeric-grid">
        <MoneyInput
          label="Monthly expenses"
          value={values.monthlyExpenses}
          onChange={(value) => onChange("monthlyExpenses", value)}
        />
        <MoneyInput
          label="Fixed emergency buffer"
          value={values.emergencySavingsFixed}
          onChange={(value) => onChange("emergencySavingsFixed", value)}
        />
        <MoneyInput
          label="Discretionary emergency buffer"
          value={values.emergencySavingsDiscretionary}
          onChange={(value) => onChange("emergencySavingsDiscretionary", value)}
        />
        <MoneyInput
          label="Total debt"
          value={values.totalDebt}
          onChange={(value) => onChange("totalDebt", value)}
        />
        <MoneyInput
          label="Monthly income"
          value={values.monthlyIncome}
          onChange={(value) => onChange("monthlyIncome", value)}
        />
        <MoneyInput
          label="Fixed commitments"
          value={values.monthlyLiabilities}
          onChange={(value) => onChange("monthlyLiabilities", value)}
        />
      </div>

      <div className="question-row compact">
        <label className="question-label" id="income-stability-label">
          Income stability
        </label>
        <SegmentedControl
          labelledBy="income-stability-label"
          name="incomeStability"
          options={incomeStabilityOptions}
          value={values.incomeStability}
          onChange={(value) => onChange("incomeStability", value)}
        />
      </div>

      <div className="question-row compact">
        <label className="question-label" id="dependents-label">
          Dependents
        </label>
        <SegmentedControl
          labelledBy="dependents-label"
          name="dependentsBucket"
          options={dependentsOptions}
          value={values.dependentsBucket}
          onChange={(value) => onChange("dependentsBucket", value)}
        />
      </div>


        <div className="question-row compact">
          <label className="question-label" id="debt-rate-label">
            Debt repayment rate (% of income)
          </label>
          <div className="money-input" style={{ gridTemplateColumns: "auto 1fr" }}>
            <span style={{ display: "block" }} />
            <div>
              <span />
              <input
                type="number"
                min="0"
                inputMode="decimal"
                value={values.debtRepaymentRatePctOfIncome ?? 0.12}
                onChange={(e) =>
                  onChange(
                    "debtRepaymentRatePctOfIncome",
                    e.target.value === "" ? 0 : Number.parseFloat(e.target.value),
                  )
                }
              />
            </div>
          </div>
        </div>

        <div className="question-row compact">
          <label className="question-label" id="interest-label">
            Average interest rate (% per year)
          </label>
          <div className="money-input" style={{ gridTemplateColumns: "auto 1fr" }}>
            <span style={{ display: "block" }} />
            <div>
              <span />
              <input
                type="number"
                min="0"
                inputMode="decimal"
                value={values.averageInterestRatePct ?? 10}
                onChange={(e) =>
                  onChange(
                    "averageInterestRatePct",
                    e.target.value === "" ? 0 : Number.parseFloat(e.target.value),
                  )
                }
              />
            </div>
          </div>
        </div>


    </section>
  );
}

function MoneyInput({ label, value, onChange }) {
  return (
    <label className="money-input">
      <span>{label}</span>
      <div>
        <span>INR</span>
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={value ?? ""}
          onChange={(event) => {
            const val = event.target.value;
            onChange(val === "" ? 0 : Number.parseFloat(val));
          }}
        />
      </div>
    </label>
  );
}


function SegmentedControl({ labelledBy, name, options, value, onChange }) {
  return (
    <div className="segmented-control" role="radiogroup" aria-labelledby={labelledBy}>
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className={`segmented-option ${checked ? "selected" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
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
            Fixed: {result.fixedBufferMonthsDisplay} · Discretionary: {result.discretionaryBufferMonthsDisplay}
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

function DecisionSimulator({ profile }) {
  const [purchaseCost, setPurchaseCost] = useState(0);
  const simulator = useMemo(
    () => calculateDecisionSimulatorV2(profile, purchaseCost),
    [profile, purchaseCost],
  );

  return (
    <section className="result-card simulator-card">
      <div className="result-heading">
        <Cpu size={19} />
        <h2>Decision Simulator</h2>
      </div>
      <div className="simulator-input">
        <label htmlFor="purchase-cost">Purchase cost</label>
        <div>
          <span>INR</span>
          <input
            id="purchase-cost"
            type="number"
            min="0"
            value={purchaseCost}
            onChange={(event) => setPurchaseCost(Number.parseFloat(event.target.value) || 0)}
          />
        </div>
      </div>
      <div className="simulator-grid">
        <div>
          <span>Current runway</span>
          <strong>{formatMonthsV2(simulator.currentRunway)} mos</strong>
        </div>
        <div>
          <span>Forecast runway</span>
          <strong>{formatMonthsV2(simulator.forecastRunway)} mos</strong>
        </div>
        <div>
          <span>Runway delta</span>
          <strong>{formatMonthsV2(simulator.runwayDelta)} mos</strong>
        </div>
        <div>
          <span>Signal</span>
          <strong>{simulator.forecastRisk}</strong>
        </div>
      </div>
      <p className="simulator-recommendation">{simulator.recommendation}</p>
    </section>
  );
}
