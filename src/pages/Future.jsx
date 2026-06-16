import React from "react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { useHistoricalDataContext } from "../context/HistoricalDataContext.jsx";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import FutureScreen from "../components/FutureScreen.jsx";

export default function Future() {
  const { assessment } = useAssessmentState();
  const { digitalTwin } = useHistoricalDataContext();
  const result = calculateFinancialHealthV2(assessment);

  return (
    <div style={{ padding: 24 }}>
      <FutureScreen result={result} assessment={assessment} digitalTwin={digitalTwin} />
    </div>
  );
}
