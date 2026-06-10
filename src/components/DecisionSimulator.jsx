import React, { useMemo, useState } from "react";
import { Cpu } from "lucide-react";
import { calculateDecisionSimulatorV2, formatMonths as formatMonthsV2 } from "../lib/scoring-v2.js";

export default function DecisionSimulator({ id, profile }) {
  const [purchaseCost, setPurchaseCost] = useState(0);
  const simulator = useMemo(
    () => calculateDecisionSimulatorV2(profile, purchaseCost),
    [profile, purchaseCost],
  );

  const currentRiskIndex = simulator.currentRunway > 0 ? 100 / simulator.currentRunway : 100;
  const forecastRiskIndex = simulator.forecastRunway > 0 ? 100 / simulator.forecastRunway : 100;
  const riskIncrease = purchaseCost > 0
    ? Math.round(((forecastRiskIndex - currentRiskIndex) / currentRiskIndex) * 100)
    : 0;

  const riskTrend = purchaseCost > 0 && riskIncrease > 0 ? "negative" : purchaseCost > 0 ? "positive" : "neutral";

  return (
    <section className="result-card simulator-card" id={id}>
      <div className="result-heading">
        <Cpu size={19} />
        <h2>Decision Simulator</h2>
      </div>

      <p className="simulator-subtitle">Estimate the runway impact before you buy.</p>

      <div className="simulator-input">
        <label htmlFor="purchase-cost">If I buy an item for</label>
        <div className="input-wrapper">
          <span className="currency-label">INR</span>
          <input
            id="purchase-cost"
            type="number"
            min="0"
            step="1000"
            placeholder="0"
            value={purchaseCost}
            onChange={(event) => setPurchaseCost(Number.parseFloat(event.target.value) || 0)}
          />
        </div>
      </div>

      {purchaseCost > 0 ? (
        <>
          <div className="simulator-impact-summary">
            <div className="impact-row">
              <span className="impact-label">Current runway</span>
              <strong className="impact-value current">{formatMonthsV2(simulator.currentRunway)} months</strong>
            </div>
            <div className="impact-arrow">to</div>
            <div className="impact-row">
              <span className="impact-label">After purchase</span>
              <strong className="impact-value forecast">{formatMonthsV2(simulator.forecastRunway)} months</strong>
            </div>
            <div className="impact-reduction">
              <span>Loss: {formatMonthsV2(simulator.runwayDelta)} months</span>
            </div>
          </div>

          <div className={`simulator-risk-indicator risk-${riskTrend}`}>
            <span className="risk-label">Risk Change</span>
            <span className="risk-value">{riskIncrease > 0 ? "+" : ""}{riskIncrease}%</span>
          </div>

          <div className="simulator-recommendation-box">
            <span className="rec-label">Recommendation</span>
            <p className="rec-text">{simulator.recommendation}</p>
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
