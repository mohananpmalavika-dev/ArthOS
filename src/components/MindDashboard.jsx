import React from "react";

function labelFromKey(key = "") {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

export default function MindDashboard({ result, moneyBeliefs, biasProfile, emotionalTriggers, financialMindProfile }) {
  const primaryBias = Object.entries(biasProfile || {})
    .filter(([, value]) => typeof value === "number")
    .sort((a, b) => b[1] - a[1])[0];

  const primaryTrigger = Object.entries(emotionalTriggers || {})
    .filter(([, value]) => Number(value) > 0)
    .sort((a, b) => b[1] - a[1])[0];

  const primaryFear = moneyBeliefs?.beliefs?.[0] || result?.blindSpotHeadline || "Runway awareness is your most important blind spot.";
  const blindSpot = result?.awarenessGapDisplay || "0";
  const identity = result?.categoryBand?.label || "Financial Identity";
  const biasLabel = primaryBias ? labelFromKey(primaryBias[0]) : "Bias not identified";
  const triggerLabel = primaryTrigger ? labelFromKey(primaryTrigger[0]) : "No dominant trigger";

  return (
    <section className="page-section mind-dashboard" style={{ padding: "24px 16px" }}>
      <div className="page-heading" style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.85rem" }}>
          Mind Screen
        </p>
        <h1 style={{ margin: "12px 0 0", fontSize: "2rem", fontWeight: 800, color: "var(--ink-0)" }}>
          Your Financial Identity
        </h1>
        <p style={{ margin: "12px 0 0", color: "var(--ink-3)", maxWidth: "760px", lineHeight: 1.7 }}>
          One unified mind dashboard that surfaces your core fear, bias, trigger and blind spot without the noise of six separate dashboards.
        </p>
      </div>

      <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <section className="result-card" style={{ padding: "24px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Financial identity
          </p>
          <h2 style={{ margin: "12px 0 0", fontSize: "1.5rem", fontWeight: 700, color: "var(--ink-0)" }}>
            {identity}
          </h2>
          <p style={{ marginTop: "16px", color: "var(--ink-3)", lineHeight: 1.7 }}>
            {financialMindProfile?.summary?.dominantBeliefs?.join(", ") || "Your money mindset is still unfolding. Use the insights below to focus your next reflection."}
          </p>
        </section>

        <section className="result-card" style={{ padding: "24px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Primary Fear
          </p>
          <h2 style={{ margin: "12px 0 0", fontSize: "1.4rem", fontWeight: 700, color: "var(--ink-0)" }}>
            {primaryFear}
          </h2>
          <p style={{ marginTop: "16px", color: "var(--ink-3)", lineHeight: 1.7 }}>
            Understanding this fear helps you reframe decisions with more clarity and less emotional noise.
          </p>
        </section>

        <section className="result-card" style={{ padding: "24px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Primary Bias
          </p>
          <h2 style={{ margin: "12px 0 0", fontSize: "1.4rem", fontWeight: 700, color: "var(--ink-0)" }}>
            {biasLabel}
          </h2>
          <p style={{ marginTop: "16px", color: "var(--ink-3)", lineHeight: 1.7 }}>
            This cognitive pattern shapes your choices more than you may realize. Keep it in view as you make financial decisions.
          </p>
        </section>

        <section className="result-card" style={{ padding: "24px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Primary Trigger
          </p>
          <h2 style={{ margin: "12px 0 0", fontSize: "1.4rem", fontWeight: 700, color: "var(--ink-0)" }}>
            {triggerLabel}
          </h2>
          <p style={{ marginTop: "16px", color: "var(--ink-3)", lineHeight: 1.7 }}>
            Your emotional triggers are the levers that often push you toward fast decisions. Awareness is the first step to better habits.
          </p>
        </section>

        <section className="result-card" style={{ padding: "24px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Blind Spot
          </p>
          <h2 style={{ margin: "12px 0 0", fontSize: "1.4rem", fontWeight: 700, color: "var(--ink-0)" }}>
            {blindSpot} months
          </h2>
          <p style={{ marginTop: "16px", color: "var(--ink-3)", lineHeight: 1.7 }}>
            This is the gap between what you believe and what your runway actually is. It is the single most important awareness signal today.
          </p>
        </section>
      </div>
    </section>
  );
}
