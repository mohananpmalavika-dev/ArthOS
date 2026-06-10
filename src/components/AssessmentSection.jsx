import React, { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Brain,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import ValidationFeedbackForm from "./ValidationFeedbackForm.jsx";
import DecisionSimulator from "./DecisionSimulator.jsx";
import InsightNarrative from "./InsightNarrative.jsx";
import {
  buildAnonymousTelemetryPayload,
  dispatchAnonymousTelemetry,
  dispatchAnonymousFeedback,
} from "../lib/scoring-v2.js";

function ParticipantSection({ values, onChange }) {
  return (
    <div className="participant-card">
      <div className="participant-grid">
        <label className="field-input">
          <span>Name</span>
          <input
            type="text"
            value={values.name ?? ""}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Your name"
          />
        </label>

        <label className="field-input">
          <span>Age</span>
          <input
            type="number"
            min="0"
            value={values.age ?? ""}
            onChange={(e) => onChange("age", e.target.value)}
            placeholder="Age"
          />
        </label>

        <label className="field-input participant-email">
          <span>Email</span>
          <input
            type="email"
            value={values.email ?? ""}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="you@domain.com"
          />
        </label>
      </div>
    </div>
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
        <div className="money-input rate-input">
          <div>
            <span>%</span>
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
        <div className="money-input rate-input">
          <div>
            <span>%</span>
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
          <label key={option.value} className={`segmented-option ${checked ? "selected" : ""}`}>
            <input type="radio" name={name} value={option.value} checked={checked} onChange={() => onChange(option.value)} />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

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

export default function AssessmentSection({ assessment, result, onChange, ui, resetTrigger }) {
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const saved = window.localStorage.getItem("arth-os-wizard-step");
      return saved ? Math.min(parseInt(saved, 10), 4) : 0;
    } catch (error) {
      console.warn("Could not restore wizard step:", error);
      return 0;
    }
  });
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (resetTrigger !== undefined) {
      setCurrentStep(0);
      setShowFeedback(false);
    }
  }, [resetTrigger]);

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
    await dispatchAnonymousTelemetry(payload, "/api/telemetry");
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

          <ParticipantSection values={assessment.participant} onChange={(key, value) => onChange("participant", key, value)} />

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
              <button type="button" className="wizard-secondary-btn" onClick={handlePrev} disabled={currentStep === 0}>
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
                    const ok = await dispatchAnonymousFeedback(feedbackPayload, "/api/feedback");
                    const resultsEl = document.querySelector(".result-stack");
                    if (resultsEl) {
                      resultsEl.scrollIntoView({ behavior: "smooth", block: "center" });
                      setTimeout(() => {
                        resultsEl.tabIndex = -1;
                        resultsEl.focus();
                      }, 600);
                    }
                    return ok;
                  }}
                />
          )}
        </section>

        <aside className="result-stack" aria-label="Financial health result" role="region" aria-live="polite" tabIndex={-1}>
          {result && result.healthScore !== undefined && (
            <div className="result-stack-inner">
              <InsightNarrative result={result} assessment={assessment} />
              <DecisionSimulator profile={assessment.profile} />
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
