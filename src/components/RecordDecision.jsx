import React, { useState } from "react";

function validateDecision({ category, notes }) {
  const errors = {};
  if (!category || category.trim().length < 2) {
    errors.category = "Category must be at least 2 characters";
  }
  if (!notes || notes.trim().length < 5) {
    errors.notes = "Notes must be at least 5 characters";
  }
  return errors;
}

export default function RecordDecision({ userId = "demo", onSaved = () => {} }) {
  const [category, setCategory] = useState("general");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    const candidate = { category, notes };
    const errs = validateDecision(candidate);
    setErrors(errs);
    if (Object.keys(errs).length) {
      return;
    }

    setSaving(true);
    const decision = {
      category: category.trim(),
      notes: notes.trim(),
      goalAlignment: false,
      biasScore: 0,
      futureImpact: 0,
      valueConsistency: 0
    };

    try {
      const res = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, decision })
      });
      if (!res.ok) {
        throw new Error("save failed");
      }
      onSaved();
      setNotes("");
      setCategory("general");
      setErrors({});
    } catch (err) {
      console.warn("Could not save decision", err);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="record-decision summary-card premium-report-block" onSubmit={handleSubmit}>
      <div className="premium-report-block-header">
        <h3 className="premium-report-block-title">Record Decision</h3>
      </div>

      <div className="decision-form-field">
        <label>Category</label>
        <input
          value={category}
          onChange={e => setCategory(e.target.value)}
          className={errors.category ? "decision-input-error" : ""}
        />
        {errors.category && <div className="decision-error-text">{errors.category}</div>}
      </div>

      <div className="decision-form-field">
        <label>Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          className={errors.notes ? "decision-input-error" : ""}
        />
        {errors.notes && <div className="decision-error-text">{errors.notes}</div>}
      </div>

      <div className="decision-form-actions">
        <button type="submit" disabled={saving} className="decision-submit-button">
          {saving ? "Saving…" : "Save Decision"}
        </button>
        <button
          type="button"
          className="decision-reset-button"
          onClick={() => {
            setCategory("general");
            setNotes("");
            setErrors({});
          }}
        >
          Reset
        </button>
      </div>
    </form>
  );
}
