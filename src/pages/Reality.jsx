import React, { useEffect } from "react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import RealityScreen from "../components/RealityScreen.jsx";

export default function Reality() {
  const { assessment } = useAssessmentState();
  const result = calculateFinancialHealthV2(assessment);

  // Auto-save assessment to database
  useEffect(() => {
    if (result && result.healthScore && assessment) {
      const payload = {
        assessment: assessment,
        result: result
      };
      fetch('/api/saveAssessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(data => {
          console.log('[Reality Page] Assessment auto-saved:', data);
        })
        .catch(err => {
          console.log('[Reality Page] Auto-save failed:', err);
        });
    }
  }, [assessment, result]);

  return (
    <div className="premium-route-shell">
      <section className="premium-route-hero">
        <div>
          <p className="premium-route-kicker">Reality Check</p>
          <h1>Your current financial position, made readable.</h1>
          <p>
            See the gap between perceived runway, actual resilience, and the immediate signals that
            deserve attention.
          </p>
        </div>
      </section>
      <RealityScreen result={result} assessment={assessment} />
    </div>
  );
}
