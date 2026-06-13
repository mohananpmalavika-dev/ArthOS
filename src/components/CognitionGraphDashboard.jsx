/**
 * Cognition Graph Visualization Dashboard
 *
 * Interactive visualization of financial beliefs, cognitive biases, emotional
 * triggers, and decision-outcome relationships.
 *
 * Features:
 * - Network graph visualization of belief system
 * - Cognitive bias profile
 * - Emotional trigger analysis
 * - Decision quality metrics
 * - Belief → Decision → Outcome causal chains
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  TrendingDown,
  AlertTriangle,
  Heart,
  Zap,
  BarChart3,
  GitBranch,
  CheckCircle2,
  XCircle,
  Navigation,
  Network,
  Lightbulb,
  Target,
  Filter,
  RefreshCw
} from "lucide-react";

const CognitionGraphDashboard = ({ userId }) => {
  const [activeTab, setActiveTab] = useState("beliefs");
  const [beliefs, setBeliefs] = useState([]);
  const [biases, setBiases] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [graph, setGraph] = useState(null);
  const [selectedBelief, setSelectedBelief] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadCognitionData();
  }, [userId]);

  const loadCognitionData = async () => {
    setLoading(true);
    try {
      const [beliefsRes, biasesRes, triggersRes, decisionsRes, graphRes, patternsRes] =
        await Promise.all([
          fetch(`/api/cognition/beliefs?userId=${userId}`).then(r => r.json()),
          fetch(`/api/cognition/biases?userId=${userId}`).then(r => r.json()),
          fetch(`/api/cognition/triggers?userId=${userId}`).then(r => r.json()),
          fetch(`/api/cognition/decisions?userId=${userId}&limit=20`).then(r => r.json()),
          fetch(`/api/cognition/graph?userId=${userId}`).then(r => r.json()),
          fetch(`/api/cognition/patterns?userId=${userId}&months=6`).then(r => r.json())
        ]);

      if (beliefsRes.success) {
        setBeliefs(beliefsRes.beliefs || []);
      }
      if (biasesRes.success) {
        setBiases(biasesRes.biases || []);
      }
      if (triggersRes.success) {
        setTriggers(triggersRes.triggers || []);
      }
      if (decisionsRes.success) {
        setDecisions(decisionsRes.decisions || []);
      }
      if (graphRes.success) {
        setGraph(graphRes.graph || null);
      }
      if (patternsRes.success) {
        setPatterns(patternsRes.patterns || []);
      }
    } catch (error) {
      console.error("Failed to load cognition data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Brain className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing your financial cognition...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Financial Cognition</h1>
            <p className="text-gray-600">
              Understand the beliefs, biases, and patterns shaping your financial decisions
            </p>
          </div>
          <button
            onClick={loadCognitionData}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition"
          >
            <RefreshCw size={18} /> Refresh Analysis
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="flex border-b flex-wrap">
            {[
              { id: "beliefs", label: "Beliefs", icon: Lightbulb },
              { id: "biases", label: "Cognitive Biases", icon: Brain },
              { id: "triggers", label: "Emotional Triggers", icon: Heart },
              { id: "decisions", label: "Decision Quality", icon: Target },
              { id: "graph", label: "Knowledge Graph", icon: Network }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium flex items-center gap-2 transition ${
                    activeTab === tab.id
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                  {tab.id === "beliefs" && beliefs.length > 0 && (
                    <span className="ml-2 bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs">
                      {beliefs.length}
                    </span>
                  )}
                  {tab.id === "biases" && biases.length > 0 && (
                    <span className="ml-2 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                      {biases.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Beliefs Tab */}
          {activeTab === "beliefs" && (
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Financial Beliefs</h3>
              {beliefs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    No beliefs extracted yet. Complete assessments to reveal your belief system.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {beliefs.map(belief => (
                    <div
                      key={belief.id}
                      onClick={() =>
                        setSelectedBelief(selectedBelief?.id === belief.id ? null : belief)
                      }
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{belief.belief_statement}</p>
                            {belief.is_limiting_belief && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                Limiting
                              </span>
                            )}
                            {belief.is_core_belief && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                Core Belief
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 capitalize">
                            {belief.belief_category} • {belief.belief_origin?.replace(/_/g, " ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {belief.belief_strength.toFixed(0)}/100
                          </p>
                          <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${belief.belief_strength}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {selectedBelief?.id === belief.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-700 mb-3">
                            <strong>Valence:</strong> {belief.emotional_valence} •
                            <strong className="ml-2">Confidence:</strong>{" "}
                            {belief.confidence_score.toFixed(0)}%
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Origin:</strong> {belief.belief_origin?.replace(/_/g, " ")} on{" "}
                            {new Date(belief.first_detected_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Biases Tab */}
          {activeTab === "biases" && (
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Cognitive Biases Detected
              </h3>
              {biases.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No biases detected yet. Build more decision history for analysis.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {biases.map(bias => (
                    <div
                      key={bias.id}
                      className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-4 border border-red-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{bias.bias_name}</p>
                          <p className="text-xs text-gray-600 uppercase tracking-wide mt-1">
                            {bias.bias_type.replace(/_/g, " ")}
                          </p>
                        </div>
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>

                      <p className="text-sm text-gray-700 mb-3">{bias.bias_description}</p>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Intensity</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {bias.bias_intensity_score.toFixed(0)}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${bias.bias_intensity_score}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <span className="text-xs text-gray-600">Instances</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {bias.detected_instances}
                          </span>
                        </div>

                        {bias.estimated_annual_impact > 0 && (
                          <div className="flex justify-between items-center pt-2 border-t border-red-200">
                            <span className="text-xs text-gray-600">Est. Annual Impact</span>
                            <span className="text-sm font-semibold text-red-600">
                              ₹{Math.abs(bias.estimated_annual_impact).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Triggers Tab */}
          {activeTab === "triggers" && (
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Emotional Triggers</h3>
              {triggers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    No emotional triggers detected yet. Track more decisions to identify patterns.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {triggers.map(trigger => (
                    <div
                      key={trigger.id}
                      className="bg-blue-50 rounded-lg p-4 border border-blue-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{trigger.trigger_event}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Emotion:{" "}
                            <span className="font-medium capitalize">
                              {trigger.trigger_emotion}
                            </span>
                          </p>
                        </div>
                        <Zap className="w-5 h-5 text-blue-600" />
                      </div>

                      <p className="text-sm text-gray-700 mb-3">
                        {trigger.common_behaviors?.join(", ") || "No behaviors recorded"}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white rounded p-2">
                          <p className="text-gray-600">Frequency</p>
                          <p className="font-semibold">
                            {trigger.frequency_per_month?.toFixed(1) || 0}/month
                          </p>
                        </div>
                        <div className="bg-white rounded p-2">
                          <p className="text-gray-600">Annual Impact</p>
                          <p className="font-semibold">
                            ₹{(trigger.estimated_annual_impact || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Decision Quality Tab */}
          {activeTab === "decisions" && (
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Decision Quality Analysis
              </h3>
              {decisions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No decisions recorded yet. Start tracking your financial decisions.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quality Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-gray-600 mb-1">Avg Decision Quality</p>
                      <p className="text-3xl font-bold text-green-600">
                        {Math.round(
                          decisions.reduce((sum, d) => sum + (d.decision_quality_score || 50), 0) /
                            decisions.length
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">/100</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Total Decisions</p>
                      <p className="text-3xl font-bold text-blue-600">{decisions.length}</p>
                      <p className="text-xs text-gray-500 mt-2">in decision history</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                      <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                      <p className="text-3xl font-bold text-purple-600">
                        ₹
                        {decisions
                          .reduce((sum, d) => sum + (d.decision_amount || 0), 0)
                          .toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">decided</p>
                    </div>
                  </div>

                  {/* Decision Patterns */}
                  {patterns.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mb-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Lightbulb size={18} className="text-yellow-600" />
                        Decision Patterns Found
                      </h4>
                      <div className="space-y-2">
                        {patterns.slice(0, 3).map((pattern, idx) => (
                          <p key={idx} className="text-sm text-gray-700">
                            <strong>{pattern.pattern}:</strong> {pattern.insight}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Decisions */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Recent Decisions</h4>
                    <div className="space-y-2">
                      {decisions.slice(0, 5).map(decision => (
                        <div
                          key={decision.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{decision.decision_title}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(decision.decision_date).toLocaleDateString()} •{" "}
                              {decision.decision_status}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {decision.decision_quality_score?.toFixed(0) || "?"}/100
                            </p>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-purple-600 h-1.5 rounded-full"
                                style={{ width: `${decision.decision_quality_score || 50}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Graph Tab */}
          {activeTab === "graph" && (
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Knowledge Graph</h3>
              {!graph || !graph.nodes || graph.nodes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Graph not yet built. Build your belief graph to visualize relationships.</p>
                  <button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
                    Build Graph
                  </button>
                </div>
              ) : (
                <div>
                  <div className="bg-gray-100 rounded-lg h-96 mb-4 flex items-center justify-center">
                    <p className="text-gray-600">
                      Graph visualization: {graph.nodes?.length || 0} nodes,{" "}
                      {graph.edges?.length || 0} connections
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 rounded p-3">
                      <p className="text-xs text-gray-600">Beliefs</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {graph.nodes?.filter(n => n.type === "belief").length || 0}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded p-3">
                      <p className="text-xs text-gray-600">Biases</p>
                      <p className="text-2xl font-bold text-red-600">
                        {graph.nodes?.filter(n => n.type === "bias").length || 0}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded p-3">
                      <p className="text-xs text-gray-600">Decisions</p>
                      <p className="text-2xl font-bold text-green-600">
                        {graph.nodes?.filter(n => n.type === "decision").length || 0}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded p-3">
                      <p className="text-xs text-gray-600">Density</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {graph.metrics?.density ? (graph.metrics.density * 100).toFixed(1) : "0"}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CognitionGraphDashboard;
