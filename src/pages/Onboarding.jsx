import React from "react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import UnifiedJourneyHome from "../components/UnifiedJourneyHome.jsx";

export default function Onboarding() {
  const { assessment } = useAssessmentState();
  const result = calculateFinancialHealthV2(assessment);

  function startAssessment() {
    if (typeof window !== "undefined") {
      window.location.hash = "#assessment";
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Welcome — Onboarding</h1>
      <p>This guided onboarding leads new users through Assessment → Big Reveal.</p>
      <button className="primary" onClick={startAssessment} style={{ marginTop: 12 }}>Start Assessment</button>
      <div style={{ marginTop: 20 }}>
        <UnifiedJourneyHome assessment={assessment} result={result} onCoachOpen={() => {}} />
      </div>
    </div>
  );
}
