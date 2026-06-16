/**
 * Feature Gate Examples
 * 
 * Demonstrates how to use the capabilities and feature availability system
 * in React components.
 */

import React from 'react';
import {
  useCapability,
  useCapabilityDetails,
  useEnabledCapabilitiesByCategory,
  CapabilityDisabledNotice,
  withCapability,
} from '../context/CapabilitiesContext';
import useFeatureAvailability from '../hooks/useFeatureAvailability';

/**
 * Example 1: Simple capability check
 * Show component only if capability is enabled
 */
export function BankingIntegrationModule() {
  const bankingEnabled = useCapability('banking:integration');

  if (!bankingEnabled) {
    return (
      <CapabilityDisabledNotice
        capabilityId="banking:integration"
        fallbackText="Banking integration is not available in your region or configuration."
      />
    );
  }

  return (
    <div className="banking-module">
      <h2>Banking Integration</h2>
      <p>Connect your financial accounts...</p>
    </div>
  );
}

/**
 * Example 2: Feature availability with subscription check
 * Checks both capability AND subscription tier
 */
export function PredictionEngineModule() {
  const availability = useFeatureAvailability('ml:prediction-engine', {
    requireSubscription: true,
    minimumTier: 'pro', // Requires Pro or higher
  });

  if (!availability.available) {
    if (availability.requiresSubscription) {
      return (
        <div className="feature-paywall">
          <h3>Advanced Forecasting</h3>
          <p>Upgrade to Pro to unlock financial forecasting and scenario analysis.</p>
          <button onClick={() => window.location.href = '/upgrade'}>Upgrade Now</button>
        </div>
      );
    }

    if (availability.requiresAuth) {
      return <div>Please log in to access this feature.</div>;
    }

    return <CapabilityDisabledNotice capabilityId="ml:prediction-engine" />;
  }

  return (
    <div className="prediction-module">
      <h2>Financial Forecasting</h2>
      <p>Generate forecasts and scenarios for your financial future...</p>
    </div>
  );
}

/**
 * Example 3: Multiple capability check with details
 * Show different content based on which capabilities are available
 */
export function AnalyticsDashboard() {
  const cognitionEnabled = useCapability('cognition:graph');
  const mlEnabled = useCapability('ml:prediction-engine');
  const biasEnabled = useCapability('cognition:bias-analysis');

  const cognitionDetails = useCapabilityDetails('cognition:graph');
  const mlDetails = useCapabilityDetails('ml:prediction-engine');

  return (
    <div className="analytics-dashboard">
      <h2>Financial Analytics</h2>

      {cognitionEnabled ? (
        <div className="analytics-card">
          <h3>Cognition Graph</h3>
          <p>{cognitionDetails.description}</p>
          {/* Render cognition graph component */}
        </div>
      ) : (
        <CapabilityDisabledNotice capabilityId="cognition:graph" />
      )}

      {mlEnabled ? (
        <div className="analytics-card">
          <h3>Prediction Engine</h3>
          <p>{mlDetails.description}</p>
          {mlDetails.status === 'beta' && (
            <span className="badge-beta">BETA</span>
          )}
          {/* Render prediction engine component */}
        </div>
      ) : (
        <div className="analytics-placeholder">
          <p>{mlDetails.reason}</p>
        </div>
      )}

      {biasEnabled && (
        <div className="analytics-card">
          <h3>Bias Analysis</h3>
          {/* Render bias analysis component */}
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Category-based rendering
 * Show all enabled features in a category
 */
export function AvailableFeaturesPanel() {
  const bankingFeatures = useEnabledCapabilitiesByCategory('banking');
  const aiFeatures = useEnabledCapabilitiesByCategory('ai');
  const analyticsFeatures = useEnabledCapabilitiesByCategory('analytics');

  return (
    <div className="features-panel">
      <h2>Available Features</h2>

      {bankingFeatures.length > 0 && (
        <div className="feature-category">
          <h3>Banking</h3>
          <ul>
            {bankingFeatures.map(f => (
              <li key={f.id}>
                <strong>{f.name}</strong>
                <p>{f.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {aiFeatures.length > 0 && (
        <div className="feature-category">
          <h3>AI & Coaching</h3>
          <ul>
            {aiFeatures.map(f => (
              <li key={f.id}>
                <strong>{f.name}</strong>
                <p>{f.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analyticsFeatures.length > 0 && (
        <div className="feature-category">
          <h3>Analytics</h3>
          <ul>
            {analyticsFeatures.map(f => (
              <li key={f.id}>
                <strong>{f.name}</strong>
                <p>{f.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: Using HOC for feature-gated component
 */
function CoachConversationUI() {
  return (
    <div className="coach-ui">
      <h2>AI Financial Coach</h2>
      <p>Start a conversation about your financial goals...</p>
    </div>
  );
}

function CoachUnavailable({ availability }) {
  return (
    <div className="coach-unavailable">
      <p>AI Coach is not available: {availability.reason}</p>
      {availability.requiresSubscription && (
        <button onClick={() => window.location.href = '/upgrade'}>
          Upgrade to access AI Coach
        </button>
      )}
    </div>
  );
}

export const CoachModule = withCapability(
  CoachConversationUI,
  'coach:conversations',
  { fallback: CoachUnavailable }
);

/**
 * Example 6: Admin capability check with role
 */
export function AdminDashboard() {
  const adminEnabled = useCapability('admin:dashboard');
  const userMgmtEnabled = useCapability('admin:user-management');
  const ffEnabled = useCapability('admin:feature-flags');

  if (!adminEnabled) {
    return <div>You don't have permission to access the admin dashboard.</div>;
  }

  return (
    <div className="admin-dashboard">
      <h2>Administration</h2>

      {userMgmtEnabled && (
        <div className="admin-section">
          <h3>User Management</h3>
          {/* User management interface */}
        </div>
      )}

      {ffEnabled && (
        <div className="admin-section">
          <h3>Feature Flags</h3>
          {/* Feature flag management interface */}
        </div>
      )}
    </div>
  );
}

/**
 * Example 7: Navigation menu with capability-driven visibility
 */
export function MainNavigation() {
  const bankingEnabled = useCapability('banking:integration');
  const b2bEnabled = useCapability('b2b:partner-dashboard');
  const coachEnabled = useCapability('coach:conversations');
  const adminEnabled = useCapability('admin:dashboard');

  return (
    <nav className="main-nav">
      <ul>
        <li><a href="/dashboard">Dashboard</a></li>

        {bankingEnabled && (
          <li><a href="/banking">Banking</a></li>
        )}

        {coachEnabled && (
          <li><a href="/coach">AI Coach</a></li>
        )}

        {b2bEnabled && (
          <li><a href="/b2b">Partners</a></li>
        )}

        <li><a href="/analytics">Analytics</a></li>

        {adminEnabled && (
          <li><a href="/admin">Admin</a></li>
        )}
      </ul>
    </nav>
  );
}

export default {
  BankingIntegrationModule,
  PredictionEngineModule,
  AnalyticsDashboard,
  AvailableFeaturesPanel,
  CoachModule,
  AdminDashboard,
  MainNavigation,
};
