# Feature Flags & Capability Registry Implementation Guide

## Overview

The Feature Flags and Capability Registry system allows ArthOS to dynamically enable/disable features based on:

1. **Environment Configuration** - Which backend services are enabled
2. **User Role** - Admin vs. regular user capabilities
3. **Subscription Tier** - Feature gating behind payment tiers
4. **Dependencies** - Features with prerequisites that must also be enabled
5. **Status** - Beta features, maintenance mode, etc.

## Architecture

### 1. Backend Capabilities Registry (`api_src/config/capabilities.js`)

Defines all available capabilities and their requirements:

```javascript
'banking:integration': {
  name: 'Banking Integration',
  description: 'Connect to financial institutions',
  category: 'banking',
  enabled: !!process.env.BANKING_API_KEY,  // Gated by environment
  requiresEnv: ['BANKING_API_KEY'],
  dependsOn: [],  // No dependencies
}
```

### 2. Backend Capabilities API (`api_src/config/capabilities-endpoint.js`)

Endpoint: `GET /api/config/capabilities`

Returns the capability registry for the current user, respecting their role and the system configuration.

**Query Parameters:**
- `query=all` - All capabilities with status
- `query=enabled` - Only enabled capabilities grouped by category
- `query=category&category=banking` - Specific category
- `query=specific&capabilityId=banking:integration` - Single capability
- `role=admin|user` - User role for filtering

**Response:**
```json
{
  "success": true,
  "capabilities": {
    "banking:integration": {
      "name": "Banking Integration",
      "enabled": true,
      "description": "...",
      "category": "banking",
      "status": "stable"
    },
    "ml:prediction-engine": {
      "name": "Prediction Engine",
      "enabled": false,
      "reason": "Missing environment variable: ML_ENABLED"
    }
  },
  "userRole": "user",
  "timestamp": "2026-06-16T..."
}
```

### 3. Frontend Capabilities Context (`src/context/CapabilitiesContext.jsx`)

React Context for managing capabilities in the UI.

**Hooks:**
- `useCapability(capId)` - Check if capability is enabled
- `useCapabilityDetails(capId)` - Get full capability info
- `useCapabilitiesByCategory(category)` - Get all capabilities in category
- `useEnabledCapabilitiesByCategory(category)` - Get only enabled ones
- `withCapability(Component, capId)` - HOC for gating components

### 4. Feature Availability Hook (`src/hooks/useFeatureAvailability.js`)

Higher-level hook combining capabilities + subscription + auth.

```javascript
const availability = useFeatureAvailability('ml:prediction-engine', {
  requireSubscription: true,
  minimumTier: 'pro'
});

if (!availability.available) {
  // Handle unavailable feature
  // - Check availability.requiresAuth
  // - Check availability.requiresUpgrade
  // - Show appropriate UI
}
```

## Integration Steps

### Step 1: Install Capabilities Provider in App.jsx

```jsx
import { CapabilitiesProvider } from './context/CapabilitiesContext';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <CapabilitiesProvider>
        {/* Rest of app */}
      </CapabilitiesProvider>
    </AuthProvider>
  );
}
```

### Step 2: Use Capabilities in Components

**Option A: Simple capability check**
```jsx
function BankingModule() {
  const bankingEnabled = useCapability('banking:integration');

  if (!bankingEnabled) {
    return <CapabilityDisabledNotice capabilityId="banking:integration" />;
  }

  return <BankingUI />;
}
```

**Option B: Feature availability (with subscription)**
```jsx
function PredictionEngine() {
  const availability = useFeatureAvailability('ml:prediction-engine', {
    requireSubscription: true,
    minimumTier: 'pro'
  });

  if (availability.requiresUpgrade) {
    return <UpgradePrompt upgradeTo={availability.upgradeTo} />;
  }

  if (!availability.available) {
    return <FeatureUnavailable reason={availability.reason} />;
  }

  return <PredictionUI />;
}
```

