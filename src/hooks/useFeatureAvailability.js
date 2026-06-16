/**
 * Feature Availability Hook
 * 
 * Combines capabilities, subscription tier, and authentication
 * to determine if a feature is available to the user.
 * 
 * This is the main hook applications should use for feature gating.
 */

import { useAuth } from '../context/AuthContext.jsx';
import { useSubscription } from './useSubscription';
import { useCapability, useCapabilityDetails } from '../context/CapabilitiesContext.jsx';

// NOTE: This file contains JSX (<FallbackComponent /> etc.), so it must be .jsx/.tsx.
// If it is imported as .js, Vite/Babel may treat it as plain JS and fail with
// `Unexpected token '<'`.


/**
 * Comprehensive feature availability check
 * Considers: authentication, subscription tier, capabilities, and role-based access
 * 
 * @param {string} featureId - The feature to check (capability ID)
 * @param {object} options - { requireSubscription, minimumTier, requireRole }
 * @returns {object} {
 *   available: boolean,
 *   reason: string,
 *   requiresAuth: boolean,
 *   requiresSubscription: boolean,
 *   requiresUpgrade: boolean,
 *   upgradeTo: string,
 * }
 */
export function useFeatureAvailability(featureId, options = {}) {
  const { isAuthenticated, user } = useAuth();
  const { tier: currentTier } = useSubscription(user?.id);
  const capabilityDetails = useCapabilityDetails(featureId);
  const { requireSubscription = false, minimumTier = 'free', requireRole } = options;

  // Check 1: Authentication required
  if (!isAuthenticated) {
    return {
      available: false,
      reason: 'Authentication required',
      requiresAuth: true,
      requiresSubscription: false,
      requiresUpgrade: false,
    };
  }

  // Check 2: Capability disabled
  if (!capabilityDetails.enabled) {
    return {
      available: false,
      reason: capabilityDetails.reason || 'Feature not available in this configuration',
      requiresAuth: false,
      requiresSubscription: false,
      requiresUpgrade: false,
    };
  }

  // Check 3: Role requirement
  if (requireRole && user?.role !== requireRole) {
    return {
      available: false,
      reason: `Requires ${requireRole} role`,
      requiresAuth: false,
      requiresSubscription: false,
      requiresUpgrade: false,
    };
  }

  // Check 4: Subscription requirement
  if (requireSubscription || capabilityDetails.requiresSubscription) {
    const tierHierarchy = ['free', 'pro', 'premium', 'enterprise'];
    const currentTierIndex = tierHierarchy.indexOf(currentTier);
    const minimumTierIndex = tierHierarchy.indexOf(minimumTier);

    if (currentTierIndex < minimumTierIndex) {
      return {
        available: false,
        reason: `Requires ${minimumTier} subscription`,
        requiresAuth: false,
        requiresSubscription: true,
        requiresUpgrade: true,
        upgradeTo: minimumTier,
      };
    }
  }

  // All checks passed
  return {
    available: true,
    reason: 'Feature available',
    requiresAuth: false,
    requiresSubscription: false,
    requiresUpgrade: false,
  };
}

/**
 * Check if multiple features are available
 * @param {string[]} featureIds - Array of feature IDs to check
 * @param {object} options - { requireAll, ...other options }
 * @returns {object} { available: boolean, results: object[] }
 */
export function useFeaturesAvailability(featureIds, options = {}) {
  const { requireAll = false } = options;
  
  const results = featureIds.map(featureId => ({
    featureId,
    ...useFeatureAvailability(featureId, options),
  }));

  const available = requireAll
    ? results.every(r => r.available)
    : results.some(r => r.available);

  return { available, results };
}

/**
 * Higher-order component for feature-gated rendering
 * @param {React.Component} Component - Component to conditionally render
 * @param {string} featureId - Required feature
 * @param {React.Component} FallbackComponent - Component to show if unavailable
 * @param {object} options - Feature availability options
 */
export function withFeatureGate(
  Component,
  featureId,
  FallbackComponent = null,
  options = {}
) {
  return function FeatureGatedComponent(props) {
    const availability = useFeatureAvailability(featureId, options);

    if (!availability.available) {
      if (FallbackComponent) {
        return <FallbackComponent availability={availability} {...props} />;
      }
      return null;
    }

    return <Component {...props} />;
  };
}

export default useFeatureAvailability;
