/**
 * Completion Rate Dashboard
 * Displays assessment completion metrics and drop-off analysis
 */

import React, { useEffect, useState } from 'react';
import { getCompletionRateMetrics, loadTelemetryHistory } from '../engines/assessmentTelemetry.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Clock, Users, AlertTriangle, Download } from 'lucide-react';

export default function CompletionDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const mets = getCompletionRateMetrics();
    const hist = loadTelemetryHistory();
    setMetrics(mets);
    setHistory(hist);
  }, [refreshCount]);

  const handleRefresh = () => {
    setRefreshCount(c => c + 1);
  };

  const handleExportCSV = () => {
    if (!metrics) return;

    const csv = [
      ['Metric', 'Value'],
      ['Total Sessions', metrics.totalSessions],
      ['Completed Sessions', metrics.completedSessions],
      ['Dropped Off Sessions', metrics.droppedOffSessions],
      ['Completion Rate (%)', metrics.completionRate],
      ['Drop-off Rate (%)', metrics.dropOffRate],
      ['Average Duration (sec)', metrics.averageDurationSec],
      ['Average Completed Steps', metrics.averageCompletedSteps],
      ['Most Common Drop-off', metrics.mostCommonDropOff ? `Step ${metrics.mostCommonDropOff.step}: ${metrics.mostCommonDropOff.label}` : 'N/A'],
      ['', ''],
      ['Drop-off by Step', 'Count'],
      ...Object.entries(metrics.dropOffByStep).map(([step, count]) => [
        `Step ${step}`,
        count,
      ]),
      ['', ''],
      ['Device Type', 'Sessions'],
      ...Object.entries(metrics.deviceBreakdown).map(([device, count]) => [
        device,
        count,
      ]),
    ];

    const csvContent = csv.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `completion-metrics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!metrics) {
    return (
      <section className="summary-card">
        <h2>📊 Assessment Completion Rate</h2>
        <p className="text-muted">No assessment data yet. Complete your first assessment to see metrics.</p>
      </section>
    );
  }

  // Data for drop-off by step chart
  const dropOffChartData = Object.entries(metrics.dropOffByStep).map(([step, count]) => ({
    step: `Step ${step}`,
    count,
  }));

  // Data for device breakdown chart
  const deviceChartData = Object.entries(metrics.deviceBreakdown).map(([device, count]) => ({
    device: device.charAt(0).toUpperCase() + device.slice(1),
    count,
  }));

  // Timeline of session completions
  const timelineData = history.map((h, idx) => ({
    date: h.date,
    completed: h.completed ? 1 : 0,
    droppedOff: h.completed ? 0 : 1,
  })).slice(-30); // Last 30 sessions

  const completionTrend = timelineData.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    completion: d.completed,
  }));

  return (
    <section className="summary-card">
      <div className="completion-dashboard">
        <div className="completion-header">
          <h2>📊 Assessment Completion Rate</h2>
          <div className="completion-controls">
            <button className="btn-small" onClick={handleRefresh}>
              ↻ Refresh
            </button>
            <button className="btn-small" onClick={handleExportCSV}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="completion-kpi-row">
          <div className="completion-kpi-card">
            <div className="kpi-icon completion-icon">
              <TrendingUp size={24} />
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Completion Rate</div>
              <div className="kpi-value completion-value">{metrics.completionRate}%</div>
              <div className="kpi-desc">{metrics.completedSessions} of {metrics.totalSessions} completed</div>
            </div>
          </div>

          <div className="completion-kpi-card">
            <div className="kpi-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Drop-off Rate</div>
              <div className="kpi-value completion-warning">{metrics.dropOffRate}%</div>
              <div className="kpi-desc">{metrics.droppedOffSessions} assessments abandoned</div>
            </div>
          </div>

          <div className="completion-kpi-card">
            <div className="kpi-icon">
              <Clock size={24} />
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Avg Duration</div>
              <div className="kpi-value">{metrics.averageDurationSec}s</div>
              <div className="kpi-desc">Average assessment time</div>
            </div>
          </div>

          <div className="completion-kpi-card">
            <div className="kpi-icon">
              <Users size={24} />
            </div>
            <div className="kpi-content">
              <div className="kpi-label">Total Sessions</div>
              <div className="kpi-value">{metrics.totalSessions}</div>
              <div className="kpi-desc">Assessment attempts tracked</div>
            </div>
          </div>
        </div>

        {/* Most Common Drop-off */}
        {metrics.mostCommonDropOff && (
          <div className="completion-alert">
            <AlertTriangle size={18} />
            <div>
              <strong>Most Common Drop-off:</strong> {metrics.mostCommonDropOff.label} ({metrics.mostCommonDropOff.count} users)
            </div>
          </div>
        )}

        {/* Drop-off by Step Chart */}
        {dropOffChartData.length > 0 && (
          <div className="completion-chart">
            <h3>Drop-off by Step</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dropOffChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="step" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} users`} />
                <Bar dataKey="count" fill="#ff6b6b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Device Breakdown Chart */}
        {deviceChartData.length > 0 && (
          <div className="completion-chart">
            <h3>Sessions by Device</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deviceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="device" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} sessions`} />
                <Bar dataKey="count" fill="#00d4ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Completion Trend */}
        {completionTrend.length > 0 && (
          <div className="completion-chart">
            <h3>Completion Trend (Last 30 sessions)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={completionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => value ? 'Completed' : 'Dropped'} />
                <Line type="stepAfter" dataKey="completion" stroke="#00d4ff" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="completion-metrics-grid">
          <div className="metric-tile">
            <div className="metric-label">Avg Steps Completed</div>
            <div className="metric-value">{metrics.averageCompletedSteps} / {metrics.totalSessions > 0 ? 'N' : '0'}</div>
          </div>
        </div>

        {/* Legend */}
        <div className="completion-legend">
          <p className="text-muted">
            This dashboard tracks assessment wizard completion rates. Track which steps users abandon to optimize the flow.
          </p>
        </div>
      </div>

      <style jsx>{`
        .completion-dashboard {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .completion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .completion-header h2 {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 700;
        }

        .completion-controls {
          display: flex;
          gap: 0.5rem;
        }

        .btn-small {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.5rem 1rem;
          background: var(--cyan);
          color: var(--bg);
          border: none;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-small:hover {
          background: #00e5ff;
          transform: translateY(-1px);
        }

        .completion-kpi-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
        }

        .completion-kpi-card {
          display: flex;
          gap: 1rem;
          padding: 1.25rem;
          background: var(--bg-secondary, rgba(255, 255, 255, 0.02));
          border: 1px solid var(--border);
          border-radius: 10px;
          align-items: flex-start;
        }

        .kpi-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 212, 255, 0.1);
          border-radius: 8px;
          color: var(--cyan);
        }

        .kpi-icon.completion-icon {
          background: rgba(76, 175, 80, 0.1);
          color: #4caf50;
        }

        .kpi-content {
          flex: 1;
        }

        .kpi-label {
          font-size: 0.85rem;
          color: var(--muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
        }

        .kpi-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 0.25rem;
        }

        .kpi-value.completion-value {
          color: #4caf50;
        }

        .kpi-value.completion-warning {
          color: #ff9800;
        }

        .kpi-desc {
          font-size: 0.8rem;
          color: var(--muted);
        }

        .completion-alert {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 8px;
          color: var(--text);
          align-items: flex-start;
        }

        .completion-alert svg {
          flex-shrink: 0;
          color: #ffc107;
          margin-top: 2px;
        }

        .completion-chart {
          background: var(--bg-secondary, rgba(255, 255, 255, 0.01));
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 1.5rem;
        }

        .completion-chart h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .completion-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .metric-tile {
          padding: 1rem;
          background: var(--bg-secondary, rgba(255, 255, 255, 0.02));
          border: 1px solid var(--border);
          border-radius: 8px;
          text-align: center;
        }

        .metric-label {
          font-size: 0.8rem;
          color: var(--muted);
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .metric-value {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text);
        }

        .completion-legend {
          padding: 1rem;
          background: var(--bg-secondary, rgba(255, 255, 255, 0.01));
          border-radius: 8px;
          border: 1px solid var(--border);
          font-size: 0.9rem;
        }

        .text-muted {
          color: var(--muted);
        }

        @media (max-width: 768px) {
          .completion-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .completion-kpi-row {
            grid-template-columns: 1fr;
          }

          .completion-controls {
            width: 100%;
          }

          .btn-small {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
}