**Option C: Using HOC**
```jsx
const GuardedComponent = withCapability(
  MyComponent,
  'banking:integration',
  { fallback: DisabledFallback }
);
```

**Option D: Category-based rendering**
```jsx
function Dashboard() {
  const bankingFeatures = useEnabledCapabilitiesByCategory('banking');
  const aiFeatures = useEnabledCapabilitiesByCategory('ai');

  return (
    <div>
      {bankingFeatures.map(f => (
        <section key={f.id}>{f.name}</section>
      ))}
      {aiFeatures.map(f => (
        <section key={f.id}>{f.name}</section>
      ))}
    </div>
  );
}
```

### Step 3: Configure Environment Variables

```bash
# Enable banking integration
BANKING_API_KEY=your_key

# Enable ML features
ML_ENABLED=true

# Enable AI Coach
OPENAI_API_KEY=your_key

# Enable B2B features
B2B_ENABLED=true

# Enable notifications
NOTIFICATIONS_ENABLED=true

# Enable marketplace
MARKETPLACE_ENABLED=true

# Enable digital twin
TWIN_ENGINE_ENABLED=true
```

### Step 4: Hook Capabilities API into Router

In your API router (`api/index.js`), add the capabilities endpoint:

```javascript
import capabilitiesHandler from './config/capabilities-endpoint.js';

const routeDefinitions = [
  // ... existing routes
  { pathname: '/api/config/capabilities', handler: capabilitiesHandler, methods: ['GET'] },
];
```

## Feature Categories

Capabilities are organized by category for easy discovery:

- **core** - Essential features (auth, basic functionality)
- **banking** - Banking integration and financial data
- **b2b** - Partner and business-to-business features
- **analytics** - Data analysis and insights
- **ml** - Machine learning and AI
- **ai** - AI coaches and assistants
- **billing** - Subscription and payment features
- **admin** - Administrative capabilities
- **marketplace** - Third-party integrations
- **simulation** - Digital twin and simulation
- **ux** - UI/UX features
- **engagement** - User engagement features

## Environment Variable Reference

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `JWT_SECRET` | JWT signing key | 'arthos-dev-secret-...' | No (has fallback) |
| `BANKING_API_KEY` | Plaid/Yodlee API key | undefined | No |
| `OPENAI_API_KEY` | OpenAI API key | undefined | No |
| `ML_ENABLED` | Enable ML features | undefined | No |
| `B2B_ENABLED` | Enable B2B features | undefined | No |
| `STRIPE_API_KEY` | Stripe API key | undefined | No |
| `NOTIFICATIONS_ENABLED` | Enable notifications | undefined | No |
| `MARKETPLACE_ENABLED` | Enable marketplace | undefined | No |
| `TWIN_ENGINE_ENABLED` | Enable digital twin | undefined | No |

## Adding New Capabilities

1. **Define in registry** (`api_src/config/capabilities.js`):
```javascript
'myapp:new-feature': {
  name: 'New Feature',
  description: 'What this feature does',
  category: 'my-category',
  enabled: !!process.env.NEW_FEATURE_ENABLED,
  requiresEnv: ['NEW_FEATURE_ENABLED'],
  dependsOn: ['core:auth'], // If it depends on other features
  status: 'beta', // or 'stable'
}
```

2. **Use in components**:
```jsx
const enabled = useCapability('myapp:new-feature');
```

3. **Set environment variable**:
```bash
NEW_FEATURE_ENABLED=true
```

## Advanced Usage

### Conditional Rendering with Multiple Features

```jsx
// Require ALL features enabled
const allEnabled = useCapability(
  ['banking:integration', 'banking:transactions'],
  { requireAll: true }
);

// Require ANY feature enabled
const anyEnabled = useCapability(
  ['banking:integration', 'banking:accounts'],
  { requireAll: false } // Default
);
```

### Beta Feature Handling

```jsx
const details = useCapabilityDetails('ml:prediction-engine');

if (details.status === 'beta') {
  return (
    <div className="beta-warning">
      This feature is in beta. Report issues or provide feedback.
    </div>
  );
}
```

