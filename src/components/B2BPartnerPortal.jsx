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

const tabs = B2B_TABS;

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
                color: "var(--text)"
              }}
            >
              {tier.name}
            </h3>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "var(--text)",
                marginBottom: 12
              }}
            >
              {tier.monthlyPrice === 0 ? "Free" : `$${tier.monthlyPrice}`}
              <span style={{ fontSize: 12, fontWeight: 400, color: "var(--ink-3)" }}>/mo</span>
            </div>
            {tier.annualPrice > 0 && (
              <div style={{ fontSize: 11, color: "var(--green)", marginBottom: 8 }}>
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
              <div style={{ fontSize: 12, color: "var(--coral)", marginBottom: 8 }}>
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
                    color: "var(--green)",
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
      const res = await sdk.getIntelligence({
        userId,
        profile: assessment.profile,
        behaviour: assessment.behaviour,
        awareness: assessment.awareness,
        habits: assessment.habits
      });
      setResult(res);
    } catch (err) {
      setError(err.message || "Query failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="partner-query-form-container">
      <h2 className="partner-register-title">
        Query Embedded Finance Intelligence
      </h2>
      <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>
        Use your API key to query the intelligence layer. The response includes health score, risk
        profile, cognitive biases, emotional triggers, and more — based on your plan tier.
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
          disabled={loading || !apiKey}
          onClick={handleQuery}
          className="partner-form-submit"
        >
          {loading ? "..." : "Query"}
        </button>
      </div>

      {error && (
        <div className="partner-alert partner-alert-error">
          {error}
        </div>
      )}

      {result && (
        <div className="partner-result-box">
          <div style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 12 }}>
            Plan: <strong>{result.usage?.plan}</strong> · Requests this month:{" "}
            <strong>{result.usage?.requestsThisMonth}</strong> · Rate limit:{" "}
            <strong>
              {result.usage?.rateLimit?.remaining}/{result.usage?.rateLimit?.perMinute}
            </strong>{" "}
            per min
          </div>
          <pre
            style={{
              fontSize: 11,
              backgroundColor: "var(--gray-900)",
              color: "var(--gray-50)",
              padding: 16,
              borderRadius: 8,
              overflowX: "auto",
              maxHeight: 500
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Billing Tab ───

function BillingTab({ defaultApiKey, registeredTier, sdk, onUpgrade }) {
  const [apiKey, setApiKey] = useState(defaultApiKey || "");
  const [selectedTier, setSelectedTier] = useState(registeredTier || "free");
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeResult, setUpgradeResult] = useState(null);
  const [upgradeError, setUpgradeError] = useState(null);

  useEffect(() => {
    if (defaultApiKey) {
      setApiKey(defaultApiKey);
    }
  }, [defaultApiKey]);

  useEffect(() => {
    if (registeredTier) {
      setSelectedTier(registeredTier);
    }
  }, [registeredTier]);

  const tiers = Object.entries(PARTNER_TIERS);

  const handleUpgrade = async tier => {
    setUpgrading(true);
    setUpgradeError(null);
    setUpgradeResult(null);
    try {
      // In production, this would call a Stripe checkout or similar
      // For the demo, we simulate a successful upgrade
      const res = await fetch("/api/b2b/admin/change-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ partnerId: "self", newTier: tier })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upgrade failed");
      }
      setSelectedTier(tier);
      onUpgrade(tier);
      setUpgradeResult({
        tier,
        price: PARTNER_TIERS[tier].monthlyPrice,
        name: PARTNER_TIERS[tier].name
      });
    } catch (err) {
      setUpgradeError(err.message);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="partner-billing-section">
      <div className="partner-register-form-container">
        <h2 className="partner-register-title">
          💰 Billing & Plan Management
        </h2>
        {!apiKey ? (
          <p style={{ fontSize: 13, color: "var(--ink-2)" }}>
            Register a partner first to manage your billing and upgrade your plan.
          </p>
        ) : (
          <>
            <div className="partner-alert partner-alert-info" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cyan)" }}>
                Current Plan: {PARTNER_TIERS[selectedTier]?.name || "Free"} · $
                {PARTNER_TIERS[selectedTier]?.monthlyPrice || 0}/mo
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 4 }}>
                {PARTNER_TIERS[selectedTier]?.features.length} features · 
                {PARTNER_TIERS[selectedTier]?.rateLimit.requestsPerMinute} req/min · Revenue share:{" "}
                {PARTNER_TIERS[selectedTier]?.revenueSharePct || 0}%
              </div>
            </div>

            <h3 className="partner-form-label" style={{ marginBottom: 12 }}>Change Plan</h3>
            <div className="partner-pricing-grid">
              {tiers.map(([key, tier]) => {
                const isCurrent = key === selectedTier;
                return (
                  <div
                    key={key}
                    className={`partner-tier-card ${isCurrent ? "tier-current" : ""}`}
                  >
                    {isCurrent && (
                      <div
                        style={{
                          position: "absolute",
                          top: -8,
                          right: 10,
                          padding: "1px 8px",
                          backgroundColor: "var(--cyan)",
                          color: "var(--ink-0)",
                          borderRadius: 8,
                          fontSize: 10,
                          fontWeight: 700
                        }}
                      >
                        Current
                      </div>
                    )}
                    <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: "var(--ink-0)" }}>
                      {tier.name}
                    </h4>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-0)", marginBottom: 4 }}>
                      {tier.monthlyPrice === 0 ? "Free" : `$${tier.monthlyPrice}`}
                      <span style={{ fontSize: 10, fontWeight: 400, color: "var(--ink-2)" }}>/mo</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-2)", marginBottom: 8 }}>
                      {tier.rateLimit.requestsPerMinute} req/min ·{" "}
                      {tier.rateLimit.requestsPerMonth.toLocaleString()} req/mo ·{" "}
                      {tier.maxUsers === Infinity ? "∞" : tier.maxUsers.toLocaleString()} users
                    </div>
                    {tier.revenueSharePct > 0 && (
                      <div style={{ fontSize: 11, color: "var(--red-600)", marginBottom: 8 }}>
                        Rev share: {tier.revenueSharePct}%
                      </div>
                    )}
                    {!isCurrent && (
                      <button
                        type="button"
                        disabled={upgrading}
                        onClick={() => handleUpgrade(key)}
                        className="partner-form-submit"
                        style={{ width: "100%", marginTop: 8 }}
                      >
                        {upgrading
                          ? "..."
                          : selectedTier === "free" && key === "starter"
                            ? "Upgrade"
                            : key === "enterprise"
                              ? "Contact Sales"
                              : `Switch to ${tier.name}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {upgradeResult && (
              <div className="partner-alert partner-alert-success" style={{ marginTop: 16 }}>
                ✅ Upgraded to {upgradeResult.name} (${upgradeResult.price}/mo) — New features and rate limits are active immediately.
              </div>
            )}

            {upgradeError && (
              <div className="partner-alert partner-alert-error" style={{ marginTop: 16 }}>
                {upgradeError}
              </div>
            )}
          </>
        )}
      </div>

      {/* Revenue Share Calculator */}
      <div className="partner-register-form-container">
        <h3 className="partner-register-title" style={{ fontSize: 16 }}>📊 Revenue Share Calculator</h3>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>
          Estimate how much ARTH.OS would earn from your partner revenue at different plan tiers.
        </p>
        <RevenueShareCalculator currentTier={selectedTier} />
      </div>
    </div>
  );
}

function RevenueShareCalculator({ currentTier }) {
  const [partnerRevenue, setPartnerRevenue] = useState(10000);
  const tierConfig = PARTNER_TIERS[currentTier] || PARTNER_TIERS.free;
  const pct = tierConfig.revenueSharePct;
  const arthosShare = partnerRevenue * (pct / 100);
  const partnerNet = partnerRevenue - arthosShare;

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label className="partner-form-label">Your monthly revenue from intelligence layer ($)</label>
        <input
          type="range"
          min={0}
          max={100000}
          step={1000}
          value={partnerRevenue}
          onChange={e => setPartnerRevenue(Number(e.target.value))}
          style={{ width: "100%" }}
        />
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-0)", marginTop: 4 }}>
          ${partnerRevenue.toLocaleString()}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div className="partner-metric-box">
          <div className="partner-metric-label">Revenue Share</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--cyan)" }}>{pct}%</div>
        </div>
        <div className="partner-metric-box">
          <div className="partner-metric-label">ARTH.OS Share</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--orange-700)" }}>
            ${Math.round(arthosShare).toLocaleString()}
          </div>
        </div>
        <div className="partner-metric-box">
          <div className="partner-metric-label">Your Net</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--green-700)" }}>
            ${Math.round(partnerNet).toLocaleString()}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: "var(--ink-2)" }}>
        Based on your current <strong>{tierConfig.name}</strong> plan ({pct}% revenue share).
        Upgrade to Pro (10%) or Enterprise (5%) to keep more.
      </div>
    </div>
  );
}

// ─── Webhooks Tab ───

function WebhooksTab({ defaultApiKey, registeredPartnerId }) {
  const [apiKey, setApiKey] = useState(defaultApiKey || "");
  const [partnerId, setPartnerId] = useState(registeredPartnerId || "");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [availableEvents, setAvailableEvents] = useState([]);

  useEffect(() => {
    if (defaultApiKey) {
      setApiKey(defaultApiKey);
    }
  }, [defaultApiKey]);

  useEffect(() => {
    if (registeredPartnerId) {
      setPartnerId(registeredPartnerId);
    }
  }, [registeredPartnerId]);

  const fetchWebhooks = async () => {
    if (!apiKey || !partnerId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/b2b/webhooks?partnerId=${encodeURIComponent(partnerId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch webhooks");
      }
      setWebhooks(data.webhooks || []);
      setAvailableEvents(data.availableEvents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const registerWebhook = async () => {
    if (!apiKey || !partnerId || !webhookUrl) {
      return;
    }
    setRegistering(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/b2b/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ partnerId, url: webhookUrl })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register webhook");
      }
      setResult(data);
      setWebhookUrl("");
      await fetchWebhooks();
    } catch (err) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const deleteWebhook = async url => {
    if (!apiKey || !partnerId) {
      return;
    }
    setError(null);
    try {
      const res = await fetch("/api/b2b/webhooks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ partnerId, url })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete webhook");
      }
      await fetchWebhooks();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="partner-query-form-container">
        <h2 className="partner-register-title">🔔 Webhook Management</h2>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>
          Receive real-time events when partners register, usage thresholds are hit, invoices are
          created, and more.
        </p>

        {!apiKey || !partnerId ? (
          <p style={{ fontSize: 13, color: "var(--ink-2)" }}>
            Register a partner first and enter your API key and Partner ID to manage webhooks.
          </p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                type="text"
                placeholder={B2B_FORM_FIELDS.partnerId.placeholder}
                value={partnerId}
                onChange={e => setPartnerId(e.target.value)}
                style={{ ...inputStyle, flex: 1, fontSize: 12 }}
              />
              <button
                type="button"
                disabled={loading}
                onClick={fetchWebhooks}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "var(--teal-700)",
                  color: "var(--white)",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 12
                }}
              >
                {loading ? "..." : "Refresh"}
              </button>
            </div>

            {/* Register new webhook */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                type="url"
                placeholder={B2B_FORM_FIELDS.webhookUrl.placeholder}
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                style={{ ...inputStyle, flex: 1, fontSize: 12 }}
              />
              <button
                type="button"
                disabled={registering || !webhookUrl}
                onClick={registerWebhook}
                style={{
                  padding: "8px 16px",
                  backgroundColor: webhookUrl ? "var(--blue-700)" : "var(--gray-300)",
                  color: "var(--white)",
                  borderRadius: 6,
                  border: "none",
                  cursor: webhookUrl ? "pointer" : "not-allowed",
                  fontWeight: 600,
                  fontSize: 12,
                  whiteSpace: "nowrap"
                }}
              >
                {registering ? "..." : "Add Webhook"}
              </button>
            </div>

            {error && <div className="partner-alert partner-alert-error">{error}</div>}
            {result && <div className="partner-alert partner-alert-success">✅ {result.message}</div>}

            {/* Webhook list */}
            {webhooks.length > 0 && (
              <div>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    margin: "0 0 12px",
                    color: "var(--text-strong)"
                  }}
                >
                  Registered Webhooks ({webhooks.length})
                </h3>
                {webhooks.map((wh, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 12,
                      backgroundColor: "var(--surface-light)",
                      borderRadius: 8,
                      border: "1px solid var(--gray-300)",
                      marginBottom: 8
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4
                      }}
                    >
                      <code style={{ fontSize: 12, fontWeight: 600, wordBreak: "break-all" }}>
                        {wh.url}
                      </code>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 6px",
                            borderRadius: 4,
                            backgroundColor: wh.active ? "var(--green-50)" : "var(--red-50)",
                            color: wh.active ? "var(--green-700)" : "var(--red-700)",
                            fontWeight: 600
                          }}
                        >
                          {wh.active ? "Active" : "Inactive"}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteWebhook(wh.url)}
                          style={{
                            padding: "2px 8px",
                            backgroundColor: "var(--red-50)",
                            color: "var(--red-700)",
                            borderRadius: 4,
                            border: "1px solid var(--red-100)",
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--gray-500)" }}>
                      <strong>Events:</strong>{" "}
                      {wh.events.length === 1 ? wh.events[0] : `${wh.events.length} events`}
                      {wh.lastDelivery && (
                        <span> · Last delivery: {new Date(wh.lastDelivery).toLocaleString()}</span>
                      )}
                      {wh.failureCount > 0 && (
                        <span>
                          {" "}
                          ·{" "}
                          <strong style={{ color: "var(--red-600)" }}>
                            {wh.failureCount} failures
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {webhooks.length === 0 && !loading && (
              <div
                style={{
                  padding: 16,
                  backgroundColor: "var(--surface-light)",
                  borderRadius: 8,
                  border: "1px dashed var(--gray-300)",
                  textAlign: "center"
                }}
              >
                <div style={{ fontSize: 13, color: "var(--gray-500)" }}>
                  No webhooks registered yet.
                </div>
                <div style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 4 }}>
                  Enter a URL above and click "Add Webhook" to start receiving events.
                </div>
              </div>
            )}

            {/* Available events */}
            {availableEvents.length > 0 && (
              <details style={{ marginTop: 16 }}>
                <summary
                  style={{
                    fontSize: 12,
                    color: "var(--gray-500)",
                    cursor: "pointer",
                    marginBottom: 8
                  }}
                >
                  Available event types ({availableEvents.length})
                </summary>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {availableEvents.map(event => (
                    <span
                      key={event}
                      style={{
                        padding: "3px 8px",
                        backgroundColor: "var(--surface-light)",
                        borderRadius: 4,
                        border: "1px solid var(--gray-300)",
                        fontSize: 11,
                        color: "var(--gray-600)"
                      }}
                    >
                      {event}
                    </span>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Admin Tab ───

function AdminTab({ sdk, adminKey, onSetAdminKey }) {
  const [keyInput, setKeyInput] = useState(adminKey);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    onSetAdminKey(keyInput);
    try {
      sdk.setApiKey(keyInput);
      const res = await sdk.getPartnerAnalytics();
      setAnalytics(res);
    } catch (err) {
      setError(err.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="partner-query-form-container">
        <h2 className="partner-register-title">
          🔐 Admin Panel
        </h2>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>
          View partner analytics, manage tiers, and monitor usage and revenue. Requires the admin
          API key.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="password"
            placeholder={B2B_FORM_FIELDS.adminApiKey.placeholder}
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            className="partner-form-input"
            style={{ flex: 1, fontFamily: "monospace" }}
          />
          <button
            type="button"
            disabled={loading || !keyInput}
            onClick={handleFetch}
            className="partner-form-submit"
          >
            {loading ? "..." : "Fetch Analytics"}
          </button>
        </div>

        {error && (
          <div className="partner-alert partner-alert-error">
            {error}
          </div>
        )}

        {analytics && (
          <div>
            {/* Summary */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: 12,
                marginBottom: 16
              }}
            >
              <StatTile label="Total Partners" value={analytics.totalPartners} />
              <StatTile label="Active Partners" value={analytics.activePartners} />
              <StatTile label="Total Requests" value={analytics.totalRequests?.toLocaleString()} />
              <StatTile
                label="Total Revenue"
                value={`$${analytics.totalRevenue?.toLocaleString()}`}
              />
              <StatTile
                label="Monthly MRR"
                value={`$${analytics.monthlyRecurringRevenue?.toLocaleString()}`}
              />
            </div>

            {/* Tier distribution */}
            {analytics.partnersByTier && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                  gap: 8,
                  marginBottom: 16
                }}
              >
                {Object.entries(analytics.partnersByTier).map(([tier, count]) => (
                  <StatTile key={tier} label={`${tier} partners`} value={count} />
                ))}
                {analytics.partnersByStatus &&
                  Object.entries(analytics.partnersByStatus).map(([status, count]) => (
                    <StatTile key={status} label={`${status}`} value={count} />
                  ))}
              </div>
            )}

            {/* Partner list */}
            {analytics.partners && analytics.partners.length > 0 && (
              <div>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    margin: "0 0 12px",
                    color: "var(--text-strong)"
                  }}
                >
                  All Partners ({analytics.partners.length})
                </h3>
                {analytics.partners.map(p => (
                  <div
                    key={p.partnerId}
                    style={{
                      padding: 12,
                      backgroundColor: "var(--surface-light)",
                      borderRadius: 8,
                      border: "1px solid var(--gray-300)",
                      marginBottom: 8
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 13 }}>{p.partnerName}</strong>
                        <span style={{ fontSize: 11, color: "var(--gray-500)", marginLeft: 8 }}>
                          {p.email}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--gray-500)", marginLeft: 8 }}>
                          {p.tierName} · {p.status} · {p.billingCycle}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                        gap: 8,
                        marginTop: 8,
                        fontSize: 12,
                        color: "var(--gray-600)"
                      }}
                    >
                      <div>
                        Requests: <strong>{p.requestsThisMonth?.toLocaleString()}</strong>
                      </div>
                      <div>
                        Users: <strong>{p.activeUsers}</strong>
                      </div>
                      <div>
                        Revenue: <strong>${p.monthlyRevenue}</strong>
                      </div>
                      <div>
                        Plan: <strong>${p.monthlyPrice}/mo</strong>
                      </div>
                      <div>
                        Payment: <strong>{p.paymentStatus}</strong>
                      </div>
                      <div>
                        Webhooks: <strong>{p.webhookCount}</strong>
                      </div>
                    </div>
                    {p.endpointBreakdown && Object.keys(p.endpointBreakdown).length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "var(--gray-500)" }}>
                        <strong>Endpoints:</strong>{" "}
                        {Object.entries(p.endpointBreakdown)
                          .map(([ep, count]) => `${ep} (${count})`)
                          .join(", ")}
                      </div>
                    )}
                    {p.recentInvoices && p.recentInvoices.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "var(--gray-500)" }}>
                        <strong>Recent invoices:</strong>{" "}
                        {p.recentInvoices
                          .slice(0, 3)
                          .map(inv => `${inv.id} ($${inv.amount}, ${inv.status})`)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Docs Tab ───

function DocsTab() {
  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 800 }}>
      <div className="partner-query-form-container">
        <h2 className="partner-register-title">
          📖 SDK Documentation
        </h2>

        <section style={{ marginBottom: 20 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              margin: "0 0 8px",
              color: "var(--text-strong)"
            }}
          >
            Quick Start (Server-side)
          </h3>
          <pre
            style={{
              fontSize: 12,
              backgroundColor: "var(--gray-900)",
              color: "var(--gray-50)",
              padding: 16,
              borderRadius: 8,
              overflowX: "auto"
            }}
          >
            {`npm install arthos-partner-sdk

// In your backend:
import { ArthOSPartnerSDK } from 'arthos-partner-sdk';

const sdk = new ArthOSPartnerSDK({
  apiKey: process.env.ARTHOS_API_KEY,
  environment: 'production',
});

// Get full intelligence for a user:
const result = await sdk.getIntelligence({
  userId: req.user.id,
  profile: {
    monthlyIncome: 85000,
    monthlyExpenses: 52000,
    emergencySavingsFixed: 200000,
    totalDebt: 500000,
  },
});

console.log('Health score:', result.healthScore.score);
console.log('Risk level:', result.riskProfile.level);
console.log('Bias load:', result.cognitiveBiases.biasLoad);`}
          </pre>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              margin: "0 0 8px",
              color: "var(--text-strong)"
            }}
          >
            All API Endpoints
          </h3>
          <div style={{ display: "grid", gap: 8 }}>
            {[
              {
                method: "POST",
                path: "/api/b2b/register",
                desc: "Register a new partner and receive an API key"
              },
              {
                method: "POST",
                path: "/api/b2b/intelligence",
                desc: "Get health score, risk profile, biases, triggers, and recommendations",
                auth: "API Key (Bearer)"
              },
              {
                method: "GET/POST",
                path: "/api/b2b/validate-key",
                desc: "Validate an API key and get plan details",
                auth: "API Key (Bearer)"
              },
              {
                method: "GET/POST/DELETE",
                path: "/api/b2b/webhooks",
                desc: "Manage webhook registrations for real-time events",
                auth: "API Key (Bearer)"
              },
              {
                method: "GET",
                path: "/api/b2b/admin",
                desc: "Get all partner analytics (requires admin key)",
                auth: "Admin Key (Bearer)"
              }
            ].map(ep => (
              <div
                key={ep.path}
                style={{
                  padding: 12,
                  backgroundColor: "var(--surface-light)",
                  borderRadius: 8,
                  border: "1px solid var(--gray-300)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      backgroundColor: ep.method.includes("POST")
                        ? "var(--blue-50)"
                        : "var(--green-50)",
                      color: ep.method.includes("POST") ? "var(--blue-700)" : "var(--green-800)",
                      fontSize: 11,
                      fontWeight: 700
                    }}
                  >
                    {ep.method}
                  </span>
                  <code style={{ fontSize: 13, fontWeight: 600 }}>{ep.path}</code>
                </div>
                <p style={{ fontSize: 12, color: "var(--gray-600)", margin: 0 }}>{ep.desc}</p>
                {ep.auth && (
                  <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 4 }}>
                    Auth: {ep.auth}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              margin: "0 0 8px",
              color: "var(--text-strong)"
            }}
          >
            Webhook Events
          </h3>
          <div style={{ fontSize: 13, color: "var(--gray-600)", lineHeight: 1.6 }}>
            <p>Partners can subscribe to these event types via the webhook API:</p>
            <ul style={{ paddingLeft: 20 }}>
              <li>
                <strong>partner.created</strong> — New partner registered
              </li>
              <li>
                <strong>partner.tier_changed</strong> — Partner upgraded/downgraded
              </li>
              <li>
                <strong>partner.suspended/reactivated</strong> — Partner status changed
              </li>
              <li>
                <strong>invoice.created/paid/overdue</strong> — Billing lifecycle events
              </li>
              <li>
                <strong>usage.threshold</strong> — 80% of monthly rate limit reached
              </li>
              <li>
                <strong>subscription.renewed</strong> — Auto-renewal processed
              </li>
              <li>
                <strong>revenue_share.recorded</strong> — Revenue share logged
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              margin: "0 0 8px",
              color: "var(--text-strong)"
            }}
          >
            Revenue Model
          </h3>
          <div style={{ fontSize: 13, color: "var(--gray-600)", lineHeight: 1.6 }}>
            <p>
              ARTH.OS operates on a <strong>B2B2C revenue share model</strong>:
            </p>
            <ul style={{ paddingLeft: 20 }}>
              <li>
                <strong>Starter ($299/mo):</strong> 15% revenue share on any monetization through
                the intelligence layer
              </li>
              <li>
                <strong>Pro ($999/mo):</strong> 10% revenue share
              </li>
              <li>
                <strong>Enterprise ($4,999/mo):</strong> 5% revenue share + dedicated support +
                white label
              </li>
            </ul>
            <p style={{ marginTop: 8 }}>
              Partners can monetize by embedding scores into loan pricing, offering personalized
              financial wellness features, or building premium products on top of ARTH.OS
              intelligence. Annual billing saves ~17%.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Shared Components ───

function StatTile({ label, value }) {
  return (
    <div
      style={{
        padding: 12,
        backgroundColor: "var(--surface-light)",
        borderRadius: 8,
        border: "1px solid var(--gray-300)",
        textAlign: "center"
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-strong)" }}>
        {value ?? "—"}
      </div>
      <div
        style={{ fontSize: 11, color: "var(--gray-500)", textTransform: "uppercase", marginTop: 2 }}
      >
        {label}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--gray-300)",
  fontSize: 13,
  color: "var(--text-strong)",
  backgroundColor: "var(--white)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box"
};
