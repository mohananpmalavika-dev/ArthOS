import React, { useMemo, useState } from "react";
import { ArthOSSDK } from "../lib/ArthOSSDK.js";

export default function PartnerSdkDemo({ userId = "demo", assessment = {} }) {
  const [loading, setLoading] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [riskResult, setRiskResult] = useState(null);
  const [error, setError] = useState(null);

  const sdk = useMemo(() => new ArthOSSDK(""), []);

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
    </section>
  );
}
