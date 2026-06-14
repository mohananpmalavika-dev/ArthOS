import React from "react";
import ScoreCard from "./ScoreCard.jsx";
import SurvivalHero from "./SurvivalHero.jsx";
import UserHistory from "./UserHistory.jsx";
import FinancialWeatherCard from "./FinancialWeatherCard.jsx";
import JourneyLevelCard from "./JourneyLevelCard.jsx";
import ScoreTrendStrip from "./ScoreTrendStrip.jsx";

export default function RealityScreen({ result, assessment }) {
  const healthScore = result?.healthScore ?? 0;
  const stateLabel = result?.categoryBand?.label || "Live profile";
  const runway = result?.survivalMonthsDisplay || "0";
  const direction = result?.blindSpotHeadline || "Your runway awareness is the biggest signal today.";

  return (
    <section className="page-section reality-screen" style={{ padding: "24px 16px" }}>
      <div className="page-heading" style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.85rem" }}>
          Reality Screen
        </p>
        <h1 style={{ margin: "12px 0 0", fontSize: "2rem", fontWeight: 800, color: "var(--ink-0)" }}>
          Financial Reality
        </h1>
        <p style={{ margin: "12px 0 0", color: "var(--ink-3)", maxWidth: "760px", lineHeight: 1.7 }}>
          A compact view of your current financial state, runway, and direction so you can move from scattered insight to one grounded picture.
        </p>
      </div>

      <div className="reality-grid" style={{ display: "grid", gap: "20px", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)" }}>
        <div style={{ display: "grid", gap: "20px" }}>
          <section className="result-card reality-summary-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Financial Reality Card
                </p>
                <h2 style={{ margin: "10px 0 0", fontSize: "1.7rem", fontWeight: 700, color: "var(--ink-0)" }}>
                  {stateLabel}
                </h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontSize: "0.85rem", color: "var(--ink-3)", marginBottom: "8px" }}>
                  Score
                </span>
                <strong style={{ fontSize: "2rem", color: "var(--ink-0)" }}>{Math.round(healthScore / 10)}/100</strong>
              </div>
            </div>

            <div style={{ marginTop: "24px", display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
              <div style={{ padding: "18px", borderRadius: "18px", background: "var(--gray-50)" }}>
                <span style={{ display: "block", fontSize: "0.78rem", color: "var(--ink-3)", marginBottom: "8px" }}>
                  Runway
                </span>
                <strong style={{ fontSize: "1.5rem", color: "var(--ink-0)" }}>{runway} mo</strong>
              </div>
              <div style={{ padding: "18px", borderRadius: "18px", background: "var(--gray-50)" }}>
                <span style={{ display: "block", fontSize: "0.78rem", color: "var(--ink-3)", marginBottom: "8px" }}>
                  Direction
                </span>
                <p style={{ margin: 0, color: "var(--ink-3)", lineHeight: 1.6 }}>{direction}</p>
              </div>
            </div>
          </section>

          <ScoreTrendStrip currentScore={healthScore} />

          <div style={{ display: "grid", gap: "20px" }}>
            <UserHistory currentScore={healthScore} className="reality-history-widget" />
          </div>
        </div>

        <div style={{ display: "grid", gap: "20px" }}>
          <div style={{ display: "grid", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <FinancialWeatherCard healthScore={healthScore} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <JourneyLevelCard healthScore={healthScore} />
              </div>
            </div>
          </div>

          <div className="result-card" style={{ padding: "24px" }}>
            <p style={{ margin: 0, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-2)" }}>
              Survival snapshot
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: "18px" }}>
              <ScoreCard score={healthScore} size={180} />
            </div>
            <p style={{ marginTop: "18px", color: "var(--ink-3)", lineHeight: 1.7 }}>
              Your score is driven by behavior, awareness, and stability. Use the weather and journey levels above to focus your next move.
            </p>
          </div>
        </div>
      </div>

      <section style={{ marginTop: "32px" }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: "14px", color: "var(--ink-0)" }}>Reality Reference</h2>
        <p style={{ margin: 0, color: "var(--ink-3)", maxWidth: "760px", lineHeight: 1.7 }}>
          This screen brings your state, score, runway and direction into one clear story. It is the reality lens for the rest of your journey.
        </p>
      </section>
    </section>
  );
}
