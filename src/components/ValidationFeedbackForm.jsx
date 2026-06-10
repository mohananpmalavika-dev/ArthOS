// src/components/ValidationFeedbackForm.jsx
import { useState, useRef, useEffect } from "react";
import { MessageSquare, ThumbsUp } from "lucide-react";

export default function ValidationFeedbackForm({ healthScore, onSubmitFeedback }) {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedImpact, setSelectedImpact] = useState(null);
  const [qualitativeNote, setQualitativeNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);
  const successRef = useRef(null);

  useEffect(() => {
    if (hasVoted && successRef.current) {
      successRef.current.focus();
    }
  }, [hasVoted]);

  const impactOptions = [
    { value: "survival_months", label: "Time to Financial Crisis" },
    { value: "recommended_action", label: "Next Action to Take" },
    { value: "awareness_gap", label: "Visibility Blind Spot" },
    { value: "personality_archetype", label: "Money Archetype Profile" },
  ];

  const handleSubmit = async () => {
    if (!selectedImpact) {
      return;
    }

    setIsSubmitting(true);
    try {
      setSubmissionError(false);
      const feedbackPayload = {
        score_context: { health_score: healthScore },
        primary_value_driver: selectedImpact,
        user_feedback_notes: qualitativeNote,
      };
      const ok = await onSubmitFeedback(feedbackPayload);
      if (ok) {
        setHasVoted(true);
      } else {
        setSubmissionError(true);
      }
    } catch (error) {
      console.error("Feedback submission error:", error);
      setSubmissionError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasVoted) {
    return (
      <div className="validation-feedback-form-card">
        <div
          className="feedback-success"
          role="status"
          aria-live="polite"
          ref={(el) => (successRef.current = el)}
          tabIndex={-1}
        >
          <ThumbsUp size={36} />
          <h3>Thanks - feedback received</h3>
          <p>Your feedback helps improve the assessment and insights.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              type="button"
              className="view-results-btn"
              onClick={() => {
                const resultsEl = document.querySelector(".result-stack");
                if (resultsEl) {
                  resultsEl.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(() => {
                    resultsEl.tabIndex = -1;
                    resultsEl.focus();
                  }, 600);
                }
              }}
            >
              View Results
            </button>
            <button
              type="button"
              className="feedback-close-btn ghost-button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="validation-feedback-form-card">
      <div className="feedback-header">
        <MessageSquare size={20} />
        <h3>What Did You Find Most Valuable?</h3>
        <p>Help us understand which insights matter most to you.</p>
      </div>

      <fieldset className="feedback-options">
        <legend>Primary Value Driver</legend>
        {impactOptions.map((option) => (
          <label key={option.value} className="feedback-option">
            <input
              type="radio"
              name="impact"
              value={option.value}
              checked={selectedImpact === option.value}
              onChange={(e) => setSelectedImpact(e.target.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>

      <div className="feedback-textarea-wrapper">
        <label htmlFor="feedback-notes">Additional Notes (Optional)</label>
        <textarea
          id="feedback-notes"
          placeholder="Share any additional thoughts or suggestions..."
          maxLength="1000"
          value={qualitativeNote}
          onChange={(e) => setQualitativeNote(e.target.value)}
          rows="4"
        />
        <small>{qualitativeNote.length}/1000 characters</small>
      </div>

      <button
        type="button"
        className="feedback-submit-btn"
        onClick={handleSubmit}
        disabled={!selectedImpact || isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit Feedback"}
      </button>
      {submissionError && (
        <div className="feedback-error" role="alert" style={{ marginTop: 10 }}>
          <span>Feedback couldn't be submitted - please retry.</span>
          <button
            type="button"
            className="feedback-retry-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ marginLeft: 8 }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
