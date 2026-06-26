import React, { memo, useState } from "react";
import { Download } from "lucide-react";


const PortfolioDashboard = memo(() => {
  const [timeRange, setTimeRange] = useState("7d");

  // NOTE: Production backend integration for portfolio metrics is not wired yet.
  // The previous version used mock enterprise data, which is not production-safe.
  // Replace this component with real API calls once backend endpoints are confirmed.

  return (
    <div className="enterprise-portfolio-dashboard">
      <div className="enterprise-error-banner" role="alert" style={{ marginBottom: 16 }}>
        <span style={{ fontWeight: 600 }}>Backend integration required.</span> 
        Portfolio Overview (Dashboard) is currently placeholder-only.
        Connect enterprise portfolio metrics endpoints and replace mock UI.
      </div>

      <div className="enterprise-section-header">
        <div>
          <h2 className="enterprise-section-title">Portfolio Overview</h2>
          <p className="enterprise-section-subtitle">Real-time customer health metrics (integration pending)</p>
        </div>
        <div className="enterprise-header-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="enterprise-select"
            disabled
            aria-disabled="true"
            title="Backend integration pending"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="enterprise-btn-secondary" disabled aria-disabled="true" title="Backend integration pending">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      <div className="enterprise-card">
        <div className="enterprise-empty-state" style={{ padding: 20 }}>
          Portfolio metrics UI is present, but the enterprise backend endpoints are not wired in this build.
        </div>
      </div>
    </div>

  );
});

PortfolioDashboard.displayName = "PortfolioDashboard";

export default PortfolioDashboard;
