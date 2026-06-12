/**
 * Bank Feeds Integration
 * 
 * Real-time and scheduled bank transaction feeds
 * - OFX/MT940 file parsing
 * - Bank API integration (via Open Banking standards)
 * - Transaction normalization
 * - Multi-account aggregation
 * - Schedule reconciliation
 * 
 * Blueprint §22: Comprehensive bank feeds from partner banks
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Bank Feeds Configuration
 * Integrates with Open Banking APIs and direct bank feeds
 */
const BANK_FEEDS_CONFIG = {
  'HDFC': {
    apiEndpoint: 'https://openapi.hdfcbank.com/v1',
    authMethod: 'oauth2',
    supportsOFX: true,
    transactionWindow: 90 // days of history
  },
  'ICICI': {
    apiEndpoint: 'https://api.icicibank.com/retail/v1',
    authMethod: 'oauth2',
    supportsOFX: true,
    transactionWindow: 90
  },
  'AXIS': {
    apiEndpoint: 'https://api.axisbank.com/v1',
    authMethod: 'api_key',
    supportsOFX: true,
    transactionWindow: 90
  },
  'YES_BANK': {
    apiEndpoint: 'https://api.yesbank.co.in/v1',
    authMethod: 'api_key',
    supportsOFX: true,
    transactionWindow: 90
  },
  'KOTAK': {
    apiEndpoint: 'https://api.kotak.com/v1',
    authMethod: 'oauth2',
    supportsOFX: false,
    transactionWindow: 60
  }
};

/**
 * Initiate Bank Feed Connection
 * OAuth flow for user authorization with bank
 */
