/**
 * Pattern Learning Engine
 * 
 * Detects recurring patterns in user financial behavior
 * Identifies seasonal, periodic, and recurring transactions
 * Learns frequency patterns for spending, income, investments
 * 
 * Core Functions:
 * - detectRecurringPatterns() - Find repeating transactions
 * - detectSeasonalPatterns() - Find seasonal variations
 * - detectTrendPatterns() - Identify emerging trends
 * - analyzePatternStrength() - Assess confidence in pattern
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class PatternLearningEngine {
  /**
   * Run complete pattern detection for a user
   */
  static async detectAllPatterns(userId, analysisMonths = 12) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - analysisMonths);

      // Fetch transactions for analysis period
      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: true });

      if (!transactions || transactions.length === 0) {
        return {
          success: false,
          message: 'No transactions found for analysis',
          userId,
          analysisMonths
        };
      }

      // Run all pattern detections
      const recurringPatterns = await this.detectRecurringPatterns(userId, transactions);
      const seasonalPatterns = await this.detectSeasonalPatterns(userId, transactions);
      const frequencyPatterns = await this.detectFrequencyPatterns(userId, transactions);
      const trendPatterns = await this.detectTrendPatterns(userId, transactions);
      const anomalyPatterns = await this.detectAnomalyPatterns(userId, transactions);

      // Consolidate all patterns
      const allPatterns = [
        ...recurringPatterns,
        ...seasonalPatterns,
        ...frequencyPatterns,
        ...trendPatterns,
        ...anomalyPatterns
      ];

      // Store patterns
      const stored = await this.storePatterns(userId, allPatterns);

      return {
        success: true,
        userId,
        analysisMonths,
        patternsDetected: allPatterns.length,
        patternsStored: stored.length,
        breakdown: {
          recurring: recurringPatterns.length,
          seasonal: seasonalPatterns.length,
          frequency: frequencyPatterns.length,
          trend: trendPatterns.length,
          anomaly: anomalyPatterns.length
        },
        patterns: allPatterns
      };

    } catch (error) {
      console.error('Pattern detection failed:', error);
      return {
        success: false,
        error: error.message,
        userId
      };
    }
  }

  /**
   * Detect recurring patterns (same amount, similar intervals)
   */
  static async detectRecurringPatterns(userId, transactions) {
    const patterns = [];
    
    // Group transactions by category and merchant
    const groups = {};
    transactions.forEach(t => {
      const key = `${t.category || 'unknown'}_${t.merchant_name || 'unknown'}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    // Analyze each group for recurring patterns
    for (const [groupKey, txns] of Object.entries(groups)) {
      if (txns.length < 3) continue; // Need at least 3 occurrences

      // Sort by date
      txns.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

      // Calculate intervals between transactions
      const intervals = [];
      for (let i = 1; i < txns.length; i++) {
        const interval = Math.floor(
          (new Date(txns[i].transaction_date) - new Date(txns[i-1].transaction_date)) / (1000 * 60 * 60 * 24)
        );
        intervals.push(interval);
      }

      // Check if intervals are consistent (within 20% variance)
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const intervalVariance = this.calculateVariance(intervals);
      const intervalConsistency = intervalVariance / avgInterval; // Lower is more consistent

      if (intervalConsistency < 0.3) { // Highly consistent interval
        // Calculate amount consistency
        const amounts = txns.map(t => Math.abs(t.transaction_amount));
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const amountVariance = this.calculateVariance(amounts);
        const amountConsistency = amountVariance / avgAmount;

        // If both interval and amount are consistent, it's a strong recurring pattern
        if (amountConsistency < 0.2 || intervals.length >= 6) {
          patterns.push({
            pattern_type: 'recurring',
            pattern_name: `${txns[0].merchant_name || txns[0].category} - Recurring`,
            pattern_description: `Regular ${txns[0].category || 'transaction'} to/from ${txns[0].merchant_name || 'merchant'}`,
            frequency: this.classifyFrequency(Math.round(avgInterval)),
            cycle_days: Math.round(avgInterval),
            occurrences_detected: txns.length,
            avg_amount: Math.round(avgAmount * 100) / 100,
            amount_variance: Math.round(amountVariance * 100) / 100,
            confidence_score: Math.min(100, 100 * (1 - intervalConsistency) * (1 - Math.min(1, amountConsistency))),
            pattern_strength: this.classifyPatternStrength(txns.length, intervalConsistency, amountConsistency),
            total_impact_last_12m: Math.round(amounts.reduce((a, b) => a + b, 0) * 100) / 100,
            discovered_date: new Date().toISOString().split('T')[0],
            last_occurrence: txns[txns.length - 1].transaction_date,
            predicted_next_occurrence: this.predictNextOccurrence(txns[txns.length - 1].transaction_date, avgInterval),
            merchant_name: txns[0].merchant_name,
            category: txns[0].category
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Detect seasonal patterns (same time of year)
   */
  static async detectSeasonalPatterns(userId, transactions) {
    const patterns = [];
    
    // Group by category and month
    const monthGroups = {};
    transactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const monthKey = `${date.getMonth()}_${t.category || 'unknown'}`;
      if (!monthGroups[monthKey]) monthGroups[monthKey] = [];
      monthGroups[monthKey].push(t);
    });

    // Analyze each month group
    for (const [monthKey, txns] of Object.entries(monthGroups)) {
      if (txns.length < 2) continue; // Need at least 2 years of data

      const [month, category] = monthKey.split('_');
      
      // If we see spending in same month across multiple years
      const years = new Set(txns.map(t => new Date(t.transaction_date).getFullYear()));
      if (years.size >= 2) {
        const amounts = txns.map(t => Math.abs(t.transaction_amount));
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const seasonNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        patterns.push({
          pattern_type: 'seasonal',
          pattern_name: `${seasonNames[parseInt(month)]} - ${category}`,
          pattern_description: `Seasonal spending pattern in ${seasonNames[parseInt(month)]} for ${category}`,
          frequency: 'annual',
          month_of_year: parseInt(month),
          occurrences_detected: txns.length,
          avg_amount: Math.round(avgAmount * 100) / 100,
          confidence_score: Math.min(100, years.size * 25),
          pattern_strength: years.size >= 3 ? 'strong' : 'moderate',
          total_impact_last_12m: Math.round(amounts.reduce((a, b) => a + b, 0) * 100) / 100,
          discovered_date: new Date().toISOString().split('T')[0],
          last_occurrence: txns[txns.length - 1].transaction_date,
          predicted_next_occurrence: this.predictSeasonalOccurrence(parseInt(month)),
          category
        });
      }
    }

    return patterns;
  }

  /**
   * Detect frequency-based patterns (daily, weekly, monthly habits)
   */
  static async detectFrequencyPatterns(userId, transactions) {
    const patterns = [];
    
    // Aggregate transactions by day of week
    const dayOfWeekCounts = {};
    transactions.forEach(t => {
      const dayOfWeek = new Date(t.transaction_date).getDay();
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
    });

    // Check if there's a strong weekly pattern
    const counts = Object.values(dayOfWeekCounts);
    const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
    const maxCount = Math.max(...counts);
    
    if (maxCount > avgCount * 1.5) {
      const dayWithMostTxns = Object.keys(dayOfWeekCounts).find(
        day => dayOfWeekCounts[day] === maxCount
      );
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      patterns.push({
        pattern_type: 'frequency',
        pattern_name: `${dayNames[dayWithMostTxns]} Peak Activity`,
        pattern_description: `High transaction frequency on ${dayNames[dayWithMostTxns]}s`,
        frequency: 'weekly',
        day_of_week: parseInt(dayWithMostTxns),
        occurrences_detected: dayOfWeekCounts[dayWithMostTxns],
        confidence_score: Math.round((maxCount / (maxCount + avgCount)) * 100),
        pattern_strength: maxCount > avgCount * 2 ? 'strong' : 'moderate',
        discovered_date: new Date().toISOString().split('T')[0]
      });
    }

    // Aggregate by time of day
    const timeOfDayGroups = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    transactions.forEach(t => {
      const hour = new Date(t.transaction_date).getHours();
      if (hour >= 6 && hour < 12) timeOfDayGroups.morning++;
      else if (hour >= 12 && hour < 17) timeOfDayGroups.afternoon++;
      else if (hour >= 17 && hour < 21) timeOfDayGroups.evening++;
      else timeOfDayGroups.night++;
    });

    const peakTimeOfDay = Object.keys(timeOfDayGroups).reduce((a, b) => 
      timeOfDayGroups[a] > timeOfDayGroups[b] ? a : b
    );

    patterns.push({
      pattern_type: 'frequency',
      pattern_name: `${peakTimeOfDay.charAt(0).toUpperCase() + peakTimeOfDay.slice(1)} Peak`,
      pattern_description: `Peak activity during ${peakTimeOfDay} hours`,
      frequency: 'daily',
      time_of_day: peakTimeOfDay,
      occurrences_detected: timeOfDayGroups[peakTimeOfDay],
      confidence_score: Math.round((timeOfDayGroups[peakTimeOfDay] / transactions.length) * 100),
      pattern_strength: timeOfDayGroups[peakTimeOfDay] > transactions.length * 0.4 ? 'strong' : 'moderate',
      discovered_date: new Date().toISOString().split('T')[0]
    });

    return patterns;
  }

  /**
   * Detect trend patterns (increasing/decreasing over time)
   */
  static async detectTrendPatterns(userId, transactions) {
    const patterns = [];
    
    // Group by month and calculate monthly totals
    const monthlyTotals = {};
    transactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Math.abs(t.transaction_amount);
    });

    if (Object.keys(monthlyTotals).length >= 6) {
      const months = Object.keys(monthlyTotals).sort();
      const values = months.map(m => monthlyTotals[m]);

      // Calculate linear regression to detect trend
      const { slope, rSquared } = this.calculateLinearRegression(values);

      if (Math.abs(slope) > 100 && rSquared > 0.6) { // Significant trend
        const trendDirection = slope > 0 ? 'increasing' : 'decreasing';
        const categoryWithTrend = transactions[0].category || 'spending';

        patterns.push({
          pattern_type: 'trend',
          pattern_name: `${trendDirection.charAt(0).toUpperCase() + trendDirection.slice(1)} ${categoryWithTrend}`,
          pattern_description: `${categoryWithTrend} has been ${trendDirection} over the past ${months.length} months`,
          frequency: 'monthly',
          occurrences_detected: months.length,
          confidence_score: Math.round(rSquared * 100),
          pattern_strength: Math.abs(slope) > 500 ? 'strong' : 'moderate',
          trend_direction: trendDirection,
          monthly_change: Math.round(slope * 100) / 100,
          discovered_date: new Date().toISOString().split('T')[0]
        });
      }
    }

    return patterns;
  }

  /**
   * Detect anomaly patterns (unusual deviations)
   */
  static async detectAnomalyPatterns(userId, transactions) {
    const patterns = [];
    
    // Calculate average transaction amount
    const amounts = transactions.map(t => Math.abs(t.transaction_amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length
    );

    // Find outliers (>2 sigma)
    const outliers = transactions.filter(t => 
      Math.abs(t.transaction_amount) > avgAmount + (2 * stdDev)
    );

    if (outliers.length > 0) {
      patterns.push({
        pattern_type: 'anomaly',
        pattern_name: 'Unusual Large Transactions',
        pattern_description: `${outliers.length} unusually large transactions detected`,
        frequency: 'irregular',
        occurrences_detected: outliers.length,
        avg_amount: Math.round(avgAmount * 100) / 100,
        confidence_score: 95,
        pattern_strength: outliers.length > 5 ? 'strong' : 'moderate',
        discovered_date: new Date().toISOString().split('T')[0]
      });
    }

    // Detect spending spikes
    const monthlySpending = {};
    transactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + Math.abs(t.transaction_amount);
    });

    const spendingValues = Object.values(monthlySpending);
    const avgSpending = spendingValues.reduce((a, b) => a + b, 0) / spendingValues.length;
    const spendingSpikes = spendingValues.filter(v => v > avgSpending * 1.5).length;

    if (spendingSpikes > 0) {
      patterns.push({
        pattern_type: 'anomaly',
        pattern_name: 'Spending Spikes',
        pattern_description: `${spendingSpikes} months with significantly higher spending`,
        frequency: 'irregular',
        occurrences_detected: spendingSpikes,
        confidence_score: 85,
        pattern_strength: 'moderate',
        discovered_date: new Date().toISOString().split('T')[0]
      });
    }

    return patterns;
  }

  /**
   * Store detected patterns in database
   */
  static async storePatterns(userId, patterns) {
    try {
      // First, deactivate old patterns of same type
      for (const pattern of patterns) {
        await supabase
          .from('behavior_patterns')
          .update({ active: false })
          .eq('user_id', userId)
          .eq('pattern_type', pattern.pattern_type)
          .eq('pattern_name', pattern.pattern_name);
      }

      // Insert new patterns
      const { data: inserted, error } = await supabase
        .from('behavior_patterns')
        .insert(
          patterns.map(p => ({
            user_id: userId,
            pattern_type: p.pattern_type,
            pattern_name: p.pattern_name,
            pattern_description: p.pattern_description,
            frequency: p.frequency,
            confidence_score: p.confidence_score,
            occurrences_detected: p.occurrences_detected,
            cycle_days: p.cycle_days,
            month_of_year: p.month_of_year,
            day_of_week: p.day_of_week,
            time_of_day: p.time_of_day,
            avg_amount: p.avg_amount,
            amount_variance: p.amount_variance,
            total_impact_last_12m: p.total_impact_last_12m,
            discovered_date: p.discovered_date,
            last_occurrence: p.last_occurrence,
            predicted_next_occurrence: p.predicted_next_occurrence,
            active: true,
            pattern_strength: p.pattern_strength
          }))
        );

      if (error) throw error;
      return inserted || [];

    } catch (error) {
      console.error('Failed to store patterns:', error);
      return [];
    }
  }

  /**
   * Helper: Classify frequency from interval days
   */
  static classifyFrequency(days) {
    if (days <= 1) return 'daily';
    if (days <= 7) return 'weekly';
    if (days <= 14) return 'bi-weekly';
    if (days <= 30) return 'monthly';
    if (days <= 90) return 'quarterly';
    return 'annual';
  }

  /**
   * Helper: Classify pattern strength
   */
  static classifyPatternStrength(occurrences, intervalConsistency, amountConsistency) {
    if (occurrences >= 10 && intervalConsistency < 0.15 && amountConsistency < 0.1) {
      return 'strong';
    } else if (occurrences >= 5 && intervalConsistency < 0.25) {
      return 'moderate';
    }
    return 'weak';
  }

  /**
   * Helper: Calculate variance
   */
  static calculateVariance(values) {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length);
  }

  /**
   * Helper: Predict next occurrence
   */
  static predictNextOccurrence(lastDate, intervalDays) {
    const next = new Date(lastDate);
    next.setDate(next.getDate() + intervalDays);
    return next.toISOString().split('T')[0];
  }

  /**
   * Helper: Predict seasonal occurrence
   */
  static predictSeasonalOccurrence(month) {
    const today = new Date();
    let nextDate = new Date(today.getFullYear(), month, 1);
    if (nextDate <= today) {
      nextDate = new Date(today.getFullYear() + 1, month, 1);
    }
    return nextDate.toISOString().split('T')[0];
  }

  /**
   * Helper: Linear regression for trend detection
   */
  static calculateLinearRegression(values) {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const xMean = x.reduce((a, b) => a + b) / n;
    const yMean = y.reduce((a, b) => a + b) / n;

    const slope = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0) / 
                  x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);

    const yPred = x.map(xi => yMean + slope * (xi - xMean));
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - yPred[i], 2), 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    return { slope, rSquared };
  }
}

module.exports = PatternLearningEngine;
