/**
 * Privacy & Data Retention Settings Component
 * GDPR-compliant data management UI with export/delete functionality
 */

import { useState } from 'react';
import './PrivacySettings.css';

export default function PrivacySettings() {

  const [activeTab, setActiveTab] = useState('retention');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Data retention policies
  const retentionPolicies = [
    {
      id: 'assessments',
      label: 'Assessment Data',
      description: 'Your completed financial assessments and answers',
      retention: '7 years',
      rationale: 'Regulatory requirement for financial records'
    },
    {
      id: 'banking',
      label: 'Banking Transactions',
      description: 'Imported transaction history and account data',
      retention: '3 years',
      rationale: 'Tax reporting and audit trail'
    },
    {
      id: 'behavioral',
      label: 'Behavioral & Insights',
      description: 'ML-generated insights, spending patterns, predictions',
      retention: '1 year',
      rationale: 'Personalization and recommendation engine'
    },
    {
      id: 'coaching',
      label: 'Coaching Sessions',
      description: 'AI Coach conversation history and recommendations',
      retention: '1 year',
      rationale: 'User experience and continuity'
    },
    {
      id: 'profile',
      label: 'User Profile',
      description: 'Name, email, settings, preferences',
      retention: 'Account lifetime',
      rationale: 'Account management and authentication'
    }
  ];

  // Data categories available for export
  const exportCategories = [
    { id: 'personal', label: 'Personal Information', selected: true },
    { id: 'assessments', label: 'Assessments & Responses', selected: true },
    { id: 'banking', label: 'Banking Data', selected: true },
    { id: 'insights', label: 'Insights & Analytics', selected: true },
    { id: 'coaching', label: 'Coaching Session History', selected: false }
  ];

  /**
   * Export user data as JSON/CSV
   */
  const handleExportData = async (format = 'json') => {
    setExportLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arth-os-data-export-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      setMessage('Data exported successfully. Check your downloads folder.');
    } catch (err) {
      setMessage(`Export failed: ${err.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  /**
   * Permanently delete user account and all data
   */
  const handleDeleteAccount = async (withExport = false) => {
    setDeleteLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup: withExport })
      });

      if (!response.ok) throw new Error('Deletion failed');

      setMessage('Account deleted successfully.');
      // Redirect to home after brief delay
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      setMessage(`Deletion failed: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  /**
   * Update retention policy for a data category
   */
  const handleUpdateRetention = async (categoryId, newRetention) => {
    try {
      const response = await fetch(`/api/user/retention/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retention: newRetention })
      });

      if (!response.ok) throw new Error('Update failed');
      setMessage('Retention policy updated.');
    } catch (err) {
      setMessage(`Update failed: ${err.message}`);
    }
  };

  return (
    <div className="privacy-settings">
      <div className="settings-header">
        <h2>Privacy & Data Management</h2>
        <p>Control your data, export information, or delete your account</p>
      </div>

      {message && (
        <div className={`message ${message.includes('failed') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="settings-tabs">
        <button
          className={`tab-btn ${activeTab === 'retention' ? 'active' : ''}`}
          onClick={() => setActiveTab('retention')}
        >
          📋 Retention Policies
        </button>
        <button
          className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          ⬇️ Export Data
        </button>
        <button
          className={`tab-btn ${activeTab === 'delete' ? 'active' : ''}`}
          onClick={() => setActiveTab('delete')}
        >
          🗑️ Delete Account
        </button>
      </div>

      {/* Retention Tab */}
      {activeTab === 'retention' && (
        <div className="settings-panel">
          <h3>Data Retention Policies</h3>
          <p className="subtext">
            We retain your data according to these policies. You can request earlier deletion.
          </p>

          <div className="retention-grid">
            {retentionPolicies.map(policy => (
              <div key={policy.id} className="retention-card">
                <div className="card-header">
                  <h4>{policy.label}</h4>
                  <span className="retention-badge">{policy.retention}</span>
                </div>

                <p className="description">{policy.description}</p>
                <p className="rationale">
                  <strong>Why:</strong> {policy.rationale}
                </p>

                <div className="card-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => handleUpdateRetention(policy.id, 'immediate')}
                  >
                    Delete Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="info-box">
            <strong>📝 Legal Note:</strong> Some data categories (e.g., assessments, transactions) are
            retained to comply with financial regulations. You can request deletion with advance notice.
          </div>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="settings-panel">
          <h3>Export Your Data</h3>
          <p className="subtext">
            Download your financial profile, assessments, and insights in standard formats.
          </p>

          <div className="export-categories">
            <h4>Select Data to Export:</h4>
            {exportCategories.map(cat => (
              <label key={cat.id} className="checkbox-item">
                <input type="checkbox" defaultChecked={cat.selected} />
                <span>{cat.label}</span>
              </label>
            ))}
          </div>

          <div className="export-formats">
            <h4>Choose Format:</h4>
            <button
              className="btn-primary"
              onClick={() => handleExportData('json')}
              disabled={exportLoading}
            >
              {exportLoading ? 'Exporting...' : 'JSON'} 📄
            </button>
            <button
              className="btn-primary"
              onClick={() => handleExportData('csv')}
              disabled={exportLoading}
            >
              {exportLoading ? 'Exporting...' : 'CSV'} 📊
            </button>
          </div>

          <div className="info-box">
            <strong>💡 Tip:</strong> Exported data is encrypted and valid for 7 days. Download and delete
            from our servers immediately. This export is portable and GDPR-compliant (Data Portability Right).
          </div>
        </div>
      )}

      {/* Delete Tab */}
      {activeTab === 'delete' && (
        <div className="settings-panel delete-panel">
          <h3>⚠️ Delete Your Account</h3>
          <p className="subtext">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          <div className="warning-box">
            <strong>Consequences:</strong>
            <ul>
              <li>Your account will be permanently deleted</li>
              <li>All financial data, assessments, and insights will be erased</li>
              <li>You will lose access to all ArthOS features</li>
              <li>This cannot be reversed</li>
            </ul>
          </div>

          {!deleteConfirmOpen ? (
            <button
              className="btn-danger"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Delete My Account
            </button>
          ) : (
            <div className="delete-confirmation">
              <p>Type <strong>"DELETE"</strong> to confirm account deletion:</p>
              <input type="text" placeholder="Type DELETE" id="delete-confirm-input" />

              <div className="delete-options">
                <label className="checkbox-item">
                  <input type="checkbox" id="backup-before-delete" />
                  <span>Export a backup of my data before deletion</span>
                </label>
              </div>

              <div className="confirmation-buttons">
                <button
                  className="btn-secondary"
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn-danger-strong"
                  onClick={() => {
                    const confirmInput = document.getElementById('delete-confirm-input');
                    if (confirmInput.value.toUpperCase() === 'DELETE') {
                      const backup = document.getElementById('backup-before-delete').checked;
                      handleDeleteAccount(backup);
                    } else {
                      setMessage('Please type DELETE to confirm.');
                    }
                  }}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          )}

          <div className="info-box">
            <strong>📋 Your Rights:</strong> You have the right to erasure (GDPR Article 17). We will
            complete deletion within 30 days. Some data may be retained for legal/tax compliance.
          </div>
        </div>
      )}
    </div>
  );
}
