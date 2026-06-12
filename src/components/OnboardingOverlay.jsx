import React from "react";
import { Activity, BarChart3, ShieldCheck, Sparkles, Download } from "lucide-react";

export default function OnboardingOverlay({ onComplete }) {
  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="onboarding-icon">
            <Sparkles />
          </div>
          <div>
            <h2 id="onboarding-title">Welcome to ARTH.OS</h2>
            <p>Start your first assessment with a guided introduction to the financial health experience.</p>
          </div>
        </div>

        <div className="onboarding-features">
          <div className="onboarding-feature">
            <Activity size={24} />
            <div>
              <strong>Step-by-step assessment</strong>
              <p>Answer behavior, awareness, and stability questions in a guided flow.</p>
            </div>
          </div>
          <div className="onboarding-feature">
            <BarChart3 size={24} />
            <div>
              <strong>Track your progress</strong>
              <p>Your score history is saved locally so you can see improvement over time.</p>
            </div>
          </div>
          <div className="onboarding-feature">
            <ShieldCheck size={24} />
            <div>
              <strong>Get clarity fast</strong>
              <p>See your financial readiness, runway risk, and tailored insights at a glance.</p>
            </div>
          </div>
          <div className="onboarding-feature">
            <Download size={24} />
            <div>
              <strong>Export as PDF</strong>
              <p>Once your report is ready, use the export action to save a print-friendly PDF.</p>
            </div>
          </div>
        </div>

        <div className="onboarding-actions">
          <button type="button" className="button-primary" onClick={onComplete}>
            Start assessment
          </button>
          <button type="button" className="button-secondary" onClick={onComplete}>
            Dismiss for now
          </button>
        </div>
      </div>
    </div>
  );
}
