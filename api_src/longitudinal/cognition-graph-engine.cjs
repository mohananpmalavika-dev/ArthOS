/* Cognition Graph Engine (CommonJS copy) */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class CognitionGraphEngine {
  static async extractBeliefs(userId) {
    try {
      const beliefs = [];

      const { data: assessments } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (assessments && assessments.length > 0) {
        const explicitBeliefs = await this.extractBeliefsfromAssessments(userId, assessments);
        beliefs.push(...explicitBeliefs);
      }

      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false })
        .limit(500);

      if (transactions && transactions.length > 0) {
        const implicitBeliefs = await this.extractBeliefsFromTransactions(userId, transactions);
        beliefs.push(...implicitBeliefs);
      }

      const mergedBeliefs = this.mergeSimilarBeliefs(beliefs);

      for (const belief of mergedBeliefs) {
        await supabase
          .from('money_beliefs')
          .upsert({
            user_id: userId,
            belief_statement: belief.statement,
            belief_category: belief.category,
            belief_type: belief.type,
            belief_strength: belief.strength,
            confidence_score: belief.confidence,
            belief_origin: belief.origin,
            supporting_evidence: belief.evidence,
            emotional_valence: belief.valence,
            is_limiting_belief: belief.isLimiting,
            is_core_belief: belief.isCore,
            first_detected_date: new Date().toISOString().split('T')[0]
          }, {
            onConflict: 'user_id,belief_statement,belief_category'
          });
      }

      return {
        success: true,
        beliefsExtracted: mergedBeliefs.length,
        beliefs: mergedBeliefs
      };
    } catch (error) {
      console.error('Error extracting beliefs:', error);
      return { success: false, error: error.message };
    }
  }

  static async extractBeliefsfromAssessments(userId, assessments) {
    const beliefs = [];
    const beliefPatterns = {
      scarcity: [
        { regex: /money is (hard|difficult|scarce)/i, category: 'scarcity' },
        { regex: /never have (enough|enough money)/i, category: 'scarcity' },
        { regex: /worried about (running out|money)/i, category: 'scarcity' }
      ],
      abundance: [
        { regex: /money is abundant|plenty of opportunities/i, category: 'abundance' },
        { regex: /confident in earning|income grows/i, category: 'abundance' }
      ],
      security: [
        { regex: /security is important|need stability/i, category: 'security' },
        { regex: /prefer safe|avoid risk/i, category: 'security' }
      ],
      growth: [
        { regex: /want to grow|build wealth/i, category: 'growth' },
        { regex: /invest|multiply money/i, category: 'growth' }
      ],
      control: [
        { regex: /want to be in control|manage money|stay organized/i, category: 'control' },
        { regex: /dislike (debt|losing control)/i, category: 'control' }
      ]
    };

    for (const assessment of assessments) {
      const responses = assessment.response_data || {};

      Object.entries(responses).forEach(([question, response]) => {
        const responseText = String(response).toLowerCase();

        for (const [category, patterns] of Object.entries(beliefPatterns)) {
          for (const pattern of patterns) {
            if (pattern.regex.test(responseText)) {
              const belief = {
                statement: `User values ${category.replace(/_/g, ' ')}`,
                category: pattern.category,
                type: 'core_belief',
                strength: 75,
                confidence: 70,
                origin: 'assessment_response',
                evidence: [{ type: 'assessment', question, response }],
                valence: category === 'scarcity' || category === 'control' ? 'negative' : 'positive',
                isLimiting: ['scarcity'].includes(category),
                isCore: true
              };
              beliefs.push(belief);
            }
          }
        }
      });
    }

    return beliefs;
  }

  static async extractBeliefsFromTransactions(userId, transactions) {
    const beliefs = [];

    const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    const discretionaryCategories = ['entertainment', 'dining', 'shopping', 'travel'];
    const discretionarySpent = transactions
      .filter(t => discretionaryCategories.includes(t.category?.toLowerCase()))
      .reduce((sum, t) => sum + t.amount, 0);
    const discretionaryRatio = totalExpense > 0 ? (discretionarySpent / totalExpense) * 100 : 0;

    if (discretionaryRatio > 30) {
      beliefs.push({
        statement: 'Prioritize experiences and enjoyment over strict saving',
        category: 'abundance',
        type: 'money_script',
        strength: Math.min(100, discretionaryRatio),
        confidence: 65,
        origin: 'behavioral_signal',
        evidence: [{ type: 'spending_pattern', discretionaryRatio }],
        valence: 'positive',
        isLimiting: false,
        isCore: false
      });
    }

    if (savingsRate < 10) {
      beliefs.push({
        statement: 'Money is difficult to save, consumed by immediate needs',
        category: 'scarcity',
        type: 'core_belief',
        strength: Math.min(100, Math.abs(savingsRate - 50)),
        confidence: 70,
        origin: 'behavioral_signal',
        evidence: [{ type: 'savings_pattern', savingsRate }],
        valence: 'negative',
        isLimiting: true,
        isCore: true
      });
    }

    const latePayments = transactions.filter(t => t.status === 'late').length;
    if (latePayments > 0) {
      beliefs.push({
        statement: 'Struggle with payment discipline and financial organization',
        category: 'control',
        type: 'limiting_belief',
        strength: Math.min(100, latePayments * 15),
        confidence: 75,
        origin: 'behavioral_signal',
        evidence: [{ type: 'payment_pattern', latePayments }],
        valence: 'negative',
        isLimiting: true,
        isCore: false
      });
    }

    const investmentTransactions = transactions.filter(t => t.category?.toLowerCase() === 'investment');
    if (investmentTransactions.length > 0) {
      beliefs.push({
        statement: 'Believe in growing wealth through investment',
        category: 'growth',
        type: 'core_belief',
        strength: Math.min(100, investmentTransactions.length * 10),
        confidence: 75,
        origin: 'behavioral_signal',
        evidence: [{ type: 'investment_pattern', count: investmentTransactions.length }],
        valence: 'positive',
        isLimiting: false,
        isCore: true
      });
    }

    return beliefs;
  }

  static mergeSimilarBeliefs(beliefs) {
    const merged = [];
    const seen = new Set();

    for (const belief of beliefs) {
      const key = `${belief.category}:${belief.statement.substring(0, 30)}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(belief);
      }
    }

    return merged;
  }

  static async detectBiases(userId) {
    try {
      const biases = [];

      const { data: decisions } = await supabase
        .from('financial_decisions')
        .select('*')
        .eq('user_id', userId)
        .order('decision_date', { ascending: false })
        .limit(50);

      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false })
        .limit(300);

      if (decisions && decisions.length > 0) {
        const lossAversion = this.detectLossAversion(decisions);
        if (lossAversion) biases.push(lossAversion);

        const presentBias = this.detectPresentBias(decisions);
        if (presentBias) biases.push(presentBias);

        const optimismBias = this.detectOptimismBias(decisions);
        if (optimismBias) biases.push(optimismBias);
      }

      if (transactions && transactions.length > 0) {
        const statusQuoBias = this.detectStatusQuoBias(userId, transactions);
        if (statusQuoBias) biases.push(statusQuoBias);

        const availabilityBias = this.detectAvailabilityBias(transactions);
        if (availabilityBias) biases.push(availabilityBias);
      }

      for (const bias of biases) {
        await supabase
          .from('cognitive_biases')
          .upsert({
            user_id: userId,
            bias_type: bias.type,
            bias_name: bias.name,
            bias_description: bias.description,
            bias_intensity_score: bias.intensity,
            confidence_score: bias.confidence,
            detected_instances: bias.instances,
            example_incidents: bias.examples,
            estimated_annual_impact: bias.impact,
            first_detected_date: new Date().toISOString().split('T')[0],
            trend: 'stable'
          }, {
            onConflict: 'user_id,bias_type'
          });
      }

      return {
        success: true,
        biasesDetected: biases.length,
        biases
      };
    } catch (error) {
      console.error('Error detecting biases:', error);
      return { success: false, error: error.message };
    }
  }

  static detectLossAversion(decisions) {
    const rejectedRisks = decisions.filter(d =>
      d.decision_status === 'abandoned' &&
      d.decision_reasoning?.includes('risk')
    );

    if (rejectedRisks.length > 0) {
      return {
        type: 'loss_aversion',
        name: 'Loss Aversion',
        description: 'Avoiding potential losses more strongly than pursuing equivalent gains',
        intensity: Math.min(100, rejectedRisks.length * 15),
        confidence: 70,
        instances: rejectedRisks.length,
        examples: rejectedRisks.slice(0, 3),
        impact: rejectedRisks.reduce((sum, d) => sum + (d.decision_amount || 0), 0) * 0.1
      };
    }
    return null;
  }

  static detectPresentBias(decisions) {
    const shortTermFocused = decisions.filter(d =>
      d.time_horizon === 'immediate' &&
      d.decision_quality_score < 50
    );

    if (shortTermFocused.length / decisions.length > 0.3) {
      return {
        type: 'present_bias',
        name: 'Present Bias',
        description: 'Over-weighting immediate costs/rewards and under-weighting future consequences',
        intensity: Math.min(100, (shortTermFocused.length / decisions.length) * 100),
        confidence: 75,
        instances: shortTermFocused.length,
        examples: shortTermFocused.slice(0, 3),
        impact: shortTermFocused.reduce((sum, d) => sum + (d.decision_amount || 0), 0) * 0.15
      };
    }
    return null;
  }

  // (truncated for brevity)
}

module.exports = CognitionGraphEngine;
