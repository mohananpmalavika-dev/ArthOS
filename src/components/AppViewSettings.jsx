import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, LayoutGrid, Sparkles, Compass, BookOpen } from "lucide-react";
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
      let navigatePath = "/dashboard/home";
      let messageText = "";

      if (nextMode === VIEW_MODES.simple) {
        messageText = "Switched to Simple Guide. Menu and home page updated.";
      } else if (nextMode === VIEW_MODES.phase_flow) {
        messageText = "Switched to 4-Phase Journey. New journey mode activated.";
        navigatePath = "/dashboard/phase-flow";
      } else if (nextMode === VIEW_MODES.story_flow) {
        messageText = "Switched to Story Flow. Story journey activated.";
        navigatePath = "/reality";
      } else {
        messageText = "Switched to Full Experience. All dashboards are now available.";
      }

      setMessage(messageText);
      navigate(navigatePath, { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="summary-card app-view-settings">
      <h2>App view</h2>
      <p className="app-view-settings-copy">
        Choose your preferred experience: Full feature set, streamlined guide, 4-phase journey, or narrative story flow.
        Your choice updates navigation and the home page.
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
            <span>All features — dashboards & tools</span>
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
            <span>Easy view — score & one action</span>
          </div>
          {viewMode === VIEW_MODES.simple && <Check size={16} aria-hidden="true" />}
        </button>

        <button
          type="button"
          className={`app-view-settings-option ${viewMode === VIEW_MODES.phase_flow ? "active" : ""}`}
          onClick={() => handleSelect(VIEW_MODES.phase_flow)}
          disabled={saving}
        >
          <Compass size={20} aria-hidden="true" />
          <div>
            <strong>4-Phase Journey</strong>
            <span>Step-by-step guided path</span>
          </div>
          {viewMode === VIEW_MODES.phase_flow && <Check size={16} aria-hidden="true" />}
        </button>

        <button
          type="button"
          className={`app-view-settings-option ${viewMode === VIEW_MODES.story_flow ? "active" : ""}`}
          onClick={() => handleSelect(VIEW_MODES.story_flow)}
          disabled={saving}
        >
          <BookOpen size={20} aria-hidden="true" />
          <div>
            <strong>Story Flow</strong>
            <span>Narrative financial journey</span>
          </div>
          {viewMode === VIEW_MODES.story_flow && <Check size={16} aria-hidden="true" />}
        </button>
      </div>

      {message && <p className="app-view-settings-message">{message}</p>}
    </section>
  );
}
