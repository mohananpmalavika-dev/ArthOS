import React, { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { LogOut, MoreVertical, Key, Zap, Palette, ShieldCheck } from "lucide-react";
import EnterpriseFlowNavigation from "./EnterpriseFlowNavigation.jsx";
import PortfolioDashboard from "./PortfolioDashboard.jsx";
import CustomerIntelligence from "./CustomerIntelligence.jsx";
import ComplianceReports from "./ComplianceReports.jsx";

/**
 * Enterprise B2B Flow for Banks and Insurance Companies
 *
 * This is the complete white-label portal for financial institutions
 * to monitor their customer base and manage regulatory compliance.
 */
const EnterpriseBankPortal = memo(() => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (hash && ["dashboard", "customers", "risk", "compliance", "analytics", "settings"].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/launch", { replace: true });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <PortfolioDashboard />;
      case "customers":
        return <CustomerIntelligence />;
      case "compliance":
        return <ComplianceReports />;
      case "risk":
        return <RiskAlertsSection />;
      case "analytics":
        return <AnalyticsSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return <PortfolioDashboard />;
    }
  };

  return (
    <div className="enterprise-portal">
      <div className="enterprise-portal-topbar">
        <EnterpriseFlowNavigation activeHash={`#${activeTab}`} onTabSelect={setActiveTab} />
        <button
          type="button"
          className="enterprise-btn-secondary enterprise-logout-btn"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
      <div className="enterprise-main-content">
        <div className="enterprise-container">
          {renderContent()}
        </div>
      </div>
    </div>
  );
});

EnterpriseBankPortal.displayName = "EnterpriseBankPortal";

/* Placeholder components for other tabs */
const RiskAlertsSection = memo(() => {
  const alerts = [
    {
      id: "RA-001",
      title: "High-risk customer exposure",
      description: "Customer Sarah Chen has a sustained high-risk profile and missing third-party coverage.",
      severity: "critical",
      time: "2h ago"
    },
    {
      id: "RA-002",
      title: "Rapid deposit outflows",
      description: "Portfolio accounts in the northwest region saw a 23% withdrawal spike today.",
      severity: "warning",
      time: "5h ago"
    },
    {
      id: "RA-003",
      title: "Compliance review required",
      description: "Three corporate accounts require documentation refresh before the next audit window.",
      severity: "info",
      time: "1d ago"
    }
  ];

  return (
    <div className="enterprise-risk-alerts">
      <div className="enterprise-section-header">
        <div>
          <h2 className="enterprise-section-title">Risk Monitoring & Alerts</h2>
          <p className="enterprise-section-subtitle">
            Real-time risk detection and alert management for portfolio accounts.
          </p>
        </div>
      </div>
      <div className="enterprise-alert-list">
        {alerts.map((alert) => (
          <div key={alert.id} className={`enterprise-alert-card alert-${alert.severity}`}>
            <div className="enterprise-alert-card-header">
              <strong>{alert.title}</strong>
              <span>{alert.time}</span>
            </div>
            <p>{alert.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

const AnalyticsSection = memo(() => {
  const analyticsMetrics = [
    {
      title: "Churn Risk",
      value: "12.4%",
      detail: "Customers likely to churn in the next 30 days"
    },
    {
      title: "Revenue at Risk",
      value: "₹43.2M",
      detail: "Estimated deposits exposed to high-risk segments"
    },
    {
      title: "Portfolio Growth",
      value: "+8.9%",
      detail: "Growth vs prior quarter"
    },
    {
      title: "Customer Engagement",
      value: "78%",
      detail: "Active accounts with engagement signals"
    }
  ];

  const chartData = [
    { label: "Jan", value: 68 },
    { label: "Feb", value: 74 },
    { label: "Mar", value: 71 },
    { label: "Apr", value: 79 },
    { label: "May", value: 83 },
    { label: "Jun", value: 88 }
  ];

  return (
    <div className="enterprise-analytics-dashboard">
      <div className="enterprise-section-header">
        <div>
          <h2 className="enterprise-section-title">Portfolio Analytics</h2>
          <p className="enterprise-section-subtitle">
            Advanced analytics and performance trending for customer base insights.
          </p>
        </div>
      </div>
      <div className="enterprise-metrics-grid">
        {analyticsMetrics.map((metric) => (
          <div key={metric.title} className="enterprise-metric-card">
            <div className="metric-label">{metric.title}</div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-change positive">{metric.detail}</div>
          </div>
        ))}
      </div>
      <div className="enterprise-card">
        <div className="card-header">
          <h3>Customer Health Trend</h3>
          <button className="enterprise-btn-icon">
            <MoreVertical size={16} />
          </button>
        </div>
        <div className="score-distribution-chart">
          {chartData.map((item) => (
            <div key={item.label} className="distribution-row">
              <div className="distribution-label">
                <span className="band-name">{item.label}</span>
                <span className="band-count">{item.value}%</span>
              </div>
              <div className="distribution-bar-container">
                <div
                  className="distribution-bar"
                  style={{ width: `${item.value}%`, backgroundColor: "#06b6d4" }}
                />
              </div>
              <span className="distribution-percentage">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const SettingsSection = memo(() => {
  const configCards = [
    {
      icon: Key,
      title: "API Key Management",
      description: "Create, rotate and revoke enterprise API keys for your integrations.",
      action: "View keys"
    },
    {
      icon: Zap,
      title: "Webhook Delivery",
      description: "Configure webhook endpoints and event subscriptions for system alerts.",
      action: "Manage webhooks"
    },
    {
      icon: Palette,
      title: "Branding",
      description: "Update company logo, colors, and portal theme for your enterprise clients.",
      action: "Edit branding"
    },
    {
      icon: ShieldCheck,
      title: "Permissions",
      description: "Set user roles, access control, and approval workflows for admins.",
      action: "Review roles"
    }
  ];

  return (
    <div className="enterprise-settings-dashboard">
      <div className="enterprise-section-header">
        <div>
          <h2 className="enterprise-section-title">Enterprise Configuration</h2>
          <p className="enterprise-section-subtitle">
            Manage API keys, webhooks, white-label branding, and user permissions.
          </p>
        </div>
      </div>
      <div className="enterprise-settings-grid">
        {configCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="enterprise-config-card">
              <div className="config-icon-wrapper">
                <Icon size={20} />
              </div>
              <div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
              <button className="enterprise-btn-secondary enterprise-config-action">
                {card.action}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default EnterpriseBankPortal;
