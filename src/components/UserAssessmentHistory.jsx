// src/components/UserAssessmentHistory.jsx
// Displays authenticated user's assessment history with scores and trends

import React from "react";
import { useUserAssessments, useUserScoreHistory } from "../hooks/useUserAssessments.js";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/user-assessment-history.css";

export function UserAssessmentHistory() {
  const { user, isAuthenticated } = useAuth();
  const { assessments, loading: assessmentsLoading, error: assessmentsError } =
    useUserAssessments();
  const { scores, loading: scoresLoading, error: scoresError, trends } =
    useUserScoreHistory();

  if (!isAuthenticated) {
    return (
      <div className="assessment-history-container">
        <p className="auth-required">Please log in to view your assessment history</p>
      </div>
    );
  }

  const isLoading = assessmentsLoading || scoresLoading;
  const hasError = assessmentsError || scoresError;

  return (
    <div className="assessment-history-container">
      <div className="history-header">
        <h2>Your Assessment History</h2>
        <p className="user-info">User: {user?.email || "Unknown"}</p>
      </div>

      {hasError && (
        <div className="error-banner">
          <p>{assessmentsError || scoresError}</p>
        </div>
      )}

      {isLoading ? (
        <div className="loading-state">
          <p>Loading your assessment history...</p>
        </div>
      ) : (
        <div className="history-content">
          {/* Score Trends Section */}
          {trends && (
            <div className="trends-section">
              <h3>Score Trends</h3>
              <div className="trends-grid">
                {trends.healthScore && (
                  <div className="trend-card">
                    <span className="trend-label">Financial Health Score</span>
                    <span className={`trend-value ${trends.healthScore.direction}`}>
                      {trends.healthScore.current}
                    </span>
                    {trends.healthScore.direction === "up" && (
                      <span className="trend-arrow">↑</span>
                    )}
                    {trends.healthScore.direction === "down" && (
                      <span className="trend-arrow">↓</span>
                    )}
                    {trends.healthScore.direction === "same" && (
                      <span className="trend-arrow">→</span>
                    )}
                  </div>
                )}
                {trends.behaviourScore && (
                  <div className="trend-card">
                    <span className="trend-label">Behaviour Score</span>
                    <span className={`trend-value ${trends.behaviourScore.direction}`}>
                      {trends.behaviourScore.current}
                    </span>
                    {trends.behaviourScore.direction === "up" && (
                      <span className="trend-arrow">↑</span>
                    )}
                    {trends.behaviourScore.direction === "down" && (
                      <span className="trend-arrow">↓</span>
                    )}
                    {trends.behaviourScore.direction === "same" && (
                      <span className="trend-arrow">→</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assessments List Section */}
          <div className="assessments-section">
            <h3>Recent Assessments</h3>
            {assessments.length === 0 ? (
              <div className="empty-state">
                <p>No assessments yet. Start your first assessment today!</p>
              </div>
            ) : (
              <div className="assessments-list">
                {assessments.map((assessment) => (
                  <div key={assessment.id} className="assessment-card">
                    <div className="card-header">
                      <h4>{assessment.assessment_type || "Assessment"}</h4>
                      <span className="card-date">
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="card-scores">
                      {assessment.health_score && (
                        <div className="score-item">
                          <span className="score-label">Financial Health:</span>
                          <span className="score-value">{assessment.health_score}</span>
                        </div>
                      )}
                      {assessment.behaviour_score && (
                        <div className="score-item">
                          <span className="score-label">Behaviour:</span>
                          <span className="score-value">{assessment.behaviour_score}</span>
                        </div>
                      )}
                      {assessment.awareness_score && (
                        <div className="score-item">
                          <span className="score-label">Awareness:</span>
                          <span className="score-value">{assessment.awareness_score}</span>
                        </div>
                      )}
                    </div>

                    {assessment.personality_type && (
                      <div className="card-footer">
                        <span className="personality-badge">{assessment.personality_type}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Score Timeline Section */}
          {scores.length > 0 && (
            <div className="timeline-section">
              <h3>Score Timeline</h3>
              <div className="score-timeline">
                {scores.map((score, idx) => (
                  <div key={idx} className="timeline-entry">
                    <div className="timeline-date">
                      {new Date(score.created_at).toLocaleDateString()}
                    </div>
                    <div className="timeline-values">
                      <span className="score-badge">HS: {score.health_score}</span>
                      <span className="score-badge">BS: {score.behaviour_score}</span>
                      <span className="score-badge">AS: {score.awareness_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserAssessmentHistory;
