/* Pattern Learning Engine (CommonJS copy) */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class PatternLearningEngine {
  static async detectAllPatterns(userId, analysisMonths = 12) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - analysisMonths);

      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: true });

      if (!transactions || transactions.length === 0) {
        return { success: false, message: 'No transactions found for analysis', userId, analysisMonths };
      }

      const recurringPatterns = await this.detectRecurringPatterns(userId, transactions);
      const seasonalPatterns = await this.detectSeasonalPatterns(userId, transactions);
      const frequencyPatterns = await this.detectFrequencyPatterns(userId, transactions);
      const trendPatterns = await this.detectTrendPatterns(userId, transactions);
      const anomalyPatterns = await this.detectAnomalyPatterns(userId, transactions);

      const allPatterns = [ ...recurringPatterns, ...seasonalPatterns, ...frequencyPatterns, ...trendPatterns, ...anomalyPatterns ];
      const stored = await this.storePatterns(userId, allPatterns);

      return { success: true, userId, analysisMonths, patternsDetected: allPatterns.length, patternsStored: stored.length, breakdown: { recurring: recurringPatterns.length, seasonal: seasonalPatterns.length, frequency: frequencyPatterns.length, trend: trendPatterns.length, anomaly: anomalyPatterns.length }, patterns: allPatterns };
    } catch (error) { console.error('Pattern detection failed:', error); return { success: false, error: error.message, userId }; }
  }

  // Minimal implementations of helpers to keep shim functional; full logic lives in original .js file.
  static async detectRecurringPatterns(userId, transactions) { return []; }
  static async detectSeasonalPatterns(userId, transactions) { return []; }
  static async detectFrequencyPatterns(userId, transactions) { return []; }
  static async detectTrendPatterns(userId, transactions) { return []; }
  static async detectAnomalyPatterns(userId, transactions) { return []; }
  static async storePatterns(userId, patterns) { return patterns; }

}

module.exports = PatternLearningEngine;
