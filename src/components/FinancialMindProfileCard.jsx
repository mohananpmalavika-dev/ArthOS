import React from "react";
import { Brain, Zap, Target, TrendingUp } from "lucide-react";

export function FinancialMindProfileCard({ profile }) {
  if (!profile) {
    return null;
  }

  const summary = profile.getSummary();
  const believesCount = summary.beliefCount || 0;
  const biasCount = summary.biasCount || 0;
  const triggerCount = summary.triggerCount || 0;
  const patternCount = summary.patternCount || 0;

  return (
    <div className="cognition-card" style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
        <Brain size={20} style={{ marginRight: "8px", color: "var(--purple)" }} />
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>Your Money Mind</h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "12px",
          marginBottom: "12px"
        }}
      >
        <div
          style={{
            padding: "10px",
            backgroundColor: "var(--purple-50)",
            borderRadius: "8px",
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--purple)" }}>
            {believesCount}
          </div>
          <div style={{ fontSize: "12px", color: "var(--purple-700)" }}>Your Money Beliefs</div>
        </div>

        <div
          style={{
            padding: "10px",
            backgroundColor: "var(--red-50)",
            borderRadius: "8px",
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--red)" }}>
            {biasCount}
          </div>
          <div style={{ fontSize: "12px", color: "var(--red-700)" }}>Money Mindsets</div>
        </div>

        <div
          style={{
            padding: "10px",
            backgroundColor: "var(--yellow-50)",
            borderRadius: "8px",
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--amber-700)" }}>
            {triggerCount}
          </div>
          <div style={{ fontSize: "12px", color: "var(--amber-800)" }}>Money Moments</div>
        </div>

        <div
          style={{
            padding: "10px",
            backgroundColor: "var(--green-50)",
            borderRadius: "8px",
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--green-600)" }}>
            {patternCount}
          </div>
          <div style={{ fontSize: "12px", color: "var(--green-700)" }}>Your Habits</div>
        </div>
      </div>

      {summary.dominantBeliefs && summary.dominantBeliefs.length > 0 && (
        <div style={{ fontSize: "13px", color: "var(--muted-2)", marginTop: "10px", lineHeight: "1.5" }}>
          <strong>Key Beliefs:</strong>
          <div style={{ marginTop: "4px", fontSize: "12px", fontStyle: "italic" }}>
            {summary.dominantBeliefs.join(", ")}
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancialMindProfileCard;
