import decisionHandler from '../api_src/decision.js';
import riskScoreHandler from '../api_src/risk-score.js';
import riskOpportunityHandler from '../api_src/risk-opportunity.js';
import feedbackHandler from '../api_src/feedback.js';
import saveAssessmentHandler from '../api_src/saveAssessment.js';
import telemetryHandler from '../api_src/telemetry.js';
import errorLogHandler from '../api_src/error-log.js';
import memoryHandler from '../api_src/memory.js';
import authLoginHandler from '../api_src/auth/login.js';
import authRegisterHandler from '../api_src/auth/register.js';
import authMeHandler from '../api_src/auth/me.js';
import authGoogleHandler from '../api_src/auth/google.js';
import emailVerifyHandler from '../api_src/auth/email-verify.js';
import passwordResetHandler from '../api_src/auth/password-reset.js';
import b2bAdminHandler from '../api_src/b2b/admin.js';
import b2bIntelligenceHandler from '../api_src/b2b/intelligence.js';
import b2bRegisterHandler from '../api_src/b2b/register.js';
import b2bValidateKeyHandler from '../api_src/b2b/validate-key.js';
import b2bWebhooksHandler from '../api_src/b2b/webhooks.js';
import userAssessmentsHandler from '../api_src/user/assessments.js';
import userAssessmentDetailHandler from '../api_src/user/assessment-detail.js';
import userScoresHandler from '../api_src/user/scores.js';
import userScoreHandler from '../api_src/user/[userId]/score.js';
import userRiskHandler from '../api_src/user/[userId]/risk.js';
import remindersHandler from '../api_src/reminders.js';
import aiCoachHandler from '../api_src/longitudinal/ai-coach-handler.js';
import predictionEngineHandler from '../api_src/longitudinal/prediction-engine-handler.js';
import followUpHandler from '../api_src/follow-up/follow-up-handler.js';
import shareHandler from '../api_src/share.js';
import subscriptionsHandler from '../api_src/subscriptions-handler.js';
import backgroundHealthHandler from '../api_src/backgroundHealth.js';
// ─── Missing user endpoints ────────────────────────────────────
import saveDecisionHandler from '../api_src/user/saveDecision.js';
import loadDraftHandler from '../api_src/user/loadDraft.js';
import saveDraftHandler from '../api_src/user/saveDraft.js';
import savePreferenceHandler from '../api_src/user/savePreference.js';
import saveTelemetryHandler from '../api_src/user/saveTelemetry.js';
// ─── Banking endpoints (18 sub-routes) ─────────────────────────
import bankingHandler from '../api_src/banking/vercel-handler.js';