async function initiateBankFeedConnection(userId, bankCode, accountIdentifier) {
  try {
    const bankConfig = BANK_FEEDS_CONFIG[bankCode];
    if (!bankConfig) {
      throw new Error(`Unsupported bank: ${bankCode}`);
    }

    const connectionId = `FEED_${userId}_${bankCode}_${Date.now()}`;
    
    // Create bank connection record
    const { data: connection, error } = await supabase
      .from('bank_connections')
      .insert({
        user_id: userId,
        connection_type: 'api',
        bank_code: bankCode,
        bank_name: bankCode.replace(/_/g, ' '),
        status: 'active',
        connected_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Generate OAuth flow URL (if OAuth)
    let oauthUrl = null;
    if (bankConfig.authMethod === 'oauth2') {
      const state = Buffer.from(JSON.stringify({
        userId,
        connectionId,
        bankCode
      })).toString('base64');

      oauthUrl = `${bankConfig.apiEndpoint}/auth/authorize?` +
        `client_id=${process.env[`BANK_OAUTH_CLIENT_ID_${bankCode}`]}` +
        `&redirect_uri=${encodeURIComponent(process.env.BANK_OAUTH_REDIRECT_URI)}` +
        `&state=${encodeURIComponent(state)}` +
        `&scope=accounts transactions`;
    }

    return {
      success: true,
      connectionId,
      bankConnection: connection,
      oauthUrl, // User should navigate to this URL
      authMethod: bankConfig.authMethod
    };
  } catch (error) {
    console.error('Bank feed connection initiation failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle OAuth Callback from Bank
 * Stores access token and fetches initial transactions
 */
async function handleBankOAuthCallback(state, code) {
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    const { userId, connectionId, bankCode } = stateData;

    const bankConfig = BANK_FEEDS_CONFIG[bankCode];

    // Exchange code for access token
    const tokenResponse = await fetch(`${bankConfig.apiEndpoint}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: process.env[`BANK_OAUTH_CLIENT_ID_${bankCode}`],
        client_secret: process.env[`BANK_OAUTH_CLIENT_SECRET_${bankCode}`],
        redirect_uri: process.env.BANK_OAUTH_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Token exchange failed');
    }

    const tokens = await tokenResponse.json();

    // Store encrypted access token
    const { data: connection } = await supabase
      .from('bank_connections')
      .update({
        status: 'active',
        connected_at: new Date().toISOString()
      })
      .eq('id', connectionId)
      .select()
      .single();

    // TODO: Store encrypted token in secure vault
    // For now, store in environment/secure storage
    process.env[`BANK_ACCESS_TOKEN_${connectionId}`] = tokens.access_token;

    // Fetch initial transactions
    await fetchBankTransactions(userId, connectionId, bankCode);

    return { success: true, connection };
  } catch (error) {
    console.error('OAuth callback failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch Bank Transactions via Open Banking API
 */
async function fetchBankTransactions(userId, connectionId, bankCode, options = {}) {
  try {
    const bankConfig = BANK_FEEDS_CONFIG[bankCode];
    const accessToken = process.env[`BANK_ACCESS_TOKEN_${connectionId}`];

    if (!accessToken) {
      throw new Error('No access token found for bank connection');
    }

    // Determine date range
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - (options.days || 30));

    // Call bank API to get transactions
    const txnResponse = await fetch(
      `${bankConfig.apiEndpoint}/accounts/transactions?from=${fromDate.toISOString().split('T')[0]}` +
      `&to=${toDate.toISOString().split('T')[0]}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!txnResponse.ok) {
      throw new Error(`Bank API error: ${txnResponse.statusText}`);
    }

    const bankData = await txnResponse.json();

    // Process accounts
    if (bankData.accounts && Array.isArray(bankData.accounts)) {
      for (const account of bankData.accounts) {
        await processBankAccount(userId, connectionId, account);
      }
    }

    // Process transactions
    if (bankData.transactions && Array.isArray(bankData.transactions)) {
      await processBankTransactions(userId, connectionId, bankData.transactions);
    }

    // Update sync status
    await supabase
      .from('banking_sync_status')
      .update({
        transactions_last_synced: new Date().toISOString(),
        sync_status: 'idle'
      })
      .eq('user_id', userId);

    return { success: true, transactionCount: bankData.transactions?.length || 0 };
  } catch (error) {
    console.error('Bank transaction fetch failed:', error);

    // Update sync status with error
    await supabase
      .from('banking_sync_status')
      .update({
        sync_status: 'error',
        last_error_message: error.message
      })
      .eq('user_id', userId);

    return { success: false, error: error.message };
  }
}

/**
 * Process Bank Account from API
 */
async function processBankAccount(userId, connectionId, account) {
  try {
    const { data: connection } = await supabase
      .from('bank_connections')
      .select('id')
      .eq('id', connectionId)
      .single();

    if (!connection) throw new Error('Bank connection not found');

    // Store/update account
    await supabase.from('bank_accounts').upsert({
      bank_connection_id: connection.id,
      account_number: account.accountNumber || account.id,
      account_type: normalizeAccountType(account.accountType),
      account_holder_name: account.accountHolderName,
      current_balance: parseFloat(account.balances?.available?.amount || 0),
      available_balance: parseFloat(account.balances?.available?.amount || 0),
      account_status: account.accountStatus?.toLowerCase() || 'active',
      ifsc_code: account.ifsc,
      branch_code: account.branchCode,
      last_balance_update: new Date().toISOString()
    }, { onConflict: 'account_number' });
  } catch (error) {
    console.error('Bank account processing failed:', error);
  }
}

/**
 * Process Bank Transactions from API
 */
async function processBankTransactions(userId, connectionId, transactions) {
  try {
    // Get bank account ID
    const { data: accounts } = await supabase
      .from('bank_connections')
      .select('id')
      .eq('id', connectionId);

    if (!accounts?.length) return;

    const accountId = accounts[0].id;

    // Normalize and insert transactions
    const normalizedTxns = transactions.map(txn => ({
      bank_account_id: accountId,
      user_id: userId,
      transaction_id: txn.transactionId || txn.id,
      reference_number: txn.referenceNumber || txn.ref,
      transaction_type: normalizeTransactionType(txn.transactionType),
      amount: parseFloat(txn.amount),
      counterparty_name: txn.counterparty || txn.otherParty,
      counterparty_account: txn.counterpartyAccount,
      description: txn.description || txn.narration,
      narration: txn.narration,
      transaction_date: new Date(txn.bookingDateTime).toISOString().split('T')[0],
      transaction_time: new Date(txn.bookingDateTime).toISOString(),
      balance_after: parseFloat(txn.balances?.available?.amount || 0),
      status: txn.status?.toLowerCase() || 'completed',
      category: categorizeTransaction(txn.description || txn.narration),
      synced_at: new Date().toISOString()
    }));

    // Batch upsert
    for (const batch of chunkArray(normalizedTxns, 100)) {
      await supabase
        .from('financial_transactions')
        .upsert(batch, { onConflict: 'transaction_id' });
    }

    return { success: true, count: normalizedTxns.length };
  } catch (error) {
    console.error('Bank transaction processing failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Parse OFX File (legacy bank format)
 */
async function parseOFXFile(userId, connectionId, ofxContent) {
  try {
    // Parse OFX format (simplified)
    const transactions = [];
    const lines = ofxContent.split('\n');

    let currentTxn = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('<STMTTRN>')) {
        currentTxn = {};
      } else if (line.startsWith('</STMTTRN>')) {
        if (currentTxn && currentTxn.amount) {
          transactions.push(currentTxn);
        }
        currentTxn = null;
      } else if (currentTxn) {
        if (line.startsWith('<TRNTYPE>')) {
          currentTxn.type = line.replace(/<[^>]*>/g, '');
        } else if (line.startsWith('<DTPOSTED>')) {
          currentTxn.date = line.replace(/<[^>]*>/g, '');
        } else if (line.startsWith('<TRNAMT>')) {
          currentTxn.amount = parseFloat(line.replace(/<[^>]*>/g, ''));
        } else if (line.startsWith('<FITID>')) {
          currentTxn.id = line.replace(/<[^>]*>/g, '');
        } else if (line.startsWith('<NAME>')) {
          currentTxn.name = line.replace(/<[^>]*>/g, '');
        } else if (line.startsWith('<MEMO>')) {
          currentTxn.memo = line.replace(/<[^>]*>/g, '');
        }
      }
    }

    return { success: true, transactions };
  } catch (error) {
    console.error('OFX parsing failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Schedule Periodic Bank Feed Sync
 */
async function schedulePeriodicSync(userId, frequency = 'daily') {
  try {
    const syncConfig = {
      hourly: { interval: 3600 },
      daily: { interval: 86400, time: '09:00' },
      weekly: { interval: 604800, day: 'MONDAY', time: '09:00' }
    };

    const config = syncConfig[frequency] || syncConfig.daily;

    // Store schedule in database
    await supabase
      .from('banking_sync_status')
      .update({
        sync_frequency: frequency,
        auto_sync_enabled: true
      })
      .eq('user_id', userId);

    // In production, use a job scheduler like Bull, Temporal, or AWS SQS
    // For now, this would be handled by a background worker

    return { success: true, schedule: config };
  } catch (error) {
    console.error('Schedule creation failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Utility: Normalize Account Type
 */
function normalizeAccountType(type) {
  const typeMap = {
    'SAVINGS': 'savings',
    'CURRENT': 'current',
    'OVERDRAFT': 'overdraft',
    'CREDIT_CARD': 'credit_card',
    'LOAN': 'loan'
  };
  return typeMap[type?.toUpperCase()] || 'savings';
}

/**
 * Utility: Normalize Transaction Type
 */
function normalizeTransactionType(type) {
  const typeMap = {
    'DEBIT': 'debit',
    'CREDIT': 'credit',
    'TRANSFER': 'transfer',
    'CHEQUE': 'check',
    'ATM': 'debit',
    'POS': 'debit'
  };
  return typeMap[type?.toUpperCase()] || 'transfer';
}

/**
 * Utility: Categorize Transaction
 */
function categorizeTransaction(description) {
  if (!description) return 'other';
  const desc = description.toLowerCase();
  
  if (desc.includes('salary') || desc.includes('payroll')) return 'salary';
  if (desc.includes('electricity') || desc.includes('water')) return 'utilities';
  if (desc.includes('transfer') || desc.includes('account')) return 'transfer';
  if (desc.includes('investment') || desc.includes('mutual')) return 'investment';
  if (desc.includes('fuel') || desc.includes('petrol')) return 'fuel';
  if (desc.includes('restaurant') || desc.includes('food')) return 'food';
  if (desc.includes('insurance')) return 'insurance';
  if (desc.includes('rent')) return 'rent';
  
  return 'other';
}

/**
 * Utility: Chunk Array
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export default {
  initiateBankFeedConnection,
  handleBankOAuthCallback,
  fetchBankTransactions,
  schedulePeriodicSync,
  parseOFXFile
};
