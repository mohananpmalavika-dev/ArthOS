/**
 * UPI Transaction Ingestion
 * 
 * Handles real-time UPI transaction capture and processing
 * - UPI callback webhooks from NPCI network
 * - Transaction validation and deduplication
 * - Real-time balance updates
 * - Fraud detection integration
 * 
 * Blueprint §21: Real-time UPI transaction ingestion
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * UPI Providers Configuration
 */
const UPI_PROVIDERS = {
  'GOOGLE_PAY': {
    webhookSecret: process.env.GOOGLE_PAY_WEBHOOK_SECRET,
    apiKey: process.env.GOOGLE_PAY_API_KEY
  },
  'PHONEPE': {
    webhookSecret: process.env.PHONEPE_WEBHOOK_SECRET,
    apiKey: process.env.PHONEPE_API_KEY
  },
  'PAYTM': {
    webhookSecret: process.env.PAYTM_WEBHOOK_SECRET,
    apiKey: process.env.PAYTM_API_KEY
  },
  'WHATSAPP_PAY': {
    webhookSecret: process.env.WHATSAPP_PAY_WEBHOOK_SECRET,
    apiKey: process.env.WHATSAPP_PAY_API_KEY
  }
};

/**
 * Validate UPI Webhook Signature
 * Ensures webhook authenticity from UPI provider
 */
