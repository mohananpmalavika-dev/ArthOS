import React, { memo, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Key,
  LogOut,
  MoreVertical,
  Palette,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useEnterpriseAuth } from "../context/EnterpriseAuthContext.jsx";
import { createEnterpriseApi } from "../lib/enterpriseApi.js";
import EnterpriseFlowNavigation from "./EnterpriseFlowNavigation.jsx";
import PortfolioDashboard from "./PortfolioDashboard.jsx";
import CustomerIntelligence from "./CustomerIntelligence.jsx";
import ComplianceReports from "./ComplianceReports.jsx";

const ENTERPRISE_TABS = ["dashboard", "customers", "risk", "compliance", "analytics", "settings"];

function useLiveEnterpriseApi() {
  const { accessToken, institution } = useEnterpriseAuth();
  return useMemo(
    () =>
      createEnterpriseApi({
        getAccessToken: () => accessToken,
        getTenantId: () => institution?.id,
      }),
    [accessToken, institution?.id]
  );
}

const EnterpriseBankPortal = memo(() => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { logout } = useEnterpriseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (ENTERPRISE_TABS.includes(hash)) setActiveTab(hash);
  }, []);

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") window.location.hash = tab;
  };

  const handleLogout = async () => {
    await logout();
    navigate("/enterprise-login", { replace: true });
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
        <EnterpriseFlowNavigation activeHash={`#${activeTab}`} onTabSelect={handleTabSelect} />
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
        <div className="enterprise-container">{renderContent()}</div>
      </div>
    </div>
  );
});

EnterpriseBankPortal.displayName = "EnterpriseBankPortal";

const RiskAlertsSection = memo(() => {
  const api = useLiveEnterpriseApi();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getRiskAlerts();
        if (!cancelled) setAlerts(data?.items || []);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Unable to load risk alerts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAlerts();
    return () => {
      cancelled = true;
    };
  }, [api, reloadToken]);

  return (
    <div className="enterprise-risk-alerts">
      <div className="enterprise-section-header">
        <div>
          <h2 className="enterprise-section-title">Risk Monitoring & Alerts</h2>
          <p className="enterprise-section-subtitle">
            Real-time risk detection and alert management for portfolio accounts.
          </p>
        </div>
        <button className="enterprise-btn-secondary" onClick={() => setReloadToken((value) => value + 1)}>
          Refresh Alerts
        </button>
      </div>

      {loading ? (
        <div className="enterprise-loading">Loading risk alerts...</div>
      ) : error ? (
        <div className="enterprise-error-banner" role="alert">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : alerts.length === 0 ? (
        <div className="enterprise-empty-state">No active risk alerts.</div>
      ) : (
        <div className="enterprise-alert-list">
          {alerts.map((alert) => (
            <div key={alert.id} className={`enterprise-alert-card alert-${alert.severity}`}>
              <div className="enterprise-alert-card-header">
                <strong>{alert.title}</strong>
                <span>{alert.timeLabel}</span>
              </div>
              <p>{alert.description}</p>
              <div className="enterprise-insight-strip">
                <strong>Action</strong>
                <span>{alert.action}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

RiskAlertsSection.displayName = "RiskAlertsSection";

const AnalyticsSection = memo(() => {
  const api = useLiveEnterpriseApi();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getAnalytics();
        if (!cancelled) setAnalytics(data);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Unable to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, [api]);

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

      {loading ? (
        <div className="enterprise-loading">Loading portfolio analytics...</div>
      ) : error ? (
        <div className="enterprise-error-banner" role="alert">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : (
        <>
          <div className="enterprise-metrics-grid">
            {(analytics?.metrics || []).map((metric) => (
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
              <button className="enterprise-btn-icon" title="Analytics options">
                <MoreVertical size={16} />
              </button>
            </div>
            <div className="score-distribution-chart">
              {(analytics?.healthTrend || []).map((item) => (
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

          <div className="enterprise-card">
            <div className="card-header">
              <h3>Segment Mix</h3>
            </div>
            <div className="enterprise-settings-grid">
              {(analytics?.segmentMix || []).map((segment) => (
                <div key={segment.label} className="enterprise-config-card">
                  <h3>{segment.label}</h3>
                  <p>{segment.count} borrowers</p>
                  <strong>Rs {(segment.exposure / 100000).toFixed(1)}L exposure</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

AnalyticsSection.displayName = "AnalyticsSection";

const SettingsSection = memo(() => {
  const api = useLiveEnterpriseApi();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getSettings();
        if (!cancelled) setSettings(data);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Unable to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const configCards = [
    {
      icon: Key,
      title: "API Key Management",
      description: `${settings?.apiKeys?.length || 0} active integration keys.`,
      action: "View keys",
    },
    {
      icon: Zap,
      title: "Webhook Delivery",
      description: `${settings?.webhooks?.length || 0} delivery endpoint configured.`,
      action: "Manage webhooks",
    },
    {
      icon: Palette,
      title: "Branding",
      description: `${settings?.institution?.name || "Enterprise"} portal branding is active.`,
      action: "Edit branding",
    },
    {
      icon: ShieldCheck,
      title: "Permissions",
      description: `${settings?.roles?.reduce((sum, role) => sum + role.members, 0) || 0} users across enterprise roles.`,
      action: "Review roles",
    },
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

      {loading ? (
        <div className="enterprise-loading">Loading enterprise configuration...</div>
      ) : error ? (
        <div className="enterprise-error-banner" role="alert">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : (
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
      )}
    </div>
  );
});

SettingsSection.displayName = "SettingsSection";

export default EnterpriseBankPortal;
