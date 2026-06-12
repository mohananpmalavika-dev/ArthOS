/**
 * Behavior Evolution Engine
 * 
 * Analyzes user financial transactions and creates behavior snapshots
 * Tracks income/spending patterns, savings discipline, investment behavior
 * Calculates behavioral indicators and financial health trajectory
 * 
 * Core Functions:
 * - generateBehaviorSnapshot() - Create monthly/quarterly snapshot
 * - analyzeBehaviorIndicators() - Calculate behavioral scores
 * - calculateSavingsMetrics() - Track savings & investment patterns
 * - analyzeBehaviorStability() - Measure consistency/predictability
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class BehaviorEvolutionEngine {
  /**
   * Generate a behavior snapshot for a given period
   * Creates a comprehensive profile of user's financial behavior
   */
  static async generateBehaviorSnapshot(userId, snapshotDate, periodType = 'monthly') {
    try {
      // Determine period boundaries
      const { startDate, endDate } = this.getPeriodBoundaries(snapshotDate, periodType);
      
      // Fetch all transactions for period
      const { data: transactions, error: txnError } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (txnError) throw txnError;
      if (!transactions || transactions.length === 0) {
        return {
          success: false,
          message: 'No transactions found for period',
          snapshotDate,
          periodType
        };
      }

      // Calculate income & spending metrics
      const incomeMetrics = this.analyzeIncomeMetrics(transactions);
      const expenseMetrics = this.analyzeExpenseMetrics(transactions);
      const savingsMetrics = this.calculateSavingsMetrics(userId, incomeMetrics, expenseMetrics);
      
      // Analyze spending patterns
      const spendingAnalysis = this.analyzeSpendingPatterns(transactions);
      
      // Calculate behavioral indicators
      const behavioralIndicators = await this.calculateBehavioralIndicators(userId, transactions, startDate, endDate);
      
      // Get risk profile
      const riskProfile = await this.assessRiskProfile(userId, transactions);
      
      // Calculate behavioral stability
      const stabilityIndex = this.calculateBehavioralStability(userId, transactions);
      
      // Determine health trajectory
      const trajectory = await this.determineHealthTrajectory(userId, snapshotDate);

      // Create snapshot record
      const { data: snapshot, error: insertError } = await supabase
        .from('behavior_snapshots')
        .insert([{
          user_id: userId,
          snapshot_date: snapshotDate,
          period_type: periodType,
          
          total_income: incomeMetrics.totalIncome,
          total_expense: expenseMetrics.totalExpense,
          avg_income_per_transaction: incomeMetrics.avgPerTransaction,
          avg_expense_per_transaction: expenseMetrics.avgPerTransaction,
          income_variance: incomeMetrics.variance,
          expense_variance: expenseMetrics.variance,
          
          amount_saved: savingsMetrics.amountSaved,
          savings_rate: savingsMetrics.savingsRate,
          investment_amount: savingsMetrics.investmentAmount,
          investment_allocation_stocks: savingsMetrics.stocks,
          investment_allocation_bonds: savingsMetrics.bonds,
          investment_allocation_mf: savingsMetrics.mutualFunds,
          investment_allocation_crypto: savingsMetrics.crypto,
          investment_allocation_other: savingsMetrics.other,
          
          top_expense_category: spendingAnalysis.topCategory,
          top_expense_percentage: spendingAnalysis.topCategoryPercentage,
          discretionary_vs_essential_ratio: spendingAnalysis.discretionaryRatio,
          
          payment_discipline_score: behavioralIndicators.paymentDiscipline,
          on_time_payment_percentage: behavioralIndicators.onTimePercentage,
          impulse_spending_tendency: behavioralIndicators.impulseTendency,
          financial_planning_score: behavioralIndicators.planningScore,
          
          risk_tolerance_level: riskProfile.toleranceLevel,
          risk_comfort_score: riskProfile.comfortScore,
          
          behavioral_stability_index: stabilityIndex,
          financial_health_trajectory: trajectory
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Update user's digital twin with snapshot
      await this.updateDigitalTwinFromSnapshot(userId, snapshot);

      return {
        success: true,
        snapshot,
        metrics: {
          income: incomeMetrics,
          expense: expenseMetrics,
          savings: savingsMetrics,
          spending: spendingAnalysis,
          behavioral: behavioralIndicators,
          risk: riskProfile,
          stability: stabilityIndex,
          trajectory
        }
      };

    } catch (error) {
      console.error('Behavior snapshot generation failed:', error);
      return {
        success: false,
        error: error.message,
        snapshotDate,
        periodType
      };
    }
  }

  /**
   * Analyze income-related metrics
   */
  static analyzeIncomeMetrics(transactions) {
    const incomeTransactions = transactions.filter(t => t.transaction_type === 'credit' || t.transaction_amount > 0);
    
    if (incomeTransactions.length === 0) {
      return {
        totalIncome: 0,
        avgPerTransaction: 0,
        variance: 0,
        frequency: 0,
        consistency: 0
      };
    }

    const amounts = incomeTransactions.map(t => Math.abs(t.transaction_amount));
    const totalIncome = amounts.reduce((a, b) => a + b, 0);
    const avgPerTransaction = totalIncome / amounts.length;
    
    // Calculate variance (standard deviation)
    const variance = Math.sqrt(
      amounts.reduce((sum, amt) => sum + Math.pow(amt - avgPerTransaction, 2), 0) / amounts.length
    );

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      avgPerTransaction: Math.round(avgPerTransaction * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      frequency: incomeTransactions.length,
      consistency: Math.min(100, Math.round(((avgPerTransaction / (avgPerTransaction + variance)) * 100)))
    };
  }

  /**
   * Analyze expense-related metrics
   */
  static analyzeExpenseMetrics(transactions) {
    const expenseTransactions = transactions.filter(t => t.transaction_type === 'debit' || t.transaction_amount < 0);
    
    if (expenseTransactions.length === 0) {
      return {
        totalExpense: 0,
        avgPerTransaction: 0,
        variance: 0,
        frequency: 0,
        controlScore: 100
      };
    }

    const amounts = expenseTransactions.map(t => Math.abs(t.transaction_amount));
    const totalExpense = amounts.reduce((a, b) => a + b, 0);
    const avgPerTransaction = totalExpense / amounts.length;
    
    const variance = Math.sqrt(
      amounts.reduce((sum, amt) => sum + Math.pow(amt - avgPerTransaction, 2), 0) / amounts.length
    );

    // Lower variance = better control
    const controlScore = Math.min(100, Math.round(((avgPerTransaction / (avgPerTransaction + variance)) * 100)));

    return {
      totalExpense: Math.round(totalExpense * 100) / 100,
      avgPerTransaction: Math.round(avgPerTransaction * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      frequency: expenseTransactions.length,
      controlScore
    };
  }

  /**
   * Calculate savings and investment metrics
   */
  static calculateSavingsMetrics(userId, incomeMetrics, expenseMetrics) {
    const amountSaved = incomeMetrics.totalIncome - expenseMetrics.totalExpense;
    const savingsRate = incomeMetrics.totalIncome > 0
      ? Math.round((amountSaved / incomeMetrics.totalIncome) * 10000) / 100
      : 0;

    // Placeholder - would fetch actual investment data from banking integration
    return {
      amountSaved: Math.round(amountSaved * 100) / 100,
      savingsRate,
      investmentAmount: 0,
      stocks: 0,
      bonds: 0,
      mutualFunds: 0,
      crypto: 0,
      other: 0
    };
  }

  /**
   * Analyze spending patterns by category
   */
  static analyzeSpendingPatterns(transactions) {
    const expenseTransactions = transactions.filter(t => t.transaction_type === 'debit');
    
    const categoryMap = {};
    let totalExpense = 0;

    expenseTransactions.forEach(t => {
      const category = t.category || 'uncategorized';
      categoryMap[category] = (categoryMap[category] || 0) + Math.abs(t.transaction_amount);
      totalExpense += Math.abs(t.transaction_amount);
    });

    // Find top category
    const topCategory = Object.keys(categoryMap).reduce((a, b) => 
      categoryMap[a] > categoryMap[b] ? a : b, 'unknown'
    );
    const topCategoryPercentage = totalExpense > 0
      ? Math.round((categoryMap[topCategory] / totalExpense) * 10000) / 100
      : 0;

    // Calculate discretionary vs essential ratio
    // Discretionary: entertainment, dining, shopping
    // Essential: groceries, utilities, transport
    const discretionaryCategories = ['entertainment', 'dining', 'shopping', 'travel'];
    const discretionarySpend = Object.keys(categoryMap)
      .filter(cat => discretionaryCategories.includes(cat.toLowerCase()))
      .reduce((sum, cat) => sum + categoryMap[cat], 0);
    
    const discretionaryRatio = totalExpense > 0
      ? Math.round((discretionarySpend / totalExpense) * 10000) / 100
      : 0;

    return {
      topCategory,
      topCategoryPercentage,
      discretionaryRatio,
      categoryBreakdown: categoryMap,
      totalExpense
    };
  }

  /**
   * Calculate behavioral indicators (payment discipline, impulse control, etc.)
   */
  static async calculateBehavioralIndicators(userId, transactions, startDate, endDate) {
    // Get payment history
    const { data: payments } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('transaction_type', 'payment')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    // Calculate on-time payment percentage
    const totalPayments = payments?.length || 0;
    const latePayments = payments?.filter(p => {
      const dueDate = new Date(p.due_date || p.transaction_date);
      const paymentDate = new Date(p.transaction_date);
      return paymentDate > dueDate;
    }).length || 0;

    const onTimePercentage = totalPayments > 0
      ? Math.round(((totalPayments - latePayments) / totalPayments) * 10000) / 100
      : 100;

    // Calculate impulse spending (sudden large transactions)
    const expenseTransactions = transactions.filter(t => t.transaction_type === 'debit');
    const avgExpense = expenseTransactions.length > 0
      ? expenseTransactions.reduce((sum, t) => sum + Math.abs(t.transaction_amount), 0) / expenseTransactions.length
      : 0;

    const impulseTransactions = expenseTransactions.filter(t => 
      Math.abs(t.transaction_amount) > avgExpense * 2
    );

    const impulseTendency = Math.min(100, Math.round((impulseTransactions.length / Math.max(1, expenseTransactions.length)) * 10000) / 100 * 50);

    return {
      paymentDiscipline: onTimePercentage,
      onTimePercentage,
      impulseTendency,
      planningScore: 100 - impulseTendency, // Inverse of impulse spending
      transactionConsistency: Math.min(100, Math.round((transactions.length / 30) * 10000) / 100) // Normalize to ~30 per month
    };
  }

  /**
   * Assess user's risk tolerance based on investment behavior
   */
  static async assessRiskProfile(userId, transactions) {
    // Analyze transaction patterns for risk indicators
    // High volatility in spending = potentially aggressive
    // Consistent saving = risk conservative
    // Investment in equities = risk tolerance

    const investmentTransactions = transactions.filter(t => t.category?.includes('investment'));
    const volatilityMetrics = this.calculateBehavioralStability(userId, transactions);

    let toleranceLevel = 'moderate';
    let comfortScore = 50;

    if (volatilityMetrics < 40) {
      toleranceLevel = 'conservative';
      comfortScore = Math.round(volatilityMetrics / 40 * 50); // 0-50
    } else if (volatilityMetrics < 70) {
      toleranceLevel = 'moderate';
      comfortScore = 40 + (Math.round((volatilityMetrics - 40) / 30 * 30));
    } else {
      toleranceLevel = 'aggressive';
      comfortScore = 70 + (Math.round((volatilityMetrics - 70) / 30 * 30));
    }

    return {
      toleranceLevel,
      comfortScore: Math.min(100, comfortScore),
      investmentCount: investmentTransactions.length
    };
  }

  /**
   * Calculate behavioral stability index (0-100)
   * Higher = more consistent/stable behavior
   */
  static calculateBehavioralStability(userId, transactions) {
    if (transactions.length === 0) return 0;

    // Analyze variability in daily spending
    const dailySpending = {};
    transactions.forEach(t => {
      const date = new Date(t.transaction_date).toDateString();
      dailySpending[date] = (dailySpending[date] || 0) + Math.abs(t.transaction_amount);
    });

    const dailyAmounts = Object.values(dailySpending);
    const avgDaily = dailyAmounts.reduce((a, b) => a + b, 0) / dailyAmounts.length;
    
    const variance = dailyAmounts.reduce((sum, amt) => sum + Math.pow(amt - avgDaily, 2), 0) / dailyAmounts.length;
    const stdDev = Math.sqrt(variance);
    
    // Coefficient of variation: lower = more stable
    const coefficientOfVariation = avgDaily > 0 ? (stdDev / avgDaily) : 0;
    
    // Convert to 0-100 scale (lower variance = higher stability)
    const stabilityIndex = Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 50)));

    return Math.round(stabilityIndex * 100) / 100;
  }

  /**
   * Determine financial health trajectory
   */
  static async determineHealthTrajectory(userId, currentDate) {
    try {
      // Get last 3 snapshots
      const { data: snapshots } = await supabase
        .from('behavior_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(3);

      if (!snapshots || snapshots.length < 2) {
        return 'establishing'; // Not enough data
      }

      // Compare savings rate trend
      const recentSavingsRate = snapshots[0].savings_rate;
      const previousSavingsRate = snapshots[1].savings_rate;

      const savingsChange = recentSavingsRate - previousSavingsRate;
      
      // Compare expense control
      const recentControlScore = snapshots[0].spending_control_score;
      const previousControlScore = snapshots[1].spending_control_score || recentControlScore;
      
      const controlChange = recentControlScore - previousControlScore;

      // Calculate trajectory
      if (savingsChange > 5 || controlChange > 5) {
        return 'improving';
      } else if (savingsChange < -5 || controlChange < -5) {
        return 'declining';
      } else {
        return 'stable';
      }

    } catch (error) {
      console.error('Failed to determine trajectory:', error);
      return 'unknown';
    }
  }

  /**
   * Update digital twin with behavior snapshot insights
   */
  static async updateDigitalTwinFromSnapshot(userId, snapshot) {
    try {
      // Get or create digital twin
      const { data: twin, error: fetchError } = await supabase
        .from('digital_twins')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const updateData = {
        user_id: userId,
        behavioral_stability: snapshot.behavioral_stability_index,
        health_trajectory: snapshot.financial_health_trajectory,
        last_behavior_analysis: new Date().toISOString(),
        metadata: {
          ...(twin?.metadata || {}),
          latest_savings_rate: snapshot.savings_rate,
          latest_spending_control: snapshot.spending_control_score,
          latest_risk_profile: snapshot.risk_tolerance_level
        }
      };

      if (twin) {
        await supabase
          .from('digital_twins')
          .update(updateData)
          .eq('user_id', userId);
      } else {
        await supabase
          .from('digital_twins')
          .insert([updateData]);
      }

    } catch (error) {
      console.error('Failed to update digital twin:', error);
    }
  }

  /**
   * Determine period boundaries
   */
  static getPeriodBoundaries(snapshotDate, periodType) {
    const date = new Date(snapshotDate);

    if (periodType === 'monthly') {
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
    } else if (periodType === 'quarterly') {
      const quarter = Math.floor(date.getMonth() / 3);
      const startDate = new Date(date.getFullYear(), quarter * 3, 1);
      const endDate = new Date(date.getFullYear(), (quarter + 1) * 3, 0);
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
    } else if (periodType === 'annual') {
      const startDate = new Date(date.getFullYear(), 0, 1);
      const endDate = new Date(date.getFullYear(), 11, 31);
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
    }

    return {
      startDate: snapshotDate,
      endDate: snapshotDate
    };
  }

  /**
   * Generate behavior snapshots for all active users
   * Should be run as scheduled job (monthly/quarterly)
   */
  static async generateSnapshotsForAllUsers(periodType = 'monthly') {
    try {
      // Get all active users
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true);

      if (!users) return { success: false, message: 'No users found' };

      const results = [];
      const today = new Date();
      const snapshotDate = today.toISOString().split('T')[0];

      for (const user of users) {
        const result = await this.generateBehaviorSnapshot(user.id, snapshotDate, periodType);
        results.push({
          userId: user.id,
          success: result.success,
          error: result.error
        });
      }

      return {
        success: true,
        snapshotsGenerated: results.filter(r => r.success).length,
        totalUsers: users.length,
        details: results
      };

    } catch (error) {
      console.error('Batch snapshot generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = BehaviorEvolutionEngine;
