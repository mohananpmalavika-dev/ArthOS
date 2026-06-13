import React, { useState } from "react";
import { Activity, BarChart3, ShieldCheck, Sparkles, Download, ChevronDown, Lock, Clock, AlertCircle } from "lucide-react";

export default function OnboardingOverlay({ onComplete }) {
  const [expandedStep, setExpandedStep] = useState(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const assessmentSteps = [
    {
      id: "participant",
      title: "Participant Info",
      duration: "~1 min",
      icon: Activity,
      description: "Tell us about yourself",
      details: "We'll collect your name, age, and email. This helps personalize your experience and allows us to send you insights.",
    },
    {
      id: "behaviour",
      title: "Behaviour Assessment",
      duration: "~4 mins",
      icon: BarChart3,
      description: "Your spending & impulse patterns",
      details: "We ask about your spending habits, impulse control, and how you respond to financial stress. These behavioral insights reveal your financial decision-making patterns.",
    },
    {
      id: "awareness",
      title: "Awareness Check",
      duration: "~3 mins",
      icon: ShieldCheck,
      description: "Financial knowledge & tracking",
      details: "Understand your financial literacy level and how well you track your money. Awareness is the foundation of financial control.",
    },
    {
      id: "profile",
      title: "Financial Profile",
      duration: "~4 mins",
      icon: Download,
      description: "Income, expenses, savings, debt",
      details: "Enter your monthly income, expenses, savings, emergency fund, debt levels, and dependents. All numbers stay secure—we never store personal details.",
    },
    {
      id: "summary",
      title: "Results & Insights",
      duration: "~3 mins",
      icon: Sparkles,
      description: "Health score & recommendations",
      details: "Get your personalized health score, see blindspot analysis, and receive tailored action recommendations.",
    },
  ];

  const privacyGuarantees = [
    {
      icon: Lock,
      title: "Zero PII Stored",
      description: "We only store numeric scores, ratios, and dates. Never names, emails, or account details.",
    },
    {
      icon: ShieldCheck,
      title: "Local-First Design",
      description: "Your assessment data is saved in your browser first. Optional cloud sync only with your consent.",
    },
    {
      icon: AlertCircle,
      title: "Anonymous Telemetry",
      description: "Usage data sent to improve ARTH.OS contains only scores and timestamps, no identifiable info.",
    },
  ];

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="onboarding-icon">
            <Sparkles />
          </div>
          <div>
            <h2 id="onboarding-title">Welcome to ARTH.OS</h2>
            <p>Your personal financial intelligence system. Complete in ~15 minutes.</p>
          </div>
        </div>

        {/* Assessment Steps */}
        <div className="onboarding-section">
          <h3 className="onboarding-section-title">
            <Clock size={16} /> What's included in this assessment
          </h3>
          <div className="onboarding-steps">
            {assessmentSteps.map((step) => {
              const Icon = step.icon;
              const isExpanded = expandedStep === step.id;
              return (
                <div key={step.id} className="onboarding-step">
                  <button
                    className="onboarding-step-button"
                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                    aria-expanded={isExpanded}
                  >
                    <div className="step-header">
                      <div className="step-icon">
                        <Icon size={18} />
                      </div>
                      <div className="step-info">
                        <strong>{step.title}</strong>
                        <span className="step-duration">{step.duration}</span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`chevron ${isExpanded ? "expanded" : ""}`}
                      />
                    </div>
                    <p className="step-description">{step.description}</p>
                  </button>
                  {isExpanded && (
                    <div className="step-details" role="region" aria-label={`Details for ${step.title}`}>
                      {step.details}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy & Data Collection */}
        <div className="onboarding-section">
          <button
            className="onboarding-section-toggle"
            onClick={() => setShowPrivacy(!showPrivacy)}
            aria-expanded={showPrivacy}
          >
            <div className="toggle-header">
              <Lock size={16} />
              <h3>Privacy & Data Collection</h3>
            </div>
            <ChevronDown size={18} className={`chevron ${showPrivacy ? "expanded" : ""}`} />
          </button>

          {showPrivacy && (
            <div className="privacy-guarantees">
              {privacyGuarantees.map((guarantee, idx) => {
                const Icon = guarantee.icon;
                return (
                  <div key={idx} className="guarantee-item">
                    <Icon size={20} />
                    <div>
                      <strong>{guarantee.title}</strong>
                      <p>{guarantee.description}</p>
                    </div>
                  </div>
                );
              })}
              <div className="privacy-note">
                <p>
                  <strong>Your data is yours.</strong> We respect your privacy and give you full control over what gets saved. 
                  See our Privacy Policy for details on retention, deletion, and data portability.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Key Benefits */}
        <div className="onboarding-features">
          <div className="onboarding-feature">
            <BarChart3 size={24} />
            <div>
              <strong>Track Progress</strong>
              <p>Build a history and watch your financial health improve over time.</p>
            </div>
          </div>
          <div className="onboarding-feature">
            <Sparkles size={24} />
            <div>
              <strong>Personalized Insights</strong>
              <p>Get AI-driven recommendations tailored to your financial situation.</p>
            </div>
          </div>
        </div>

        <div className="onboarding-actions">
          <button type="button" className="button-primary" onClick={onComplete}>
            Start Assessment (~15 min)
          </button>
          <button type="button" className="button-secondary" onClick={onComplete}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
