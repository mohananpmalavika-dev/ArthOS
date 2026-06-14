import React, { useMemo, useState } from "react";
import { AlertCircle, TrendingDown, Zap, Heart } from "lucide-react";
import ContextualCoachPrompt from "./ContextualCoachPrompt.jsx";

export default function WhyScreen({ result, assessment, onCoachOpen }) {
  const [openId, setOpenId] = useState(null);
  const {
    biases = [],
    moneyBeliefs = [],
    emotionalTriggers = [],
    primaryDrivers = []
  } = result || {};

  // Combine all drivers into ranked list
  const whyFactors = useMemo(() => {
    const factors = [];

    // Add biases
    if (biases && Array.isArray(biases)) {
      biases.forEach(bias => {
        factors.push({
          type: "bias",
          label: bias.name || bias.label,
          impact: bias.severity || bias.strength || 0.5,
          description: bias.description || "This cognitive pattern is affecting your financial decisions",
          icon: AlertCircle
        });
      });
    }

    // Add money beliefs
    if (moneyBeliefs && Array.isArray(moneyBeliefs)) {
      moneyBeliefs.forEach(belief => {
        factors.push({
          type: "belief",
          label: belief.name || belief.belief,
          impact: belief.strength || 0.5,
          description: belief.description || "This belief is shaping your financial behavior",
          icon: Heart
        });
      });
    }

    // Add emotional triggers
    if (emotionalTriggers && Array.isArray(emotionalTriggers)) {
      emotionalTriggers.forEach(trigger => {
        factors.push({
          type: "trigger",
          label: trigger.name || trigger.trigger,
          impact: trigger.severity || 0.5,
          description: trigger.description || "This emotional pattern influences your decisions",
          icon: Zap
        });
      });
    }

    // Sort by impact descending
    return factors.sort((a, b) => (b.impact || 0) - (a.impact || 0)).slice(0, 5);
  }, [biases, moneyBeliefs, emotionalTriggers]);

  const avgImpact = whyFactors.length > 0
    ? Math.round((whyFactors.reduce((sum, f) => sum + (f.impact || 0), 0) / whyFactors.length) * 100)
    : 0;

  return (
    <section className="page-section why-screen" style={{ padding: "24px 16px" }}>
      <div className="page-heading" style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.85rem" }}>
          Why This Score?
        </p>
        <h1 style={{ margin: "12px 0 0", fontSize: "2rem", fontWeight: 800, color: "var(--ink-0)" }}>
          Behavior Breakdown
        </h1>
        <p style={{ margin: "12px 0 0", color: "var(--ink-3)", maxWidth: "760px", lineHeight: 1.7 }}>
          The core patterns — biases, beliefs, and triggers — that are shaping your financial reality today.
        </p>
      </div>

      {/* Main drivers */}
      <div style={{ display: "grid", gap: "20px" }}>
        {whyFactors.length > 0 ? (
          <>
            {/* Summary */}
            <section className="result-card why-summary-card" style={{ padding: "24px" }}>
              <div style={{ marginBottom: "20px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Primary Drivers
                </p>
                <h2 style={{ margin: "10px 0 0", fontSize: "1.4rem", fontWeight: 700, color: "var(--ink-0)" }}>
                  {whyFactors.length} Core Pattern{whyFactors.length !== 1 ? "s" : ""}
                </h2>
              </div>
              <p style={{ margin: "16px 0 0", color: "var(--ink-3)", lineHeight: 1.6 }}>
                These patterns are collectively responsible for ~{avgImpact}% of your financial behavior.
              </p>
            </section>

            {/* Driver Cards */}
            <div style={{ display: "grid", gap: "16px" }}>
              {whyFactors.map((factor, idx) => {
                const Icon = factor.icon;
                const impactPercent = Math.round((factor.impact || 0) * 100);
                const barWidth = Math.max(20, impactPercent);

                const isOpen = openId === idx;

                return (
                  <div key={idx} className="result-card why-driver-card" style={{ padding: "0", borderRadius: "12px", overflow: "hidden" }}>
                    <button
                      className="why-driver-toggle"
                      onClick={() => setOpenId(isOpen ? null : idx)}
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                        width: "100%",
                        padding: "14px",
                        background: "var(--white)",
                        border: "1px solid var(--gray-200)",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--gray-100)", display: "flex", alignItems: "center", justifyContent: "center", color: factor.type === "bias" ? "var(--red-500)" : factor.type === "trigger" ? "var(--orange-500)" : "var(--purple-500)" }}>
                        <Icon size={18} />
                      </div>
                      <div style={{ textAlign: "left", flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "1rem" }}>{factor.label}</strong>
                          <span style={{ fontSize: "0.9rem", color: impactPercent > 70 ? "var(--red-600)" : impactPercent > 40 ? "var(--orange-600)" : "var(--ink-2)", fontWeight: 700 }}>{impactPercent}%</span>
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "var(--ink-3)", marginTop: 6 }}>{factor.description}</div>
                      </div>
                    </button>

                    {isOpen && (
                      <div style={{ padding: 16, background: "var(--gray-50)", borderTop: "1px solid var(--gray-100)" }}>
                        <p style={{ margin: 0, color: "var(--ink-3)", lineHeight: 1.6 }}>{factor.description}</p>
                        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                          <button
                            className="btn btn-primary"
                            onClick={() => onCoachOpen && onCoachOpen(factor.label)}
                            aria-label={`Ask coach about ${factor.label}`}
                          >
                            Ask Coach
                          </button>
                          <button className="btn" onClick={() => navigator.clipboard?.writeText(factor.label)}>Copy</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <section className="result-card why-empty-card" style={{ padding: "40px 24px", textAlign: "center" }}>
            <p style={{ margin: 0, color: "var(--ink-3)", lineHeight: 1.6 }}>
              Behavior analysis will appear here as you complete assessments and build your financial profile.
            </p>
          </section>
        )}

        {/* Contextual Coach Section */}
        <section
          className="result-card why-coach-section"
          style={{
            padding: "24px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, var(--purple-50) 0%, var(--blue-50) 100%)",
            border: "1px solid var(--purple-200)"
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "var(--ink-0)", marginBottom: "8px" }}>
            💡 Pattern Insight
          </h3>
          <p style={{ margin: "0 0 12px", color: "var(--ink-3)", lineHeight: 1.6 }}>
            These patterns are not flaws—they're signals. They've helped you survive, adapt, and thrive in past situations.
          </p>
          <p style={{ margin: 0, color: "var(--ink-3)", lineHeight: 1.6 }}>
            Your next step is learning when to trust them, and when to override them. That's what we'll work on together.
          </p>
        </section>

        {/* Contextual Coach */}
        <ContextualCoachPrompt
          context="why"
          headline="Want to Understand These Patterns?"
          prompt="Your biases, beliefs, and triggers are intertwined. Ask your coach about any of these patterns and how they're connected to your financial behavior."
        />
      </div>
    </section>
  );
}
