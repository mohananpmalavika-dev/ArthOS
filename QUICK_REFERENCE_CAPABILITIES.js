/**
 * QUICK REFERENCE: Feature Flags & Capabilities
 * Bookmark this for easy access while developing
 */

// ============================================================================
// 1. CHECK IF CAPABILITY IS ENABLED
// ============================================================================

import { useCapability } from './context/CapabilitiesContext';

function MyComponent() {
  const bankingEnabled = useCapability('banking:integration');
  
  if (!bankingEnabled) {
    return <p>Banking integration not available</p>;
  }
  
  return <BankingUI />;
}

// ============================================================================
// 2. CHECK FEATURE AVAILABILITY (WITH SUBSCRIPTION)
// ============================================================================

import useFeatureAvailability from './hooks/useFeatureAvailability';

function PremiumFeature() {
  const availability = useFeatureAvailability('ml:prediction-engine', {
    requireSubscription: true,
    minimumTier: 'pro'
  });
  
  if (availability.requiresAuth) return <LoginPrompt />;
  if (availability.requiresUpgrade) return <UpgradePrompt tier={availability.upgradeTo} />;
  if (!availability.available) return <Unavailable reason={availability.reason} />;
  
  return <PremiumUI />;
}

// ============================================================================
// 3. GET CAPABILITY DETAILS
// ============================================================================

import { useCapabilityDetails } from './context/CapabilitiesContext';

function FeatureInfo() {
  const details = useCapabilityDetails('coach:conversations');
  
  return (
    <div>
      <h3>{details.name}</h3>
      <p>{details.description}</p>
      {details.enabled ? '✅ Available' : `❌ ${details.reason}`}
    </div>
  );
}

// ============================================================================
// 4. GET ALL ENABLED FEATURES IN A CATEGORY
// ============================================================================

import { useEnabledCapabilitiesByCategory } from './context/CapabilitiesContext';

function AICategoryFeatures() {
  const aiFeatures = useEnabledCapabilitiesByCategory('ai');
  
  return (
    <div>
      {aiFeatures.map(feature => (
        <Feature key={feature.id} feature={feature} />
      ))}
    </div>
  );
}

// ============================================================================
// 5. CONDITIONAL NAVIGATION MENU
// ============================================================================

