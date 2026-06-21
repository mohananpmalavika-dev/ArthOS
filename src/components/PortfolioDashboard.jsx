import React, { memo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronDown,
  Download,
  Filter,
  Search,
  Eye,
  MoreVertical
} from "lucide-react";

const PortfolioDashboard = memo(() => {
  const [timeRange, setTimeRange] = useState("7d");

  // Mock enterprise data
  const portfolioMetrics = {
    totalCustomers: 15234,
    averageScore: 642,
    scoreChange: 12,
    riskAccounts: 2341,
    complianceScore: 98.5,
    revenue: 2340000
  };

  const scoreDistribution = [
    { band: "Critical", count: 234, percentage: 1.5, color: "#ef4444" },
    { band: "Fragile", count: 1847, percentage: 12.1, color: "#f97316" },
    { band: "Developing", count: 4234, percentage: 27.8, color: "#eab308" },
    { band: "Resilient", count: 5823, percentage: 38.2, color: "#22c55e" },
    { band: "Sovereign", count: 3096, percentage: 20.3, color: "#06b6d4" }
  ];

  const recentAlerts = [
    {
      id: 1,
      customer: "John Smith",
      customerId: "CS-14523",
      issue: "Score dropped 15% - High spending detected",
      severity: "high",
      date: "2 hours ago"
    },
    {
      id: 2,
      customer: "Sarah Chen",
      customerId: "CS-18746",
      issue: "Missed payment pattern detected",
      severity: "critical",
      date: "1 hour ago"
    },
    {
      id: 3,
      customer: "Michael Johnson",
      customerId: "CS-92034",
      issue: "Income volatility exceeds threshold",
      severity: "medium",
      date: "30 minutes ago"
    }
  ];

  const getSeverityColor = (severity) => {
    const colors = {
      critical: "#ef4444",
      high: "#f97316",
      medium: "#eab308",
      low: "#22c55e"
    };
    return colors[severity] || "#666";
  };

  return (
    <div className="enterprise-portfolio-dashboard">
      {/* Header */}
      <div className="enterprise-section-header">
        <div>
          <h2 className="enterprise-section-title">Portfolio Overview</h2>
          <p className="enterprise-section-subtitle">Real-time customer health metrics</p>
        </div>
        <div className="enterprise-header-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="enterprise-select"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="enterprise-btn-secondary">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="enterprise-metrics-grid">
        <div className="enterprise-metric-card">
          <div className="metric-label">Total Customers</div>
          <div className="metric-value">{portfolioMetrics.totalCustomers.toLocaleString()}</div>
          <div className="metric-change positive">
            <TrendingUp size={14} />
            +3.2% vs last month
          </div>
        </div>

        <div className="enterprise-metric-card">
          <div className="metric-label">Portfolio Health Score</div>
          <div className="metric-value">{portfolioMetrics.averageScore}</div>
          <div className="metric-change positive">
            <TrendingUp size={14} />
            +{portfolioMetrics.scoreChange} points
          </div>
        </div>

        <div className="enterprise-metric-card">
          <div className="metric-label">At-Risk Accounts</div>
          <div className="metric-value" style={{ color: "#ef4444" }}>
            {portfolioMetrics.riskAccounts.toLocaleString()}
          </div>
          <div className="metric-change negative">
            <TrendingDown size={14} />
            Requires monitoring
          </div>
        </div>

        <div className="enterprise-metric-card">
          <div className="metric-label">Compliance Score</div>
          <div className="metric-value">{portfolioMetrics.complianceScore}%</div>
          <div className="metric-change positive">
            <TrendingUp size={14} />
            All regulations met
          </div>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="enterprise-card">
        <div className="card-header">
          <h3>Health Score Distribution</h3>
          <button className="enterprise-btn-icon">
            <MoreVertical size={16} />
          </button>
        </div>
        <div className="score-distribution-chart">
          {scoreDistribution.map((item) => (
            <div key={item.band} className="distribution-row">
              <div className="distribution-label">
                <span className="band-name">{item.band}</span>
                <span className="band-count">{item.count.toLocaleString()}</span>
              </div>
              <div className="distribution-bar-container">
                <div
                  className="distribution-bar"
                  style={{
                    width: `${item.percentage * 3}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
              <span className="distribution-percentage">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="enterprise-card">
        <div className="card-header">
          <h3>
            <AlertTriangle size={16} />
            Recent Risk Alerts
          </h3>
          <button className="enterprise-btn-link">View All Alerts →</button>
        </div>
        <div className="alerts-list">
          {recentAlerts.map((alert) => (
            <div key={alert.id} className="alert-item">
              <div
                className="alert-severity-dot"
                style={{ backgroundColor: getSeverityColor(alert.severity) }}
              />
              <div className="alert-content">
                <div className="alert-title">
                  <strong>{alert.customer}</strong> ({alert.customerId})
                </div>
                <div className="alert-message">{alert.issue}</div>
              </div>
              <div className="alert-meta">
                <span className="alert-time">{alert.date}</span>
                <button className="enterprise-btn-icon">
                  <Eye size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

PortfolioDashboard.displayName = "PortfolioDashboard";

export default PortfolioDashboard;
