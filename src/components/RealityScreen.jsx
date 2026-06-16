import React from "react";
import ScoreCard from "./ScoreCard.jsx";
import { normalizeScore } from "../lib/scoring-v2";
import UserHistory from "./UserHistory.jsx";
import FinancialWeatherCard from "./FinancialWeatherCard.jsx";
import JourneyLevelCard from "./JourneyLevelCard.jsx";
import ScoreTrendStrip from "./ScoreTrendStrip.jsx";
import DailyCheckinForm from "./DailyCheckinForm.jsx";
import ContextualCoachPrompt from "./ContextualCoachPrompt.jsx";

export default function RealityScreen({ result, assessment }) {
  const healthScoreValue = result?.healthScore ?? 0;
  const healthScore = normalizeScore(healthScoreValue);
  const stateLabel = result?.categoryBand?.label || "Live profile";
  const runway = result?.survivalMonthsDisplay || "0";
  const realitySummary =
    result?.blindSpotSummary ||
    result?.blindSpotHeadline ||
    "Your runway awareness is the biggest signal today.";
  const futureRisk = result?.futureRiskLabel ? `${result.futureRiskLabel} outlook` : "Future risk";

  return (
    <section className="page-section reality-screen" style={{ padding: "24px 16px" }}>
      <div className="reality-hero" style={{ display: "grid", gap: "24px", gridTemplateColumns: "1.5fr 1fr", alignItems: "start", marginBottom: "28px" }}>
        <section className="result-card reality-hero-card" style={{ padding: "32px", borderRadius: "28px", background: "var(--slate-950)", color: "var(--white)" }}>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.16em", fontSize: "0.8rem" }}>
            Reality Check
          </p>
          <h1 style={{ margin: "16px 0 0", fontSize: "2.8rem", fontWeight: 800, lineHeight: 1.05 }}>
            Your financial truth today
          </h1>
          <p style={{ margin: "20px 0 0", maxWidth: "720px", color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>
            This is the most honest snapshot of your money life right now. Your score, runway, and habits all tell the same story: whether you feel stable, stretched, or ready to move.
          </p>

          <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginTop: "32px" }}>
            <div style={{ padding: "20px", borderRadius: "20px", background: "rgba(255,255,255,0.08)" }}>
              <span style={{ display: "block", marginBottom: "10px", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.76rem" }}>
                Score
              </span>
              <strong style={{ fontSize: "2.6rem", lineHeight: 1, color: "var(--white)" }}>{healthScore}/100</strong>
            </div>
            <div style={{ padding: "20px", borderRadius: "20px", background: "rgba(255,255,255,0.08)" }}>
              <span style={{ display: "block", marginBottom: "10px", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.76rem" }}>
                Runway
              </span>
              <strong style={{ fontSize: "2.6rem", lineHeight: 1, color: "var(--white)" }}>{runway} mo</strong>
            </div>
            <div style={{ padding: "20px", borderRadius: "20px", background: "rgba(255,255,255,0.08)" }}>
              <span style={{ display: "block", marginBottom: "10px", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.76rem" }}>
                Outlook
              </span>
              <strong style={{ fontSize: "2.2rem", lineHeight: 1, color: "var(--white)" }}>{futureRisk}</strong>
            </div>
          </div>

          <div style={{ marginTop: "28px", display: "grid", gap: "14px", padding: "24px", borderRadius: "24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.78)", lineHeight: 1.7 }}>
              {realitySummary}
            </p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: "0.9rem" }}>
              This screen is your anchor before you move to why it matters and what to do next.
            </p>
          </div>
        </section>

        <DailyCheckinForm />
      </div>

      <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <FinancialWeatherCard weatherIndex={result?.weatherIndex} healthScore={healthScoreValue} />
        <JourneyLevelCard healthScore={healthScoreValue} />
        <ScoreTrendStrip currentScore={healthScoreValue} />
      </div>

      <section style={{ marginTop: "32px" }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: "14px", color: "var(--ink-0)" }}>Reality Reference</h2>
        <p style={{ margin: 0, color: "var(--ink-3)", maxWidth: "760px", lineHeight: 1.7 }}>
          Your current score, runway, and risk outlook are the foundation for every choice the coach makes. This is the screen you return to when you want clarity.
        </p>
      </section>

      <section style={{ marginTop: "32px" }}>
        <ContextualCoachPrompt
          context="reality"
          headline="Questions About Your Reality?"
          prompt="Your score, runway, and direction are all connected. Ask your coach why your score is where it is, or what any of these metrics mean for your future."
        />
      </section>
    </section>
  );
}
