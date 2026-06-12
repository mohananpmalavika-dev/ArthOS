/**
 * User Lifecycle Scoring System
 * 
 * Tracks user progression through financial maturity stages
 * Stages: Discovery → Onboarding → Establishment → Optimization → Acceleration → Maturity → Planning
 * Computes financial maturity score with component breakdowns
 * Determines progression velocity
 * 
 * Core Functions:
 * - calculateLifecycleStage() - Determine current stage
 * - calculateFinancialMaturityScore() - 0-100 composite score
 * - determineProgressionVelocity() - How fast user is advancing
 * - generateRecommendations() - Next steps for user
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class LifecycleScoringSystem {
  /**
   * Lifecycle stages and their characteristics
   */
  static STAGES = {
    discovery: {
      order: 0,
      name: 'Discovery',
      description: 'User exploring financial management',
      indicators: {
        minAssessments: 0,
        minTransactions: 0,
        minDaysOnPlatform: 0
      },
      focus: ['Learn basics', 'Understand financial health', 'Set goals']
    },
    onboarding: {
      order: 1,
      name: 'Onboarding',
      description: 'User actively engaging with platform',
      indicators: {
        minAssessments: 1,
        minTransactions: 10,
        minDaysOnPlatform: 7,
        minEngagementScore: 30
      },
      focus: ['Complete profile', 'Link accounts', 'Set initial goals']
    },
    establishment: {
      order: 2,
      name: 'Establishment',
      description: 'User building foundation of good habits',
      indicators: {
        minAssessments: 2,
        minTransactions: 50,
        minDaysOnPlatform: 30,
        minEngagementScore: 50,
        minFinancialMaturity: 30
      },
      focus: ['Build emergency fund', 'Track spending', 'Create budget']
    },
    optimization: {
      order: 3,
      name: 'Optimization',
      description: 'User optimizing financial strategy',
      indicators: {
        minAssessments: 3,
        minTransactions: 150,
        minDaysOnPlatform: 90,
        minEngagementScore: 65,
        minFinancialMaturity: 50,
        savingsRateMin: 15
      },
      focus: ['Reduce debt', 'Optimize spending', 'Increase savings']
    },
    acceleration: {
      order: 4,
      name: 'Acceleration',
      description: 'User accelerating wealth building',
      indicators: {
        minAssessments: 5,
        minTransactions: 300,
        minDaysOnPlatform: 180,
        minEngagementScore: 75,
        minFinancialMaturity: 65,
        savingsRateMin: 25,
        investmentActivityScore: 50
      },
      focus: ['Invest strategically', 'Build wealth', 'Diversify income']
    },
    maturity: {
      order: 5,
      name: 'Maturity',
      description: 'User with established financial discipline',
      indicators: {
        minAssessments: 8,
        minTransactions: 500,
        minDaysOnPlatform: 365,
        minEngagementScore: 80,
        minFinancialMaturity: 75,
        savingsRateMin: 30,
        investmentActivityScore: 70,
        netWorthThreshold: 500000
      },
      focus: ['Maximize returns', 'Plan retirement', 'Generational wealth']
    },
    planning: {
      order: 6,
      name: 'Planning',
      description: 'User focused on long-term planning',
      indicators: {
        minAssessments: 10,
        minTransactions: 800,
        minDaysOnPlatform: 730,
        minEngagementScore: 85,
        minFinancialMaturity: 85,
        savingsRateMin: 35,
        investmentActivityScore: 80,
        retirementPlanEstablished: true
      },
      focus: ['Estate planning', 'Tax optimization', 'Wealth transfer']
    }
  };

  /**
   * Calculate complete lifecycle profile for a user
   */
  static async calculateUserLifecycle(userId) {
    try {
      // Fetch user data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) {
        return { success: false, message: 'User profile not found' };
      }

      // Calculate metrics
      const accountMetrics = await this.calculateAccountMetrics(userId);
      const engagementScore = await this.calculateEngagementScore(userId);
      const behavioralMetrics = await this.calculateBehavioralMetrics(userId);
      
      // Determine lifecycle stage
      const currentStage = this.determineLifecycleStage(accountMetrics, engagementScore, behavioralMetrics);
      
      // Calculate financial maturity score
      const maturityScore = this.calculateFinancialMaturityScore(
        accountMetrics,
        engagementScore,
        behavioralMetrics,
        currentStage
      );

      // Determine progression velocity
      const progressionVelocity = await this.determineProgressionVelocity(userId, currentStage);

      // Generate recommendations
      const recommendations = this.generateRecommendations(currentStage, maturityScore, accountMetrics);

      // Get or create lifecycle record
      const { data: existing } = await supabase
        .from('user_lifecycle_stages')
        .select('*')
        .eq('user_id', userId)
        .single();

      const lifecycleData = {
        user_id: userId,
        current_stage: currentStage.key,
        stage_confidence_score: currentStage.confidence,
        months_on_platform: this.calculateMonthsOnPlatform(profile.created_at),
        account_age_category: this.classifyAccountAge(profile.created_at),
        financial_maturity_score: maturityScore.overall,
        savings_discipline_component: maturityScore.components.savingsDiscipline,
        investment_sophistication_component: maturityScore.components.investmentSophistication,
        debt_management_component: maturityScore.components.debtManagement,
        risk_awareness_component: maturityScore.components.riskAwareness,
        planning_component: maturityScore.components.planning,
        progression_velocity: progressionVelocity.velocity,
        recommended_next_goals: recommendations.goals,
        recommended_financial_products: recommendations.products
      };

      // Update stage dates if progressing
      if (!existing || existing.current_stage !== currentStage.key) {
        const dateField = `${currentStage.key}_date`;
        lifecycleData[dateField] = new Date().toISOString().split('T')[0];
      }

      // Upsert lifecycle record
      const { data: lifecycle, error } = await supabase
        .from('user_lifecycle_stages')
        .upsert([lifecycleData], { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        userId,
        lifecycle,
        stage: currentStage,
        maturityScore,
        accountMetrics,
        engagementScore,
        behavioralMetrics,
        progressionVelocity,
        recommendations
      };

    } catch (error) {
      console.error('Lifecycle calculation failed:', error);
      return {
        success: false,
        error: error.message,
        userId
      };
    }
  }

  /**
   * Calculate account-related metrics
   */
  static async calculateAccountMetrics(userId) {
    try {
      // Count assessments
      const { count: assessmentCount } = await supabase
        .from('assessments')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      // Count transactions
      const { count: transactionCount } = await supabase
        .from('financial_transactions')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      // Get linked accounts
      const { count: linkedAccounts } = await supabase
        .from('bank_accounts')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      // Get total savings (from snapshots or calculations)
      const { data: recentSnapshot } = await supabase
        .from('behavior_snapshots')
        .select('amount_saved, savings_rate')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      // Get net worth estimate
      const netWorth = await this.estimateNetWorth(userId);

      return {
        assessmentCount: assessmentCount || 0,
        transactionCount: transactionCount || 0,
        linkedAccounts: linkedAccounts || 0,
        recentSavings: recentSnapshot?.amount_saved || 0,
        savingsRate: recentSnapshot?.savings_rate || 0,
        netWorth,
        hasEmergencyFund: recentSnapshot?.amount_saved > 100000, // Placeholder threshold
        hasDebt: await this.calculateTotalDebt(userId) > 0,
        totalDebt: await this.calculateTotalDebt(userId)
      };
    } catch (error) {
      console.error('Account metrics calculation failed:', error);
      return {
        assessmentCount: 0,
        transactionCount: 0,
        linkedAccounts: 0,
        recentSavings: 0,
        savingsRate: 0,
        netWorth: 0
      };
    }
  }

  /**
   * Calculate engagement score (0-100)
   */
  static async calculateEngagementScore(userId) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) return 0;

      let score = 0;

      // Days active
      const daysActive = Math.min(
        Math.floor((new Date() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24)),
        365
      );
      score += Math.round((daysActive / 365) * 20); // Up to 20 points

      // Last activity
      if (profile.last_login) {
        const daysSinceLogin = Math.floor((new Date() - new Date(profile.last_login)) / (1000 * 60 * 60 * 24));
        if (daysSinceLogin <= 7) score += 20;
        else if (daysSinceLogin <= 30) score += 10;
        else if (daysSinceLogin <= 90) score += 5;
      }

      // Completeness of profile
      const profileCompleteness = this.calculateProfileCompleteness(profile);
      score += profileCompleteness; // Up to 30 points

      // Features used
      const { count: assessmentCount } = await supabase
        .from('assessments')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      if (assessmentCount > 0) score += Math.min(20, assessmentCount * 5); // Up to 20 points

      // Transaction recency
      const { data: latestTxn } = await supabase
        .from('financial_transactions')
        .select('transaction_date')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false })
        .limit(1)
        .single();

      if (latestTxn) {
        const daysSinceTxn = Math.floor((new Date() - new Date(latestTxn.transaction_date)) / (1000 * 60 * 60 * 24));
        if (daysSinceTxn <= 7) score += 10;
        else if (daysSinceTxn <= 30) score += 5;
      }

      return Math.min(100, score);
    } catch (error) {
      console.error('Engagement score calculation failed:', error);
      return 0;
    }
  }

  /**
   * Calculate behavioral metrics from snapshots
   */
  static async calculateBehavioralMetrics(userId) {
    try {
      const { data: recentSnapshot } = await supabase
        .from('behavior_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      if (!recentSnapshot) {
        return {
          paymentDiscipline: 50,
          impulseTendency: 50,
          planningScore: 50,
          stabilityIndex: 50
        };
      }

      return {
        paymentDiscipline: recentSnapshot.payment_discipline_score || 50,
        impulseTendency: recentSnapshot.impulse_spending_tendency || 50,
        planningScore: recentSnapshot.financial_planning_score || 50,
        stabilityIndex: recentSnapshot.behavioral_stability_index || 50,
        savingsRate: recentSnapshot.savings_rate || 0
      };
    } catch (error) {
      console.error('Behavioral metrics calculation failed:', error);
      return {
        paymentDiscipline: 50,
        impulseTendency: 50,
        planningScore: 50,
        stabilityIndex: 50
      };
    }
  }

  /**
   * Determine which lifecycle stage user is in
   */
  static determineLifecycleStage(accountMetrics, engagementScore, behavioralMetrics) {
    const stages = Object.entries(this.STAGES)
      .sort((a, b) => b[1].order - a[1].order);

    for (const [key, stage] of stages) {
      const indicators = stage.indicators;
      
      let meetsStage = true;
      let points = 0;

      if (indicators.minAssessments !== undefined) {
        if (accountMetrics.assessmentCount >= indicators.minAssessments) points += 15;
        else meetsStage = false;
      }

      if (indicators.minTransactions !== undefined) {
        if (accountMetrics.transactionCount >= indicators.minTransactions) points += 15;
        else meetsStage = false;
      }

      if (indicators.minDaysOnPlatform !== undefined) {
        const daysActive = Math.floor((new Date() - new Date()) / (1000 * 60 * 60 * 24));
        if (daysActive >= indicators.minDaysOnPlatform) points += 15;
        else meetsStage = false;
      }

      if (indicators.minEngagementScore !== undefined) {
        if (engagementScore >= indicators.minEngagementScore) points += 15;
        else meetsStage = false;
      }

      if (indicators.savingsRateMin !== undefined) {
        if (behavioralMetrics.savingsRate >= indicators.savingsRateMin) points += 15;
        else meetsStage = false;
      }

      if (indicators.investmentActivityScore !== undefined) {
        if (accountMetrics.linkedAccounts >= 2) points += 15;
        else meetsStage = false;
      }

      if (indicators.netWorthThreshold !== undefined) {
        if (accountMetrics.netWorth >= indicators.netWorthThreshold) points += 15;
        else meetsStage = false;
      }

      if (meetsStage) {
        return {
          key,
          ...stage,
          confidence: Math.min(100, points)
        };
      }
    }

    // Default to discovery
    return {
      key: 'discovery',
      ...this.STAGES.discovery,
      confidence: 50
    };
  }

  /**
   * Calculate financial maturity score (0-100) with component breakdown
   */
  static calculateFinancialMaturityScore(accountMetrics, engagementScore, behavioralMetrics, stage) {
    // Component scoring (0-100 each)
    const savingsDiscipline = Math.min(100, behavioralMetrics.savingsRate * 2.5); // 0-40% = 0-100
    const investmentSophistication = Math.min(100, accountMetrics.linkedAccounts * 25); // Per linked account
    const debtManagement = accountMetrics.hasDebt ? 
      Math.min(100, 100 - (accountMetrics.totalDebt / 1000000) * 100) : 100;
    const riskAwareness = behavioralMetrics.planningScore;
    const planning = engagementScore; // High engagement = good planning

    // Weighted average
    const weights = {
      savingsDiscipline: 0.25,
      investmentSophistication: 0.20,
      debtManagement: 0.20,
      riskAwareness: 0.20,
      planning: 0.15
    };

    const overall = 
      (savingsDiscipline * weights.savingsDiscipline) +
      (investmentSophistication * weights.investmentSophistication) +
      (debtManagement * weights.debtManagement) +
      (riskAwareness * weights.riskAwareness) +
      (planning * weights.planning);

    return {
      overall: Math.round(overall),
      components: {
        savingsDiscipline: Math.round(savingsDiscipline),
        investmentSophistication: Math.round(investmentSophistication),
        debtManagement: Math.round(debtManagement),
        riskAwareness: Math.round(riskAwareness),
        planning: Math.round(planning)
      }
    };
  }

  /**
   * Determine how fast user is progressing through lifecycle
   */
  static async determineProgressionVelocity(userId, currentStage) {
    try {
      const { data: lifecycle } = await supabase
        .from('user_lifecycle_stages')
        .select('establishment_date, optimization_date, acceleration_date, maturity_date')
        .eq('user_id', userId)
        .single();

      if (!lifecycle) return { velocity: 'steady', monthsPerStage: 0 };

      // Calculate months between stages
      const dates = Object.values(lifecycle).filter(d => d);
      if (dates.length < 2) return { velocity: 'steady', monthsPerStage: 0 };

      const firstDate = new Date(dates[0]);
      const lastDate = new Date(dates[dates.length - 1]);
      const monthsBetweenStages = (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 30);
      const monthsPerStage = monthsBetweenStages / (dates.length - 1);

      let velocity = 'steady';
      if (monthsPerStage < 3) velocity = 'fast';
      else if (monthsPerStage < 6) velocity = 'steady';
      else velocity = 'slow';

      return { velocity, monthsPerStage: Math.round(monthsPerStage * 10) / 10 };
    } catch (error) {
      return { velocity: 'steady', monthsPerStage: 0 };
    }
  }

  /**
   * Generate personalized recommendations based on stage
   */
  static generateRecommendations(stage, maturityScore, accountMetrics) {
    const stageData = this.STAGES[stage.key];
    const goals = stageData.focus;

    let products = [];

    if (stage.key === 'discovery' || stage.key === 'onboarding') {
      products = ['Savings Account', 'Budgeting Tools', 'Financial Education'];
    } else if (stage.key === 'establishment') {
      products = ['Emergency Fund Calculator', 'Debt Consolidation', 'Basic Investments'];
    } else if (stage.key === 'optimization') {
      products = ['Mutual Funds', 'Debt Management Plans', 'Tax Planning'];
    } else if (stage.key === 'acceleration') {
      products = ['Investment Portfolio', 'Advanced Trading', 'Wealth Management'];
    } else if (stage.key === 'maturity') {
      products = ['Retirement Planning', 'Private Banking', 'Tax Optimization'];
    } else if (stage.key === 'planning') {
      products = ['Estate Planning', 'Wealth Transfer', 'Generational Planning'];
    }

    return {
      goals: goals.join(', '),
      products: products.join(', '),
      nextMilestone: this.getNextMilestone(stage.key),
      priorityActions: this.getPriorityActions(stage.key, maturityScore, accountMetrics)
    };
  }

  /**
   * Get next milestone for user
   */
  static getNextMilestone(currentStage) {
    const stageOrder = Object.keys(this.STAGES);
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex < stageOrder.length - 1) {
      return this.STAGES[stageOrder[currentIndex + 1]].name;
    }
    return 'Wealth Preservation';
  }

  /**
   * Get priority actions
   */
  static getPriorityActions(stage, maturityScore, accountMetrics) {
    if (stage === 'discovery') {
      return 'Complete your financial profile and link your first account';
    } else if (stage === 'onboarding') {
      return 'Link more accounts and review your financial health score';
    } else if (stage === 'establishment') {
      return 'Build 3-6 months emergency fund and create a spending budget';
    } else if (stage === 'optimization') {
      return 'Reduce outstanding debt and increase savings rate to 25%';
    } else if (stage === 'acceleration') {
      return 'Start investing 30%+ of income and diversify investments';
    } else if (stage === 'maturity') {
      return 'Plan for retirement and optimize tax strategy';
    } else if (stage === 'planning') {
      return 'Establish long-term wealth transfer and estate plan';
    }
    return 'Continue on your financial journey';
  }

  /**
   * Helper: Calculate months on platform
   */
  static calculateMonthsOnPlatform(createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24 * 30));
  }

  /**
   * Helper: Classify account age
   */
  static classifyAccountAge(createdAt) {
    const months = this.calculateMonthsOnPlatform(createdAt);
    if (months < 1) return 'new';
    if (months < 6) return 'new';
    if (months < 12) return 'established';
    if (months < 24) return 'mature';
    return 'veteran';
  }

  /**
   * Helper: Calculate profile completeness
   */
  static calculateProfileCompleteness(profile) {
    let completeness = 0;
    if (profile.full_name) completeness += 10;
    if (profile.email_verified) completeness += 10;
    if (profile.avatar_url) completeness += 5;
    if (profile.phone_verified) completeness += 5;
    if (profile.occupation) completeness += 5;
    return Math.min(30, completeness);
  }

  /**
   * Helper: Estimate net worth
   */
  static async estimateNetWorth(userId) {
    try {
      const { data: snapshot } = await supabase
        .from('behavior_snapshots')
        .select('amount_saved, investment_amount')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      if (!snapshot) return 0;
      return (snapshot.amount_saved || 0) + (snapshot.investment_amount || 0);
    } catch {
      return 0;
    }
  }

  /**
   * Helper: Calculate total debt
   */
  static async calculateTotalDebt(userId) {
    try {
      // Placeholder - would query actual debt data
      return 0;
    } catch {
      return 0;
    }
  }
}

module.exports = LifecycleScoringSystem;
