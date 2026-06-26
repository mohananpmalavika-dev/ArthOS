import {
  forecastFinancialProfile,
  simulateScenario
} from './services/predictionEngine.js';
import {
  recordDecisionOutcome,
  scoreDecision
} from './services/decisionIntelligence.js';
import {
  analyzeMoneyBeliefs,
  buildCognitionProfile
} from './services/cognitionEngine.js';
import { calculateLoanHealth } from './services/loanHealthEngine.js';
import { predictLoanDefault } from './services/defaultPredictionEngine.js';
import { forecastOpportunity } from './services/opportunityEngine.js';

function getPathname(req) {
  const original = req.headers?.['x-vercel-original-url'] || req.headers?.['x-now-original-url'] || req.url || '/';
  return new URL(original, 'http://localhost').pathname;
}

function getScope(req, body = {}) {
  return (
    body.scope ||
    body.userId ||
    body.user?.id ||
    body.profile?.userId ||
    req.headers?.['x-user-id'] ||
    'anonymous'
  );
}

function setCors(res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');
}

function validatePost(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return false;
  }

  return true;
}

function ok(res, payload) {
  return res.status(200).json({
    ok: true,
    ...payload
  });
}

export async function handlePredictionForecast(req, res) {
  setCors(res);
  if (!validatePost(req, res)) return;

  const result = forecastFinancialProfile(req.body || {});
  return ok(res, result);
}

export async function handlePredictionScenario(req, res) {
  setCors(res);
  if (!validatePost(req, res)) return;

  const result = simulateScenario(req.body || {});
  return ok(res, result);
}

export async function handleDecisionScore(req, res) {
  setCors(res);
  if (!validatePost(req, res)) return;

  const body = req.body || {};
  const decision = body.decision || body;
  const scoredDecision = scoreDecision(decision, { scope: getScope(req, body) });
  return ok(res, {
    contractVersion: 'decision.score.v1',
    decision: scoredDecision
  });
}

export async function handleDecisionOutcomeRecord(req, res) {
  setCors(res);
  if (!validatePost(req, res)) return;

  const body = req.body || {};
  if (!body.decisionId) {
    return res.status(400).json({ error: 'Missing decisionId' });
  }

  const outcome = recordDecisionOutcome(body.decisionId, body.outcome || body, {
    scope: getScope(req, body)
  });

  return ok(res, {
    contractVersion: 'decision.outcome-record.v1',
    outcome
  });
}

export async function handleCognitionBuildProfile(req, res) {
  setCors(res);
  if (!validatePost(req, res)) return;

  const body = req.body || {};
  const profile = buildCognitionProfile(body.user || body.profile || body, {
    scope: getScope(req, body)
  });

  return ok(res, {
    contractVersion: 'cognition.build-profile.v1',
    profile
  });
}

export async function handleCognitionBeliefsAnalyze(req, res) {
  setCors(res);
  if (!validatePost(req, res)) return;

  const body = req.body || {};
  const analysis = analyzeMoneyBeliefs(body.responses || body.user || body.profile || body, body.priorBeliefs || null, {
    scope: getScope(req, body)
  });

  return ok(res, {
    contractVersion: 'cognition.beliefs-analyze.v1',
    analysis
  });
}

export async function handleLoanHealthCalculate(req, res) {
  setCors(res);
  if (!validatePost(req, res)) return;

  const body = req.body || {};
  const result = calculateLoanHealth(body.customer || body.profile || body);
  return ok(res, {
    result
  });
}

export async function handleLoanDefaultPredict(req, res) {
  setCors(res);
  if (!validatePost(req, res)) return;

  const result = predictLoanDefault(req.body || {});
  return ok(res, {
    contractVersion: 'loan-default.predict.v1',
    defaultRisk: result
  });
}

export async function handleOpportunityForecast(req, res) {
  setCors(res);
  if (!validatePost(req, res)) return;

  const result = forecastOpportunity(req.body || {});
  return ok(res, {
    contractVersion: 'opportunity.forecast.v1',
    forecast: result
  });
}

export default async function handler(req, res) {
  const pathname = getPathname(req);

  try {
    if (pathname === '/api/prediction/forecast') return handlePredictionForecast(req, res);
    if (pathname === '/api/prediction/scenario') return handlePredictionScenario(req, res);
    if (pathname === '/api/decision/score') return handleDecisionScore(req, res);
    if (pathname === '/api/decision/outcome/record') return handleDecisionOutcomeRecord(req, res);
    if (pathname === '/api/cognition/build-profile') return handleCognitionBuildProfile(req, res);
    if (pathname === '/api/cognition/beliefs/analyze') return handleCognitionBeliefsAnalyze(req, res);
    if (pathname === '/api/loan-health/calculate') return handleLoanHealthCalculate(req, res);
    if (pathname === '/api/loan-default/predict') return handleLoanDefaultPredict(req, res);
    if (pathname === '/api/opportunity/forecast') return handleOpportunityForecast(req, res);

    return res.status(404).json({ error: 'Engine contract route not found' });
  } catch (error) {
    console.error('[Engine Contracts] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
