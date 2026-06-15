import React from "react";
import {
  TrendingDown,
  ShieldAlert,
  Sparkles,
  User,
  HelpCircle,
  TrendingUp,
  Gauge,
  BarChart3,
  Activity,
  Cloud,
  Users
} from "lucide-react";
import { normalizeScore } from "../lib/scoring-v2.js";

export default function AnalyticsDashboard({ result = {} }) {
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
    awarenessIntegrityScore,
    incomeVolatilityIndex,
    futureConfidenceScore,
    riskAdjustedSurvivalMonthsDisplay,
    peerCohortComparison,
    weatherIndex,
    adaptiveWeights,
    decisionQuality,
    componentDivergence,
    awarenessScore,
    behaviourScore,
    stabilityScore
  } = result;

  const normalizedHealthScore = normalizeScore(healthScore);
  const toneColorClass = `tone-text-${categoryBand?.tone || "steady"}`;
  const weightEntries = adaptiveWeights
    ? Object.entries(adaptiveWeights).map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: Math.round(value * 100)
      }))
    : [];

  return (
    <section className="analytics-dashboard">
      {/* Quick Summary Cards */}
      <div className="analytics-summary-grid">
        <article className="diagnostic-card summary-card">
          <div className="card-header">
            <BarChart3 size={20} />
            <span>Health Score</span>
          </div>
          <div className="card-content">
            <div className="summary-score">
              <strong>{normalizedHealthScore}</strong>
              <span>/100</span>
            </div>
            <p className="label">{categoryBand?.label || "No band"}</p>
          </div>
        </article>

        <article className="diagnostic-card summary-card">
          <div className="card-header">
            <TrendingUp size={20} />
            <span>Decision Quality</span>
          </div>
          <div className="card-content">
            <div className="summary-score">
              <strong>{decisionQuality?.index ?? "—"}</strong>
              <span>/100</span>
            </div>
            <p className="label">{decisionQuality?.band || "No band"}</p>
          </div>
        </article>

        <article className="diagnostic-card summary-card">
          <div className="card-header">
            <Cloud size={20} />
            <span>Weather Index</span>
          </div>
          <div className="card-content">
            <div className="summary-score">
              <strong>{weatherIndex ?? "—"}</strong>
              <span>/100</span>
            </div>
            <p className="label">Resilience outlook</p>
          </div>
        </article>

        <article className="diagnostic-card summary-card">
          <div className="card-header">
            <Activity size={20} />
            <span>Volatility</span>
          </div>
          <div className="card-content">
            <div className="summary-score">
              <strong>{incomeVolatilityIndex ?? "—"}%</strong>
            </div>
            <p className="label">Income stability risk</p>
          </div>
        </article>
      </div>

      {/* Core Metrics Grid */}
      <div className="diagnostic-grid analytics-metrics-grid">
        {/* Behavioral Archetype */}
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
            How your spending behaviors react to stress and external environments.
          </p>
        </article>

        {/* Future Risk */}
        <article className="diagnostic-card">
          <div className="card-header">
            <ShieldAlert size={20} />
            <span>Future Risk Exposure</span>
          </div>
          <div className="card-content">
            <p className="label">Risk Index</p>
            <strong>{futureRiskScore ?? "—"}/100</strong>
          </div>
          <p className="card-note">{futureRiskLabel || "No label available"}</p>
        </article>

        {/* Survival Runway */}
        <article className="diagnostic-card">
          <div className="card-header">
            <TrendingDown size={20} />
            <span>Cash Runway</span>
          </div>
          <div className="card-content">
            <div className="runway-display">
              <div className="runway-item">
                <span>Actual</span>
                <strong>{survivalMonthsDisplay}</strong>
              </div>
              <div className="runway-item">
                <span>Risk-adjusted</span>
                <strong>{riskAdjustedSurvivalMonthsDisplay ?? "—"}</strong>
              </div>
            </div>
          </div>
        </article>

        {/* Confidence & Peer Position */}
        <article className="diagnostic-card">
          <div className="card-header">
            <Users size={20} />
            <span>Peer Comparison</span>
          </div>
          <div className="card-content">
            <p className="label">Your Percentile</p>
            <strong>{peerCohortComparison?.percentile ?? "—"}%</strong>
          </div>
          <p className="card-note">{peerCohortComparison?.label || "Comparison pending"}</p>
        </article>

        {/* Future Confidence */}
        <article className="diagnostic-card">
          <div className="card-header">
            <Gauge size={20} />
            <span>Future Confidence</span>
          </div>
          <div className="card-content">
            <p className="label">Prediction Strength</p>
            <strong>{futureConfidenceScore ?? "—"}%</strong>
          </div>
          <p className="card-note">How certain the system is about your trajectory.</p>
        </article>

        {/* Component Balance */}
        <article className="diagnostic-card">
          <div className="card-header">
            <BarChart3 size={20} />
            <span>Component Balance</span>
          </div>
          <div className="card-content">
            <div className="component-display">
              <div className="component-item">
                <span>Behaviour</span>
                <strong>{behaviourScore ?? "—"}</strong>
              </div>
              <div className="component-item">
                <span>Awareness</span>
                <strong>{awarenessScore ?? "—"}</strong>
              </div>
              <div className="component-item">
                <span>Stability</span>
                <strong>{stabilityScore ?? "—"}</strong>
              </div>
            </div>
            <p className="card-note">
              Divergence: <strong>{componentDivergence ?? "—"}%</strong>
            </p>
          </div>
        </article>
      </div>

      {/* Awareness Gap Block */}
      <article className="visibility-blindspot-block">
        <div className="blindspot-header">
          <Sparkles size={20} />
          <h3>The Visibility Blindspot (Awareness Gap)</h3>
          <HelpCircle size={18} />
        </div>

        <div className="blindspot-metrics">
          <div className="blindspot-sub-card">
            <span>Perceived Buffer</span>
            <strong>{perceivedSurvivalMonthsDisplay} mos</strong>
          </div>
          <div className="blindspot-sub-card">
            <span>Actual Runway</span>
            <strong>{survivalMonthsDisplay} mos</strong>
          </div>
          <div className="blindspot-sub-card">
            <span>Severity</span>
            <strong>{awarenessGapDisplay} mos</strong>
          </div>
        </div>
        <p className="blindspot-insight">
          <strong>Insight:</strong> You may run out of cash roughly <strong>{awarenessGapDisplay} months</strong>
          {awarenessGapDisplay !== "0" ? " sooner than your mental baseline expects." : " as planned."}
        </p>
        {typeof awarenessIntegrityScore === "number" && (
          <p className="blindspot-metric">
            Awareness Integrity Score: <strong>{awarenessIntegrityScore}</strong>/100
          </p>
        )}
      </article>

      {/* Adaptive Weights */}
      {weightEntries.length > 0 && (
        <article className="diagnostic-card">
          <div className="card-header">
            <Activity size={20} />
            <span>Adaptive Weighting</span>
          </div>
          <div className="card-content">
            <p className="label">Dynamic component focus based on your profile</p>
            <div className="weight-grid">
              {weightEntries.map(weight => (
                <div className="weight-item" key={weight.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span>{weight.label}</span>
                    <strong>{weight.value}%</strong>
                  </div>
                  <div className="weight-bar">
                    <div style={{ width: `${weight.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      )}
    </section>
  );
}
