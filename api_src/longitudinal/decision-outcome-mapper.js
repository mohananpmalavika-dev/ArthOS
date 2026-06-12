/**
 * Decision-Outcome Mapper
 * 
 * Tracks financial decisions through their execution lifecycle and maps
 * intended outcomes to actual outcomes. Enables learning from decision history.
 * 
 * Key Functions:
 * - recordDecision() - Capture a financial decision
 * - recordOutcome() - Track actual outcome
 * - assessDecisionQuality() - Evaluate decision in hindsight
 * - getDecisionCausalChain() - Trace belief → decision → outcome
 * - analyzeDecisionPattern() - Find patterns in decision-making
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class DecisionOutcomeMapper {
  /**
   * Record a financial decision with context
   */
  static async recordDecision(userId, decisionData) {
    try {
      const {
        title,
        type,
        category,
        amount,
        confidence,
        emotionalState,
        optionsConsidered,
        selectedOption,
        reasoning,
        influencingBeliefs = [],
        relevantBiases = [],
        triggerEmotionId = null,
        timeHorizon = 'medium_term'
      } = decisionData;

      // Validate decision data
      if (!title || !type || !category) {
        return { success: false, error: 'Missing required decision fields' };
      }

      // Store decision
      const { data: decision, error } = await supabase
        .from('financial_decisions')
        .insert({
          user_id: userId,
          decision_title: title,
          decision_type: type,
          decision_category: category,
          decision_amount: amount || null,
          decision_date: new Date().toISOString().split('T')[0],
          decision_time: new Date().toISOString().split('T')[1],
          decision_confidence: confidence || 50,
          emotional_state: emotionalState || null,
          options_considered: optionsConsidered || 1,
          selected_option: selectedOption || 1,
          decision_reasoning: reasoning || null,
          influencing_beliefs: influencingBeliefs,
          relevant_biases: relevantBiases,
          triggered_by_emotion_id: triggerEmotionId,
          time_horizon: timeHorizon,
          decision_status: 'pending',
          alignment_with_goals: 50,
          value_consistency: 50,
          bias_evidence: 30
        })
        .select();

      if (error) throw error;

      return {
        success: true,
        decision: decision[0],
        message: 'Decision recorded successfully'
      };
    } catch (error) {
      console.error('Error recording decision:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record the actual outcome of a decision
   */
  static async recordOutcome(userId, decisionId, outcomeData) {
    try {
      const {
        actualAmount,
        outcomeStatus,
        intendedOutcome,
        actualOutcome,
        satisfaction,
        lessonsLearned,
        emotionalOutcome
      } = outcomeData;

      // Fetch the decision
      const { data: decision, error: decisionError } = await supabase
        .from('financial_decisions')
        .select('*')
        .eq('id', decisionId)
        .eq('user_id', userId)
        .single();

      if (decisionError || !decision) {
        return { success: false, error: 'Decision not found' };
      }

      // Calculate decision quality
      const decisionQuality = this.calculateDecisionQuality(decision, actualAmount, outcomeStatus);

      // Calculate financial impact
      const financialImpact = actualAmount - (decision.decision_amount || 0);

      // Calculate counterfactual
      let counterfactualOutcome = null;
      if (decision.options_considered > 1) {
        counterfactualOutcome = this.estimateCounterfactualOutcome(decision);
      }

      // Record outcome
      const { data: outcome, error: outcomeError } = await supabase
        .from('decision_outcomes')
        .insert({
          decision_id: decisionId,
          user_id: userId,
          outcome_date: new Date().toISOString().split('T')[0],
          actual_amount: actualAmount,
          outcome_status: outcomeStatus,
          intended_outcome: intendedOutcome,
          actual_outcome: actualOutcome,
          outcome_matches_intention: this.checkOutcomeMatch(intendedOutcome, actualOutcome),
          financial_impact: financialImpact,
          impact_direction: financialImpact > 0 ? 'positive' : financialImpact < 0 ? 'negative' : 'neutral',
          decision_was_optimal: decisionQuality.wasOptimal,
          counterfactual_outcome: counterfactualOutcome,
          opportunity_cost: counterfactualOutcome ? Math.abs(counterfactualOutcome - financialImpact) : null,
          emotional_outcome: emotionalOutcome || 'neutral',
          satisfaction_score: satisfaction,
          lessons_learned: lessonsLearned,
          actual_vs_expected: this.calculateAccuracy(decision, actualAmount)
        })
        .select();

      if (outcomeError) throw outcomeError;

      // Update decision status
      await supabase
        .from('financial_decisions')
        .update({
          decision_status: 'executed',
          decision_quality_score: decisionQuality.score,
          execution_completion_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', decisionId);

      return {
        success: true,
        outcome: outcome[0],
        analysis: {
          qualityScore: decisionQuality.score,
          financialImpact,
          satisfactionScore: satisfaction
        }
      };
    } catch (error) {
      console.error('Error recording outcome:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate decision quality score in hindsight
   */
  static calculateDecisionQuality(decision, actualAmount, outcomeStatus) {
    let score = 50; // Base score

    // Factor 1: Outcome status match
    const outcomeFactors = {
      'successful': 20,
      'partially_successful': 10,
      'unsuccessful': -15,
      'unexpected_positive': 25,
      'unexpected_negative': -20
    };
    score += outcomeFactors[outcomeStatus] || 0;

    // Factor 2: Confidence calibration
    if (decision.decision_confidence > 70) {
      if (outcomeStatus.includes('successful')) {
        score += 10; // Well-calibrated confidence
      } else {
        score -= 15; // Over-confident
      }
    }

    // Factor 3: Alignment with goals (if tracked)
    score += decision.alignment_with_goals ? decision.alignment_with_goals / 5 : 0;

    // Factor 4: Value consistency
    score += decision.value_consistency ? decision.value_consistency / 5 : 0;

    // Factor 5: Bias evidence (negative)
    score -= decision.bias_evidence ? decision.bias_evidence / 5 : 0;

    // Clamp to 0-100
    score = Math.max(0, Math.min(100, score));

    return {
      score: Math.round(score),
      wasOptimal: score > 70
    };
  }

  /**
   * Check if actual outcome matches intended outcome
   */
  static checkOutcomeMatch(intended, actual) {
    if (!intended || !actual) return false;
    const similarity = this.calculateStringSimilarity(intended, actual);
    return similarity > 0.6;
  }

  /**
   * Calculate accuracy of prediction vs actual
   */
  static calculateAccuracy(decision, actualAmount) {
    if (!decision.decision_amount || decision.decision_amount === 0) return 100;
    const difference = Math.abs(actualAmount - decision.decision_amount);
    const accuracy = Math.max(0, 100 - (difference / decision.decision_amount) * 100);
    return Math.round(accuracy);
  }

  /**
   * Estimate what would have happened with other options
   */
  static estimateCounterfactualOutcome(decision) {
    // Simple heuristic: estimate ±20% variation between options
    if (decision.decision_amount && decision.options_considered > 1) {
      const variation = decision.decision_amount * 0.2;
      return decision.decision_amount - variation;
    }
    return null;
  }

  /**
   * Calculate string similarity (Levenshtein distance)
   */
  static calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;

    const editDistance = this.getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  static getEditDistance(str1, str2) {
    const costs = [];
    for (let i = 0; i <= str1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= str2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (str1.charAt(i - 1) !== str2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[str2.length] = lastValue;
    }
    return costs[str2.length];
  }

  /**
   * Get complete causal chain: Belief → Decision → Outcome
   */
  static async getDecisionCausalChain(userId, decisionId) {
    try {
      // Fetch decision
      const { data: decision } = await supabase
        .from('financial_decisions')
        .select('*')
        .eq('id', decisionId)
        .eq('user_id', userId)
        .single();

      if (!decision) {
        return { success: false, error: 'Decision not found' };
      }

      const chain = { decision };

      // Get influencing beliefs
      if (decision.influencing_beliefs && decision.influencing_beliefs.length > 0) {
        const { data: beliefs } = await supabase
          .from('money_beliefs')
          .select('*')
          .in('id', decision.influencing_beliefs);
        chain.beliefs = beliefs || [];
      }

      // Get relevant biases
      if (decision.relevant_biases && decision.relevant_biases.length > 0) {
        const { data: biases } = await supabase
          .from('cognitive_biases')
          .select('*')
          .in('id', decision.relevant_biases);
        chain.biases = biases || [];
      }

      // Get trigger emotion if exists
      if (decision.triggered_by_emotion_id) {
        const { data: trigger } = await supabase
          .from('financial_emotional_triggers')
          .select('*')
          .eq('id', decision.triggered_by_emotion_id)
          .single();
        chain.emotionalTrigger = trigger;
      }

      // Get outcome if exists
      const { data: outcome } = await supabase
        .from('decision_outcomes')
        .select('*')
        .eq('decision_id', decisionId)
        .single();

      if (outcome) {
        chain.outcome = outcome;
      }

      return {
        success: true,
        causalChain: chain,
        narrative: this.generateCausalNarrative(chain)
      };
    } catch (error) {
      console.error('Error getting causal chain:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate narrative explanation of decision causal chain
   */
  static generateCausalNarrative(chain) {
    let narrative = '';

    if (chain.beliefs && chain.beliefs.length > 0) {
      narrative += `Based on your belief that "${chain.beliefs[0].belief_statement}", `;
    }

    if (chain.emotionalTrigger) {
      narrative += `and feeling ${chain.emotionalTrigger.trigger_emotion} due to ${chain.emotionalTrigger.trigger_event}, `;
    }

    narrative += `you decided to ${chain.decision.decision_description || chain.decision.decision_title}`;

    if (chain.biases && chain.biases.length > 0) {
      narrative += ` (influenced by ${chain.biases.map(b => b.bias_type).join(', ')})`;
    }

    narrative += '.';

    if (chain.outcome) {
      narrative += ` The outcome was ${chain.outcome.outcome_status}, `;
      if (chain.outcome.satisfaction_score > 70) {
        narrative += 'which you found satisfying.';
      } else if (chain.outcome.satisfaction_score < 40) {
        narrative += 'which you found disappointing.';
      } else {
        narrative += 'with mixed results.';
      }
    }

    return narrative;
  }

  /**
   * Analyze decision-making patterns over time
   */
  static async analyzeDecisionPatterns(userId, months = 6) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Fetch decisions in period
      const { data: decisions } = await supabase
        .from('financial_decisions')
        .select('*')
        .eq('user_id', userId)
        .gte('decision_date', startDate.toISOString().split('T')[0])
        .order('decision_date', { ascending: false });

      if (!decisions || decisions.length === 0) {
        return { success: true, patterns: [] };
      }

      // Fetch outcomes
      const decisionIds = decisions.map(d => d.id);
      const { data: outcomes } = await supabase
        .from('decision_outcomes')
        .select('*')
        .in('decision_id', decisionIds);

      const outcomeMap = {};
      (outcomes || []).forEach(o => {
        outcomeMap[o.decision_id] = o;
      });

      const patterns = [];

      // Pattern 1: Time pressure correlation
      const timePressureDecisions = decisions.filter(d => d.time_pressure_level > 70);
      if (timePressureDecisions.length > 0) {
        const avgQuality = timePressureDecisions.reduce((sum, d) => sum + (d.decision_quality_score || 50), 0) / timePressureDecisions.length;
        patterns.push({
          pattern: 'time_pressure_correlation',
          description: 'Decisions made under time pressure',
          frequency: timePressureDecisions.length,
          averageQuality: Math.round(avgQuality),
          insight: avgQuality < 45 ? 'Your decisions suffer under time pressure' : 'You handle time pressure well',
          recommendation: 'Try to avoid rushing financial decisions. Create decision checklists.'
        });
      }

      // Pattern 2: Emotional decision tendency
      const emotionalDecisions = decisions.filter(d => d.emotional_state && d.emotional_state !== 'calm');
      if (emotionalDecisions.length > 0) {
        const ratioEmotional = (emotionalDecisions.length / decisions.length) * 100;
        patterns.push({
          pattern: 'emotional_decision_making',
          description: `${ratioEmotional.toFixed(0)}% of decisions made in emotional states`,
          frequency: emotionalDecisions.length,
          insight: ratioEmotional > 50 ? 'Most of your decisions are emotion-driven' : 'You make mostly rational decisions',
          recommendation: 'Pause before big decisions. Journal what you\'re feeling first.'
        });
      }

      // Pattern 3: Confidence calibration
      const overconfident = decisions.filter(d => {
        const outcome = outcomeMap[d.id];
        return d.decision_confidence > 80 && outcome && outcome.satisfaction_score < 50;
      });

      if (overconfident.length > 0) {
        patterns.push({
          pattern: 'overconfidence_bias',
          description: 'Decisions made with high confidence but low satisfaction',
          frequency: overconfident.length,
          insight: 'You tend to be overconfident in your assessments',
          recommendation: 'Ask someone you trust to review big decisions before committing.'
        });
      }

      // Pattern 4: Category preference
      const categoryScores = {};
      decisions.forEach(d => {
        if (!categoryScores[d.decision_category]) {
          categoryScores[d.decision_category] = { count: 0, qualitySum: 0 };
        }
        categoryScores[d.decision_category].count++;
        categoryScores[d.decision_category].qualitySum += d.decision_quality_score || 50;
      });

      const bestCategory = Object.entries(categoryScores).sort((a, b) => (b[1].qualitySum / b[1].count) - (a[1].qualitySum / a[1].count))[0];
      if (bestCategory) {
        patterns.push({
          pattern: 'expertise_category',
          description: `You make your best decisions in ${bestCategory[0]}`,
          frequency: bestCategory[1].count,
          averageQuality: Math.round(bestCategory[1].qualitySum / bestCategory[1].count),
          insight: `You have natural expertise in ${bestCategory[0]} decisions`,
          recommendation: `Leverage this strength. Delegate other categories to experts or trusted advisors.`
        });
      }

      return {
        success: true,
        patterns,
        summary: {
          totalDecisions: decisions.length,
          decisionPeriod: `Last ${months} months`,
          averageQuality: Math.round(decisions.reduce((sum, d) => sum + (d.decision_quality_score || 50), 0) / decisions.length)
        }
      };
    } catch (error) {
      console.error('Error analyzing decision patterns:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get decision quality trend over time
   */
  static async getDecisionQualityTrend(userId, months = 12) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data: decisions } = await supabase
        .from('financial_decisions')
        .select('*')
        .eq('user_id', userId)
        .gte('decision_date', startDate.toISOString().split('T')[0])
        .order('decision_date', { ascending: true });

      if (!decisions || decisions.length === 0) {
        return { success: true, trend: [] };
      }

      // Group by month
      const monthlyData = {};
      decisions.forEach(d => {
        const month = d.decision_date.substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { decisions: [], scores: [] };
        }
        monthlyData[month].decisions.push(d);
        monthlyData[month].scores.push(d.decision_quality_score || 50);
      });

      // Calculate trend
      const trend = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        count: data.decisions.length,
        avgQuality: Math.round(data.scores.reduce((a, b) => a + b) / data.scores.length),
        minQuality: Math.min(...data.scores),
        maxQuality: Math.max(...data.scores)
      }));

      return {
        success: true,
        trend,
        trajectory: this.calculateTrend(trend)
      };
    } catch (error) {
      console.error('Error getting quality trend:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate trend direction (improving/declining/stable)
   */
  static calculateTrend(monthlyData) {
    if (monthlyData.length < 2) return 'insufficient_data';

    const recent = monthlyData.slice(-3).map(m => m.avgQuality);
    const older = monthlyData.slice(0, 3).map(m => m.avgQuality);

    const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b) / older.length;

    const change = recentAvg - olderAvg;

    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }
}

module.exports = DecisionOutcomeMapper;