function validateUPIWebhookSignature(payload, signature, provider) {
  try {
    const secret = UPI_PROVIDERS[provider]?.webhookSecret;
    if (!secret) {
      throw new Error(`Unknown UPI provider: ${provider}`);
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Signature validation failed:', error);
    return false;
  }
}

/**
 * Process UPI Transaction Webhook
 * Called by UPI providers when transactions occur
 */
async function processUPITransaction(payload, provider) {
  try {
    // Validate signature
    if (!validateUPIWebhookSignature(payload, payload.signature, provider)) {
      throw new Error('Invalid webhook signature');
    }

    const txnData = parseUPIPayload(payload, provider);

    // Find user by UPI ID
    const { data: bankAccounts } = await supabase
      .from('bank_accounts')
      .select('bank_connection_id, id')
      .eq('account_holder_name', txnData.recipientUPI)
      .limit(1);

    if (!bankAccounts || bankAccounts.length === 0) {
      console.warn(`No account found for UPI: ${txnData.recipientUPI}`);
      return { success: false, error: 'Account not found' };
    }

    const bankAccountId = bankAccounts[0].id;
    const bankConnectionId = bankAccounts[0].bank_connection_id;

    // Get user ID from bank connection
    const { data: connection } = await supabase
      .from('bank_connections')
      .select('user_id')
      .eq('id', bankConnectionId)
      .single();

    if (!connection) {
      throw new Error('Bank connection not found');
    }

    const userId = connection.user_id;

    // Check for duplicate transaction (using UPI transaction ID)
    const { data: existingTxn } = await supabase
      .from('upi_transactions')
      .select('id')
      .eq('upi_transaction_id', txnData.upiTransactionId)
      .single();

    if (existingTxn) {
      console.log(`Duplicate UPI transaction: ${txnData.upiTransactionId}`);
      return { success: false, error: 'Duplicate transaction' };
    }

    // 1. Create financial transaction record
    const { data: financialTxn, error: txnError } = await supabase
      .from('financial_transactions')
      .insert({
        bank_account_id: bankAccountId,
        user_id: userId,
        transaction_id: txnData.transactionId,
        reference_number: txnData.rrn,
        transaction_type: 'upi',
        payment_method: 'upi',
        upi_id: txnData.recipientUPI,
        amount: txnData.amount,
        currency: 'INR',
        counterparty_name: txnData.senderName,
        counterparty_upi_id: txnData.senderUPI,
        description: txnData.description || `UPI transfer from ${txnData.senderUPI}`,
        narration: txnData.narration,
        transaction_date: new Date(txnData.timestamp).toISOString().split('T')[0],
        transaction_time: new Date(txnData.timestamp).toISOString(),
        balance_after: txnData.balanceAfter,
        status: txnData.status || 'completed',
        category: 'transfer',
        synced_at: new Date().toISOString()
      })
      .select()
      .single();

    if (txnError) throw txnError;

    // 2. Create UPI-specific record
    const { error: upiError } = await supabase
      .from('upi_transactions')
      .insert({
        financial_transaction_id: financialTxn.id,
        upi_transaction_id: txnData.upiTransactionId,
        sender_upi: txnData.senderUPI,
        receiver_upi: txnData.recipientUPI,
        rrnid: txnData.rrn,
        rrn_timestamp: new Date(txnData.timestamp).toISOString(),
        npci_reference_id: txnData.npciReference,
        is_merchant_transaction: txnData.isMerchantTxn || false,
        merchant_category_code: txnData.mcc,
        merchant_name: txnData.merchantName
      });

    if (upiError) throw upiError;

    // 3. Update account balance
    await supabase
      .from('bank_accounts')
      .update({
        current_balance: txnData.balanceAfter,
        last_balance_update: new Date().toISOString()
      })
      .eq('id', bankAccountId);

    // 4. Run real-time analysis
    await runUPITransactionAnalysis(userId, financialTxn.id, txnData);

    return {
      success: true,
      transactionId: financialTxn.id,
      upiTransactionId: txnData.upiTransactionId
    };
  } catch (error) {
    console.error('UPI transaction processing failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Parse UPI Payload from Different Providers
 */
function parseUPIPayload(payload, provider) {
  // Normalize payload based on provider format
  switch (provider) {
    case 'GOOGLE_PAY':
      return {
        upiTransactionId: payload.transactionId || payload.upiTxnId,
        transactionId: payload.transactionId,
        senderUPI: payload.from?.upiId,
        senderName: payload.from?.name,
        recipientUPI: payload.to?.upiId,
        recipientName: payload.to?.name,
        amount: parseFloat(payload.amount),
        timestamp: payload.timestamp || new Date().toISOString(),
        status: payload.status?.toLowerCase() || 'completed',
        rrn: payload.rrn,
        npciReference: payload.npciRefId,
        description: payload.description,
        narration: payload.narration,
        balanceAfter: payload.balanceAfter,
        isMerchantTxn: payload.merchantId ? true : false,
        mcc: payload.merchantCategoryCode,
        merchantName: payload.merchantName
      };

    case 'PHONEPE':
      return {
        upiTransactionId: payload.data?.transactionId,
        transactionId: payload.data?.transactionId,
        senderUPI: payload.data?.senderUPI,
        senderName: payload.data?.senderName,
        recipientUPI: payload.data?.recipientUPI,
        recipientName: payload.data?.recipientName,
        amount: parseFloat(payload.data?.amount),
        timestamp: payload.data?.transactionTime,
        status: payload.data?.status?.toLowerCase() || 'completed',
        rrn: payload.data?.rrn,
        npciReference: payload.data?.npciRefId,
        description: payload.data?.description,
        narration: payload.data?.narration,
        balanceAfter: payload.data?.balanceAfter,
        isMerchantTxn: payload.data?.merchantId ? true : false,
        mcc: payload.data?.mcc,
        merchantName: payload.data?.merchantName
      };

    case 'PAYTM':
      return {
        upiTransactionId: payload.txnId,
        transactionId: payload.txnId,
        senderUPI: payload.senderUpi,
        senderName: payload.senderName,
        recipientUPI: payload.recipientUpi,
        recipientName: payload.recipientName,
        amount: parseFloat(payload.amount),
        timestamp: payload.txnTime,
        status: payload.status?.toLowerCase() || 'completed',
        rrn: payload.rrn,
        npciReference: payload.npciRefId,
        description: payload.desc,
        narration: payload.narration,
        balanceAfter: payload.balance,
        isMerchantTxn: payload.isMerchant || false,
        mcc: payload.merchantCategoryCode,
        merchantName: payload.merchantName
      };

    default:
      return payload; // Pass through if unknown provider
  }
}

/**
 * Run Real-time UPI Transaction Analysis
 * - Fraud detection
 * - Unusual pattern detection
 * - Digital twin update
 */
async function runUPITransactionAnalysis(userId, transactionId, txnData) {
  try {
    // 1. Fetch recent UPI transactions for pattern analysis
    const { data: recentTransactions } = await supabase
      .from('upi_transactions')
      .select('financial_transactions(amount, transaction_time)')
      .eq('financial_transactions.user_id', userId)
      .order('financial_transactions(transaction_time)', { ascending: false })
      .limit(20);

    // 2. Analyze for unusual patterns
    const analysis = analyzeUPIPatterns(txnData, recentTransactions || []);

    // 3. If high risk, flag for review
    if (analysis.riskScore > 0.7) {
      await supabase
        .from('financial_transactions')
        .update({
          tags: { riskFlag: true, riskScore: analysis.riskScore, reason: analysis.reason }
        })
        .eq('id', transactionId);

      // Notify user
      await notifyHighRiskTransaction(userId, txnData, analysis);
    }

    // 4. Update digital twin with transaction impact
    await updateDigitalTwinFromUPI(userId, txnData);

    return { success: true, analysis };
  } catch (error) {
    console.error('UPI analysis failed:', error);
    // Don't fail the transaction if analysis fails
    return { success: false, error: error.message };
  }
}

/**
 * Analyze UPI Patterns for Anomalies
 */
function analyzeUPIPatterns(currentTxn, recentTransactions) {
  let riskScore = 0;
  const reasons = [];

  // 1. Check transaction amount anomaly
  const amounts = recentTransactions
    .map(t => t.financial_transactions?.amount || 0)
    .filter(a => a > 0);

  if (amounts.length > 0) {
    const avgAmount = amounts.reduce((a, b) => a + b) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sq, n) => sq + Math.pow(n - avgAmount, 2), 0) / amounts.length
    );

    if (currentTxn.amount > avgAmount + (3 * stdDev)) {
      riskScore += 0.4;
      reasons.push('Unusually high transaction amount');
    }
  }

  // 2. Check frequency anomaly
  const txnTimestamps = recentTransactions
    .map(t => new Date(t.financial_transactions?.transaction_time).getTime())
    .filter(t => t > Date.now() - 3600000); // Last hour

  if (txnTimestamps.length > 5) {
    riskScore += 0.3;
    reasons.push('High transaction frequency');
  }

  // 3. Check international/new receiver
  if (!recentTransactions.some(t => t.receiver_upi === currentTxn.recipientUPI)) {
    riskScore += 0.2;
    reasons.push('Transaction to new UPI ID');
  }

  // 4. Check late night transaction
  const hour = new Date(currentTxn.timestamp).getHours();
  if (hour < 5 || hour > 23) {
    riskScore += 0.1;
    reasons.push('Transaction at unusual time');
  }

  return { riskScore: Math.min(riskScore, 1), reason: reasons.join('; ') };
}

/**
 * Notify High-Risk Transaction
 */
async function notifyHighRiskTransaction(userId, txnData, analysis) {
  try {
    // Get user preferences
    const { data: user } = await supabase
      .from('auth.users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user) return;

    // Send notification (webhook/email)
    // TODO: Integrate with notification service
    console.log(`High-risk UPI transaction alert for ${user.email}:`, analysis.reason);

    return { success: true };
  } catch (error) {
    console.error('Notification failed:', error);
  }
}

/**
 * Update Digital Twin from UPI Transaction
 * Feeds transaction data into behavioral analysis
 */
async function updateDigitalTwinFromUPI(userId, txnData) {
  try {
    // This would integrate with the DigitalTwinDashboard
    // to update spending patterns, categorization, etc.
    
    // Fetch digital twin data
    const { data: twinData } = await supabase
      .from('digital_twin_cache')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!twinData) return;

    // Update spending categories
    const updatedTwin = {
      ...twinData,
      lastUPITransaction: new Date().toISOString(),
      recentTransactionCount: (twinData.recentTransactionCount || 0) + 1,
      lastSpendingCategory: 'transfer'
    };

    await supabase
      .from('digital_twin_cache')
      .update(updatedTwin)
      .eq('user_id', userId);
  } catch (error) {
    console.error('Digital twin update failed:', error);
  }
}

/**
 * Batch UPI Transactions (for end-of-day reconciliation)
 */
async function batchUPITransactions(userId, transactions) {
  try {
    const results = [];

    for (const txn of transactions) {
      const result = await processUPITransaction(txn, txn.provider || 'GOOGLE_PAY');
      results.push(result);
    }

    // Update sync status
    await supabase
      .from('banking_sync_status')
      .update({
        transactions_last_synced: new Date().toISOString(),
        total_transactions_synced: (
          (await supabase.from('financial_transactions')
            .select('count', { count: 'exact' })
            .eq('user_id', userId)).count || 0
        )
      })
      .eq('user_id', userId);

    return { success: true, processedCount: results.length };
  } catch (error) {
    console.error('Batch UPI processing failed:', error);
    return { success: false, error: error.message };
  }
}

export default {
  processUPITransaction,
  validateUPIWebhookSignature,
  runUPITransactionAnalysis,
  batchUPITransactions
};
