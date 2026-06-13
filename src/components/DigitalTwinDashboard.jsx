import React, { useState, useMemo } from "react";
import "./DigitalTwinDashboard.css";

/**
 * Digital Twin Dashboard
 *
 * Main interface for interacting with the user's financial digital twin.
 * Displays:
 * - Current twin state and confidence
 * - Multiple realistic futures with probability distributions
 * - Decision simulator for testing scenarios
 * - Behavior evolution trajectory
 * - Stress testing capabilities
 */
export function DigitalTwinDashboard({ twin, assessment }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [simulatingDecision, setSimulatingDecision] = useState(null);

  if (!twin) {
    return (
      <div className="digital-twin-dashboard empty">
        <div className="empty-state">
          <h3>🌍 Digital Twin Not Yet Generated</h3>
          <p>Complete an assessment to generate your financial digital twin.</p>
          <p>
            Once created, you can simulate decisions, explore futures, and stress-test your
            financial life.
          </p>
        </div>
      </div>
    );
  }

  const stats = twin.futureStatistics;
  const currentState = twin.currentState;

  return (
    <div className="digital-twin-dashboard">
      {/* Header */}
      <div className="twin-header">
        <div className="twin-title">
          <h2>🌍 Your Financial Digital Twin</h2>
          <p className="twin-subtitle">A complete simulation model of your financial life</p>
        </div>
        <div className="twin-meta">
          <div className="meta-item">
            <span className="label">Confidence</span>
            <span className="value">{Math.round(twin.metadata.confidence * 100)}%</span>
          </div>
          <div className="meta-item">
            <span className="label">Data Points</span>
            <span className="value">{twin.metadata.dataPoints}</span>
          </div>
          <div className="meta-item">
            <span className="label">Status</span>
            <span className="value ready">Ready</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="twin-tabs">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={`tab ${activeTab === "futures" ? "active" : ""}`}
          onClick={() => setActiveTab("futures")}
        >
          🔮 Multiple Futures
        </button>
        <button
          className={`tab ${activeTab === "simulator" ? "active" : ""}`}
          onClick={() => setActiveTab("simulator")}
        >
          ✈️ Decision Simulator
        </button>
        <button
          className={`tab ${activeTab === "behavior" ? "active" : ""}`}
          onClick={() => setActiveTab("behavior")}
        >
          📈 Behavior Evolution
        </button>
        <button
          className={`tab ${activeTab === "stress" ? "active" : ""}`}
          onClick={() => setActiveTab("stress")}
        >
          ⚡ Stress Test
        </button>
      </div>

      {/* Tab Content */}
      <div className="twin-content">
        {activeTab === "overview" && (
          <OverviewTab twin={twin} stats={stats} currentState={currentState} />
        )}
        {activeTab === "futures" && <FuturesTab twin={twin} stats={stats} />}
        {activeTab === "simulator" && (
          <SimulatorTab twin={twin} onSimulate={setSimulatingDecision} />
        )}
        {activeTab === "behavior" && <BehaviorTab behaviorEngine={twin.behaviorEvolution} />}
        {activeTab === "stress" && <StressTestTab twin={twin} />}
      </div>
    </div>
  );
}

