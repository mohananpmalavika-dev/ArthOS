/* AI Coach Engine (CommonJS shim) */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class AICoachEngine {
  static async initiateCoachingSession(userId, primaryConcern = null) {
    try {
      const sessionId = `sess_${Date.now()}`;
      const cognition = { survivalWindow: 30, topBiases: [], topBeliefs: [] };
      const { data, error } = await supabase
        .from('coach_session_context')
        .insert([{ id: sessionId, user_id: userId, session_start_date: new Date().toISOString(), message_count: 0 }]);
      if (error) throw error;
      return { success: true, sessionId, cognition };
    } catch (err) {
      console.error('initiateCoachingSession error:', err);
      return { success: false, error: err.message };
    }
  }

  static async sendMessage(userId, sessionId, message) {
    try {
      const coachResponse = `Echo: ${message}`;
      await supabase.from('coach_conversations').insert([{ user_id: userId, session_id: sessionId, message_type: 'user_message', content: message, created_at: new Date().toISOString(), message_order: 1 }]);
      await supabase.from('coach_conversations').insert([{ user_id: userId, session_id: sessionId, message_type: 'coach_message', content: coachResponse, created_at: new Date().toISOString(), message_order: 2 }]);
      return { success: true, coachResponse, tokensUsed: 0, sessionId };
    } catch (err) {
      console.error('sendMessage error:', err);
      return { success: false, error: err.message };
    }
  }

  static async generateRecommendation(userId, sessionId, focusArea = null) {
    try {
      const recommendation = { id: `rec_${Date.now()}`, user_id: userId, content: `Recommendation for ${focusArea || 'general'}`, created_at: new Date().toISOString() };
      await supabase.from('coach_recommendations').insert([recommendation]);
      return { success: true, recommendation, components: {} };
    } catch (err) {
      console.error('generateRecommendation error:', err);
      return { success: false, error: err.message };
    }
  }

  static async endCoachingSession(userId, sessionId, userSatisfactionScore = null) {
    try {
      const { data, error } = await supabase.from('coach_session_context').update({ session_end_date: new Date().toISOString(), user_satisfaction_score: userSatisfactionScore }).eq('id', sessionId).eq('user_id', userId);
      if (error) throw error;
      return { success: true, summary: 'Session ended', messageCount: 0 };
    } catch (err) {
      console.error('endCoachingSession error:', err);
      return { success: false, error: err.message };
    }
  }

  static async getCoachingMemory(userId) {
    try {
      const { data: memory } = await supabase.from('coach_memory_profiles').select('*').eq('user_id', userId).single();
      return { success: true, memory: memory || null, isFirstInteraction: !memory };
    } catch (err) {
      console.error('getCoachingMemory error:', err);
      return { success: false, error: err.message };
    }
  }
}

module.exports = AICoachEngine;
