import React from "react";
import { ADMIN_LABELS } from "../lib/copy.ts";

export default function AdminSection({
  assessment,
  result,
  adminLoggedIn,
  adminCredentials,
  adminLoginError,
  adminReport,
  onAdminCredentialChange,
  onAdminLogin,
  onAdminLogout,
  onGenerateReport,
}) {
  return (
    <section className="admin-section" id="admin">
      <div className="admin-panel">
        <div className="admin-header">
          <div>
            <span className="admin-label">{ADMIN_LABELS.dashboard}</span>
          </div>
          {adminLoggedIn && (
            <button type="button" className="ghost-button admin-logout-btn" onClick={onAdminLogout}>
              {ADMIN_LABELS.logout}
            </button>
          )}
        </div>

        {!adminLoggedIn ? (
          <form className="admin-login-card" onSubmit={onAdminLogin} autoComplete="off">
            <label>
              {ADMIN_LABELS.username}
              <input
                type="text"
                autoComplete="username"
                value={adminCredentials.username}
                onChange={(event) => onAdminCredentialChange({
                  ...adminCredentials,
                  username: event.target.value,
                })}
              />
            </label>
            <label>
              {ADMIN_LABELS.password}
              <input
                type="password"
                autoComplete="current-password"
                value={adminCredentials.password}
                onChange={(event) => onAdminCredentialChange({
                  ...adminCredentials,
                  password: event.target.value,
                })}
              />
            </label>
            {adminLoginError && <p className="admin-login-error">{adminLoginError}</p>}
            <button type="submit" className="primary-link admin-login-btn">
              {ADMIN_LABELS.signIn}
            </button>
          </form>
        ) : (
          <>
            <div className="admin-summary-grid">
              <div className="admin-card">
                <h3>{ADMIN_LABELS.participantData}</h3>
                <pre>{JSON.stringify(assessment.participant, null, 2)}</pre>
              </div>
              <div className="admin-card">
                <h3>{ADMIN_LABELS.profileInputs}</h3>
                <pre>{JSON.stringify(assessment.profile, null, 2)}</pre>
              </div>
              <div className="admin-card">
                <h3>{ADMIN_LABELS.behaviourAnswers}</h3>
                <pre>{JSON.stringify(assessment.behaviour, null, 2)}</pre>
              </div>
              <div className="admin-card">
                <h3>{ADMIN_LABELS.awarenessAnswers}</h3>
                <pre>{JSON.stringify(assessment.awareness, null, 2)}</pre>
              </div>
              {assessment.habits && (
                <div className="admin-card admin-habits-card">
                  <h3>{ADMIN_LABELS.habitsAnswers}</h3>
                  <pre>{JSON.stringify(assessment.habits, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="admin-actions-row">
              <button type="button" className="admin-generate-btn" onClick={onGenerateReport}>
                {ADMIN_LABELS.generateReport}
              </button>
              <span className="admin-report-hint">{ADMIN_LABELS.reportHint}</span>
            </div>

            {adminReport && (
              <div className="admin-report-preview">
                <h3>Generated report preview</h3>
                <pre>{JSON.stringify(adminReport, null, 2)}</pre>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
