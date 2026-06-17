/* Longitudinal Learning API Router (CommonJS copy) */

const { createClient } = require('@supabase/supabase-js');
const BehaviorEvolutionEngine = require('./behavior-evolution-engine.cjs');
const PatternLearningEngine = require('./pattern-learning-engine.cjs');
const LifecycleScoringSystem = require('./lifecycle-scoring-system.cjs');

function isPlaceholderValue(value) {
  if (!value) return true;
  const lower = String(value).trim().toLowerCase();
  return lower.includes('your-project') || lower.includes('your-service-role-key') || lower.includes('xxx') || lower.includes('replace') || lower.includes('example');
}

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || isPlaceholderValue(url) || isPlaceholderValue(key)) {
    throw new Error('Missing or invalid Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to valid values.');
  }
  return createClient(url, key);
}

const supabase = createSupabaseClient();

async function getBehaviorSnapshot(req, res) {
  const { userId } = req.query;
  const { snapshotDate, periodType = 'monthly' } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const { data: snapshots, error } = await supabase
      .from('behavior_snapshots')
      .select('*')
      .eq('user_id', userId)
      .eq('period_type', periodType)
      .eq('snapshot_date', snapshotDate)
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      snapshot: snapshots
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function generateBehaviorSnapshot(req, res) {
  const { userId, snapshotDate, periodType = 'monthly' } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const result = await BehaviorEvolutionEngine.generateBehaviorSnapshot(
      userId,
      snapshotDate || new Date().toISOString().split('T')[0],
      periodType
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getBehaviorHistory(req, res) {
  const { userId, months = 12, limit = 12 } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const { data: snapshots, error } = await supabase
      .from('behavior_snapshots')
      .select('*')
      .eq('user_id', userId)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true })
      .limit(parseInt(limit));

    if (error) throw error;

    const trends = this.calculateSnapshotTrends(snapshots);

    return res.status(200).json({
      success: true,
      snapshots,
      trends,
      count: snapshots.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getBehavioralIndicators(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const { data: snapshot } = await supabase
      .from('behavior_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    if (!snapshot) {
      return res.status(404).json({ success: false, message: 'No behavior data found' });
    }

    return res.status(200).json({
      success: true,
      indicators: {
        paymentDiscipline: snapshot.payment_discipline_score,
        onTimePaymentPercentage: snapshot.on_time_payment_percentage,
        impulseTendency: snapshot.impulse_spending_tendency,
        planningScore: snapshot.financial_planning_score,
        stabilityIndex: snapshot.behavioral_stability_index,
        healthTrajectory: snapshot.financial_health_trajectory
      },
      snapshot: snapshot.snapshot_date
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function detectPatterns(req, res) {
  const { userId, analysisMonths = 12 } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const result = await PatternLearningEngine.detectAllPatterns(userId, analysisMonths);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getPatterns(req, res) {
  const { userId, type = 'all', active = true } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    let query = supabase
      .from('behavior_patterns')
      .select('*')
      .eq('user_id', userId);

    if (active === 'true') {
      query = query.eq('active', true);
    }

    if (type !== 'all') {
      query = query.eq('pattern_type', type);
    }

    const { data: patterns, error } = await query.order('confidence_score', { ascending: false });

    if (error) throw error;

    const grouped = {};
    patterns.forEach(p => {
      if (!grouped[p.pattern_type]) grouped[p.pattern_type] = [];
      grouped[p.pattern_type].push(p);
    });

    return res.status(200).json({
      success: true,
      patterns,
      grouped,
      count: patterns.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getPatternDetails(req, res) {
  const { patternId } = req.params;

  try {
    const { data: pattern, error } = await supabase
      .from('behavior_patterns')
      .select('*')
      .eq('id', patternId)
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      pattern
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function updatePattern(req, res) {
  const { patternId } = req.params;
  const updates = req.body;

  try {
    const { data: pattern, error } = await supabase
      .from('behavior_patterns')
      .update(updates)
      .eq('id', patternId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      pattern
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getUserLifecycle(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const { data: lifecycle, error } = await supabase
      .from('user_lifecycle_stages')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!lifecycle) {
      const result = await LifecycleScoringSystem.calculateUserLifecycle(userId);
      return res.status(200).json(result);
    }

    return res.status(200).json({
      success: true,
      lifecycle
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function calculateLifecycle(req, res) {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const result = await LifecycleScoringSystem.calculateUserLifecycle(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getLifecycleRecommendations(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const { data: lifecycle } = await supabase
      .from('user_lifecycle_stages')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!lifecycle) {
      return res.status(404).json({ success: false, message: 'Lifecycle not found' });
    }

    return res.status(200).json({
      success: true,
      stage: lifecycle.current_stage,
      maturityScore: lifecycle.financial_maturity_score,
      recommendations: {
        goals: lifecycle.recommended_next_goals,
        products: lifecycle.recommended_financial_products
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getFinancialTrends(req, res) {
  const { userId, category = 'all' } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    let query = supabase
      .from('financial_trends')
      .select('*')
      .eq('user_id', userId);

    if (category !== 'all') {
      query = query.eq('metric_category', category);
    }

    const { data: trends, error } = await query.order('updated_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      trends,
      count: trends.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getAnomalies(req, res) {
  const { userId, severity = 'all', acknowledged = 'false' } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    let query = supabase
      .from('behavior_anomalies')
      .select('*')
      .eq('user_id', userId);

    if (severity !== 'all') {
      query = query.eq('severity_level', severity);
    }

    if (acknowledged === 'false') {
      query = query.eq('user_acknowledged', false);
    }

    const { data: anomalies, error } = await query.order('detected_date', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      anomalies,
      count: anomalies.length,
      unacknowledgedCount: anomalies.filter(a => !a.user_acknowledged).length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function acknowledgeAnomaly(req, res) {
  const { anomalyId } = req.params;
  const { explanation } = req.body;

  try {
    const { data: anomaly, error } = await supabase
      .from('behavior_anomalies')
      .update({
        user_acknowledged: true,
        acknowledged_date: new Date().toISOString(),
        explanation,
        is_explained: true
      })
      .eq('id', anomalyId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      anomaly
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getPredictiveInsights(req, res) {
  const { userId, type = 'all', shown = 'false' } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    let query = supabase
      .from('predictive_insights')
      .select('*')
      .eq('user_id', userId);

    if (type !== 'all') {
      query = query.eq('insight_type', type);
    }

    if (shown === 'false') {
      query = query.eq('shown_to_user', false);
    }

    const { data: insights, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      insights,
      count: insights.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getEvolutionJournal(req, res) {
  const { userId, limit = 20 } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const { data: entries, error } = await supabase
      .from('user_evolution_journal')
      .select('*')
      .eq('user_id', userId)
      .order('journal_date', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    return res.status(200).json({
      success: true,
      entries,
      count: entries.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function createJournalEntry(req, res) {
  const { userId, entryType, title, narrative, tags } = req.body;

  if (!userId || !entryType || !title || !narrative) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: entry, error } = await supabase
      .from('user_evolution_journal')
      .insert([{
        user_id: userId,
        journal_date: new Date().toISOString().split('T')[0],
        entry_type: entryType,
        title,
        narrative,
        tags: tags || []
      }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      entry
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  getBehaviorSnapshot,
  generateBehaviorSnapshot,
  getBehaviorHistory,
  getBehavioralIndicators,
  detectPatterns,
  getPatterns,
  getPatternDetails,
  updatePattern,
  getUserLifecycle,
  calculateLifecycle,
  getLifecycleRecommendations,
  getFinancialTrends,
  getAnomalies,
  acknowledgeAnomaly,
  getPredictiveInsights,
  getEvolutionJournal,
  createJournalEntry
};
