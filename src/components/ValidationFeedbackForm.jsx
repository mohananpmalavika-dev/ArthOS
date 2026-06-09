// src/components/ValidationFeedbackForm.jsx
import { useState } from "react";
import { MessageSquare, ThumbsUp } from "lucide-react";

export default function ValidationFeedbackForm({ healthScore, onSubmitFeedback }) {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedImpact, setSelectedImpact] = useState(null);
  const [qualitativeNote, setQualitativeNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const feedbackPayload = {
        score_context: { health_score: healthScore },
        primary_value_driver: selectedImpact,
        user_feedback_notes: qualitativeNote,
      };
      await onSubmitFeedback(feedbackPayload);
      setHasVoted(true);
    } catch (error) {
      console.error("Feedback submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasVoted) {
    return (
      <div className="validation-feedback-form-card">
        <div className="feedback-success">
          <ThumbsUp size={32} />
          <h3>Thank You!</h3>
          <p>Your feedback helps us improve the assessment experience.</p>
          <small>Redirecting to home...</small>
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
    </div>
  );
}
