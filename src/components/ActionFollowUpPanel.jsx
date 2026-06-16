/**
 * Action Follow-Up Response Component
 * Displays Day 7 and Day 30 follow-up reminders and collects responses
 */

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  ChevronDown,
  Send,
  AlertCircle,
  Lightbulb
} from "lucide-react";

export default function ActionFollowUpPanel({ userId, followUps = [] }) {
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [expandedFollowUp, setExpandedFollowUp] = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchMetrics();
    }
  }, [userId]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`/api/follow-up/metrics`);
      const data = await res.json();
      setMetrics(data.metrics);
    } catch (e) {
      console.error("Fetch metrics error:", e);
    }
  };

  const handleDay7Response = async followUpId => {
    const response = responses[followUpId] || {};
    if (!response.actionCompleted && !response.progressScore) {
      alert("Please provide a progress score");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/follow-up/day-7/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpId, response })
      });
      const data = await res.json();

      if (data.success) {
        alert("Day 7 response recorded! 🎉");
        setResponses(prev => {
          const next = { ...prev };
          delete next[followUpId];
          return next;
        });
        // Refresh follow-ups
        window.location.reload();
      }
    } catch (e) {
      console.error("Submit Day 7 response error:", e);
      alert("Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDay30Response = async followUpId => {
    const response = responses[followUpId] || {};
    if (response.progressScore === undefined) {
      alert("Please provide a progress score");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/follow-up/day-30/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followUpId,
          response,
          currentAssessment: {} // Would be populated from current user state
        })
      });
      const data = await res.json();

      if (data.success) {
        alert("Day 30 assessment complete! 🎉\n\n" + data.narrative);
        setResponses(prev => {
          const next = { ...prev };
          delete next[followUpId];
          return next;
        });
        window.location.reload();
      }
    } catch (e) {
      console.error("Submit Day 30 response error:", e);
      alert("Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  if (!followUps || followUps.length === 0) {
    return null;
  }

  return (
    <section className="follow-up-panel summary-card">
      {/* Header */}
      <div className="follow-up-header">
        <div className="follow-up-title-group">
          <Clock size={20} className="follow-up-icon" />
          <div>
            <h2 className="follow-up-title">Action Follow-Ups</h2>
            <p className="follow-up-subtitle">
              {followUps.length} check-in{followUps.length !== 1 ? "s" : ""} due
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Summary */}
      {metrics && (
        <div className="follow-up-metrics">
          <div className="metric-badge">
            <span className="metric-label">Response Rate</span>
            <span className="metric-value">{(metrics.day7ResponseRate || 0).toFixed(0)}%</span>
          </div>
          <div className="metric-badge">
            <span className="metric-label">Sustained Actions</span>
            <span className="metric-value">{(metrics.actionSustainmentRate || 0).toFixed(0)}%</span>
          </div>
          <div className="metric-badge">
            <span className="metric-label">Avg Improvement</span>
            <span className="metric-value">
              +{(metrics.averageHealthImprovement || 0).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Follow-Ups List */}
      <div className="follow-up-list">
        {followUps.map(followUp => {
          const isDueDay7 =
            followUp.day_7_status === "scheduled" &&
            new Date(followUp.day_7_reminder_date) <= new Date();
          const isDueDay30 =
            followUp.day_30_status === "scheduled" &&
            new Date(followUp.day_30_reminder_date) <= new Date();

          if (!isDueDay7 && !isDueDay30) {
            return null;
          }

          const response = responses[followUp.id] || {};
          const isExpanded = expandedFollowUp === followUp.id;

          return (
            <div key={followUp.id} className={`follow-up-item ${isDueDay7 ? "day-7" : "day-30"}`}>
              {/* Header */}
              <div
                className="follow-up-item-header"
                onClick={() => setExpandedFollowUp(isExpanded ? null : followUp.id)}
              >
                <div className="follow-up-item-meta">
                  <span className={`follow-up-badge ${isDueDay7 ? "day-7" : "day-30"}`}>
                    {isDueDay7 ? "📅 Day 7" : "📈 Day 30"}
                  </span>
                  <span className="follow-up-item-action">"{followUp.action_committed}"</span>
                </div>
                <ChevronDown
                  size={18}
                  className={`follow-up-chevron ${isExpanded ? "expanded" : ""}`}
                />
              </div>

              {/* Expanded Response Form */}
              {isExpanded && (
                <div className="follow-up-response-form">
                  {isDueDay7 ? (
                    <>
                      <h4 className="form-title">How's your action going after 7 days?</h4>

                      {/* Progress Score */}
                      <div className="form-group">
                        <label className="form-label">
                          Progress: How much have you done? (0-100%)
                        </label>
                        <div className="progress-slider-container">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={response.progressScore || 0}
                            onChange={e =>
                              setResponses({
                                ...responses,
                                [followUp.id]: {
                                  ...response,
                                  progressScore: parseInt(e.target.value, 10)
                                }
                              })
                            }
                            className="progress-slider"
                          />
                          <span className="progress-value">{response.progressScore || 0}%</span>
                        </div>
                      </div>

                      {/* Action Completed */}
                      <div className="form-group">
                        <label className="form-label">
                          <input
                            type="checkbox"
                            checked={response.actionCompleted || false}
                            onChange={e =>
                              setResponses({
                                ...responses,
                                [followUp.id]: {
                                  ...response,
                                  actionCompleted: e.target.checked
                                }
                              })
                            }
                          />
                          I completed this action
                        </label>
                      </div>

                      {/* Obstacles */}
                      <div className="form-group">
                        <label className="form-label">
                          What obstacles did you face? (optional)
                        </label>
                        <textarea
                          placeholder="What made this difficult? What would help?"
                          value={response.obstacles || ""}
                          onChange={e =>
                            setResponses({
                              ...responses,
                              [followUp.id]: {
                                ...response,
                                obstacles: e.target.value
                              }
                            })
                          }
                          className="form-textarea"
                          rows={3}
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={() => handleDay7Response(followUp.id)}
                        disabled={submitting}
                        className="submit-button"
                      >
                        <Send size={16} />
                        {submitting ? "Submitting..." : "Submit Day 7 Response"}
                      </button>
                    </>
                  ) : (
                    <>
                      <h4 className="form-title">30-Day Check-In: How's the action going now?</h4>

                      {/* Progress Score */}
                      <div className="form-group">
                        <label className="form-label">
                          Progress: How much have you sustained? (0-100%)
                        </label>
                        <div className="progress-slider-container">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={response.progressScore || 0}
                            onChange={e =>
                              setResponses({
                                ...responses,
                                [followUp.id]: {
                                  ...response,
                                  progressScore: parseInt(e.target.value, 10)
                                }
                              })
                            }
                            className="progress-slider"
                          />
                          <span className="progress-value">{response.progressScore || 0}%</span>
                        </div>
                      </div>

                      {/* Action Sustained */}
                      <div className="form-group">
                        <label className="form-label">
                          <input
                            type="checkbox"
                            checked={response.actionSustained || false}
                            onChange={e =>
                              setResponses({
                                ...responses,
                                [followUp.id]: {
                                  ...response,
                                  actionSustained: e.target.checked
                                }
                              })
                            }
                          />
                          I'm still doing this action regularly
                        </label>
                      </div>

                      {/* Habit Formed */}
                      <div className="form-group">
                        <label className="form-label">
                          <input
                            type="checkbox"
                            checked={response.habitFormed || false}
                            onChange={e =>
                              setResponses({
                                ...responses,
                                [followUp.id]: {
                                  ...response,
                                  habitFormed: e.target.checked
                                }
                              })
                            }
                          />
                          This has become a habit (I do it automatically)
                        </label>
                      </div>

                      {/* Final Reflection */}
                      <div className="form-group">
                        <label className="form-label">Overall reflection (what changed?):</label>
                        <textarea
                          placeholder="How has this action impacted your financial life? What did you learn?"
                          value={response.responseText || ""}
                          onChange={e =>
                            setResponses({
                              ...responses,
                              [followUp.id]: {
                                ...response,
                                responseText: e.target.value
                              }
                            })
                          }
                          className="form-textarea"
                          rows={4}
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={() => handleDay30Response(followUp.id)}
                        disabled={submitting}
                        className="submit-button"
                      >
                        <TrendingUp size={16} />
                        {submitting ? "Submitting..." : "Complete 30-Day Assessment"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="follow-up-info">
        <Lightbulb size={16} />
        <span>
          These check-ins help us measure real behavior change. Your honest responses improve our
          coaching.
        </span>
      </div>
    </section>
  );
}