const routeDefinitions = [
  { match: (pathname) => pathname === '/api/decision', handler: decisionHandler },
  { match: (pathname) => pathname === '/api/risk-score', handler: riskScoreHandler },
  { match: (pathname) => pathname === '/api/risk-opportunity', handler: riskOpportunityHandler },
  { match: (pathname) => pathname === '/api/feedback', handler: feedbackHandler },
  { match: (pathname) => pathname === '/api/saveAssessment', handler: saveAssessmentHandler },
  { match: (pathname) => pathname === '/api/telemetry', handler: telemetryHandler },
  { match: (pathname) => pathname === '/api/error-log', handler: errorLogHandler },
  { match: (pathname) => pathname === '/api/memory' || pathname.startsWith('/api/memory/'), handler: memoryHandler },
  { match: (pathname) => pathname === '/api/auth/google' || pathname === '/api/auth/google/callback', handler: authGoogleHandler },
  { match: (pathname) => pathname === '/api/auth/login', handler: authLoginHandler },
  { match: (pathname) => pathname === '/api/auth/register', handler: authRegisterHandler },
  { match: (pathname) => pathname === '/api/auth/me', handler: authMeHandler },
  { match: (pathname) => pathname === '/api/auth/verify-email', handler: emailVerifyHandler },
  { match: (pathname) => pathname === '/api/auth/resend-verify', handler: emailVerifyHandler },
  { match: (pathname) => pathname.startsWith('/api/auth/reset-password'), handler: passwordResetHandler },
  { match: (pathname) => pathname === '/api/b2b/intelligence', handler: b2bIntelligenceHandler },
  { match: (pathname) => pathname === '/api/b2b/register', handler: b2bRegisterHandler },
  { match: (pathname) => pathname === '/api/b2b/validate-key', handler: b2bValidateKeyHandler },
  { match: (pathname) => pathname === '/api/b2b/webhooks', handler: b2bWebhooksHandler },
  { match: (pathname) => pathname === '/api/b2b/admin' || pathname.startsWith('/api/b2b/admin/'), handler: b2bAdminHandler },
  {
    match: (pathname) => {
      const match = /^\/api\/user\/([^/]+)\/score\/?$/.exec(pathname);
      return match || null;
    },
    handler: userScoreHandler,
    getParams: (match) => ({ userId: match[1] }),
  },
  {
    match: (pathname) => {
      const match = /^\/api\/user\/([^/]+)\/risk\/?$/.exec(pathname);
      return match || null;
    },
    handler: userRiskHandler,
    getParams: (match) => ({ userId: match[1] }),
  },
  { match: (pathname) => pathname === '/api/user/assessments', handler: userAssessmentsHandler },
  {
    match: (pathname) => {
      const match = /^\/api\/user\/assessment-detail(?:\/([^/]+))?\/?$/.exec(pathname);
      return match || null;
    },
    handler: userAssessmentDetailHandler,
    getParams: (match) => ({ id: match[1] || null }),
  },
  { match: (pathname) => pathname === '/api/user/scores', handler: userScoresHandler },
  // ─── User data persistence endpoints (were missing in production) ──
  { match: (pathname) => pathname === '/api/user/saveDecision', handler: saveDecisionHandler },
  { match: (pathname) => pathname === '/api/user/loadDraft', handler: loadDraftHandler },
  { match: (pathname) => pathname === '/api/user/saveDraft', handler: saveDraftHandler },
  { match: (pathname) => pathname === '/api/user/savePreference', handler: savePreferenceHandler },
  { match: (pathname) => pathname === '/api/user/saveTelemetry', handler: saveTelemetryHandler },
  // ─── Banking (entire directory was missing in production) ───
  { match: (pathname) => pathname.startsWith('/api/banking'), handler: bankingHandler },
  { match: (pathname) => pathname === '/api/reminders' || pathname.startsWith('/api/reminders/'), handler: remindersHandler },
  { match: (pathname) => pathname.startsWith('/api/coach'), handler: aiCoachHandler },
  { match: (pathname) => pathname.startsWith('/api/prediction'), handler: predictionEngineHandler },
  { match: (pathname) => pathname.startsWith('/api/follow-up'), handler: followUpHandler },
  { match: (pathname) => {
      const match = /^\/api\/share\/([^/]+)\/([^/]+)\/?$/.exec(pathname);
      return match || null;
    },
    handler: shareHandler,
    getParams: (match) => ({ type: match[1], id: match[2] }),
  },
  { match: (pathname) => pathname === '/api/background/health', handler: backgroundHealthHandler },
  { match: (pathname) => pathname.startsWith('/api/subscriptions'), handler: subscriptionsHandler },
];

function getPathname(req) {
  const original = req.headers['x-vercel-original-url'] || req.headers['x-now-original-url'] || req.url || '/api';
  const url = new URL(original, 'http://localhost');
  return url.pathname;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}

function createResponseHelpers(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  // Wrap error responses in a standardized envelope: { status: 'error', error: { message, ... } }
  res.json = (payload) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      if (res.statusCode >= 400) {
        const errPayload = (payload && payload.error) ? payload.error : payload;
        return res.end(JSON.stringify({ status: 'error', error: errPayload }));
      }
      return res.end(JSON.stringify(payload));
    } catch (e) {
      return res.end('{}');
    }
  };
}

export default async function handler(req, res) {
  createResponseHelpers(res);
  const pathname = getPathname(req);
  const route = routeDefinitions.find((routeDef) => routeDef.match(pathname));

  if (!route) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  req.query = Object.fromEntries(new URL(req.url || pathname, 'http://localhost').searchParams.entries());
  req.params = route.getParams ? route.getParams(route.match(pathname)) : {};

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    try {
      req.body = await parseJsonBody(req);
    } catch (err) {
      res.status(400).json({ error: 'Invalid JSON payload' });
      return;
    }
  }

  // Validate incoming request against OpenAPI if possible
  try {
    const { validateIncoming } = await import('./openapiValidator.js');
    const validation = await validateIncoming(req, res);
    if (validation && validation.ok === false) return; // response already sent for validation error
  } catch (e) {
    // if import fails, continue without validation
  }

  try {
    await route.handler(req, res);
  } catch (err) {
    console.error('[API Router] Error handling', pathname, err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

export {
  decisionHandler as decision,
  riskScoreHandler as riskScore,
  riskOpportunityHandler as riskOpportunity,
};
