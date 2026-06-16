import React from "react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import SingleRecommendedAction from "../components/SingleRecommendedAction.jsx";

export default function OneAction() {
  const { assessment } = useAssessmentState();
  const result = calculateFinancialHealthV2(assessment);

  return (
    <div style={{ padding: 24 }}>
      <h1>One Recommended Action</h1>
      <div style={{ marginTop: 12 }}>
        <SingleRecommendedAction result={result} assessment={assessment} />
      </div>
    </div>
  );
}
