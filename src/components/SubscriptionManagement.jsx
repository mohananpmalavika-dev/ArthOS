/**
 * Subscription Management Component
 * Shows current plan, billing info, and upgrade/downgrade options
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Check, Upgrade, AlertCircle, Loader } from 'lucide-react';
import { hasFeature, getTierFeatures, getNewFeaturesAtTier } from '../lib/featureGating.js';

const PLAN_INFO = {
  free: {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    cta: 'Current Plan',
    highlight: false,
  },
  plus: {
    name: 'Plus',
    price: '$12.99',
    period: '/month',
    description: 'Unlimited insights & tracking',
    cta: 'Upgrade to Plus',
    highlight: true,
  },
  pro: {
    name: 'Pro',
    price: '$29.99',
    period: '/month',
    description: 'Advanced features & AI coaching',
    cta: 'Upgrade to Pro',
    highlight: false,
  },
  elite: {
    name: 'Elite',
    price: '$79.99',
    period: '/month',
    description: 'Premium experience & concierge',
    cta: 'Upgrade to Elite',
    highlight: false,
  },
};

const FEATURE_LABELS = {
  basic_assessment: '43-Question Assessment',
  basic_score: 'Financial Health Score',
  personality_type: 'Personality Type',
  emotional_triggers: 'Emotional Triggers Analysis',
  money_beliefs: 'Money Beliefs Deep Dive',
  bias_analysis: 'Cognitive Bias Profile',
  score_history: 'Score Tracking & History',
  digital_twin_basic: 'Basic Digital Twin (1 scenario)',
  digital_twin_unlimited: 'Unlimited Digital Twin Scenarios',
  stress_testing: 'Stress Test Engine',
  banking_integration: 'Banking Integration (Plaid)',
  ai_coach_basic: 'AI Coach (Automated)',
  ai_coach_concierge: 'AI Coach Concierge (1-on-1)',
  weekly_checkins: 'Weekly Check-ins',
  action_follow_ups: 'Day-7 & Day-30 Follow-ups',
  pdf_export: 'PDF Report Export',
  multi_family: 'Multi-Family Profiles (5 users)',
  priority_support: 'Priority Email Support',
  data_export: 'Full Data Export (CSV/JSON)',
};

export default function SubscriptionManagement({ userId }) {
  const [currentTier, setCurrentTier] = useState('free');
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch current subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/subscriptions/${userId}`);
        const data = await response.json();

        setSubscription(data);
        setCurrentTier(data.tier || 'free');
        setError(null);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError('Could not load subscription info');
        setCurrentTier('free');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [userId]);

  // Handle upgrade
  const handleUpgrade = useCallback(
    async (planId) => {
      if (!userId || currentTier === planId) return;

      try {
        setUpgrading(true);
        setError(null);

        const response = await fetch(`/api/subscriptions/${userId}/upgrade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId }),
        });

        const result = await response.json();

        if (result.success || result.subscriptionId) {
          // Redirect to Stripe checkout or success page
          if (result.sessionUrl) {
            window.location.href = result.sessionUrl;
          } else {
            // Update local state
            setCurrentTier(planId);
            setSubscription({ ...subscription, tier: planId });
          }
        } else {
          setError(result.message || 'Upgrade failed');
        }
      } catch (err) {
        console.error('Error upgrading subscription:', err);
        setError('Failed to process upgrade');
      } finally {
        setUpgrading(false);
      }
    },
    [userId, currentTier, subscription]
  );

  if (loading) {
    return (
      <div className="subscription-container">
        <div className="subscription-loading">
          <Loader className="spinner" />
          <p>Loading plan details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-container">
      <div className="subscription-header">
        <h2>Your Plan</h2>
        <p>Upgrade anytime to unlock more features</p>
      </div>

      {error && (
        <div className="subscription-error">
          <AlertCircle />
          <p>{error}</p>
        </div>
      )}

      {/* Plan Cards */}
      <div className="subscription-plans">
        {Object.entries(PLAN_INFO).map(([planId, info]) => {
          const isCurrentPlan = currentTier === planId;
          const features = getTierFeatures(planId);

          return (
            <div
              key={planId}
              className={`plan-card ${isCurrentPlan ? 'active' : ''} ${
                info.highlight ? 'highlight' : ''
              }`}
            >
              {info.highlight && <div className="plan-badge">Most Popular</div>}

              <div className="plan-header">
                <h3>{info.name}</h3>
                <div className="plan-price">
                  <span className="price">{info.price}</span>
                  {info.period && <span className="period">{info.period}</span>}
                </div>
                <p className="plan-description">{info.description}</p>
              </div>

              <div className="plan-features">
                {Object.entries(features)
                  .filter(([, enabled]) => enabled)
                  .map(([featureKey]) => (
                    <div key={featureKey} className="feature-item">
                      <Check size={16} />
                      <span>{FEATURE_LABELS[featureKey]}</span>
                    </div>
                  ))}
              </div>

              <div className="plan-footer">
                {isCurrentPlan ? (
                  <button className="btn btn-primary" disabled>
                    Current Plan
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleUpgrade(planId)}
                    disabled={upgrading || currentTier === planId}
                  >
                    {upgrading ? (
                      <>
                        <Loader size={14} />
                        Upgrading...
                      </>
                    ) : (
                      <>
                        <Upgrade size={14} />
                        {info.cta}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Plan Details */}
      {subscription && (
        <div className="subscription-details">
          <div className="details-card">
            <h4>Plan Details</h4>
            <div className="detail-item">
              <span className="label">Current Plan:</span>
              <span className="value">{PLAN_INFO[currentTier]?.name}</span>
            </div>
            {subscription.status && (
              <div className="detail-item">
                <span className="label">Status:</span>
                <span className={`status status-${subscription.status}`}>
                  {subscription.status === 'trialing' ? 'Trial' : 'Active'}
                </span>
              </div>
            )}
            {subscription.currentPeriodEnd && (
              <div className="detail-item">
                <span className="label">Renews on:</span>
                <span className="value">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {currentTier !== 'free' && (
            <button className="btn btn-text" onClick={() => handleUpgrade('free')}>
              Downgrade to Free
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .subscription-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .subscription-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .subscription-header h2 {
          font-size: 1.8rem;
          margin: 0 0 0.5rem 0;
          color: var(--text);
        }

        .subscription-header p {
          color: var(--muted);
          margin: 0;
        }

        .subscription-error {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          margin-bottom: 2rem;
          color: #c33;
        }

        .subscription-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          gap: 1rem;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .subscription-plans {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .plan-card {
          border: 2px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          background: var(--bg-secondary, #1a1625);
          transition: all 0.3s ease;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .plan-card.highlight {
          border-color: var(--cyan);
          background: var(--bg-highlight, #0d1b1f);
          transform: scaleY(1.05);
        }

        .plan-card.active {
          border-color: var(--purple);
          background: var(--bg-active, #1a0f25);
        }

        .plan-card:hover {
          border-color: var(--cyan);
        }

        .plan-badge {
          position: absolute;
          top: -12px;
          left: 20px;
          background: var(--cyan);
          color: var(--bg);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .plan-header {
          margin-bottom: 1.5rem;
          padding-top: 0.5rem;
        }

        .plan-header h3 {
          font-size: 1.3rem;
          margin: 0 0 0.5rem 0;
          color: var(--text);
        }

        .plan-price {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .price {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--cyan);
        }

        .period {
          color: var(--muted);
          font-size: 0.9rem;
        }

        .plan-description {
          color: var(--muted);
          margin: 0;
          font-size: 0.9rem;
        }

        .plan-features {
          flex-grow: 1;
          margin-bottom: 1.5rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0;
          color: var(--text);
          font-size: 0.9rem;
        }

        .feature-item svg {
          color: var(--cyan);
          flex-shrink: 0;
        }

        .plan-footer {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          white-space: nowrap;
        }

        .btn-primary {
          background: var(--purple);
          color: var(--text);
          opacity: 0.6;
          cursor: default;
        }

        .btn-secondary {
          background: var(--cyan);
          color: var(--bg);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--cyan-bright, #00e5ff);
          transform: translateY(-2px);
        }

        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-text {
          background: none;
          color: var(--muted);
          padding: 0.5rem;
          text-decoration: underline;
        }

        .btn-text:hover {
          color: var(--text);
        }

        .subscription-details {
          background: var(--bg-secondary, #1a1625);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .details-card {
          margin-bottom: 1rem;
        }

        .details-card h4 {
          margin: 0 0 1rem 0;
          color: var(--text);
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border);
          color: var(--muted);
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-item .label {
          font-weight: 500;
        }

        .detail-item .value {
          color: var(--text);
          font-weight: 600;
        }

        .status {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .status-active {
          background: rgba(0, 255, 200, 0.2);
          color: var(--cyan);
        }

        .status-trialing {
          background: rgba(100, 200, 255, 0.2);
          color: #64c8ff;
        }

        @media (max-width: 768px) {
          .subscription-container {
            padding: 1rem;
          }

          .plan-card.highlight {
            transform: none;
          }

          .subscription-plans {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
