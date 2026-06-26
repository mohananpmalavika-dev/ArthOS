// src/pages/EnterpriseLoginPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import LoginPage from "./LoginPage.jsx";
import { Building2 } from "lucide-react";

/**
 * Enterprise entry point.
 * For now, it reuses the existing login UI/logic (individual login) to avoid breaking auth.
 * Later, this component can switch to enterprise-specific auth endpoints/guards.
 */
export default function EnterpriseLoginPage() {
  const navigate = useNavigate();

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "14px 16px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-0)" }}>
          <Building2 size={18} />
          <span style={{ fontWeight: 700, fontSize: 12, color: "var(--ink-2)" }}>
            ARTH.OS Enterprise Login
          </span>
        </div>
      </div>

      <div>
        <LoginPage
          title="Enterprise sign in"
          subtitle="Secure access for NBFC and loan operations teams."
          onSwitchToRegister={() => navigate("/enterprise-register")}
          onClose={() => navigate("/enterprise", { replace: true })}
        />
      </div>
    </div>
  );
}