function OverviewTab({ twin, stats, currentState }) {
  if (!stats) {
    return <div className="tab-content empty">Loading simulation...</div>;
  }

  return (
    <div className="tab-content overview">
      <div className="overview-grid">
        {/* Current State */}
        <section className="overview-section">
          <h3>💰 Current Financial State</h3>
          <div className="state-grid">
            <div className="state-item">
              <label>Monthly Income</label>
              <div className="value">
                ₹{Math.round(currentState.median.income).toLocaleString()}
              </div>
            </div>
            <div className="state-item">
              <label>Monthly Expenses</label>
              <div className="value">
                ₹{Math.round(currentState.median.expenses).toLocaleString()}
              </div>
            </div>
            <div className="state-item">
              <label>Total Savings</label>
              <div className="value">
                ₹{Math.round(currentState.median.savings).toLocaleString()}
              </div>
            </div>
            <div className="state-item">
              <label>Current Runway</label>
              <div className="value">{currentState.median.runway.toFixed(1)} months</div>
            </div>
            <div className="state-item">
              <label>Health Score</label>
              <div className="value">{Math.round(currentState.median.healthScore)}/100</div>
            </div>
            <div className="state-item">
              <label>Savings Discipline</label>
              <div className="value">
                {Math.round(currentState.behavior.savingsDiscipline * 100)}%
              </div>
            </div>
          </div>
        </section>

        {/* Future Probabilities */}
        <section className="overview-section">
          <h3>🔮 60-Month Future Outlook</h3>
          <div className="future-stats">
            <div className="stat-card">
              <h4>Median Runway</h4>
              <div className="stat-value">
                {stats.percentiles.finalRunway.p50.toFixed(1)} months
              </div>
              <p className="stat-desc">50% of futures exceed this</p>
            </div>
            <div className="stat-card">
              <h4>Pessimistic (5th %ile)</h4>
              <div className="stat-value warning">
                {stats.percentiles.finalRunway.p5.toFixed(1)} months
              </div>
              <p className="stat-desc">In worst 5% of scenarios</p>
            </div>
            <div className="stat-card">
              <h4>Optimistic (95th %ile)</h4>
              <div className="stat-value positive">
                {stats.percentiles.finalRunway.p95.toFixed(1)} months
              </div>
              <p className="stat-desc">In best 5% of scenarios</p>
            </div>
            <div className="stat-card">
              <h4>Survival Rate</h4>
              <div className="stat-value">{stats.survivalRate.toFixed(1)}%</div>
              <p className="stat-desc">Of 1,000 simulated futures</p>
            </div>
          </div>
        </section>

        {/* Insight */}
        <section className="overview-section full-width">
          <h3>💡 Twin Insight</h3>
          <div className="insight-box">
            {stats.survivalRate > 90 ? (
              <p>
                Your digital twin is <strong>highly resilient</strong>. Even in pessimistic
                scenarios, you maintain {stats.percentiles.finalRunway.p5.toFixed(1)} months of
                runway. Your financial behavior and savings discipline are key strengths.
              </p>
            ) : stats.survivalRate > 70 ? (
              <p>
                Your digital twin shows <strong>moderate resilience</strong>. Most futures are
                positive, but vulnerability to large shocks exists. Focus on: building emergency
                buffer, reducing fixed expenses, or diversifying income.
              </p>
            ) : (
              <p>
                Your digital twin reveals <strong>financial fragility</strong>. In many scenarios,
                your runway depletes within 5 years. This is not inevitable—interventions like
                increasing income or reducing expenses can dramatically improve outcomes.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function FuturesTab({ twin, stats }) {
  if (!stats || !stats.timeSeriesPercentiles) {
    return <div className="tab-content empty">Computing 1,000 futures...</div>;
  }

  const data = stats.timeSeriesPercentiles;

  return (
    <div className="tab-content futures">
      <section>
        <h3>🔮 Multiple Realistic Futures (Monte Carlo, 1,000 iterations)</h3>
        <p className="section-desc">
          Each line represents a different possible future based on different economic conditions,
          personal decisions, and random shocks.
        </p>

        {/* ASCII Chart (for demo) */}
        <div className="futures-chart">
          <div className="chart-container">
            <RunwayChart data={data} />
          </div>
        </div>

        {/* Statistics Table */}
        <div className="futures-table">
          <table>
            <thead>
              <tr>
                <th>Timeframe</th>
                <th>Pessimistic (5%)</th>
                <th>25th %ile</th>
                <th>Median (50%)</th>
                <th>75th %ile</th>
                <th>Optimistic (95%)</th>
              </tr>
            </thead>
            <tbody>
              {[6, 12, 24, 36, 48, 60].map(month => {
                const point = data[month] || {};
                return (
                  <tr key={month}>
                    <td>
                      <strong>{month} months</strong>
                    </td>
                    <td>{point.p5?.toFixed(1)} mo</td>
                    <td>{point.p25?.toFixed(1)} mo</td>
                    <td className="highlight">{point.p50?.toFixed(1)} mo</td>
                    <td>{point.p75?.toFixed(1)} mo</td>
                    <td>{point.p95?.toFixed(1)} mo</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RunwayChart({ data }) {
  // Simplified ASCII chart showing runway over time
  const maxRunway = Math.max(...data.map(d => d.p95 || 0));
  const rows = 10;
  const cols = Math.min(60, data.length);

  return (
    <div className="ascii-chart">
      <pre>
        {Array.from({ length: rows }, (_, row) => {
          const threshold = (maxRunway / rows) * (rows - row);
          let line = "";
          for (let col = 0; col < cols; col++) {
            const point = data[col];
            if (!point) {
              continue;
            }

            const p95 = point.p95 || 0;
            const p50 = point.p50 || 0;
            const p5 = point.p5 || 0;

            if (p95 >= threshold) {
              line += "▓"; // Top band
            } else if (p50 >= threshold) {
              line += "█"; // Median
            } else if (p5 >= threshold) {
              line += "▒"; // Lower band
            } else {
              line += " ";
            }
          }
          return line + "\n";
        })}
      </pre>
      <div className="chart-legend">
        <span>
          <strong>▓</strong> = 95th percentile (optimistic)
        </span>
        <span>
          <strong>█</strong> = 50th percentile (median)
        </span>
        <span>
          <strong>▒</strong> = 5th percentile (pessimistic)
        </span>
      </div>
    </div>
  );
}

function SimulatorTab({ twin, onSimulate }) {
  const [selectedDecision, setSelectedDecision] = useState(null);

  const commonDecisions = [
    {
      id: "save_5k",
      name: "💰 Increase Savings by ₹5,000/month",
      type: "saving",
      monthlyImpact: 5000,
      confidence: 0.9
    },
    {
      id: "save_10k",
      name: "💰 Increase Savings by ₹10,000/month",
      type: "saving",
      monthlyImpact: 10000,
      confidence: 0.7
    },
    {
      id: "side_income",
      name: "📈 Start Side Income (₹8,000/month)",
      type: "income",
      monthlyImpact: 8000,
      confidence: 0.6
    },
    {
      id: "reduce_spend_10",
      name: "🎯 Reduce Spending by 10%",
      type: "spending_control",
      monthlyImpact: twin.currentState.median.expenses * 0.1,
      confidence: 0.5
    },
    {
      id: "salary_bump",
      name: "🚀 Get ₹15,000 Salary Increase",
      type: "income",
      monthlyImpact: 15000,
      confidence: 0.4
    },
    {
      id: "medical_emergency",
      name: "⚠️ Face ₹50,000 Medical Emergency",
      type: "emergency",
      oneTimeImpact: -50000,
      confidence: 0.3
    }
  ];

  const handleSimulate = decision => {
    if (twin.methods?.simulateDecision) {
      const result = twin.methods.simulateDecision(decision);
      setSelectedDecision({
        ...decision,
        result
      });
    }
  };

  return (
    <div className="tab-content simulator">
      <section>
        <h3>✈️ Decision Simulator - Flight Simulator for Your Financial Life</h3>
        <p className="section-desc">
          Test major financial decisions before making them. See how each choice affects your
          runway, health score, and long-term outcomes.
        </p>

        <div className="simulator-grid">
          {commonDecisions.map(decision => (
            <div
              key={decision.id}
              className={`decision-card ${selectedDecision?.id === decision.id ? "selected" : ""}`}
              onClick={() => handleSimulate(decision)}
            >
              <h4>{decision.name}</h4>
              <div className="decision-impact">
                {decision.monthlyImpact > 0 && (
                  <span className="positive">
                    +₹{Math.round(decision.monthlyImpact).toLocaleString()}/mo
                  </span>
                )}
                {decision.oneTimeImpact && decision.oneTimeImpact < 0 && (
                  <span className="negative">
                    -₹{Math.round(-decision.oneTimeImpact).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="confidence">Confidence: {Math.round(decision.confidence * 100)}%</p>
            </div>
          ))}
        </div>

        {selectedDecision && selectedDecision.result && (
          <div className="simulator-result">
            <h4>📊 Simulation Result for: {selectedDecision.name}</h4>
            <div className="result-grid">
              <div className="result-item">
                <label>New Runway (12 months)</label>
                <div
                  className={`value ${selectedDecision.result.projectedOutcome.runwayAfter > 6 ? "positive" : "warning"}`}
                >
                  {selectedDecision.result.projectedOutcome.runwayAfter.toFixed(1)} months
                </div>
              </div>
              <div className="result-item">
                <label>Impact on Runway</label>
                <div
                  className={`value ${selectedDecision.result.projectedOutcome.impactScore > 0 ? "positive" : "negative"}`}
                >
                  {selectedDecision.result.projectedOutcome.impactScore > 0 ? "+" : ""}
                  {selectedDecision.result.projectedOutcome.impactScore.toFixed(1)}%
                </div>
              </div>
              <div className="result-item">
                <label>Total Impact (12 mo)</label>
                <div
                  className={`value ${selectedDecision.monthlyImpact > 0 ? "positive" : "negative"}`}
                >
                  ₹{Math.round(selectedDecision.monthlyImpact * 12).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="result-insight">
              {selectedDecision.result.projectedOutcome.impactScore > 20 && (
                <p>
                  ✅ <strong>High Impact</strong>: This decision significantly improves your
                  financial resilience.
                </p>
              )}
              {selectedDecision.result.projectedOutcome.impactScore > 0 &&
                selectedDecision.result.projectedOutcome.impactScore <= 20 && (
                  <p>
                    👍 <strong>Positive Impact</strong>: This decision modestly improves your
                    position.
                  </p>
                )}
              {selectedDecision.result.projectedOutcome.impactScore === 0 && (
                <p>
                  ➡️ <strong>Neutral</strong>: This decision doesn't materially change your runway.
                </p>
              )}
              {selectedDecision.result.projectedOutcome.impactScore < 0 && (
                <p>
                  ⚠️ <strong>Negative Impact</strong>: This decision reduces your runway.
                  Reconsider.
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function BehaviorTab({ behaviorEngine }) {
  const behaviorProjection = behaviorEngine.projectBehaviorEvolution(12);

  return (
    <div className="tab-content behavior">
      <section>
        <h3>📈 Behavior Evolution Over 12 Months</h3>
        <p className="section-desc">
          Your financial behavior naturally improves over time through awareness and positive
          feedback.
        </p>

        <div className="behavior-grid">
          {behaviorProjection.map((point, idx) => (
            <div key={idx} className="behavior-month">
              <label>Month {point.month}</label>
              <div className="meter">
                <div className="bar" style={{ width: `${point.discipline * 100}%` }}></div>
              </div>
              <p className="label-small">Discipline: {Math.round(point.discipline * 100)}%</p>
              <div className="meter">
                <div
                  className="bar success"
                  style={{ width: `${point.impulseControl * 100}%` }}
                ></div>
              </div>
              <p className="label-small">
                Impulse Control: {Math.round(point.impulseControl * 100)}%
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StressTestTab({ twin }) {
  const stressScenarios = [
    {
      type: "income_loss",
      magnitude: twin.currentState.median.income * 0.25,
      label: "25% Income Loss"
    },
    {
      type: "income_loss",
      magnitude: twin.currentState.median.income * 0.5,
      label: "50% Income Loss (Job Loss)"
    },
    {
      type: "expense_spike",
      magnitude: twin.currentState.median.expenses * 0.5,
      label: "Medical Emergency (₹50K)"
    },
    { type: "emergency", magnitude: 100000, label: "Major Life Event (₹100K)" }
  ];

  const results = twin.methods?.stressTest(stressScenarios) || [];

  return (
    <div className="tab-content stress">
      <section>
        <h3>⚡ Stress Testing Your Twin</h3>
        <p className="section-desc">
          How would your financial life weather major shocks? We stress-test your twin against
          realistic catastrophic scenarios.
        </p>

        <div className="stress-results">
          {results.length > 0 ? (
            results.map((result, idx) => (
              <div
                key={idx}
                className={`stress-scenario ${result.survived ? "survived" : "failed"}`}
              >
                <h4>{stressScenarios[idx].label}</h4>
                <div className="result-detail">
                  <span className="label">Status</span>
                  <span className={`value ${result.survived ? "positive" : "negative"}`}>
                    {result.survived ? "✅ Survived" : "❌ Depleted"}
                  </span>
                </div>
                <div className="result-detail">
                  <span className="label">Remaining Savings</span>
                  <span className="value">
                    ₹{Math.round(result.remainingSavings).toLocaleString()}
                  </span>
                </div>
                <div className="result-detail">
                  <span className="label">Runway After Shock</span>
                  <span
                    className={`value ${result.runway > 3 ? "positive" : result.runway > 0 ? "warning" : "negative"}`}
                  >
                    {result.runway.toFixed(1)} months
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p>Unable to stress test at this time.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default DigitalTwinDashboard;
