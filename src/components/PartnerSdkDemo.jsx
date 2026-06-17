import React, { useMemo, useState } from "react";
import { ArthOSSDK } from "../lib/ArthOSSDK.js";
import { PARTNER_TIERS } from "../lib/b2bPartnerEngine.js";

export default function PartnerSdkDemo({ userId = "demo", assessment = {} }) {
  const [loading, setLoading] = useState(false);
  const [intelligenceResult, setIntelligenceResult] = useState(null);
  const [error, setError] = useState(null);

  // Registration state
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    tier: "free",
    useCase: ""
  });
  const [registerResult, setRegisterResult] = useState(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState(null);

  // Intelligence query state
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [queryMode, setQueryMode] = useState("basic"); // basic | full

  const sdk = useMemo(() => new ArthOSSDK(""), []);

  async function handleRegister(event) {
    event.preventDefault();
    setRegisterLoading(true);
    setRegisterError(null);
    setRegisterResult(null);

    try {
      const result = await sdk.registerPartner({
        name: registerForm.name,
        email: registerForm.email,
        tier: registerForm.tier,
        useCase: registerForm.useCase
      });
      setRegisterResult(result);
      // Auto-fill the API key
      setApiKeyInput(result.apiKey);
    } catch (err) {
      setRegisterError(err?.message || "Registration failed");
    } finally {
      setRegisterLoading(false);
    }
  }

  async function handleQueryIntelligence() {
    setLoading(true);
    setError(null);
    setIntelligenceResult(null);

    try {
      // Set the API key on the SDK instance
      sdk.setApiKey(apiKeyInput);

      const result = await sdk.getIntelligence({
        userId,
        profile: assessment.profile,
        behaviour: assessment.behaviour,
        awareness: assessment.awareness,
        habits: assessment.habits
      });

      setIntelligenceResult(result);
    } catch (err) {
      setError(err?.message || "Unable to fetch intelligence data");
    } finally {
      setLoading(false);
    }
  }

  const tierOptions = Object.entries(PARTNER_TIERS).map(([key, val]) => ({
    value: key,
    label: `${val.name} (${val.monthlyPrice === 0 ? "Free" : `$${val.monthlyPrice}/mo`})`
  }));

  return (
    <section className="summary-card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
        <span style={{ fontSize: 22 }}>🤝</span>
        <div>
          <h2 style={{ fontSize: 20, margin: 0 }}>B2B Partner Integration</h2>
          <p style={{ margin: "6px 0 0", color: "var(--gray-600)", fontSize: 14 }}>
            Register as a partner, get an API key, and query embedded finance intelligence.
          </p>
        </div>
      </div>

      {/* Step 1: Register or enter API key */}
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setShowRegister(!showRegister)}
          style={{
            padding: "8px 14px",
            backgroundColor: showRegister ? "var(--gray-300)" : "var(--teal-700)",
            color: showRegister ? "var(--text-strong)" : "var(--white)",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
            marginRight: 8
          }}
        >
          {showRegister ? "Cancel Registration" : "Register New Partner"}
        </button>
      </div>

      {/* Registration Form */}
      {showRegister && (
        <form
          onSubmit={handleRegister}
          style={{
            padding: "16px",
            backgroundColor: "var(--surface-light)",
            borderRadius: "10px",
            marginBottom: 16,
            border: "1px solid var(--gray-300)"
          }}
        >
          <h3 style={{ fontSize: 15, margin: "0 0 12px", color: "var(--text-strong)" }}>
            Register as an ARTH.OS Partner
          </h3>
          <div style={{ display: "grid", gap: 10 }}>
            <input
              type="text"
              placeholder="Company name *"
              required
              value={registerForm.name}
              onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="Contact email *"
              required
              value={registerForm.email}
              onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
              style={inputStyle}
            />
            <select
              value={registerForm.tier}
              onChange={e => setRegisterForm({ ...registerForm, tier: e.target.value })}
              style={inputStyle}
            >
              {tierOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Use case (e.g., 'Embed score into loan app')"
              value={registerForm.useCase}
              onChange={e => setRegisterForm({ ...registerForm, useCase: e.target.value })}
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={registerLoading}
              style={{
                padding: "10px",
                backgroundColor: "var(--blue-700)",
                color: "var(--white)",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              {registerLoading ? "Registering..." : "Register & Get API Key"}
            </button>
          </div>

          {registerError && (
            <div style={{ marginTop: 10, color: "var(--red-700)", fontSize: 13 }}>
              {registerError}
            </div>
          )}

          {registerResult && (
            <div
              style={{
                marginTop: 12,
                padding: "12px",
                backgroundColor: "var(--green-50)",
                borderRadius: "8px",
                border: "1px solid var(--green-100)"
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--green-600)",
                  marginBottom: 8
                }}
              >
                ✅ Partner Registered!
              </div>
              <div style={{ fontSize: 12, color: "var(--green-800)" }}>
                <strong>Partner ID:</strong> {registerResult.partner.id}
              </div>
              <div style={{ fontSize: 12, color: "var(--green-800)", marginTop: 4 }}>
                <strong>Plan:</strong> {registerResult.partner.tierName}
              </div>
              <div style={{ fontSize: 12, color: "var(--green-800)", marginTop: 4 }}>
                <strong>API Key:</strong>{" "}
                <code style={{ fontSize: 11, wordBreak: "break-all" }}>
                  {registerResult.apiKey}
                </code>
              </div>
              <div style={{ fontSize: 11, color: "var(--green-600)", marginTop: 8 }}>
                {registerResult.message}
              </div>
            </div>
          )}
        </form>
      )}

      {/* Step 2: API Key Input */}
      <div style={{ marginBottom: 12 }}>
        <label
          style={{
            fontSize: 13,
            color: "var(--gray-700)",
            fontWeight: 600,
            display: "block",
            marginBottom: 6
          }}
        >
          API Key
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="Paste your API key (arth_...) or register above"
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            type="button"
            disabled={loading || !apiKeyInput}
            onClick={handleQueryIntelligence}
            style={{
              padding: "10px 16px",
              backgroundColor: apiKeyInput ? "var(--blue-700)" : "var(--gray-400)",
              color: "var(--white)",
              borderRadius: "6px",
              border: "none",
              cursor: apiKeyInput ? "pointer" : "not-allowed",
              fontWeight: 600,
              whiteSpace: "nowrap"
            }}
          >
            {loading ? "Querying..." : "Query Intelligence"}
          </button>
        </div>
      </div>

      {/* Query mode selector */}
      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        {["basic", "full"].map(mode => (
          <button
            key={mode}
            type="button"
            onClick={() => setQueryMode(mode)}
            style={{
              padding: "6px 12px",
              backgroundColor: queryMode === mode ? "var(--teal-700)" : "var(--gray-300)",
              color: queryMode === mode ? "var(--white)" : "var(--gray-600)",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600
            }}
          >
            {mode === "basic" ? "Basic (score + risk)" : "Full Intelligence"}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: 14,
            padding: "10px",
            backgroundColor: "var(--red-50)",
            borderRadius: "8px",
            color: "var(--red-700)",
            fontSize: 13
          }}
        >
          {error}
        </div>
      )}

      {/* Intelligence Results */}
      {intelligenceResult && (
        <div style={{ marginTop: 18, borderTop: "2px solid var(--gray-300)", paddingTop: 16 }}>
          {/* Meta */}
          <div style={{ fontSize: 11, color: "var(--gray-400)", marginBottom: 12 }}>
            Queried at{" "}
            {intelligenceResult.meta?.timestamp
              ? new Date(intelligenceResult.meta.timestamp).toLocaleString()
              : "now"}
            {" · "}v{intelligenceResult.meta?.version || "1.0"}
            {" · "}
            <strong style={{ color: "var(--teal-700)" }}>
              {intelligenceResult.usage?.plan || "Free"} plan
            </strong>
            {" · "}
            {intelligenceResult.usage?.requestsThisMonth || "?"} requests this month
          </div>

          {/* Health Score */}
          {intelligenceResult.healthScore && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, margin: "0 0 8px", color: "var(--text-strong)" }}>
                🏥 Health Score
              </h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <MetricTile
                  label="Score"
                  value={intelligenceResult.healthScore.score ?? '—'}
                  suffix="/100"
                />
                <MetricTile label="Category" value={intelligenceResult.healthScore.category ?? '—'} />
                <MetricTile
                  label="Personality"
                  value={intelligenceResult.healthScore.personality?.type ?? '—'}
                />
                <MetricTile
                  label="Survival Months"
                  value={intelligenceResult.healthScore.survival?.months ?? '—'}
                  suffix="mos"
                />
                <MetricTile
                  label="Awareness Gap"
                  value={intelligenceResult.healthScore.survival?.awarenessGap ?? '—'}
                  suffix="mos"
                />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--gray-600)" }}>
                {intelligenceResult.healthScore.summary ?? ''}
              </div>
            </div>
          )}

          {/* Risk Profile */}
          {intelligenceResult.riskProfile && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, margin: "0 0 8px", color: "var(--text-strong)" }}>
                ⚠️ Risk Profile
              </h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <MetricTile label="Risk Score" value={intelligenceResult.riskProfile.score} />
                <MetricTile label="Risk Level" value={intelligenceResult.riskProfile.level} />
                {intelligenceResult.riskProfile.calibration && (
                  <MetricTile
                    label="Calibration Gap"
                    value={intelligenceResult.riskProfile.calibration.calibrationGap}
                    suffix="%"
                  />
                )}
              </div>
            </div>
          )}

          {/* Behaviour Insights */}
          {intelligenceResult.behaviourInsights && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, margin: "0 0 8px", color: "var(--text-strong)" }}>
                🧠 Behaviour Insights
              </h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <MetricTile
                  label="Strongest"
                  value={intelligenceResult.behaviourInsights.strongestComponent}
                />
                <MetricTile
                  label="Weakest"
                  value={intelligenceResult.behaviourInsights.weakestComponent}
                />
                <MetricTile
                  label="Recommended Action"
                  value={intelligenceResult.behaviourInsights.recommendedAction}
                  wide
                />
              </div>
            </div>
          )}

          {/* Cognitive Biases */}
          {intelligenceResult.cognitiveBiases && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, margin: "0 0 8px", color: "var(--text-strong)" }}>
                🧬 Cognitive Biases
              </h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <MetricTile
                  label="Present Bias"
                  value={intelligenceResult.cognitiveBiases.presentBias}
                  suffix="%"
                />
                <MetricTile
                  label="Loss Aversion"
                  value={intelligenceResult.cognitiveBiases.lossAversion}
                  suffix="%"
                />
                <MetricTile
                  label="Optimism Bias"
                  value={intelligenceResult.cognitiveBiases.optimismBias}
                  suffix="%"
                />
                <MetricTile
                  label="Bias Load"
                  value={intelligenceResult.cognitiveBiases.biasLoad}
                  suffix="%"
                />
              </div>
            </div>
          )}

          {/* Emotional Triggers */}
          {intelligenceResult.emotionalTriggers && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, margin: "0 0 8px", color: "var(--text-strong)" }}>
                🔥 Emotional Triggers
              </h3>
              <pre
                style={{
                  fontSize: 11,
                  backgroundColor: "var(--surface-light)",
                  padding: 8,
                  borderRadius: 6,
                  overflowX: "auto"
                }}
              >
                {JSON.stringify(intelligenceResult.emotionalTriggers, null, 2)}
              </pre>
            </div>
          )}

          {/* Forecast */}
          {intelligenceResult.forecast && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, margin: "0 0 8px", color: "var(--text-strong)" }}>
                📊 Forecast
              </h3>
              <div style={{ fontSize: 13, color: "var(--gray-700)" }}>
                <strong>Opportunity:</strong> {intelligenceResult.forecast.opportunity}
                <br />
                <strong>Benefit:</strong> {intelligenceResult.forecast.opportunityBenefit}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {intelligenceResult.recommendations && intelligenceResult.recommendations.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, margin: "0 0 8px", color: "var(--text-strong)" }}>
                🛒 Recommendations
              </h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {intelligenceResult.recommendations.map(r => (
                  <span
                    key={r.id}
                    style={{
                      padding: "4px 10px",
                      backgroundColor: "var(--green-50)",
                      borderRadius: "12px",
                      fontSize: 12,
                      color: "var(--green-700)",
                      border: "1px solid var(--green-100)"
                    }}
                  >
                    {r.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON toggle */}
          <details style={{ marginTop: 12 }}>
            <summary style={{ fontSize: 12, color: "var(--gray-500)", cursor: "pointer" }}>
              View raw intelligence response
            </summary>
            <pre
              style={{
                fontSize: 10,
                backgroundColor: "var(--gray-900)",
                color: "var(--gray-50)",
                padding: 12,
                borderRadius: 8,
                overflowX: "auto",
                maxHeight: 300,
                marginTop: 8
              }}
            >
              {JSON.stringify(intelligenceResult, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </section>
  );
}

// ─── Sub-component ───

function MetricTile({ label, value, suffix, wide }) {
  if (value === undefined || value === null) {
    return null;
  }
  return (
    <div
      style={{
        padding: "8px 12px",
        backgroundColor: "var(--surface-light)",
        borderRadius: "8px",
        border: "1px solid var(--gray-300)",
        flex: wide ? "1 1 100%" : "1 1 auto",
        minWidth: wide ? "100%" : "80px"
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "var(--gray-500)",
          textTransform: "uppercase",
          marginBottom: 4
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-strong)" }}>
        {value}
        {suffix && (
          <span style={{ fontSize: 12, fontWeight: 400, color: "var(--gray-500)", marginLeft: 2 }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "10px 12px",
  borderRadius: "6px",
  border: "1px solid var(--gray-300)",
  fontSize: 13,
  color: "var(--text-strong)",
  backgroundColor: "var(--white)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box"
};
