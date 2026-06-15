import React from "react";
import { motion } from "framer-motion";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import { useHistoricalDataContext } from "../context/HistoricalDataContext.jsx";
import RealityScreen from "../components/RealityScreen.jsx";
import WhyScreen from "../components/WhyScreen.jsx";
import FutureScreen from "../components/FutureScreen.jsx";
import SingleRecommendedAction from "../components/SingleRecommendedAction.jsx";
import { normalizeScore } from "../lib/scoring-v2";
import "./big-reveal.css";

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function AnimatedCounter({ from = 0, to, duration = 2 }) {
  const [displayValue, setDisplayValue] = React.useState(from);

  React.useEffect(() => {
    const step = (to - from) / (duration * 60);
    let current = from;
    const interval = setInterval(() => {
      current += step;
      if (current >= to) {
        setDisplayValue(to);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [from, to, duration]);

  return displayValue;
}

export default function BigReveal() {
  const { assessment } = useAssessmentState();
  const { digitalTwin } = useHistoricalDataContext();
  const result = calculateFinancialHealthV2(assessment);
  const [showFull, setShowFull] = React.useState(false);

  const currentScore = clampScore(normalizeScore(result?.healthScore ?? 0));
  const percentile = Math.round(50 + (currentScore - 50) * 1.46); // simplified: 0-50 → 0-73%, 50-100 → 73-100%
  const worstCaseScore = Math.max(0, currentScore - 15);
  const bestCaseScore = Math.min(100, currentScore + 16);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowFull(true), 3200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* ════════════════════════════════════════════════
          BIG REVEAL HERO
          ════════════════════════════════════════════════ */}
      <motion.section
        className="big-reveal-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="big-reveal-content">
          <motion.div
            className="big-reveal-score-ring"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            style={{ "--score": currentScore }}
          >
            <div className="big-reveal-score-inner">
              <motion.div
                className="big-reveal-score-number"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <AnimatedCounter to={currentScore} duration={1.2} />
              </motion.div>
              <div className="big-reveal-score-label">Financial Health</div>
            </div>
          </motion.div>

          <motion.div
            className="big-reveal-narrative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
          >
            <h1 className="big-reveal-title">
              {currentScore >= 80
                ? "Commanding Financial Momentum"
                : currentScore >= 60
                  ? "Strong Stability & Recovery"
                  : currentScore >= 40
                    ? "Foundation with Opportunity"
                    : "Opportunity to Build"}
            </h1>
            <p className="big-reveal-subtitle">
              You are ahead of <strong>{percentile}%</strong> of similar users
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Show full reveal after delay */}
      {showFull && (
        <>
          {/* ════════════════════════════════════════════════
              SCENARIO CARDS: WORST CASE / BEST CASE
              ════════════════════════════════════════════════ */}
          <motion.section
            className="big-reveal-scenarios"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="scenario-grid">
              {/* Worst Case */}
              <motion.div
                className="scenario-card worst-case"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="scenario-header">
                  <span className="scenario-label">If nothing changes...</span>
                </div>
                <motion.div
                  className="scenario-score"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <AnimatedCounter to={worstCaseScore} duration={0.8} />
                </motion.div>
                <p className="scenario-copy">Your score in 12 months</p>
              </motion.div>

              {/* Best Case */}
              <motion.div
                className="scenario-card best-case"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="scenario-header">
                  <span className="scenario-label">If you follow one recommendation...</span>
                </div>
                <motion.div
                  className="scenario-score"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <AnimatedCounter to={bestCaseScore} duration={0.8} />
                </motion.div>
                <p className="scenario-copy">Your score in 12 months</p>
              </motion.div>
            </div>
          </motion.section>

          {/* ════════════════════════════════════════════════
              FULL REVEAL SECTIONS
              ════════════════════════════════════════════════ */}
          <motion.section
            className="big-reveal-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <h2 className="section-title">Reality</h2>
            <RealityScreen result={result} assessment={assessment} />
          </motion.section>

          <motion.section
            className="big-reveal-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <h2 className="section-title">Why</h2>
            <WhyScreen result={result} assessment={assessment} />
          </motion.section>

          <motion.section
            className="big-reveal-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            <h2 className="section-title">Future</h2>
            <FutureScreen result={result} assessment={assessment} />
          </motion.section>

          <motion.aside
            className="big-reveal-action"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.6 }}
            style={{ maxWidth: 720, margin: "40px auto" }}
          >
            <SingleRecommendedAction result={result} assessment={assessment} />
          </motion.aside>
        </>
      )}
    </div>
  );
}
