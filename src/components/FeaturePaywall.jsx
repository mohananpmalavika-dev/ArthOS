/**
 * Feature Paywall Component
 * Shows when user tries to access a premium feature
 */

import React, { useState } from 'react';
import { Lock, X, Zap } from 'lucide-react';
import { getFeaturePaywallMessage, getRecommendedUpgrade } from '../lib/featureGating.js';

export default function FeaturePaywall({
  isOpen,
  onClose,
  feature,
  currentTier = 'free',
  onUpgradeClick,
}) {
  if (!isOpen) return null;

  const message = getFeaturePaywallMessage(feature, currentTier);
  const recommendedTier = getRecommendedUpgrade(currentTier, feature);

  const tierPrices = {
    plus: { name: 'Plus', price: '$12.99/mo', benefits: ['Unlimited assessments', 'Score history', 'Digital Twin'] },
    pro: { name: 'Pro', price: '$29.99/mo', benefits: ['Plus benefits', 'Banking integration', 'AI Coach'] },
    elite: { name: 'Elite', price: '$79.99/mo', benefits: ['Pro benefits', 'AI Coach Concierge', 'Multi-family'] },
  };

  const recommended = tierPrices[recommendedTier];

  return (
    <div className="paywall-overlay" onClick={onClose}>
      <div className="paywall-modal" onClick={(e) => e.stopPropagation()}>
        <button className="paywall-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="paywall-icon">
          <Lock size={48} />
        </div>

        <h2>Unlock This Feature</h2>
        <p className="paywall-message">{message}</p>

        {recommended && (
          <div className="paywall-recommendation">
            <div className="recommendation-badge">
              <Zap size={16} />
              Recommended
            </div>

            <div className="tier-card">
              <h3>{recommended.name}</h3>
              <div className="tier-price">{recommended.price}</div>

              <ul className="tier-benefits">
                {recommended.benefits.map((benefit) => (
                  <li key={benefit}>✓ {benefit}</li>
                ))}
              </ul>

              <button
                className="btn-upgrade"
                onClick={() => {
                  onUpgradeClick?.(recommendedTier);
                  onClose();
                }}
              >
                Upgrade to {recommended.name}
              </button>
            </div>
          </div>
        )}

        <p className="paywall-footer">
          Already subscribed?{' '}
          <button className="btn-link" onClick={onClose}>
            Close
          </button>
        </p>
      </div>

      <style jsx>{`
        .paywall-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .paywall-modal {
          background: var(--bg, #050713);
          border: 2px solid var(--border);
          border-radius: 16px;
          padding: 2rem;
          max-width: 420px;
          width: 90%;
          position: relative;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .paywall-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .paywall-close:hover {
          color: var(--text);
        }

        .paywall-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
          color: var(--cyan);
        }

        h2 {
          text-align: center;
          margin: 0 0 0.75rem 0;
          color: var(--text);
          font-size: 1.5rem;
        }

        .paywall-message {
          text-align: center;
          color: var(--muted);
          margin: 0 0 1.5rem 0;
          font-size: 0.95rem;
        }

        .paywall-recommendation {
          margin: 1.5rem 0;
        }

        .recommendation-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(0, 255, 200, 0.1);
          color: var(--cyan);
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .tier-card {
          border: 2px solid var(--cyan);
          border-radius: 12px;
          padding: 1.5rem;
          background: rgba(0, 255, 200, 0.05);
        }

        .tier-card h3 {
          margin: 0 0 0.5rem 0;
          color: var(--text);
          font-size: 1.2rem;
        }

        .tier-price {
          color: var(--cyan);
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .tier-benefits {
          list-style: none;
          margin: 0 0 1.5rem 0;
          padding: 0;
        }

        .tier-benefits li {
          color: var(--text);
          padding: 0.5rem 0;
          font-size: 0.9rem;
        }

        .btn-upgrade {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--cyan);
          color: var(--bg);
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-upgrade:hover {
          background: #00e5ff;
          transform: translateY(-2px);
        }

        .paywall-footer {
          text-align: center;
          color: var(--muted);
          font-size: 0.85rem;
          margin: 1.5rem 0 0 0;
        }

        .btn-link {
          background: none;
          border: none;
          color: var(--cyan);
          cursor: pointer;
          text-decoration: underline;
          font-weight: 500;
          padding: 0;
        }

        .btn-link:hover {
          color: #00e5ff;
        }
      `}</style>
    </div>
  );
}
