import React from "react";
import { Sparkles, Brain, TrendingUp } from "lucide-react";
import { calculateBehavioralCorrelationV2 } from "../engines/behaviorCorrelation.js";
import { normalizeScore } from "../lib/scoring-v2.js";

export default function InsightNarrative({ result, assessment }) {
  const correlations = calculateBehavioralCorrelationV2(assessment);
  const rawHealthScore = result?.healthScore ?? 50;
  const normalizedHealthScore = normalizeScore(rawHealthScore);
  const tone =
    normalizedHealthScore >= 80 ? "positive" : normalizedHealthScore >= 60 ? "cautious" : "critical";

  // Map health score to band color
  const bandColor =
    normalizedHealthScore >= 80
      ? "var(--bas-sovereign)"
      : normalizedHealthScore >= 60
        ? "var(--bas-resilient)"
        : normalizedHealthScore >= 40
          ? "var(--bas-developing)"
          : normalizedHealthScore >= 20
            ? "var(--bas-warning)"
            : "var(--bas-critical)";

  const narrative =
    normalizedHealthScore >= 80
      ? `Good strength today. You are ${result.categoryBand.label}. Your awareness gap of ${result.awarenessGapDisplay} months means you may still be assuming more runway than you actually have.`
      : normalizedHealthScore >= 60
        ? `Your financial health is ${result.categoryBand.label.toLowerCase()}. ${result.blindSpotSummary} ${result.recommendedActionText}`
        : `Your profile is under pressure. ${result.blindSpotSummary} The most urgent priority is strengthening your runway and reducing high-risk spending.`;

  return (
    <section
      className={`result-card narrative-card tone-${tone} summary-card`}
      style={{
        borderTopWidth: "3px",
        borderTopColor: bandColor,
      }}
    >
      <div className="premium-report-block-header">
        <div className="result-heading">
          <Sparkles size={19} />
          <h2 className="premium-report-block-title">Insight Narrative</h2>
        </div>
        <p className="premium-report-block-subtitle">
          A concise behavioral narrative from your assessment.
        </p>
      </div>

      <p className="narrative-copy">{narrative}</p>

      <div
        className="narrative-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--space-3)",
          marginTop: "var(--space-4)",
          marginBottom: "var(--space-4)",
        }}
      >
        <div
          className="narrative-box"
          style={{
            padding: "var(--space-3)",
            backgroundColor: "var(--surface-3)",
            borderRadius: "var(--radius-2)",
            borderLeft: "2px solid var(--cyan)",
          }}
        >
          <strong style={{ color: "var(--ink-0)" }}>Score</strong>
          <p style={{ color: "var(--ink-2)", marginTop: "var(--space-1)" }}>
            {normalizedHealthScore}/100 - {result.categoryBand.label}
          </p>
        </div>
        <div
          className="narrative-box"
          style={{
            padding: "var(--space-3)",
            backgroundColor: "var(--surface-3)",
            borderRadius: "var(--radius-2)",
            borderLeft: "2px solid var(--green-700)",
          }}
        >
          <strong style={{ color: "var(--ink-0)" }}>Awareness Gap</strong>
          <p style={{ color: "var(--ink-2)", marginTop: "var(--space-1)" }}>
            {result.awarenessGapDisplay} months
          </p>
        </div>
        <div
          className="narrative-box"
          style={{
            padding: "var(--space-3)",
            backgroundColor: "var(--surface-3)",
            borderRadius: "var(--radius-2)",
            borderLeft: "2px solid var(--red-600)",
          }}
        >
          <strong style={{ color: "var(--ink-0)" }}>Future Risk</strong>
          <p style={{ color: "var(--ink-2)", marginTop: "var(--space-1)" }}>
            {result.futureRiskLabel}
          </p>
        </div>
      </div>

      <div
        className="behavior-correlation"
        style={{
          marginTop: "var(--space-4)",
          paddingTop: "var(--space-4)",
          borderTop: "1px solid rgba(98, 228, 209, 0.12)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          <Brain size={18} style={{ color: "var(--cyan)" }} />
          <strong style={{ color: "var(--ink-0)", fontSize: "var(--type-sm)" }}>Key Behavioral Patterns</strong>
        </div>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--space-2)",
          }}
        >
          {correlations.map(item => (
            <li
              key={item.title}
              style={{
                padding: "var(--space-2)",
                backgroundColor: "var(--surface-3)",
                borderRadius: "var(--radius-1)",
                borderLeft: "2px solid var(--teal-700)",
              }}
            >
              <strong style={{ color: "var(--ink-0)", fontSize: "var(--type-xs)" }}>{item.title}</strong>
              <p style={{ color: "var(--ink-2)", fontSize: "var(--type-xs)", marginTop: "var(--space-1)", margin: 0 }}>
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