function MainNav() {
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

// ============================================================================
// 6. MULTIPLE CAPABILITIES (ALL)
// ============================================================================

function NeedsAll() {
  const allEnabled = useCapability(
    ['banking:integration', 'banking:transactions'],
    { requireAll: true }
  );
  
  if (!allEnabled) return <Unavailable />;
  return <Component />;
}

// ============================================================================
// 7. MULTIPLE CAPABILITIES (ANY)
// ============================================================================

function NeedsAny() {
  const anyEnabled = useCapability(
    ['banking:integration', 'banking:accounts'],
    { requireAll: false } // Default
  );
  
  if (!anyEnabled) return <Unavailable />;
  return <Component />;
}

// ============================================================================
// 8. USING HOC FOR COMPONENT GATING
// ============================================================================

import { withCapability } from './context/CapabilitiesContext';

const MyComponent = () => <div>Feature content</div>;
const MyDisabledComponent = () => <div>Feature not available</div>;

export const GatedComponent = withCapability(
  MyComponent,
  'banking:integration',
  { fallback: MyDisabledComponent }
);

// ============================================================================
// 9. ADMIN-ONLY FEATURES
// ============================================================================

function AdminFeature() {
  const availability = useFeatureAvailability('admin:user-management', {
    requireRole: 'admin'
  });
  
  if (!availability.available) {
    return <Unauthorized />;
  }
  
  return <AdminUI />;
}

// ============================================================================
// 10. SETUP IN APP.JSX
// ============================================================================

// Before:
/*
function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <MainApp />
      </SubscriptionProvider>
    </AuthProvider>
  );
}
*/

// After:
/*
import { CapabilitiesProvider } from './context/CapabilitiesContext';

function App() {
  return (
    <AuthProvider>
      <CapabilitiesProvider>
        <SubscriptionProvider>
          <MainApp />
        </SubscriptionProvider>
      </CapabilitiesProvider>
    </AuthProvider>
  );
}
*/

// ============================================================================
// CAPABILITY LIST
// ============================================================================

const CAPABILITIES = {
  // BANKING
  'banking:integration': 'Connect to financial institutions (requires BANKING_API_KEY)',
  'banking:transactions': 'View bank transactions',
  'banking:accounts': 'Account aggregation',
  'banking:credit-profile': 'Credit insights',

  // AI/COACH
  'coach:conversations': 'AI coaching (requires OPENAI_API_KEY)',
  'coach:memory': 'Persistent session memory',
  'coach:recommendations': 'AI recommendations',

  // ML
  'ml:prediction-engine': 'Financial forecasting (requires ML_ENABLED, beta)',
  'ml:risk-scoring': 'Risk assessment',
  'ml:opportunity-detection': 'Opportunity detection',

  // ANALYTICS
  'cognition:graph': 'Belief visualization',
  'cognition:bias-analysis': 'Bias detection',

  // DECISIONS
  'decisions:tracking': 'Decision logging',
  'decisions:intelligence': 'Decision quality scoring',

  // FOLLOW-UPS
  'followup:scheduling': 'Day 7 & Day 30 follow-ups',
  'followup:notifications': 'Email/SMS notifications (beta)',

  // SUBSCRIPTIONS
  'subscriptions:management': 'Subscription management (requires STRIPE_API_KEY)',
  'subscriptions:paywall': 'Feature paywall',

  // ADMIN (requires role: admin)
  'admin:dashboard': 'Admin interface',
  'admin:user-management': 'User management',
  'admin:feature-flags': 'Feature flag management',

  // B2B (requires B2B_ENABLED, admin only)
  'b2b:partner-dashboard': 'Partner management',
  'b2b:analytics': 'Partner analytics',

  // OTHER
  'learning:longitudinal': 'Health trends over time',
  'learning:patterns': 'Behavioral patterns',
  'marketplace:recommendations': 'Product recommendations (beta)',
  'twin:simulation': 'Digital twin simulation (beta)',
  'a11y:dark-mode': 'Dark mode support',
  'a11y:screen-reader': 'Accessibility support',
};

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const ENV_VARS = {
  'BANKING_API_KEY': 'Enable banking integration',
  'OPENAI_API_KEY': 'Enable AI Coach',
  'ML_ENABLED': 'Enable ML features',
  'B2B_ENABLED': 'Enable B2B features',
  'STRIPE_API_KEY': 'Enable subscriptions',
  'NOTIFICATIONS_ENABLED': 'Enable notifications',
  'MARKETPLACE_ENABLED': 'Enable marketplace',
  'TWIN_ENGINE_ENABLED': 'Enable digital twin',
};

// ============================================================================
// API ENDPOINT
// ============================================================================

// Fetch all capabilities
const response = await fetch('/api/config/capabilities?query=all&role=user');
const data = await response.json();

// Query modes:
// ?query=all - All capabilities
// ?query=enabled - Only enabled, by category
// ?query=category&category=banking - Specific category
// ?query=specific&capabilityId=banking:integration - Single capability
// &role=admin - Get capabilities for admin role

// ============================================================================
// HOOKS QUICK REFERENCE
// ============================================================================

/*
useCapability(capId)
  → boolean
  Check if capability is enabled

useCapabilityDetails(capId)
  → { name, description, enabled, reason, category, status, ... }
  Get full capability information

useCapabilitiesByCategory(category)
  → array of capabilities
  Get all capabilities in category

useEnabledCapabilitiesByCategory(category)
  → array of capabilities
  Get only enabled capabilities in category

useCapabilitiesStatus()
  → { loading, error, lastFetched, refetch }
  Get context status

useFeatureAvailability(capId, options)
  → { available, reason, requiresAuth, requiresSubscription, requiresUpgrade, upgradeTo }
  Check availability including subscription/auth/role
*/

// ============================================================================
// COMMON PATTERNS
// ============================================================================

// Pattern 1: Simple gating
if (useCapability('banking:integration')) {
  return <BankingUI />;
}

// Pattern 2: Premium feature
const avail = useFeatureAvailability('feature:id', {
  requireSubscription: true,
  minimumTier: 'pro'
});
if (avail.requiresUpgrade) return <UpgradePrompt />;
if (!avail.available) return <Unavailable />;

// Pattern 3: Admin only
const avail = useFeatureAvailability('admin:dashboard', {
  requireRole: 'admin'
});
if (!avail.available) return <Unauthorized />;

// Pattern 4: Category features
const features = useEnabledCapabilitiesByCategory('ai');
return features.map(f => <Feature key={f.id} feature={f} />);

// Pattern 5: Navigation
const enabled = useCapability('feature:id');
return enabled ? <Link to="/feature" /> : null;

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/*
Feature shows disabled but shouldn't:
1. Check environment variable is set: echo $BANKING_API_KEY
2. Restart server (env vars may be cached)
3. Clear browser cache and localStorage
4. Test endpoint directly: curl /api/config/capabilities

Can't fetch capabilities:
1. Verify /api/config/capabilities route exists in router
2. Check CapabilitiesProvider is wrapping your app
3. Check browser console for fetch errors
4. Test with curl to verify endpoint works

Wrong role for admin features:
1. Verify user.role is set during login
2. Check JWT includes role field
3. Test with ?role=admin in endpoint URL
*/

// ============================================================================

export const QUICK_REFERENCE = {
  hooks: {
    useCapability: 'Check if capability enabled',
    useCapabilityDetails: 'Get capability info',
    useCapabilitiesByCategory: 'Get capabilities by category',
    useEnabledCapabilitiesByCategory: 'Get only enabled',
    useCapabilitiesStatus: 'Get context status',
    useFeatureAvailability: 'Check availability (auth+sub+cap)',
  },
  components: {
    withCapability: 'HOC for component gating',
    CapabilityDisabledNotice: 'Show why feature unavailable',
  },
  setup: [
    'Install CapabilitiesProvider in App.jsx',
    'Add /api/config/capabilities route',
    'Set environment variables',
    'Use hooks in components',
  ],
};
