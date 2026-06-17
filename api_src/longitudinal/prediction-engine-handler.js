/**
 * Prediction Engine API Handler
 * 
 * REST API endpoints for:
 * - Generating forecasts (30/90/180 days)
 * - Creating and running scenario simulations
 * - Accessing risk & opportunity forecasts
 * - Viewing forecast accuracy and confidence
 * ⚠️  ALL endpoints require valid JWT token in Authorization header
 */

import PredictionEngine from './prediction-engine.js';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../auth/jwt.js';

function isPlaceholderValue(value) {
  if (!value) return true;
  const lower = String(value).trim().toLowerCase();
  return lower.includes('your-project') || lower.includes('your-service-role-key') || lower.includes('xxx') || lower.includes('replace') || lower.includes('example');
}

let _supabaseClient = null;
function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || isPlaceholderValue(url) || isPlaceholderValue(key)) {
    throw new Error('Missing or invalid Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to valid values.');
  }
  _supabaseClient = createClient(url, key);
  return _supabaseClient;
}

const supabase = new Proxy({}, {
  get(_, prop) {
    const client = getSupabaseClient();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

function getSupabaseConfigError() {
  try {
    getSupabaseClient();
    return null;
  } catch (err) {
    return err;
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const configError = getSupabaseConfigError();
  if (configError) {
    return res.status(503).json({
      status: 'error',
      error: 'Prediction service unavailable',
      details: configError.message
    });
  }

  // ─── Enforce JWT authentication ───
  const user = await requireAuth(req, res);
  if (!user) return; // requireAuth already sent error response
  const userId = user.id;

  const { pathname, query } = new URL(`http://${req.headers.host}${req.url}`);

  try {
    // ============= FORECAST ENDPOINTS =============

    if (pathname === '/api/prediction/forecasts' && req.method === 'POST') {
      // Generate new forecasts (30/90/180 days)
      const result = await PredictionEngine.generateFinancialForecast(userId);
      return res.status(201).json({
        success: true,
        ...result
      });
    }

    if (pathname === '/api/prediction/forecasts' && req.method === 'GET') {
      // Get all forecasts for user
      const { data: forecasts, error } = await supabase
        .from('financial_forecasts')
        .select('*')
        .eq('user_id', userId)
        .order('forecast_period_days', { ascending: true });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        forecasts: forecasts || [],
        count: forecasts?.length || 0
      });
    }

    if (pathname.match(/^\/api\/prediction\/forecasts\/(\d+)$/) && req.method === 'GET') {
      // Get forecast by period (30, 90, or 180 days)
      const period = parseInt(pathname.split('/').pop());
      const { data: forecast, error } = await supabase
        .from('financial_forecasts')
        .select('*')
        .eq('user_id', userId)
        .eq('forecast_period_days', period)
        .order('forecast_generated_date', { ascending: false })
        .limit(1);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        forecast: forecast?.[0] || null
      });
    }

    // ============= SCENARIO SIMULATION ENDPOINTS =============

    if (pathname === '/api/prediction/scenarios' && req.method === 'POST') {
      // Create and run scenario simulation
      const scenario = req.body;

      if (!scenario.scenarioName || !scenario.modifiedParameter || !scenario.parameterChangeValue) {
        return res.status(400).json({
          success: false,
          error: 'Missing required scenario parameters'
        });
      }

      const result = await PredictionEngine.simulateScenario(userId, scenario);
      return res.status(201).json({
        success: true,
        scenario: result
      });
    }

    if (pathname === '/api/prediction/scenarios' && req.method === 'GET') {
      // Get all scenarios for user
      const { data: scenarios, error } = await supabase
        .from('scenario_simulations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        scenarios: scenarios || [],
        count: scenarios?.length || 0
      });
    }

    if (pathname.match(/^\/api\/prediction\/scenarios\/[a-f0-9-]+$/) && req.method === 'GET') {
      // Get specific scenario
      const scenarioId = pathname.split('/').pop();
      const { data: scenario, error } = await supabase
        .from('scenario_simulations')
        .select('*')
        .eq('id', scenarioId)
        .eq('user_id', userId)
        .limit(1);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        scenario: scenario?.[0] || null
      });
    }

    if (pathname.match(/^\/api\/prediction\/scenarios\/[a-f0-9-]+$/) && req.method === 'PUT') {
      // Update scenario status (e.g., mark as adopted)
      const scenarioId = pathname.split('/').pop();
      const updates = req.body;

      const { error } = await supabase
        .from('scenario_simulations')
        .update(updates)
        .eq('id', scenarioId)
        .eq('user_id', userId);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Scenario updated'
      });
    }

    // ============= RISK FORECAST ENDPOINTS =============

    if (pathname === '/api/prediction/risks' && req.method === 'GET') {
      // Get all identified risks
      const { data: risks, error } = await supabase
        .from('risk_forecasts')
        .select('*')
        .eq('user_id', userId)
        .order('days_until_risk', { ascending: true });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        risks: risks || [],
        count: risks?.length || 0,
        criticalRisks: risks?.filter(r => r.risk_category === 'critical').length || 0
      });
    }

    if (pathname === '/api/prediction/risks' && req.method === 'POST') {
      // Mark risk as acknowledged
      const { riskId } = req.body;

      const { error } = await supabase
        .from('risk_forecasts')
        .update({
          user_acknowledged: true,
          acknowledgment_date: new Date().toISOString()
        })
        .eq('id', riskId)
        .eq('user_id', userId);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Risk acknowledged'
      });
    }

    // ============= OPPORTUNITY FORECAST ENDPOINTS =============

    if (pathname === '/api/prediction/opportunities' && req.method === 'GET') {
      // Get all identified opportunities
      const { data: opportunities, error } = await supabase
        .from('opportunity_forecasts')
        .select('*')
        .eq('user_id', userId)
        .order('days_until_opportunity', { ascending: true });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        opportunities: opportunities || [],
        count: opportunities?.length || 0,
        highImpactCount: opportunities?.filter(o => o.opportunity_category === 'high').length || 0
      });
    }

    if (pathname === '/api/prediction/opportunities' && req.method === 'POST') {
      // Mark opportunity as interested
      const { opportunityId } = req.body;

      const { error } = await supabase
        .from('opportunity_forecasts')
        .update({
          user_interested: true,
          interest_recorded_date: new Date().toISOString()
        })
        .eq('id', opportunityId)
        .eq('user_id', userId);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Opportunity recorded'
      });
    }

    // ============= FORECAST SUMMARY ENDPOINT =============

    if (pathname === '/api/prediction/summary' && req.method === 'GET') {
      // Get comprehensive prediction summary
      const summary = await PredictionEngine.getForecastSummary(userId);

      return res.status(200).json({
        success: true,
        ...summary,
        generated: new Date().toISOString()
      });
    }

    // ============= FORECAST ACCURACY ENDPOINT =============

    if (pathname === '/api/prediction/accuracy' && req.method === 'GET') {
      // Get forecast accuracy metrics
      const { data: accuracy, error } = await supabase
        .from('forecast_accuracy_log')
        .select('*')
        .eq('user_id', userId)
        .order('measurement_date', { ascending: false });

      if (error) throw error;

      // Calculate accuracy statistics
      const stats = {
        totalForecasts: accuracy?.length || 0,
        meanAbsoluteError: accuracy?.length ? 
          accuracy.reduce((sum, a) => sum + Math.abs(a.absolute_error), 0) / accuracy.length : 0,
        meanAbsolutePercentageError: accuracy?.length ?
          accuracy.reduce((sum, a) => sum + Math.abs(a.percentage_error), 0) / accuracy.length : 0,
        accurateForecasts: accuracy?.filter(a => a.was_accurate).length || 0,
        accuracyRate: accuracy?.length ? 
          (accuracy.filter(a => a.was_accurate).length / accuracy.length * 100).toFixed(1) : 0
      };

      return res.status(200).json({
        success: true,
        accuracy: accuracy || [],
        statistics: stats
      });
    }

    // ============= HEALTH CHECK =============

    if (pathname === '/api/prediction/health' && req.method === 'GET') {
      return res.status(200).json({
        success: true,
        service: 'prediction-engine',
        status: 'operational',
        capabilities: [
          'financial_state_forecasting',
          'scenario_simulation',
          'risk_forecasting',
          'opportunity_identification',
          'forecast_accuracy_tracking'
        ]
      });
    }

    // ============= 404 =============

    return res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    });

  } catch (error) {
    console.error('Prediction engine error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      service: 'prediction-engine'
    });
  }
}
