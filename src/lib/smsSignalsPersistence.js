/**
 * SMS Signals Persistence Layer
 * Stores and retrieves SMS-enriched BAS signals
 * Enables reuse of SMS analysis across sessions without re-prompting
 */

const SMS_SIGNALS_STORAGE_KEY = 'arth-os-sms-signals-cache';
const SMS_TRANSACTIONS_STORAGE_KEY = 'arth-os-sms-transactions-cache';

/**
 * Store SMS-enriched signals in localStorage
 * @param {Object} signals - Aggregated SMS signals
 * @param {Array} transactions - Parsed transactions
 */
export function persistSmsSignals(signals, transactions) {
  try {
    const storage = {
      signals,
      transactions,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };
    localStorage.setItem(SMS_SIGNALS_STORAGE_KEY, JSON.stringify(storage));
    return true;
  } catch (error) {
    console.warn('[SMS Persistence] Storage failed:', error);
    return false;
  }
}

/**
 * Retrieve cached SMS signals
 * @returns {Object|null} Cached signals or null if expired/missing
 */
export function retrieveSmsSignals() {
  try {
    const cached = localStorage.getItem(SMS_SIGNALS_STORAGE_KEY);
    if (!cached) return null;

    const { signals, transactions, expiresAt } = JSON.parse(cached);
    
    // Check expiration (30 days)
    if (new Date(expiresAt) < new Date()) {
      localStorage.removeItem(SMS_SIGNALS_STORAGE_KEY);
      localStorage.removeItem(SMS_TRANSACTIONS_STORAGE_KEY);
      return null;
    }

    return { signals, transactions };
  } catch (error) {
    console.warn('[SMS Persistence] Retrieval failed:', error);
    return null;
  }
}

/**
 * Clear cached SMS signals
 */
export function clearSmsSignals() {
  try {
    localStorage.removeItem(SMS_SIGNALS_STORAGE_KEY);
    localStorage.removeItem(SMS_TRANSACTIONS_STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn('[SMS Persistence] Clear failed:', error);
    return false;
  }
}

/**
 * Check if cached SMS signals are still valid
 * @returns {boolean} True if valid signals exist
 */
export function hasCachedSmsSignals() {
  const cached = retrieveSmsSignals();
  return cached !== null;
}

/**
 * Get age of cached signals in days
 * @returns {number} Days since cached, or -1 if no cache
 */
export function getCachedSignalsAge() {
  try {
    const cached = localStorage.getItem(SMS_SIGNALS_STORAGE_KEY);
    if (!cached) return -1;

    const { timestamp } = JSON.parse(cached);
    const ageMs = Date.now() - new Date(timestamp).getTime();
    return Math.floor(ageMs / (24 * 60 * 60 * 1000));
  } catch (error) {
    return -1;
  }
}

/**
 * Get summary of cached SMS data
 * @returns {Object} Summary info
 */
export function getCachedSmsSummary() {
  const cached = retrieveSmsSignals();
  if (!cached) return null;

  const { signals, transactions } = cached;
  return {
    transactionCount: transactions?.length || 0,
    totalSpending: transactions?.reduce((sum, t) => sum + (t.type === 'debit' ? t.amount : 0), 0) || 0,
    merchantCount: new Set(transactions?.map(t => t.merchant))?.size || 0,
    topCategory: getMostFrequentCategory(transactions),
    emotionalSpendCount: signals?.emotionalSpendCount || 0,
    averageTransaction: signals?.avgTransactionAmount || 0,
  };
}

function getMostFrequentCategory(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) return null;

  const categoryCount = {};
  transactions.forEach(t => {
    categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
  });

  return Object.entries(categoryCount).sort(([, a], [, b]) => b - a)[0]?.[0] || null;
}

/**
 * Build enrichment summary for display
 * Shows what signals were detected from SMS
 */
export function buildSmsSummaryForDisplay() {
  const cached = retrieveSmsSignals();
  if (!cached) return null;

  const { signals } = cached;
  const summary = getCachedSmsSummary();

  return {
    title: '📊 SMS Enrichment Applied',
    subtitle: `${summary.transactionCount} transactions analyzed`,
    metrics: [
      { label: 'Merchants tracked', value: summary.merchantCount },
      { label: 'Emotional spends detected', value: summary.emotionalSpendCount },
      { label: 'Top category', value: summary.topCategory || 'N/A' },
      { label: 'Avg transaction', value: `₹${summary.averageTransaction}` },
    ],
    behaviourSignals: signals?.unplannedPurchaseFreq || 'Not detected',
    cacheAge: getCachedSignalsAge(),
  };
}
