import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, FileSpreadsheet, Search, UploadCloud, UserPlus } from "lucide-react";
import { useEnterpriseAuth } from "../context/EnterpriseAuthContext.jsx";
import { createEnterpriseApi } from "../lib/enterpriseApi.js";
import { readEnterpriseCustomerFile } from "../lib/enterpriseCustomerImport.js";

const riskOptions = [
  { value: "all", label: "All risk levels" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" }
];

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function filterCustomers(items, query, risk) {
  const search = String(query || "")
    .toLowerCase()
    .trim();
  return items.filter(customer => {
    const matchesSearch =
      !search ||
      String(customer.name || "")
        .toLowerCase()
        .includes(search) ||
      String(customer.id || "")
        .toLowerCase()
        .includes(search) ||
      String(customer.segment || "")
        .toLowerCase()
        .includes(search);
    const matchesRisk = risk === "all" || customer.riskLevel === risk;
    return matchesSearch && matchesRisk;
  });
}

const CustomerIntelligence = memo(() => {
  const { accessToken, institution } = useEnterpriseAuth();
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("all");
  const [customers, setCustomers] = useState([]);
  const [uploadedCustomers, setUploadedCustomers] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const fileInputRef = useRef(null);

  const api = useMemo(
    () =>
      createEnterpriseApi({
        getAccessToken: () => accessToken,
        getTenantId: () => institution?.id
      }),
    [accessToken, institution?.id]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      if (uploadedCustomers) {
        const items = filterCustomers(uploadedCustomers, query, risk);
        setCustomers(items);
        setSelectedId(current =>
          items.some(item => item.id === current) ? current : items[0]?.id || null
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await api.getCustomers({ q: query, risk });
        const items = data?.items || [];
        if (!cancelled) {
          setCustomers(items);
          setSelectedId(current =>
            items.some(item => item.id === current) ? current : items[0]?.id || null
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load customer intelligence");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => void loadCustomers(), 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [api, query, risk, reloadToken, uploadedCustomers]);

  async function handleCustomerFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImportError(null);
    setImportSummary(null);

    try {
      const imported = await readEnterpriseCustomerFile(file);
      setUploadedCustomers(imported);
      setCustomers(imported);
      setSelectedId(imported[0]?.id || null);
      setQuery("");
      setRisk("all");
      setError(null);
      setImportSummary(`${imported.length} customers imported from ${file.name}`);
    } catch (err) {
      setImportError(err?.message || "Unable to import customers");
    } finally {
      event.target.value = "";
    }
  }

  function handleApiSync() {
    setUploadedCustomers(null);
    setImportError(null);
    setImportSummary(null);
    setReloadToken(value => value + 1);
  }

  const selectedCustomer =
    customers.find(customer => customer.id === selectedId) || customers[0] || null;

  return (
    <div className="enterprise-customer-intelligence">
      <div className="enterprise-section-header">
        <div>
          <h2 className="enterprise-section-title">Customer Intelligence</h2>
          <p className="enterprise-section-subtitle">
            Borrower-level health, default probability, and next-best actions.
          </p>
        </div>
        <div className="enterprise-header-controls">
          <button className="enterprise-btn-secondary" onClick={handleApiSync}>
            <UserPlus size={16} />
            Sync Customers
          </button>
          <button
            className="enterprise-btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={16} />
            Upload File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls"
            onChange={handleCustomerFileUpload}
            hidden
          />
        </div>
      </div>

      {(importSummary || uploadedCustomers) && (
        <div className="enterprise-insight-strip">
          <FileSpreadsheet size={16} />
          <strong>{uploadedCustomers ? "File source active" : "Import ready"}</strong>
          <span>{importSummary || `${uploadedCustomers.length} uploaded customers loaded`}</span>
        </div>
      )}

      {importError && (
        <div className="enterprise-error-banner" role="alert">
          <AlertCircle size={16} />
          {importError}
        </div>
      )}

      <div className="enterprise-search-bar">
        <Search size={18} className="search-icon" />
        <input
          className="search-input"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search borrower, ID, or segment"
        />
        <select
          className="enterprise-select-compact"
          value={risk}
          onChange={event => setRisk(event.target.value)}
        >
          {riskOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="enterprise-loading">Loading customer intelligence...</div>
      ) : error ? (
        <div className="enterprise-error-banner" role="alert">
          <AlertCircle size={16} />
          {error}
          <button
            className="enterprise-btn-link"
            onClick={() => setReloadToken(value => value + 1)}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="enterprise-card">
            <div className="enterprise-table-container">
              <table className="enterprise-customers-table">
                <thead>
                  <tr>
                    <th>Borrower</th>
                    <th>Segment</th>
                    <th>Health</th>
                    <th>Risk</th>
                    <th>Outstanding</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => (
                    <tr
                      key={customer.id}
                      className={`status-${customer.status}`}
                      onClick={() => setSelectedId(customer.id)}
                    >
                      <td>
                        <div className="customer-cell">
                          <span className="customer-name">{customer.name}</span>
                          <span className="customer-id">{customer.id}</span>
                        </div>
                      </td>
                      <td>{customer.segment}</td>
                      <td>
                        <div className="score-badge">
                          <span className="score-value">{customer.healthScore}</span>
                          <span className="score-band">{customer.healthBand}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`risk-badge risk-${customer.riskLevel}`}>
                          {customer.riskLevel}
                        </span>
                      </td>
                      <td>{formatCurrency(customer.loanBalance)}</td>
                      <td>
                        <span className={`trend-indicator ${customer.trend}`}>
                          {customer.trend === "up" ? "+" : customer.trend === "down" ? "-" : "="}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedCustomer ? (
            <div className="enterprise-card">
              <div className="card-header">
                <h3>{selectedCustomer.name} 360</h3>
                <span className={`risk-badge risk-${selectedCustomer.riskLevel}`}>
                  {Math.round(selectedCustomer.defaultProbability * 100)}% default probability
                </span>
              </div>
              <div className="enterprise-detail-grid">
                <div>
                  <span className="metric-label">Loan type</span>
                  <strong>{selectedCustomer.loanType}</strong>
                </div>
                <div>
                  <span className="metric-label">EMI</span>
                  <strong>{formatCurrency(selectedCustomer.emi)}</strong>
                </div>
                <div>
                  <span className="metric-label">DPD</span>
                  <strong>{selectedCustomer.dpd}</strong>
                </div>
                <div>
                  <span className="metric-label">Cashflow</span>
                  <strong>{formatCurrency(selectedCustomer.monthlyCashflow)}</strong>
                </div>
              </div>
              <div className="enterprise-insight-strip">
                <strong>Next best action</strong>
                <span>{selectedCustomer.nextBestAction}</span>
              </div>
              <div className="enterprise-insight-strip">
                <strong>Forecast</strong>
                <span>
                  {selectedCustomer.forecast?.action || "Continue monitoring"}{" "}
                  {selectedCustomer.forecast?.benefit
                    ? `- ${selectedCustomer.forecast.benefit}`
                    : ""}
                </span>
              </div>
            </div>
          ) : (
            <div className="enterprise-empty-state">No customers match this filter.</div>
          )}
        </>
      )}
    </div>
  );
});

CustomerIntelligence.displayName = "CustomerIntelligence";

export default CustomerIntelligence;
