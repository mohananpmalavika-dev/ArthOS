import React, { memo, useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, RotateCcw, Users } from "lucide-react";
import { useEnterpriseAuth } from "../context/EnterpriseAuthContext.jsx";
import { createEnterpriseApi } from "../lib/enterpriseApi.js";

function exportJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const PortfolioDashboard = memo(() => {
  const [timeRange, setTimeRange] = useState("7d");
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const { accessToken, institution } = useEnterpriseAuth();

  const api = useMemo(
    () =>
      createEnterpriseApi({
        getAccessToken: () => accessToken,
        getTenantId: () => institution?.id,
      }),
    [accessToken, institution?.id]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPortfolio() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getPortfolio({ range: timeRange });
        if (!cancelled) setPortfolio(data);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Unable to load enterprise portfolio");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPortfolio();
    return () => {
      cancelled = true;
    };
  }, [api, timeRange, reloadToken]);

  return (
    <div className="enterprise-portfolio-dashboard">
      <div className="enterprise-section-header">
        <div>
          <h2 className="enterprise-section-title">Portfolio Overview</h2>
          <p className="enterprise-section-subtitle">
            Live borrower health, default risk, and exposure signals.
          </p>
        </div>
        <div className="enterprise-header-controls">
          <select
            value={timeRange}
            onChange={(event) => setTimeRange(event.target.value)}
            className="enterprise-select"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            className="enterprise-btn-secondary"
            onClick={() => portfolio && exportJson(portfolio, "arthos-enterprise-portfolio.json")}
            disabled={!portfolio}
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="enterprise-loading">Loading enterprise portfolio...</div>
      ) : error ? (
        <div className="enterprise-error-banner" role="alert">
          <AlertCircle size={16} />
          {error}
          <button className="enterprise-btn-link" onClick={() => setReloadToken((value) => value + 1)}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="enterprise-metrics-grid">
            {(portfolio?.metrics || []).map((metric) => (
              <div key={metric.label} className="enterprise-metric-card">
                <div className="metric-label">{metric.label}</div>
                <div className="metric-value">{metric.value}</div>
                <div className={`metric-change ${metric.tone || "positive"}`}>
                  {metric.change}
                </div>
              </div>
            ))}
          </div>

          <div className="enterprise-card">
            <div className="card-header">
              <h3>
                <Users size={16} />
                Risk Distribution
              </h3>
              <button
                className="enterprise-btn-icon"
                title="Refresh"
                onClick={() => setReloadToken((value) => value + 1)}
              >
                <RotateCcw size={14} />
              </button>
            </div>
            <div className="score-distribution-chart">
              {(portfolio?.distribution || []).map((item) => (
                <div key={item.label} className="distribution-row">
                  <div className="distribution-label">
                    <span className="band-name">{item.label}</span>
                    <span className="band-count">{item.value} borrowers</span>
                  </div>
                  <div className="distribution-bar-container">
                    <div
                      className="distribution-bar"
                      style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <span className="distribution-percentage">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="enterprise-card">
            <div className="card-header">
              <h3>Highest Risk Borrowers</h3>
            </div>
            <div className="enterprise-table-container">
              <table className="enterprise-customers-table">
                <thead>
                  <tr>
                    <th>Borrower</th>
                    <th>Loan</th>
                    <th>Default Risk</th>
                    <th>DPD</th>
                    <th>Next Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(portfolio?.topRiskCustomers || []).map((customer) => (
                    <tr key={customer.id} className={`status-${customer.status}`}>
                      <td>
                        <div className="customer-cell">
                          <span className="customer-name">{customer.name}</span>
                          <span className="customer-id">{customer.id}</span>
                        </div>
                      </td>
                      <td>{customer.loanType}</td>
                      <td>
                        <span className={`risk-badge risk-${customer.riskLevel}`}>
                          {Math.round(customer.defaultProbability * 100)}%
                        </span>
                      </td>
                      <td>{customer.dpd}</td>
                      <td>{customer.nextBestAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

PortfolioDashboard.displayName = "PortfolioDashboard";

export default PortfolioDashboard;
