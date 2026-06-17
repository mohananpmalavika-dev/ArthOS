import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import {
  calculateFinancialHealthV2,
  formatCurrency as formatCurrencyV2,
  componentMaximumsV2
} from "../lib/scoring-v2.js";
import AssessmentSection from "../components/AssessmentSection.jsx";
import PrivacyConsent from "../components/PrivacyConsent.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import AssessmentBuildingScreen from "../components/AssessmentBuildingScreen.jsx";
import {
  v2BehaviourQuestions,
  v2AwarenessQuestions,
  v2HabitsQuestions
} from "../data/questionnaire-v2.js";
import "./onboarding.css";

const onboardingBenefits = [
  {
    title: "Your Financial DNA",
    copy: "Behavior patterns that define your money choices"
  },
  {
    title: "Survival Reality",
    copy: "Exactly how long your money lasts"
  },
  {
    title: "One Powerful Action",
    copy: "The single move that matters most right now"
  },
  {
    title: "Your AI Coach",
    copy: "Personalized guidance on every decision"
  }
];

const particlePositions = [
  [12, 18],
  [78, 10],
  [26, 72],
  [88, 64],
  [48, 24],
  [58, 84],
  [8, 52],
  [72, 42]
];

export default function Onboarding() {
  const { assessment } = useAssessmentState();
  const result = calculateFinancialHealthV2(assessment);
  const [stage, setStage] = useState("welcome");
  const navigate = useNavigate();
  const { saveSetting } = useSettings();

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

  const handleBuildingComplete = () => {
    setStage("complete");
    navigate("/big-reveal", { replace: true });
  };

  // The assessment flow should only transition to the building stage
  // after the user completes the guided assessment and explicitly invokes
  // the completion callback. Do not auto-advance when the score is present.
  useEffect(() => {
    // No automatic stage transition required here.
    return undefined;
  }, []);

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
              <span className="onboarding-eyebrow">Guided review</span>
              <h1 className="onboarding-title">
                Welcome to <span>ARTH.OS</span>
              </h1>
              <p className="onboarding-subtitle">
                Start your AI financial review and reveal the hidden structure of your finances.
              </p>
              <p className="onboarding-description">
                In just a few minutes, ARTH.OS analyzes your financial profile, surfaces your runway,
                and maps the exact levers that turn risk into resilience.
              </p>
            </motion.div>

            <motion.div
              className="onboarding-benefits"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              {onboardingBenefits.map(benefit => (
                <div className="benefit-item" key={benefit.title}>
                  <div className="benefit-icon">
                    <CheckCircle2 size={17} aria-hidden="true" />
                  </div>
                  <div className="benefit-text">
                    <strong>{benefit.title}</strong>
                    <span>{benefit.copy}</span>
                  </div>
                </div>
              ))}
            </motion.div>

            <PrivacyConsent
              onAccept={async () => {
                await saveSetting("privacy", {
                  telemetry: true,
                  personalized: true,
                  sharedAnonymized: false
                });
                setStage("assessment");
              }}
              onManage={async privacySettings => {
                await saveSetting("privacy", privacySettings);
              }}
            />
          </div>

          <motion.div
            className="onboarding-particles"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            {particlePositions.map(([left, top], index) => (
              <div
                key={`${left}-${top}`}
                className="particle"
                style={{
                  "--delay": `${index * 0.15}s`,
                  left: `${left}%`,
                  top: `${top}%`
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

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

  if (stage === "building") {
    return <AssessmentBuildingScreen result={result} onComplete={handleBuildingComplete} />;
  }

  if (stage === "complete") {
    return (
      <div className="onboarding-container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="onboarding-complete-card">
            <h2>Your assessment is complete.</h2>
            <p>Redirecting to your personalized report...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
