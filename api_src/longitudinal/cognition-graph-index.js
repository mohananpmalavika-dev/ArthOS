/**
 * Cognition Graph API Router
 * 
 * REST endpoints for the knowledge graph system.
 * Manages beliefs, biases, emotional triggers, decisions, and outcomes.
 * 
 * 16 endpoints across 5 categories:
 * - Beliefs (3 endpoints)
 * - Biases & Triggers (4 endpoints)
 * - Decisions (4 endpoints)
 * - Outcomes (3 endpoints)
 * - Graph & Analysis (2 endpoints)
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const CognitionGraphEngine = require('./cognition-graph-engine');
const DecisionOutcomeMapper = require('./decision-outcome-mapper');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Middleware: Verify user ID
router.use((req, res, next) => {
  const userId = req.query.userId || req.body.userId;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId required' });
  }
  req.userId = userId;
  next();
});

// ============= BELIEFS ENDPOINTS =============

/**
 * GET /api/cognition/beliefs
 * Get all beliefs for a user
 */
router.get('/beliefs', async (req, res) => {
  try {
    const { limitingOnly = false, coreOnly = false } = req.query;

    let query = supabase
      .from('money_beliefs')
      .select('*')
      .eq('user_id', req.userId)
      .order('belief_strength', { ascending: false });

    if (limitingOnly === 'true') {
      query = query.eq('is_limiting_belief', true);
    }
    if (coreOnly === 'true') {
      query = query.eq('is_core_belief', true);
    }

    const { data: beliefs, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      beliefs: beliefs || [],
      count: beliefs ? beliefs.length : 0
    });
  } catch (error) {
    console.error('Error fetching beliefs:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/cognition/beliefs/extract
 * Extract beliefs from assessments and transactions
 */
router.post('/beliefs/extract', async (req, res) => {
  try {
    const result = await CognitionGraphEngine.extractBeliefs(req.userId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error extracting beliefs:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cognition/beliefs/categories
 * Get beliefs grouped by category
 */
router.get('/beliefs/categories', async (req, res) => {
  try {
    const { data: beliefs, error } = await supabase
      .from('money_beliefs')
      .select('belief_category, id, belief_statement, belief_strength, is_limiting_belief')
      .eq('user_id', req.userId)
      .order('belief_strength', { ascending: false });

    if (error) throw error;

    // Group by category
    const grouped = {};
    (beliefs || []).forEach(belief => {
      if (!grouped[belief.belief_category]) {
        grouped[belief.belief_category] = [];
      }
      grouped[belief.belief_category].push(belief);
    });

    return res.status(200).json({
      success: true,
      beliefsByCategory: grouped,
      totalBeliefs: beliefs ? beliefs.length : 0
    });
  } catch (error) {
    console.error('Error fetching belief categories:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============= BIASES & TRIGGERS ENDPOINTS =============

/**
 * GET /api/cognition/biases
 * Get all detected biases
 */
router.get('/biases', async (req, res) => {
  try {
    const { data: biases, error } = await supabase
      .from('cognitive_biases')
      .select('*')
      .eq('user_id', req.userId)
      .order('bias_intensity_score', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      biases: biases || [],
      count: biases ? biases.length : 0,
      topBias: biases && biases.length > 0 ? biases[0] : null
    });
  } catch (error) {
    console.error('Error fetching biases:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/cognition/biases/detect
 * Run bias detection algorithm
 */
router.post('/biases/detect', async (req, res) => {
  try {
    const result = await CognitionGraphEngine.detectBiases(req.userId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error detecting biases:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cognition/triggers
 * Get emotional triggers
 */
router.get('/triggers', async (req, res) => {
  try {
    const { data: triggers, error } = await supabase
      .from('financial_emotional_triggers')
      .select('*')
      .eq('user_id', req.userId)
      .order('estimated_annual_impact', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      triggers: triggers || [],
      count: triggers ? triggers.length : 0
    });
  } catch (error) {
    console.error('Error fetching triggers:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cognition/risk-perception
 * Get risk perception calibration
 */
router.get('/risk-perception', async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('risk_perception_profiles')
      .select('*')
      .eq('user_id', req.userId)
      .order('assessment_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return res.status(200).json({
      success: true,
      riskProfile: profile || null,
      calibrationNeeded: !profile
    });
  } catch (error) {
    console.error('Error fetching risk perception:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============= DECISION ENDPOINTS =============

/**
 * POST /api/cognition/decisions
 * Record a financial decision
 */
router.post('/decisions', async (req, res) => {
  try {
    const result = await DecisionOutcomeMapper.recordDecision(req.userId, req.body);
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('Error recording decision:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cognition/decisions
 * Get user's decision history
 */
router.get('/decisions', async (req, res) => {
  try {
    const { limit = 20, status = null } = req.query;

    let query = supabase
      .from('financial_decisions')
      .select('*')
      .eq('user_id', req.userId)
      .order('decision_date', { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq('decision_status', status);
    }

    const { data: decisions, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      decisions: decisions || [],
      count: decisions ? decisions.length : 0
    });
  } catch (error) {
    console.error('Error fetching decisions:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cognition/decisions/:decisionId/causal-chain
 * Get belief → decision → outcome causal chain
 */
router.get('/decisions/:decisionId/causal-chain', async (req, res) => {
  try {
    const result = await DecisionOutcomeMapper.getDecisionCausalChain(req.userId, req.params.decisionId);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Error fetching causal chain:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/cognition/decisions/:decisionId/status
 * Update decision status
 */
router.put('/decisions/:decisionId/status', async (req, res) => {
  try {
    const { status, executionStartDate } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'status required' });
    }

    const { data: updated, error } = await supabase
      .from('financial_decisions')
      .update({
        decision_status: status,
        execution_start_date: executionStartDate || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.decisionId)
      .eq('user_id', req.userId)
      .select();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      decision: updated && updated[0] ? updated[0] : null
    });
  } catch (error) {
    console.error('Error updating decision:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============= OUTCOME ENDPOINTS =============

/**
 * POST /api/cognition/outcomes
 * Record decision outcome
 */
router.post('/outcomes', async (req, res) => {
  try {
    const { decisionId, ...outcomeData } = req.body;

    if (!decisionId) {
      return res.status(400).json({ success: false, error: 'decisionId required' });
    }

    const result = await DecisionOutcomeMapper.recordOutcome(req.userId, decisionId, outcomeData);
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('Error recording outcome:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cognition/outcomes
 * Get decision outcomes
 */
router.get('/outcomes', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const { data: outcomes, error } = await supabase
      .from('decision_outcomes')
      .select('*')
      .eq('user_id', req.userId)
      .order('outcome_date', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    return res.status(200).json({
      success: true,
      outcomes: outcomes || [],
      count: outcomes ? outcomes.length : 0
    });
  } catch (error) {
    console.error('Error fetching outcomes:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cognition/outcomes/quality-trend
 * Get decision quality trend over time
 */
router.get('/outcomes/quality-trend', async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const result = await DecisionOutcomeMapper.getDecisionQualityTrend(req.userId, parseInt(months));
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error fetching quality trend:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============= GRAPH & ANALYSIS ENDPOINTS =============

/**
 * GET /api/cognition/graph
 * Get complete cognition graph
 */
router.get('/graph', async (req, res) => {
  try {
    const result = await CognitionGraphEngine.getBeliefNetwork(req.userId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error fetching graph:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/cognition/graph/rebuild
 * Rebuild cognition graph
 */
router.post('/graph/rebuild', async (req, res) => {
  try {
    const result = await CognitionGraphEngine.buildBeliefGraph(req.userId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error rebuilding graph:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cognition/patterns
 * Analyze decision-making patterns
 */
router.get('/patterns', async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const result = await DecisionOutcomeMapper.analyzeDecisionPatterns(req.userId, parseInt(months));
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cognition/insights
 * Get comprehensive cognition insights
 */
router.get('/insights', async (req, res) => {
  try {
    const { data: beliefs } = await supabase
      .from('money_beliefs')
      .select('*')
      .eq('user_id', req.userId)
      .order('belief_strength', { ascending: false })
      .limit(3);

    const { data: biases } = await supabase
      .from('cognitive_biases')
      .select('*')
      .eq('user_id', req.userId)
      .order('bias_intensity_score', { ascending: false })
      .limit(3);

    const { data: triggers } = await supabase
      .from('financial_emotional_triggers')
      .select('*')
      .eq('user_id', req.userId)
      .order('estimated_annual_impact', { ascending: false })
      .limit(3);

    const { data: decisions } = await supabase
      .from('financial_decisions')
      .select('decision_quality_score')
      .eq('user_id', req.userId);

    const avgDecisionQuality = decisions && decisions.length > 0
      ? Math.round(decisions.reduce((sum, d) => sum + (d.decision_quality_score || 50), 0) / decisions.length)
      : 50;

    return res.status(200).json({
      success: true,
      cognitionInsights: {
        topBeliefs: beliefs || [],
        majorBiases: biases || [],
        strongestTriggers: triggers || [],
        decisionQualityScore: avgDecisionQuality,
        summary: `You have ${beliefs?.length || 0} core beliefs, ${biases?.length || 0} significant biases, and ${triggers?.length || 0} strong emotional triggers affecting your financial decisions.`
      }
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============= HEALTH CHECK =============

/**
 * GET /api/cognition/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    service: 'cognition-graph-engine',
    status: 'operational'
  });
});

module.exports = router;
