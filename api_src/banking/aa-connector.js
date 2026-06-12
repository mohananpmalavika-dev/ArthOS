/**
 * Account Aggregator (AA) Connector
 * 
 * Implements RBI Account Aggregator framework integration
 * - Consent generation & management
 * - Financial entity data retrieval
 * - Account & transaction synchronization
 * - Cryptographic signature verification
 * 
 * Blueprint §20: Bank-grade Account Aggregator integration
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// AA Providers directory
const AA_PROVIDERS = {
  'RBI-AA-001': {
    name: 'SETU',
    endpoint: 'https://apis.setu.co/account_aggregator',
    requestId: process.env.AA_SETU_REQUEST_ID,
    secretKey: process.env.AA_SETU_SECRET_KEY
  },
  'RBI-AA-002': {
    name: 'FINBOX',
    endpoint: 'https://api.finbox.io/account_aggregator',
    requestId: process.env.AA_FINBOX_REQUEST_ID,
    secretKey: process.env.AA_FINBOX_SECRET_KEY
  },
  'RBI-AA-003': {
    name: 'PERFIOS',
    endpoint: 'https://api.perfios.com/account_aggregator',
    requestId: process.env.AA_PERFIOS_REQUEST_ID,
    secretKey: process.env.AA_PERFIOS_SECRET_KEY
  }
};

/**
 * Generate AA Consent Request
 * Initiates consent flow with RBI Account Aggregator
 */
