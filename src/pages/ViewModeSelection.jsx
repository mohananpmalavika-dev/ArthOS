import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { useViewMode } from "../hooks/useViewMode.js";
import { VIEW_MODE_OPTIONS, VIEW_MODES } from "../lib/viewMode.js";
import "./view-mode-selection.css";

export default function ViewModeSelection() {
  const navigate = useNavigate();
  const { viewMode, setViewMode } = useViewMode();
  const [selected, setSelected] = useState(viewMode || VIEW_MODES.classic);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    setSaving(true);
    try {
      await setViewMode(selected);
      navigate("/dashboard/home", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="view-mode-page">
      <div className="view-mode-card">
        <p className="view-mode-eyebrow">Welcome back</p>
        <h1>How would you like to use ARTH.OS?</h1>
        <p className="view-mode-lede">
          Pick the view that feels right. You can change this anytime in Settings.
        </p>

        <div className="view-mode-options">
          {VIEW_MODE_OPTIONS.map(option => {
            const Icon = option.icon;
            const isSelected = selected === option.id;

            return (
              <button
                key={option.id}
                type="button"
                className={`view-mode-option ${isSelected ? "selected" : ""}`}
                onClick={() => setSelected(option.id)}
                aria-pressed={isSelected}
              >
                <div className="view-mode-option-top">
                  <span className="view-mode-option-icon">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{option.title}</strong>
                    <span className="view-mode-option-subtitle">{option.subtitle}</span>
                  </div>
                  {isSelected && (
                    <span className="view-mode-selected-badge" aria-hidden="true">
                      <Check size={16} />
                    </span>
                  )}
                </div>
                <p>{option.description}</p>
                <ul>
                  {option.highlights.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="view-mode-continue-btn"
          onClick={handleContinue}
          disabled={saving}
        >
          {saving ? "Saving..." : `Continue with ${selected === VIEW_MODES.simple ? "Simple Guide" : "Full Experience"}`}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
