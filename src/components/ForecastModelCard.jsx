/**
 * ForecastModelCard — Sophisticated Forecasting Display
 *
 * Shows multi-model prediction results from the prediction engine:
 * - ARIMA, Holt-Winters, Bayesian Structural, Ensemble
 * - Auto-selected best model with rationale
 * - 30/90/180 day horizons with confidence intervals
 * - Model comparison table (all candidates + their RMSE)
 * - Ensemble weight distribution
 */

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";

function round(num) {
  if (typeof num !== "number" || Number.isNaN(num)) {
    return "—";
  }
  return Math.round(num);
}

function confidenceColor(confidence) {
  if (confidence >= 70) {
    return "forecast-status-positive";
  }
  if (confidence >= 40) {
    return "forecast-status-neutral";
  }
  return "forecast-status-negative";
}

function scoreColor(val) {
  if (val >= 80) {
    return "var(--green)";
  }
  if (val >= 50) {
    return "var(--amber)";
  }
  return "var(--red)";
}

export function ForecastModelCard({ forecast }) {
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [showAllModels, setShowAllModels] = useState(false);

  if (!forecast) {
    return (
      <div className="forecast-empty-state">
        <p>Complete your assessment to generate multi-model forecasts.</p>
      </div>
    );
  }

  const {
    horizons,
    model,
    modelType,
    modelMetrics,
    ensembleModel,
    allModels,
    confidence,
    dataPoints
  } = forecast;

  const horizonDays = [
    { key: "day30", label: "30 Day", subtitle: "Near-term" },
    { key: "day90", label: "90 Day", subtitle: "Medium-term" },
    { key: "day180", label: "180 Day", subtitle: "Long-term" }
  ];

  const getTrend = hKey => {
    if (!horizons) {
      return "stable";
    }
    const h = horizons[hKey];
    if (!h) {
      return "stable";
    }
    const p50 = h.p50 || 0;
    const base = horizons.day30?.p50 || p50;
    if (p50 > base + 3) {
      return "improving";
    }
    if (p50 < base - 3) {
      return "deteriorating";
    }
    return "stable";
  };

  const trendIcon = t => {
    if (t === "improving") {
      return <TrendingUp size={18} style={{ color: "var(--green)" }} />;
    }
    if (t === "deteriorating") {
      return <TrendingDown size={18} style={{ color: "var(--red)" }} />;
    }
    return <Minus size={18} style={{ color: "var(--muted)" }} />;
  };

  const r2Grade =
    modelMetrics?.r2 !== undefined
      ? modelMetrics.r2 < 0.3
        ? "Poor fit"
        : modelMetrics.r2 < 0.6
          ? "Moderate fit"
          : "Good fit"
      : "N/A";

  return (
    <section className="forecast-section">
      <div className="forecast-header">
        <div>
          <h3>Multi-Model Forecast Engine</h3>
          <p>
            Combines <strong>ARIMA</strong>, <strong>Holt-Winters</strong>,{" "}
            <strong>Bayesian Structural</strong>, and <strong>Ensemble</strong> models for
            probabilistic financial health projections at 30/90/180 day horizons.
          </p>
        </div>
      </div>

      {/* Selected Model Badge */}
      <div className="forecast-model-badge">
        <BarChart3 size={18} />
        <span>
          Auto-selected: <strong>{model}</strong> (RMSE: {modelMetrics?.rmse ?? "N/A"}, R²:{" "}
          {modelMetrics?.r2?.toFixed(2) ?? "N/A"} — {r2Grade})
        </span>
        <span className="forecast-model-badge-meta">
          {dataPoints} data points ·{" "}
          <span style={{ color: confidenceColor(confidence) }}>{confidence}% confidence</span>
        </span>
      </div>

      {/* Horizon Cards */}
      <div className="premium-report-grid premium-report-grid-3 forecast-scenarios-grid">
        {horizonDays.map(({ key, label, subtitle }) => {
          const h = horizons[key];
          if (!h) {
            return null;
          }
          const trend = getTrend(key);
          return (
            <div
              key={key}
              className={`forecast-card ${trend === "improving" ? "forecast-card-positive" : trend === "deteriorating" ? "forecast-card-negative" : "forecast-card-neutral"}`}
            >
              <div className="forecast-card-header">
                <div className="forecast-card-title">
                  {trendIcon(trend)}
                  <div>
                    <h4>{label} Forecast</h4>
                    <p>
                      {subtitle} · {trend} trajectory
                    </p>
                  </div>
                </div>
              </div>

              <div className="forecast-card-metrics">
                <div className="forecast-detail-card">
                  <span>Projected Health</span>
                  <strong style={{ color: scoreColor(h.p50) }}>{round(h.p50)} / 100</strong>
                  <small>Median (p50) projection</small>
                </div>
                <div className="forecast-detail-card">
                  <span>Confidence Band</span>
                  <strong>
                    {round(h.p25)} – {round(h.p75)}
                  </strong>
                  <small>p25–p75 interquartile range</small>
                </div>
                <div className="forecast-detail-card">
                  <span>Extreme Range</span>
                  <strong>
                    {round(h.p5)} – {round(h.p95)}
                  </strong>
                  <small>p5–p95 (90% confidence)</small>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Model Comparison */}
      <div className="forecast-model-toggle">
        <button
          type="button"
          className="forecast-model-toggle-btn"
          onClick={() => setShowModelDetails(p => !p)}
        >
          <Layers size={16} />
          <span>Model comparison & ensemble details</span>
          {showModelDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {showModelDetails && (
        <div className="forecast-model-details">
          {/* All Models Table */}
          {allModels && allModels.length > 0 && (
            <>
              <div className="forecast-subsection-title" style={{ marginBottom: "12px" }}>
                Candidate Models
              </div>
              <div className="forecast-model-table">
                <div className="forecast-model-table-header">
                  <span>Model</span>
                  <span>MAE</span>
                  <span>RMSE</span>
                  <span>MAPE</span>
                  <span>R²</span>
                  <span>Status</span>
                </div>
                {(showAllModels ? allModels : allModels.slice(0, 3)).map((m, i) => (
                  <div
                    key={i}
                    className={`forecast-model-table-row ${m.isBest ? "forecast-model-row-best" : ""}`}
                  >
                    <span>
                      {m.name}
                      {m.isBest && (
                        <CheckCircle
                          size={12}
                          style={{ marginLeft: "6px", color: "var(--green)" }}
                        />
                      )}
                    </span>
                    <span>{m.metrics?.mae ?? "—"}</span>
                    <span>{m.metrics?.rmse ?? "—"}</span>
                    <span>{m.metrics?.mape != null ? `${m.metrics.mape}%` : "—"}</span>
                    <span>{m.metrics?.r2 != null ? m.metrics.r2.toFixed(3) : "—"}</span>
                    <span>
                      {m.isBest ? (
                        <span style={{ color: "var(--green)", fontWeight: 600 }}>✓ Selected</span>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>Candidate</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              {allModels.length > 3 && (
                <button
                  type="button"
                  className="forecast-model-toggle-btn"
                  onClick={() => setShowAllModels(p => !p)}
                  style={{ marginTop: "8px" }}
                >
                  {showAllModels ? "Show fewer models" : `Show all ${allModels.length} models`}
                </button>
              )}
            </>
          )}

          {/* Ensemble Weights */}
          {ensembleModel && ensembleModel.models && ensembleModel.models.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <div className="forecast-subsection-title" style={{ marginBottom: "12px" }}>
                Ensemble Composition (inverse-RMSE weighted)
              </div>
              <div className="forecast-ensemble-list">
                {ensembleModel.models.map((m, i) => (
                  <div key={i} className="forecast-ensemble-row">
                    <span>{m.name}</span>
                    <div className="forecast-ensemble-bar-track">
                      <div className="forecast-ensemble-bar-fill" style={{ width: m.weight }} />
                    </div>
                    <span className="forecast-ensemble-weight">{m.weight}</span>
                    <span className="forecast-ensemble-rmse">RMSE: {m.rmse ?? "—"}</span>
                  </div>
                ))}
              </div>
              <div className="forecast-ensemble-summary">
                <Info size={14} />
                <span>
                  Ensemble RMSE: <strong>{ensembleModel.rmse ?? "—"}</strong> · Weights are
                  proportional to inverse of each model's RMSE (lower error = higher weight)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trajectory note */}
      <div className="forecast-card-note" style={{ marginTop: "16px" }}>
        <AlertTriangle size={14} />
        <span>
          Forecasts are probabilistic — the p50 (median) is the most likely outcome, but the actual
          result can fall anywhere within the confidence bands. Higher confidence indicates more
          historical data and better model fit.
        </span>
      </div>
    </section>
  );
}

export default ForecastModelCard;
