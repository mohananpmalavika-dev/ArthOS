import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gauge,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  Zap
} from "lucide-react";
import ValidationFeedbackForm from "./ValidationFeedbackForm.jsx";
import DecisionSimulator from "./DecisionSimulator.jsx";
import InsightNarrative from "./InsightNarrative.jsx";
import SurvivalHero from "./SurvivalHero.jsx";
import {
  buildAnonymousTelemetryPayload,
  dispatchAnonymousTelemetry,
  dispatchAnonymousFeedbackEvent
} from "../lib/scoring-v2.js";
import {
  startAssessmentSession,
  recordStepEntry,
  markStepCompleted,
  markAssessmentCompleted,
  archiveSession,
  buildStepTelemetryPayload
} from "../engines/assessmentTelemetry.js";
import {
  getFilteredQuestions,
  getFilteredQuestionsWithProgress,
  getAdaptiveMetrics,
  estimateTotalTime
} from "../engines/adaptiveQuestionEngine.js";
import {
  saveDraft,
  loadDraft,
  clearDraft,
  setupAutoSave,
  setupBeforeUnload
} from "../engines/assessmentAutoSave.js";
import {
  ASSESSMENT_FIELDS,
  ASSESSMENT_OPTIONS,
  ASSESSMENT_BUTTONS,
  ASSESSMENT_SECTIONS
} from "../lib/copy.ts";

// Icon registry mapping icon names to actual components (replaces eval())
const ICON_REGISTRY = {
  Brain,
  BarChart3,
  ShieldCheck,
  Activity
};

// ── G3: Idle detection thresholds ──
const IDLE_NUDGE_THRESHOLD_MS = 15000; // 15s without interaction → gentle nudge
const IDLE_SKIP_THRESHOLD_MS = 30000; // 30s → offer skip

const STEP_STORAGE_KEY = "arth-os-wizard-step";
const EXPRESS_MODE_KEY = "arth-os-express-mode";

function ParticipantSection({ values, onChange }) {
  return (
    <div className="participant-card">
      <div className="participant-grid">
        <label className="field-input">
          <span>Name</span>
          <input
            type="text"
            value={values.name ?? ""}
            onChange={e => onChange("name", e.target.value)}
            placeholder={ASSESSMENT_FIELDS.name.placeholder}
          />
        </label>

        <label className="field-input">
          <span>Age</span>
          <input
            type="number"
            min="0"
            value={values.age ?? ""}
            onChange={e => onChange("age", e.target.value)}
            placeholder={ASSESSMENT_FIELDS.age.placeholder}
          />
        </label>

        <label className="field-input participant-email">
          <span>Email</span>
          <input
            type="email"
            value={values.email ?? ""}
            onChange={e => onChange("email", e.target.value)}
            placeholder={ASSESSMENT_FIELDS.email.placeholder}
          />
        </label>
      </div>
    </div>
  );
}

function QuestionContext({ context }) {
  const [open, setOpen] = useState(false);
  if (!context) {
    return null;
  }

  return (
    <span className="question-context-wrapper">
      <button
        type="button"
        className="question-context-toggle"
        onClick={e => {
          e.stopPropagation();
          setOpen(o => !o);
        }}
        aria-label="Why this matters"
        title="Why this matters"
      >
        <HelpCircle size={14} />
      </button>
      {open && (
        <div className="question-context-tooltip" onClick={e => e.stopPropagation()}>
          <strong>Why this matters</strong>
          <p>{context}</p>
        </div>
      )}
    </span>
  );
}

