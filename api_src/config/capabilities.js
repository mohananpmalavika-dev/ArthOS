/**
 * Capability Registry
 * 
 * Defines which features/modules are available in the system.
 * Can be overridden by environment variables or database configuration.
 * 
 * Each capability can be:
 * - ENABLED: Feature is fully available
 * - DISABLED: Feature is hidden from UI
 * - BETA: Feature is available but marked as experimental
 * - MAINTENANCE: Feature is temporarily unavailable
 */

// Feature capability definitions
const CAPABILITIES = {
  // Core authentication & identity
  'auth:jwt': {
    name: 'JWT Authentication',
    description: 'JWT-based user authentication',
    category: 'core',
    required: true, // Cannot be disabled
    enabled: true,
  },

  // Banking integration
  'banking:integration': {
    name: 'Banking Integration',
    description: 'Connect to financial institutions via Plaid/Yodlee',
    category: 'banking',
    enabled: !!process.env.BANKING_API_KEY,
    requiresEnv: ['BANKING_API_KEY'],
  },
  'banking:transactions': {
    name: 'Transaction History',
    description: 'View and analyze bank transactions',
    category: 'banking',
    enabled: !!process.env.BANKING_API_KEY,
    dependsOn: ['banking:integration'],
  },
  'banking:accounts': {
    name: 'Account Summary',
    description: 'Multi-account aggregation dashboard',
    category: 'banking',
    enabled: !!process.env.BANKING_API_KEY,
    dependsOn: ['banking:integration'],
  },
  'banking:credit-profile': {
    name: 'Credit Profile',
    description: 'Credit score and profile insights',
    category: 'banking',
    enabled: !!process.env.BANKING_API_KEY,
    dependsOn: ['banking:integration'],
  },

  // B2B partner features
  'b2b:partner-dashboard': {
    name: 'Partner Dashboard',
    description: 'B2B partner management and analytics',
    category: 'b2b',
    enabled: !!process.env.B2B_ENABLED,
    requiresRole: 'admin',
  },
  'b2b:analytics': {
    name: 'Partner Analytics',
    description: 'Advanced analytics for B2B partners',
    category: 'b2b',
    enabled: !!process.env.B2B_ENABLED,
    dependsOn: ['b2b:partner-dashboard'],
  },

  // Cognition graph / reasoning
  'cognition:graph': {
    name: 'Cognition Graph',
    description: 'Visual representation of financial beliefs and biases',
    category: 'analytics',
    enabled: true,
  },
  'cognition:bias-analysis': {
    name: 'Bias Analysis',
    description: 'Detailed cognitive bias detection and scoring',
    category: 'analytics',
    enabled: true,
  },

  // Machine learning features
  'ml:prediction-engine': {
    name: 'Prediction Engine',
    description: 'Financial forecasting and scenario analysis',
    category: 'ml',
    enabled: !!process.env.ML_ENABLED,
    requiresEnv: ['ML_ENABLED'],
    status: 'beta',
  },
  'ml:risk-scoring': {
    name: 'Risk Scoring',
    description: 'ML-based risk assessment and scoring',
    category: 'ml',
    enabled: !!process.env.ML_ENABLED,
    dependsOn: ['ml:prediction-engine'],
  },
  'ml:opportunity-detection': {
    name: 'Opportunity Detection',
    description: 'AI-powered financial opportunity identification',
    category: 'ml',
    enabled: !!process.env.ML_ENABLED,
    dependsOn: ['ml:prediction-engine'],
  },

  // AI Coach features
  'coach:conversations': {
    name: 'AI Coach Conversations',
    description: 'Conversational AI coaching for financial goals',
    category: 'ai',
    enabled: !!process.env.OPENAI_API_KEY,
    requiresEnv: ['OPENAI_API_KEY'],
  },
  'coach:memory': {
    name: 'Coach Memory',
    description: 'Persistent coaching session memory and context',
    category: 'ai',
    enabled: !!process.env.OPENAI_API_KEY,
    dependsOn: ['coach:conversations'],
  },
  'coach:recommendations': {
    name: 'Coach Recommendations',
    description: 'Personalized financial recommendations from AI coach',
    category: 'ai',
    enabled: !!process.env.OPENAI_API_KEY,
    dependsOn: ['coach:conversations'],
  },

  // Decision tracking
  'decisions:tracking': {
    name: 'Decision Tracking',
    description: 'Track and analyze financial decisions',
    category: 'core',
    enabled: true,
  },
  'decisions:intelligence': {
    name: 'Decision Intelligence',
    description: 'AI-powered decision quality scoring',
    category: 'analytics',
    enabled: true,
  },

  // Follow-up system
  'followup:scheduling': {
    name: 'Follow-up Scheduling',
    description: 'Day 7 and Day 30 action follow-ups',
    category: 'engagement',
    enabled: true,
  },
  'followup:notifications': {
    name: 'Follow-up Notifications',
    description: 'Email/SMS notifications for follow-ups',
    category: 'engagement',
    enabled: !!process.env.NOTIFICATIONS_ENABLED,
    status: 'beta',
  },

  // Longitudinal learning
  'learning:longitudinal': {
    name: 'Longitudinal Learning',
    description: 'Track financial health trends over time',
    category: 'analytics',
    enabled: true,
  },
  'learning:patterns': {
    name: 'Pattern Recognition',
    description: 'Behavioral and financial pattern analysis',
    category: 'analytics',
    enabled: true,
  },

  // Subscription & monetization
  'subscriptions:management': {
    name: 'Subscription Management',
    description: 'User subscription tier management',
    category: 'billing',
    enabled: !!process.env.STRIPE_API_KEY,
    requiresEnv: ['STRIPE_API_KEY'],
  },
  'subscriptions:paywall': {
    name: 'Feature Paywall',
    description: 'Gated premium features behind subscription tiers',
    category: 'billing',
    enabled: !!process.env.STRIPE_API_KEY,
    dependsOn: ['subscriptions:management'],
  },

  // Admin features
  'admin:dashboard': {
    name: 'Admin Dashboard',
    description: 'System administration and monitoring',
    category: 'admin',
    enabled: true,
    requiresRole: 'admin',
  },
  'admin:user-management': {
    name: 'User Management',
    description: 'Admin user and role management',
    category: 'admin',
    enabled: true,
    requiresRole: 'admin',
  },
  'admin:feature-flags': {
    name: 'Feature Flags Management',
    description: 'Runtime feature flag configuration',
    category: 'admin',
    enabled: true,
    requiresRole: 'admin',
  },

  // Marketplace
  'marketplace:recommendations': {
    name: 'Marketplace Recommendations',
    description: 'Financial product recommendations',
    category: 'marketplace',
    enabled: !!process.env.MARKETPLACE_ENABLED,
    status: 'beta',
  },

  // Digital twin
  'twin:simulation': {
    name: 'Digital Twin Simulation',
    description: 'Financial scenario simulation engine',
    category: 'simulation',
    enabled: !!process.env.TWIN_ENGINE_ENABLED,
    status: 'beta',
  },

  // Accessibility
  'a11y:dark-mode': {
    name: 'Dark Mode',
    description: 'Dark theme support',
    category: 'ux',
    enabled: true,
  },
  'a11y:screen-reader': {
    name: 'Screen Reader Support',
    description: 'ARIA labels and accessibility features',
    category: 'ux',
    enabled: true,
  },
};

