/* AI Coach Engine with Multi-Provider Support */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Import AI provider (will work in Node 14+)
let sendAIMessage;
let getProviderInfo;

async function initializeAIProviders() {
  try {
    const aiProviders = await import('../lib/aiProviders.js');
    sendAIMessage = aiProviders.sendAIMessage;
    getProviderInfo = aiProviders.getProviderInfo;
  } catch (error) {
    console.warn('Warning: Could not load AI providers:', error.message);
    console.log('AI Coach features will be limited to echo mode');
    sendAIMessage = null;
  }
}

// Initialize on module load
initializeAIProviders().catch(err => console.warn('AI provider initialization warning:', err));

// System prompts for different coaching scenarios
const SYSTEM_PROMPTS = {
  general: `You are a compassionate and knowledgeable financial coach. Help users understand their finances, build better money habits, and achieve their financial goals. Be encouraging, non-judgmental, and practical. Focus on behavioral change and sustainable financial health.`,

  crisis: `You are an empathetic financial crisis counselor. The user is facing financial stress. Help them feel heard, identify immediate priorities, and create a short-term action plan. Be supportive while being realistic about their situation.`,

  planning: `You are a strategic financial planner. Help the user build a comprehensive financial plan aligned with their values and goals. Break down complex concepts into simple, actionable steps.`,

  behavioral: `You are an expert in behavioral finance. Help the user understand the psychological patterns affecting their money decisions. Use insights about cognitive biases and emotional triggers to help them make better choices.`
};

class AICoachEngine {
  static async initiateCoachingSession(userId, primaryConcern = null) {
    try {
      const sessionId = `sess_${Date.now()}`;
      const cognition = { survivalWindow: 30, topBiases: [], topBeliefs: [] };
      const { data, error } = await supabase
        .from('coach_session_context')
        .insert([{
          id: sessionId,
          user_id: userId,
          session_start_date: new Date().toISOString(),
          message_count: 0,
          primary_concern: primaryConcern
        }]);
      if (error) throw error;

      return {
        success: true,
        sessionId,
        cognition,
        aiProvider: getProviderInfo?.().activeProvider || 'offline'
      };
    } catch (err) {
      console.error('initiateCoachingSession error:', err);
      return { success: false, error: err.message };
    }
  }

  static async sendMessage(userId, sessionId, message) {
    try {
      let coachResponse;
      let tokensUsed = 0;
      let provider = 'offline';

      // Try to use AI if available
      if (sendAIMessage) {
        try {
          const systemPrompt = SYSTEM_PROMPTS.general;
          const result = await sendAIMessage([
            { role: 'user', content: message }
          ], systemPrompt);

          coachResponse = result.message;
          provider = result.provider;
          tokensUsed = result.usage?.outputTokens || 0;
        } catch (aiError) {
          console.warn('AI provider error, falling back to echo:', aiError.message);
          coachResponse = `[${provider}] ${message}`;
        }
      } else {
        // Fallback: echo mode for development
        coachResponse = `[Coach - Echo Mode] ${message}`;
      }

      // Store messages
      await supabase.from('coach_conversations').insert([
        {
          user_id: userId,
          session_id: sessionId,
          message_type: 'user_message',
          content: message,
          created_at: new Date().toISOString(),
          message_order: 1,
          ai_provider: provider
        }
      ]);

      await supabase.from('coach_conversations').insert([
        {
          user_id: userId,
          session_id: sessionId,
          message_type: 'coach_message',
          content: coachResponse,
          created_at: new Date().toISOString(),
          message_order: 2,
          ai_provider: provider,
          tokens_used: tokensUsed
        }
      ]);

      return { success: true, coachResponse, tokensUsed, sessionId, provider };
    } catch (err) {
      console.error('sendMessage error:', err);
      return { success: false, error: err.message };
    }
  }

  static async generateRecommendation(userId, sessionId, focusArea = null) {
    try {
      let recommendation;
      let provider = 'offline';

      if (sendAIMessage) {
        try {
          const systemPrompt = SYSTEM_PROMPTS.planning;
          const prompt = `Generate a specific, actionable financial recommendation for: ${focusArea || 'general financial improvement'}. Format as: Title, 3-5 key actions, expected impact.`;

          const result = await sendAIMessage([
            { role: 'user', content: prompt }
          ], systemPrompt);

          recommendation = {
            id: `rec_${Date.now()}`,
            user_id: userId,
            content: result.message,
            created_at: new Date().toISOString(),
            ai_provider: result.provider,
            focus_area: focusArea
          };
          provider = result.provider;
        } catch (aiError) {
          console.warn('Could not generate AI recommendation:', aiError.message);
          recommendation = {
            id: `rec_${Date.now()}`,
            user_id: userId,
            content: `Recommendation for: ${focusArea || 'general'}`,
            created_at: new Date().toISOString(),
            ai_provider: 'echo'
          };
        }
      } else {
        recommendation = {
          id: `rec_${Date.now()}`,
          user_id: userId,
          content: `Recommendation for ${focusArea || 'general'}`,
          created_at: new Date().toISOString(),
          ai_provider: 'offline'
        };
      }

      await supabase.from('coach_recommendations').insert([recommendation]);

      return { success: true, recommendation, components: {}, provider };
    } catch (err) {
      console.error('generateRecommendation error:', err);
      return { success: false, error: err.message };
    }
  }

  static async endCoachingSession(userId, sessionId, userSatisfactionScore = null) {
    try {
      const { data, error } = await supabase
        .from('coach_session_context')
        .update({
          session_end_date: new Date().toISOString(),
          user_satisfaction_score: userSatisfactionScore
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, summary: 'Session ended', messageCount: 0 };
    } catch (err) {
      console.error('endCoachingSession error:', err);
      return { success: false, error: err.message };
    }
  }

  static async getCoachingMemory(userId) {
    try {
      const { data: memory } = await supabase
        .from('coach_memory_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      return { success: true, memory: memory || null, isFirstInteraction: !memory };
    } catch (err) {
      console.error('getCoachingMemory error:', err);
      return { success: false, error: err.message };
    }
  }

  static getProviderStatus() {
    if (!getProviderInfo) {
      return { status: 'offline', message: 'AI providers not initialized' };
    }

    const info = getProviderInfo();
    return {
      activeProvider: info.activeProvider,
      configured: info.config,
      message: `Using ${info.activeProvider} for AI coaching`
    };
  }
}

module.exports = AICoachEngine;
