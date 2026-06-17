/* Decision-Outcome Mapper (CommonJS copy) */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class DecisionOutcomeMapper {
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

      if (!title || !type || !category) {
        return { success: false, error: 'Missing required decision fields' };
      }

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

      const { data: decision, error: decisionError } = await supabase
        .from('financial_decisions')
        .select('*')
        .eq('id', decisionId)
        .eq('user_id', userId)
        .single();

      if (decisionError || !decision) {
        return { success: false, error: 'Decision not found' };
      }

      const decisionQuality = this.calculateDecisionQuality(decision, actualAmount, outcomeStatus);

      const financialImpact = actualAmount - (decision.decision_amount || 0);

      let counterfactualOutcome = null;
      if (decision.options_considered > 1) {
        counterfactualOutcome = this.estimateCounterfactualOutcome(decision);
      }

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

  static calculateDecisionQuality(decision, actualAmount, outcomeStatus) {
    let score = 50;

    const outcomeFactors = {
      'successful': 20,
      'partially_successful': 10,
      'unsuccessful': -15,
      'unexpected_positive': 25,
      'unexpected_negative': -20
    };
    score += outcomeFactors[outcomeStatus] || 0;

    if (decision.decision_confidence > 70) {
      if (outcomeStatus.includes('successful')) {
        score += 10;
      } else {
        score -= 15;
      }
    }

    score += decision.alignment_with_goals ? decision.alignment_with_goals / 5 : 0;
    score += decision.value_consistency ? decision.value_consistency / 5 : 0;
    score -= decision.bias_evidence ? decision.bias_evidence / 5 : 0;
    score = Math.max(0, Math.min(100, score));

    return {
      score: Math.round(score),
      wasOptimal: score > 70
    };
  }

}

module.exports = DecisionOutcomeMapper;
