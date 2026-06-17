import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useSettings } from "../context/SettingsContext.jsx";

export default function ConsentBanner() {
  const { settings, saveSetting } = useSettings();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consentValue = settings?.consent;
    if (consentValue === true || consentValue === false) {
      setShowBanner(false);
      return;
    }
    setShowBanner(true);
  }, [settings]);

  const handleAccept = async () => {
    await saveSetting("consent", true);
    setShowBanner(false);
  };

  const handleReject = async () => {
    await saveSetting("consent", false);
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="consent-banner" role="banner" aria-label="Privacy and data consent">
      <div className="consent-banner-content">
        <div>
          <h3>Privacy & Data</h3>
          <p>
            We collect anonymous financial health scores and behavioral insights to help improve
            your financial decisions.
            <strong> No personally identifiable information (PII)</strong> is stored — only numeric
            scores, categories, and ratios.
          </p>
          <div className="consent-links">
            <button
              type="button"
              onClick={() => {
                alert("Privacy policy would open here");
              }}
            >
              Privacy Policy
            </button>
            <span className="separator">•</span>
            <button
              type="button"
              onClick={() => {
                alert("Terms would open here");
              }}
            >
              Terms
            </button>
          </div>
        </div>
        <div className="consent-actions">
          <button className="btn-secondary" onClick={handleReject}>
            Reject
          </button>
          <button className="btn-primary" onClick={handleAccept}>
            Accept
          </button>
          <button className="btn-icon" onClick={handleReject} aria-label="Close">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
