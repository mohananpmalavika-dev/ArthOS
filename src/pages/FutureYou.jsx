import React from "react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import { useHistoricalDataContext } from "../context/HistoricalDataContext.jsx";
import FutureScreen from "../components/FutureScreen.jsx";

export default function FutureYou() {
  const { assessment } = useAssessmentState();
  const { digitalTwin } = useHistoricalDataContext();
  const result = calculateFinancialHealthV2(assessment);

  return (
    <div style={{ padding: 24 }}>
      <h1>Future You</h1>
      <p>Personalized narrative of the user's future self.</p>
      <div style={{ marginTop: 12 }}>
        <FutureScreen result={result} assessment={assessment} />
      </div>
    </div>
  );
}
