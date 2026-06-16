import React, { useState, useEffect } from "react";
import { useUserPreferences, useTelemetry } from "../hooks/useUserInputData.js";
import "./privacy-consent.css";

export default function PrivacyConsent({ onAccept, onManage }) {
  const { savePreference } = useUserPreferences();
  const { logEvent, sessionId } = useTelemetry();

  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({
    telemetry: true,
    personalized: true,
    sharedAnonymized: false
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("arthos:privacy");
      if (raw) {
        setSettings(JSON.parse(raw));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const toggle = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    if (onManage) onManage(next);
  };

  const persistSettings = async (nextSettings) => {
    try {
      window.localStorage.setItem("arthos:privacy", JSON.stringify(nextSettings));
    } catch (e) {}

    // Save each preference server-side if authenticated
    try {
      await Promise.all(
        Object.keys(nextSettings).map((k) => savePreference(`privacy.${k}`, nextSettings[k]))
      );
    } catch (e) {
      // ignore server persistence errors silently
      console.warn("[PrivacyConsent] savePreference failed", e);
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
              await persistSettings(settings);
              if (logEvent) logEvent("consent.accepted", { settings, session_id: sessionId });
              if (onAccept) onAccept(settings);
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
              checked={!!settings.telemetry}
              onChange={() => toggle("telemetry")}
            />
            <label htmlFor="privacy-telemetry">Allow anonymous telemetry (usage & performance)</label>
          </div>

          <div className="privacy-field">
            <input
              id="privacy-personalized"
              type="checkbox"
              checked={!!settings.personalized}
              onChange={() => toggle("personalized")}
            />
            <label htmlFor="privacy-personalized">Enable personalized coaching (use AI personalization)</label>
          </div>

          <div className="privacy-field">
            <input
              id="privacy-shared-anon"
              type="checkbox"
              checked={!!settings.sharedAnonymized}
              onChange={() => toggle("sharedAnonymized")}
            />
            <label htmlFor="privacy-shared-anon">Share anonymized data for research (opt-in)</label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              className="btn btn-primary"
              aria-label="Save privacy settings"
              onClick={async () => {
                await persistSettings(settings);
                if (logEvent) logEvent("consent.updated", { settings, session_id: sessionId });
                if (onManage) onManage(settings);
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
