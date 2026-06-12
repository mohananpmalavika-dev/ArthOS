/**
 * AI Coach Engine
 * 
 * GPT-powered financial coach that provides personalized guidance based on:
 * - User's cognition data (beliefs, biases, emotional triggers)
 * - Conversation history and coaching preferences
 * - Financial goals and behavioral patterns
 * 
 * The coach acts as a trusted advisor, not just a recommendation engine.
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AICoachEngine {
  /**
   * Initialize a coaching session
   */
  static async initiateCoachingSession(userId, primaryConcern = null) {
    try {
      // Fetch user's cognition data
      const cognitionData = await this.getUserCognitionData(userId);

      // Create session context
      const { data: session, error } = await supabase
        .from('coach_session_context')
        .insert({
          user_id: userId,
          primary_concern: primaryConcern || 'General financial guidance',
          health_score_at_start: cognitionData.healthScore,
          survival_window_at_start: cognitionData.survivalWindow,
          focus_belief_id: cognitionData.topBelief?.id || null,
          focus_bias_id: cognitionData.topBias?.id || null,
          session_theme: this.detectSessionTheme(cognitionData, primaryConcern)
        })
        .select();

      if (error) throw error;

      return {
        success: true,
        sessionId: session[0].id,
        cogn: cognitionData,
        readyForChat: true
      };
    } catch (error) {
      console.error('Error initiating coaching session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch comprehensive cognition data for user
   */
  static async getUserCognitionData(userId) {
    try {
      // Parallel fetch all cognition data
      const [beliefs, biases, triggers, decisions, outcomes, healthScore, survivalWindow] = await Promise.all([
        supabase
          .from('money_beliefs')
          .select('*')
          .eq('user_id', userId)
          .order('belief_strength', { ascending: false })
          .limit(5),
        supabase
          .from('cognitive_biases')
          .select('*')
          .eq('user_id', userId)
          .order('bias_intensity_score', { ascending: false })
          .limit(3),
        supabase
          .from('financial_emotional_triggers')
          .select('*')
          .eq('user_id', userId)
          .order('estimated_annual_impact', { ascending: false })
          .limit(3),
        supabase
          .from('financial_decisions')
          .select('*')
          .eq('user_id', userId)
          .order('decision_date', { ascending: false })
          .limit(10),
        supabase
          .from('decision_outcomes')
          .select('*')
          .eq('user_id', userId)
          .order('outcome_date', { ascending: false })
          .limit(5),
        this.estimateHealthScore(userId),
        this.estimateSurvivalWindow(userId)
      ]);

      return {
        topBeliefs: beliefs.data || [],
        topBiases: biases.data || [],
        topBias: biases.data?.[0] || null,
        emotionalTriggers: triggers.data || [],
        recentDecisions: decisions.data || [],
        recentOutcomes: outcomes.data || [],
        healthScore: healthScore,
        survivalWindow: survivalWindow
      };
    } catch (error) {
      console.error('Error fetching cognition data:', error);
      return { topBeliefs: [], topBiases: [], emotionalTriggers: [] };
    }
  }

  /**
   * Detect session theme based on cognition data
   */
  static detectSessionTheme(cognitionData, primaryConcern) {
    // If user specified concern, use it
    if (primaryConcern) {
      if (primaryConcern.toLowerCase().includes('spend')) return 'spending_control';
      if (primaryConcern.toLowerCase().includes('save')) return 'savings_building';
      if (primaryConcern.toLowerCase().includes('debt')) return 'debt_reduction';
      if (primaryConcern.toLowerCase().includes('invest')) return 'investment_strategy';
      if (primaryConcern.toLowerCase().includes('goal')) return 'goal_alignment';
    }

    // Otherwise infer from cognition data
    const topBias = cognitionData.topBiases?.[0];
    if (topBias?.bias_type === 'present_bias') return 'savings_building';
    if (topBias?.bias_type === 'loss_aversion') return 'investment_strategy';
    if (cognitionData.survivalWindow < 30) return 'emergency_fund_building';

    const topBelief = cognitionData.topBeliefs?.[0];
    if (topBelief?.belief_category === 'scarcity') return 'abundance_mindset';
    if (topBelief?.is_limiting_belief) return 'limiting_belief_challenge';

    return 'general_guidance';
  }

  /**
   * Process user message and generate personalized coach response
   */
  static async sendMessage(userId, sessionId, userMessage) {
    try {
      // Fetch session and cognition context
      const { data: sessionContext } = await supabase
        .from('coach_session_context')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (!sessionContext) {
        return { success: false, error: 'Session not found' };
      }

      // Fetch conversation history
      const { data: messageHistory } = await supabase
        .from('coach_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .order('message_order', { ascending: true })
        .limit(20);

      // Fetch coaching memory
      const { data: coachMemory } = await supabase
        .from('coach_memory_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get fresh cognition data
      const cognitionData = await this.getUserCognitionData(userId);

      // Store user message
      const messageOrder = (messageHistory?.length || 0) + 1;
      await supabase
        .from('coach_conversations')
        .insert({
          user_id: userId,
          session_id: sessionId,
          message_type: 'user_message',
          content: userMessage,
          message_order: messageOrder
        });

      // Generate coach response using GPT-4
      const systemPrompt = this.generateSystemPrompt(cognitionData, coachMemory, sessionContext);
      const conversationHistory = this.formatConversationHistory(messageHistory);

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 800,
        presence_penalty: 0.6
      });

      const coachResponse = response.choices[0].message.content;
      const tokensUsed = response.usage.total_tokens;

      // Store coach response
      const { data: storedMessage } = await supabase
        .from('coach_conversations')
        .insert({
          user_id: userId,
          session_id: sessionId,
          message_type: 'coach_response',
          content: coachResponse,
          message_order: messageOrder + 1,
          tokens_used: tokensUsed,
          confidence_score: this.calculateResponseConfidence(coachResponse)
        })
        .select();

      // Update session message count
      await supabase
        .from('coach_session_context')
        .update({
          message_count: messageOrder + 1,
          total_tokens_used: (sessionContext.total_tokens_used || 0) + tokensUsed
        })
        .eq('id', sessionId);

      // Update coaching memory
      await this.updateCoachingMemory(userId, userMessage, coachResponse);

      return {
        success: true,
        coachResponse,
        tokensUsed,
        sessionId
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate system prompt for coach based on user context
   */
  static generateSystemPrompt(cognitionData, coachMemory, sessionContext) {
    const coachingStyle = coachMemory?.preferred_coaching_style || 'compassionate';
    const theme = sessionContext?.session_theme || 'general_guidance';

    let basePrompt = `You are ARTH.OS Financial Coach - a compassionate, insightful financial advisor with deep understanding of human psychology and financial behaviour.

Your role is to:
1. Provide personalized guidance based on the user's beliefs, biases, and behaviour patterns
2. Help users understand WHY they make financial decisions, not just WHAT decisions to make
3. Challenge limiting beliefs gently and compassionately
4. Celebrate progress and small wins
5. Make recommendations specific, actionable, and time-bound

Your coaching style: ${coachingStyle.replace(/_/g, ' ')}
Current session theme: ${theme.replace(/_/g, ' ')}

USER'S FINANCIAL PROFILE:
`;

    // Add beliefs
    if (cognitionData.topBeliefs?.length > 0) {
      basePrompt += `\nCore Beliefs:\n`;
      cognitionData.topBeliefs.slice(0, 3).forEach((belief, idx) => {
        basePrompt += `${idx + 1}. "${belief.belief_statement}" (Strength: ${belief.belief_strength}/100)${belief.is_limiting_belief ? ' [LIMITING]' : ''}\n`;
      });
    }

    // Add biases
    if (cognitionData.topBiases?.length > 0) {
      basePrompt += `\nCognitive Biases Affecting Decisions:\n`;
      cognitionData.topBiases.slice(0, 2).forEach((bias, idx) => {
        basePrompt += `${idx + 1}. ${bias.bias_name} (Intensity: ${bias.bias_intensity_score}/100, Estimated Annual Impact: ₹${Math.abs(bias.estimated_annual_impact)?.toLocaleString()})\n`;
      });
    }

    // Add financial snapshot
    basePrompt += `\nFinancial Snapshot:\n`;
    basePrompt += `- Health Score: ${cognitionData.healthScore || 'Not yet assessed'}\n`;
    basePrompt += `- Survival Window: ${cognitionData.survivalWindow || 'Calculating'} days\n`;

    // Add coaching memory
    if (coachMemory?.total_conversations > 0) {
      basePrompt += `\nCoaching History:\n`;
      basePrompt += `- Previous conversations: ${coachMemory.total_conversations}\n`;
      basePrompt += `- Recommendation acceptance rate: ${coachMemory.acceptance_rate?.toFixed(0)}%\n`;
      basePrompt += `- Last interaction: ${coachMemory.last_conversation_date ? new Date(coachMemory.last_conversation_date).toLocaleDateString() : 'This is first conversation'}\n`;
    }

    basePrompt += `\nIMPORTANT GUIDELINES:
- Be warm, encouraging, and non-judgmental
- Reference specific beliefs/biases when relevant
- Make recommendations concrete and timely (e.g., "by Friday", "next salary")
- Help user see connections between beliefs, decisions, and outcomes
- If recommending action, specify: what, when, why, and how to measure success
- Celebrate every small step - behavioral change compounds`;

    return basePrompt;
  }

  /**
   * Format conversation history for API call
   */
  static formatConversationHistory(messages) {
    return (messages || [])
      .slice(-10) // Keep last 10 messages for context window
      .map(msg => ({
        role: msg.message_type === 'user_message' ? 'user' : 'assistant',
        content: msg.content
      }));
  }

  /**
   * Calculate confidence score for coach response
   */
  static calculateResponseConfidence(response) {
    // Simple heuristic: longer, more specific responses are higher confidence
    // Also check for certainty indicators
    let confidence = 60;

    if (response.length > 300) confidence += 10;
    if (response.includes('specific') || response.includes('data') || response.includes('research')) confidence += 10;
    if (response.includes('?')) confidence -= 5; // Questions indicate some uncertainty
    if (response.includes('might') || response.includes('could')) confidence -= 5;

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Generate specific recommendations based on user data
   */
  static async generateRecommendation(userId, sessionId, focusArea = null) {
    try {
      const cognitionData = await this.getUserCognitionData(userId);

      // Determine focus area
      let recommendationFocus = focusArea;
      if (!focusArea) {
        const topBias = cognitionData.topBiases?.[0];
        const topBelief = cognitionData.topBeliefs?.[0];

        if (topBias?.bias_type === 'present_bias') {
          recommendationFocus = 'savings_habit_building';
        } else if (topBelief?.is_limiting_belief) {
          recommendationFocus = 'belief_reframing';
        } else {
          recommendationFocus = 'general_behavior_improvement';
        }
      }

      // Create prompt for recommendation generation
      const prompt = `Based on this user's financial profile:

Beliefs: ${cognitionData.topBeliefs?.map(b => `"${b.belief_statement}"`).join(', ')}
Biases: ${cognitionData.topBiases?.map(b => b.bias_name).join(', ')}
Survival Window: ${cognitionData.survivalWindow} days

Generate ONE specific, actionable recommendation that:
1. Addresses their biggest financial vulnerability
2. Is achievable within 7 days
3. Has clear success metric
4. Explains why this matters for their situation

Format as: [RECOMMENDATION] [TIME_FRAME] [SUCCESS_METRIC] [WHY_IT_MATTERS]`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert financial coach generating actionable recommendations.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 300
      });

      const recommendationText = response.choices[0].message.content;

      // Parse recommendation components
      const components = this.parseRecommendation(recommendationText);

      // Store recommendation
      const { data: recommendation, error } = await supabase
        .from('coach_recommendations')
        .insert({
          user_id: userId,
          session_id: sessionId,
          recommendation_text: recommendationText,
          recommendation_type: 'action',
          priority_level: this.determinePriority(cognitionData),
          time_frame: components.timeFrame,
          success_metric: components.successMetric,
          expected_impact: components.expectedImpact
        })
        .select();

      if (error) throw error;

      return {
        success: true,
        recommendation: recommendation[0],
        components
      };
    } catch (error) {
      console.error('Error generating recommendation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Parse recommendation text into components
   */
  static parseRecommendation(text) {
    const lines = text.split('\n');
    return {
      recommendation: lines[0] || text,
      timeFrame: this.extractTimeFrame(text),
      successMetric: this.extractMetric(text, 'success'),
      expectedImpact: this.extractMetric(text, 'impact')
    };
  }

  /**
   * Extract time frame from text
   */
  static extractTimeFrame(text) {
    const patterns = ['this week', 'by friday', 'by weekend', 'this month', 'next 7 days', '7 days', 'immediately'];
    for (const pattern of patterns) {
      if (text.toLowerCase().includes(pattern)) return pattern;
    }
    return 'flexible';
  }

  /**
   * Extract metric from text
   */
  static extractMetric(text, type) {
    const lines = text.split('\n');
    for (const line of lines) {
      if (type === 'success' && line.toLowerCase().includes('success')) return line.trim();
      if (type === 'impact' && line.toLowerCase().includes('impact')) return line.trim();
    }
    return null;
  }

  /**
   * Determine priority level
   */
  static determinePriority(cognitionData) {
    if (cognitionData.survivalWindow < 30) return 'critical';
    if (cognitionData.topBiases?.length > 0 && cognitionData.topBiases[0].bias_intensity_score > 80) return 'high';
    if (cognitionData.topBeliefs?.some(b => b.is_limiting_belief && b.belief_strength > 70)) return 'high';
    return 'medium';
  }

  /**
   * Update coaching memory based on interaction
   */
  static async updateCoachingMemory(userId, userMessage, coachResponse) {
    try {
      const { data: existingMemory } = await supabase
        .from('coach_memory_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const updateData = {
        last_conversation_date: new Date().toISOString(),
        last_conversation_topic: userMessage.substring(0, 100),
        total_conversations: (existingMemory?.total_conversations || 0) + 1,
        updated_at: new Date().toISOString()
      };

      if (existingMemory?.id) {
        await supabase
          .from('coach_memory_profiles')
          .update(updateData)
          .eq('user_id', userId);
      } else {
        await supabase
          .from('coach_memory_profiles')
          .insert({
            user_id: userId,
            preferred_coaching_style: 'compassionate',
            response_length_preference: 'detailed',
            ...updateData
          });
      }
    } catch (error) {
      console.error('Error updating coaching memory:', error);
      // Non-blocking error
    }
  }

  /**
   * End coaching session with summary
   */
  static async endCoachingSession(userId, sessionId, userSatisfactionScore = null) {
    try {
      // Fetch session and messages
      const { data: session } = await supabase
        .from('coach_session_context')
        .select('*')
        .eq('id', sessionId)
        .single();

      const { data: messages } = await supabase
        .from('coach_conversations')
        .select('*')
        .eq('session_id', sessionId)
        .order('message_order', { ascending: true });

      // Generate session summary using GPT
      const summaryPrompt = `Summarize this coaching conversation (${messages.length} messages) into 2-3 key insights and recommended next steps:

${messages
  .slice(-10)
  .map(m => `${m.message_type === 'user_message' ? 'User' : 'Coach'}: ${m.content}`)
  .join('\n\n')}

Format: INSIGHTS: [2-3 bullets] NEXT_STEPS: [2-3 actions]`;

      const summaryResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'Provide concise, actionable session summary.'
          },
          { role: 'user', content: summaryPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const sessionSummary = summaryResponse.choices[0].message.content;

      // Update session
      await supabase
        .from('coach_session_context')
        .update({
          session_end_date: new Date().toISOString(),
          session_summary: sessionSummary,
          user_satisfaction_score: userSatisfactionScore
        })
        .eq('id', sessionId);

      return {
        success: true,
        summary: sessionSummary,
        messageCount: messages.length
      };
    } catch (error) {
      console.error('Error ending session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get coaching memory for user
   */
  static async getCoachingMemory(userId) {
    try {
      const { data: memory, error } = await supabase
        .from('coach_memory_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        return { success: true, memory: null, isFirstInteraction: true };
      }

      if (error) throw error;

      return { success: true, memory, isFirstInteraction: false };
    } catch (error) {
      console.error('Error fetching coaching memory:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Estimate health score (placeholder - integrate with actual scoring)
   */
  static async estimateHealthScore(userId) {
    try {
      const { data: decisions } = await supabase
        .from('financial_decisions')
        .select('decision_quality_score')
        .eq('user_id', userId)
        .limit(10);

      if (!decisions || decisions.length === 0) return 500;

      const avgQuality = decisions.reduce((sum, d) => sum + (d.decision_quality_score || 50), 0) / decisions.length;
      return Math.round(avgQuality * 10);
    } catch (error) {
      return 500;
    }
  }

  /**
   * Estimate survival window (placeholder - integrate with actual calculation)
   */
  static async estimateSurvivalWindow(userId) {
    try {
      // This is a simplified version
      // In real implementation, pull from actual financial data
      return Math.floor(Math.random() * 180) + 20; // 20-200 days
    } catch (error) {
      return null;
    }
  }
}

module.exports = AICoachEngine;