### Admin-only Features

```javascript
const availability = useFeatureAvailability('admin:user-management', {
  requireRole: 'admin'
});

if (!availability.available) {
  return <Unauthorized />;
}
```

### Feature Gating by Subscription AND Capability

```jsx
function AdvancedAnalytics() {
  // Must have both the capability enabled AND pro subscription
  const availability = useFeatureAvailability('ml:prediction-engine', {
    requireSubscription: true,
    minimumTier: 'pro'
  });

  if (availability.requiresAuth) {
    return <LoginPrompt />;
  }

  if (availability.requiresUpgrade) {
    return (
      <PaywallCard
        feature="Advanced Analytics"
        tier={availability.upgradeTo}
        onUpgrade={() => redirectToCheckout(availability.upgradeTo)}
      />
    );
  }

  if (!availability.available) {
    return <FeatureDisabled reason={availability.reason} />;
  }

  return <AnalyticsUI />;
}
```

## Testing

### Test Capability Detection

```javascript
// In Node.js / test environment
import { isCapabilityEnabled, getCapabilitiesStatus } from './api_src/config/capabilities.js';

// Test without environment variables
const result1 = isCapabilityEnabled('banking:integration');
console.assert(!result1.enabled, 'Should be disabled without API key');

// Test with environment variables
process.env.BANKING_API_KEY = 'test-key';
const result2 = isCapabilityEnabled('banking:integration');
console.assert(result2.enabled, 'Should be enabled with API key');

// Test dependencies
const result3 = isCapabilityEnabled('banking:transactions');
console.assert(result3.enabled, 'Dependent feature should also be enabled');
```

### Test Frontend Hook

```javascript
// In React component test
import { renderHook } from '@testing-library/react';
import { useCapability } from './src/context/CapabilitiesContext';

test('useCapability returns correct status', () => {
  const { result } = renderHook(() => useCapability('banking:integration'));
  expect(result.current).toBe(true); // or false depending on env
});
```

## Deployment Checklist

- [ ] Add `.env` variables for features you want to enable
- [ ] Test capabilities endpoint: `GET /api/config/capabilities?role=admin`
- [ ] Wrap sensitive modules with capability checks
- [ ] Test with capabilities disabled to verify fallback UI works
- [ ] Document which features are enabled in production
- [ ] Set up monitoring for feature flag changes
- [ ] Create runbook for enabling/disabling features in production

## Troubleshooting

**Q: Feature still shows even though I disabled it in environment**
- A: Clear browser cache and localStorage. CapabilitiesProvider caches results.
- Solution: Call `refetch()` from `useCapabilitiesStatus()` hook

**Q: Admin features showing for non-admin users**
- A: Check that user role is being passed correctly to capabilities endpoint
- Solution: Verify `user.role` is set during login

**Q: New capability not showing up**
- A: Need to restart backend server for environment variable changes to take effect
- Solution: Redeploy or restart the API server

**Q: Capabilities endpoint returns 500**
- A: Check server logs for missing environment variable errors
- Solution: Verify all `requiresEnv` variables are set

## Best Practices

1. **Always provide fallback UI** - Show disabled notice or upgrade prompt
2. **Group related capabilities** - Use `dependsOn` to ensure prerequisites
3. **Name clearly** - Use format `category:feature-name`
4. **Document dependencies** - List why a capability is disabled
5. **Test in degraded mode** - Verify app works with minimal capabilities
6. **Version capabilities** - Track when new capabilities were added
7. **Monitor usage** - Log which capabilities users try to access
8. **Provide clear errors** - Tell users exactly why a feature is unavailable

## Examples

See `src/components/FeatureGateExamples.jsx` for complete working examples including:
- Simple capability checks
- Feature availability with subscription
- Multiple capability checks
- Category-based rendering
- Admin dashboard
- Navigation menu with capability-driven visibility
