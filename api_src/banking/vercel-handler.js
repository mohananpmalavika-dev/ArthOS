/**
 * Vercel Serverless Handler for Banking APIs
 *
 * Wraps the banking route handlers from ./index.js into a single
 * Vercel-compatible serverless function that routes requests based
 * on the URL pathname.
 *
 * Mounted at: /api/banking/*
 *
 * Sub-route map:
 *   POST /api/banking/aa/consent-request        → handleAAConsentRequest
 *   POST /api/banking/aa/consent-callback       → handleAAConsentCallback
 *   POST /api/banking/aa/data-fetch             → handleAADataFetch
 *   POST /api/banking/aa/consent-revoke         → handleConsentRevoke
 *   POST /api/banking/upi/webhook               → handleUPIWebhook
 *   GET  /api/banking/upi/transactions          → getUPITransactions
 *   POST /api/banking/feeds/connect             → initiateBankConnection
 *   POST /api/banking/feeds/oauth-callback      → handleBankOAuthCallback
 *   GET  /api/banking/accounts/summary          → getAccountSummary
 *   GET  /api/banking/transactions/summary      → getTransactionSummary
 *   GET  /api/banking/insurance/policies        → getInsurancePolicies
 *   GET  /api/banking/insurance/recommendations → getInsuranceRecommendations
 *   GET  /api/banking/insurance/premium-reminders → getPremiumReminders
 *   POST /api/banking/insurance/file-claim       → fileInsuranceClaim
 *   GET  /api/banking/credit/profile            → getCreditProfile
 *   GET  /api/banking/lending/opportunities     → getLendingOpportunities
 *   GET  /api/banking/sync/status               → getSyncStatus
 *   POST /api/banking/sync/settings             → updateSyncSettings
 */

import {
  handleAAConsentRequest,
  handleAAConsentCallback,
  handleAADataFetch,
  handleConsentRevoke,
  handleUPIWebhook,
  getUPITransactions,
  initiateBankConnection,
  handleBankOAuthCallback,
  getAccountSummary,
  getTransactionSummary,
  getInsurancePolicies,
  getInsuranceRecommendations,
  getPremiumReminders,
  fileInsuranceClaim,
  getCreditProfile,
  getLendingOpportunities,
  getSyncStatus,
  updateSyncSettings,
} from './index.js';

/**
 * Route definition for each banking sub-path.
 * @type {Array<{pattern: RegExp, method: string, handler: Function}>}
 */
const routes = [
  // ── Account Aggregator ──────────────────────────────
  { pattern: /^\/api\/banking\/aa\/consent-request\/?$/i,    method: 'POST', handler: handleAAConsentRequest },
  { pattern: /^\/api\/banking\/aa\/consent-callback\/?$/i,   method: 'POST', handler: handleAAConsentCallback },
  { pattern: /^\/api\/banking\/aa\/data-fetch\/?$/i,         method: 'POST', handler: handleAADataFetch },
  { pattern: /^\/api\/banking\/aa\/consent-revoke\/?$/i,     method: 'POST', handler: handleConsentRevoke },

  // ── UPI ─────────────────────────────────────────────
  { pattern: /^\/api\/banking\/upi\/webhook\/?$/i,           method: 'POST', handler: handleUPIWebhook },
  { pattern: /^\/api\/banking\/upi\/transactions\/?$/i,      method: 'GET',  handler: getUPITransactions },

  // ── Bank Feeds ──────────────────────────────────────
  { pattern: /^\/api\/banking\/feeds\/connect\/?$/i,         method: 'POST', handler: initiateBankConnection },
  { pattern: /^\/api\/banking\/feeds\/oauth-callback\/?$/i,  method: 'POST', handler: handleBankOAuthCallback },

  // ── Accounts & Transactions ─────────────────────────
  { pattern: /^\/api\/banking\/accounts\/summary\/?$/i,      method: 'GET',  handler: getAccountSummary },
  { pattern: /^\/api\/banking\/transactions\/summary\/?$/i,  method: 'GET',  handler: getTransactionSummary },

  // ── Insurance ───────────────────────────────────────
  { pattern: /^\/api\/banking\/insurance\/policies\/?$/i,        method: 'GET', handler: getInsurancePolicies },
  { pattern: /^\/api\/banking\/insurance\/recommendations\/?$/i, method: 'GET', handler: getInsuranceRecommendations },
  { pattern: /^\/api\/banking\/insurance\/premium-reminders\/?$/i, method: 'GET', handler: getPremiumReminders },
  { pattern: /^\/api\/banking\/insurance\/file-claim\/?$/i,      method: 'POST', handler: fileInsuranceClaim },

  // ── Credit Profile ──────────────────────────────────
  { pattern: /^\/api\/banking\/credit\/profile\/?$/i,       method: 'GET',  handler: getCreditProfile },

  // ── Lending ─────────────────────────────────────────
  { pattern: /^\/api\/banking\/lending\/opportunities\/?$/i, method: 'GET', handler: getLendingOpportunities },

  // ── Sync ────────────────────────────────────────────
  { pattern: /^\/api\/banking\/sync\/status\/?$/i,          method: 'GET',  handler: getSyncStatus },
  { pattern: /^\/api\/banking\/sync\/settings\/?$/i,        method: 'POST', handler: updateSyncSettings },
];

/**
 * Vercel-compatible serverless function handler for all /api/banking/* routes.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse}  res
 */
export default async function bankingHandler(req, res) {
  // Extract pathname from whichever header Vercel provides
  const rawUrl = req.headers['x-vercel-original-url']
    || req.headers['x-now-original-url']
    || req.url
    || '/api/banking';

  let pathname;
  try {
    pathname = new URL(rawUrl, 'http://localhost').pathname;
  } catch {
    pathname = rawUrl;
  }

  // Normalise trailing slash for matching
  const normalised = pathname.replace(/\/+$/, '') || '/';

  // Find matching route
  const route = routes.find((r) => r.pattern.test(normalised));

  if (!route) {
    res.status(404).json({ error: `Banking route not found: ${pathname}` });
    return;
  }

  // Method check
  if (req.method !== route.method) {
    res.status(405).json({ error: `Method ${req.method} not allowed for ${pathname}. Use ${route.method}.` });
    return;
  }

  // Delegate to the specific handler
  try {
    await route.handler(req, res);
  } catch (err) {
    console.error('[Banking Vercel Handler] Error:', pathname, err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
