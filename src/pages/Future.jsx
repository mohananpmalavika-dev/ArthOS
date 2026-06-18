import React, { useEffect } from "react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { useHistoricalDataContext } from "../context/HistoricalDataContext.jsx";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import FutureScreen from "../components/FutureScreen.jsx";

export default function Future() {
  const { assessment } = useAssessmentState();
  const { digitalTwin } = useHistoricalDataContext();
  const result = calculateFinancialHealthV2(assessment);

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
          console.log('[Future Page] Assessment auto-saved:', data);
        })
        .catch(err => {
          console.log('[Future Page] Auto-save failed:', err);
        });
    }
  }, [assessment, result]);

  return (
    <div className="premium-route-shell">
      <section className="premium-route-hero">
        <div>
          <p className="premium-route-kicker">Forecast</p>
          <h1>Your financial future, modeled before it happens.</h1>
          <p>
            Compare the current trajectory with stronger choices and see where runway, stress, and
            resilience can move.
          </p>
        </div>
      </section>
      <FutureScreen result={result} assessment={assessment} digitalTwin={digitalTwin} />
    </div>
  );
}
