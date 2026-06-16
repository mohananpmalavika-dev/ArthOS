/**
 * Integration Guide: Adding Capabilities Provider to App.jsx
 * 
 * This file shows how to integrate the CapabilitiesProvider into your app.
 * Follow the steps below to add capability-driven feature gating.
 */

// ============================================================================
// STEP 1: Import the CapabilitiesProvider in your main App.jsx
// ============================================================================

// Add this import at the top of src/App.jsx:
// import { CapabilitiesProvider } from './context/CapabilitiesContext';

// ============================================================================
// STEP 2: Wrap your app with CapabilitiesProvider
// ============================================================================

// Before:
/*
function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        {/* Your app components *//*}
      </SubscriptionProvider>
    </AuthProvider>
  );
}
*/

// After:
/*
function App() {
  return (
    <AuthProvider>
      <CapabilitiesProvider>  {/* ADD THIS LINE */}
        <SubscriptionProvider>
          {/* Your app components */}
        </SubscriptionProvider>
      </CapabilitiesProvider>  {/* ADD THIS LINE */}
    </AuthProvider>
  );
}
*/

// ============================================================================
// STEP 3: Wrap sensitive modules with capability checks
// ============================================================================

// Example: Conditionally render banking module
/*
import { useCapability } from './context/CapabilitiesContext';

function Dashboard() {
  const bankingEnabled = useCapability('banking:integration');

  return (
    <div>
      {bankingEnabled && <BankingIntegrationModule />}
      <DecisionTracking />
      <AICoach />
    </div>
  );
}
*/

// ============================================================================
// STEP 4: Add capabilities endpoint to your API router
// ============================================================================

// In api/index.js, add this import:
// import capabilitiesHandler from '../api_src/config/capabilities-endpoint.js';

// Then add to routeDefinitions array:
/*
const routeDefinitions = [
  // ... existing routes ...
  
  // Add this:
  {
    pathname: '/api/config/capabilities',
    handler: capabilitiesHandler,
    methods: ['GET', 'OPTIONS'],
  },
];
*/

// ============================================================================
// STEP 5: Configure environment variables
// ============================================================================

// In your .env or .env.local, add:
/*
# Banking Integration
BANKING_API_KEY=your_plaid_key

# OpenAI for AI Coach
OPENAI_API_KEY=your_openai_key

# Machine Learning
ML_ENABLED=true

# B2B Partner Features
B2B_ENABLED=true

# Stripe for subscriptions
STRIPE_API_KEY=your_stripe_key

# Other features
NOTIFICATIONS_ENABLED=true
MARKETPLACE_ENABLED=true
TWIN_ENGINE_ENABLED=true
*/

// ============================================================================
// STEP 6: Test the integration
// ============================================================================

// 1. Start your app
// 2. Open browser DevTools → Network tab
// 3. Navigate to any page that uses useCapability hook
// 4. Look for request to /api/config/capabilities
// 5. Verify response includes all capabilities with correct status
//
// Example request:
// GET /api/config/capabilities?query=all&role=user
//
// Example response:
// {
//   "success": true,
//   "capabilities": {
//     "banking:integration": {
//       "name": "Banking Integration",
//       "enabled": false,
//       "reason": "Missing environment variable: BANKING_API_KEY"
//     },
//     "coach:conversations": {
//       "name": "AI Coach Conversations",
//       "enabled": true,
//       "description": "..."
//     }
//   }
// }

// ============================================================================
// STEP 7: Update components to use capability gating
// ============================================================================

// Example component modifications:

// BEFORE:
/*
function MainNavigation() {
  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/banking">Banking</Link>
      <Link to="/coach">AI Coach</Link>
      <Link to="/admin">Admin</Link>
    </nav>
  );
}
*/

// AFTER:
/*
import { useCapability } from './context/CapabilitiesContext';
import { useAuth } from './context/AuthContext';

function MainNavigation() {
  const { user } = useAuth();
  const bankingEnabled = useCapability('banking:integration');
  const coachEnabled = useCapability('coach:conversations');
  const adminEnabled = useCapability('admin:dashboard');

  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      {bankingEnabled && <Link to="/banking">Banking</Link>}
      {coachEnabled && <Link to="/coach">AI Coach</Link>}
      {adminEnabled && <Link to="/admin">Admin</Link>}
    </nav>
  );
}
*/

// ============================================================================
// STEP 8: Add feature availability checks (advanced)
// ============================================================================

