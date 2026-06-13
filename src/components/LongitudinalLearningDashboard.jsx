/**
 * Longitudinal Learning Dashboard Component
 *
 * Displays user's financial evolution, behavior patterns, lifecycle stage,
 * and AI-generated insights
 *
 * Features:
 * - Behavior evolution timeline
 * - Pattern discovery
 * - Lifecycle stage progress
 * - Financial maturity scoring
 * - Anomaly detection
 * - Predictive insights
 * - Evolution journal
 */

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Award,
  Lightbulb,
  BookOpen,
  ChevronRight,
  Clock,
  Activity,
  Gauge,
  PieChart,
  LineChart,
  BarChart3
} from "lucide-react";

const LongitudinalLearningDashboard = ({ userId }) => {
  const [lifecycle, setLifecycle] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const [trends, setTrends] = useState([]);
  const [insights, setInsights] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [journal, setJournal] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLongitudinalData();
  }, [userId]);

  const loadLongitudinalData = async () => {
    setLoading(true);
    try {
      const [lifecycleRes, patternsRes, trendsRes, insightsRes, anomaliesRes, journalRes] =
        await Promise.all([
          fetch(`/api/longitudinal/lifecycle?userId=${userId}`).then(r => r.json()),
          fetch(`/api/longitudinal/patterns?userId=${userId}&active=true`).then(r => r.json()),
          fetch(`/api/longitudinal/trends?userId=${userId}`).then(r => r.json()),
          fetch(`/api/longitudinal/insights?userId=${userId}&shown=false`).then(r => r.json()),
          fetch(`/api/longitudinal/anomalies?userId=${userId}&acknowledged=false`).then(r =>
            r.json()
          ),
          fetch(`/api/longitudinal/journal?userId=${userId}&limit=10`).then(r => r.json())
        ]);

      if (lifecycleRes.success) {
        setLifecycle(lifecycleRes.lifecycle || lifecycleRes);
      }
      if (patternsRes.success) {
        setPatterns(patternsRes.patterns || []);
      }
      if (trendsRes.success) {
        setTrends(trendsRes.trends || []);
      }
      if (insightsRes.success) {
        setInsights(insightsRes.insights || []);
      }
      if (anomaliesRes.success) {
        setAnomalies(anomaliesRes.anomalies || []);
      }
      if (journalRes.success) {
        setJournal(journalRes.entries || []);
      }
    } catch (error) {
      console.error("Failed to load longitudinal data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your financial journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Financial Journey</h1>
            <p className="text-gray-600">
              Track your evolution and discover patterns in your financial behavior
            </p>
          </div>
          <Activity className="w-16 h-16 text-indigo-600" />
        </div>
      </div>

      {/* Lifecycle Stage Card */}
      {lifecycle && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-indigo-600">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-gray-600 uppercase tracking-wide">Current Stage</p>
                <h2 className="text-3xl font-bold text-gray-900 mt-2">
                  {lifecycle.current_stage?.replace("_", " ") || "Establishing"}
                </h2>
              </div>
              <Award className="w-12 h-12 text-indigo-600" />
            </div>

            {/* Maturity Score Gauge */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-2">Financial Maturity</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-indigo-600">
                    {lifecycle.financial_maturity_score || 0}
                  </p>
                  <p className="text-gray-600 text-sm mb-1">/100</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${lifecycle.financial_maturity_score || 0}%` }}
                  />
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-2">Savings Discipline</p>
                <p className="text-2xl font-bold text-green-600">
                  {lifecycle.savings_discipline_component || 0}
                </p>
                <p className="text-xs text-gray-500 mt-2">Score</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-2">Risk Awareness</p>
                <p className="text-2xl font-bold text-blue-600">
                  {lifecycle.risk_awareness_component || 0}
                </p>
                <p className="text-xs text-gray-500 mt-2">Score</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-2">Planning Score</p>
                <p className="text-2xl font-bold text-purple-600">
                  {lifecycle.planning_component || 0}
                </p>
                <p className="text-xs text-gray-500 mt-2">Score</p>
              </div>
            </div>

            {/* Progression Info */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Progression Velocity</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {lifecycle.progression_velocity || "steady"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Months on Platform</p>
                <p className="text-lg font-semibold text-gray-900">
                  {lifecycle.months_on_platform || 0}
                </p>
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition">
                <ChevronRight size={16} /> Next Steps
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="flex border-b flex-wrap">
            {["overview", "patterns", "trends", "insights", "journal"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium capitalize transition ${
                  activeTab === tab
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
                {tab === "patterns" && patterns.length > 0 && (
                  <span className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full text-xs">
                    {patterns.length}
                  </span>
                )}
                {tab === "insights" && insights.length > 0 && (
                  <span className="ml-2 bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full text-xs">
                    {insights.length}
                  </span>
                )}
                {tab === "journal" && journal.length > 0 && (
                  <span className="ml-2 bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs">
                    {journal.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Active Patterns</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{patterns.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Key Trends</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">{trends.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Anomalies Detected</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{anomalies.length}</p>
                  </div>
                </div>
              </div>

              {/* Recent Insights Preview */}
              {insights.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Insights</h3>
                  <div className="space-y-3">
                    {insights.slice(0, 3).map(insight => (
                      <div
                        key={insight.id}
                        className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{insight.insight_title}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {insight.insight_description}
                            </p>
                          </div>
                          <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Patterns Tab */}
          {activeTab === "patterns" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Patterns</h3>
              {patterns.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No patterns detected yet. Keep tracking your spending!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patterns.map(pattern => (
                    <div
                      key={pattern.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{pattern.pattern_name}</p>
                          <p className="text-sm text-gray-600 capitalize">
                            {pattern.pattern_type} • {pattern.frequency}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {Math.round(pattern.confidence_score)}% confidence
                          </p>
                          <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${pattern.confidence_score}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                        {pattern.avg_amount && (
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-gray-600 text-xs">Avg Amount</p>
                            <p className="font-semibold">
                              ₹{Math.round(pattern.avg_amount).toLocaleString()}
                            </p>
                          </div>
                        )}
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-gray-600 text-xs">Occurrences</p>
                          <p className="font-semibold">{pattern.occurrences_detected}</p>
                        </div>
                        {pattern.cycle_days && (
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-gray-600 text-xs">Cycle</p>
                            <p className="font-semibold">{pattern.cycle_days} days</p>
                          </div>
                        )}
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-gray-600 text-xs">Strength</p>
                          <p className="font-semibold capitalize text-indigo-600">
                            {pattern.pattern_strength}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === "trends" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Trends</h3>
              {trends.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <LineChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No trends detected yet. Keep tracking your data!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trends.map(trend => (
                    <div
                      key={trend.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {trend.trend_direction === "improving" ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{trend.metric_name}</p>
                            <p className="text-sm text-gray-600">
                              Category: {trend.metric_category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-semibold ${
                              trend.trend_direction === "improving"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {trend.percent_change_12m > 0 ? "+" : ""}
                            {trend.percent_change_12m?.toFixed(1) || "0"}%
                          </p>
                          <p className="text-xs text-gray-500">Last 12 months</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-gray-600 text-xs">Current</p>
                          <p className="font-semibold">
                            ₹{Math.round(trend.current_value).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-gray-600 text-xs">Average</p>
                          <p className="font-semibold">
                            ₹{Math.round(trend.average_value_12m || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-gray-600 text-xs">Confidence</p>
                          <p className="font-semibold">
                            {Math.round(trend.trend_confidence_score)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === "insights" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Insights</h3>
              {insights.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No insights available yet. More data will enable smarter recommendations!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.map(insight => (
                    <div
                      key={insight.id}
                      className={`border-l-4 rounded-lg p-4 ${
                        insight.potential_impact === "high"
                          ? "bg-red-50 border-red-400"
                          : insight.potential_impact === "medium"
                            ? "bg-yellow-50 border-yellow-400"
                            : "bg-blue-50 border-blue-400"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{insight.insight_title}</p>
                          <p className="text-xs text-gray-600 mt-1 capitalize">
                            {insight.insight_type.replace("_", " ")} • {insight.time_relevance}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            insight.potential_impact === "high"
                              ? "bg-red-200 text-red-700"
                              : insight.potential_impact === "medium"
                                ? "bg-yellow-200 text-yellow-700"
                                : "bg-blue-200 text-blue-700"
                          }`}
                        >
                          {insight.potential_impact}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{insight.insight_description}</p>
                      {insight.recommended_action && (
                        <p className="text-sm text-gray-900 font-medium">
                          💡 Action: {insight.recommended_action}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Journal Tab */}
          {activeTab === "journal" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Journey</h3>
              {journal.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    Your financial journey begins here. Start by recording your first milestone!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {journal.map((entry, index) => (
                    <div key={entry.id} className="relative">
                      {index !== journal.length - 1 && (
                        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
                      )}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600">
                            {entry.entry_type === "achievement" && (
                              <CheckCircle2 size={24} className="text-white" />
                            )}
                            {entry.entry_type === "milestone" && (
                              <Target size={24} className="text-white" />
                            )}
                            {entry.entry_type === "challenge" && (
                              <AlertCircle size={24} className="text-white" />
                            )}
                            {entry.entry_type === "learning" && (
                              <Lightbulb size={24} className="text-white" />
                            )}
                            {entry.entry_type === "decision" && (
                              <Zap size={24} className="text-white" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">{entry.title}</p>
                              <p className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                <Calendar size={14} />{" "}
                                {new Date(entry.journal_date).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded capitalize">
                              {entry.entry_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{entry.narrative}</p>
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {entry.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Anomalies Alert */}
      {anomalies.length > 0 && (
        <div className="max-w-7xl mx-auto mt-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-400">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Detected Anomalies</h3>
                <p className="text-sm text-gray-600 mb-4">
                  We've noticed {anomalies.length} unusual pattern(s) in your financial behavior.
                  Review them to ensure everything looks correct.
                </p>
                <div className="flex gap-3 flex-wrap">
                  {anomalies.slice(0, 2).map(anomaly => (
                    <span
                      key={anomaly.id}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        anomaly.severity_level === "critical"
                          ? "bg-red-100 text-red-700"
                          : anomaly.severity_level === "high"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {anomaly.anomaly_type}
                    </span>
                  ))}
                  {anomalies.length > 2 && (
                    <span className="px-3 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                      +{anomalies.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LongitudinalLearningDashboard;
