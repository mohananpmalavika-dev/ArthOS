import React from "react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import RealityScreen from "../components/RealityScreen.jsx";

export default function Reality() {
  const { assessment } = useAssessmentState();
  const result = calculateFinancialHealthV2(assessment);

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
