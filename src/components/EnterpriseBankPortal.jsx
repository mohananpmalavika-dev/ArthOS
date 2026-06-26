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
const RiskAlertsSection = memo(() => (
  <div className="enterprise-placeholder">
    <h2>Risk Monitoring & Alerts</h2>
    <p>Real-time risk detection and alert management for portfolio accounts.</p>
  </div>
));

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
