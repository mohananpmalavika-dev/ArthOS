// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage({ onSwitchToRegister, onClose }) {
  const { login, error, loading, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!email || !password) {
      return;
    }
    setSubmitted(true);
    clearError();
    const success = await login(email, password);
    if (success) {
      // If onClose callback is provided (e.g., modal context), call it
      if (onClose) {
        onClose();
      } else {
        // Otherwise navigate to home page (React Router context)
        navigate("/", { replace: true });
      }
    }
  };

  return (
    <div className="auth-page-overlay">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon-wrapper">
            <LogIn size={28} />
          </div>
          <h2>Welcome back</h2>
          <p>Sign in to your ARTH.OS account to continue your financial journey.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">
              <Mail size={16} />
              <span>Email</span>
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                clearError();
              }}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">
              <Lock size={16} />
              <span>Password</span>
            </label>
            <div className="auth-password-input">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  clearError();
                }}
                autoComplete="current-password"
                required
                minLength={6}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || !email || !password}
          >
            {loading ? "Signing in..." : "Sign In"}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <button type="button" className="auth-link-btn" onClick={onSwitchToRegister}>
              Create one
            </button>
          </p>
          <p className="auth-demo-hint">
            <Sparkles size={12} />
            Demo mode: any email/password works
          </p>
        </div>
      </div>
    </div>
  );
}
