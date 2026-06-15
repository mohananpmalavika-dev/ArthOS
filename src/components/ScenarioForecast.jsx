import React, { useState } from "react";
import PropTypes from "prop-types";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import {
  forecastScenarios,
  simulateDecisionImpact,
  estimateCashflowBreakdown
} from "../engines/scenarioForecast";

export function ScenarioForecast({ profile, assessmentResult }) {
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [decisionAmount, setDecisionAmount] = useState(5000);
  const [decisionType, setDecisionType] = useState("savings_increase");

  if (!profile || !assessmentResult) {
    return (
      <div className="forecast-empty-state">
        <p>Complete your assessment to see your forecast summary.</p>
      </div>
    );
  }

  const forecast = forecastScenarios(profile);
  const cashflow = estimateCashflowBreakdown(profile);
  const decisionImpact = selectedDecision
    ? simulateDecisionImpact(
        {
          ...profile,
          currentScore: assessmentResult?.healthScore,
          currentFutureScore: assessmentResult?.futureRiskScore
        },
        selectedDecision
      )
    : null;

  if (!forecast) {
    return null;
  }

  const getStatusIcon = status => {
    if (status === "improving") {
      return <TrendingUp size={20} className="forecast-status-icon forecast-status-positive" />;
    }
    if (status === "deteriorating") {
      return <TrendingDown size={20} className="forecast-status-icon forecast-status-negative" />;
    }
    return <CheckCircle size={20} className="forecast-status-icon forecast-status-neutral" />;
  };

  const getStatusClass = status => {
    if (status === "improving") {
      return "forecast-card forecast-card-positive";
    }
    if (status === "deteriorating") {
      return "forecast-card forecast-card-negative";
    }
    return "forecast-card forecast-card-neutral";
  };

  return (
    <div className="forecast-section">
      <div className="forecast-header">
        <div>
          <h3>Financial Forecast</h3>
          <p>
            Live runway, cashflow and scenario insights presented in the same premium page style.
          </p>
        </div>
      </div>

      <div className="premium-report-grid premium-report-grid-3 forecast-summary-grid">
        <div className="premium-metric-tile">
          <div className="premium-metric-kicker">Emergency Savings</div>
          <div className="premium-metric-value">
            ₹{Math.round(forecast.baseline.currentSavings / 1000)}K
          </div>
        </div>
        <div className="premium-metric-tile">
          <div className="premium-metric-kicker">Survival Window</div>
          <div className="premium-metric-value">
            {Math.round(forecast.baseline.currentRunway * 10) / 10} months
          </div>
        </div>
        <div className="premium-metric-tile">
          <div className="premium-metric-kicker">Monthly Net</div>
          <div
            className={`premium-metric-value ${forecast.baseline.monthlyNetIncome >= 0 ? "forecast-positive" : "forecast-negative"}`}
          >
            ₹{Math.round(forecast.baseline.monthlyNetIncome / 1000)}K
          </div>
        </div>
      </div>

      <div className="forecast-subsection">
        <div className="forecast-subsection-title">Monthly Cashflow Breakdown</div>
        <div className="premium-report-grid premium-report-grid-2 forecast-breakdown-grid">
          <div className="premium-metric-tile">
            <div className="premium-metric-kicker">Income</div>
            <div className="premium-metric-value">₹{Math.round(cashflow.income / 1000)}K</div>
          </div>
          <div className="premium-metric-tile">
            <div className="premium-metric-kicker">Essential Expenses</div>
            <div className="premium-metric-value">₹{Math.round(cashflow.essentials / 1000)}K</div>
          </div>
          <div className="premium-metric-tile">
            <div className="premium-metric-kicker">Discretionary Spending</div>
            <div className="premium-metric-value">
              ₹{Math.round(cashflow.discretionary / 1000)}K
            </div>
          </div>
          <div className="premium-metric-tile">
            <div className="premium-metric-kicker">Debt Repayment</div>
            <div className="premium-metric-value">
              ₹{Math.round(cashflow.debtRepayment / 1000)}K
            </div>
          </div>
          <div className="premium-metric-tile premium-metric-tile-wide">
            <div className="premium-metric-kicker">Available for Savings</div>
            <div className="premium-metric-value">
              ₹{Math.round(cashflow.savingsOpportunity / 1000)}K ({cashflow.savingsPercentage}%)
            </div>
          </div>
        </div>
      </div>

      <div className="forecast-subsection">
        <div className="forecast-subsection-title">30 / 90 / 180-Day Forecasts</div>
        <div className="premium-report-grid premium-report-grid-3 forecast-scenarios-grid">
          {forecast.scenarios.map(scenario => (
            <div key={scenario.days} className={getStatusClass(scenario.status)}>
              <div className="forecast-card-header">
                <div className="forecast-card-title">
                  {getStatusIcon(scenario.status)}
                  <div>
                    <h4>{scenario.timeframe} Forecast</h4>
                    <p>{scenario.status} trajectory</p>
                  </div>
                </div>
                <Calendar size={20} className="forecast-card-calendar" />
              </div>

              <div className="forecast-card-metrics">
                <div className="forecast-detail-card">
                  <span>Projected Savings</span>
                  <strong>₹{Math.round(scenario.projectedSavings / 1000)}K</strong>
                  <small>
                    {scenario.projectedSavings >= forecast.baseline.currentSavings ? "+" : ""}₹
                    {Math.round(
                      (scenario.projectedSavings - forecast.baseline.currentSavings) / 1000
                    )}
                    K difference
                  </small>
                </div>
                <div className="forecast-detail-card">
                  <span>Runway</span>
                  <strong>{Math.round(scenario.projectedRunway * 10) / 10} months</strong>
                  <small>estimated runway</small>
                </div>
                <div className="forecast-detail-card">
                  <span>Debt Remaining</span>
                  <strong>₹{Math.round(scenario.projectedDebt / 1000)}K</strong>
                  <small>
                    {scenario.projectedDebt <= forecast.baseline.currentRunway * 12
                      ? "✓ Paid down"
                      : "Still owing"}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="forecast-subsection">
        <div className="forecast-two-up-grid">
          <div className="forecast-status-card">
            <div className="forecast-status-heading">
              <AlertTriangle size={18} />
              <span>Stress Test</span>
            </div>
            <div className="forecast-list">
              {forecast.risks.map(risk => (
                <div key={risk.name} className="forecast-list-row">
                  <span>{risk.name}</span>
                  <span
                    className={`forecast-tag ${risk.impact === "high" ? "forecast-tag-critical" : risk.impact === "medium" ? "forecast-tag-warning" : "forecast-tag-positive"}`}
                  >
                    {risk.impact.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="forecast-status-card">
            <div className="forecast-status-heading">
              <span>Recommended Action</span>
            </div>
            <p className="forecast-card-note">{forecast.recommendation.text}</p>
            {forecast.recommendation.action && (
              <button className="forecast-button">{forecast.recommendation.action}</button>
            )}
          </div>
        </div>
      </div>

      <div className="forecast-subsection forecast-simulator-section">
        <div className="forecast-simulator-header">
          <div>
            <h4>What-If Decision Simulator</h4>
            <p>See how savings, expense, or income changes alter your runway.</p>
          </div>
        </div>

        <div className="forecast-simulator-form">
          <div className="forecast-field">
            <label>Decision Type</label>
            <select
              value={decisionType}
              onChange={e => {
                setDecisionType(e.target.value);
                setSelectedDecision(null);
              }}
              className="forecast-input"
            >
              <option value="savings_increase">Increase Savings (monthly)</option>
              <option value="expense">One-time Expense</option>
              <option value="income_change">Income Increase (monthly)</option>
            </select>
          </div>

          <div className="forecast-field">
            <label>Amount: ₹{decisionAmount.toLocaleString()}</label>
            <input
              type="range"
              min="1000"
              max="50000"
              step="1000"
              value={decisionAmount}
              onChange={e => setDecisionAmount(Number(e.target.value))}
              className="forecast-range"
            />
          </div>

          <button
            onClick={() =>
              setSelectedDecision({
                type: decisionType,
                amount: decisionAmount,
                duration: decisionType === "expense" ? "one_time" : "recurring"
              })
            }
            className="forecast-button"
          >
            Simulate Decision
          </button>
        </div>

        {decisionImpact && (
          <div className="forecast-simulator-result">
            <div className="forecast-simulator-title">
              <strong>Impact if you choose this decision</strong>
            </div>
            <div className="premium-report-grid premium-report-grid-3">
              <div className="forecast-detail-card">
                <span>Runway</span>
                <strong>
                  {decisionImpact.currentState.runway} → {decisionImpact.projectedState.runway}{" "}
                  months
                </strong>
                <small>
                  {decisionImpact.impact.runwayDelta > 0 ? "+" : ""}
                  {decisionImpact.impact.runwayDelta} months change
                </small>
              </div>
              <div className="forecast-detail-card">
                <span>Health</span>
                <strong>
                  {decisionImpact.currentState.health} → {decisionImpact.projectedState.health}
                </strong>
                <small>Immediate health score impact</small>
              </div>
              <div className="forecast-detail-card forecast-detail-card-highlight">
                <span>Future Score</span>
                <strong>
                  {decisionImpact.currentState.futureScore} →{" "}
                  {decisionImpact.projectedState.futureScore}
                </strong>
                <small>
                  {decisionImpact.projectedState.futureConfidence !== null
                    ? `Confidence ${decisionImpact.projectedState.futureConfidence}%`
                    : decisionImpact.projectedState.mcProjection
                      ? `Confidence ${decisionImpact.projectedState.mcProjection.confidence}%`
                      : "Projected 90-day score"}
                </small>
              </div>
            </div>
          </div>
        )}

        {decisionImpact && (
          <div className="forecast-card-note forecast-simulator-recommendation">
            {decisionImpact.impact.recommendation}
          </div>
        )}
      </div>
    </div>
  );
}

ScenarioForecast.propTypes = {
  profile: PropTypes.object.isRequired,
  assessmentResult: PropTypes.shape({
    healthScore: PropTypes.number,
    futureRiskScore: PropTypes.number
  }).isRequired
};
