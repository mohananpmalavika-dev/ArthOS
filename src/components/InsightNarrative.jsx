import React from "react";
import { Sparkles } from "lucide-react";
import { calculateBehavioralCorrelationV2 } from "../engines/behaviorCorrelation.js";

export default function InsightNarrative({ result, assessment }) {
  const correlations = calculateBehavioralCorrelationV2(assessment);
  const tone = result.healthScore >= 75 ? "positive" : result.healthScore >= 50 ? "cautious" : "critical";

  const narrative = result.healthScore >= 75
    ? `Good strength today. You are stable, but your awareness gap of ${result.awarenessGapDisplay} months means you may still be assuming more runway than you actually have.`
    : result.healthScore >= 50
      ? `Your financial health is mixed. ${result.blindSpotSummary} ${result.recommendedActionText}`
      : `Your profile is under pressure. ${result.blindSpotSummary} The most urgent priority is strengthening your runway and reducing high-risk spending.`;

  return (
    <section className={`result-card narrative-card tone-${tone}`}>
      <div className="result-heading">
        <Sparkles size={19} />
        <h2>Insight Narrative</h2>
      </div>

      <p className="narrative-copy">{narrative}</p>

      <div className="narrative-grid">
        <div className="narrative-box">
          <strong>Score</strong>
          <p>{result.healthScore}/100 — {result.categoryBand.label}</p>
        </div>
        <div className="narrative-box">
          <strong>Awareness Gap</strong>
          <p>{result.awarenessGapDisplay} months</p>
        </div>
        <div className="narrative-box">
          <strong>Future risk</strong>
          <p>{result.futureRiskLabel}</p>
        </div>
      </div>

      <div className="behavior-correlation">
        <strong>Behavioral correlation</strong>
        <ul>
          {correlations.map((item) => (
            <li key={item.title}>
              <strong>{item.title}:</strong> {item.description}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