// For features that require subscriptions:
/*
import useFeatureAvailability from './hooks/useFeatureAvailability';

function PredictionEngine() {
  const availability = useFeatureAvailability('ml:prediction-engine', {
    requireSubscription: true,
    minimumTier: 'pro'
  });

  if (availability.requiresAuth) {
    return <LoginPrompt />;
  }

  if (availability.requiresUpgrade) {
    return (
      <UpgradePrompt
        feature="Prediction Engine"
        tier={availability.upgradeTo}
      />
    );
  }

  if (!availability.available) {
    return <p>Feature unavailable: {availability.reason}</p>;
  }

  return <PredictionUI />;
}
*/

// ============================================================================
// STEP 9: Monitor capability status
// ============================================================================

// Optional: Create a capability status page for debugging
/*
import { useCapabilitiesStatus, useCapability } from './context/CapabilitiesContext';

function CapabilityStatusPage() {
  const { loading, error, lastFetched, refetch } = useCapabilitiesStatus();

  if (loading) return <p>Loading capabilities...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>System Capabilities</h2>
      <p>Last updated: {lastFetched?.toLocaleString()}</p>
      <button onClick={refetch}>Refresh</button>

      {/* List capabilities here */}
    </div>
  );
}
*/

// ============================================================================
// Reference: Complete Integration Example
// ============================================================================

/*
// src/App.jsx
import { useState, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CapabilitiesProvider } from './context/CapabilitiesContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import MainNavigation from './components/MainNavigation';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <AuthProvider>
      <CapabilitiesProvider>
        <SubscriptionProvider>
          <MainNavigation />
          <Suspense fallback={<div>Loading...</div>}>
            <Dashboard />
          </Suspense>
        </SubscriptionProvider>
      </CapabilitiesProvider>
    </AuthProvider>
  );
}

export default App;

// ============================================================================

// src/components/MainNavigation.jsx
import { useCapability } from '../context/CapabilitiesContext';
import { useAuth } from '../context/AuthContext';

function MainNavigation() {
  const { user } = useAuth();
  const bankingEnabled = useCapability('banking:integration');
  const coachEnabled = useCapability('coach:conversations');
  const adminEnabled = useCapability('admin:dashboard');

  return (
    <nav className="main-navigation">
      <ul>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/decisions">Decisions</a></li>
        
        {bankingEnabled && (
          <li><a href="/banking">Banking</a></li>
        )}
        
        {coachEnabled && (
          <li><a href="/coach">AI Coach</a></li>
        )}
        
        <li><a href="/analytics">Analytics</a></li>
        
        {adminEnabled && (
          <li><a href="/admin">Admin</a></li>
        )}
      </ul>
    </nav>
  );
}

export default MainNavigation;

// ============================================================================

// src/pages/Dashboard.jsx
import { useCapability } from '../context/CapabilitiesContext';
import useFeatureAvailability from '../hooks/useFeatureAvailability';
import BankingModule from '../components/BankingModule';
import CoachModule from '../components/CoachModule';
import AnalyticsModule from '../components/AnalyticsModule';

function Dashboard() {
  const bankingEnabled = useCapability('banking:integration');
  const coachAvailability = useFeatureAvailability('coach:conversations');
  const analyticsEnabled = useCapability('cognition:graph');

  return (
    <div className="dashboard">
      <h1>Financial Dashboard</h1>

      {bankingEnabled && <BankingModule />}

      {coachAvailability.available ? (
        <CoachModule />
      ) : coachAvailability.requiresAuth ? (
        <p>Please log in to use AI Coach.</p>
      ) : (
        <p>AI Coach is not available in this configuration.</p>
      )}

      {analyticsEnabled && <AnalyticsModule />}
    </div>
  );
}

export default Dashboard;

// ============================================================================

// api/index.js (excerpt)
import capabilitiesHandler from '../api_src/config/capabilities-endpoint.js';
import loginHandler from '../api_src/auth/login.js';
// ... other imports

const routeDefinitions = [
  { pathname: '/api/config/capabilities', handler: capabilitiesHandler },
  { pathname: '/api/auth/login', handler: loginHandler },
  // ... other routes
];

// ============================================================================
*/

export const INTEGRATION_EXAMPLE = {
  steps: [
    'Import CapabilitiesProvider in App.jsx',
    'Wrap app with CapabilitiesProvider',
    'Update sensitive modules with capability checks',
    'Add capabilities endpoint to API router',
    'Configure environment variables',
    'Test the integration via browser DevTools',
    'Update components to hide/show based on capabilities',
    'Add feature availability checks for subscriptions',
    'Monitor capability status in production',
  ],
  completed: false,
};
