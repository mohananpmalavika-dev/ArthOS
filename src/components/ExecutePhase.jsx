import React, { useState, useEffect } from 'react';
import WeeklyMissionCard from './WeeklyMissionCard';
import DailyCheckinForm from './DailyCheckinForm';
import RecordDecision from './RecordDecision';
import UserAssessmentHistory from './UserAssessmentHistory';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function ExecutePhase({ assessmentData }) {
  const [completedMissions, setCompletedMissions] = useState([]);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [missions, setMissions] = useState([]);

  const overviewRef = useScrollReveal({ threshold: 0.2 });
  const missionsRef = useScrollReveal({ threshold: 0.1 });
  const actionsRef = useScrollReveal({ threshold: 0.2 });
  const progressRef = useScrollReveal({ threshold: 0.1 });

  useEffect(() => {
    // Generate missions based on assessment data
    const generatedMissions = [
      {
        id: 'mission-1',
        title: 'Add to Emergency Fund',
        description: 'Transfer ₹500 to your emergency savings account',
        timeEstimate: '5 min',
        icon: '💳',
        priority: 'high'
      },
      {
        id: 'mission-2',
        title: 'Review Subscriptions',
        description: 'Go through your recurring charges and cancel unused services',
        timeEstimate: '15 min',
        icon: '🔍',
        priority: 'medium'
      },
      {
        id: 'mission-3',
        title: 'Track Your Spending',
        description: 'Log today\'s purchases in your tracking method',
        timeEstimate: '10 min',
        icon: '📊',
        priority: 'medium'
      }
    ];
    setMissions(generatedMissions);
  }, [assessmentData]);

  const handleMissionComplete = (missionId) => {
    setCompletedMissions([...completedMissions, missionId]);
  };

  const completionPercentage = missions.length > 0
    ? Math.round((completedMissions.length / missions.length) * 100)
    : 0;

  return (
    <div className="execute-phase">
      <h1 className="execute-title">Your Action Plan</h1>
      <p className="execute-subtitle">
        Turn insights into action with concrete weekly tasks.
      </p>

      {/* Progress Overview */}
      <div className="execute-overview scroll-reveal-stagger" ref={overviewRef}>
        <div className="overview-card scroll-reveal-stagger">
          <div className="overview-metric">
            <span className="metric-label">This Week's Missions</span>
            <span className="metric-value">
              {completedMissions.length}/{missions.length}
            </span>
            <div className="metric-progress">
              <div
                className="progress-bar"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-metric">
            <span className="metric-label">Total Time Needed</span>
            <span className="metric-value">30 min</span>
            <p className="metric-note">Spread across the week</p>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-metric">
            <span className="metric-label">Your Score Path</span>
            <span className="metric-value">
              {assessmentData?.healthScore || 600} → {(assessmentData?.healthScore || 600) + 50}
            </span>
            <p className="metric-note">Potential improvement</p>
          </div>
        </div>
      </div>

      {/* Missions Board */}
      <div className="execute-section scroll-reveal" ref={missionsRef}>
        <h2 className="execute-section-title">This Week's Tasks</h2>
        <div className="missions-board">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className={`mission-item scroll-reveal-stagger ${completedMissions.includes(mission.id) ? 'completed' : ''}`}
            >
              <div className="mission-checkbox">
                <input
                  type="checkbox"
                  checked={completedMissions.includes(mission.id)}
                  onChange={() => handleMissionComplete(mission.id)}
                  id={mission.id}
                />
                <label htmlFor={mission.id}></label>
              </div>

              <div className="mission-content">
                <div className="mission-header">
                  <span className="mission-icon">{mission.icon}</span>
                  <h3 className="mission-title">{mission.title}</h3>
                  <span className={`mission-priority priority-${mission.priority}`}>
                    {mission.priority}
                  </span>
                </div>
                <p className="mission-description">{mission.description}</p>
                <span className="mission-time">⏱️ {mission.timeEstimate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="execute-quick-actions scroll-reveal-stagger" ref={actionsRef}>
        <button
          className="quick-action-btn scroll-reveal-stagger"
          onClick={() => setShowCheckin(true)}
        >
          <span className="action-icon">✓</span>
          <span className="action-text">Log Progress</span>
        </button>

        <button
          className="quick-action-btn scroll-reveal-stagger"
          onClick={() => setShowHistory(true)}
        >
          <span className="action-icon">📈</span>
          <span className="action-text">View Trends</span>
        </button>

        <button className="quick-action-btn scroll-reveal-stagger">
          <span className="action-icon">📝</span>
          <span className="action-text">Record Decision</span>
        </button>
      </div>

      {/* Progress Visualization */}
      <div className="execute-section scroll-reveal" ref={progressRef}>
        <h2 className="execute-section-title">Your Progress</h2>
        <div className="progress-cards">
          <div className="progress-card scroll-reveal-stagger">
            <p className="progress-label">Missions Completed</p>
            <p className="progress-value">{completedMissions.length}</p>
            <p className="progress-detail">Keep building momentum</p>
          </div>

          <div className="progress-card scroll-reveal-stagger">
            <p className="progress-label">Score Trajectory</p>
            <p className="progress-value">↗️</p>
            <p className="progress-detail">+30 pts in 2 weeks</p>
          </div>

          <div className="progress-card scroll-reveal-stagger">
            <p className="progress-label">Time Invested</p>
            <p className="progress-value">1h 15m</p>
            <p className="progress-detail">On financial health this month</p>
          </div>

          <div className="progress-card scroll-reveal-stagger">
            <p className="progress-label">Next Milestone</p>
            <p className="progress-value">650</p>
            <p className="progress-detail">Estimated: 4 weeks</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCheckin && (
        <div className="execute-modal">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowCheckin(false)}>✕</button>
            <DailyCheckinForm onClose={() => setShowCheckin(false)} />
          </div>
        </div>
      )}

      {showHistory && (
        <div className="execute-modal">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowHistory(false)}>✕</button>
            <UserAssessmentHistory data={assessmentData} />
          </div>
        </div>
      )}
    </div>
  );
}
