/**
 * Banking APIs - Main Router
 * 
 * Consolidated banking API endpoints for:
 * - Account Aggregator
 * - UPI transactions
 * - Bank feeds
 * - Insurance integration
 * - Credit profile management
 * 
 * Mounted at: /api/banking/*
 */

import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
const requireModule = createRequire(import.meta.url);
const AAConnector = requireModule('./aa-connector.cjs');
import UPIIngestion from './upi-ingestion.js';
import BankFeeds from './bank-feeds.js';
import InsuranceAPIs from './insurance-apis.js';
import BankingSecurityManager, { validateBankingRequest } from './banking-security.js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const security = new BankingSecurityManager();

/**
 * ────────────────────────────────────────────────────
 * ACCOUNT AGGREGATOR ENDPOINTS
 * ────────────────────────────────────────────────────
 */

export async function handleAAConsentRequest(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, dataScope } = req.body;
    const result = await AAConnector.generateConsentRequest(userId, dataScope);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('AA consent request error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function handleAAConsentCallback(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { consentId, status, financialEntityId } = req.body;
    const result = await AAConnector.handleConsentCallback(consentId, status, financialEntityId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('AA callback error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function handleAADataFetch(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, consentId, financialEntityId } = req.body;
    const result = await AAConnector.fetchAAData(userId, consentId, financialEntityId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('AA data fetch error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function handleConsentRevoke(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, consentId } = req.body;
    const result = await AAConnector.revokeConsent(userId, consentId);
    
    await security.auditLog('CONSENT_REVOKED', userId, { consentId });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Consent revoke error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * ────────────────────────────────────────────────────
 * UPI TRANSACTION ENDPOINTS
 * ────────────────────────────────────────────────────
 */

export async function handleUPIWebhook(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { payload, provider } = req.body;
    const result = await UPIIngestion.processUPITransaction(payload, provider);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('UPI webhook error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getUPITransactions(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    
    const { data: transactions, error } = await supabase
      .from('upi_transactions')
      .select(`
        id,
        sender_upi,
        receiver_upi,
        financial_transactions (
          amount,
          transaction_date,
          transaction_time,
          status,
          category
        )
      `)
      .eq('financial_transactions.user_id', userId)
      .order('financial_transactions(transaction_time)', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.status(200).json({ success: true, transactions });
  } catch (error) {
    console.error('Get UPI transactions error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * ────────────────────────────────────────────────────
 * BANK FEEDS ENDPOINTS
 * ────────────────────────────────────────────────────
 */

export async function initiateBankConnection(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, bankCode, accountIdentifier } = req.body;
    const result = await BankFeeds.initiateBankFeedConnection(userId, bankCode, accountIdentifier);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Bank connection initiation error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function handleBankOAuthCallback(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { state, code } = req.body;
    const result = await BankFeeds.handleBankOAuthCallback(state, code);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Bank OAuth callback error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getAccountSummary(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    const { data: accounts, error: accountError } = await supabase
      .from('bank_accounts')
      .select(`
        id,
        account_type,
        account_holder_name,
        current_balance,
        bank_connections (
          bank_name,
          connection_type,
          status
        )
      `)
      .eq('bank_connections.user_id', userId);

    if (accountError) throw accountError;

    // Calculate totals
    const summary = {
      totalAccounts: accounts?.length || 0,
      totalBalance: accounts?.reduce((sum, acc) => sum + (parseFloat(acc.current_balance) || 0), 0) || 0,
      accounts: accounts || []
    };

    res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error('Get account summary error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getTransactionSummary(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data: transactions, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('transaction_date', startDate.toISOString().split('T')[0]);

    if (error) throw error;

    // Aggregate by category
    const byCategory = {};
    let totalIncome = 0;
    let totalExpense = 0;

    (transactions || []).forEach(txn => {
      const cat = txn.category || 'other';
      byCategory[cat] = (byCategory[cat] || 0) + parseFloat(txn.amount);
      
      if (txn.transaction_type === 'credit') {
        totalIncome += parseFloat(txn.amount);
      } else {
        totalExpense += parseFloat(txn.amount);
      }
    });

    res.status(200).json({
      success: true,
      summary: {
        period: `Last ${days} days`,
        totalIncome,
        totalExpense,
        netCashFlow: totalIncome - totalExpense,
        byCategory,
        transactionCount: transactions?.length || 0
      }
    });
  } catch (error) {
    console.error('Get transaction summary error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * ────────────────────────────────────────────────────
 * INSURANCE ENDPOINTS
 * ────────────────────────────────────────────────────
 */

export async function getInsurancePolicies(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    const result = await InsuranceAPIs.fetchUserInsurancePolicies(userId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Get insurance policies error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getInsuranceRecommendations(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    const result = await InsuranceAPIs.getInsuranceRecommendations(userId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Get insurance recommendations error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getPremiumReminders(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    const result = await InsuranceAPIs.getPremiumReminders(userId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Get premium reminders error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function fileInsuranceClaim(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, policyId, claimData } = req.body;
    const result = await InsuranceAPIs.fileInsuranceClaim(userId, policyId, claimData);
    
    await security.auditLog('INSURANCE_CLAIM_FILED', userId, { policyId, amount: claimData.amount });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('File insurance claim error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * ────────────────────────────────────────────────────
 * CREDIT PROFILE ENDPOINTS
 * ────────────────────────────────────────────────────
 */

export async function getCreditProfile(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    const { data: profile, error } = await supabase
      .from('credit_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.status(200).json({
      success: true,
      profile: profile || { user_id: userId, message: 'No credit profile data available yet' }
    });
  } catch (error) {
    console.error('Get credit profile error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * ────────────────────────────────────────────────────
 * LENDING OPPORTUNITIES ENDPOINTS
 * ────────────────────────────────────────────────────
 */

export async function getLendingOpportunities(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    const { data: opportunities, error } = await supabase
      .from('lending_opportunities')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'eligible')
      .order('eligibility_amount', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      opportunities: opportunities || []
    });
  } catch (error) {
    console.error('Get lending opportunities error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * ────────────────────────────────────────────────────
 * SYNC STATUS ENDPOINTS
 * ────────────────────────────────────────────────────
 */

export async function getSyncStatus(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    const { data: syncStatus, error } = await supabase
      .from('banking_sync_status')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.status(200).json({
      success: true,
      syncStatus: syncStatus || {
        user_id: userId,
        sync_status: 'idle',
        auto_sync_enabled: true,
        sync_frequency: 'daily'
      }
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateSyncSettings(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, autoSync, frequency } = req.body;

    const { error } = await supabase
      .from('banking_sync_status')
      .update({
        auto_sync_enabled: autoSync,
        sync_frequency: frequency
      })
      .eq('user_id', userId);

    if (error) throw error;

    await security.auditLog('SYNC_SETTINGS_UPDATED', userId, { autoSync, frequency });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update sync settings error:', error);
    res.status(500).json({ error: error.message });
  }
}

export default {
  // AA
  handleAAConsentRequest,
  handleAAConsentCallback,
  handleAADataFetch,
  handleConsentRevoke,
  // UPI
  handleUPIWebhook,
  getUPITransactions,
  // Bank Feeds
  initiateBankConnection,
  handleBankOAuthCallback,
  getAccountSummary,
  getTransactionSummary,
  // Insurance
  getInsurancePolicies,
  getInsuranceRecommendations,
  getPremiumReminders,
  fileInsuranceClaim,
  // Credit
  getCreditProfile,
  // Lending
  getLendingOpportunities,
  // Sync
  getSyncStatus,
  updateSyncSettings
};
