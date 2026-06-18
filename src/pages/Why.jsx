import React, { useEffect } from "react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import WhyScreen from "../components/WhyScreen.jsx";

export default function Why() {
  const { assessment } = useAssessmentState();
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
          console.log('[Why Page] Assessment auto-saved:', data);
        })
        .catch(err => {
          console.log('[Why Page] Auto-save failed:', err);
        });
    }
  }, [assessment, result]);

  return (
    <div className="premium-route-shell">
      <section className="premium-route-hero">
        <div>
          <p className="premium-route-kicker">Behavior insights</p>
          <h1>The why behind your money patterns.</h1>
          <p>
            Understand the habits, beliefs, and hidden drivers shaping your score so improvement
            feels specific.
          </p>
        </div>
      </section>
      <WhyScreen result={result} assessment={assessment} />
    </div>
  );
}
