import React from "react";
import { ConsequenceForecastCard } from "./ConsequenceForecastCard.jsx";
import { ScenarioForecast } from "./ScenarioForecast.jsx";
import TrajectoryHeroVisual from "./TrajectoryHeroVisual.jsx";
import ContextualCoachPrompt from "./ContextualCoachPrompt.jsx";
import PredictionEngineDashboard from "./PredictionEngineDashboard.jsx";

export default function FutureScreen({ result, assessment }) {
  return (
    <section className="page-section future-screen" style={{ padding: "24px 16px" }}>
      <div className="page-heading" style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.85rem" }}>
          Future Screen
        </p>
        <h1 style={{ margin: "12px 0 0", fontSize: "2rem", fontWeight: 800, color: "var(--ink-0)" }}>
          What Happens Next?
        </h1>
        <p style={{ margin: "12px 0 0", color: "var(--ink-3)", maxWidth: "760px", lineHeight: 1.7 }}>
          See your financial trajectory over 5 years—with and without taking action today.
        </p>
      </div>

      <div style={{ display: "grid", gap: "20px" }}>
        {/* Hero: Trajectory Visualization */}
        <TrajectoryHeroVisual result={result} assessment={assessment} />

        {/* Consequence Forecast */}
        <ConsequenceForecastCard result={result} assessment={assessment} />

        {/* Scenario Lab */}
        <section className="result-card forecast-card" style={{ padding: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "var(--ink-0)", marginBottom: "16px" }}>
            Scenario Lab
          </h2>
          <p style={{ margin: "0 0 20px", color: "var(--ink-3)", lineHeight: 1.6 }}>
            Try different decisions and see how your future changes.
          </p>
          <ScenarioForecast profile={assessment?.profile} assessmentResult={result} />
        </section>

        {/* Advanced Predictions (collapsed/developer) */}
        <section className="result-card prediction-summary-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Advanced Insights
              </p>
              <h2 style={{ margin: "10px 0 0", fontSize: "1.4rem", fontWeight: 700, color: "var(--ink-0)" }}>
                Prediction Engine
              </h2>
            </div>
          </div>
          <div style={{ marginTop: "20px" }}>
            <PredictionEngineDashboard userId="demo" />
          </div>
        </section>

        {/* Contextual Coach */}
        <ContextualCoachPrompt
          context="future"
          headline="Nervous About Your Future?"
          prompt="These projections are based on current patterns. Ask your coach how realistic they are, what the biggest risks look like, or how your actions could change the outcome."
        />
      </div>
    </section>
  );
}
