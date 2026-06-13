/**
 * test/fixtures/factories.js
 * Mock data factories for consistent test fixtures
 */

/**
 * Create a mock assessment object
 * @param {Object} overrides - Partial assessment to override defaults
 * @returns {Object} Complete mock assessment
 */
export function createMockAssessment(overrides = {}) {
  return {
    id: `assess_${Math.random().toString(36).slice(7)}`,
    userId: 'user_test_123',
    timestamp: new Date().toISOString(),
    
    // Behavior component
    behaviour: {
      overall: 65,
      components: {
        spending_discipline: 60,
        saving_consistency: 70,
        investment_appetite: 55,
      },
    },
    
    // Awareness component
    awareness: {
      overall: 72,
      components: {
        knowledge_of_finances: 75,
        understanding_of_risks: 70,
        planning_sophistication: 70,
      },
    },
    
    // Profile/Personal data
    profile: {
      name: 'Test User',
      email: 'test@example.com',
      age: 35,
      income: 75000,
      dependents: 2,
      location: 'US',
    },
    
    // Habits
    habits: {
      daily_tracking: true,
      weekly_review: true,
      monthly_planning: false,
      yearly_goals: true,
    },
    
    // Derived fields
    personalityType: 'Builder',
    healthScore: 68,
    survivalMonths: 12,
    
    // Metadata
    completedAt: new Date().toISOString(),
    version: '2.0',
    
    ...overrides,
  };
}

/**
 * Create a mock user object
 * @param {Object} overrides - Partial user to override defaults
 * @returns {Object} Complete mock user
 */
export function createMockUser(overrides = {}) {
  return {
    id: `user_${Math.random().toString(36).slice(7)}`,
    email: 'user@example.com',
    name: 'Test User',
    tier: 'free',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    preferences: {
      locale: 'en-IN',
      currency: 'INR',
      notifications_enabled: true,
    },
    subscription: {
      status: 'active',
      tier: 'free',
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    ...overrides,
  };
}

/**
 * Create a mock decision entry
 * @param {Object} overrides - Partial decision to override defaults
 * @returns {Object} Complete mock decision
 */
export function createMockDecision(overrides = {}) {
  return {
    id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: 'user_test_123',
    type: 'financial',
    category: 'spending',
    amount: 500,
    notes: 'Test decision',
    timestamp: new Date().toISOString(),
    recordedAt: new Date().toISOString(),
    factors: {
      urgency: 'medium',
      emotional: false,
      bias: 'none',
      information: 75,
      orientation: 'conservative',
    },
    overallDecisionQuality: 75,
    ...overrides,
  };
}

/**
 * Create a mock ML prediction
 * @param {Object} overrides - Partial prediction to override defaults
 * @returns {Object} Complete mock prediction
 */
export function createMockPrediction(overrides = {}) {
  return {
    id: `pred_${Math.random().toString(36).slice(7)}`,
    userId: 'user_test_123',
    type: 'churn', // 'churn', 'behaviour_change', 'financial_risk'
    prediction: 0.25, // 0-1 probability
    confidence: 0.87,
    factors: {
      declining_engagement: true,
      missed_assessments: 1,
      feedback_sentiment: 'neutral',
    },
    timestamp: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock notification
 * @param {Object} overrides - Partial notification to override defaults
 * @returns {Object} Complete mock notification
 */
export function createMockNotification(overrides = {}) {
  return {
    id: `notif_${Math.random().toString(36).slice(7)}`,
    userId: 'user_test_123',
    type: 'score_change', // 'score_change', 'milestone', 'reminder', 'action'
    title: 'Your score improved',
    message: 'Your financial health score increased by 5 points',
    read: false,
    readAt: null,
    timestamp: new Date().toISOString(),
    metadata: {
      scoreChange: 5,
      previousScore: 63,
      newScore: 68,
    },
    ...overrides,
  };
}

/**
 * Create mock Supabase response
 * @param {Object} data - Response data
 * @param {Object} error - Error object (if any)
 * @returns {Object} Supabase response format
 */
export function mockSupabaseResponse(data = {}, error = null) {
  return {
    data,
    error,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK',
  };
}

/**
 * Create mock API error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Object} Error response
 */
export function createMockAPIError(message = 'Something went wrong', status = 400) {
  return {
    error: {
      code: `ERR_${status}`,
      message,
      status,
    },
  };
}

/**
 * Create mock Stripe webhook event
 * @param {string} eventType - Stripe event type
 * @param {Object} dataObject - Event data
 * @returns {Object} Stripe webhook event
 */
export function createMockStripeWebhook(eventType = 'customer.subscription.created', dataObject = {}) {
  return {
    id: `evt_${Math.random().toString(36).slice(7)}`,
    object: 'event',
    type: eventType,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `cus_${Math.random().toString(36).slice(7)}`,
        ...dataObject,
      },
    },
    livemode: false,
  };
}

/**
 * Create mock assessment answers (for form validation)
 * @param {Object} overrides - Partial answers to override defaults
 * @returns {Object} Complete mock answers
 */
export function createMockAssessmentAnswers(overrides = {}) {
  return {
    // Behaviour section
    behaviour_1: 7,
    behaviour_2: 6,
    behaviour_3: 5,
    
    // Awareness section
    awareness_1: 8,
    awareness_2: 7,
    awareness_3: 7,
    
    // Profile section
    profile_name: 'Test User',
    profile_age: 35,
    profile_income: 75000,
    
    // Habits section
    habits_tracking: true,
    habits_review_frequency: 'weekly',
    
    ...overrides,
  };
}

export default {
  createMockAssessment,
  createMockUser,
  createMockDecision,
  createMockPrediction,
  createMockNotification,
  mockSupabaseResponse,
  createMockAPIError,
  createMockStripeWebhook,
  createMockAssessmentAnswers,
};
