import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const CONSENT_KEY = "arth-os-data-consent";

export default function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Only show if user hasn't given consent
    const hasConsent = window.localStorage.getItem(CONSENT_KEY) === "true";
    if (!hasConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    window.localStorage.setItem(CONSENT_KEY, "true");
    setShowBanner(false);
  };

  const handleReject = () => {
    window.localStorage.setItem(CONSENT_KEY, "false");
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
            <a
              href="#privacy"
              onClick={e => {
                e.preventDefault();
                alert("Privacy policy would open here");
              }}
            >
              Privacy Policy
            </a>
            <span className="separator">•</span>
            <a
              href="#terms"
              onClick={e => {
                e.preventDefault();
                alert("Terms would open here");
              }}
            >
              Terms
            </a>
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
