/**
 * Assessment Limit Notice Component
 * Shows when free tier user has reached their 1x/month limit
 */

import React from 'react';
import { AlertCircle, Calendar, ArrowUp } from 'lucide-react';

export default function AssessmentLimitNotice({
  tier = 'free',
  remaining = 0,
  nextAvailableDate,
  onUpgradeClick,
}) {
  if (tier !== 'free' || remaining > 0) {
    return null;
  }

  const formatDate = (date) => {
    if (!date) return 'next month';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="assessment-limit-notice">
      <div className="notice-icon">
        <AlertCircle size={24} />
      </div>

      <div className="notice-content">
        <h3>You've reached your monthly assessment limit</h3>
        <p className="notice-text">
          Free tier users can take one assessment per month. Your next assessment will be available on{' '}
          <strong>{formatDate(nextAvailableDate)}</strong>.
        </p>

        <div className="notice-features">
          <p className="feature-header">Upgrade to Plus for unlimited assessments:</p>
          <ul>
            <li>✓ Unlimited assessments</li>
            <li>✓ Score history tracking</li>
            <li>✓ Digital Twin simulator</li>
            <li>✓ Just $12.99/month</li>
          </ul>
        </div>

        <button className="btn-upgrade" onClick={onUpgradeClick}>
          <ArrowUp size={16} />
          Upgrade to Plus
        </button>
      </div>

      <style jsx>{`
        .assessment-limit-notice {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%);
          border: 2px solid rgba(255, 193, 7, 0.3);
          border-radius: 12px;
          margin: 1.5rem 0;
          color: var(--text);
        }

        .notice-icon {
          flex-shrink: 0;
          color: #ffc107;
          display: flex;
          align-items: flex-start;
          padding-top: 0.25rem;
        }

        .notice-content {
          flex: 1;
        }

        h3 {
          margin: 0 0 0.5rem 0;
          color: var(--text);
          font-size: 1.1rem;
        }

        .notice-text {
          margin: 0 0 1rem 0;
          color: var(--muted);
          line-height: 1.5;
        }

        .notice-features {
          margin-bottom: 1rem;
        }

        .feature-header {
          margin: 0 0 0.75rem 0;
          font-weight: 600;
          font-size: 0.9rem;
        }

        ul {
          margin: 0;
          padding-left: 1.25rem;
          list-style: none;
        }

        li {
          padding: 0.25rem 0;
          font-size: 0.9rem;
          color: var(--text);
        }

        .btn-upgrade {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: var(--cyan);
          color: var(--bg);
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
        }

        .btn-upgrade:hover {
          background: #00e5ff;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .assessment-limit-notice {
            flex-direction: column;
          }

          .notice-icon {
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}
