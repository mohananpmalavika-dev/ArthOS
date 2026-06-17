/**
 * AI Coach API Handler - Vercel Serverless
 * 
 * Main handler for all AI Coach endpoints.
 * Routes requests to appropriate handler based on method and path.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
const requireModule = createRequire(import.meta.url);
const AICoachEngine = requireModule('./ai-coach-engine.cjs');
import { requireAuth } from '../auth/jwt.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('AI Coach API running without Supabase config. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env or environment.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function normalizeCoachPath(pathname) {
  if (!pathname) return '';
  try {
    const url = new URL(pathname, 'http://localhost');
    return url.pathname.replace(/\/+/g, '/').replace(/\/+$/, '');
  } catch {
    return pathname.replace(/\\+/g, '/').replace(/\/+$/, '');
  }
}

async function getUserId(req, res) {
  const user = await requireAuth(req, res);
  if (!user) {
    // requireAuth already sent the error response
    return null;
  }
  return user.id;
}

function isPlaceholderValue(value) {
  if (!value) return true;
  const lower = String(value).toLowerCase();
  return lower.includes('your-project') || lower.includes('your-service-role-key') || lower.includes('your-openai-key') || lower.includes('xxx') || lower.includes('replace');
}

function ensureSupabaseConfigured() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || isPlaceholderValue(SUPABASE_URL) || isPlaceholderValue(SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error('Missing or placeholder Supabase configuration. Set valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env or .env.local.');
  }
}

function ensureOpenAIConfigured() {
  if (!OPENAI_API_KEY || isPlaceholderValue(OPENAI_API_KEY)) {
    console.warn('OPENAI_API_KEY is not configured or still using a placeholder value. AI Coach chat features will be disabled or limited.');
  }
}

// ============= MAIN HANDLER =============

export default async function aiCoachHandler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { method } = req;
    const pathname = normalizeCoachPath(req.url?.split('?')[0] || '');

    // Health endpoint does not require userId
    if (method === 'GET' && pathname === '/api/coach/health') {
      return handleHealth(res);
    }

    const userId = await getUserId(req, res);
    if (!userId) {
      // getUserId already sent the error response
      return;
    }

    // Route to appropriate handler
    if (method === 'POST' && pathname === '/api/coach/sessions') {
      return handleStartSession(userId, req.body, res);
    }
    if (method === 'GET' && pathname === '/api/coach/sessions') {
      return handleListSessions(userId, res);
    }
    if (method === 'GET' && pathname.match(/^\/api\/coach\/sessions\/[^/]+$/) && !pathname.includes('messages') && !pathname.includes('history') && !pathname.includes('recommendations') && !pathname.includes('end')) {
      const sessionId = pathname.split('/')[4];
      return handleGetSession(userId, sessionId, res);
    }
    if (method === 'POST' && pathname.match(/^\/api\/coach\/sessions\/[^/]+\/messages$/)) {
      const sessionId = pathname.split('/')[4];
      return handleSendMessage(userId, sessionId, req.body, res);
    }
    if (method === 'GET' && pathname.match(/^\/api\/coach\/sessions\/[^/]+\/history$/)) {
      const sessionId = pathname.split('/')[4];
      return handleGetHistory(userId, sessionId, res);
    }
    if (method === 'POST' && pathname.match(/^\/api\/coach\/sessions\/[^/]+\/recommendations$/)) {
      const sessionId = pathname.split('/')[4];
      return handleGenerateRecommendation(userId, sessionId, req.body, res);
    }
    if (method === 'GET' && pathname === '/api/coach/recommendations') {
      return handleListRecommendations(userId, req.query, res);
    }
    if (method === 'PUT' && pathname.match(/^\/api\/coach\/recommendations\/[^/]+$/)) {
      const recommendationId = pathname.split('/')[4];
      return handleUpdateRecommendation(userId, recommendationId, req.body, res);
    }
    if (method === 'POST' && pathname.match(/^\/api\/coach\/sessions\/[^/]+\/end$/)) {
      const sessionId = pathname.split('/')[4];
      return handleEndSession(userId, sessionId, req.body, res);
    }
    if (method === 'GET' && pathname === '/api/coach/memory') {
      return handleGetMemory(userId, res);
    }
    if (method === 'PUT' && pathname === '/api/coach/memory') {
      return handleUpdateMemory(userId, req.body, res);
    }
    if (method === 'GET' && pathname === '/api/coach/analytics') {
      return handleGetAnalytics(userId, res);
    }
    if (method === 'GET' && pathname === '/api/coach/health') {
      return handleHealth(res);
    }

    return res.status(404).json({ success: false, error: 'Endpoint not found' });
  } catch (error) {
    console.error('AI Coach Handler Error:', error);
    return res.status(400).json({ success: false, error: error.message });
  }
};

// ============= HANDLER FUNCTIONS =============

async function handleStartSession(userId, body, res) {
  try {
    ensureSupabaseConfigured();
    const { primaryConcern = null } = body;
    const result = await AICoachEngine.initiateCoachingSession(userId, primaryConcern);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      sessionId: result.sessionId,
      message: 'Coaching session started. Ready to chat!',
      coachGreeting: generateCoachGreeting(result.cognition),
      readyForChat: true
    });
  } catch (error) {
    console.error('Error initiating session:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handleListSessions(userId, res) {
  try {
    ensureSupabaseConfigured();
    const { data: sessions, error } = await supabase
      .from('coach_session_context')
      .select('*')
      .eq('user_id', userId)
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
}

async function handleGetSession(userId, sessionId, res) {
  try {
    const { data: session, error } = await supabase
      .from('coach_session_context')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
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
}

async function handleSendMessage(userId, sessionId, body, res) {
  try {
    ensureSupabaseConfigured();
    ensureOpenAIConfigured();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message required' });
    }

    const result = await AICoachEngine.sendMessage(userId, sessionId, message);

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
}

async function handleGetHistory(userId, sessionId, res) {
  try {
    const { data: messages, error } = await supabase
      .from('coach_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('message_order', { ascending: true });

    if (error) throw error;

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
}

async function handleGenerateRecommendation(userId, sessionId, body, res) {
  try {
    ensureSupabaseConfigured();
    ensureOpenAIConfigured();
    const { focusArea = null } = body;

    const result = await AICoachEngine.generateRecommendation(userId, sessionId, focusArea);

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
}

async function handleListRecommendations(userId, query, res) {
  try {
    const { status = null, limit = 10 } = query;

    let q = supabase
      .from('coach_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      q = q.eq('recommendation_status', status);
    }

    const { data: recommendations, error } = await q;

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
}

async function handleUpdateRecommendation(userId, recommendationId, body, res) {
  try {
    const { status, effectivenessRating, behavioralChange } = body;

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
      .eq('id', recommendationId)
      .eq('user_id', userId)
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
}

async function handleEndSession(userId, sessionId, body, res) {
  try {
    const { userSatisfactionScore = null } = body;

    const result = await AICoachEngine.endCoachingSession(userId, sessionId, userSatisfactionScore);

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
}

async function handleGetMemory(userId, res) {
  try {
    ensureSupabaseConfigured();
    const result = await AICoachEngine.getCoachingMemory(userId);

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
}

async function handleUpdateMemory(userId, body, res) {
  try {
    const {
      preferredCoachingStyle,
      responseLengthPreference,
      preferredLanguage
    } = body;

    const { data: memory } = await supabase
      .from('coach_memory_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const updateData = {};
    if (preferredCoachingStyle) updateData.preferred_coaching_style = preferredCoachingStyle;
    if (responseLengthPreference) updateData.response_length_preference = responseLengthPreference;
    if (preferredLanguage) updateData.preferred_language = preferredLanguage;
    updateData.updated_at = new Date().toISOString();

    if (memory?.id) {
      const { data: updated, error } = await supabase
        .from('coach_memory_profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        memory: updated && updated[0] ? updated[0] : null
      });
    } else {
      const { data: created, error } = await supabase
        .from('coach_memory_profiles')
        .insert({
          user_id: userId,
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
}

async function handleGetAnalytics(userId, res) {
  ensureSupabaseConfigured();
  try {
    const { data: sessions } = await supabase
      .from('coach_session_context')
      .select('*')
      .eq('user_id', userId);

    const { data: recommendations } = await supabase
      .from('coach_recommendations')
      .select('*')
      .eq('user_id', userId);

    const { data: memory } = await supabase
      .from('coach_memory_profiles')
      .select('*')
      .eq('user_id', userId)
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
}

function handleHealth(res) {
  const openaiConfigured = !!OPENAI_API_KEY && !isPlaceholderValue(OPENAI_API_KEY);
  const supabaseConfigured = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) && !isPlaceholderValue(SUPABASE_URL) && !isPlaceholderValue(SUPABASE_SERVICE_ROLE_KEY);
  return res.status(200).json({
    success: true,
    service: 'ai-coach-engine',
    status: 'operational',
    openaiConfigured,
    supabaseConfigured
  });
}

function generateCoachGreeting(cognitionData) {
  const concerns = [];

  if (cognitionData?.survivalWindow < 30) {
    concerns.push('I notice your survival window is quite tight. Let\'s work on building more financial resilience.');
  }

  if (cognitionData?.topBiases?.length > 0) {
    concerns.push(`I see ${cognitionData.topBiases[0].bias_name} affecting your decisions. We can address this together.`);
  }

  if (cognitionData?.topBeliefs?.some(b => b.is_limiting_belief)) {
    concerns.push('I\'ve noticed some limiting beliefs that might be holding you back. Let\'s explore them.');
  }

  if (concerns.length === 0) {
    return "Hi! I'm your financial coach. What would you like to work on today?";
  }

  return `Hi! ${concerns[0]} What would you like to focus on in today's session?`;
}
