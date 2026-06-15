import React from "react";
import { useAssessmentState } from "../hooks/useAssessmentState.js";
import { calculateFinancialHealthV2 } from "../lib/scoring-v2.js";
import { useHistoricalDataContext } from "../context/HistoricalDataContext.jsx";
import RealityScreen from "../components/RealityScreen.jsx";
import WhyScreen from "../components/WhyScreen.jsx";
import FutureScreen from "../components/FutureScreen.jsx";
import SingleRecommendedAction from "../components/SingleRecommendedAction.jsx";

export default function BigReveal() {
  const { assessment } = useAssessmentState();
  const { digitalTwin } = useHistoricalDataContext();
  const result = calculateFinancialHealthV2(assessment);

  return (
    <div style={{ padding: 24 }}>
      <h1>Big Reveal</h1>
      <p style={{ marginBottom: 16 }}>A cinematic summary of your financial health and next steps.</p>
      <section style={{ marginBottom: 24 }}>
        <RealityScreen result={result} assessment={assessment} />
      </section>
      <section style={{ marginBottom: 24 }}>
        <WhyScreen result={result} assessment={assessment} />
      </section>
      <section style={{ marginBottom: 24 }}>
        <FutureScreen result={result} assessment={assessment} />
      </section>
      <aside style={{ maxWidth: 720 }}>
        <SingleRecommendedAction result={result} assessment={assessment} />
      </aside>
    </div>
  );
}
