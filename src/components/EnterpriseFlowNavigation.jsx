import React, { memo } from "react";
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
  const tabs = [
    {
      id: "dashboard",
      label: "Portfolio",
      icon: BarChart3,
      description: "Aggregate risk dashboard"
    },
    {
      id: "customers",
      label: "Customers",
      icon: Users,
      description: "Customer intelligence"
    },
    {
      id: "risk",
      label: "Risk Alerts",
      icon: AlertTriangle,
      description: "Real-time risk monitoring"
    },
    {
      id: "compliance",
      label: "Compliance",
      icon: FileText,
      description: "Regulatory reports"
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: TrendingUp,
      description: "Performance trends"
    },
    {
      id: "settings",
      label: "Configuration",
      icon: Settings,
      description: "Enterprise settings"
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

          return (
            <button
              key={tab.id}
              className={`enterprise-nav-tab ${isActive ? "active" : ""}`}
              onClick={() => handleTabClick(tab.id)}
              title={tab.description}
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
