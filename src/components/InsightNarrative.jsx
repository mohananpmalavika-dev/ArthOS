import React from "react";
import { Sparkles, Brain, TrendingUp } from "lucide-react";
import { calculateBehavioralCorrelationV2 } from "../engines/behaviorCorrelation.js";

export default function InsightNarrative({ result, assessment }) {
  const correlations = calculateBehavioralCorrelationV2(assessment);
  const healthScore = result?.healthScore ?? 50;
  const tone =
    healthScore >= 80 ? "positive" : healthScore >= 60 ? "cautious" : "critical";

  // Map health score to band color
  const bandColor =
    healthScore >= 800
      ? "var(--bas-sovereign)"
      : healthScore >= 600
        ? "var(--bas-resilient)"
        : healthScore >= 400
          ? "var(--bas-developing)"
          : healthScore >= 200
            ? "var(--bas-warning)"
            : "var(--bas-critical)";

  const narrative =
    healthScore >= 80
      ? `Good strength today. You are ${result.categoryBand.label}. Your awareness gap of ${result.awarenessGapDisplay} months means you may still be assuming more runway than you actually have.`
      : healthScore >= 60
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
            backgroundColor: "var(--blue-50)",
            borderRadius: "var(--radius-2)",
            borderLeft: "2px solid var(--cyan)",
          }}
        >
          <strong style={{ color: "var(--ink-0)" }}>Score</strong>
          <p style={{ color: "var(--ink-2)", marginTop: "var(--space-1)" }}>
            {result.healthScore}/100 - {result.categoryBand.label}
          </p>
        </div>
        <div
          className="narrative-box"
          style={{
            padding: "var(--space-3)",
            backgroundColor: "var(--green-50)",
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
            backgroundColor: "var(--red-50)",
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
          borderTop: "1px solid var(--blue-50)",
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
                backgroundColor: "var(--blue-50)",
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
