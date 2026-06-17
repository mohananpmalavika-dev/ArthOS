import React from "react";
import { ConsequenceForecastCard } from "./ConsequenceForecastCard.jsx";
import { ScenarioForecast } from "./ScenarioForecast.jsx";
import TrajectoryHeroVisual from "./TrajectoryHeroVisual.jsx";
import FutureTrajectory from "./FutureTrajectory.jsx";
import ContextualCoachPrompt from "./ContextualCoachPrompt.jsx";
import WeeklyMission from "./WeeklyMission.jsx";
import ScoreCard from "./ScoreCard.jsx";
import { normalizeScore } from "../lib/scoring-v2";

export default function FutureScreen({ result, assessment, digitalTwin }) {
  const currentScoreRaw = result?.healthScore ?? 0;
  const currentScore = normalizeScore(currentScoreRaw);
  const futureScoreRaw =
    digitalTwin?.futureStatistics?.percentiles?.finalHealth?.p50 !== undefined
      ? Math.round(Math.max(0, Math.min(100, digitalTwin.futureStatistics.percentiles.finalHealth.p50)))
      : typeof result?.futureRiskScore === "number"
      ? Math.round(Math.max(0, Math.min(100, result.futureRiskScore)))
      : null;
  const futureGap = futureScoreRaw !== null ? futureScoreRaw - currentScore : null;
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

      <section className="result-card future-you-hero">
        <div className="future-you-hero-grid">
          <div>
            <p className="future-you-hero-subtitle">Future Self</p>
            <h2 className="future-you-hero-title">What your money life can feel like next</h2>
            <p className="future-you-hero-copy">{heroMessage}</p>
          </div>

          <div className="future-you-hero-visual">
            <div className="future-you-orb-shell">
              <div className="future-you-orb">
                <div className="future-you-orb-value">{futureScoreRaw !== null ? futureScoreRaw : currentScore}</div>
                <div className="future-you-orb-label">Financial Core</div>
              </div>
            </div>
            <div className="future-you-orb-note">Projected future health based on your current trajectory.</div>
          </div>
        </div>

        <div className="future-you-gap-grid">
          <div className="future-you-gap-card">
            <p>Current You</p>
            <strong>{currentScore}/100</strong>
          </div>
          <div className="future-you-gap-card">
            <p>Future You</p>
            <strong>{futureScoreRaw !== null ? `${futureScoreRaw}/100` : "—"}</strong>
          </div>
          <div className={`future-you-gap-card ${futureGap >= 0 ? "positive" : "negative"}`}>
            <p>Gap</p>
            <strong>{futureGap !== null ? `${futureGap >= 0 ? "+" : ""}${futureGap}` : "—"}</strong>
          </div>
        </div>

        <div className="future-you-summary">
          <div className="future-you-summary-item">
            <span>Current score</span>
            <strong>{currentScore}/100</strong>
          </div>
          <div className="future-you-summary-item">
            <span>Runway</span>
            <strong>{runway} months</strong>
          </div>
          <div className="future-you-summary-item">
            <span>Risk outlook</span>
            <strong>{riskLabel}</strong>
          </div>
        </div>
      </section>

      <div style={{ display: "grid", gap: "20px" }}>
        <TrajectoryHeroVisual result={result} assessment={assessment} />
        <FutureTrajectory result={result} assessment={assessment} digitalTwin={digitalTwin} />
        <ConsequenceForecastCard result={result} assessment={assessment} />

        <section className="result-card forecast-card" style={{ padding: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "var(--ink-0)", marginBottom: "16px" }}>
            Scenario comparison
          </h2>
          <p style={{ margin: "0 0 20px", color: "var(--ink-3)", lineHeight: 1.6 }}>
            Try different decisions and see how your future changes.
          </p>
          <ScenarioForecast profile={assessment?.profile} assessmentResult={result} />
        </section>
        <WeeklyMission user={assessment?.profile} result={result} />

        <ContextualCoachPrompt
          context="future"
          headline="Nervous About Your Future?"
          prompt="These projections are based on current patterns. Ask your coach how realistic they are, what the biggest risks look like, or how your actions could change the outcome."
        />
      </div>
    </section>
  );
}
