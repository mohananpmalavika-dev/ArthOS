// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { UserPlus, Mail, Lock, User, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function RegisterPage({ onSwitchToLogin, onClose }) {
  const { register, error, loading, clearError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!name.trim()) {
      setLocalError("Name is required");
      return;
    }
    if (!email.trim()) {
      setLocalError("Email is required");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    const success = await register(name.trim(), email.trim(), password);
    if (success && onClose) {
      onClose();
    }
  };

  const displayError = localError || error;

  return (
    <div className="auth-page-overlay">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon-wrapper">
            <UserPlus size={28} />
          </div>
          <h2>Create your account</h2>
          <p>Join ARTH.OS to start building your financial twin across all your devices.</p>
        </div>

        <button
          type="button"
          className="auth-google-btn"
          onClick={() => {
            window.location.href = '/api/auth/google';
          }}
        >
          Continue with Google
        </button>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="reg-name">
              <User size={16} />
              <span>Name</span>
            </label>
            <input
              id="reg-name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => {
                setName(e.target.value);
                setLocalError(null);
                clearError();
              }}
              autoComplete="name"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email">
              <Mail size={16} />
              <span>Email</span>
            </label>
            <input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setLocalError(null);
                clearError();
              }}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password">
              <Lock size={16} />
              <span>Password</span>
            </label>
            <div className="auth-password-input">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setLocalError(null);
                  clearError();
                }}
                autoComplete="new-password"
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

          <div className="auth-field">
            <label htmlFor="reg-confirm">
              <Lock size={16} />
              <span>Confirm Password</span>
            </label>
            <input
              id="reg-confirm"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                setLocalError(null);
                clearError();
              }}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          {displayError && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{displayError}</span>
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || !name || !email || !password || !confirmPassword}
          >
            {loading ? "Creating account..." : "Create Account"}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <button type="button" className="auth-link-btn" onClick={onSwitchToLogin}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
