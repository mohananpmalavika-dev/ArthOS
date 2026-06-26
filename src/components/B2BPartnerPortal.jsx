import React, { useMemo, useState, useEffect, useCallback } from "react";
import { ArthOSSDK } from "../lib/ArthOSSDK.js";
import { PARTNER_TIERS } from "../lib/b2bPartnerEngine.js";
import {
  B2B_TABS,
  B2B_USE_CASES,
  B2B_FORM_FIELDS,
  VALIDATION_FIELDS,
  COMMON_ACTIONS
} from "../lib/copy.ts";
import { opportunityForecast } from "../engines/opportunityForecastEngine.js";
import { calculateLoanHealth } from "../engines/LoanHealthEngine.ts";

const tabs = [...B2B_TABS, { id: "forecast", label: "Opportunity Forecast" }];

export default function B2BPartnerPortal({ userId = "demo", assessment = {} }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [adminKey, setAdminKey] = useState("");
  const [registeredApiKey, setRegisteredApiKey] = useState("");
  const [registeredPartnerId, setRegisteredPartnerId] = useState("");
  const [registeredTier, setRegisteredTier] = useState("free");

  const sdk = useMemo(() => new ArthOSSDK(""), []);

  return (
    <div className="partner-portal-container">
      {/* Header */}
      <div className="partner-header">
        <div className="partner-header-top">
          <span className="partner-header-icon">🤝</span>
          <div className="partner-header-content">
            <h1>ARTH.OS Partner Portal</h1>
            <p>B2B Partner Program · Embedded Finance Intelligence Layer · Revenue Share</p>
          </div>
        </div>
        {/* Registered Partner Badge */}
        {registeredApiKey && (
          <div className="partner-status-badge">
            <span>
              <strong>🔑 Active Partner:</strong> {registeredPartnerId} ·{" "}
              <strong>{registeredTier.charAt(0).toUpperCase() + registeredTier.slice(1)}</strong>{" "}
              plan
            </span>
            <span style={{ fontSize: 11 }}>API key saved in session</span>
          </div>
        )}
        
            
      </div>

      {/* Tabs */}
      <div className="partner-tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`partner-tab-button ${activeTab === tab.id ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="partner-tab-content">
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "register" && (
        <RegisterTab
          sdk={sdk}
          onRegistered={(apiKey, partnerId, tier) => {
            setRegisteredApiKey(apiKey);
            setRegisteredPartnerId(partnerId);
            setRegisteredTier(tier);
          }}
        />
      )}
      {activeTab === "query" && (
        <QueryTab
          sdk={sdk}
          userId={userId}
          assessment={assessment}
          defaultApiKey={registeredApiKey}
        />
      )}
      {activeTab === "validate" && <ValidateKeyTab defaultApiKey={registeredApiKey} />}
      {activeTab === "billing" && (
        <BillingTab
          defaultApiKey={registeredApiKey}
          registeredTier={registeredTier}
          sdk={sdk}
          onUpgrade={tier => setRegisteredTier(tier)}
        />
      )}
      {activeTab === "webhooks" && (
        <WebhooksTab defaultApiKey={registeredApiKey} registeredPartnerId={registeredPartnerId} />
      )}
      {activeTab === "admin" && (
        <AdminTab sdk={sdk} adminKey={adminKey} onSetAdminKey={setAdminKey} />
      )}
      {activeTab === "docs" && <DocsTab />}
      {activeTab === "forecast" && <OpportunityForecastTab />}
      </div>
    </div>
  );
}

// ─── Overview Tab ───

