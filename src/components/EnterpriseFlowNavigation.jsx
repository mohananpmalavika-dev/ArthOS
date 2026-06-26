import React, { memo } from "react";
import { useEnterpriseAuth } from "../context/EnterpriseAuthContext.jsx";
import {
  BarChart3,

  Users,
  AlertTriangle,
  FileText,
  Settings,
  TrendingUp,
  Lock,
  Shield
} from "lucide-react";

const EnterpriseFlowNavigation = memo(({ activeHash = "#dashboard", onTabSelect = () => {} }) => {
  const { hasPermission } = useEnterpriseAuth();

  // Map tabs to backend permission keys (adjust to your auth model)
  const tabs = [
    {
      id: "dashboard",
      label: "Portfolio",
      icon: BarChart3,
      description: "Aggregate risk dashboard",
      permission: "enterprise:view_portfolio"
    },
    {
      id: "customers",
      label: "Customers",
      icon: Users,
      description: "Customer intelligence",
      permission: "enterprise:view_customers"
    },
    {
      id: "risk",
      label: "Risk Alerts",
      icon: AlertTriangle,
      description: "Real-time risk monitoring",
      permission: "enterprise:view_risk_alerts"
    },
    {
      id: "compliance",
      label: "Compliance",
      icon: FileText,
      description: "Regulatory reports",
      permission: "enterprise:view_compliance"
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: TrendingUp,
      description: "Performance trends",
      permission: "enterprise:view_analytics"
    },
    {
      id: "settings",
      label: "Configuration",
      icon: Settings,
      description: "Enterprise settings",
      permission: "enterprise:manage_settings"
    }
  ];


  const handleTabClick = (id) => {
    onTabSelect(id);
    window.location.hash = `#${id}`;
  };

  return (
    <div className="enterprise-nav-container">
      <div className="enterprise-nav-header">
        <div className="enterprise-nav-logo">
          <Shield size={24} />
          <span className="enterprise-nav-title">ARTH.OS Lending Intelligence</span>
        </div>
        <div className="enterprise-nav-badge">NBFC & Loan Behavior</div>
      </div>

      <nav className="enterprise-nav-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeHash === `#${tab.id}`;
          const allowed = tab.permission ? hasPermission(tab.permission) : true;

          // Keep layout stable but disable access
          return (
            <button
              key={tab.id}
              className={`enterprise-nav-tab ${isActive ? "active" : ""} ${
                !allowed ? "disabled" : ""
              }`}
              onClick={() => {
                if (!allowed) return;
                handleTabClick(tab.id);
              }}
              title={!allowed ? `${tab.description} (Access denied)` : tab.description}
              disabled={!allowed}
            >
              <Icon size={18} className="enterprise-tab-icon" />
              <span className="enterprise-tab-label">{tab.label}</span>
              <div className="enterprise-tab-tooltip">{tab.description}</div>
            </button>
          );
        })}
      </nav>

      <div className="enterprise-nav-footer">
        <div className="enterprise-security-badge">
          <Lock size={14} />
          <span>Enterprise Grade</span>
        </div>
      </div>
    </div>
  );
});

EnterpriseFlowNavigation.displayName = "EnterpriseFlowNavigation";

export default EnterpriseFlowNavigation;
