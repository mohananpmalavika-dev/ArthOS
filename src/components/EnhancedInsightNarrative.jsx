import React, { useState, useEffect } from "react";
import { AlertCircle, TrendingUp, Lightbulb, Target } from "lucide-react";
import {
  generatePersonalizedInsights,
  detectBehaviouralPatterns
} from "../engines/insightGenerator";

export function EnhancedInsightNarrative({ assessmentResult, assessment }) {
  const [insights, setInsights] = useState([]);
  const [patterns, setPatterns] = useState([]);

  useEffect(() => {
    if (assessmentResult && assessment) {
      const generatedInsights = generatePersonalizedInsights(assessmentResult, assessment);
      const detectedPatterns = detectBehaviouralPatterns(assessment);

      setInsights(generatedInsights);
      setPatterns(detectedPatterns);
    }
  }, [assessmentResult, assessment]);

  if (!assessmentResult || insights.length === 0) {
    return (
      <div className="insight-empty-state summary-card">
        <p className="premium-report-block-subtitle">
          Complete your assessment to receive personalized insights.
        </p>
      </div>
    );
  }

  const getPriorityClass = priority => {
    switch (priority) {
      case "critical":
        return "insight-card-critical";
      case "high":
        return "insight-card-high";
      case "medium":
        return "insight-card-medium";
      case "low":
        return "insight-card-low";
      default:
        return "insight-card-default";
    }
  };

  const getPriorityIcon = priority => {
    switch (priority) {
      case "critical":
      case "high":
        return <AlertCircle size={20} />;
      case "medium":
        return <Lightbulb size={20} />;
      case "low":
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
            {patterns.map(pattern => (
              <div key={pattern.id} className="insight-pattern-row">
                <span
                  className={`insight-pill ${pattern.severity === "high" ? "insight-pill-critical" : pattern.severity === "medium" ? "insight-pill-warning" : "insight-pill-default"}`}
                >
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

      <div className="insight-list">
        {insights.map(insight => (
          <div
            key={insight.id}
            className={`insight-main-card summary-card ${getPriorityClass(insight.priority)}`}
          >
            <div className="premium-report-block-header">
              <div className="insight-main-header">
                <div className="insight-main-tag-row">
                  {getPriorityIcon(insight.priority)}
                  <span
                    className={`insight-tag ${insight.priority === "critical" ? "insight-tag-critical" : insight.priority === "high" ? "insight-tag-high" : insight.priority === "medium" ? "insight-tag-medium" : "insight-tag-low"}`}
                  >
                    {insight.priority} Priority
                  </span>
                </div>
                <span className="insight-category-pill">{insight.category}</span>
              </div>
            </div>

            <h2 className="insight-main-headline">{insight.headline}</h2>
            <p className="insight-main-copy">{insight.insight}</p>

            {insight.signal && (
              <div className="insight-signal-box">📊 {insight.signal}</div>
            )}

            <div className="insight-action-card summary-card">
              <h3>
                <Target size={20} /> What You Can Do This Week
              </h3>
              <p>
                {insight.actionable ||
                  "You're on the right track. Keep up your current approach."}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
