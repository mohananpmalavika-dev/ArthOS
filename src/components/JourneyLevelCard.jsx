import React from "react";

const LEVELS = [
  { max: 300, label: "Survival", tone: "Basic runway is fragile; move to stability.", color: "var(--red-700)" },
  { max: 500, label: "Stability", tone: "You have structure. Build reserves and conviction.", color: "var(--orange-700)" },
  { max: 650, label: "Growth", tone: "Momentum is available. Invest in consistent progress.", color: "var(--amber-700)" },
  { max: 800, label: "Freedom", tone: "You are on a strong path. Optimize for optionality.", color: "var(--blue-700)" },
  { max: 1000, label: "Sovereignty", tone: "Financial independence is within reach.", color: "var(--green-700)" }
];

export default function JourneyLevelCard({ healthScore = 0 }) {
  const score = Math.max(0, Math.min(1000, healthScore));
  const level = LEVELS.find(item => score <= item.max) || LEVELS[LEVELS.length - 1];
  const progress = Math.round((score / level.max) * 100);

  return (
    <section className="result-card journey-level-card" style={{ padding: "24px" }}>
      <div style={{ marginBottom: "20px" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Journey level
        </p>
        <h2 style={{ margin: "10px 0 0", fontSize: "1.3rem", fontWeight: 700, color: "var(--ink-0)" }}>
          {level.label}
        </h2>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <span style={{ color: "var(--ink-3)" }}>Score progress</span>
        <strong style={{ fontSize: "1rem", color: level.color }}>{progress}%</strong>
      </div>
      <div style={{ width: "100%", height: "10px", background: "var(--surface-2)", borderRadius: 999, overflow: "hidden", marginBottom: "16px", border: "1px solid var(--border)" }}>
        <div style={{ width: `${progress}%`, height: "100%", background: level.color }} />
      </div>
      <p style={{ margin: 0, color: "var(--ink-3)", lineHeight: 1.6 }}>{level.tone}</p>
    </section>
  );
}
