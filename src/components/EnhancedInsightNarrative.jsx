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

      const critical = generatedInsights.find((i) => i.priority === 'critical');
      if (critical) {
        setSelectedInsightId(critical.id);
      }
    }
  }, [assessmentResult, assessment]);

  if (!assessmentResult || insights.length === 0) {
    return (
      <div className="insight-empty-state summary-card">
        <p className="premium-report-block-subtitle">Complete your assessment to receive personalized insights.</p>
      </div>
    );
  }

  const selectedInsight = insights.find((i) => i.id === selectedInsightId) || insights[0];

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'critical':
        return 'insight-card-critical';
      case 'high':
        return 'insight-card-high';
      case 'medium':
        return 'insight-card-medium';
      case 'low':
        return 'insight-card-low';
      default:
        return 'insight-card-default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
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
    <div className="insight-section">
      {patterns.length > 0 && (
        <div className="insight-patterns-card summary-card">
          <div className="premium-report-block-header">
            <h3 className="premium-report-block-title">
              <AlertCircle size={20} /> Behavioral Patterns Detected
            </h3>
          </div>

          <div className="insight-patterns-list">
            {patterns.map((pattern) => (
              <div key={pattern.id} className="insight-pattern-row">
                <span className={`insight-pill ${pattern.severity === 'high' ? 'insight-pill-critical' : pattern.severity === 'medium' ? 'insight-pill-warning' : 'insight-pill-default'}`}>
                  {pattern.severity.toUpperCase()}
                </span>
                <div className="insight-pattern-copy">
                  <p className="insight-pattern-title">{pattern.name}</p>
                  <p className="insight-pattern-text">{pattern.description}</p>
                  <p className="insight-pattern-evidence">Evidence: {pattern.evidence}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="insight-tabs">
        {insights.map((insight) => (
          <button
            key={insight.id}
            onClick={() => setSelectedInsightId(insight.id)}
            className={`insight-tab ${selectedInsightId === insight.id ? 'insight-tab-active' : ''}`}
          >
            <span className="insight-tab-label">
              {getPriorityIcon(insight.priority)}
              {insight.category}
            </span>
          </button>
        ))}
      </div>

      {selectedInsight && (
        <div className={`insight-main-card summary-card ${getPriorityClass(selectedInsight.priority)}`}>
          <div className="premium-report-block-header">
            <div className="insight-main-header">
              <div className="insight-main-tag-row">
                {getPriorityIcon(selectedInsight.priority)}
                <span className={`insight-tag ${selectedInsight.priority === 'critical' ? 'insight-tag-critical' : selectedInsight.priority === 'high' ? 'insight-tag-high' : selectedInsight.priority === 'medium' ? 'insight-tag-medium' : 'insight-tag-low'}`}>
                  {selectedInsight.priority} Priority
                </span>
              </div>
              <span className="insight-category-pill">{selectedInsight.category}</span>
            </div>
          </div>

          <h2 className="insight-main-headline">{selectedInsight.headline}</h2>
          <p className="insight-main-copy">{selectedInsight.insight}</p>

          {selectedInsight.signal && (
            <div className="insight-signal-box">📊 {selectedInsight.signal}</div>
          )}

          <div className="insight-action-card summary-card">
            <h3>
              <Target size={20} /> What You Can Do This Week
            </h3>
            <p>{selectedInsight.actionable || "You're on the right track. Keep up your current approach."}</p>
          </div>
        </div>
      )}

      <div className="insight-summary-grid">
        {insights
          .filter((i) => i.id !== selectedInsightId)
          .slice(0, 2)
          .map((insight) => (
            <button
              key={insight.id}
              onClick={() => setSelectedInsightId(insight.id)}
              className={`insight-summary-card summary-card ${getPriorityClass(insight.priority)}`}
            >
              <div className="insight-summary-top">
                {getPriorityIcon(insight.priority)}
                <div>
                  <p className="insight-summary-headline">{insight.headline}</p>
                  <p className="insight-summary-text">{insight.insight}</p>
                </div>
              </div>
              {insight.signal && <p className="insight-summary-signal">{insight.signal}</p>}
            </button>
          ))}
      </div>

      <details className="insight-details-panel summary-card">
        <summary className="insight-details-summary">All Insights ({insights.length})</summary>
        <div className="insight-details-list">
          {insights.map((insight) => (
            <div key={insight.id} className={`insight-detail-row ${getPriorityClass(insight.priority)}`}>
              <span className="insight-detail-category">{insight.category}</span>
              <div>
                <p className="insight-detail-headline">{insight.headline}</p>
                <p className="insight-detail-text">{insight.insight}</p>
                {insight.signal && <p className="insight-detail-signal">{insight.signal}</p>}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
