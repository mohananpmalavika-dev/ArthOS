/**
 * Prediction Engine Dashboard Component
 *
 * Visualizes:
 * - 30/90/180 day forecasts with confidence intervals
 * - Scenario simulations and "what if" testing
 * - Risk forecasts with alerts
 * - Opportunity forecasts with action items
 * - Forecast accuracy and model performance
 */

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { AlertTriangle, TrendingUp, Target, Zap, CheckCircle } from "lucide-react";

const PredictionEngineDashboard = ({ userId }) => {
  const [forecasts, setForecasts] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [risks, setRisks] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("forecasts");
  const [scenarioForm, setScenarioForm] = useState({
    scenarioName: "",
    modifiedParameter: "monthly_spending",
    parameterChangeType: "absolute",
    parameterChangeValue: 0,
    comparisonPeriodDays: 30
  });

  // Load forecast data
  useEffect(() => {
    loadPredictionData();
  }, [userId]);

  const loadPredictionData = async () => {
    setLoading(true);
    try {
      const [forecastRes, scenarioRes, riskRes, oppRes] = await Promise.all([
        fetch(`/api/prediction/forecasts?userId=${userId}`),
        fetch(`/api/prediction/scenarios?userId=${userId}`),
        fetch(`/api/prediction/risks?userId=${userId}`),
        fetch(`/api/prediction/opportunities?userId=${userId}`)
      ]);

      if (forecastRes.ok) {
        setForecasts((await forecastRes.json()).forecasts);
      }
      if (scenarioRes.ok) {
        setScenarios((await scenarioRes.json()).scenarios);
      }
      if (riskRes.ok) {
        setRisks((await riskRes.json()).risks);
      }
      if (oppRes.ok) {
        setOpportunities((await oppRes.json()).opportunities);
      }
    } catch (error) {
      console.error("Error loading prediction data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewForecasts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/prediction/forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      if (res.ok) {
        await loadPredictionData();
      }
    } catch (error) {
      console.error("Error generating forecasts:", error);
    } finally {
      setLoading(false);
    }
  };

  const createScenario = async e => {
    e.preventDefault();
    try {
      const res = await fetch("/api/prediction/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...scenarioForm })
      });

      if (res.ok) {
        setScenarioForm({
          scenarioName: "",
          modifiedParameter: "monthly_spending",
          parameterChangeType: "absolute",
          parameterChangeValue: 0,
          comparisonPeriodDays: 30
        });
        await loadPredictionData();
      }
    } catch (error) {
      console.error("Error creating scenario:", error);
    }
  };

  const acknowledgeRisk = async riskId => {
    try {
      await fetch(`/api/prediction/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, riskId })
      });
      await loadPredictionData();
    } catch (error) {
      console.error("Error acknowledging risk:", error);
    }
  };

  const recordOpportunity = async opportunityId => {
    try {
      await fetch(`/api/prediction/opportunities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, opportunityId })
      });
      await loadPredictionData();
    } catch (error) {
      console.error("Error recording opportunity:", error);
    }
  };

  if (loading) {
    return (
      <div className="prediction-engine-loading flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prediction-engine-dashboard bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-xl">
      <div className="prediction-engine-inner max-w-7xl mx-auto">
        {/* Header */}
        <div className="prediction-engine-header flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Prediction Engine</h1>
            <p className="text-slate-600">
              30, 90 & 180-day financial forecasts with scenario simulation
            </p>
          </div>
          <button
            onClick={generateNewForecasts}
            className="prediction-primary-btn px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Generate Forecasts
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="prediction-tabs flex gap-4 mb-8 border-b border-slate-300">
          {["forecasts", "scenarios", "risks", "opportunities"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* FORECASTS TAB */}
        {activeTab === "forecasts" && (
          <div className="space-y-8">
            {forecasts.length === 0 ? (
              <div className="prediction-empty-state bg-white p-8 rounded-lg text-center">
                <p className="text-slate-600 mb-4">No forecasts generated yet</p>
                <button
                  onClick={generateNewForecasts}
                  className="prediction-primary-btn px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Generate Your First Forecast
                </button>
              </div>
            ) : (
              forecasts.map(forecast => (
                <div key={forecast.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {forecast.forecast_period_days}-Day Forecast
                      </h3>
                      <p className="text-slate-600">
                        Generated: {new Date(forecast.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">
                        {forecast.predicted_health_score.toFixed(1)}
                      </div>
                      <p className="text-slate-600">Health Score</p>
                      <p className="text-sm text-slate-500">
                        Confidence: {forecast.confidence_level.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Health Score Forecast */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-4">Health Score Trend</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={forecast.forecast_data_points || []}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="daysAhead" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#f8fafc",
                              border: "1px solid #cbd5e1"
                            }}
                            cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                          />
                          <Area
                            type="monotone"
                            dataKey="predictedValue"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#colorScore)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* BAS Components */}
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-4">BAS Components</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={[
                            {
                              name: "Predicted",
                              behaviour: forecast.predicted_behaviour_score,
                              awareness: forecast.predicted_awareness_score,
                              stability: forecast.predicted_stability_score
                            }
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#f8fafc",
                              border: "1px solid #cbd5e1"
                            }}
                          />
                          <Legend />
                          <Bar dataKey="behaviour" fill="#10b981" />
                          <Bar dataKey="awareness" fill="#f59e0b" />
                          <Bar dataKey="stability" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded">
                      <p className="text-sm text-slate-600 mb-1">Survival Window</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {forecast.predicted_survival_days} days
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        ±
                        {Math.round(
                          (forecast.predicted_survival_days_max -
                            forecast.predicted_survival_days_min) /
                            2
                        )}{" "}
                        days
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded">
                      <p className="text-sm text-slate-600 mb-1">Behaviour Score</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {forecast.predicted_behaviour_score.toFixed(1)}/40
                      </p>
                      <p
                        className={`text-xs font-semibold mt-1 ${
                          forecast.behaviour_trend === "improving"
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {forecast.behaviour_trend === "improving" ? "↑" : "↓"}{" "}
                        {forecast.behaviour_trend}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded">
                      <p className="text-sm text-slate-600 mb-1">Awareness Score</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {forecast.predicted_awareness_score.toFixed(1)}/30
                      </p>
                      <p
                        className={`text-xs font-semibold mt-1 ${
                          forecast.awareness_trend === "improving"
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {forecast.awareness_trend === "improving" ? "↑" : "↓"}{" "}
                        {forecast.awareness_trend}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded">
                      <p className="text-sm text-slate-600 mb-1">Stability Score</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {forecast.predicted_stability_score.toFixed(1)}/30
                      </p>
                      <p
                        className={`text-xs font-semibold mt-1 ${
                          forecast.stability_trend === "improving"
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {forecast.stability_trend === "improving" ? "↑" : "↓"}{" "}
                        {forecast.stability_trend}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SCENARIOS TAB */}
        {activeTab === "scenarios" && (
          <div className="space-y-8">
            {/* Create Scenario Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Create Scenario</h3>
              <form onSubmit={createScenario} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Scenario name (e.g., 'Save ₹5,000/month')"
                    value={scenarioForm.scenarioName}
                    onChange={e =>
                      setScenarioForm({ ...scenarioForm, scenarioName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />

                  <select
                    value={scenarioForm.modifiedParameter}
                    onChange={e =>
                      setScenarioForm({ ...scenarioForm, modifiedParameter: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly_spending">Reduce monthly spending</option>
                    <option value="monthly_savings">Increase monthly savings</option>
                    <option value="debt_payoff_rate">Accelerate debt payoff</option>
                  </select>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Amount"
                      value={scenarioForm.parameterChangeValue}
                      onChange={e =>
                        setScenarioForm({
                          ...scenarioForm,
                          parameterChangeValue: parseFloat(e.target.value)
                        })
                      }
                      className="flex-1 px-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <select
                      value={scenarioForm.parameterChangeType}
                      onChange={e =>
                        setScenarioForm({ ...scenarioForm, parameterChangeType: e.target.value })
                      }
                      className="px-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="absolute">₹</option>
                      <option value="percentage">%</option>
                    </select>
                  </div>

                  <select
                    value={scenarioForm.comparisonPeriodDays}
                    onChange={e =>
                      setScenarioForm({
                        ...scenarioForm,
                        comparisonPeriodDays: parseInt(e.target.value)
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
                >
                  Simulate Scenario
                </button>
              </form>
            </div>

            {/* Existing Scenarios */}
            {scenarios.length === 0 ? (
              <div className="bg-white p-8 rounded-lg text-center text-slate-600">
                No scenarios created yet. Create one to test your financial decisions!
              </div>
            ) : (
              scenarios.map(scenario => (
                <div key={scenario.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-slate-900">{scenario.scenario_name}</h4>
                      <p className="text-slate-600 text-sm">{scenario.scenario_description}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        scenario.impact_magnitude === "high"
                          ? "bg-red-100 text-red-800"
                          : scenario.impact_magnitude === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {scenario.impact_magnitude.toUpperCase()} Impact
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded">
                      <p className="text-sm text-slate-600 mb-2">Health Score Impact</p>
                      <p className="text-2xl font-bold">
                        {scenario.health_score_delta > 0 ? "+" : ""}
                        {scenario.health_score_delta.toFixed(1)}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {scenario.baseline_health_score_at_end.toFixed(1)} →{" "}
                        {scenario.scenario_health_score_at_end.toFixed(1)}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded">
                      <p className="text-sm text-slate-600 mb-2">Survival Window Impact</p>
                      <p className="text-2xl font-bold">
                        {scenario.survival_days_delta > 0 ? "+" : ""}
                        {scenario.survival_days_delta} days
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {scenario.baseline_survival_days_at_end} →{" "}
                        {scenario.scenario_survival_days_at_end} days
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded">
                      <p className="text-sm text-slate-600 mb-2">Feasibility</p>
                      <p className="text-2xl font-bold">{scenario.feasibility_score.toFixed(0)}%</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {scenario.effort_required} effort required
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* RISKS TAB */}
        {activeTab === "risks" && (
          <div className="space-y-4">
            {risks.length === 0 ? (
              <div className="bg-green-50 border border-green-200 p-8 rounded-lg text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-slate-900 font-semibold">No critical risks identified</p>
                <p className="text-slate-600 text-sm">Your financial trajectory looks good!</p>
              </div>
            ) : (
              risks.map(risk => (
                <div
                  key={risk.id}
                  className={`p-6 rounded-lg border-l-4 ${
                    risk.risk_category === "critical"
                      ? "bg-red-50 border-red-500"
                      : risk.risk_category === "high"
                        ? "bg-orange-50 border-orange-500"
                        : "bg-yellow-50 border-yellow-500"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <AlertTriangle
                      className={`w-6 h-6 flex-shrink-0 ${
                        risk.risk_category === "critical" ? "text-red-600" : "text-orange-600"
                      }`}
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 mb-2">{risk.risk_description}</h4>
                      <p className="text-slate-700 text-sm mb-3">{risk.risk_description}</p>
                      <div className="flex gap-4 flex-wrap text-sm">
                        <span className="text-slate-600">
                          <span className="font-semibold">Onset:</span>{" "}
                          {new Date(risk.predicted_onset_date).toLocaleDateString()}
                        </span>
                        <span className="text-slate-600">
                          <span className="font-semibold">Days until:</span> {risk.days_until_risk}
                        </span>
                        <span className="text-slate-600">
                          <span className="font-semibold">Action:</span> {risk.suggested_mitigation}
                        </span>
                      </div>
                      {!risk.user_acknowledged && (
                        <button
                          onClick={() => acknowledgeRisk(risk.id)}
                          className="mt-4 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition text-sm"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* OPPORTUNITIES TAB */}
        {activeTab === "opportunities" && (
          <div className="space-y-4">
            {opportunities.length === 0 ? (
              <div className="bg-slate-50 p-8 rounded-lg text-center">
                <p className="text-slate-600">No opportunities identified yet</p>
              </div>
            ) : (
              opportunities.map(opp => (
                <div
                  key={opp.id}
                  className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-6 rounded-lg"
                >
                  <div className="flex items-start gap-4">
                    <Zap className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 mb-2">
                        {opp.opportunity_description}
                      </h4>
                      <div className="flex gap-4 flex-wrap text-sm mb-3">
                        <span className="text-slate-600">
                          <span className="font-semibold">Available:</span>{" "}
                          {new Date(opp.predicted_available_date).toLocaleDateString()}
                        </span>
                        <span className="text-slate-600">
                          <span className="font-semibold">Potential benefit:</span> +
                          {opp.projected_benefit.toFixed(1)}
                        </span>
                        <span className="text-slate-600">
                          <span className="font-semibold">Action:</span> {opp.suggested_action}
                        </span>
                      </div>
                      {!opp.user_interested && (
                        <button
                          onClick={() => recordOpportunity(opp.id)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition text-sm"
                        >
                          Mark Interested
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionEngineDashboard;
