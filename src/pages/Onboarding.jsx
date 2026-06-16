import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import {
  calculateFinancialHealthV2,
  formatCurrency as formatCurrencyV2,
  componentMaximumsV2
} from "../lib/scoring-v2.js";
import AssessmentSection from "../components/AssessmentSection.jsx";
import PrivacyConsent from "../components/PrivacyConsent.jsx";
import AssessmentBuildingScreen from "../components/AssessmentBuildingScreen.jsx";
import {
  v2BehaviourQuestions,
  v2AwarenessQuestions,
  v2HabitsQuestions
} from "../data/questionnaire-v2.js";
import "./onboarding.css";

export default function Onboarding() {
  const { assessment } = useAssessmentState();
  const result = calculateFinancialHealthV2(assessment);
  const [stage, setStage] = useState("welcome"); // welcome | assessment | building | complete

  // Construct ui prop for AssessmentSection
  const ui = {
    behaviourQuestions: v2BehaviourQuestions,
    awarenessQuestions: v2AwarenessQuestions,
    habitsQuestions: v2HabitsQuestions,
    componentMaximums: componentMaximumsV2,
    formatCurrency: formatCurrencyV2,
    extraCards: {
      debtSchedule: true,
      habits: true
    }
  };

  const navigate = useNavigate();

  const handleBuildingComplete = () => {
    setStage("complete");
    navigate("/big-reveal", { replace: true });
  };

  // If assessment has been completed, move to building screen
  useEffect(() => {
    if (stage === "assessment" && result && result.healthScore) {
      setStage("building");
    }
  }, [result?.healthScore, stage, navigate]);

  // Welcome screen
  if (stage === "welcome") {
    return (
      <div className="onboarding-container">
        <motion.div
          className="onboarding-welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="onboarding-content">
            <motion.div
              className="onboarding-hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <span className="onboarding-eyebrow">Cinematic discovery</span>
              <h1 className="onboarding-title">
                Welcome to <span>ARTH.OS</span>
              </h1>
              <p className="onboarding-subtitle">
                Launch your AI discovery journey and reveal the hidden structure of your finances.
              </p>
              <p className="onboarding-description">
                In just a few minutes, ARTH.OS scans your Financial DNA, surfaces your runway,
                and maps the exact levers that turn risk into resilience.
              </p>
            </motion.div>

            <motion.div
              className="onboarding-benefits"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="benefit-item">
                <div className="benefit-icon">✓</div>
                <div className="benefit-text">
                  <strong>Your Financial DNA</strong>
                  <span>Behavior patterns that define your money choices</span>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">✓</div>
                <div className="benefit-text">
                  <strong>Survival Reality</strong>
                  <span>Exactly how long your money lasts</span>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">✓</div>
                <div className="benefit-text">
                  <strong>One Powerful Action</strong>
                  <span>The single move that matters most right now</span>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">✓</div>
                <div className="benefit-text">
                  <strong>Your AI Coach</strong>
                  <span>Personalized guidance on every decision</span>
                </div>
              </div>
            </motion.div>

            <PrivacyConsent
              onAccept={() => {
                try {
                  window.localStorage.setItem(
                    "arthos:privacy",
                    JSON.stringify({ telemetry: true, personalized: true, sharedAnonymized: false })
                  );
                } catch (e) {
                  /* ignore */
                }
                setStage("assessment");
              }}
              onManage={(settings) => {
                try {
                  window.localStorage.setItem("arthos:privacy", JSON.stringify(settings));
                } catch (e) {
                  /* ignore */
                }
              }}
            />
          </div>

          <motion.div
            className="onboarding-particles"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  "--delay": `${i * 0.15}s`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Assessment stage
  if (stage === "assessment") {
    return (
      <div className="onboarding-container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{ width: "100%", maxWidth: "100%" }}
        >
          <AssessmentSection
            assessment={assessment}
            ui={ui}
            onComplete={() => setStage("building")}
          />
        </motion.div>
      </div>
    );
  }

  // Building screen
  if (stage === "building") {
    return <AssessmentBuildingScreen result={result} onComplete={handleBuildingComplete} />;
  }

  // Complete — show Big Reveal
  if (stage === "complete") {
    return (
      <div className="onboarding-container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* The Big Reveal is now shown in the routed /big-reveal page */}
          <div style={{ textAlign: "center", padding: 60 }}>
            <h2>🎉 Your Assessment is Complete!</h2>
            <p>Redirecting to your personalized report...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
