import React, { Suspense } from "react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import { useHistoricalDataContext } from "../context/HistoricalDataContext.jsx";
const DigitalTwinDashboard = React.lazy(() => import("../components/DigitalTwinDashboard.jsx"));

export default function AdvancedArea() {
  const { assessment } = useAssessmentState();
  const { digitalTwin } = useHistoricalDataContext();
  const result = calculateFinancialHealthV2(assessment);

  return (
    <div style={{ padding: 24 }}>
      <h1>Advanced Area</h1>
      <p>Developer and analytic tools: Digital Twin, Cognition Graph, Prediction Engine.</p>
      <div style={{ marginTop: 16 }}>
        <Suspense fallback={<div>Loading digital twin...</div>}>
          <DigitalTwinDashboard twin={digitalTwin} result={result} assessment={assessment} />
        </Suspense>
      </div>
    </div>
  );
}