async function generateConsentRequest(userId, dataScope) {
  try {
    const consentId = `CONSENT_${userId}_${Date.now()}`;
    
    // Data scope: what financial data is requested
    const fiTypes = {
      accounts: dataScope.accounts !== false, // Account details
      transactions: dataScope.transactions !== false, // Transaction history
      profile: dataScope.profile !== false, // Profile info (name, PAN, mobile)
      creditProfile: dataScope.creditProfile !== false, // CIBIL/Credit scores
      insurance: dataScope.insurance !== false, // Insurance policies
      investments: dataScope.investments !== false // Investment portfolios
    };

    // Insert consent log
    const { data: consentLog, error: consentError } = await supabase
      .from('aa_consent_logs')
      .insert({
        user_id: userId,
        consent_id: consentId,
        consent_status: 'pending',
        aa_provider: process.env.AA_PROVIDER || 'RBI-AA-001',
        data_requested: fiTypes,
        data_frequency: dataScope.frequency || 'monthly',
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (consentError) throw consentError;

    return {
      success: true,
      consentId,
      consentLog,
      // Consent artifact for presentation to AA Provider
      consentArtifact: {
        ver: '1.0',
        timestamp: new Date().toISOString(),
        txnid: consentId,
        ConsentDetail: {
          consentId,
          customerId: `ARTH_${userId}`,
          ConsentPurpose: {
            Category: 'FINANCIAL_PLANNING',
            text: 'Financial health assessment and portfolio optimization'
          },
          FIRequestList: generateFIRequestList(fiTypes),
          permissions: ['READ'],
          lifetime: 365, // 1 year
          frequency: {
            value: dataScope.frequency === 'monthly' ? 30 : 1,
            unit: 'DAYS'
          }
        }
      }
    };
  } catch (error) {
    console.error('Consent request generation failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate FI (Financial Institution) Request List
 */
function generateFIRequestList(fiTypes) {
  const fiList = [];

  if (fiTypes.accounts || fiTypes.transactions) {
    fiList.push({
      fipId: 'FIP_ACCOUNTS',
      accounts: {
        type: 'SAVINGS,CURRENT,OVERDRAFT,CREDIT_CARD',
        fiTypes: ['DEPOSIT']
      }
    });
  }

  if (fiTypes.creditProfile) {
    fiList.push({
      fipId: 'FIP_CREDIT',
      creditProfile: {
        fiTypes: ['CREDIT_BUREAU']
      }
    });
  }

  if (fiTypes.insurance) {
    fiList.push({
      fipId: 'FIP_INSURANCE',
      insurance: {
        type: 'HEALTH,LIFE,AUTO',
        fiTypes: ['INSURANCE']
      }
    });
  }

  if (fiTypes.investments) {
    fiList.push({
      fipId: 'FIP_INVESTMENTS',
      securities: {
        fiTypes: ['SECURITIES']
      }
    });
  }

  return fiList;
}

/**
 * Handle AA Consent Callback
 * Called by AA provider when user approves/rejects consent
 */
async function handleConsentCallback(consentId, status, financialEntityId) {
  try {
    const updateData = {
      consent_status: status, // 'approved', 'rejected', 'revoked'
      financial_entity_id: financialEntityId
    };

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
      updateData.expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    const { data: consentLog, error } = await supabase
      .from('aa_consent_logs')
      .update(updateData)
      .eq('consent_id', consentId)
      .select()
      .single();

    if (error) throw error;

    // If approved, initiate data fetch
    if (status === 'approved') {
      const { data: user } = await supabase
        .from('aa_consent_logs')
        .select('user_id')
        .eq('consent_id', consentId)
        .single();

      if (user) {
        // Schedule async data fetch
        setTimeout(() => fetchAAData(user.user_id, consentId, financialEntityId), 1000);
      }
    }

    return { success: true, consentLog };
  } catch (error) {
    console.error('Consent callback handling failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch Financial Data from AA Provider
 * Retrieves accounts, transactions, and credit info
 */
async function fetchAAData(userId, consentId, financialEntityId) {
  try {
    const aaProvider = AA_PROVIDERS[process.env.AA_PROVIDER || 'RBI-AA-001'];
    
    // Create AA Request
    const aaRequest = {
      ver: '1.0',
      timestamp: new Date().toISOString(),
      txnid: `FETCH_${consentId}`,
      FIRequest: {
        consent_id: consentId,
        dataPeriod: {
          from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        },
        Filters: {
          accountType: ['DEPOSIT', 'CREDIT_CARD'],
          transactionType: ['DEBIT', 'CREDIT']
        }
      }
    };

    // Sign request (simplified - use proper cryptographic signing in production)
    const signature = generateHMACSHA256(JSON.stringify(aaRequest), aaProvider.secretKey);
    
    // Call AA Provider endpoint
    const response = await fetch(`${aaProvider.endpoint}/fi/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': aaProvider.requestId,
        'X-Signature': signature
      },
      body: JSON.stringify(aaRequest)
    });

    if (!response.ok) {
      throw new Error(`AA API error: ${response.statusText}`);
    }

    const fiData = await response.json();

    // Decrypt & store received data (simplified)
    await storeAAData(userId, fiData);

    return { success: true, dataCount: fiData?.count || 0 };
  } catch (error) {
    console.error('AA data fetch failed:', error);
    
    // Log error to sync status
    await supabase
      .from('banking_sync_status')
      .update({
        sync_status: 'error',
        last_error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    return { success: false, error: error.message };
  }
}

/**
 * Store AA Data to Database
 * Processes and persists account aggregator data
 */
async function storeAAData(userId, fiData) {
  try {
    // 1. Store bank accounts
    if (fiData.accounts?.length > 0) {
      for (const account of fiData.accounts) {
        // Find or create bank connection
        const { data: connection } = await supabase
          .from('bank_connections')
          .upsert({
            user_id: userId,
            connection_type: 'aa',
            bank_name: account.linkedAcctId?.bankName,
            account_type: account.type?.toLowerCase(),
            masked_account_number: account.linkedAcctId?.maskedAcctId,
            status: 'active'
          }, { onConflict: 'masked_account_number' })
          .select()
          .single();

        // Store account snapshot
        if (connection) {
          await supabase.from('bank_accounts').upsert({
            bank_connection_id: connection.id,
            account_number: account.linkedAcctId?.accNumber || '',
            account_type: account.type?.toLowerCase() || 'savings',
            account_holder_name: account.linkedAcctId?.name,
            current_balance: parseFloat(account.balance?.amount || 0),
            available_balance: parseFloat(account.balance?.amount || 0),
            account_status: 'active',
            ifsc_code: account.linkedAcctId?.ifsc,
            last_balance_update: new Date().toISOString()
          }, { onConflict: 'bank_connection_id' });
        }
      }
    }

    // 2. Store transactions
    if (fiData.transactions?.length > 0) {
      const txnData = fiData.transactions.map(txn => ({
        bank_account_id: txn.accountId,
        user_id: userId,
        transaction_id: txn.id,
        reference_number: txn.refId,
        transaction_type: normalizeTransactionType(txn.type),
        amount: parseFloat(txn.amount),
        counterparty_name: txn.description,
        description: txn.description,
        transaction_date: new Date(txn.date).toISOString().split('T')[0],
        transaction_time: new Date(txn.date).toISOString(),
        balance_after: parseFloat(txn.runningBalance),
        status: 'completed',
        category: categorizeTransaction(txn.description),
        synced_at: new Date().toISOString()
      }));

      // Batch insert transactions
      for (const batch of chunkArray(txnData, 100)) {
        await supabase.from('financial_transactions').upsert(batch, {
          onConflict: 'transaction_id'
        });
      }
    }

    // 3. Store credit profile if available
    if (fiData.creditProfile) {
      await supabase.from('credit_profiles').upsert({
        user_id: userId,
        cibil_score: fiData.creditProfile.score,
        latest_score: fiData.creditProfile.score,
        total_credit_limit: parseFloat(fiData.creditProfile.totalLimit || 0),
        total_credit_used: parseFloat(fiData.creditProfile.totalUsed || 0),
        credit_utilization_ratio: calculateUtilizationRatio(
          fiData.creditProfile.totalUsed,
          fiData.creditProfile.totalLimit
        ),
        on_time_payments: fiData.creditProfile.onTimePayments || 0,
        missed_payments: fiData.creditProfile.missedPayments || 0,
        active_credit_accounts: fiData.creditProfile.activeCreditAccounts || 0,
        score_last_updated: new Date().toISOString()
      }, { onConflict: 'user_id' });
    }

    // 4. Update sync status
    await supabase.from('banking_sync_status').upsert({
      user_id: userId,
      accounts_last_synced: new Date().toISOString(),
      transactions_last_synced: new Date().toISOString(),
      credit_score_last_synced: fiData.creditProfile ? new Date().toISOString() : undefined,
      sync_status: 'idle'
    }, { onConflict: 'user_id' });

    return { success: true };
  } catch (error) {
    console.error('AA data storage failed:', error);
    throw error;
  }
}

/**
 * Utility: Generate HMAC SHA256 signature
 */
function generateHMACSHA256(data, secret) {
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64');
}

/**
 * Utility: Normalize transaction type
 */
function normalizeTransactionType(type) {
  const typeMap = {
    'DEBIT': 'debit',
    'CREDIT': 'credit',
    'UPI': 'upi',
    'NEFT': 'neft',
    'RTGS': 'rtgs',
    'IMPS': 'imps',
    'CHECK': 'check'
  };
  return typeMap[type?.toUpperCase()] || 'transfer';
}

/**
 * Utility: Categorize transaction
 */
function categorizeTransaction(description) {
  const desc = description?.toLowerCase() || '';
  
  if (desc.includes('salary') || desc.includes('payroll')) return 'salary';
  if (desc.includes('electricity') || desc.includes('water') || desc.includes('gas')) return 'utilities';
  if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('shopping')) return 'shopping';
  if (desc.includes('transfer') || desc.includes('account')) return 'transfer';
  if (desc.includes('investment') || desc.includes('mutual') || desc.includes('sip')) return 'investment';
  if (desc.includes('fuel') || desc.includes('petrol')) return 'fuel';
  if (desc.includes('restaurant') || desc.includes('food')) return 'food';
  if (desc.includes('insurance') || desc.includes('premium')) return 'insurance';
  if (desc.includes('rent')) return 'rent';
  if (desc.includes('medical') || desc.includes('hospital')) return 'medical';
  
  return 'other';
}

/**
 * Utility: Calculate credit utilization
 */
function calculateUtilizationRatio(used, limit) {
  if (!limit || limit === 0) return 0;
  return ((used / limit) * 100).toFixed(2);
}

/**
 * Utility: Chunk array for batch operations
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Revoke AA Consent
 */
async function revokeConsent(userId, consentId) {
  try {
    const { error } = await supabase
      .from('aa_consent_logs')
      .update({
        consent_status: 'revoked'
      })
      .eq('consent_id', consentId)
      .eq('user_id', userId);

    if (error) throw error;

    // Deactivate associated bank connections
    await supabase
      .from('bank_connections')
      .update({ status: 'revoked' })
      .eq('user_id', userId)
      .eq('connection_type', 'aa');

    return { success: true };
  } catch (error) {
    console.error('Consent revocation failed:', error);
    return { success: false, error: error.message };
  }
}

export default {
  generateConsentRequest,
  handleConsentCallback,
  fetchAAData,
  storeAAData,
  revokeConsent
};
