import React, { useMemo, useState } from "react";
import { ArthOSSDK, integrations } from "../lib/ArthOSSDK.js";

export default function PartnerSdkDemo({ userId = "demo", assessment = {} }) {
  const [loading, setLoading] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [riskResult, setRiskResult] = useState(null);
  const [error, setError] = useState(null);

  const sdk = useMemo(() => new ArthOSSDK(""), []);
  const [providerCounts, setProviderCounts] = useState({
    banks: integrations.banks.length,
    lenders: integrations.lenders.length,
    insurers: integrations.insurers.length,
    investments: integrations.investments.length,
  });
  const [providerMessage, setProviderMessage] = useState("");

  function updateProviderCounts() {
    setProviderCounts({
      banks: integrations.banks.length,
      lenders: integrations.lenders.length,
      insurers: integrations.insurers.length,
      investments: integrations.investments.length,
    });
  }

  function registerSampleProvider() {
    try {
      sdk.registerProvider("banks", { id: "demo-bank", name: "Demo Bank Connector" });
      updateProviderCounts();
      setProviderMessage("Demo bank connector registered successfully.");
    } catch (err) {
      setProviderMessage(err?.message || "Unable to register provider.");
    }
  }

  async function refreshPartnerData() {
    setLoading(true);
    setError(null);

    try {
      const [scoreData, riskData] = await Promise.all([
        sdk.getHealthScore(userId),
        sdk.getRiskProfile(userId, {
          profile: assessment.profile,
          behaviour: assessment.behaviour,
          awareness: assessment.awareness,
        }),
      ]);

      setScoreResult(scoreData);
      setRiskResult(riskData);
    } catch (err) {
      setError(err?.message || "Unable to fetch partner data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="summary-card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
        <span style={{ fontSize: 22 }}>🤝</span>
        <div>
          <h2 style={{ fontSize: 20, margin: 0 }}>Partner Integration</h2>
          <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 14 }}>
            Fetch score and risk profile through the ArthOS partner SDK.
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={refreshPartnerData}
        style={{
          width: "100%",
          padding: "12px 16px",
          backgroundColor: "#2563eb",
          color: "white",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        {loading ? "Loading partner data…" : "Refresh partner score"}
      </button>

      {error && (
        <div style={{ marginTop: 14, color: "#b91c1c", fontSize: 13 }}>
          {error}
        </div>
      )}

      {scoreResult && (
        <div style={{ marginTop: 18, borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div>
              <div style={{ fontSize: 12, textTransform: "uppercase", color: "#64748b" }}>Partner Health Score</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a" }}>
                {scoreResult.healthScore ?? "—"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Decisions</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{scoreResult.decisions ?? 0}</div>
            </div>
          </div>
        </div>
      )}

      {riskResult && (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: "#334155", fontSize: 13, marginBottom: 8 }}>Risk profile</div>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ color: "#475569" }}>Risk level</span>
              <strong>{riskResult.riskLevel || "—"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={{ color: "#475569" }}>Risk score</span>
              <strong>{riskResult.riskScore ?? "—"}</strong>
            </div>
            {riskResult.profile?.riskCalibration && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#475569" }}>Calibration gap</span>
                <strong>{riskResult.profile.riskCalibration.calibrationGap}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div style={{ color: "#334155", fontSize: 13, fontWeight: 600 }}>Marketplace connectors</div>
          <button
            type="button"
            onClick={registerSampleProvider}
            style={{ padding: "10px 14px", backgroundColor: "#0f766e", color: "white", borderRadius: "8px", border: "none", cursor: "pointer" }}
          >
            Register Demo Bank
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
          <div style={{ padding: "14px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Banks</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{providerCounts.banks}</div>
          </div>
          <div style={{ padding: "14px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Lenders</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{providerCounts.lenders}</div>
          </div>
          <div style={{ padding: "14px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Insurers</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{providerCounts.insurers}</div>
          </div>
          <div style={{ padding: "14px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Investments</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{providerCounts.investments}</div>
          </div>
        </div>
        {providerMessage && (
          <div style={{ marginTop: 14, fontSize: 13, color: "#0f766e" }}>{providerMessage}</div>
        )}
      </div>
    </section>
  );
}
