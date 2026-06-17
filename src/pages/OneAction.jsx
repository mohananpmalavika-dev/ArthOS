import React from "react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import SingleRecommendedAction from "../components/SingleRecommendedAction.jsx";

export default function OneAction() {
  const { assessment } = useAssessmentState();
  const result = calculateFinancialHealthV2(assessment);

  return (
    <div className="premium-route-shell premium-route-shell-compact">
      <section className="premium-route-hero premium-route-hero-split">
        <div>
          <p className="premium-route-kicker">Next Best Move</p>
          <h1>One recommended action to move the score.</h1>
          <p>
            ARTH.OS compresses the analysis into the single move most likely to improve your
            financial trajectory right now.
          </p>
        </div>
      </section>
      <div className="premium-route-card">
        <SingleRecommendedAction result={result} assessment={assessment} />
      </div>
    </div>
  );
}
