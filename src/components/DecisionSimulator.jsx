import React, { useMemo, useState } from "react";
import { AlertCircle, Zap } from "lucide-react";
import { calculateDecisionSimulatorV2, formatMonths as formatMonthsV2 } from "../lib/scoring-v2.js";

export default function DecisionSimulator({ id, profile, behaviour }) {
  const [purchaseValue, setPurchaseValue] = useState("");
  const purchaseCost = useMemo(
    () => Math.max(0, Number.parseFloat(purchaseValue) || 0),
    [purchaseValue]
  );

  const simulator = useMemo(
    () => calculateDecisionSimulatorV2(profile, purchaseCost, behaviour),
    [profile, purchaseCost, behaviour]
  );

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
        <h2>Cognitive Decision Simulator</h2>
      </div>

      <p className="simulator-subtitle">
        Simulate an unplanned expense or major commitment before capital leaves your bank account.
      </p>

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