function OverviewTab() {
  const tiers = Object.entries(PARTNER_TIERS);

  return (
    <div className="partner-overview-section">
      <div style={{ marginBottom: 24 }}>
        <h2 className="partner-section-title">
          Why Become a Partner?
        </h2>
        <p className="partner-section-description">
          ARTH.OS is a behavioral finance intelligence layer. By integrating our API, your product
          gains the ability to{" "}
          <strong>
            score financial health, detect cognitive biases, identify emotional triggers, and
            forecast financial risk
          </strong>{" "}
          — turning every user interaction into an intelligent financial signal.
        </p>
      </div>

      {/* Use Cases */}
      <div className="partner-usecases-grid">
        {B2B_USE_CASES.map(item => (
          <div
            key={item.title}
            className="partner-usecase-card"
          >
            <div className="partner-usecase-icon">{item.icon}</div>
            <h3 className="partner-usecase-title">
              {item.title}
            </h3>
            <p className="partner-usecase-desc">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue Model Callout */}
      <div className="partner-revenue-callout">
        <h3 className="partner-revenue-title">
          💰 B2B2C Revenue Share Model
        </h3>
        <p className="partner-revenue-desc">
          ARTH.OS takes a percentage of partner revenue generated through the intelligence layer.
          The more you earn, the lower the share. Starter: 15%, Pro: 10%, Enterprise: 5%. Monthly
          subscriptions start from $299/mo.
        </p>
      </div>

      {/* Pricing Comparison */}
      <h2 className="partner-section-title">
        Plans & Pricing
      </h2>
      <div className="partner-pricing-grid">
        {tiers.map(([key, tier]) => (
          <div
            key={key}
            className={`partner-tier-card ${key === "pro" ? "tier-featured" : ""}`}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                margin: "0 0 4px",
                color: "var(--ink-0)"
              }}
            >
              {tier.name}
            </h3>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "var(--ink-0)",
                marginBottom: 12
              }}
            >
              {tier.monthlyPrice === 0 ? "Free" : `$${tier.monthlyPrice}`}
              <span style={{ fontSize: 12, fontWeight: 400, color: "var(--ink-3)" }}>/mo</span>
            </div>
            {tier.annualPrice > 0 && (
              <div style={{ fontSize: 11, color: "var(--green-700)", marginBottom: 8 }}>
                ${tier.annualPrice}/yr{" "}
                <strong>
                  (save ${(tier.monthlyPrice * 12 - tier.annualPrice).toLocaleString()})
                </strong>
              </div>
            )}
            <div style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 4 }}>
              <strong>{tier.rateLimit.requestsPerMinute}</strong> req/min ·{" "}
              <strong>{tier.rateLimit.requestsPerMonth.toLocaleString()}</strong> req/mo
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 4 }}>
              Up to{" "}
              <strong>
                {tier.maxUsers === Infinity ? "unlimited" : tier.maxUsers.toLocaleString()}
              </strong>{" "}
              users
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 4 }}>
              <strong>{tier.apiKeys}</strong> API keys
            </div>
            {tier.revenueSharePct > 0 && (
              <div style={{ fontSize: 12, color: "var(--orange-700)", marginBottom: 8 }}>
                Revenue share: <strong>{tier.revenueSharePct}%</strong>
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ink-3)",
                  marginBottom: 6,
                  textTransform: "uppercase"
                }}
              >
                Features
              </div>
              {tier.features.map(f => (
                <div
                  key={f}
                  style={{
                    fontSize: 12,
                    color: "var(--green-700)",
                    padding: "2px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  ✓ {f.replaceAll("_", " ")}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Register Tab ───

function RegisterTab({ sdk, onRegistered }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    tier: "free",
    useCase: "",
    billingCycle: "monthly"
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRegister = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await sdk.registerPartner({
        name: form.name,
        email: form.email,
        tier: form.tier,
        useCase: form.useCase,
        billingCycle: form.billingCycle
      });
      setResult(res);
      onRegistered(res.apiKey, res.partner.id, res.partner.tier);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const tierOptions = Object.entries(PARTNER_TIERS).map(([key, val]) => ({
    value: key,
    label: `${val.name} (${val.monthlyPrice === 0 ? "Free" : `$${val.monthlyPrice}/mo`})`
  }));

  return (
    <div className="partner-register-form-container">
      <h2 className="partner-register-title">
        Register as an ARTH.OS Partner
      </h2>
      <form onSubmit={handleRegister} style={{ display: "grid", gap: 12 }}>
        <div className="partner-form-group">
          <input
            type="text"
            placeholder={B2B_FORM_FIELDS.companyName.placeholder}
            required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="partner-form-input"
          />
        </div>
        <div className="partner-form-group">
          <input
            type="email"
            placeholder={B2B_FORM_FIELDS.contactEmail.placeholder}
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="partner-form-input"
          />
        </div>
        <div className="partner-form-group">
          <select
            value={form.tier}
            onChange={e => setForm({ ...form, tier: e.target.value })}
            className="partner-form-select"
          >
            {tierOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="partner-form-label">
            Billing Cycle
          </label>
          <div className="partner-form-toggle">
            {["monthly", "annual"].map(cycle => (
              <button
                type="button"
                key={cycle}
                onClick={() => setForm({ ...form, billingCycle: cycle })}
                className={`partner-form-toggle-btn ${form.billingCycle === cycle ? "active" : ""}`}
              >
                {cycle === "monthly" ? "Monthly" : "Annual (save 17%)"}
              </button>
            ))}
          </div>
        </div>
        <div className="partner-form-group">
          <input
            type="text"
            placeholder={B2B_FORM_FIELDS.useCase.placeholder}
            value={form.useCase}
            onChange={e => setForm({ ...form, useCase: e.target.value })}
            className="partner-form-input"
          />
        </div>

        <button type="submit" disabled={loading} className="partner-form-submit">
          {loading ? "Registering..." : "Register & Get API Key"}
        </button>
      </form>

      {error && <div className="partner-alert partner-alert-error">{error}</div>}

      {result && (
        <div className="partner-alert partner-alert-success">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            ✅ Partner Registered Successfully
          </div>
          <div className="partner-result-box">
            <div>
              <strong>Partner ID:</strong> {result.partner.id}
            </div>
            <div>
              <strong>Company:</strong> {result.partner.name}
            </div>
            <div>
              <strong>Plan:</strong> {result.partner.tierName} (
              {result.partner.billing?.plan || "free"})
            </div>
            <div>
              <strong>Features:</strong> {result.partner.features.join(", ")}
            </div>
            <div>
              <strong>Monthly Price:</strong> ${result.partner.billing?.monthlyPrice || 0}/mo
            </div>
            <div>
              <strong>Next Billing:</strong>{" "}
              {result.partner.billing?.nextBillingDate
                ? new Date(result.partner.billing.nextBillingDate).toLocaleDateString()
                : "N/A"}
            </div>
            <div>
              <strong>API Key:</strong>
            </div>
            <code className="partner-result-key">
              {result.apiKey}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(result.apiKey);
                alert("API Key copied!");
              }}
              className="partner-form-submit"
              style={{ marginTop: 8, padding: "6px 12px", fontSize: 12 }}
            >
              Copy API Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Validate Key Tab ───

function ValidateKeyTab({ defaultApiKey }) {
  const [apiKey, setApiKey] = useState(defaultApiKey || "");
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleValidate = async () => {
    setValidating(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/b2b/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Validation failed");
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="partner-register-form-container">
      <h2 className="partner-register-title">
        ✓ Validate API Key
      </h2>
      <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>
        Check that your API key is valid and see your plan details, rate limits, and usage.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder={B2B_FORM_FIELDS.apiKey.placeholder}
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          className="partner-form-input"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          disabled={validating || !apiKey}
          onClick={handleValidate}
          className="partner-form-submit"
        >
          {validating ? "..." : "Validate"}
        </button>
      </div>

      {error && (
        <div className="partner-alert partner-alert-error">
          {error}
        </div>
      )}

      {result && result.valid && (
        <div>
          <div className="partner-alert partner-alert-success">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
              ✅ Valid API Key
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-0)", display: "grid", gap: 4 }}>
              <div>
                <strong>Partner:</strong> {result.partner.name} ({result.partner.email})
              </div>
              <div>
                <strong>Plan:</strong> {result.plan.name} · {result.plan.tier} · $
                {result.plan.monthlyPrice}/mo
              </div>
              <div>
                <strong>Status:</strong> {result.partner.status} · Payment:{" "}
                {result.plan.paymentStatus}
              </div>
              <div>
                <strong>Features:</strong> {result.plan.features.length} features
              </div>
              <div>
                <strong>Next Billing:</strong>{" "}
                {result.plan.nextBillingDate
                  ? new Date(result.plan.nextBillingDate).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div className="partner-metric-box">
              <div className="partner-metric-label">
                Rate Limit (per minute)
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-0)" }}>
                {result.rateLimit.remaining}/{result.rateLimit.perMinute}
              </div>
            </div>
            <div className="partner-metric-box">
              <div className="partner-metric-label">
                Monthly Limit
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-0)" }}>
                {result.rateLimit.monthlyRemaining.toLocaleString()}/
                {result.rateLimit.perMonth.toLocaleString()}
              </div>
            </div>
            <div className="partner-metric-box">
              <div className="partner-metric-label">
                Total Requests
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-0)" }}>
                {result.usage.totalRequests.toLocaleString()}
              </div>
            </div>
            <div className="partner-metric-box">
              <div className="partner-metric-label">
                Active Users
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-0)" }}>
                {result.usage.activeUsersThisMonth}
              </div>
            </div>
          </div>

          <details style={{ marginTop: 12 }}>
            <summary
              style={{ fontSize: 12, color: "var(--gray-500)", cursor: "pointer", marginBottom: 8 }}
            >
              {COMMON_ACTIONS.viewFullResponse}
            </summary>
            <pre
              style={{
                fontSize: 10,
                backgroundColor: "var(--gray-900)",
                color: "var(--gray-50)",
                padding: 12,
                borderRadius: 8,
                overflowX: "auto",
                maxHeight: 300
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

// ─── Query Tab ───

function QueryTab({ sdk, userId, assessment, defaultApiKey }) {
  const [apiKey, setApiKey] = useState(defaultApiKey || "");
  const [queryMode, setQueryMode] = useState("standard");
  const [loanData, setLoanData] = useState({
    loanType: "Personal Loan",
    loanBalance: 120000,
    emi: 4500,
    tenureMonths: 36,
    dpd: 5,
    creditScore: 690
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (defaultApiKey) {
      setApiKey(defaultApiKey);
    }
  }, [defaultApiKey]);

  const handleQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      sdk.setApiKey(apiKey);
      let res;

      if (queryMode === "borrower") {
        res = await sdk.getBorrowerIntelligence({
          userId,
          profile: assessment.profile,
          behaviour: assessment.behaviour,
          awareness: assessment.awareness,
          habits: assessment.habits,
          loanData,
          history: {
            paymentHistory: [
              { date: "2024-06-05", status: "paid" },
              { date: "2024-05-05", status: "paid" },
              { date: "2024-04-10", status: "late" },
              { date: "2024-03-05", status: "paid" }
            ],
            dpdHistory: [
              { month: "Apr", dpd: 7 },
              { month: "May", dpd: 0 },
              { month: "Jun", dpd: loanData.dpd }
            ]
          }
        });
      } else {
        res = await sdk.getIntelligence({
          userId,
          profile: assessment.profile,
          behaviour: assessment.behaviour,
          awareness: assessment.awareness,
          habits: assessment.habits
        });
      }

      setResult(res);
    } catch (err) {
      setError(err.message || "Query failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLoanDataChange = (field, value) => {
    setLoanData(prev => ({
      ...prev,
      [field]: field === "loanType" ? value : Number(value)
    }));
  };

  return (
    <div className="partner-query-form-container">
      <h2 className="partner-register-title">
        Query Embedded Finance Intelligence
      </h2>
      <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>
        This is a demo of the core ARTH.OS intelligence API. It takes a user's financial profile
        and returns a comprehensive analysis of their financial health, behavior, and potential
        risks.
      </p>

      <div className="partner-query-mode-toggle" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={`partner-form-toggle-btn ${queryMode === "standard" ? "active" : ""}`}
          onClick={() => setQueryMode("standard")}
        >
          Standard Intelligence
        </button>
        <button
          type="button"
          className={`partner-form-toggle-btn ${queryMode === "borrower" ? "active" : ""}`}
          onClick={() => setQueryMode("borrower")}
        >
          Borrower Intelligence
        </button>
      </div>

      {queryMode === "borrower" && (
        <div className="partner-loan-data-grid" style={{ display: "grid", gap: 12, marginBottom: 16 }}>
          <div className="partner-form-group">
            <label className="partner-form-label">Loan Type</label>
            <input
              type="text"
              value={loanData.loanType}
              onChange={e => handleLoanDataChange("loanType", e.target.value)}
              className="partner-form-input"
            />
          </div>
          <div className="partner-form-group">
            <label className="partner-form-label">Loan Balance</label>
            <input
              type="number"
              value={loanData.loanBalance}
              onChange={e => handleLoanDataChange("loanBalance", e.target.value)}
              className="partner-form-input"
            />
          </div>
          <div className="partner-form-group">
            <label className="partner-form-label">Monthly EMI</label>
            <input
              type="number"
              value={loanData.emi}
              onChange={e => handleLoanDataChange("emi", e.target.value)}
              className="partner-form-input"
            />
          </div>
          <div className="partner-form-group">
            <label className="partner-form-label">Tenure (months)</label>
            <input
              type="number"
              value={loanData.tenureMonths}
              onChange={e => handleLoanDataChange("tenureMonths", e.target.value)}
              className="partner-form-input"
            />
          </div>
          <div className="partner-form-group">
            <label className="partner-form-label">Days Past Due</label>
            <input
              type="number"
              value={loanData.dpd}
              onChange={e => handleLoanDataChange("dpd", e.target.value)}
              className="partner-form-input"
            />
          </div>
          <div className="partner-form-group">
            <label className="partner-form-label">Credit Score</label>
            <input
              type="number"
              value={loanData.creditScore}
              onChange={e => handleLoanDataChange("creditScore", e.target.value)}
              className="partner-form-input"
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder={B2B_FORM_FIELDS.apiKey.placeholder}
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          className="partner-form-input"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          disabled={loading || !apiKey}
          onClick={handleQuery}
          className="partner-form-submit"
        >
          {loading ? "..." : "Run Intelligence Query"}
        </button>
      </div>

      {error && (
        <div className="partner-alert partner-alert-error">
          {error}
        </div>
      )}

      {result && (
        <div>
          <div className="partner-alert partner-alert-success">
            ✅ Query Successful
          </div>
          <details style={{ marginTop: 12 }}>
            <summary
              style={{ fontSize: 12, color: "var(--gray-500)", cursor: "pointer", marginBottom: 8 }}
            >
              {COMMON_ACTIONS.viewFullResponse}
            </summary>
            <pre
              style={{
                fontSize: 10,
                backgroundColor: "var(--gray-900)",
                color: "var(--gray-50)",
                padding: 12,
                borderRadius: 8,
                overflowX: "auto",
                maxHeight: 500
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

// ─── Billing Tab ───

function BillingTab({ defaultApiKey, registeredTier, sdk, onUpgrade }) {
  const [apiKey, setApiKey] = useState(defaultApiKey || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [portalUrl, setPortalUrl] = useState(null);
  const [selectedTier, setSelectedTier] = useState(registeredTier || "free");
  const [billingCycle, setBillingCycle] = useState("monthly");

  const handleManageBilling = async () => {
    setLoading(true);
    setError(null);
    setPortalUrl(null);
    try {
      sdk.setApiKey(apiKey);
      const res = await sdk.getBillingPortalUrl();
      if (res.portalUrl) {
        setPortalUrl(res.portalUrl);
        window.open(res.portalUrl, "_blank");
      } else {
        throw new Error(res.error || "Could not retrieve billing portal URL.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    setPortalUrl(null);
    try {
      sdk.setApiKey(apiKey);
      const res = await sdk.upgradeSubscription({
        tier: selectedTier,
        billingCycle: billingCycle
      });
      if (res.checkoutUrl) {
        setPortalUrl(res.checkoutUrl);
        window.open(res.checkoutUrl, "_blank");
        onUpgrade(selectedTier);
      } else {
        throw new Error(res.error || "Could not retrieve checkout URL.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tierOptions = Object.entries(PARTNER_TIERS)
    .filter(([key]) => key !== "free")
    .map(([key, val]) => ({
      value: key,
      label: `${val.name} ($${val.monthlyPrice}/mo)`
    }));

  return (
    <div className="partner-billing-container">
      <h2 className="partner-section-title">
        Billing & Subscription
      </h2>
      <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>
        Manage your subscription, view invoices, and upgrade your plan.
      </p>

      <div className="partner-form-group">
        <input
          type="text"
          placeholder={B2B_FORM_FIELDS.apiKey.placeholder}
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          className="partner-form-input"
        />
      </div>

      {/* Upgrade Section */}
      {registeredTier === "free" && (
        <div className="partner-upgrade-section">
          <h3 className="partner-subsection-title">
            Upgrade to a Paid Plan
          </h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <select
              value={selectedTier}
              onChange={e => setSelectedTier(e.target.value)}
              className="partner-form-select"
              style={{ flex: 1 }}
            >
              {tierOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="partner-form-toggle" style={{ flexShrink: 0 }}>
              {["monthly", "annual"].map(cycle => (
                <button
                  type="button"
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className={`partner-form-toggle-btn ${billingCycle === cycle ? "active" : ""}`}
                >
                  {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            disabled={loading || !apiKey}
            onClick={handleUpgrade}
            className="partner-form-submit"
          >
            {loading ? "..." : `Upgrade to ${selectedTier}`}
          </button>
        </div>
      )}

      {/* Manage Billing Section */}
      {registeredTier !== "free" && (
        <div className="partner-manage-billing-section">
          <h3 className="partner-subsection-title">
            Manage Your Subscription
          </h3>
          <button
            type="button"
            disabled={loading || !apiKey}
            onClick={handleManageBilling}
            className="partner-form-submit"
          >
            {loading ? "..." : "Open Customer Portal"}
          </button>
        </div>
      )}

      {error && (
        <div className="partner-alert partner-alert-error" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}
      {portalUrl && (
        <div className="partner-alert partner-alert-success" style={{ marginTop: 12 }}>
          ✅ Redirecting to billing portal...
        </div>
      )}
    </div>
  );
}

// ─── Webhooks Tab ───

function WebhooksTab({ defaultApiKey, registeredPartnerId }) {
  const [apiKey, setApiKey] = useState(defaultApiKey || "");
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newEvent, setNewEvent] = useState("user.risk_profile.changed");

  const availableEvents = [
    "user.risk_profile.changed",
    "user.financial_health.updated",
    "user.goal.achieved",
    "user.subscription.cancelled",
    "user.behavioral_flag.raised"
  ];

  const fetchWebhooks = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/b2b/webhooks?partnerId=${registeredPartnerId}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch webhooks");
      setWebhooks(data.webhooks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiKey, registeredPartnerId]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleAddWebhook = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/b2b/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          partnerId: registeredPartnerId,
          url: newWebhookUrl,
          event: newEvent
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add webhook");
      setNewWebhookUrl("");
      fetchWebhooks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async webhookId => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/b2b/webhooks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ partnerId: registeredPartnerId, webhookId })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete webhook");
      }
      fetchWebhooks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="partner-webhooks-container">
      <h2 className="partner-section-title">
        Webhooks
      </h2>
      <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>
        Configure webhooks to receive real-time notifications for important events.
      </p>

      <div className="partner-form-group">
        <input
          type="text"
          placeholder={B2B_FORM_FIELDS.apiKey.placeholder}
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          className="partner-form-input"
        />
      </div>

      <div className="partner-add-webhook-form">
        <h3 className="partner-subsection-title">
          Add New Webhook
        </h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            type="url"
            placeholder="https://your-endpoint.com/webhook"
            value={newWebhookUrl}
            onChange={e => setNewWebhookUrl(e.target.value)}
            className="partner-form-input"
            style={{ flex: 1 }}
          />
          <select
            value={newEvent}
            onChange={e => setNewEvent(e.target.value)}
            className="partner-form-select"
          >
            {availableEvents.map(event => (
              <option key={event} value={event}>
                {event}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={loading || !newWebhookUrl}
          onClick={handleAddWebhook}
          className="partner-form-submit"
        >
          {loading ? "..." : "Add Webhook"}
        </button>
      </div>

      {error && (
        <div className="partner-alert partner-alert-error" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      <div className="partner-webhooks-list">
        <h3 className="partner-subsection-title">
          Active Webhooks
        </h3>
        {webhooks.length === 0 && !loading && (
          <p style={{ fontSize: 12, color: "var(--ink-2)" }}>
            No webhooks configured.
          </p>
        )}
        {webhooks.map(hook => (
          <div key={hook.id} className="partner-webhook-item">
            <div className="partner-webhook-details">
              <div className="partner-webhook-url">
                {hook.url}
              </div>
              <div className="partner-webhook-event">
                {hook.event}
              </div>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDeleteWebhook(hook.id)}
              className="partner-webhook-delete-btn"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin Tab ───

function AdminTab({ sdk, adminKey, onSetAdminKey }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      sdk.setAdminKey(adminKey);
      const res = await sdk.getAdminDashboard();
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="partner-admin-container">
      <h2 className="partner-section-title">
        Admin Dashboard
      </h2>
      <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>
        Super-admin access to view all partners and system-wide metrics.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="password"
          placeholder="Enter Admin Key"
          value={adminKey}
          onChange={e => onSetAdminKey(e.target.value)}
          className="partner-form-input"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          disabled={loading || !adminKey}
          onClick={handleFetchData}
          className="partner-form-submit"
        >
          {loading ? "..." : "Fetch Admin Data"}
        </button>
      </div>

      {error && (
        <div className="partner-alert partner-alert-error">
          {error}
        </div>
      )}

      {data && (
        <div className="admin-dashboard-content">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 16
            }}
          >
            <div className="partner-metric-box">
              <div className="partner-metric-label">
                Total Partners
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-0)" }}>
                {data.totalPartners}
              </div>
            </div>
            <div className="partner-metric-box">
              <div className="partner-metric-label">
                Total Revenue (MRR)
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-0)" }}>
                ${data.totalMRR.toLocaleString()}
              </div>
            </div>
            <div className="partner-metric-box">
              <div className="partner-metric-label">
                Total API Calls (Month)
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-0)" }}>
                {data.totalApiUsage.toLocaleString()}
              </div>
            </div>
            <div className="partner-metric-box">
              <div className="partner-metric-label">
                Total Active Users
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-0)" }}>
                {data.totalActiveUsers.toLocaleString()}
              </div>
            </div>
          </div>

          <h3 className="partner-subsection-title">
            All Partners
          </h3>
          <div className="admin-partners-table">
            <div className="admin-partners-header">
              <div>Partner</div>
              <div>Plan</div>
              <div>MRR</div>
              <div>Usage</div>
            </div>
            {data.partners.map(p => (
              <div key={p.id} className="admin-partners-row">
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-2)" }}>
                    {p.id}
                  </div>
                </div>
                <div>
                  {p.tier}
                </div>
                <div>
                  ${p.mrr.toLocaleString()}
                </div>
                <div>
                  {p.usage.toLocaleString()} reqs
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Docs Tab ───

function DocsTab() {
  return (
    <div className="partner-docs-container">
      <h2 className="partner-section-title">
        API Documentation
      </h2>
      <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>
        A brief overview of the main endpoints and how to use them.
      </p>

      <div className="api-endpoint-card">
        <h3 className="api-endpoint-title">
          POST /api/v1/intelligence
        </h3>
        <p className="api-endpoint-description">
          The core endpoint. Provide user data and receive a comprehensive financial intelligence
          report.
        </p>
        <div className="api-endpoint-details">
          <div className="api-endpoint-auth">
            <strong>Authentication:</strong> Bearer Token (API Key)
          </div>
          <div className="api-endpoint-body">
            <strong>Body:</strong>
            <pre>
              {`{
  "userId": "string",
  "profile": { ... },
  "behaviour": { ... },
  "awareness": { ... },
  "habits": { ... }
}`}
            </pre>
          </div>
        </div>
      </div>

      <div className="api-endpoint-card">
        <h3 className="api-endpoint-title">
          GET /api/v1/partners/me
        </h3>
        <p className="api-endpoint-description">
          Retrieve details about your partner account, including usage and rate limits.
        </p>
        <div className="api-endpoint-details">
          <div className="api-endpoint-auth">
            <strong>Authentication:</strong> Bearer Token (API Key)
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Opportunity Forecast Tab ───

function OpportunityForecastTab() {
  // Mock user data for demonstration. In a real application, this would come from an API.
  const mockUsers = [
    {
      id: "user-001",
      name: "Rohan Sharma",
      profile: {
        survivalMonths: 8.2,
        debtManagementScore: 780,
        monthlySavings: 25000,
        monthlyExpense: 55000,
        // New fields for LoanHealthEngine
        salaryDelay: 0,
        gamblingExpense: false,
        emergencySavings: 150000,
        emi: 20000,
        stressLevel: 30,
        loanShopping: false,
      },
    },
    {
      id: "user-002",
      name: "Priya Mehta",
      profile: {
        survivalMonths: 1.5,
        debtManagementScore: 620,
        monthlySavings: 5000,
        monthlyExpense: 45000,
        // New fields for LoanHealthEngine
        salaryDelay: 3,
        gamblingExpense: false,
        emergencySavings: 20000,
        emi: 22000,
        stressLevel: 85,
        loanShopping: true,
      },
    },
    {
      id: "user-003",
      name: "Amit Singh",
      profile: {
        survivalMonths: 3.1,
        debtManagementScore: 710,
        monthlySavings: 12000,
        monthlyExpense: 60000,
        // New fields for LoanHealthEngine
        salaryDelay: 1,
        gamblingExpense: true,
        emergencySavings: 50000,
        emi: 18000,
        stressLevel: 60,
        loanShopping: false,
      },
    },
     {
      id: "user-004",
      name: "Sunita Rao",
      profile: {
        survivalMonths: 12.0,
        debtManagementScore: 820,
        monthlySavings: 40000,
        monthlyExpense: 70000,
         // New fields for LoanHealthEngine
        salaryDelay: 0,
        gamblingExpense: false,
        emergencySavings: 500000,
        emi: 30000,
        stressLevel: 20,
        loanShopping: false,
      },
    },
  ];

  // Calculate opportunities and loan health for each user
  const opportunities = useMemo(() => mockUsers.map(user => ({
    ...user,
    forecast: opportunityForecast(user.profile),
    loanHealth: calculateLoanHealth(user.profile),
  })), []);

  // Define the next best action based on user profile
  const getNextBestAction = (user) => {
    const { survivalMonths, debtManagementScore } = user.profile;
    const { risk } = user.loanHealth;

    if (risk === 'High') {
        return { action: "Offer Debt Restructuring", priority: "Critical" };
    }
    if (risk === 'Medium') {
        return { action: "Offer Financial Counseling", priority: "High" };
    }
    if (survivalMonths > 6 && debtManagementScore > 750) {
      return { action: "Offer Investment Products", priority: "Medium" };
    }
    if (survivalMonths > 3) {
      return { action: "Offer Top-up Loan", priority: "Low" };
    }
    return { action: "Monitor", priority: "Low" };
  };

  const priorityOrder = { "Critical": 1, "High": 2, "Medium": 3, "Low": 4 };

  // Create a prioritized action queue
  const actionQueue = useMemo(() => opportunities
    .map(user => ({
      ...user,
      nextBestAction: getNextBestAction(user),
    }))
    .sort((a, b) => priorityOrder[a.nextBestAction.priority] - priorityOrder[b.nextBestAction.priority]),
  [opportunities]);

  const getRiskChipClass = (risk) => {
    switch (risk) {
      case 'High': return 'risk-chip-high';
      case 'Medium': return 'risk-chip-medium';
      case 'Low': return 'risk-chip-low';
      default: return '';
    }
  };

  return (
    <div className="opportunity-forecast-container">
      <h2 className="partner-section-title">Next Best Action Queue</h2>
      <p className="partner-section-description">
        Prioritized customer interventions based on behavioral and financial data.
      </p>
      <div className="action-queue-table">
        <div className="action-queue-header">
          <div>Customer</div>
          <div>Borrower DNA</div>
          <div>Next Best Action</div>
          <div>Opportunity</div>
        </div>
        {actionQueue.map(user => (
          <div key={user.id} className="action-queue-row">
            <div className="customer-info">
              <div className="customer-name">{user.name}</div>
              <div className="customer-id">{user.id}</div>
            </div>
            <div className="borrower-dna">
              <div className="dna-score">
                <span className="dna-score-label">DNA Score:</span>
                <span className="dna-score-value">{user.loanHealth.score}</span>
              </div>
              <div className="dna-risk">
                 <span className={`risk-chip ${getRiskChipClass(user.loanHealth.risk)}`}>
                  {user.loanHealth.risk} Risk
                </span>
              </div>
            </div>
            <div className="next-best-action">
              <div className={`action-priority-${user.nextBestAction.priority.toLowerCase()}`}>
                {user.nextBestAction.priority}
              </div>
              <div className="action-text">{user.nextBestAction.action}</div>
            </div>
            <div className="opportunity-details">
              <div className="opportunity-action">{user.forecast.action}</div>
              <div className="opportunity-benefit">{user.forecast.benefit}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}