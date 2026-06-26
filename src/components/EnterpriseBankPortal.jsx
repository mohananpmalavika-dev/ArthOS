import React, { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { LogOut } from "lucide-react";
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

const AnalyticsSection = memo(() => (
  <div className="enterprise-placeholder">
    <h2>Portfolio Analytics</h2>
    <p>Advanced analytics and performance trending for customer base insights.</p>
  </div>
));

const SettingsSection = memo(() => (
  <div className="enterprise-placeholder">
    <h2>Enterprise Configuration</h2>
    <p>Manage API keys, webhooks, white-label branding, and user permissions.</p>
  </div>
));

export default EnterpriseBankPortal;
