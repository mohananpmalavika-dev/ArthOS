/**
 * SMS Parser Engine
 * Extracts financial signals from SMS banking/merchant notifications
 * Conservative approach: only high-confidence signals are extracted
 */

const MERCHANT_CATEGORIES = {
  food: ['food', 'resto', 'cafe', 'burger', 'pizza', 'hotel', 'dining', 'grubhub', 'swiggy', 'zomato', 'dine'],
  shopping: ['shop', 'store', 'mall', 'amazon', 'flipkart', 'myntra', 'target', 'walmart', 'retail'],
  entertainment: ['movie', 'cinema', 'theatre', 'game', 'spotify', 'netflix', 'hotstar', 'ticket', 'concert'],
  transport: ['uber', 'ola', 'taxi', 'fuel', 'gas', 'petrol', 'train', 'flight', 'airline', 'bus'],
  utilities: ['electric', 'water', 'internet', 'phone', 'bills', 'recharge'],
  healthcare: ['hospital', 'clinic', 'doctor', 'pharmacy', 'medical', 'health'],
  subscription: ['subscription', 'membership', 'premium', 'annual', 'yearly'],
};

const AMOUNT_PATTERN = /(?:₹|Rs|rs|INR|amount|debited|credited|spent|transferred|paid|charged|reversed)\s*[.:]*\s*(\d+(?:[,.\s]\d{1,3})*(?:\.\d{2})?)/i;
const MERCHANT_PATTERN = /(?:at|from|to|merchant|received|paid)\s+([a-zA-Z0-9\s&'-]{2,40})/i;

function extractAmount(text) {
  const match = text.match(AMOUNT_PATTERN);
  if (!match) return null;
  
  const amountStr = match[1].replace(/[,\s]/g, '');
  const amount = parseFloat(amountStr);
  
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

function extractMerchant(text) {
  const match = text.match(MERCHANT_PATTERN);
  if (!match) return null;
  
  const merchant = match[1].trim();
  if (merchant.length < 2 || merchant.length > 40) return null;
  
  return merchant;
}

function categorizeTransaction(merchant, amount) {
  const merchantLower = (merchant || '').toLowerCase();
  
  for (const [category, keywords] of Object.entries(MERCHANT_CATEGORIES)) {
    if (keywords.some(kw => merchantLower.includes(kw))) {
      return category;
    }
  }
  
  return 'other';
}

function isSpendingSignal(transaction) {
  // Debits, high-frequency small amounts, emotional triggers
  const isDebit = transaction.type === 'debit' || transaction.type === 'spend';
  const isSmallAmount = transaction.amount > 0 && transaction.amount < 500;
  const emotionalCategories = ['food', 'entertainment', 'shopping'];
  const isEmotionalSpend = emotionalCategories.includes(transaction.category);
  
  return isDebit && (isSmallAmount || isEmotionalSpend);
}

/**
 * Parse SMS messages into structured transaction records
 * @param {Array} smsMessages - raw SMS texts
 * @returns {Array} structured transactions with confidence scores
 */
export function parseSMSTransactions(smsMessages) {
  if (!Array.isArray(smsMessages)) return [];
  
  return smsMessages
    .map((sms, idx) => {
      const text = String(sms || '').substring(0, 500);
      const amount = extractAmount(text);
      const merchant = extractMerchant(text);
      
      if (!amount) return null;
      
      const isDebit = /debit|spent|paid|charged|withdraw/i.test(text);
      const isCredit = /credit|received|refund|deposit|paid to/i.test(text);
      
      const category = categorizeTransaction(merchant, amount);
      const isSpending = isSpendingSignal({
        type: isDebit ? 'debit' : isCredit ? 'credit' : 'unknown',
        amount,
        category,
      });
      
      return {
        id: `sms_${idx}_${Date.now()}`,
        raw: text,
        amount,
        merchant: merchant || 'Unknown',
        category,
        type: isDebit ? 'debit' : isCredit ? 'credit' : 'unknown',
        isSpending,
        confidence: merchant ? 0.85 : 0.6,
        timestamp: new Date().toISOString(),
      };
    })
    .filter(Boolean);
}

/**
 * Aggregate SMS transactions into behavioral signals
 * @param {Array} transactions - parsed transactions
 * @returns {Object} aggregated signals for BAS scoring
 */
export function aggregateSMSSignals(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      unplannedPurchaseFreq: null,
      spendWhenBored: null,
      spendWhenStressed: null,
      cashflowAwareness: null,
      emotionalSpendCount: 0,
      smallAmountFreq: 0,
      merchantDiversity: 0,
      avgTransactionAmount: 0,
    };
  }
  
  const spendingTxns = transactions.filter(t => t.type === 'debit');
  const emotionalCategories = ['food', 'entertainment', 'shopping'];
  const emotionalSpends = spendingTxns.filter(t => emotionalCategories.includes(t.category));
  const smallAmounts = spendingTxns.filter(t => t.amount < 500);
  const merchants = new Set(spendingTxns.map(t => t.merchant)).size;
  
  const emotionalRatio = spendingTxns.length > 0 ? emotionalSpends.length / spendingTxns.length : 0;
  const smallRatio = spendingTxns.length > 0 ? smallAmounts.length / spendingTxns.length : 0;
  const avgAmount = spendingTxns.length > 0
    ? spendingTxns.reduce((sum, t) => sum + t.amount, 0) / spendingTxns.length
    : 0;
  
  // Map to assessment scale
  const unplannedMap = {
    high: emotionalRatio > 0.6 ? 'very_frequently' : emotionalRatio > 0.4 ? 'sometimes' : emotionalRatio > 0.2 ? 'rarely' : 'never',
  };
  
  const smallSpendMap = {
    high: smallRatio > 0.6 ? 'very_likely' : smallRatio > 0.4 ? 'sometimes' : 'rarely',
  };
  
  const categoryDiversityScore = Math.min(Math.max(1, merchants), 10);
  const transactionFrequency = Math.min(10, transactions.length);

  return {
    unplannedPurchaseFreq: unplannedMap.high,
    spendWhenBored: smallSpendMap.high,
    spendWhenStressed: emotionalSpends.length > 5 ? 'sometimes' : 'rarely',
    cashflowAwareness: transactions.length > 10 ? 'usually' : 'sometimes',
    emotionalSpendCount: emotionalSpends.length,
    smallAmountFreq: smallRatio,
    merchantDiversity: merchants,
    categoryDiversityScore,
    transactionFrequency,
    avgTransactionAmount: Math.round(avgAmount),
    totalSpendingTransactions: spendingTxns.length,
  };
}

export function mapSignalsToBehaviour(signals) {
  if (!signals || typeof signals !== 'object') return {};

  // Behaviour mapping (Spending discipline, planning, emotional control)
  const behaviourMapping = {
    unplannedPurchaseFreq: signals.unplannedPurchaseFreq || 'sometimes',
    spendWhenStressed: signals.spendWhenStressed || 'sometimes',
    regretImpulseFreq: signals.spendWhenBored === 'very_likely' ? 'often' : signals.spendWhenBored === 'sometimes' ? 'sometimes' : 'rarely',
    cashflowAwareness: signals.cashflowAwareness || 'sometimes',
    tracksSavingsRate: signals.totalSpendingTransactions > 8 ? 'usually' : 'not_sure',
  };

  return behaviourMapping;
}

/**
 * Map SMS signals to Awareness dimension (self-knowledge, risk perception)
 * Awareness: How well does user understand their spending patterns and financial status?
 */
export function mapSignalsToAwareness(signals) {
  if (!signals || typeof signals !== 'object') return {};

  // Awareness is indicated by:
  // - Transaction tracking frequency (do they see/monitor their money?)
  // - Merchant diversity (do they track multiple spending categories?)
  // - Regularity in spending patterns (do they have consistent habits or chaotic?)
  
  const hasRegularTracking = signals.totalSpendingTransactions > 10;
  const hasDiverseSpending = signals.merchantDiversity > 5;
  const avgTxnFreq = signals.transactionFrequency || 0;
  
  return {
    // Self-awareness of spending patterns
    spendingPatternAwareness: hasRegularTracking ? 'usually' : 'sometimes',
    // Awareness of financial categories
    categoryAwareness: hasDiverseSpending ? 'usually' : 'sometimes',
    // Risk perception: high frequency small spends = high risk perception (some awareness)
    riskPerceptionAccuracy: signals.smallAmountFreq > 0.5 ? 'somewhat_aware' : 'not_aware',
  };
}

/**
 * Map SMS signals to Stability dimension (emergency buffer, income diversity, recovery time)
 * Stability: How resilient is their financial buffer?
 */
export function mapSignalsToStability(signals) {
  if (!signals || typeof signals !== 'object') return {};

  // Stability indicators from spending patterns:
  // - High frequency small spends = potential buffer drain
  // - Credit vs debit ratio = how much are they borrowing vs paying?
  // - Average transaction amount = larger avg = more stable buffer
  
  const avgAmount = signals.avgTransactionAmount || 0;
  const spendFreq = signals.totalSpendingTransactions || 0;
  
  // If user has many small transactions, buffer is draining faster
  const bufferDrainRisk = signals.smallAmountFreq > 0.6 ? 'high' : signals.smallAmountFreq > 0.3 ? 'medium' : 'low';
  
  return {
    // Buffer sustainability: high spend frequency + small amounts = rapid drain
    bufferDrainRisk,
    // Average transaction size hints at spending scale
    spendingScale: avgAmount > 2000 ? 'large' : avgAmount > 500 ? 'medium' : 'small',
  };
}

/**
 * Comprehensive signal aggregation including BAS dimension mapping
 */
export function aggregateAndMapSignalsToBasDimensions(signals) {
  if (!signals || typeof signals !== 'object') return {};

  return {
    // Behaviour enrichment
    behaviour: mapSignalsToBehaviour(signals),
    // Awareness enrichment
    awareness: mapSignalsToAwareness(signals),
    // Stability enrichment (optional, as stability is mostly formula-driven)
    stability: mapSignalsToStability(signals),
    // Raw aggregated signals for reference
    rawSignals: {
      totalTransactions: signals.totalSpendingTransactions || 0,
      emotionalSpends: signals.emotionalSpendCount || 0,
      merchantDiversity: signals.merchantDiversity || 0,
      avgTransactionAmount: signals.avgTransactionAmount || 0,
    },
  };
}

/**
 * Generate SMS upload prompt for user
 */
export function generateSMSIngestPrompt() {
  return {
    title: 'Enrich Your Financial Profile with SMS Data',
    description: 'Parse your recent banking SMS to detect spending patterns and habits.',
    instructions: [
      'Copy SMS from your bank (debit/credit alerts, transaction confirmations)',
      'Paste them below (one per line, or comma-separated)',
      'We analyze merchant, amount, and frequency patterns',
      'This refines your Behaviour score for higher accuracy',
    ],
    placeholder: 'Paste SMS messages here...\nExample: "Debit alert: Your a/c xxx is debited with ₹250 at COFFEE_SHOP"',
    privacyNote: 'Your SMS data is processed locally. No messages are stored. Only aggregated signals are saved.',
  };
}
