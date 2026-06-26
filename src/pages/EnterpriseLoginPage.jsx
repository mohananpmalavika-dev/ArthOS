import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Building2, Lock, Mail } from "lucide-react";
import { useEnterpriseAuth } from "../context/EnterpriseAuthContext.jsx";

export default function EnterpriseLoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useEnterpriseAuth();
  const [email, setEmail] = useState("loan.officer@arthos.demo");
  const [password, setPassword] = useState("enterprise-demo");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate("/enterprise", { replace: true });
    }
  };

  return (
    <div className="auth-page-overlay">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon-wrapper">
            <Building2 size={28} />
          </div>
          <h2>Enterprise sign in</h2>
          <p>Secure access for NBFC and loan operations teams.</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="enterprise-login-email">
              <Mail size={16} />
              <span>Email</span>
            </label>
            <input
              id="enterprise-login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="enterprise-login-password">
              <Lock size={16} />
              <span>Password</span>
            </label>
            <input
              id="enterprise-login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || !email || !password}
          >
            {loading ? "Signing in..." : "Enter Enterprise"}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Need a workspace?{" "}
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => navigate("/enterprise-register")}
            >
              Register institution
            </button>
          </p>
          <p className="auth-demo-hint">Demo enterprise credentials are prefilled.</p>
        </div>
      </div>
    </div>
  );
}
