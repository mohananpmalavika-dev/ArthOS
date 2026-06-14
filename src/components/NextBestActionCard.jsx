import React, { useMemo } from "react";
import { TrendingUp, Clock, Zap, ChevronRight } from "lucide-react";

export default function NextBestActionCard({ result, assessment, onExpand }) {
  const action = useMemo(() => {
    if (!result) return null;

    // Prioritize actions by impact and readiness level
    // The "next best move" should be:
    // 1. Highest impact
    // 2. Medium difficulty (achievable)
    // 3. Can be done in 30-90 days
    
    const recommendedAction = {
      title: "Build ₹20,000 Emergency Buffer",
      impact: 8,
      difficulty: "Medium",
      timeframe: "45 days",
      description: "Your biggest vulnerability is lack of emergency reserves. Building a 20K buffer will provide resilience.",
      story: "When unexpected expenses hit (and they will), you'll have a cushion. This single move improves your financial security by 8 points.",
      why: "Emergency funds are your financial immune system. Without them, any disruption becomes a crisis.",
      steps: [
        "Automate ₹500/week transfer to savings",
        "Skip one discretionary expense per week (coffee, dining)",
        "Redirect any bonus or windfall to this goal"
      ]
    };

    return recommendedAction;
  }, [result, assessment]);

  if (!action) {
    return (
      <section className="result-card next-best-action-card" style={{ padding: "40px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, color: "var(--ink-3)", lineHeight: 1.6 }}>
          Complete your financial assessment to receive your personalized next best move.
        </p>
      </section>
    );
  }

  return (
    <section
      className="result-card next-best-action-card"
      style={{
        padding: "32px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, var(--blue-50) 0%, var(--teal-50) 100%)",
        border: "2px solid var(--blue-300)",
        cursor: onExpand ? "pointer" : "default"
      }}
      onClick={onExpand}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Next Best Move
        </p>
        <h2 style={{ margin: "12px 0 0", fontSize: "1.6rem", fontWeight: 700, color: "var(--ink-0)", lineHeight: 1.3 }}>
          {action.title}
        </h2>
      </div>

      {/* Story */}
      <p style={{ margin: "0 0 24px", fontSize: "1rem", color: "var(--ink-1)", lineHeight: 1.6, fontWeight: 500 }}>
        {action.story}
      </p>

      {/* Impact Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {/* Impact */}
        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: "var(--white)",
            border: "1px solid var(--blue-200)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <TrendingUp size={18} style={{ color: "var(--green-600)" }} />
            <span style={{ fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", fontWeight: 600 }}>
              Impact
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700, color: "var(--green-600)" }}>
            +{action.impact}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--ink-3)" }}>
            readiness pts
          </p>
        </div>

        {/* Difficulty */}
        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: "var(--white)",
            border: "1px solid var(--orange-200)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Zap size={18} style={{ color: "var(--orange-600)" }} />
            <span style={{ fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", fontWeight: 600 }}>
              Difficulty
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--orange-600)" }}>
            {action.difficulty}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--ink-3)" }}>
            achievable level
          </p>
        </div>

        {/* Timeframe */}
        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: "var(--white)",
            border: "1px solid var(--purple-200)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Clock size={18} style={{ color: "var(--purple-600)" }} />
            <span style={{ fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", fontWeight: 600 }}>
              Timeline
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--purple-600)" }}>
            {action.timeframe}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--ink-3)" }}>
            to completion
          </p>
        </div>
      </div>

      {/* Why Section */}
      <div
        style={{
          padding: "16px",
          borderRadius: "12px",
          background: "var(--white)",
          border: "1px solid var(--blue-100)",
          marginBottom: "24px"
        }}
      >
        <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
          Why This Move?
        </p>
        <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--ink-1)", lineHeight: 1.6 }}>
          {action.why}
        </p>
      </div>

      {/* CTA */}
      <button
        style={{
          width: "100%",
          padding: "14px 20px",
          borderRadius: "12px",
          background: "var(--blue-600)",
          color: "var(--white)",
          border: "none",
          fontSize: "1rem",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "background 0.2s"
        }}
        onMouseEnter={(e) => (e.target.style.background = "var(--blue-700)")}
        onMouseLeave={(e) => (e.target.style.background = "var(--blue-600)")}
        onClick={onExpand}
      >
        Learn Implementation Steps <ChevronRight size={18} />
      </button>
    </section>
  );
}
