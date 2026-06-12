import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Activity,
  BarChart3,
  Brain,
  ChevronLeft,
  ChevronRight,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import ValidationFeedbackForm from "./ValidationFeedbackForm.jsx";
import DecisionSimulator from "./DecisionSimulator.jsx";
import InsightNarrative from "./InsightNarrative.jsx";
import {
  buildAnonymousTelemetryPayload,
  dispatchAnonymousTelemetry,
  dispatchAnonymousFeedbackEvent,
} from "../lib/scoring-v2.js";
import { ASSESSMENT_FIELDS, ASSESSMENT_OPTIONS, ASSESSMENT_BUTTONS } from "../lib/copy.js";

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
            placeholder={ASSESSMENT_FIELDS.name.placeholder}
          />
        </label>

        <label className="field-input">
          <span>Age</span>
          <input
            type="number"
            min="0"
            value={values.age ?? ""}
            onChange={(e) => onChange("age", e.target.value)}
            placeholder={ASSESSMENT_FIELDS.age.placeholder}
          />
        </label>

        <label className="field-input participant-email">
          <span>Email</span>
          <input
            type="email"
            value={values.email ?? ""}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder={ASSESSMENT_FIELDS.email.placeholder}
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

function LiveResultSnapshot({ result }) {
  const score = Math.max(0, Math.min(100, Math.round(result.healthScore ?? 0)));
  const scoreLabel = result.categoryBand?.label ?? "Live profile";
  const componentRows = result.componentRows ?? [];

  return (
    <section className={`result-card live-score-card tone-${result.categoryBand?.tone ?? "steady"}`}>
      <div className="live-score-header">
        <div>
          <span className="metric-label">Live Health Score</span>
          <strong>{score}/100</strong>
          <p>{scoreLabel}</p>
        </div>
        <div className="live-score-orbit" style={{ "--score-progress": `${score}%` }}>
          <Gauge size={18} />
          <span>{score}</span>
        </div>
      </div>

      <div className="live-score-meta">
        <div>
          <span>Personality</span>
          <strong>{result.personalityType}</strong>
        </div>
        <div>
          <span>Risk</span>
          <strong>{result.futureRiskLabel}</strong>
        </div>
      </div>

      <div className="live-breakdown-bars" aria-label="Live component breakdown">
        {componentRows.map((row) => (
          <div className="live-breakdown-row" key={row.key}>
            <div>
              <span>{row.label}</span>
              <strong>
                {row.score}/{row.max}
              </strong>
            </div>
            <div className="bar-track" aria-hidden="true">
              <span style={{ width: `${row.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const incomeStabilityOptions = [
  ...ASSESSMENT_OPTIONS.incomeStability,
];

const dependentsOptions = [
  ...ASSESSMENT_OPTIONS.dependents,
];

export default function AssessmentSection({ assessment, result, onChange, onSaveAssessment, ui, resetTrigger }) {
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
  const [validationErrors, setValidationErrors] = useState([]);

  const handleFieldChange = (group, key, value) => {
    if (validationErrors.length) {
      setValidationErrors([]);
    }
    onChange(group, key, value);
  };

  const validateCurrentStep = () => {
    const errors = [];
    const { participant, behaviour, awareness, profile, habits } = assessment;

    // Participant validation
    if (!participant.name || !participant.name.trim()) {
      errors.push("⚠️ Please enter your name.");
    }
    if (!participant.age || Number(participant.age) <= 0 || Number.isNaN(Number(participant.age))) {
      errors.push("⚠️ Enter a valid age greater than zero.");
    }
    if (participant.email && !/^\S+@\S+\.\S+$/.test(participant.email)) {
      errors.push("⚠️ Enter a valid email address.");
    }

    const addMissingAnswer = (question, group) => {
      if (!assessment[group]?.[question.key]) {
        errors.push(`⚠️ Answer: "${question.prompt}"`);
      }
    };

    if (currentStep === 0) {
      ui.behaviourQuestions.forEach((question) => addMissingAnswer(question, "behaviour"));
    }

    if (currentStep === 1) {
      ui.awarenessQuestions.forEach((question) => addMissingAnswer(question, "awareness"));
    }

    if (currentStep === 2) {
      // Validate income
      if (profile.monthlyIncome === '' || profile.monthlyIncome === undefined) {
        errors.push("⚠️ Monthly income is required.");
      } else if (Number(profile.monthlyIncome) < 0) {
        errors.push("❌ Monthly income cannot be negative.");
      } else if (Number(profile.monthlyIncome) === 0) {
        errors.push("⚠️ Monthly income should be greater than zero.");
      }

      // Validate expenses
      if (profile.monthlyExpenses === '' || profile.monthlyExpenses === undefined) {
        errors.push("⚠️ Monthly expenses are required.");
      } else if (Number(profile.monthlyExpenses) < 0) {
        errors.push("❌ Monthly expenses cannot be negative.");
      } else if (Number(profile.monthlyExpenses) === 0) {
        errors.push("⚠️ Monthly expenses should be greater than zero.");
      }

      // Validate debt (optional but cannot be negative)
      if (profile.totalDebt !== undefined && profile.totalDebt !== '' && Number(profile.totalDebt) < 0) {
        errors.push("❌ Total debt cannot be negative.");
      }

      // Validate emergency savings (optional but cannot be negative)
      if (profile.emergencySavingsFixed !== undefined && Number(profile.emergencySavingsFixed) < 0) {
        errors.push("❌ Emergency savings cannot be negative.");
      }
      if (profile.emergencySavingsDiscretionary !== undefined && Number(profile.emergencySavingsDiscretionary) < 0) {
        errors.push("❌ Discretionary savings cannot be negative.");
      }

      // Validate liabilities (optional but cannot be negative)
      if (profile.monthlyLiabilities !== undefined && Number(profile.monthlyLiabilities) < 0) {
        errors.push("❌ Fixed commitments cannot be negative.");
      }
    }

    if (currentStep === 3 && mode === "v2") {
      ui.habitsQuestions.forEach((question) => addMissingAnswer(question, "habits"));
    }

    return errors;
  };

  useEffect(() => {
    if (resetTrigger !== undefined) {
      setCurrentStep(0);
      setShowFeedback(false);
    }
  }, [resetTrigger]);

  const mode = result?.mode || "v2";
  const steps = [
    ...ASSESSMENT_SECTIONS.filter(s => !s.conditional).map(s => ({ ...s, icon: eval(s.icon) })),
    ...(mode === "v2" ? [ASSESSMENT_SECTIONS.find(s => s.conditional)].filter(Boolean).map(s => ({ ...s, icon: Activity })) : []),
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
    const errors = validateCurrentStep();
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      
      // If it's the final step, offer to proceed anyway
      if (isLastStep) {
        const confirmed = window.confirm(
          `⚠️ Some fields are incomplete:\n\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n... and ${errors.length - 3} more` : ''}\n\n` +
          `Continue to submit anyway?\n\nYour partial answers will be saved.`
        );
        
        if (!confirmed) {
          return;
        }
      } else {
        // For non-final steps, don't proceed
        return;
      }
    }

    if (currentStep < totalSteps - 1) {
      handleStepChange(currentStep + 1);
      return;
    }

    // Final step - submit assessment
    try {
      const payload = buildAnonymousTelemetryPayload(result, assessment);
      await dispatchAnonymousTelemetry(payload, "/api/telemetry");
      if (typeof onSaveAssessment === "function") {
        onSaveAssessment();
      }
      setShowFeedback(true);
    } catch (error) {
      console.error("Error submitting assessment:", error);
      setValidationErrors(['❌ Error submitting assessment. Please try again.']);
    }
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
                <WizardStep
                  key={step.id}
                  step={step}
                  index={idx}
                  isActive={idx <= currentStep}
                  isCurrent={idx === currentStep}
                  isLast={idx === steps.length - 1}
                />
              ))}
            </div>
          )}

          <ParticipantSection values={assessment.participant} onChange={handleFieldChange} />

          {validationErrors.length > 0 && (
            <div className="validation-alert" role="alert">
              <strong>Fix these fields before continuing:</strong>
              <ul>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
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
              onChange={handleFieldChange}
            />
          )}

          {!showFeedback && currentStep === 3 && mode === "v2" && (
            <QuestionSection
              icon={Activity}
              title="Habits"
              score={`${result.habits.habitScore}/100`}
              questions={ui.habitsQuestions}
              values={assessment.habits}
              onChange={handleFieldChange}
            />
          )}

          {!showFeedback && (
            <div className="wizard-nav-footer">
              <button type="button" className="wizard-secondary-btn" onClick={handlePrev} disabled={currentStep === 0}>
                <ChevronLeft size={16} />
                Previous
              </button>

              <button type="button" className="wizard-primary-btn" onClick={handleNext}>
                {isLastStep ? ASSESSMENT_BUTTONS.finishReviewScore : ASSESSMENT_BUTTONS.continue}
                {!isLastStep && <ChevronRight size={16} />}
              </button>
            </div>
          )}

          {showFeedback && (
            <ValidationFeedbackForm
              healthScore={result.healthScore}
              onSubmitFeedback={async (feedbackPayload) => {
                const ok = await dispatchAnonymousFeedbackEvent(feedbackPayload, "/api/feedback");
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
              <LiveResultSnapshot result={result} />
              <InsightNarrative result={result} assessment={assessment} />
              <DecisionSimulator
                id="simulator"
                profile={assessment.profile}
                behaviour={assessment.behaviour}
              />
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function WizardStep({ step, index, isActive, isCurrent, isLast }) {
  const StepIcon = step.icon;

  return (
    <div
      className={`wizard-node ${isActive ? "active" : ""} ${isCurrent ? "current" : ""}`}
    >
      <div className="wizard-node-marker">
        <StepIcon size={13} />
        <span>{index + 1}</span>
      </div>
      <span className="wizard-node-label">{step.label}</span>
      {!isLast && <div className="wizard-node-connector" />}
    </div>
  );
}