/**
 * Check if a capability is enabled
 * Resolves dependencies and environment requirements
 * @param {string} capabilityId - The capability identifier
 * @param {object} options - { userRole, requiredEnv, forceDisabled }
 * @returns {object} { enabled: boolean, reason?: string }
 */
function isCapabilityEnabled(capabilityId, options = {}) {
  const cap = CAPABILITIES[capabilityId];

  if (!cap) {
    return { enabled: false, reason: `Unknown capability: ${capabilityId}` };
  }

  // Check if explicitly disabled
  if (options.forceDisabled?.[capabilityId]) {
    return { enabled: false, reason: 'Explicitly disabled' };
  }

  // Check required role
  if (cap.requiresRole && options.userRole !== cap.requiresRole) {
    return { enabled: false, reason: `Requires role: ${cap.requiresRole}` };
  }

  // Check required environment variables
  if (cap.requiresEnv) {
    for (const envVar of cap.requiresEnv) {
      if (!process.env[envVar]) {
        return { enabled: false, reason: `Missing environment variable: ${envVar}` };
      }
    }
  }

  // Check dependencies
  if (cap.dependsOn) {
    for (const depId of cap.dependsOn) {
      const depResult = isCapabilityEnabled(depId, options);
      if (!depResult.enabled) {
        return { enabled: false, reason: `Dependency disabled: ${depId}` };
      }
    }
  }

  // Base enabled status
  return { enabled: cap.enabled };
}

/**
 * Get all capabilities with their status
 * @param {object} options - { userRole, forceDisabled }
 * @returns {object} Map of capability ID to status
 */
function getCapabilitiesStatus(options = {}) {
  const result = {};

  for (const [capId, capDef] of Object.entries(CAPABILITIES)) {
    const { enabled, reason } = isCapabilityEnabled(capId, options);
    result[capId] = {
      ...capDef,
      enabled,
      reason,
    };
  }

  return result;
}

/**
 * Get capabilities by category
 * @param {string} category - Category name
 * @param {object} options - { userRole, onlyEnabled }
 * @returns {object[]} Array of capabilities in category
 */
function getCapabilitiesByCategory(category, options = {}) {
  const result = [];

  for (const [capId, capDef] of Object.entries(CAPABILITIES)) {
    if (capDef.category !== category) continue;

    const { enabled, reason } = isCapabilityEnabled(capId, options);

    if (options.onlyEnabled && !enabled) continue;

    result.push({
      id: capId,
      ...capDef,
      enabled,
      reason,
    });
  }

  return result;
}

/**
 * Get capability details
 * @param {string} capabilityId - The capability ID
 * @param {object} options - { userRole }
 * @returns {object} Capability details with enabled status
 */
function getCapability(capabilityId, options = {}) {
  const cap = CAPABILITIES[capabilityId];
  if (!cap) return null;

  const { enabled, reason } = isCapabilityEnabled(capabilityId, options);

  return {
    id: capabilityId,
    ...cap,
    enabled,
    reason,
  };
}

export {
  CAPABILITIES,
  isCapabilityEnabled,
  getCapabilitiesStatus,
  getCapabilitiesByCategory,
  getCapability,
};
