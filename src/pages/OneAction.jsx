import React, { useEffect } from "react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import SingleRecommendedAction from "../components/SingleRecommendedAction.jsx";

export default function OneAction() {
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
          console.log('[OneAction Page] Assessment auto-saved:', data);
        })
        .catch(err => {
          console.log('[OneAction Page] Auto-save failed:', err);
        });
    }
  }, [assessment, result]);

  return (
    <div className="premium-route-shell premium-route-shell-compact">
      <section className="premium-route-hero premium-route-hero-split">
        <div>
          <p className="premium-route-kicker">Next Best Move</p>
          <h1>One Move To Improve Your Money Health</h1>
          <p>
            Here's the single best thing you can do right now to improve your money situation.
          </p>
        </div>
      </section>
      <div className="premium-route-card">
        <SingleRecommendedAction result={result} assessment={assessment} />
      </div>
    </div>
  );
}
