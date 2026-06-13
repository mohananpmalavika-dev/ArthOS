/**
 * Banking API Vercel Handler
 * Routes all /api/banking/* requests to the appropriate banking handler
 *
 * Mounted at: /api/banking/*
 */
import bankingHandlers from './index.js';

async function handler(req, res) {
  const pathname = req.url?.split('?')[0] || '';
  const method = req.method?.toUpperCase();

  try {
    // ─── AA (Account Aggregator) ────────────────────────────
    if (method === 'POST' && pathname === '/api/banking/aa/consent-request') {
      return await bankingHandlers.handleAAConsentRequest(req, res);
    }
    if (method === 'POST' && pathname === '/api/banking/aa/consent-callback') {
      return await bankingHandlers.handleAAConsentCallback(req, res);
    }
    if (method === 'POST' && pathname === '/api/banking/aa/data-fetch') {
      return await bankingHandlers.handleAADataFetch(req, res);
    }
    if (method === 'POST' && pathname === '/api/banking/aa/consent-revoke') {
      return await bankingHandlers.handleConsentRevoke(req, res);
    }

    // ─── UPI ────────────────────────────────────────────────
    if (method === 'POST' && pathname === '/api/banking/upi/webhook') {
      return await bankingHandlers.handleUPIWebhook(req, res);
    }
    if (method === 'GET' && pathname === '/api/banking/upi/transactions') {
      return await bankingHandlers.getUPITransactions(req, res);
    }

    // ─── Bank Feeds ─────────────────────────────────────────
    if (method === 'POST' && pathname === '/api/banking/bank-feeds/initiate') {
      return await bankingHandlers.initiateBankConnection(req, res);
    }
    if (method === 'POST' && pathname === '/api/banking/bank-feeds/oauth-callback') {
      return await bankingHandlers.handleBankOAuthCallback(req, res);
    }
    if (method === 'GET' && pathname === '/api/banking/account-summary') {
      return await bankingHandlers.getAccountSummary(req, res);
    }
    if (method === 'GET' && pathname === '/api/banking/transaction-summary') {
      return await bankingHandlers.getTransactionSummary(req, res);
    }

    // ─── Insurance ──────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/banking/insurance/policies') {
      return await bankingHandlers.getInsurancePolicies(req, res);
    }
    if (method === 'GET' && pathname === '/api/banking/insurance/recommendations') {
      return await bankingHandlers.getInsuranceRecommendations(req, res);
    }
    if (method === 'GET' && pathname === '/api/banking/insurance/premium-reminders') {
      return await bankingHandlers.getPremiumReminders(req, res);
    }
    if (method === 'POST' && pathname === '/api/banking/insurance/file-claim') {
      return await bankingHandlers.fileInsuranceClaim(req, res);
    }

    // ─── Credit Profile ─────────────────────────────────────
    if (method === 'GET' && pathname === '/api/banking/credit-profile') {
      return await bankingHandlers.getCreditProfile(req, res);
    }

    // ─── Lending ────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/banking/lending-opportunities') {
      return await bankingHandlers.getLendingOpportunities(req, res);
    }

    // ─── Sync ───────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/banking/sync-status') {
      return await bankingHandlers.getSyncStatus(req, res);
    }
    if (method === 'POST' && pathname === '/api/banking/sync-settings') {
      return await bankingHandlers.updateSyncSettings(req, res);
    }

    // ─── 404 ────────────────────────────────────────────────
    return res.status(404).json({ error: 'Banking endpoint not found' });
  } catch (error) {
    console.error('[Banking Handler] Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}

export default handler;
