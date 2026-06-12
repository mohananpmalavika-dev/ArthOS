import React from "react";
import { Brain, AlertCircle } from "lucide-react";
import { calculateDecisionQualityIndex, getDecisionQualityConstraint } from "../engines/decisionQualityEngine.js";
import { calculateFinancialReadiness, getReadinessRecommendations } from "../engines/readinessEngine.js";

/**
 * Decision Quality Index + Financial Readiness Display
 * Shows two critical metrics separate from health score
 */
export function StrategicMetricsCard({ result, profile, behaviour, stability }) {
  const dqi = calculateDecisionQualityIndex(result || {});
  const constraint = getDecisionQualityConstraint(result || {});
  const readiness = calculateFinancialReadiness(profile, behaviour, stability || {});
  const recommendations = getReadinessRecommendations(readiness.readiness, readiness.componentBreakdown || {});


  return (
    <section className="summary-card premium-report-block strategic-metrics-card">
      <div className="premium-report-block-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Brain size={20} />
          <h2 className="premium-report-block-title">Decision & Readiness Intelligence</h2>
        </div>
      </div>

      <div className="metrics-grid">
        {/* Decision Quality Index */}
        <div className="metric-column dqi-column">
          <h3 className="metric-column-title">Decision Quality Index</h3>
          <div className="dqi-score-display">
            <div className="dqi-score-circle">
              <span className="dqi-score-number">{dqi.index}</span>
              <span className="dqi-score-max">/100</span>
            </div>
            <div className="dqi-info">
              <span className="dqi-band">{dqi.band}</span>
              <p className="dqi-meaning">{dqi.whatItMeans}</p>
            </div>
          </div>

          <div className="dqi-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">Awareness</span>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill awareness"
                  style={{ width: `${dqi.componentBreakdown.awareness}%` }}
                />
              </div>
              <span className="breakdown-value">{dqi.componentBreakdown.awareness}%</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Behaviour</span>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill behaviour"
                  style={{ width: `${dqi.componentBreakdown.behaviour}%` }}
                />
              </div>
              <span className="breakdown-value">{dqi.componentBreakdown.behaviour}%</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Stability</span>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill stability"
                  style={{ width: `${dqi.componentBreakdown.stability}%` }}
                />
              </div>
              <span className="breakdown-value">{dqi.componentBreakdown.stability}%</span>
            </div>
          </div>

          <p className="dqi-narrative">{dqi.narrative}</p>

          {constraint && (
            <div className="dqi-constraint">
              <AlertCircle size={16} />
              <div>
                <strong>{constraint.component} is your constraint</strong>
                <p>{constraint.recommendation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Financial Readiness */}
        <div className="metric-column readiness-column">
          <h3 className="metric-column-title">Financial Readiness</h3>
          <div className="readiness-score-display">
            <div className="readiness-score-circle">
              <span className="readiness-score-number">{readiness.readiness}</span>
              <span className="readiness-score-max">/100</span>
            </div>
            <div className="readiness-info">
              <span className="readiness-band">{readiness.band}</span>
              <p className="readiness-meaning">Shock resilience & preparedness level</p>
            </div>
          </div>

          <div className="readiness-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">Emergency Fund</span>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill emergency"
                  style={{ width: `${readiness.componentBreakdown?.emergencyFund || 0}%` }}
                />
              </div>
              <span className="breakdown-value">{readiness.componentBreakdown?.emergencyFund || 0}%</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Income Stability</span>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill income"
                  style={{ width: `${readiness.componentBreakdown?.incomeStability || 0}%` }}
                />
              </div>
              <span className="breakdown-value">{readiness.componentBreakdown?.incomeStability || 0}%</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Debt Resilience</span>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill debt"
                  style={{ width: `${readiness.componentBreakdown?.debtResilience || 0}%` }}
                />
              </div>
              <span className="breakdown-value">{readiness.componentBreakdown?.debtResilience || 0}%</span>
            </div>
          </div>

          <p className="readiness-narrative">{readiness.narrative}</p>

          {/* Top Recommendation */}
          {recommendations.length > 0 && (
            <div className="readiness-recommendation">
              <strong>{recommendations[0].action}</strong>
              <p>{recommendations[0].details}</p>
              <span className="rec-impact">{recommendations[0].impact}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default StrategicMetricsCard;
