import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { normalizeScore } from "../lib/scoring-v2.js";
import "./assessment-building-screen.css";

/**
 * AssessmentBuildingScreen
 *
 * Shows animated building/loading screen after assessment completion.
 * Builds anticipation before Big Reveal with a checklist of steps.
 */
export default function AssessmentBuildingScreen({ result, onComplete }) {
  const initialSteps = [
    { id: "habits", label: "Learning Your Habits", progress: 100, completed: false, delay: 0 },
    { id: "decisions", label: "Understanding Your Style", progress: 80, completed: false, delay: 0.8 },
    { id: "predicting", label: "Looking At Your Future", progress: 60, completed: false, delay: 1.6 }
  ];

  const [steps, setSteps] = useState(initialSteps);
  const [phase, setPhase] = useState("building");
  const [displayScore, setDisplayScore] = useState(0);

  const currentScore = normalizeScore(Math.round(result?.healthScore ?? 0));
  const futureScore =
    typeof result?.futureRiskScore === "number"
      ? Math.round(Math.max(0, Math.min(100, result.futureRiskScore)))
      : null;
  const gapScore = futureScore !== null ? futureScore - currentScore : null;

  useEffect(() => {
    const timers = [];

    initialSteps.forEach(step => {
      timers.push(
        setTimeout(() => {
          setSteps(prev => prev.map(s => (s.id === step.id ? { ...s, completed: true } : s)));
        }, (step.delay + 0.2) * 1000)
      );
    });

    timers.push(
      setTimeout(() => {
        setPhase("reveal");
      }, 2800)
    );

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (phase !== "reveal") {
      return;
    }

    const targetScore = Math.round(result?.healthScore ?? 0);
    let count = 0;
    const increment = Math.max(1, Math.floor(targetScore / 30));
    const counter = setInterval(() => {
      count += increment;
      if (count >= targetScore) {
        setDisplayScore(targetScore);
        clearInterval(counter);
      } else {
        setDisplayScore(count);
      }
    }, 30);

    const finishTimer = setTimeout(() => {
      if (typeof onComplete === "function") {
        onComplete();
      }
    }, 3800);

    return () => {
      clearInterval(counter);
      clearTimeout(finishTimer);
    };
  }, [phase, result, onComplete]);

  return (
    <div className="assessment-building-screen">
      <div className="building-content">
        {phase === "building" ? (
          <>
            <motion.div
              className="building-header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1>Building Your Financial Twin...</h1>
              <p>Deep analysis across habits, decisions, and future outcomes.</p>
            </motion.div>

            <div className="building-steps">
              {steps.map(step => (
                <motion.div
                  key={step.id}
                  className={`building-step ${step.completed ? "completed" : ""}`}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: step.delay }}
                >
                  <div className="step-label-block">
                    <span className="step-label">{step.label}</span>
                    <span className="step-percent">{step.progress}%</span>
                  </div>
                  <div className="step-bar">
                    <motion.div
                      className="step-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: step.completed ? `${step.progress}%` : 0 }}
                      transition={{ duration: 0.8, delay: step.delay + 0.1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="building-progress"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 3, ease: "easeOut" }}
            />
          </>
        ) : (
          <motion.div
            className="building-reveal"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="reveal-eyebrow">THIS IS YOU</p>
            <div className="reveal-score-shell">
              <div className="reveal-orb-shell">
                <div className="reveal-orb">
                  <motion.span
                    className="reveal-score"
                    initial={{ scale: 0.84, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    {displayScore}
                  </motion.span>
                  <div className="reveal-orb-label">Financial Core</div>
                </div>
              </div>
            </div>
            <p className="reveal-copy">Your Financial Core score is ready. This is the heart of your ARTH.OS profile.</p>

            <div className="reveal-metrics-grid">
              <div className="reveal-metric-card">
                <span>Current You</span>
                <strong>{currentScore}/100</strong>
              </div>
              <div className="reveal-metric-card">
                <span>Future Trend</span>
                <strong>{futureScore !== null ? `${futureScore}/100` : "—"}</strong>
              </div>
              <div className={`reveal-metric-card ${gapScore >= 0 ? "positive" : "negative"}`}>
                <span>Gap</span>
                <strong>{futureScore !== null ? `${gapScore >= 0 ? "+" : ""}${gapScore}` : "—"}</strong>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
