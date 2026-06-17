import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, LayoutGrid, Sparkles } from "lucide-react";
import { useViewMode } from "../hooks/useViewMode.js";
import { VIEW_MODES } from "../lib/viewMode.js";

export default function AppViewSettings() {
  const navigate = useNavigate();
  const { viewMode, setViewMode } = useViewMode();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSelect = async nextMode => {
    if (nextMode === viewMode) {
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await setViewMode(nextMode);
      setMessage(
        nextMode === VIEW_MODES.simple
          ? "Switched to Simple Guide. Menu and home page updated."
          : "Switched to Full Experience. All dashboards are now available."
      );
      navigate("/dashboard/home", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="summary-card app-view-settings">
      <h2>App view</h2>
      <p className="app-view-settings-copy">
        Choose between the full dashboard or the simplified guide. Your choice updates navigation and
        the home page.
      </p>

      <div className="app-view-settings-grid">
        <button
          type="button"
          className={`app-view-settings-option ${viewMode === VIEW_MODES.classic ? "active" : ""}`}
          onClick={() => handleSelect(VIEW_MODES.classic)}
          disabled={saving}
        >
          <LayoutGrid size={20} aria-hidden="true" />
          <div>
            <strong>Full Experience</strong>
            <span>Current view — all features</span>
          </div>
          {viewMode === VIEW_MODES.classic && <Check size={16} aria-hidden="true" />}
        </button>

        <button
          type="button"
          className={`app-view-settings-option ${viewMode === VIEW_MODES.simple ? "active" : ""}`}
          onClick={() => handleSelect(VIEW_MODES.simple)}
          disabled={saving}
        >
          <Sparkles size={20} aria-hidden="true" />
          <div>
            <strong>Simple Guide</strong>
            <span>New easy view — score & one action</span>
          </div>
          {viewMode === VIEW_MODES.simple && <Check size={16} aria-hidden="true" />}
        </button>
      </div>

      {message && <p className="app-view-settings-message">{message}</p>}
    </section>
  );
}
