import React, { useState, useEffect } from "react";
import { useSettings } from "../context/SettingsContext.jsx";
import { useTelemetry } from "../hooks/useUserInputData.js";
import "./privacy-consent.css";

export default function PrivacyConsent({ onAccept, onManage }) {
  const { settings, saveSetting } = useSettings();
  const { logEvent, sessionId } = useTelemetry();

  const [open, setOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    telemetry: true,
    personalized: true,
    sharedAnonymized: false
  });

  useEffect(() => {
    if (settings?.privacy) {
      setLocalSettings(settings.privacy);
    }
  }, [settings]);

  const toggle = (key) => {
    const next = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(next);
    if (onManage) onManage(next);
  };

  const persistSettings = async (nextSettings) => {
    try {
      await saveSetting("privacy", nextSettings);
    } catch (e) {
      console.warn("[PrivacyConsent] saveSetting failed", e);
    }
  };

  return (
    <div className="privacy-consent" role="region" aria-label="Privacy and telemetry settings">
      <div className="privacy-summary" id="privacy-summary">
        <p>
          We use limited telemetry to improve the product. You control what is shared — enable or disable
          analytics and personalization. You can change these at any time under Settings.
        </p>
        <div className="privacy-actions">
          <button
            className="btn btn-primary"
            aria-describedby="privacy-summary"
            onClick={async () => {
              await persistSettings(localSettings);
              if (logEvent) logEvent("consent.accepted", { settings: localSettings, session_id: sessionId });
              if (onAccept) onAccept(localSettings);
            }}
          >
            Accept & Continue
          </button>
          <button className="btn" onClick={() => setOpen((v) => !v)}>
            {open ? "Close settings" : "Manage settings"}
          </button>
        </div>
      </div>

      {open && (
        <div className="privacy-settings" role="form" aria-labelledby="privacy-summary">
          <div className="privacy-field">
            <input
              id="privacy-telemetry"
              type="checkbox"
              checked={!!localSettings.telemetry}
              onChange={() => toggle("telemetry")}
            />
            <label htmlFor="privacy-telemetry">Allow anonymous telemetry (usage & performance)</label>
          </div>

          <div className="privacy-field">
            <input
              id="privacy-personalized"
              type="checkbox"
              checked={!!localSettings.personalized}
              onChange={() => toggle("personalized")}
            />
            <label htmlFor="privacy-personalized">Enable personalized coaching (use AI personalization)</label>
          </div>

          <div className="privacy-field">
            <input
              id="privacy-shared-anon"
              type="checkbox"
              checked={!!localSettings.sharedAnonymized}
              onChange={() => toggle("sharedAnonymized")}
            />
            <label htmlFor="privacy-shared-anon">Share anonymized data for research (opt-in)</label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              className="btn btn-primary"
              aria-label="Save privacy settings"
              onClick={async () => {
                await persistSettings(localSettings);
                if (logEvent) logEvent("consent.updated", { settings: localSettings, session_id: sessionId });
                if (onManage) onManage(localSettings);
                setOpen(false);
              }}
            >
              Save settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
