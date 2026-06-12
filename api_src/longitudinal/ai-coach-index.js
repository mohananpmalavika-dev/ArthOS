/**
 * AI Coach API Handler
 * 
 * Vercel Serverless Handler for the financial coach.
 * Routes requests to appropriate handler based on method and path.
 * 
 * Endpoints:
 * - POST /api/coach/sessions - Start new session
 * - POST /api/coach/sessions/:id/messages - Send message
 * - GET /api/coach/sessions/:id/history - Get conversation history
 * - POST /api/coach/sessions/:id/recommendations - Generate recommendation
 * - POST /api/coach/sessions/:id/end - End session
 * - GET /api/coach/memory - Get coaching memory
 * - GET /api/coach/sessions - Get all sessions
 */

const { createClient } = require('@supabase/supabase-js');
const AICoachEngine = require('./ai-coach-engine');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Extract userId from request
function getUserId(req) {
  const userId = req.query?.userId || req.body?.userId;
  if (!userId) {
    throw new Error('userId required');
  }
  return userId;
}

// ============= SESSION ENDPOINTS =============

/**
 * POST /api/coach/sessions
 * Initiate a new coaching session
 */
router.post('/sessions', async (req, res) => {
  try {
    const { primaryConcern = null } = req.body;

    const result = await AICoachEngine.initiateCoachingSession(req.userId, primaryConcern);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      sessionId: result.sessionId,
      message: 'Coaching session started. Ready to chat!',
      coachGreeting: this.generateCoachGreeting(result.cognition),
      readyForChat: true
    });
  } catch (error) {
    console.error('Error initiating session:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/coach/sessions
 * Get all coaching sessions for user
 */
router.get('/sessions', async (req, res) => {
  try {
    const { data: sessions, error } = await supabase
      .from('coach_session_context')
      .select('*')
      .eq('user_id', req.userId)
      .order('session_start_date', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      sessions: sessions || [],
      count: sessions ? sessions.length : 0
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/coach/sessions/:sessionId
 * Get specific session details
 */
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { data: session, error } = await supabase
      .from('coach_session_context')
      .select('*')
      .eq('id', req.params.sessionId)
      .eq('user_id', req.userId)
      .single();

    if (error || !session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    return res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============= MESSAGE ENDPOINTS =============

/**
 * POST /api/coach/sessions/:sessionId/messages
 * Send message and get coach response
 */
router.post('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message required' });
    }

    const result = await AICoachEngine.sendMessage(req.userId, req.params.sessionId, message);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      coachResponse: result.coachResponse,
      tokensUsed: result.tokensUsed,
      sessionId: result.sessionId
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/coach/sessions/:sessionId/history
 * Get conversation history
 */
router.get('/sessions/:sessionId/history', async (req, res) => {
  try {
    const { data: messages, error } = await supabase
      .from('coach_conversations')
      .select('*')
      .eq('user_id', req.userId)
      .eq('session_id', req.params.sessionId)
      .order('message_order', { ascending: true });

    if (error) throw error;

    // Transform messages for frontend
    const formattedMessages = (messages || []).map(msg => ({
      id: msg.id,
      type: msg.message_type === 'user_message' ? 'user' : 'coach',
      content: msg.content,
      timestamp: msg.created_at,
      confidence: msg.confidence_score
    }));

    return res.status(200).json({
      success: true,
      messages: formattedMessages,
      count: formattedMessages.length
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============= RECOMMENDATION ENDPOINTS =============

/**
 * POST /api/coach/sessions/:sessionId/recommendations
 * Generate AI coach recommendations
 */
router.post('/sessions/:sessionId/recommendations', async (req, res) => {
  try {
    const { focusArea = null } = req.body;

    const result = await AICoachEngine.generateRecommendation(req.userId, req.params.sessionId, focusArea);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      recommendation: result.recommendation,
      components: result.components
    });
  } catch (error) {
    console.error('Error generating recommendation:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/coach/recommendations
 * Get all recommendations for user
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { status = null, limit = 10 } = req.query;

    let query = supabase
      .from('coach_recommendations')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq('recommendation_status', status);
    }

    const { data: recommendations, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      recommendations: recommendations || [],
      count: recommendations ? recommendations.length : 0
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/coach/recommendations/:recommendationId
 * Update recommendation status
 */
router.put('/recommendations/:recommendationId', async (req, res) => {
  try {
    const { status, effectivenessRating, behavioralChange } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status required' });
    }

    const { data: updated, error } = await supabase
      .from('coach_recommendations')
      .update({
        recommendation_status: status,
        status_updated_at: new Date().toISOString(),
        effectiveness_rating: effectivenessRating,
        behavioral_change_observed: behavioralChange
      })
      .eq('id', req.params.recommendationId)
      .eq('user_id', req.userId)
      .select();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      recommendation: updated && updated[0] ? updated[0] : null
    });
  } catch (error) {
    console.error('Error updating recommendation:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============= SESSION MANAGEMENT ENDPOINTS =============

/**
 * POST /api/coach/sessions/:sessionId/end
 * End coaching session with summary
 */
router.post('/sessions/:sessionId/end', async (req, res) => {
  try {
    const { userSatisfactionScore = null } = req.body;

    const result = await AICoachEngine.endCoachingSession(req.userId, req.params.sessionId, userSatisfactionScore);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      summary: result.summary,
      messageCount: result.messageCount
    });
  } catch (error) {
    console.error('Error ending session:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============= COACHING MEMORY ENDPOINTS =============

/**
 * GET /api/coach/memory
 * Get user's coaching memory and preferences
 */
router.get('/memory', async (req, res) => {
  try {
    const result = await AICoachEngine.getCoachingMemory(req.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      memory: result.memory,
      isFirstInteraction: result.isFirstInteraction
    });
  } catch (error) {
    console.error('Error fetching coaching memory:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/coach/memory
 * Update coaching preferences
 */
router.put('/memory', async (req, res) => {
  try {
    const {
      preferredCoachingStyle,
      responseLengthPreference,
      preferredLanguage
    } = req.body;

    const { data: memory } = await supabase
      .from('coach_memory_profiles')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    const updateData = {};
    if (preferredCoachingStyle) updateData.preferred_coaching_style = preferredCoachingStyle;
    if (responseLengthPreference) updateData.response_length_preference = responseLengthPreference;
    if (preferredLanguage) updateData.preferred_language = preferredLanguage;
    updateData.updated_at = new Date().toISOString();

    if (memory?.id) {
      // Update existing
      const { data: updated, error } = await supabase
        .from('coach_memory_profiles')
        .update(updateData)
        .eq('user_id', req.userId)
        .select();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        memory: updated && updated[0] ? updated[0] : null
      });
    } else {
      // Create new
      const { data: created, error } = await supabase
        .from('coach_memory_profiles')
        .insert({
          user_id: req.userId,
          preferred_coaching_style: preferredCoachingStyle || 'compassionate',
          response_length_preference: responseLengthPreference || 'detailed',
          preferred_language: preferredLanguage || 'en',
          ...updateData
        })
        .select();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        memory: created && created[0] ? created[0] : null
      });
    }
  } catch (error) {
    console.error('Error updating memory:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============= ANALYTICS ENDPOINTS =============

/**
 * GET /api/coach/analytics
 * Get coaching analytics for user
 */
router.get('/analytics', async (req, res) => {
  try {
    const { data: sessions } = await supabase
      .from('coach_session_context')
      .select('*')
      .eq('user_id', req.userId);

    const { data: recommendations } = await supabase
      .from('coach_recommendations')
      .select('*')
      .eq('user_id', req.userId);

    const { data: memory } = await supabase
      .from('coach_memory_profiles')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    const acceptedRecommendations = recommendations?.filter(r => r.recommendation_status === 'accepted').length || 0;
    const completedRecommendations = recommendations?.filter(r => r.recommendation_status === 'completed').length || 0;

    return res.status(200).json({
      success: true,
      analytics: {
        totalSessions: sessions?.length || 0,
        totalMessages: sessions?.reduce((sum, s) => sum + (s.message_count || 0), 0) || 0,
        averageSessionDuration: sessions && sessions.length > 0
          ? Math.round(sessions.reduce((sum, s) => sum + (s.message_count || 0), 0) / sessions.length)
          : 0,
        totalRecommendations: recommendations?.length || 0,
        acceptedRecommendations,
        completedRecommendations,
        acceptanceRate: recommendations && recommendations.length > 0
          ? Math.round((acceptedRecommendations / recommendations.length) * 100)
          : 0,
        averageUserSatisfaction: sessions && sessions.length > 0
          ? Math.round(
              sessions
                .filter(s => s.user_satisfaction_score)
                .reduce((sum, s) => sum + s.user_satisfaction_score, 0) /
                sessions.filter(s => s.user_satisfaction_score).length
            )
          : null,
        coachingMemory: memory || null
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============= HEALTH CHECK =============

/**
 * GET /api/coach/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    service: 'ai-coach-engine',
    status: 'operational',
    openaiConfigured: !!process.env.OPENAI_API_KEY
  });
});

// ============= HELPER FUNCTIONS =============

function generateCoachGreeting(cognitionData) {
  const concerns = [];

  if (cognitionData.survivalWindow < 30) {
    concerns.push('I notice your survival window is quite tight. Let\'s work on building more financial resilience.');
  }

  if (cognitionData.topBiases?.length > 0) {
    concerns.push(`I see ${cognitionData.topBiases[0].bias_name} affecting your decisions. We can address this together.`);
  }

  if (cognitionData.topBeliefs?.some(b => b.is_limiting_belief)) {
    concerns.push('I\'ve noticed some limiting beliefs that might be holding you back. Let\'s explore them.');
  }

  if (concerns.length === 0) {
    return "Hi! I'm your financial coach. What would you like to work on today?";
  }

  return `Hi! ${concerns[0]} What would you like to focus on in today's session?`;
}

module.exports = router;
