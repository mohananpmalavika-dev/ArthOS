import React from "react";
import { ConsequenceForecastCard } from "./ConsequenceForecastCard.jsx";
import { ScenarioForecast } from "./ScenarioForecast.jsx";
import TrajectoryHeroVisual from "./TrajectoryHeroVisual.jsx";
import ContextualCoachPrompt from "./ContextualCoachPrompt.jsx";
import ScoreCard from "./ScoreCard.jsx";
import { normalizeScore } from "../lib/scoring-v2";

export default function FutureScreen({ result, assessment }) {
  const currentScore = result?.healthScore ? normalizeScore(result.healthScore) : 0;
  const riskLabel = result?.futureRiskLabel || "Emerging risk";
  const runway = result?.survivalMonthsDisplay || "0";
  const heroMessage =
    result?.futureRiskLabel === "Low"
      ? "Your future self can feel calm if you keep building on what’s already working."
      : result?.futureRiskLabel === "Medium"
      ? "There is still time to shift your story before risk becomes pressure."
      : "Future you is waiting for a safer runway and lower uncertainty.";

  return (
    <section className="page-section future-screen" style={{ padding: "24px 16px" }}>
      <div className="page-heading" style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.85rem" }}>
          Future Screen
        </p>
        <h1 style={{ margin: "12px 0 0", fontSize: "2rem", fontWeight: 800, color: "var(--ink-0)" }}>
          Meet Future You
        </h1>
        <p style={{ margin: "12px 0 0", color: "var(--ink-3)", maxWidth: "760px", lineHeight: 1.7 }}>
          Here’s who your tomorrow looks like when you keep the current pace, and what changes feel most meaningful.
        </p>
      </div>

      <section className="result-card future-hero-card" style={{ padding: "32px", borderRadius: "24px", background: "var(--slate-950)", color: "var(--white)", marginBottom: "24px" }}>
        <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "minmax(0, 1.3fr) minmax(250px, 1fr)", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.78rem" }}>
              Future Self
            </p>
            <h2 style={{ margin: "14px 0 0", fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.05 }}>
              What your money life can feel like next
            </h2>
            <p style={{ margin: "20px 0 0", color: "rgba(255,255,255,0.78)", maxWidth: "680px", lineHeight: 1.75 }}>
              {heroMessage}
            </p>
          </div>

          <div style={{ display: "grid", gap: "16px" }}>
            <ScoreCard score={currentScore} size={140} />
            <div style={{ padding: "20px", borderRadius: "20px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.75rem" }}>
                Today’s anchor
              </p>
              <p style={{ margin: "12px 0 0", fontSize: "1rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                Current score: <strong>{currentScore}/100</strong>
              </p>
              <p style={{ margin: "10px 0 0", fontSize: "1rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                Current runway: <strong>{runway} months</strong>
              </p>
              <p style={{ margin: "10px 0 0", fontSize: "1rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
                Risk outlook: <strong>{riskLabel}</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      <div style={{ display: "grid", gap: "20px" }}>
        <TrajectoryHeroVisual result={result} assessment={assessment} />
        <ConsequenceForecastCard result={result} assessment={assessment} />

        <section className="result-card forecast-card" style={{ padding: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "var(--ink-0)", marginBottom: "16px" }}>
            Scenario Lab
          </h2>
          <p style={{ margin: "0 0 20px", color: "var(--ink-3)", lineHeight: 1.6 }}>
            Try different decisions and see how your future changes.
          </p>
          <ScenarioForecast profile={assessment?.profile} assessmentResult={result} />
        </section>

        <ContextualCoachPrompt
          context="future"
          headline="Nervous About Your Future?"
          prompt="These projections are based on current patterns. Ask your coach how realistic they are, what the biggest risks look like, or how your actions could change the outcome."
        />
      </div>
    </section>
  );
}
