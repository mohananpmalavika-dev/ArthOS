export { default as decision } from './decision.js';
export { default as riskScore } from './risk-score.js';
export { default as riskOpportunity } from './risk-opportunity.js';
export { default as feedback } from './feedback.js';
export { default as saveAssessment } from './saveAssessment.js';
export { default as telemetry } from './telemetry.js';
export { default as memory } from './memory.js';
export { default as dbClient } from './dbClient.js';

export { default as authLogin } from './auth/login.js';
export { default as authRegister } from './auth/register.js';
export { default as authMe } from './auth/me.js';

export { default as b2bAdmin } from './b2b/admin.js';
export { default as b2bIntelligence } from './b2b/intelligence.js';
export { default as b2bRegister } from './b2b/register.js';
export { default as b2bValidateKey } from './b2b/validate-key.js';
export { default as b2bWebhooks } from './b2b/webhooks.js';

// User-scoped endpoints (authenticated users only)
export { default as userAssessments } from './user/assessments.js';
export { default as userAssessmentDetail } from './user/assessment-detail.js';
export { default as userScores } from './user/scores.js';

export { default as userScore } from './user/[userId]/score.js';
export { default as userRisk } from './user/[userId]/risk.js';
