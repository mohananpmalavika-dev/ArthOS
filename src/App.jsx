import { memo, useEffect, useMemo, useState } from "react";

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
  calculateFinancialHealthV2,
  calculateBehaviourScoreV2,
  calculateAwarenessScoreV2,
  calculateStabilityScoreV2,
  calculateDebtScheduleEstimateV2,
  calculateHabitsMetricsV2,
  calculateFutureRiskV2,
  calculatePersonalityTypeV2,
  calculateAwarenessGapV2,
  calculateBlindSpotV2,
  calculatePersonalityReportV2,
  componentMaximumsV2,
  formatCurrency as formatCurrencyV2,
  formatMonths as formatMonthsV2,
} from "./lib/scoring-v2.js";

import {
  v2BehaviourQuestions,
  v2AwarenessQuestions,
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
    ...defaultAssessment,
    ...assessment,
    behaviour: {
      ...defaultAssessment.behaviour,
      ...assessment?.behaviour,
    },
    awareness: {
      ...defaultAssessment.awareness,
      ...assessment?.awareness,
    },
    profile: {
      ...defaultAssessment.profile,
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

  const v2BehaviourResult = useMemo(() => calculateBehaviourScoreV2(assessment.behaviour), [assessment.behaviour]);

  const v2AwarenessResult = useMemo(() => calculateAwarenessScoreV2(assessment.awareness), [assessment.awareness]);

  const v2StabilityResult = useMemo(() => calculateStabilityScoreV2(assessment.profile), [assessment.profile]);

  const v2DebtSchedule = useMemo(() => calculateDebtScheduleEstimateV2(assessment.profile), [assessment.profile]);

  const v2Habits = useMemo(() => calculateHabitsMetricsV2(assessment.habits), [assessment.habits]);

  const v2FutureRisk = useMemo(() => calculateFutureRiskV2(assessment.profile), [assessment.profile]);

  const v2PersonalityType = useMemo(() => calculatePersonalityTypeV2(assessment.behaviour), [assessment.behaviour]);

  const v2AwarenessGap = useMemo(() => calculateAwarenessGapV2(v2AwarenessResult ?? 0, v2StabilityResult?.survivalMonthsRaw ?? 0), [v2AwarenessResult, v2StabilityResult?.survivalMonthsRaw]);

  const v2BlindSpot = useMemo(() => (v2AwarenessGap ? calculateBlindSpotV2(v2AwarenessGap) : null), [v2AwarenessGap]);

  const v2PersonalityReport = useMemo(() => calculatePersonalityReportV2(v2PersonalityType ?? "Survivor"), [v2PersonalityType]);

  const result = useMemo(() => {
      const behaviourScore = v2BehaviourResult ?? 0;
      const awarenessScore = v2AwarenessResult ?? 0;
      const stability = v2StabilityResult ?? { score: 0, survivalMonthsRaw: 0 };
      const componentRows = [
        {
          key: "behaviour",
          label: "Behaviour",
          score: behaviourScore,
          max: componentMaximumsV2.behaviour,
        },
        {
          key: "awareness",
          label: "Awareness",
          score: awarenessScore,
          max: componentMaximumsV2.awareness,
        },
        {
          key: "stability",
          label: "Stability",
          score: stability.score,
          max: componentMaximumsV2.stability,
        },
      ].map((row) => ({
        ...row,
        percent: Math.round((row.score / row.max) * 100),
      }));

      // Preserve existing ordering logic in score-v2 engine
      componentRows.sort((a, b) => a.percent - b.percent);
      const lowestComponent = componentRows[0];
      const strongestComponent = [...componentRows].sort(
        (a, b) => b.percent - a.percent,
      )[0];

      const healthScore = Math.round(
        behaviourScore + awarenessScore + stability.score,
      );
      const categoryBand = (() => {
        if (healthScore <= 25) return { label: "Critical", tone: "critical" };
        if (healthScore <= 50) return { label: "Vulnerable", tone: "warning" };
        if (healthScore <= 75) return { label: "Stable", tone: "steady" };
        return { label: "Healthy", tone: "strong" };
      })();

      const survivalBand = (() => {
        const months = stability.survivalMonthsRaw;
        if (months <= 1)
          return { label: "Immediate risk", tone: "critical" };
        if (months <= 3)
          return { label: "Fragile cushion", tone: "warning" };
        if (months <= 6)
          return { label: "Improving stability", tone: "steady" };
        if (months <= 12)
          return { label: "Strong buffer", tone: "strong" };
        return { label: "Highly resilient", tone: "strong" };
      })();

      const survivalMonthsDisplay =
        stability.survivalMonthsRaw <= 0 || !Number.isFinite(stability.survivalMonthsRaw)
          ? "0"
          : stability.survivalMonthsRaw >= 60
            ? "60+"
            : Number.isInteger(stability.survivalMonthsRaw)
              ? String(stability.survivalMonthsRaw)
              : stability.survivalMonthsRaw.toFixed(1);

      const awarenessGapMetrics = v2AwarenessGap ?? {
        perceivedSurvivalMonths: stability.survivalMonthsRaw,
        actualSurvivalMonths: stability.survivalMonthsRaw,
        awarenessGap: 0,
      };

      const futureRisk = v2FutureRisk ?? { score: 0, label: "Unknown" };
      const personalityType = v2PersonalityType ?? "Survivor";
      const personalityReport = v2PersonalityReport ?? {
        title: personalityType,
        strengths: [],
        risks: [],
        dangerZone: "",
        recommendedRule: "",
      };

      const blindSpot = v2BlindSpot ?? {
        headline: "Watch your runway assumptions.",
        summary:
          "Your awareness of survival time is your most valuable financial insight.",
        perceivedSurvivalMonthsDisplay: "0",
        actualSurvivalMonthsDisplay: "0",
        gapDisplay: "0",
        direction: "aligned",
      };

      const perceivedSurvivalMonthsDisplay =
        awarenessGapMetrics.perceivedSurvivalMonths <= 0 ||
        !Number.isFinite(awarenessGapMetrics.perceivedSurvivalMonths)
          ? "0"
          : awarenessGapMetrics.perceivedSurvivalMonths >= 60
            ? "60+"
            : Number.isInteger(awarenessGapMetrics.perceivedSurvivalMonths)
              ? String(awarenessGapMetrics.perceivedSurvivalMonths)
              : awarenessGapMetrics.perceivedSurvivalMonths.toFixed(1);

      const awarenessGapDisplay =
        awarenessGapMetrics.awarenessGap <= 0 ||
        !Number.isFinite(awarenessGapMetrics.awarenessGap)
          ? "0"
          : awarenessGapMetrics.awarenessGap >= 60
            ? "60+"
            : Number.isInteger(awarenessGapMetrics.awarenessGap)
              ? String(awarenessGapMetrics.awarenessGap)
              : awarenessGapMetrics.awarenessGap.toFixed(1);

      const componentsForAction = [
        { key: "behaviour", score: behaviourScore },
        { key: "awareness", score: awarenessScore },
        {
          key: "stability",
          score: stability.score,
          survivalMonthsRaw: stability.survivalMonthsRaw,
        },
      ];

      const recommendedActionText = (() => {
        // ONE primary action: target the lowest component; if stability is lowest and survival is low -> emergency savings.
        const lowestKey = componentsForAction
          .slice()
          .sort((a, b) => a.score - b.score)[0].key;

        const monthlyExpenses = Number.parseFloat(
          assessment.profile.monthlyExpenses,
        );
        const monthlyExpensesSafe = Number.isFinite(monthlyExpenses)
          ? monthlyExpenses
          : 0;

        const survivalMonths = componentsForAction.find(
          (c) => c.key === "stability",
        ).survivalMonthsRaw;

        if (lowestKey === "behaviour") {
          if (assessment.behaviour.unplannedPurchaseFreq !== "never") {
            return "Use a 24-hour waiting rule for non-essential purchases this month.";
          }
          return "Cut one trigger: remove one social-spend pathway (e.g., shopping places) this week.";
        }

        if (lowestKey === "awareness") {
          if (assessment.awareness.tracksExpenses !== "regularly") {
            return "Track every expense for the next 14 days (no exceptions) and total it.";
          }
          return "Write a 1-page monthly money plan (income → expenses → savings → debt).";
        }

        // stability driver
        if (survivalMonths < 2) {
          const target = monthlyExpensesSafe * 0.85;
          return `Build emergency savings of ${formatCurrencyV2(target)} within 60 days.`;
        }

        const debtSchedule = v2DebtSchedule;
        if (
          debtSchedule.payoffMonths === Infinity ||
          debtSchedule.payoffMonths > 18
        ) {
          return "Increase debt repayment by 1 step this month (even +₹2,000 counts).";
        }

        return "Maintain your current emergency + debt plan for the next 30 days.";
      })();


      const summary = `${categoryBand.label} financial health with ${survivalBand.label.toLowerCase()}.`;

      return {
        behaviourScore,
        awarenessScore,
        stabilityScore: stability.score,
        healthScore,
        categoryBand,
        survivalMonthsRaw: stability.survivalMonthsRaw,
        survivalMonthsDisplay,
        bareMinimumSurvivalMonthsRaw:
          stability.bareMinimumSurvivalMonthsRaw ?? 0,
        bareMinimumSurvivalMonthsDisplay:
          stability.bareMinimumSurvivalMonthsRaw <= 0 ||
          !Number.isFinite(stability.bareMinimumSurvivalMonthsRaw)
            ? "0"
            : stability.bareMinimumSurvivalMonthsRaw >= 60
            ? "60+"
            : Number.isInteger(stability.bareMinimumSurvivalMonthsRaw)
            ? String(stability.bareMinimumSurvivalMonthsRaw)
            : stability.bareMinimumSurvivalMonthsRaw.toFixed(1),
        perceivedSurvivalMonths: awarenessGapMetrics.perceivedSurvivalMonths,
        perceivedSurvivalMonthsDisplay,
        actualSurvivalMonths: awarenessGapMetrics.actualSurvivalMonths,
        awarenessGap: awarenessGapMetrics.awarenessGap,
        awarenessGapDisplay,
        blindSpotHeadline: blindSpot.headline,
        blindSpotSummary: blindSpot.summary,
        blindSpotPerceived: blindSpot.perceivedSurvivalMonthsDisplay,
        blindSpotActual: blindSpot.actualSurvivalMonthsDisplay,
        blindSpotGap: blindSpot.gapDisplay,
        blindSpotDirection: blindSpot.direction,
        futureRiskScore: futureRisk.score,
        futureRiskLabel: futureRisk.label,
        personalityType,
        survivalBand,
        componentRows: componentRows.map((row) => {
          const band =
            row.key === "behaviour"
              ? (() => {
                  if (row.score <= 15)
                    return "Critical behaviour risk";
                  if (row.score <= 27)
                    return "Needs behaviour correction";
                  if (row.score <= 35) return "Mostly controlled";
                  return "Strong financial discipline";
                })()
              : row.key === "awareness"
                ? (() => {
                    if (row.score <= 9) return "Low visibility";
                    if (row.score <= 18) return "Basic awareness";
                    if (row.score <= 24) return "Solid tracking";
                    return "High clarity";
                  })()
                : (() => {
                    if (row.score <= 8) return "Fragile stability";
                    if (row.score <= 16) return "Some cushion";
                    if (row.score <= 20) return "Resilient";
                    return "Very stable";
                  })();
          return { ...row, band };
        }),
        lowestComponent,
        strongestComponent,
        recommendedActionText,
        debtSchedule: v2DebtSchedule,
        habits: v2Habits,
        summary,
        personalityReport,
        blindSpot,
      };

  }, [

    assessment.behaviour,
    assessment.awareness,
    assessment.profile,
    assessment.habits,

    v2BehaviourResult,
    v2AwarenessResult,
    v2StabilityResult,
    v2DebtSchedule,
    v2Habits,
    v2FutureRisk,
    v2PersonalityType,
    v2AwarenessGap,
  ]);


  const ui = {
    behaviourQuestions: v2BehaviourQuestions,
    awarenessQuestions: v2AwarenessQuestions,
    componentMaximums: componentMaximumsV2,
    formatCurrency: formatCurrencyV2,
    extraCards: {
      debtSchedule: true,
      habits: true,
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
          />

        </section>

        <aside className="result-stack" aria-label="Financial health result">
          <ScoreOverview result={result} />
          <ComponentBreakdown result={result} />
          <BlindSpotPanel result={result} />
          <SurvivalBlock result={result} assessment={assessment} />
          <ActionBlock result={result} />

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
