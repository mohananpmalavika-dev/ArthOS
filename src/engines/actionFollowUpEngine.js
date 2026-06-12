/**
 * Action Follow-Up Engine
 * 
 * Schedules and manages Day 7 & Day 30 follow-ups to measure behavior change
 * Core to validating whether insights drive measurable action and progress
 */

import { createClient } from '@supabase/supabase-js';

class ActionFollowUpEngine {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
    );
  }

  /**
   * Schedule a follow-up sequence when user commits to an action
   * Creates Day 7 and Day 30 follow-up records
   */
  async scheduleFollowUp(userId, insight, action, assessment) {
    if (!userId || !insight || !action) return null;

    try {
      const now = new Date();
      const day7Date = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const day30Date = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Create action_follow_ups record
      const { data, error } = await this.supabase
        .from('action_follow_ups')
        .insert({
          user_id: userId,
          insight_id: insight.id || `insight-${Math.random()}`,
          insight_category: insight.category,
          insight_headline: insight.headline,
          action_committed: action,
          initial_assessment: assessment,
          baseline_behaviour_score: assessment.behaviourScore || 0,
          baseline_awareness_score: assessment.awarenessScore || 0,
          baseline_stability_score: assessment.stabilityScore || 0,
          baseline_overall_health: assessment.healthScore || 0,
          scheduled_at: now.toISOString(),
          day_7_reminder_date: day7Date.toISOString(),
          day_30_reminder_date: day30Date.toISOString(),
          day_7_status: 'scheduled',
          day_30_status: 'scheduled',
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Follow-up scheduling error:', error);
        return null;
      }

      return data;
    } catch (e) {
      console.error('Schedule follow-up exception:', e);
      return null;
    }
  }

  /**
   * Get pending follow-ups for a user
   * Returns both Day 7 and Day 30 reminders that are due
   */
  async getPendingFollowUps(userId) {
    if (!userId) return [];

    try {
      const now = new Date();

      const { data, error } = await this.supabase
        .from('action_follow_ups')
        .select('*')
        .eq('user_id', userId)
        .or(`day_7_status.eq.scheduled,day_30_status.eq.scheduled`)
        .gte('day_7_reminder_date', now.toISOString())
        .order('day_7_reminder_date', { ascending: true });

      if (error) {
        console.error('Get pending follow-ups error:', error);
        return [];
      }

      return (data || []).filter(record => {
        const now = new Date();
        const isDueD7 = record.day_7_status === 'scheduled' && 
                        new Date(record.day_7_reminder_date) <= now;
        const isDueD30 = record.day_30_status === 'scheduled' && 
                         new Date(record.day_30_reminder_date) <= now;
        return isDueD7 || isDueD30;
      });
    } catch (e) {
      console.error('Get pending follow-ups exception:', e);
      return [];
    }
  }

  /**
   * Record Day 7 response from user
   * Captures whether action was completed and current progress
   */
  async recordDay7Response(followUpId, userId, response) {
    if (!followUpId || !userId || !response) return null;

    try {
      const { data, error } = await this.supabase
        .from('action_follow_ups')
        .update({
          day_7_status: 'responded',
          day_7_response_date: new Date().toISOString(),
          day_7_action_completed: response.actionCompleted || false,
          day_7_response_text: response.responseText || '',
          day_7_progress_score: response.progressScore || 0, // 0-100
          day_7_obstacles: response.obstacles || null,
          day_7_updated_at: new Date().toISOString(),
        })
        .eq('id', followUpId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Record Day 7 response error:', error);
        return null;
      }

      // Trigger behavior signal update
      await this.updateBehaviorSignalsFromDay7(userId, response);

      return data;
    } catch (e) {
      console.error('Record Day 7 response exception:', e);
      return null;
    }
  }

  /**
   * Record Day 30 response and trigger reassessment
   * Captures outcome and schedules reassessment if needed
   */
  async recordDay30Response(followUpId, userId, response, currentAssessment) {
    if (!followUpId || !userId || !response) return null;

    try {
      const { data: followUpData, error: followUpError } = await this.supabase
        .from('action_follow_ups')
        .update({
          day_30_status: 'responded',
          day_30_response_date: new Date().toISOString(),
          day_30_action_sustained: response.actionSustained || false,
          day_30_response_text: response.responseText || '',
          day_30_progress_score: response.progressScore || 0,
          day_30_habit_formed: response.habitFormed || false,
          day_30_obstacles: response.obstacles || null,
          day_30_updated_at: new Date().toISOString(),
          day_30_complete: true,
        })
        .eq('id', followUpId)
        .eq('user_id', userId)
        .select()
        .single();

      if (followUpError) {
        console.error('Record Day 30 response error:', followUpError);
        return null;
      }

      // Calculate behavioral delta
      const delta = this.calculateBehaviorDelta(
        followUpData.baseline_behaviour_score,
        currentAssessment?.behaviourScore || followUpData.baseline_behaviour_score,
        followUpData.baseline_awareness_score,
        currentAssessment?.awarenessScore || followUpData.baseline_awareness_score,
        followUpData.baseline_stability_score,
        currentAssessment?.stabilityScore || followUpData.baseline_stability_score,
        followUpData.baseline_overall_health,
        currentAssessment?.healthScore || followUpData.baseline_overall_health
      );

      // Store delta report
      await this.storeDeltaReport(userId, followUpData.id, delta);

      return { followUp: followUpData, delta };
    } catch (e) {
      console.error('Record Day 30 response exception:', e);
      return null;
    }
  }

  /**
   * Calculate behavior score delta between baseline and Day 30
   */
  calculateBehaviorDelta(
    baselineBehavior,
    currentBehavior,
    baselineAwareness,
    currentAwareness,
    baselineStability,
    currentStability,
    baselineHealth,
    currentHealth
  ) {
    return {
      behavior_delta: (currentBehavior || 0) - (baselineBehavior || 0),
      awareness_delta: (currentAwareness || 0) - (baselineAwareness || 0),
      stability_delta: (currentStability || 0) - (baselineStability || 0),
      health_delta: (currentHealth || 0) - (baselineHealth || 0),
      improved: (currentHealth || 0) > (baselineHealth || 0),
      improvement_percentage: baselineHealth > 0 
        ? (((currentHealth || 0) - (baselineHealth || 0)) / (baselineHealth || 1)) * 100 
        : 0,
    };
  }

  /**
   * Store Day 30 delta report
   */
  async storeDeltaReport(userId, followUpId, delta) {
    try {
      await this.supabase
        .from('follow_up_delta_reports')
        .insert({
          user_id: userId,
          follow_up_id: followUpId,
          behavior_delta: delta.behavior_delta,
          awareness_delta: delta.awareness_delta,
          stability_delta: delta.stability_delta,
          health_delta: delta.health_delta,
          improved: delta.improved,
          improvement_percentage: delta.improvement_percentage,
          created_at: new Date().toISOString(),
        })
        .single();
    } catch (e) {
      console.error('Store delta report error:', e);
    }
  }

  /**
   * Update behavior signals based on Day 7 progress
   */
  async updateBehaviorSignalsFromDay7(userId, response) {
    try {
      // Store Day 7 progress signal
      const signal = {
        user_id: userId,
        signal_type: 'day_7_action_follow_up',
        signal_value: response.actionCompleted ? 100 : response.progressScore || 0,
        signal_source: 'action_follow_up',
        signal_data: {
          actionCompleted: response.actionCompleted,
          progressScore: response.progressScore,
          obstacles: response.obstacles,
        },
        recorded_at: new Date().toISOString(),
      };

      await this.supabase
        .from('behavior_signals')
        .insert(signal);
    } catch (e) {
      console.error('Update behavior signals error:', e);
    }
  }

  /**
   * Generate Day 30 delta report narrative
   */
  generateDay30Narrative(followUp, delta) {
    const healthImprovement = delta.health_delta;
    const improvementPercent = delta.improvement_percentage;

    let narrative = '';

    if (delta.improved) {
      narrative += `🎉 Great news! Your Financial Health Score improved by ${healthImprovement} points (${improvementPercent.toFixed(1)}%) over 30 days.\n\n`;
    } else if (healthImprovement < 0) {
      narrative += `📊 Your Financial Health Score shifted by ${healthImprovement} points (${improvementPercent.toFixed(1)}%) over 30 days.\n\n`;
    } else {
      narrative += `📈 Your Financial Health Score remained steady over 30 days.\n\n`;
    }

    if (followUp.day_30_action_sustained) {
      narrative += `✅ You sustained the action: "${followUp.action_committed}"\n`;
    } else {
      narrative += `⏸️ The action didn't stick, but here's what you learned: "${followUp.day_30_response_text}"\n`;
    }

    if (followUp.day_30_habit_formed) {
      narrative += `🌟 This action is becoming a habit! Consider scaling it or connecting it to another goal.\n`;
    }

    // Break-down by component
    if (delta.behavior_delta > 0) {
      narrative += `\n💪 Behavior: +${delta.behavior_delta} pts (more disciplined spending/saving)\n`;
    }
    if (delta.awareness_delta > 0) {
      narrative += `👁️ Awareness: +${delta.awareness_delta} pts (clearer self-knowledge)\n`;
    }
    if (delta.stability_delta > 0) {
      narrative += `🛡️ Stability: +${delta.stability_delta} pts (stronger emergency fund or lower risk)\n`;
    }

    narrative += `\n💡 Next Steps:\n`;
    narrative += `1. Take another full assessment to see all changes\n`;
    narrative += `2. Identify your next most important action\n`;
    narrative += `3. Set a new 30-day goal\n`;

    return narrative;
  }

  /**
   * Get follow-up history for a user (for analytics/dashboards)
   */
  async getFollowUpHistory(userId, limit = 10) {
    if (!userId) return [];

    try {
      const { data, error } = await this.supabase
        .from('action_follow_ups')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get follow-up history error:', error);
        return [];
      }

      return data || [];
    } catch (e) {
      console.error('Get follow-up history exception:', e);
      return [];
    }
  }

  /**
   * Get Day 30 delta reports for analytics
   */
  async getDeltaReports(userId, limit = 10) {
    if (!userId) return [];

    try {
      const { data, error } = await this.supabase
        .from('follow_up_delta_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get delta reports error:', error);
        return [];
      }

      return data || [];
    } catch (e) {
      console.error('Get delta reports exception:', e);
      return [];
    }
  }

  /**
   * Calculate aggregate metrics for a user
   * Answers: "How often do users complete actions? How sustained are they?"
   */
  async calculateFollowUpMetrics(userId) {
    if (!userId) return null;

    try {
      const followUps = await this.getFollowUpHistory(userId, 100);
      
      if (followUps.length === 0) {
        return {
          totalFollowUps: 0,
          completedDay7: 0,
          completedDay30: 0,
          actionSustainmentRate: 0,
          habitFormationRate: 0,
          averageDay7Progress: 0,
          averageDay30Progress: 0,
          averageHealthImprovement: 0,
        };
      }

      const completedDay7 = followUps.filter(f => f.day_7_status === 'responded').length;
      const completedDay30 = followUps.filter(f => f.day_30_status === 'responded').length;
      const actionsSustained = followUps.filter(f => f.day_30_action_sustained).length;
      const habitsFormed = followUps.filter(f => f.day_30_habit_formed).length;

      const day7ProgressScores = followUps
        .filter(f => f.day_7_progress_score)
        .map(f => f.day_7_progress_score);
      const day30ProgressScores = followUps
        .filter(f => f.day_30_progress_score)
        .map(f => f.day_30_progress_score);

      const deltas = await this.getDeltaReports(userId, 100);
      const healthImprovements = deltas
        .filter(d => d.improved)
        .map(d => d.improvement_percentage);

      return {
        totalFollowUps: followUps.length,
        completedDay7,
        completedDay30,
        day7ResponseRate: (completedDay7 / followUps.length) * 100,
        day30ResponseRate: (completedDay30 / followUps.length) * 100,
        actionSustainmentRate: completedDay30 > 0 
          ? (actionsSustained / completedDay30) * 100 
          : 0,
        habitFormationRate: completedDay30 > 0 
          ? (habitsFormed / completedDay30) * 100 
          : 0,
        averageDay7Progress: day7ProgressScores.length > 0
          ? day7ProgressScores.reduce((a, b) => a + b, 0) / day7ProgressScores.length
          : 0,
        averageDay30Progress: day30ProgressScores.length > 0
          ? day30ProgressScores.reduce((a, b) => a + b, 0) / day30ProgressScores.length
          : 0,
        averageHealthImprovement: healthImprovements.length > 0
          ? healthImprovements.reduce((a, b) => a + b, 0) / healthImprovements.length
          : 0,
      };
    } catch (e) {
      console.error('Calculate metrics exception:', e);
      return null;
    }
  }
}

export default new ActionFollowUpEngine();
