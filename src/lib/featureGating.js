/**
 * Feature Gating Utility
 * 
 * Determines which features are available based on subscription tier
 * Used to conditionally render UI elements and enforce feature limits
 */

const FEATURE_MATRIX = {
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

  // Pro Tier ($29.99/mo) - Future expansion
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

  // Elite Tier ($79.99/mo) - Future expansion
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

/**
 * Check if user has access to a feature
 * @param {string} tier - Subscription tier ('free', 'plus', 'pro', 'elite')
 * @param {string} feature - Feature key to check
 * @returns {boolean} Whether feature is available
 */
export function hasFeature(tier = 'free', feature) {
  const tierConfig = FEATURE_MATRIX[tier] || FEATURE_MATRIX.free;
  return tierConfig.features[feature] === true;
}

/**
 * Get all features for a tier
 * @param {string} tier - Subscription tier
 * @returns {Object} Feature flags for tier
 */
export function getTierFeatures(tier = 'free') {
  const tierConfig = FEATURE_MATRIX[tier] || FEATURE_MATRIX.free;
  return tierConfig.features;
}

/**
 * Get assessment limit for tier
 * @param {string} tier - Subscription tier
 * @returns {number|null} Assessments allowed per month (null = unlimited)
 */
export function getAssessmentLimit(tier = 'free') {
  const tierConfig = FEATURE_MATRIX[tier] || FEATURE_MATRIX.free;
  return tierConfig.assessments_per_month;
}

/**
 * Check if user can take another assessment
 * @param {string} tier - Subscription tier
 * @param {number} assessmentsThisMonth - Count of assessments already taken this month
 * @returns {boolean} Whether user can take another assessment
 */
export function canTakeAssessment(tier = 'free', assessmentsThisMonth = 0) {
  const limit = getAssessmentLimit(tier);

  // Unlimited if null
  if (limit === null) return true;

  // Check against limit
  return assessmentsThisMonth < limit;
}

/**
 * Get feature paywall message
 * @param {string} feature - Feature key
 * @param {string} currentTier - Current subscription tier
 * @returns {string} User-friendly paywall message
 */
export function getFeaturePaywallMessage(feature, currentTier = 'free') {
  const messages = {
    basic_assessment: 'Assessment available in Free tier',
    personality_type: 'Unlock your personality type with Plus',
    emotional_triggers: 'Understand your emotional triggers with Plus',
    money_beliefs: 'Discover your money beliefs with Plus',
    bias_analysis: 'Get your bias analysis with Plus',
    score_history: 'Track your score history with Plus',
    digital_twin_basic: 'Create your first digital twin scenario with Plus',
    digital_twin_unlimited: 'Unlimited scenarios with Pro tier',
    stress_testing: 'Test financial scenarios with Pro tier',
    banking_integration: 'Connect your bank accounts with Pro tier',
    ai_coach_basic: 'Get AI guidance with Pro tier',
    ai_coach_concierge: 'Get personalized AI coaching with Elite tier',
    weekly_checkins: 'Weekly check-ins available in Plus',
    action_follow_ups: 'Action follow-ups available in Plus',
    pdf_export: 'Export reports with Plus',
    multi_family: 'Multi-family profiles available in Elite tier',
    priority_support: 'Priority support available in Pro+ tiers',
    data_export: 'Full data export available in Pro+ tiers',
  };

  return messages[feature] || 'Upgrade to unlock this feature';
}

/**
 * Get features that unlock at a specific tier
 * @param {string} tier - Subscription tier
 * @returns {string[]} List of new features unlocked at this tier
 */
export function getNewFeaturesAtTier(tier) {
  const newFeatures = {
    free: [
      'basic_assessment',
      'basic_score',
    ],
    plus: [
      'personality_type',
      'emotional_triggers',
      'money_beliefs',
      'bias_analysis',
      'score_history',
      'digital_twin_basic',
      'weekly_checkins',
      'action_follow_ups',
      'pdf_export',
    ],
    pro: [
      'digital_twin_unlimited',
      'stress_testing',
      'banking_integration',
      'ai_coach_basic',
      'priority_support',
      'data_export',
    ],
    elite: [
      'ai_coach_concierge',
      'multi_family',
    ],
  };

  return newFeatures[tier] || [];
}

/**
 * Get upgrade recommendation based on current tier
 * @param {string} currentTier - Current subscription tier
 * @param {string} featureRequested - Feature user tried to access
 * @returns {string} Recommended upgrade tier
 */
export function getRecommendedUpgrade(currentTier, featureRequested) {
  // Check which tier first has this feature
  for (const [tier, config] of Object.entries(FEATURE_MATRIX)) {
    if (config.features[featureRequested] === true) {
      // Don't recommend a downgrade
      if (tier === 'free') return 'plus';
      if (tier === 'plus' && (currentTier === 'pro' || currentTier === 'elite')) {
        return currentTier;
      }
      return tier;
    }
  }

  return 'plus'; // Default recommendation
}

export default {
  hasFeature,
  getTierFeatures,
  getAssessmentLimit,
  canTakeAssessment,
  getFeaturePaywallMessage,
  getNewFeaturesAtTier,
  getRecommendedUpgrade,
};