function QuestionSection({
  icon: Icon,
  title,
  score,
  questions,
  values,
  onChange,
  progress,
  answeredKeys
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <Icon size={20} />
          <h2>{title}</h2>
        </div>
        <span>{score}</span>
      </div>

      {/* ── G3: Enhanced progress bar with animated fill ── */}
      {progress && (
        <div className="adaptive-question-progress" aria-label="Question progress">
          <span className="adaptive-q-counter">
            Question {progress.current} of {progress.total}
          </span>
          <div className="adaptive-q-track">
            <span
              className="adaptive-q-fill"
              style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="question-list">
        {questions.map((question, qi) => {
          const isAnswered = Boolean(values[question.key]);
          return (
            <div
              className={`question-row ${isAnswered ? "answered" : ""}`}
              key={question.key}
              data-question-key={question.key}
            >
              <label className="question-label" id={`${question.key}-label`}>
                {question.prompt}
                {/* ── G3: "Why This Matters" context tooltip ── */}
                <QuestionContext context={question.context} />
              </label>
              <SegmentedControl
                labelledBy={`${question.key}-label`}
                name={question.key}
                options={question.options}
                value={values[question.key]}
                onChange={value => onChange(question.key, value)}
              />
            </div>
          );
        })}
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
          onChange={value => onChange("monthlyExpenses", value)}
        />
        <MoneyInput
          label="Fixed emergency buffer"
          value={values.emergencySavingsFixed}
          onChange={value => onChange("emergencySavingsFixed", value)}
        />
        <MoneyInput
          label="Discretionary emergency buffer"
          value={values.emergencySavingsDiscretionary}
          onChange={value => onChange("emergencySavingsDiscretionary", value)}
        />
        <MoneyInput
          label="Total debt"
          value={values.totalDebt}
          onChange={value => onChange("totalDebt", value)}
        />
        <MoneyInput
          label="Monthly income"
          value={values.monthlyIncome}
          onChange={value => onChange("monthlyIncome", value)}
        />
        <MoneyInput
          label="Fixed commitments"
          value={values.monthlyLiabilities}
          onChange={value => onChange("monthlyLiabilities", value)}
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
          onChange={value => onChange("incomeStability", value)}
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
          onChange={value => onChange("dependentsBucket", value)}
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
              onChange={e =>
                onChange(
                  "debtRepaymentRatePctOfIncome",
                  e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
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
              onChange={e =>
                onChange(
                  "averageInterestRatePct",
                  e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
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
  const [error, setError] = useState("");

  const handleChange = event => {
    const val = event.target.value;
    const numVal = val === "" ? 0 : Number.parseFloat(val);

    // Validation
    if (val === "") {
      setError("");
      onChange(0);
    } else if (isNaN(numVal)) {
      setError("❌ Please enter a valid number");
      return;
    } else if (numVal < 0) {
      setError("❌ Cannot be negative");
      onChange(0);
    } else {
      setError("");
      onChange(numVal);
    }
  };

  return (
    <label className="money-input">
      <span>
        {label}
        <span className="required-indicator" title="Required field">
          *
        </span>
      </span>
      <div>
        <span>INR</span>
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={value ?? ""}
          onChange={handleChange}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `error-${label}` : undefined}
        />
      </div>
      {error && (
        <span className="validation-error" id={`error-${label}`}>
          {error}
        </span>
      )}
    </label>
  );
}

function SegmentedControl({ labelledBy, name, options, value, onChange }) {
  return (
    <div className="segmented-control" role="radiogroup" aria-labelledby={labelledBy}>
      {options.map(option => {
        const checked = option.value === value;
        return (
          <label key={option.value} className={`segmented-option ${checked ? "selected" : ""}`}>
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

function LiveResultSnapshot({ result }) {
  if (!result || !result.healthScore) {
    return null;
  }

  const score = Math.max(0, Math.min(100, Math.round((result.healthScore ?? 0) / 10)));
  const scoreLabel = result.categoryBand?.label;
  const componentRows = result.componentRows ?? [];

  return (
    <section
      className={`result-card live-score-card tone-${result.categoryBand?.tone ?? "steady"}`}
    >
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
        {componentRows.map(row => (
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

// ── G3: Step completed celebration component ──
function StepCelebration({ stepLabel }) {
  return (
    <div className="step-celebration">
      <div className="step-celebration-icon">
        <div className="step-celebration-checkmark">✓</div>
      </div>
      <div className="step-celebration-text">
        <strong>{stepLabel} complete!</strong>
        <span>Moving to next section</span>
      </div>
    </div>
  );
}

// ── G3: Resume Prompt Banner ──
function ResumeBanner({ onResume, onDismiss }) {
  return (
    <div className="resume-banner">
      <div className="resume-banner-content">
        <RotateCcw size={18} />
        <div>
          <strong>Welcome back!</strong>
          <span>You have an assessment in progress. Continue where you left off?</span>
        </div>
      </div>
      <div className="resume-banner-actions">
        <button type="button" className="resume-banner-btn primary" onClick={onResume}>
          Resume
        </button>
        <button type="button" className="resume-banner-btn secondary" onClick={onDismiss}>
          Start Fresh
        </button>
      </div>
    </div>
  );
}

const incomeStabilityOptions = [...ASSESSMENT_OPTIONS.incomeStability];

const dependentsOptions = [...ASSESSMENT_OPTIONS.dependents];

export default function AssessmentSection({
  assessment,
  result,
  onChange,
  onSaveAssessment,
  ui,
  resetTrigger
}) {
  // ── G3: Express Mode State ──
  const [expressMode, setExpressMode] = useState(() => {
    try {
      return window.localStorage.getItem(EXPRESS_MODE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleExpressMode = useCallback(() => {
    setExpressMode(prev => {
      const next = !prev;
      try {
        window.localStorage.setItem(EXPRESS_MODE_KEY, String(next));
      } catch (error) {
        console.error("[AssessmentSection] Failed to save express mode preference:", {
          mode: next,
          error: error?.message
        });
      }
      return next;
    });
  }, []);

  // ── G3: Resume draft support ──
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [resumeRestore, setResumeRestore] = useState(null);

  // ── Adaptive Question Engine: compute visible (filtered) questions ──
  const adaptation = React.useMemo(() => {
    const behaviour = getFilteredQuestionsWithProgress(
      "behaviour",
      ui.behaviourQuestions,
      assessment.behaviour,
      Object.keys(assessment.behaviour),
      { expressMode }
    );
    const awareness = getFilteredQuestionsWithProgress(
      "awareness",
      ui.awarenessQuestions,
      assessment.awareness,
      Object.keys(assessment.awareness),
      { expressMode }
    );
    const habits = getFilteredQuestionsWithProgress(
      "habits",
      ui.habitsQuestions,
      assessment.habits,
      Object.keys(assessment.habits),
      { expressMode }
    );
    const estimatedTime = estimateTotalTime(
      assessment,
      {
        behaviourQuestions: ui.behaviourQuestions,
        awarenessQuestions: ui.awarenessQuestions,
        habitsQuestions: ui.habitsQuestions
      },
      { expressMode }
    );
    return { behaviour, awareness, habits, estimatedTime };
  }, [
    assessment.behaviour,
    assessment.awareness,
    assessment.habits,
    ui.behaviourQuestions,
    ui.awarenessQuestions,
    ui.habitsQuestions,
    expressMode
  ]);

  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STEP_STORAGE_KEY);
      return saved ? Math.min(parseInt(saved, 10), 4) : 0;
    } catch (error) {
      console.warn("Could not restore wizard step:", error);
      return 0;
    }
  });
  const [showFeedback, setShowFeedback] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // ── G3: Step celebration state ──
  const [celebration, setCelebration] = useState(null); // { stepLabel, visible }

  // ── G3: Auto-Save setup refs ──
  const stateRef = useRef({ assessment, currentStep, expressMode });
  stateRef.current = { assessment, currentStep, expressMode };

  // Debounced save on answer change
  const debouncedSave = useMemo(() => {
    let timer = null;
    let lastCall = 0;
    return step => {
      const now = Date.now();
      if (now - lastCall >= 2000) {
        lastCall = now;
        saveDraft(stateRef.current.assessment, step, stateRef.current.expressMode);
      } else {
        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          lastCall = Date.now();
          saveDraft(stateRef.current.assessment, step, stateRef.current.expressMode);
        }, 2000);
      }
    };
  }, []);

  // Setup auto-save on mount
  useEffect(() => {
    const cleanupAutoSave = setupAutoSave(() => stateRef.current);
    const cleanupBeforeUnload = setupBeforeUnload(() => stateRef.current);
    return () => {
      cleanupAutoSave();
      cleanupBeforeUnload();
    };
  }, []);

  // ── G3: Check for resume draft on mount ──
  useEffect(() => {
    const draft = loadDraft();
    // Show resume banner when: step > 0 AND participant name exists (meaningful progress)
    // BUGFIX: was checking `!draft.assessment.participant?.name` which inverted the condition
    if (
      draft &&
      draft.currentStep > 0 &&
      draft.assessment.participant?.name &&
      draft.assessment.participant?.name.trim()
    ) {
      setShowResumeBanner(true);
      setResumeRestore(draft);
    }
  }, []);

  const handleResume = useCallback(() => {
    if (resumeRestore) {
      const restoredStep = resumeRestore.currentStep;
      // Restore the draft state
      setCurrentStep(restoredStep);
      if (resumeRestore.expressMode !== undefined) {
        setExpressMode(resumeRestore.expressMode);
      }
      // Import the draft values back into the assessment
      if (resumeRestore.assessment) {
        const draft = resumeRestore.assessment;
        Object.keys(draft).forEach(group => {
          if (typeof draft[group] === "object" && draft[group] !== null) {
            Object.keys(draft[group]).forEach(key => {
              if (draft[group][key] !== undefined && draft[group][key] !== "") {
                onChange(group, key, draft[group][key]);
              }
            });
          }
        });
      }
    }
    setShowResumeBanner(false);
    setResumeRestore(null);
    const finalStep = resumeRestore?.currentStep ?? 0;
    startAssessmentSession();
    recordStepEntry(finalStep, finalStep + 1);
  }, [resumeRestore, onChange]);

  const handleDismissResume = useCallback(() => {
    setShowResumeBanner(false);
    setResumeRestore(null);
    clearDraft();
  }, []);

  const handleFieldChange = (group, key, value) => {
    if (validationErrors.length) {
      setValidationErrors([]);
    }
    onChange(group, key, value);
    // Save draft on answer
    saveDraft(
      stateRef.current.assessment,
      stateRef.current.currentStep,
      stateRef.current.expressMode
    );
  };

  // ── Compute assessment steps BEFORE useEffect hooks ──
  const mode = result?.mode || "v2";
  const steps = [
    ...ASSESSMENT_SECTIONS.filter(s => !s.conditional).map(s => ({
      ...s,
      icon: ICON_REGISTRY[s.icon] || Activity
    })),
    ...(mode === "v2"
      ? [ASSESSMENT_SECTIONS.find(s => s.conditional)]
          .filter(Boolean)
          .map(s => ({ ...s, icon: ICON_REGISTRY[s.icon] || Activity }))
      : [])
  ];
  const totalSteps = steps.length;

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

    // Validate only VISIBLE (non-skipped) questions for adaptive assessment
    const addMissingAnswer = (question, group) => {
      if (!assessment[group]?.[question.key]) {
        errors.push(`⚠️ Answer: "${question.prompt}"`);
      }
    };

    if (currentStep === 0) {
      adaptation.behaviour.visible.forEach(question => addMissingAnswer(question, "behaviour"));
    }

    if (currentStep === 1) {
      adaptation.awareness.visible.forEach(question => addMissingAnswer(question, "awareness"));
    }

    if (currentStep === 2) {
      // Validate income
      if (profile.monthlyIncome === "" || profile.monthlyIncome === undefined) {
        errors.push("⚠️ Monthly income is required.");
      } else if (Number(profile.monthlyIncome) < 0) {
        errors.push("❌ Monthly income cannot be negative.");
      } else if (Number(profile.monthlyIncome) === 0) {
        errors.push("⚠️ Monthly income should be greater than zero.");
      }

      // Validate expenses
      if (profile.monthlyExpenses === "" || profile.monthlyExpenses === undefined) {
        errors.push("⚠️ Monthly expenses are required.");
      } else if (Number(profile.monthlyExpenses) < 0) {
        errors.push("❌ Monthly expenses cannot be negative.");
      } else if (Number(profile.monthlyExpenses) === 0) {
        errors.push("⚠️ Monthly expenses should be greater than zero.");
      }

      // Validate debt (optional but cannot be negative)
      if (
        profile.totalDebt !== undefined &&
        profile.totalDebt !== "" &&
        Number(profile.totalDebt) < 0
      ) {
        errors.push("❌ Total debt cannot be negative.");
      }

      // Validate emergency savings (optional but cannot be negative)
      if (
        profile.emergencySavingsFixed !== undefined &&
        Number(profile.emergencySavingsFixed) < 0
      ) {
        errors.push("❌ Emergency savings cannot be negative.");
      }
      if (
        profile.emergencySavingsDiscretionary !== undefined &&
        Number(profile.emergencySavingsDiscretionary) < 0
      ) {
        errors.push("❌ Discretionary savings cannot be negative.");
      }

      // Validate liabilities (optional but cannot be negative)
      if (profile.monthlyLiabilities !== undefined && Number(profile.monthlyLiabilities) < 0) {
        errors.push("❌ Fixed commitments cannot be negative.");
      }
    }

    if (currentStep === 3 && mode === "v2") {
      adaptation.habits.visible.forEach(question => addMissingAnswer(question, "habits"));
    }

    return errors;
  };

  // ── Assessment Telemetry: track step entries and session lifecycle ──
  useEffect(() => {
    // Archive any orphaned session from a previous page visit (drop-off)
    // and start a fresh session for this assessment view
    startAssessmentSession();
    recordStepEntry(currentStep, totalSteps);
  }, []); // only on mount

  // Track step changes for telemetry
  useEffect(() => {
    if (currentStep > 0) {
      recordStepEntry(currentStep, totalSteps);
    }
  }, [currentStep, totalSteps]);

  useEffect(() => {
    if (resetTrigger !== undefined) {
      setCurrentStep(0);
      setShowFeedback(false);
      setCelebration(null);
      clearDraft();
    }
  }, [resetTrigger]);

  const isLastStep = currentStep === totalSteps - 1;

  const handleStepChange = newStep => {
    setCurrentStep(newStep);
    try {
      window.localStorage.setItem(STEP_STORAGE_KEY, String(newStep));
    } catch (e) {
      console.warn("Could not persist step:", e);
    }
    // Save draft on step change
    saveDraft(stateRef.current.assessment, newStep, stateRef.current.expressMode);
  };

  const handleNext = async () => {
    const errors = validateCurrentStep();

    if (errors.length > 0) {
      setValidationErrors(errors);

      // If it's the final step, offer to proceed anyway
      if (isLastStep) {
        const confirmed = window.confirm(
          `⚠️ Some fields are incomplete:\n\n${errors.slice(0, 3).join("\n")}${errors.length > 3 ? `\n... and ${errors.length - 3} more` : ""}\n\n` +
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

    // Mark current step as completed in telemetry
    markStepCompleted(currentStep);

    // ── G3: Show step celebration before transitioning ──
    if (currentStep < totalSteps - 1) {
      const stepLabel = steps[currentStep]?.label || `Step ${currentStep + 1}`;
      setCelebration({ stepLabel, visible: true });
      setTimeout(() => {
        setCelebration(null);
        handleStepChange(currentStep + 1);
      }, 1200);
      return;
    }

    // Final step - submit assessment
    try {
      // Mark full assessment as completed for telemetry, archive session
      markAssessmentCompleted();
      archiveSession();
      clearDraft(); // Clear draft on completion

      const payload = buildAnonymousTelemetryPayload(result, assessment);

      // Append step-level telemetry data to the existing payload
      const stepTelemetry = buildStepTelemetryPayload();
      payload.step_telemetry = stepTelemetry.step_telemetry;

      // Append adaptive question metrics for completion-rate analysis
      const adaptiveMetrics = getAdaptiveMetrics(
        assessment,
        {
          behaviourQuestions: ui.behaviourQuestions,
          awarenessQuestions: ui.awarenessQuestions,
          habitsQuestions: ui.habitsQuestions
        },
        { expressMode }
      );
      payload.adaptive_metrics = adaptiveMetrics;

      await dispatchAnonymousTelemetry(payload, "/api/telemetry");
      if (typeof onSaveAssessment === "function") {
        onSaveAssessment();
      }
      setShowFeedback(true);
    } catch (error) {
      console.error("Error submitting assessment:", error);
      setValidationErrors(["❌ Error submitting assessment. Please try again."]);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      handleStepChange(Math.max(currentStep - 1, 0));
    }
  };

  // ── Collect answered keys for idle detection ──
  const answeredKeys = useMemo(() => {
    if (currentStep === 0) {
      return Object.values(assessment.behaviour || {});
    }
    if (currentStep === 1) {
      return Object.values(assessment.awareness || {});
    }
    if (currentStep === 2) {
      return Object.values(assessment.profile || {});
    }
    if (currentStep === 3) {
      return Object.values(assessment.habits || {});
    }
    return [];
  }, [currentStep, assessment]);

  // ── G3: Callback to skip a question user is stuck on ──
  const handleSkipStuckQuestion = useCallback(() => {
    setValidationErrors([]);
  }, []);

  return (
    <section className="assessment-section" id="assessment">
      <div className="assessment-heading">
        <span>Guided Experience</span>
        <h2>
          Run your Financial Health <em>Behavior Score.</em>
        </h2>
        <p>
          Complete the guided assessment step-by-step. The intelligence metrics panel updates
          instantly in real time.
        </p>

        {/* ── G3: Express Mode Toggle ── */}
        <div className="express-mode-toggle">
          <button
            type="button"
            className={`express-mode-btn ${expressMode ? "active" : ""}`}
            onClick={toggleExpressMode}
            aria-pressed={expressMode}
          >
            <Zap size={16} />
            <span>Express Mode</span>
            {expressMode && (
              <span className="express-mode-badge">
                ⚡ ~{Math.max(1, adaptation.estimatedTime)} min
              </span>
            )}
          </button>
          {expressMode && (
            <span className="express-mode-hint">
              Showing highest-impact questions only. You can switch back anytime.
            </span>
          )}
        </div>

        <div className="adaptive-time-badge-row">
          {adaptation.estimatedTime > 0 && (
            <div className="adaptive-time-badge">
              <Clock size={14} />
              <span>~{adaptation.estimatedTime} min</span>
            </div>
          )}
          {expressMode && (
            <div className="adaptive-time-badge express">
              <Zap size={14} />
              <span>
                Express: {Math.max(1, Math.round(adaptation.estimatedTime * 0.6))} min estimate
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="workspace">
        <section className="form-stack" aria-label="Financial health assessment">
          {/* ── G3: Resume Banner ── */}
          {showResumeBanner && (
            <ResumeBanner onResume={handleResume} onDismiss={handleDismissResume} />
          )}

          {/* G3: Step Celebration Overlay */}
          {celebration && celebration.visible && (
            <StepCelebration stepLabel={celebration.stepLabel} />
          )}

          {!showFeedback && !celebration?.visible && (
            <div className="wizard-progress-track" aria-label="Assessment progress">
              {steps.map((step, idx) => (
                <WizardStep
                  key={step.id}
                  step={step}
                  index={idx}
                  isActive={idx <= currentStep}
                  isCurrent={idx === currentStep}
                  isLast={idx === steps.length - 1}
                  isCompleted={idx < currentStep}
                />
              ))}
            </div>
          )}

          {!showFeedback && !celebration?.visible && (
            <ParticipantSection
              values={assessment.participant}
              onChange={(key, value) => handleFieldChange("participant", key, value)}
            />
          )}

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

          {!showFeedback && currentStep === 0 && !celebration?.visible && (
            <>
              <QuestionSection
                icon={Brain}
                title="Psychology"
                score={`${result.behaviourScore}/${ui.componentMaximums.behaviour}`}
                questions={adaptation.behaviour.visible}
                values={assessment.behaviour}
                onChange={(key, value) => handleFieldChange("behaviour", key, value)}
                progress={{
                  current: adaptation.behaviour.currentQ,
                  total: adaptation.behaviour.totalQ
                }}
                answeredKeys={answeredKeys}
              />
              {adaptation.behaviour.totalSaved > 0 && (
                <div className="adaptive-skip-banner">
                  <span className="adaptive-skip-badge">
                    ✂️ {adaptation.behaviour.totalSaved} skipped
                  </span>
                  <span className="adaptive-skip-reason">
                    Based on your answers — fewer questions, same accuracy.
                  </span>
                </div>
              )}
            </>
          )}

          {!showFeedback && currentStep === 1 && !celebration?.visible && (
            <>
              <QuestionSection
                icon={BarChart3}
                title="Clarity"
                score={`${result.awarenessScore}/${ui.componentMaximums.awareness}`}
                questions={adaptation.awareness.visible}
                values={assessment.awareness}
                onChange={(key, value) => handleFieldChange("awareness", key, value)}
                answeredKeys={answeredKeys}
              />
              {adaptation.awareness.totalSaved > 0 && (
                <div className="adaptive-skip-banner">
                  <span className="adaptive-skip-badge">
                    ✂️ {adaptation.awareness.totalSaved} skipped
                  </span>
                  <span className="adaptive-skip-reason">
                    You've got this covered — fewer questions, same accuracy.
                  </span>
                </div>
              )}
            </>
          )}

          {!showFeedback && currentStep === 2 && !celebration?.visible && (
            <ProfileSection
              values={assessment.profile}
              score={`${result.stabilityScore}/${ui.componentMaximums.stability}`}
              onChange={(key, value) => handleFieldChange("profile", key, value)}
            />
          )}

          {!showFeedback && currentStep === 3 && mode === "v2" && !celebration?.visible && (
            <>
              <QuestionSection
                icon={Activity}
                title="Habits"
                score={`${result.habits.habitScore}/100`}
                questions={adaptation.habits.visible}
                values={assessment.habits}
                onChange={(key, value) => handleFieldChange("habits", key, value)}
                answeredKeys={answeredKeys}
              />
              {adaptation.habits.totalSaved > 0 && (
                <div className="adaptive-skip-banner">
                  <span className="adaptive-skip-badge">
                    ✂️ {adaptation.habits.totalSaved} skipped
                  </span>
                  <span className="adaptive-skip-reason">
                    On top of it — fewer questions, same accuracy.
                  </span>
                </div>
              )}
            </>
          )}

          {!showFeedback && !celebration?.visible && (
            <div className="wizard-nav-footer">
              <button
                type="button"
                className="wizard-secondary-btn"
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button type="button" className="wizard-primary-btn" onClick={handleNext}>
                {isLastStep ? ASSESSMENT_BUTTONS.finishReviewScore : ASSESSMENT_BUTTONS.continue}
                {!isLastStep && <ChevronRight size={16} />}
              </button>
            </div>
          )}

          {/* ── G3: Idle nudges ── */}
          {!showFeedback && !celebration?.visible && (
            <IdleNudgeArea
              active={currentStep < totalSteps - 1}
              answeredKeys={answeredKeys}
              onSkip={handleSkipStuckQuestion}
            />
          )}

          {showFeedback && (
            <ValidationFeedbackForm
              healthScore={result.healthScore}
              onSubmitFeedback={async feedbackPayload => {
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

        <aside
          className="result-stack"
          aria-label="Financial health result"
          role="region"
          aria-live="polite"
          tabIndex={-1}
        >
          {result && result.healthScore !== undefined && (
            <div className="result-stack-inner">
              <LiveResultSnapshot result={result} />

              {/* Blueprint key moment: Survival Engine right after assessment completion */}
              <SurvivalHero survivalMonths={result.survivalMonthsRaw} />

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

// ── G3: Idle Nudge Component ──
function IdleNudgeArea({ active, answeredKeys, onSkip }) {
  const [idleState, setIdleState] = useState(null);
  const timerRef = useRef(null);
  const skipTimerRef = useRef(null);

  useEffect(() => {
    if (!active) {
      setIdleState(null);
      return;
    }

    const answeredCount = answeredKeys.filter(Boolean).length;

    // Nudge after 15s if very few answers
    timerRef.current = setTimeout(() => {
      if (answeredCount < 2) {
        setIdleState("nudge");
      }
    }, IDLE_NUDGE_THRESHOLD_MS);

    // Skip offer after 30s if no answers
    skipTimerRef.current = setTimeout(() => {
      if (answeredCount < 1) {
        setIdleState("stuck");
      }
    }, IDLE_SKIP_THRESHOLD_MS);

    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(skipTimerRef.current);
    };
  }, [active, answeredKeys]);

  // Reset state when enough answers come in
  useEffect(() => {
    const answeredCount = answeredKeys.filter(Boolean).length;
    if (answeredCount >= 2) {
      setIdleState(null);
    }
  }, [answeredKeys]);

  if (!idleState) {
    return null;
  }

  return (
    <div className={`idle-nudge ${idleState === "stuck" ? "stuck" : ""}`}>
      {idleState === "nudge" && (
        <div className="idle-nudge-content">
          <AlertTriangle size={14} />
          <span>Not sure? Take your time — there's no wrong answer.</span>
        </div>
      )}
      {idleState === "stuck" && (
        <div className="idle-nudge-content stuck-content">
          <AlertTriangle size={14} />
          <div>
            <span>Having trouble? You can skip this question and come back later.</span>
            <button type="button" className="idle-skip-btn" onClick={onSkip}>
              Skip this question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WizardStep({ step, index, isActive, isCurrent, isLast, isCompleted }) {
  const StepIcon = step.icon;

  return (
    <div
      className={`wizard-node ${isActive ? "active" : ""} ${isCurrent ? "current" : ""} ${isCompleted ? "completed" : ""}`}
    >
      <div className="wizard-node-marker">
        {/* ── G3: Completed steps show checkmark ── */}
        {isCompleted ? <span className="wizard-node-check">✓</span> : <StepIcon size={13} />}
        <span>{index + 1}</span>
      </div>
      <span className="wizard-node-label">{step.label}</span>
      {!isLast && <div className="wizard-node-connector" />}
    </div>
  );
}
