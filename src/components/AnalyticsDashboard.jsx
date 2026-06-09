import React from "react";
import { TrendingDown, ShieldAlert, Sparkles, User, HelpCircle } from "lucide-react";

export default function AnalyticsDashboard({ result }) {
  const {
    healthScore,
    categoryBand,
    awarenessGapDisplay,
    perceivedSurvivalMonthsDisplay,
    survivalMonthsDisplay,
    futureRiskLabel,
    futureRiskScore,
    personalityType,
    personalityReport,
  } = result;

  const toneColorClass = `tone-text-${categoryBand?.tone || "steady"}`;

  return (
    <section className="analytics-dashboard">
      {/* Row 1: Psychological & Risk Profile Cards */}
      <div className="diagnostic-grid">
        {/* Money Personality Card */}
        <article className="diagnostic-card">
          <div className="card-header">
            <User size={20} />
            <span>Behavioral Archetype</span>
          </div>
          <div className="card-content">
            <p className="label">Money Personality</p>
            <strong className="personality-title">{personalityType}</strong>
          </div>
          <p className="card-note">
            This profile details how your spending behaviors react to emotional stress spikes and
            external social environments.
          </p>
        </article>

        {/* Future Risk Card */}
        <article className="diagnostic-card">
          <div className="card-header">
            <ShieldAlert size={20} />
            <span>Future Risk Exposure</span>
          </div>
          <div className="card-content">
            <p className="label">Risk Index Level: {futureRiskScore}/100</p>
            <strong className={`risk-badge ${futureRiskLabel.toLowerCase().replace(" ", "-")}`}>
              {futureRiskLabel}
            </strong>
          </div>
        </article>
      </div>

      {/* Row 2: The Visibility Blindspot (Awareness Gap) */}
      <article className="visibility-blindspot-block">
        <div className="blindspot-header">
          <Sparkles size={20} />
          <h3>The Visibility Blindspot (Awareness Gap)</h3>
          <HelpCircle size={18} />
        </div>

        <div className="blindspot-metrics">
          <div className="blindspot-sub-card">
            <span>Perceived Buffer Runway</span>
            <strong>{perceivedSurvivalMonthsDisplay} mos</strong>
          </div>

          <div className="blindspot-sub-card">
            <span>Actual Cash Runway</span>
            <strong>{survivalMonthsDisplay} mos</strong>
          </div>

          <div className="blindspot-sub-card">
            <span>Calculated Blindspot Severity</span>
            <strong>{awarenessGapDisplay} mos</strong>
          </div>
        </div>

        <p className="blindspot-insight">
          💡 <strong>What this reveals:</strong> Your financial tracking clarity profile indicates
          you may run out of liquid cash funds roughly <strong>{awarenessGapDisplay} months</strong>
          {awarenessGapDisplay !== "0"
            ? " sooner than your mental baseline currently expects."
            : " as planned."}
        </p>
      </article>
    </section>
  );
}
