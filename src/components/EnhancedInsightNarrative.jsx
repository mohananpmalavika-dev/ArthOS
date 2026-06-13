import React, { useState, useEffect } from "react";
import { 
  AlertCircle, 
  TrendingUp, 
  Lightbulb, 
  Target,
  ChevronRight,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  Clock
} from "lucide-react";
import {
  generatePersonalizedInsights,
  detectBehaviouralPatterns
} from "../engines/insightGenerator";

export function EnhancedInsightNarrative({ assessmentResult, assessment }) {
  const [insights, setInsights] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [expandedInsight, setExpandedInsight] = useState(0);

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
        <Lightbulb size={24} style={{ marginBottom: "12px", opacity: 0.6 }} />
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
        return <Zap size={20} />;
      case "low":
        return <TrendingUp size={20} />;
      default:
        return <Lightbulb size={20} />;
    }
  };

  const getKeyMomentLabel = (priority) => {
    const labels = {
      critical: "🔴 CRITICAL INSIGHT",
      high: "⚡ KEY INSIGHT",
      medium: "💡 IMPORTANT",
      low: "✓ POSITIVE SIGNAL"
    };
    return labels[priority] || labels.medium;
  };

  const getPriorityDescription = (priority) => {
    const descriptions = {
      critical: "This is the single most impactful thing you can address right now.",
      high: "This insight will create meaningful change in your financial health.",
      medium: "This is worth paying attention to as part of your broader progress.",
      low: "This represents a strength to build upon."
    };
    return descriptions[priority] || descriptions.medium;
  };

  return (
    <div className="insight-section enhanced-flow">
      {/* Behavioral Patterns - Context Layer */}
      {patterns.length > 0 && (
        <div className="insight-patterns-section">
          <div className="section-header">
            <div className="section-label">
              <AlertCircle size={18} />
              <span>BEHAVIORAL PATTERNS DETECTED</span>
            </div>
            <p className="section-description">Understanding your financial habits</p>
          </div>

          <div className="insight-patterns-grid">
            {patterns.slice(0, 3).map(pattern => (
              <div 
                key={pattern.id} 
                className={`pattern-card pattern-severity-${pattern.severity}`}
              >
                <div className="pattern-header">
                  <span className={`pattern-badge pattern-badge-${pattern.severity}`}>
                    {pattern.severity.toUpperCase()}
                  </span>
                </div>
                <h4 className="pattern-title">{pattern.name}</h4>
                <p className="pattern-description">{pattern.description}</p>
                <p className="pattern-evidence">
                  <strong>Evidence:</strong> {pattern.evidence}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Insights - Progressive Disclosure */}
      <div className="insights-flow">
        {insights.map((insight, index) => (
          <div
            key={insight.id}
            className={`insight-moment-card summary-card ${getPriorityClass(insight.priority)} ${
              expandedInsight === index ? "expanded" : ""
            }`}
            style={{
              animation: `slideIn 0.5s ease-out ${index * 0.1}s both`
            }}
          >
            {/* Key Moment Badge */}
            <div className="insight-moment-header">
              <div className="moment-badge">
                <span className={`priority-indicator priority-${insight.priority}`}>
                  {getPriorityIcon(insight.priority)}
                </span>
                <div className="moment-label">
                  <span className="label-text">{getKeyMomentLabel(insight.priority)}</span>
                  <span className="insight-index">Insight {index + 1} of {insights.length}</span>
                </div>
              </div>
              <button
                className="insight-expand-btn"
                onClick={() => setExpandedInsight(expandedInsight === index ? -1 : index)}
                aria-label="Expand insight"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Context & Why It Matters */}
            <div className="insight-context">
              <p className="priority-context">{getPriorityDescription(insight.priority)}</p>
            </div>

            {/* Main Headline - Key Moment */}
            <h2 className="insight-headline">{insight.headline}</h2>

            {/* Rich Narrative */}
            <p className="insight-narrative">{insight.insight}</p>

            {/* Signal / Data Point */}
            {insight.signal && (
              <div className="insight-signal-card">
                <div className="signal-icon">📊</div>
                <div className="signal-content">
                  <span className="signal-label">Key Signal</span>
                  <p className="signal-text">{insight.signal}</p>
                </div>
              </div>
            )}

            {/* This Week's Action - Call to Action */}
            <div className="action-section">
              <div className="action-header">
                <Target size={18} />
                <span className="action-title">WHAT YOU CAN DO THIS WEEK</span>
              </div>

              <div className="action-card">
                <div className="action-icon">🎯</div>
                <div className="action-content">
                  <p className="action-text">
                    {insight.actionable ||
                      "You're on the right track. Keep up your current approach."}
                  </p>
                  <div className="action-meta">
                    <Clock size={14} />
                    <span>Estimated effort: 30 mins</span>
                  </div>
                </div>
              </div>

              <p className="action-footnote">
                Complete this action by end of week to unlock progress toward your next milestone.
              </p>
            </div>

            {/* Impact Projection */}
            <div className="impact-projection">
              <div className="impact-row">
                <span className="impact-label">Expected Impact</span>
                <div className="impact-bars">
                  {["Behaviour", "Awareness", "Stability"].map(dim => (
                    <div 
                      key={dim}
                      className="impact-bar"
                      style={{
                        width: `${Math.random() * 60 + 20}%`,
                      }}
                      title={`Impact on ${dim}`}
                    >
                      <span className="impact-dim">{dim.charAt(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Journey Footer */}
      <div className="insights-footer">
        <div className="footer-content">
          <CheckCircle2 size={20} />
          <div className="footer-text">
            <p className="footer-title">Your Personalized Journey</p>
            <p className="footer-description">
              Revisit these insights weekly. Your scores update as your behaviour changes.
            </p>
          </div>
          <ArrowUpRight size={20} />
        </div>
      </div>
    </div>
  );
}
