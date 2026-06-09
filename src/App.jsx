import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  Cpu,
  Download,
  LockKeyhole,
  Network,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  WalletCards,
} from "lucide-react";
import {
  awarenessQuestions,
  behaviourQuestions,
  defaultAssessment,
} from "./data/questionnaire.js";


import {
  calculateFinancialHealth,
  componentMaximums,
  formatCurrency,
} from "./lib/scoring.js";

import {
  v2BehaviourQuestions,
  v2AwarenessQuestions,
  v2DefaultAssessment,
} from "./data/questionnaire-v2.js";


import { calculateFinancialHealthV2, componentMaximumsV2, formatCurrency as formatCurrencyV2 } from "./lib/scoring-v2.js";


const STORAGE_KEY = "arth-os-assessment-v1";

const STORAGE_KEY_V2 = "arth-os-assessment-v2";


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


function loadInitialAssessmentV1() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultAssessment;
  } catch {
    return defaultAssessment;
  }
}

function loadInitialAssessmentV2() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY_V2);
    return saved ? JSON.parse(saved) : v2DefaultAssessment;
  } catch {
    return v2DefaultAssessment;
  }
}

export default function App() {
  const [mode, setMode] = useState("v2");
  const [assessment, setAssessment] = useState(() => loadInitialAssessmentV2());
  const [saveState, setSaveState] = useState("Ready");


  const result = useMemo(() => {
    return mode === "v2"
      ? calculateFinancialHealthV2(assessment)
      : calculateFinancialHealth(assessment);
  }, [assessment, mode]);

  const ui =
    mode === "v2"
      ? {
          behaviourQuestions: v2BehaviourQuestions,
          awarenessQuestions: v2AwarenessQuestions,
          componentMaximums: componentMaximumsV2,
          formatCurrency: formatCurrencyV2,
          extraCards: {
            debtSchedule: true,
            habits: true,
          },
        }
      : {
          behaviourQuestions,
          awarenessQuestions,
          componentMaximums,
          formatCurrency,
          extraCards: {
            debtSchedule: false,
            habits: false,
          },
        };



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

  function resetAssessmentToCurrentMode() {
    const nextAssessment = mode === "v2" ? v2DefaultAssessment : defaultAssessment;
    setAssessment(nextAssessment);
    window.localStorage.removeItem(mode === "v2" ? STORAGE_KEY_V2 : STORAGE_KEY);
    setSaveState("Ready");
  }


  function saveAssessment() {
    const key = mode === "v2" ? STORAGE_KEY_V2 : STORAGE_KEY;
    window.localStorage.setItem(key, JSON.stringify(assessment));
    setSaveState("Saved");
  }


  function resetAssessment() {
    resetAssessmentToCurrentMode();
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
        mode={mode}
        onModeChange={setMode}
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
          mode={mode}
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
  mode,
  onModeChange,
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

        <div className="mode-toggle" role="group" aria-label="Assessment mode">
          <button
            type="button"
            className={mode === "v1" ? "selected" : ""}
            onClick={() => onModeChange("v1")}
          >
            v1
          </button>
          <button
            type="button"
            className={mode === "v2" ? "selected" : ""}
            onClick={() => onModeChange("v2")}
          >
            v2
          </button>
        </div>

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

function AssessmentSection({ assessment, result, onChange, ui, mode }) {
  return (
    <section className="assessment-section" id="assessment">
      <div className="assessment-heading">
        <span>Live Score Engine</span>
        <h2>
          Run your Financial Health <em>Behavior Score.</em>
        </h2>
        <p>
          Answer the behavioral, awareness and stability inputs. The intelligence
          panel updates instantly as your money profile changes.
        </p>
      </div>

      <div className="workspace">
        <section className="form-stack" aria-label="Financial health assessment">
          <QuestionSection
            icon={Brain}
            title="Behaviour"
            score={`${result.behaviourScore}/${ui.componentMaximums.behaviour}`}
            questions={ui.behaviourQuestions}
            values={assessment.behaviour}
            onChange={(key, value) => onChange("behaviour", key, value)}
          />

          <QuestionSection
            icon={BarChart3}
            title="Awareness"
            score={`${result.awarenessScore}/${ui.componentMaximums.awareness}`}
            questions={ui.awarenessQuestions}
            values={assessment.awareness}
            onChange={(key, value) => onChange("awareness", key, value)}
          />

          <ProfileSection
            values={assessment.profile}
            score={`${result.stabilityScore}/${ui.componentMaximums.stability}`}
            onChange={(key, value) => onChange("profile", key, value)}
            mode={mode}
          />

        </section>

        <aside className="result-stack" aria-label="Financial health result">
          <ScoreOverview result={result} />
          <ComponentBreakdown result={result} />
          <SurvivalBlock result={result} assessment={assessment} mode={mode} />
          <ActionBlock result={result} mode={mode} />

        </aside>
      </div>
    </section>
  );
}

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

function ProfileSection({ values, score, onChange, mode }) {
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
          label="Emergency savings"
          value={values.emergencySavings}
          onChange={(value) => onChange("emergencySavings", value)}
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

      {mode === "v2" ? (
        <>
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
                  onChange={(e) => onChange("debtRepaymentRatePctOfIncome", e.target.value)}
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
                  onChange={(e) => onChange("averageInterestRatePct", e.target.value)}
                />
              </div>
            </div>
          </div>
        </>
      ) : null}

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
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  );
}

function SegmentedControl({ labelledBy, name, options, value, onChange }) {
  return (
    <div className="segmented-control" role="radiogroup" aria-labelledby={labelledBy}>
      {options.map((option) => (
        <button
          className={option.value === value ? "selected" : ""}
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          name={name}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ScoreOverview({ result }) {
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
}

function ScoreDial({ score, tone }) {
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
}

function ComponentBreakdown({ result }) {
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
}

function SurvivalBlock({ result, assessment, mode }) {
  const expenseValue = Number.parseFloat(assessment.profile.monthlyExpenses) || 0;
  const savingsValue = Number.parseFloat(assessment.profile.emergencySavings) || 0;

  const milestones = [1, 3, 6, 12];

  const showCurrency = true;


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
      <div className="survival-rail" aria-hidden="true">
        {milestones.map((month) => (
          <span
            key={month}
            className={result.survivalMonthsRaw >= month ? "active" : ""}
          />
        ))}
      </div>
      <div className="money-pair">
        <span>{formatCurrency(savingsValue)} saved</span>
        <span>{formatCurrency(expenseValue)} monthly burn</span>
      </div>
    </section>
  );
}

function ActionBlock({ result, mode }) {
  return (
    <section className="result-card action-card">

      <div className="result-heading">
        <Target size={19} />
        <h2>Recommended Action</h2>
      </div>
      <p>{result.recommendedActionText}</p>

      {mode === "v2" ? (
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
      ) : (
        <div className="driver-grid">
          <div>
            <span>Strength</span>
            <strong>{result.strongestComponent.label}</strong>
          </div>
          <div>
            <span>Risk</span>
            <strong>{result.lowestComponent.label}</strong>
          </div>
        </div>
      )}

    </section>
  );
}
