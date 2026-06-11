import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Lightbulb, Target } from 'lucide-react';
import { generatePersonalizedInsights, detectBehaviouralPatterns } from '../engines/insightGenerator';

export function EnhancedInsightNarrative({ assessmentResult, assessment }) {
  const [insights, setInsights] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [selectedInsightId, setSelectedInsightId] = useState(null);

  useEffect(() => {
    if (assessmentResult && assessment) {
      const generatedInsights = generatePersonalizedInsights(assessmentResult, assessment);
      const detectedPatterns = detectBehaviouralPatterns(assessment);

      setInsights(generatedInsights);
      setPatterns(detectedPatterns);

      // Auto-select first critical insight
      const critical = generatedInsights.find((i) => i.priority === 'critical');
      if (critical) {
        setSelectedInsightId(critical.id);
      }
    }
  }, [assessmentResult, assessment]);

  if (!assessmentResult || insights.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">Complete your assessment to receive personalized insights.</p>
      </div>
    );
  }

  const selectedInsight = insights.find((i) => i.id === selectedInsightId) || insights[0];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-red-300 text-red-900';
      case 'high':
        return 'bg-orange-50 border-orange-300 text-orange-900';
      case 'medium':
        return 'bg-yellow-50 border-yellow-300 text-yellow-900';
      case 'low':
        return 'bg-green-50 border-green-300 text-green-900';
      default:
        return 'bg-blue-50 border-blue-300 text-blue-900';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle size={20} />;
      case 'high':
        return <AlertCircle size={20} />;
      case 'medium':
        return <Lightbulb size={20} />;
      case 'low':
        return <TrendingUp size={20} />;
      default:
        return <Lightbulb size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Behavioral Patterns Alert */}
      {patterns.length > 0 && (
        <div className="p-6 bg-purple-50 rounded-lg border-2 border-purple-300">
          <h3 className="font-bold text-lg text-purple-900 mb-4 flex items-center gap-2">
            <AlertCircle size={20} /> Behavioral Patterns Detected
          </h3>
          <div className="space-y-3">
            {patterns.map((pattern) => (
              <div key={pattern.id} className="p-4 bg-white rounded border border-purple-200">
                <div className="flex items-start gap-3">
                  <span
                    className={`px-3 py-1 rounded text-xs font-bold ${
                      pattern.severity === 'high'
                        ? 'bg-red-100 text-red-700'
                        : pattern.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {pattern.severity.toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{pattern.name}</p>
                    <p className="text-sm text-gray-700 mt-1">{pattern.description}</p>
                    <p className="text-xs text-gray-600 mt-2 italic">Evidence: {pattern.evidence}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insight Selector Tabs */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
        {insights.map((insight) => (
          <button
            key={insight.id}
            onClick={() => setSelectedInsightId(insight.id)}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-all flex-shrink-0 ${
              selectedInsightId === insight.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              {getPriorityIcon(insight.priority)}
              {insight.category}
            </span>
          </button>
        ))}
      </div>

      {/* Main Insight Display */}
      {selectedInsight && (
        <div className={`p-8 rounded-xl border-2 ${getPriorityColor(selectedInsight.priority)}`}>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getPriorityIcon(selectedInsight.priority)}
                <span className={`text-xs uppercase font-bold px-3 py-1 rounded ${
                  selectedInsight.priority === 'critical'
                    ? 'bg-red-200 text-red-900'
                    : selectedInsight.priority === 'high'
                    ? 'bg-orange-200 text-orange-900'
                    : selectedInsight.priority === 'medium'
                    ? 'bg-yellow-200 text-yellow-900'
                    : 'bg-green-200 text-green-900'
                }`}>
                  {selectedInsight.priority} Priority
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-700 bg-white bg-opacity-50 px-3 py-1 rounded">
                {selectedInsight.category}
              </span>
            </div>

            <h2 className="text-3xl font-bold mb-3">{selectedInsight.headline}</h2>
            <p className="text-lg leading-relaxed">{selectedInsight.insight}</p>
          </div>

          {/* Signal Indicator */}
          {selectedInsight.signal && (
            <div className="p-4 bg-white bg-opacity-50 rounded-lg mb-6 font-mono text-sm">
              📊 {selectedInsight.signal}
            </div>
          )}

          {/* Actionable Section */}
          {selectedInsight.actionable ? (
            <div className="p-6 bg-white bg-opacity-70 rounded-lg border-l-4 border-current">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Target size={20} /> What You Can Do This Week
              </h3>
              <p className="text-gray-900">{selectedInsight.actionable}</p>
            </div>
          ) : (
            <div className="p-6 bg-white bg-opacity-70 rounded-lg border-l-4 border-current">
              <p className="text-gray-900 italic">You're on the right track. Keep up your current approach.</p>
            </div>
          )}
        </div>
      )}

      {/* Insights Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights
          .filter((i) => i.id !== selectedInsightId)
          .slice(0, 2)
          .map((insight) => (
            <button
              key={insight.id}
              onClick={() => setSelectedInsightId(insight.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-lg ${getPriorityColor(insight.priority)}`}
            >
              <div className="flex items-start gap-3 mb-2">
                {getPriorityIcon(insight.priority)}
                <div>
                  <p className="font-bold text-sm">{insight.headline}</p>
                  <p className="text-xs opacity-75 mt-1 line-clamp-2">{insight.insight}</p>
                </div>
              </div>
              <p className="text-xs font-mono opacity-60 mt-2">{insight.signal}</p>
            </button>
          ))}
      </div>

      {/* All Insights List */}
      <details className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <summary className="font-bold cursor-pointer text-gray-900">All Insights ({insights.length})</summary>
        <div className="mt-4 space-y-3">
          {insights.map((insight) => (
            <div key={insight.id} className={`p-4 rounded-lg border-l-4 ${getPriorityColor(insight.priority)}`}>
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold uppercase text-gray-700 flex-shrink-0">{insight.category}</span>
                <div className="flex-1">
                  <p className="font-bold">{insight.headline}</p>
                  <p className="text-sm mt-1">{insight.insight}</p>
                  {insight.signal && <p className="text-xs font-mono text-gray-600 mt-2">{insight.signal}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
