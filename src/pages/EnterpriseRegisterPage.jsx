import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Building2, Lock, Mail, User } from "lucide-react";
import { useEnterpriseAuth } from "../context/EnterpriseAuthContext.jsx";

export default function EnterpriseRegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error } = useEnterpriseAuth();
  const [name, setName] = useState("");
  const [institutionName, setInstitutionName] = useState("ARTH.OS Demo NBFC");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError(null);

    if (!name.trim()) {
      setLocalError("Name is required");
      return;
    }
    if (!institutionName.trim()) {
      setLocalError("Institution name is required");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    const success = await register({
      name: name.trim(),
      institutionName: institutionName.trim(),
      email: email.trim(),
      password,
    });

    if (success) {
      navigate("/enterprise", { replace: true });
    }
  };

  const displayError = localError || error;

  return (
    <div className="auth-page-overlay">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon-wrapper">
            <Building2 size={28} />
          </div>
          <h2>Register institution</h2>
          <p>Create an enterprise workspace for lending intelligence teams.</p>
        </div>

        {displayError && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{displayError}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="enterprise-reg-name">
              <User size={16} />
              <span>Name</span>
            </label>
            <input
              id="enterprise-reg-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="enterprise-reg-institution">
              <Building2 size={16} />
              <span>Institution</span>
            </label>
            <input
              id="enterprise-reg-institution"
              type="text"
              value={institutionName}
              onChange={(event) => setInstitutionName(event.target.value)}
              autoComplete="organization"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="enterprise-reg-email">
              <Mail size={16} />
              <span>Email</span>
            </label>
            <input
              id="enterprise-reg-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="enterprise-reg-password">
              <Lock size={16} />
              <span>Password</span>
            </label>
            <input
              id="enterprise-reg-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || !name || !institutionName || !email || !password}
          >
            {loading ? "Creating workspace..." : "Create Enterprise"}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an enterprise workspace?{" "}
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => navigate("/enterprise-login")}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
