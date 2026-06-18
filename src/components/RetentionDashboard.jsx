import React, { useState, useMemo, useEffect } from "react";
import { TrendingUp, Users, Calendar, Download, BarChart3 } from "lucide-react";
import {
  getCohortStatistics,
  getRetentionCurve,
  downloadRetentionData,
  getAllCohorts
} from "../engines/retentionEngine";
import "../styles.css";

/**
 * RetentionDashboard
 * Visualizes user retention metrics for MVP validation
 * Blueprint Ch. 12: "target 40%+ Day 30 retention"
 */
export default function RetentionDashboard() {
  const [stats, setStats] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Refresh stats on mount and when triggered
  useEffect(() => {
    const stats = getCohortStatistics();
    setStats(stats);
  }, [refreshTrigger]);

  if (!stats) {
    return (
      <div className="retention-dashboard loading">
        <p>Loading retention data...</p>
      </div>
    );
  }

  const curve = stats.retentionCurve || [];
  const day30Target = 40; // Blueprint target: 40%+
  const day30Actual = curve.find(c => c.dayN === 30)?.percentage || 0;
  const metTarget = day30Actual >= day30Target;

  return (
    <div className="retention-dashboard">
      <div className="retention-header">
        <h2>📊 User Growth Tracking</h2>
        <p className="subtitle">Community Growth Metrics</p>
        <button
          className="btn-secondary"
          onClick={() => downloadRetentionData()}
          title="Export cohort data as CSV"
        >
          <Download size={16} /> Export Data
        </button>
      </div>

      {/* KEY METRIC: Day 30 Retention */}
      <div className="retention-kpi">
        <div className={`kpi-card ${metTarget ? "success" : "warning"}`}>
          <div className="kpi-icon">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-content">
            <h3>Month 1 Engagement</h3>
            <div className="kpi-metric">
              {day30Actual}% <span className="target">/ {day30Target}% target</span>
            </div>
            <p className="kpi-status">{metTarget ? "✅ TARGET MET" : "🟡 APPROACHING TARGET"}</p>
          </div>
        </div>
      </div>

      {/* Engagement Curve */}
      <div className="retention-section">
        <h3>Engagement Over Time</h3>
        <div className="retention-curve">
          {curve.map(dayData => (
            <div key={`day-${dayData.dayN}`} className="curve-bar">
              <div className="bar-label">Day {dayData.dayN}</div>
              <div className="bar-value">{dayData.percentage}%</div>
              <div className="bar-graph">
                <div className="bar-fill" style={{ width: `${dayData.percentage}%` }} />
              </div>
              <div className="bar-count">
                {dayData.retained} / {dayData.total}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COMMUNITY INSIGHTS */}
      <div className="retention-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Groups</div>
            <div className="stat-value">{stats.totalCohorts}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Assessment Completion</div>
            <div className="stat-value">
              {stats.assessmentCompleted} ({stats.assessmentCompletionRate}%)
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Avg Returns / User</div>
            <div className="stat-value">{stats.avgReturnsPerUser}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Return Events</div>
            <div className="stat-value">{stats.totalReturns}</div>
          </div>
        </div>
      </div>

      {/* COHORT AGE BREAKDOWN */}
      <div className="retention-section">
        <h3>Cohorts by Age</h3>
        <div className="cohort-age-breakdown">
          {Object.entries(stats.cohortsByAge || {}).map(([ageGroup, count]) => (
            <div key={ageGroup} className="age-group">
              <span className="age-label">{ageGroup}</span>
              <span className="age-count">{count} cohorts</span>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILED COHORTS TABLE */}
      <CohortDetailsTable />

      {/* REFRESH BUTTON */}
      <div className="retention-footer">
        <button className="btn-primary" onClick={() => setRefreshTrigger(t => t + 1)}>
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}

/**
 * CohortDetailsTable
 * Shows detailed breakdown of all cohorts
 */
function CohortDetailsTable() {
  const cohorts = useMemo(() => getAllCohorts(), []);

  if (cohorts.length === 0) {
    return (
      <div className="cohort-table-empty">
        <p>No cohorts yet. Users will appear here as they enter the app.</p>
      </div>
    );
  }

  return (
    <div className="retention-section">
      <h3>Detailed Cohorts</h3>
      <div className="cohort-table-wrapper">
        <table className="cohort-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Entered Date</th>
              <th>Assessment</th>
              <th>Total Returns</th>
              <th>Last Return</th>
              <th>Age (days)</th>
            </tr>
          </thead>
          <tbody>
            {cohorts
              .slice()
              .reverse()
              .map(cohort => {
                const enteredDate = new Date(cohort.enteredAt);
                const lastReturn = cohort.returns[cohort.returns.length - 1];
                const ageDays = Math.floor((new Date() - enteredDate) / (24 * 60 * 60 * 1000));

                return (
                  <tr key={cohort.userId} className="cohort-row">
                    <td className="user-id">{cohort.userId.slice(0, 8)}...</td>
                    <td>{formatDate(cohort.enteredAt)}</td>
                    <td>
                      {cohort.assessmentCompleted ? (
                        <span className="badge-success">✅ Done</span>
                      ) : (
                        <span className="badge-pending">⏳ Pending</span>
                      )}
                    </td>
                    <td>{cohort.returns.length}</td>
                    <td>{lastReturn ? formatDate(lastReturn) : "—"}</td>
                    <td>{ageDays}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper: Format date
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
