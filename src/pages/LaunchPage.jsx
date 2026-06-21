// src/pages/LaunchPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, User, Sparkles } from "lucide-react";

export default function LaunchPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-page-overlay">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-card-header">
          <div className="auth-icon-wrapper">
            <Sparkles size={28} />
          </div>
          <h2>Choose your ARTH.OS experience</h2>
          <p>Select your account type to continue.</p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            marginTop: 14,
          }}
        >
          <button
            type="button"
            className="auth-submit-btn"
            style={{
              background: "linear-gradient(90deg, rgba(16,185,129,0.18), rgba(16,185,129,0.02))",
              border: "1px solid var(--green-700)",
            }}
            onClick={() => navigate("/login")}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <User size={18} />
              Individual Login
            </span>
          </button>

          <button
            type="button"
            className="auth-submit-btn"
            style={{
              background: "linear-gradient(90deg, rgba(59,130,246,0.18), rgba(59,130,246,0.02))",
              border: "1px solid var(--blue-700)",
            }}
            onClick={() => navigate("/enterprise-login")}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <BriefcaseBusiness size={18} />
              Enterprise Login
            </span>
          </button>
        </div>

        <div className="auth-footer" style={{ marginTop: 18 }}>
          <p style={{ color: "var(--ink-2)", fontSize: 12 }}>
            Note: Enterprise login is routed separately so it can later use enterprise-specific SSO and
            permissions.
          </p>
        </div>
      </div>
    </div>
  );
}

