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
    <section className="result-card strategic-metrics-card">
      <div className="result-heading">
        <Brain size={20} />
        <h2>Decision & Readiness Intelligence</h2>
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

      <style>{`
        .strategic-metrics-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 16px;
        }

        .metric-column {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px;
        }

        .metric-column-title {
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 14px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }

        /* Decision Quality Index */
        .dqi-score-display {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 14px;
        }

        .dqi-score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dqi-score-number {
          font-size: 28px;
          font-weight: 700;
          color: white;
        }

        .dqi-score-max {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }

        .dqi-info {
          flex: 1;
        }

        .dqi-band {
          font-weight: 700;
          color: #667eea;
          display: block;
          font-size: 15px;
          margin-bottom: 4px;
        }

        .dqi-meaning {
          font-size: 12px;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }

        .dqi-breakdown {
          margin: 14px 0;
          padding: 12px;
          background: #f8fafc;
          border-radius: 6px;
        }

        .breakdown-item {
          display: grid;
          grid-template-columns: 80px 1fr 40px;
          gap: 10px;
          align-items: center;
          margin-bottom: 10px;
          font-size: 12px;
        }

        .breakdown-item:last-child {
          margin-bottom: 0;
        }

        .breakdown-label {
          font-weight: 600;
          color: #475569;
        }

        .breakdown-bar {
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
        }

        .breakdown-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .breakdown-fill.awareness {
          background: #06b6d4;
        }

        .breakdown-fill.behaviour {
          background: #f59e0b;
        }

        .breakdown-fill.stability {
          background: #10b981;
        }

        .breakdown-fill.emergency {
          background: #10b981;
        }

        .breakdown-fill.income {
          background: #3b82f6;
        }

        .breakdown-fill.debt {
          background: #ef4444;
        }

        .breakdown-value {
          text-align: right;
          color: #64748b;
          font-weight: 600;
        }

        .dqi-narrative {
          font-size: 12px;
          color: #475569;
          line-height: 1.5;
          margin: 12px 0 0 0;
          padding: 10px;
          background: rgba(102, 126, 234, 0.05);
          border-left: 2px solid #667eea;
          border-radius: 3px;
        }

        .dqi-constraint {
          display: flex;
          gap: 10px;
          margin-top: 12px;
          padding: 10px;
          background: #fef3c7;
          border-left: 2px solid #f59e0b;
          border-radius: 4px;
          font-size: 12px;
          color: #78350f;
        }

        .dqi-constraint strong {
          display: block;
        }

        .dqi-constraint p {
          margin: 4px 0 0 0;
        }

        /* Financial Readiness */
        .readiness-score-display {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 14px;
        }

        .readiness-score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .readiness-score-number {
          font-size: 28px;
          font-weight: 700;
          color: white;
        }

        .readiness-score-max {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }

        .readiness-info {
          flex: 1;
        }

        .readiness-band {
          font-weight: 700;
          color: #10b981;
          display: block;
          font-size: 15px;
          margin-bottom: 4px;
        }

        .readiness-meaning {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .readiness-breakdown {
          margin: 14px 0;
          padding: 12px;
          background: #f8fafc;
          border-radius: 6px;
        }

        .readiness-recommendation {
          margin-top: 12px;
          padding: 10px;
          background: #ecfdf5;
          border-left: 2px solid #10b981;
          border-radius: 4px;
          font-size: 12px;
          color: #065f46;
        }

        .readiness-recommendation strong {
          display: block;
          margin-bottom: 4px;
        }

        .readiness-recommendation p {
          margin: 0 0 6px 0;
        }

        .rec-impact {
          font-size: 11px;
          color: #10b981;
          font-weight: 700;
        }

        .readiness-narrative {
          font-size: 12px;
          color: #475569;
          line-height: 1.5;
          margin: 0;
          padding: 10px;
          background: rgba(16, 185, 129, 0.05);
          border-left: 2px solid #10b981;
          border-radius: 3px;
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}

export default StrategicMetricsCard;
