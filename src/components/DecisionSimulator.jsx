import React, { useMemo, useState } from "react";
import { AlertCircle, Zap, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { calculateDecisionSimulatorV2, formatMonths as formatMonthsV2 } from "../lib/scoring-v2.js";

export default function DecisionSimulator({ id, profile, behaviour, assessment }) {
  const [purchaseValue, setPurchaseValue] = useState("");
  const purchaseCost = useMemo(
    () => Math.max(0, Number.parseFloat(purchaseValue) || 0),
    [purchaseValue]
  );

  // Support either direct profile/behaviour props or an assessment object
  const safeProfile = profile || (assessment && assessment.profile) || {};
  const safeBehaviour = behaviour || (assessment && assessment.behaviour) || {};

  const simulator = useMemo(
    () => calculateDecisionSimulatorV2(safeProfile, purchaseCost, safeBehaviour),
    [safeProfile, purchaseCost, safeBehaviour]
  );

  // Calculate 3-path scenarios based on profile survival window
  const monthlyBurn = safeProfile.monthlyExpense || safeProfile.monthlySpending || 50000;
  const baselineMonths = simulator?.currentRunway || 12;
  
  const paths = useMemo(() => ({
    conservative: {
      label: "Conservative Path",
      description: "Reduce expenses, extend runway",
      monthlyReduction: monthlyBurn * 0.15, // 15% reduction
      resultMonths: baselineMonths * 1.25,
      riskLevel: "Low",
      icon: TrendingDown,
      color: "var(--green-700)",
    },
    balanced: {
      label: "Balanced Path",
      description: "Status quo, maintain discipline",
      monthlyReduction: 0,
      resultMonths: baselineMonths,
      riskLevel: "Moderate",
      icon: Minus,
      color: "var(--cyan)",
    },
    aggressive: {
      label: "Aggressive Path",
      description: "Invest growth, controlled risk",
      monthlyReduction: -1 * (monthlyBurn * 0.1), // 10% increase (investment)
      resultMonths: Math.max(3, baselineMonths * 0.85),
      riskLevel: "High",
      icon: TrendingUp,
      color: "var(--orange-700)",
    },
  }), [baselineMonths, monthlyBurn]);

  const currentRiskIndex = simulator.currentRunway > 0 ? 100 / simulator.currentRunway : 100;
  const forecastRiskIndex = simulator.forecastRunway > 0 ? 100 / simulator.forecastRunway : 100;
  const riskIncrease =
    purchaseCost > 0 && currentRiskIndex > 0
      ? Math.round(((forecastRiskIndex - currentRiskIndex) / currentRiskIndex) * 100)
      : 0;

  const riskTrend = purchaseCost > 0 && riskIncrease > 0 ? "negative" : "positive";

  return (
    <section className="result-card simulator-card" id={id}>
      <div className="result-heading">
        <Zap size={19} />
        <h2>Your Financial Futures</h2>
      </div>

      <p className="simulator-subtitle">
        Explore three strategic paths: which future do you want to build?
      </p>

      {/* 3-Path Scenario Overview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--space-3)",
          marginBottom: "var(--space-5)",
        }}
      >
        {Object.entries(paths).map(([key, path]) => {
          const Icon = path.icon;
          return (
            <div
              key={key}
              style={{
                padding: "var(--space-3)",
                borderRadius: "var(--radius-2)",
                border: `1px solid ${path.color}`,
                backgroundColor: "var(--surface-2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                <Icon size={18} style={{ color: path.color }} />
                <strong style={{ color: "var(--ink-0)" }}>{path.label}</strong>
              </div>
              <p style={{ color: "var(--ink-2)", fontSize: "var(--type-xs)", marginBottom: "var(--space-2)", margin: 0 }}>
                {path.description}
              </p>
              <div style={{ backgroundColor: "var(--surface-2)", padding: "var(--space-2)", borderRadius: "var(--radius-1)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: "var(--type-xs)", color: "var(--ink-3)", marginBottom: "var(--space-1)" }}>
                  60-month runway:
                </div>
                <strong style={{ fontSize: "var(--type-lg)", color: path.color }}>
                  {path.resultMonths.toFixed(1)} months
                </strong>
              </div>
              <div style={{ marginTop: "var(--space-2)", fontSize: "var(--type-xs)", textAlign: "center" }}>
                <span style={{ backgroundColor: path.color, color: "white", padding: "2px 6px", borderRadius: "3px" }}>
                  {path.riskLevel} Risk
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Simulator Section */}
      <div style={{ marginTop: "var(--space-5)", paddingTop: "var(--space-4)", borderTop: "2px solid rgba(98, 228, 209, 0.16)" }}>
        <h3 style={{ color: "var(--ink-0)", marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <AlertCircle size={16} />
          Test a Decision
        </h3>
        <p style={{ color: "var(--ink-2)", fontSize: "var(--type-xs)", marginBottom: "var(--space-3)" }}>
          Simulate an unplanned expense to see its impact on your runway and risk profile.
        </p>
      </div>

      <div className="simulator-input-group">
        <label htmlFor={id ? `${id}-purchase-cost` : "purchase-cost"}>
          Proposed purchase price
        </label>
        <div className="input-wrapper">
          <span className="currency-label">INR</span>
          <input
            id={id ? `${id}-purchase-cost` : "purchase-cost"}
            type="number"
            min="0"
            step="1000"
            placeholder="45000"
            value={purchaseValue}
            onChange={event => setPurchaseValue(event.target.value)}
          />
        </div>
      </div>

      {purchaseCost > 0 ? (
        <>
          <div className="simulator-impact-summary">
            <div className="impact-row">
              <span className="impact-label">Current runway</span>
              <strong className="impact-value current">
                {formatMonthsV2(simulator.currentRunway)} months
              </strong>
            </div>
            <div className="impact-arrow">to</div>
            <div className="impact-row">
              <span className="impact-label">After purchase</span>
              <strong className="impact-value forecast">
                {formatMonthsV2(simulator.forecastRunway)} months
              </strong>
            </div>
            <div className="impact-reduction">
              <span>Runway reduction: -{formatMonthsV2(simulator.runwayImpactMonths)} months</span>
            </div>
          </div>

          <div className="simulator-metrics-grid">
            <div className="simulator-metric">
              <span>New core cushion</span>
              <strong>{formatMonthsV2(simulator.newRunway)} mos</strong>
            </div>
            <div className="simulator-metric">
              <span>Stability score penalty</span>
              <strong>-{simulator.stabilityLoss} pts</strong>
            </div>
          </div>

          <div className={`simulator-risk-indicator risk-${riskTrend}`}>
            <span className="risk-label">Risk Change</span>
            <span className="risk-value">
              {riskIncrease > 0 ? "+" : ""}
              {riskIncrease}%
            </span>
          </div>

          <div className="simulator-recommendation-box friction-warning">
            <AlertCircle size={17} />
            <div>
              <span className="rec-label">Friction warning</span>
              <p className="rec-text">{simulator.recommendation}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="simulator-placeholder">
          <p>Enter an amount to see how a purchase affects your runway and risk profile.</p>
        </div>
      )}
    </section>
  );
}
