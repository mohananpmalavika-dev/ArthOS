/**
 * src/lib/featureGating.ts
 * Feature Gating Utility with TypeScript
 * 
 * Determines which features are available based on subscription tier
 * Used to conditionally render UI elements and enforce feature limits
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type UserTier = 'free' | 'plus' | 'pro' | 'elite';

interface FeatureFlags {
  [featureName: string]: boolean;
}

interface TierConfig {
  assessments_per_month: number | null;
  features: FeatureFlags;
}

interface FeatureMatrix {
  [tier in UserTier]: TierConfig;
}

interface AssessmentLimitResult {
  allowed: boolean;
  remaining: number | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FEATURE_MATRIX: FeatureMatrix = {
  // Free Tier
  free: {
    assessments_per_month: 1,
    features: {
      basic_assessment: true,
      basic_score: true,
      personality_type: false,
      emotional_triggers: false,
      money_beliefs: false,
      bias_analysis: false,
      score_history: false,
      digital_twin_basic: false,
      digital_twin_unlimited: false,
      stress_testing: false,
      banking_integration: false,
      ai_coach_basic: false,
      ai_coach_concierge: false,
      weekly_checkins: false,
      action_follow_ups: false,
      pdf_export: false,
      multi_family: false,
      priority_support: false,
      data_export: false,
    },
  },

  // Plus Tier ($12.99/mo)
  plus: {
    assessments_per_month: null, // Unlimited
    features: {
      basic_assessment: true,
      basic_score: true,
      personality_type: true,
      emotional_triggers: true,
      money_beliefs: true,
      bias_analysis: true,
      score_history: true,
      digital_twin_basic: true,
      digital_twin_unlimited: false,
      stress_testing: false,
      banking_integration: false,
      ai_coach_basic: false,
      ai_coach_concierge: false,
      weekly_checkins: true,
      action_follow_ups: true,
      pdf_export: true,
      multi_family: false,
      priority_support: false,
      data_export: false,
    },
  },

  // Pro Tier ($29.99/mo)
  pro: {
    assessments_per_month: null,
    features: {
      basic_assessment: true,
      basic_score: true,
      personality_type: true,
      emotional_triggers: true,
      money_beliefs: true,
      bias_analysis: true,
      score_history: true,
      digital_twin_basic: true,
      digital_twin_unlimited: true,
      stress_testing: true,
      banking_integration: true,
      ai_coach_basic: true,
      ai_coach_concierge: false,
      weekly_checkins: true,
      action_follow_ups: true,
      pdf_export: true,
      multi_family: false,
      priority_support: true,
      data_export: true,
    },
  },

  // Elite Tier ($79.99/mo)
  elite: {
    assessments_per_month: null,
    features: {
      basic_assessment: true,
      basic_score: true,
      personality_type: true,
      emotional_triggers: true,
      money_beliefs: true,
      bias_analysis: true,
      score_history: true,
      digital_twin_basic: true,
      digital_twin_unlimited: true,
      stress_testing: true,
      banking_integration: true,
      ai_coach_basic: true,
      ai_coach_concierge: true,
      weekly_checkins: true,
      action_follow_ups: true,
      pdf_export: true,
      multi_family: true,
      priority_support: true,
      data_export: true,
    },
  },
};

// ============================================================================
// FEATURE CHECKING
// ============================================================================

/**
 * Check if user has access to a feature
 * @param tier - Subscription tier ('free', 'plus', 'pro', 'elite')
 * @param feature - Feature key to check
 * @returns Whether feature is available
 */
export function hasFeature(tier: UserTier = 'free', feature: string): boolean {
  const tierConfig = FEATURE_MATRIX[tier] || FEATURE_MATRIX.free;
  return tierConfig.features[feature] === true;
}

/**
 * Get all features for a tier
 * @param tier - Subscription tier
 * @returns Feature flags for tier
 */
export function getTierFeatures(tier: UserTier = 'free'): FeatureFlags {
  const tierConfig = FEATURE_MATRIX[tier] || FEATURE_MATRIX.free;
  return { ...tierConfig.features };
}

/**
 * Get assessment limit for tier
 * @param tier - Subscription tier
 * @returns Assessments allowed per month (null = unlimited)
 */
export function getAssessmentLimit(tier: UserTier = 'free'): number | null {
  const tierConfig = FEATURE_MATRIX[tier] || FEATURE_MATRIX.free;
  return tierConfig.assessments_per_month;
}

/**
 * Check if user can take another assessment
 * @param tier - Subscription tier
 * @param assessmentsThisMonth - Count of assessments already taken this month
 * @returns Whether user can take another assessment
 */
export function canTakeAssessment(
  tier: UserTier = 'free',
  assessmentsThisMonth: number = 0
): boolean {
  const limit = getAssessmentLimit(tier);
  if (limit === null) return true; // Unlimited
  return assessmentsThisMonth < limit;
}

/**
 * Get remaining assessments for the month
 * @param tier - Subscription tier
 * @param assessmentsThisMonth - Count of assessments already taken this month
 * @returns Number of remaining assessments (null = unlimited)
 */
export function getAssessmentsRemaining(
  tier: UserTier = 'free',
  assessmentsThisMonth: number = 0
): number | null {
  const limit = getAssessmentLimit(tier);
  if (limit === null) return null; // Unlimited
  return Math.max(0, limit - assessmentsThisMonth);
}

/**
 * Get multiple feature checks at once
 * @param tier - Subscription tier
 * @param features - Array of feature names to check
 * @returns Object with feature names as keys and boolean availability as values
 */
export function checkFeatures(
  tier: UserTier = 'free',
  features: string[]
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const feature of features) {
    result[feature] = hasFeature(tier, feature);
  }
  return result;
}

/**
 * Get all available tiers with their limits
 * @returns Array of tier names
 */
export function getAvailableTiers(): UserTier[] {
  return Object.keys(FEATURE_MATRIX) as UserTier[];
}

/**
 * Get tier configuration (for admin/comparison views)
 * @param tier - Subscription tier
 * @returns Full tier configuration
 */
export function getTierConfig(tier: UserTier = 'free'): TierConfig {
  return FEATURE_MATRIX[tier] || FEATURE_MATRIX.free;
}

/**
 * Compare features between tiers
 * @param tier1 - First tier to compare
 * @param tier2 - Second tier to compare
 * @returns Object showing which features differ
 */
export function compareTiers(
  tier1: UserTier = 'free',
  tier2: UserTier = 'plus'
): Record<string, { tier1: boolean; tier2: boolean }> {
  const features1 = getTierFeatures(tier1);
  const features2 = getTierFeatures(tier2);
  const allFeatures = new Set([...Object.keys(features1), ...Object.keys(features2)]);

  const diff: Record<string, { tier1: boolean; tier2: boolean }> = {};
  for (const feature of allFeatures) {
    diff[feature] = {
      tier1: features1[feature] || false,
      tier2: features2[feature] || false,
    };
  }
  return diff;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  hasFeature,
  getTierFeatures,
  getAssessmentLimit,
  canTakeAssessment,
  getAssessmentsRemaining,
  checkFeatures,
  getAvailableTiers,
  getTierConfig,
  compareTiers,
};
