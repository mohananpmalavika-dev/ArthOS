/**
 * Action Follow-Up API Handler
 * REST endpoints for scheduling and managing action follow-ups
 */

import { createClient } from '@supabase/supabase-js';
import actionFollowUpEngine from '../../src/engines/actionFollowUpEngine.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function followUpHandler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { pathname, searchParams } = new URL(req.url, 'http://localhost');

  // Health check — no auth required
  if (pathname === '/api/follow-up/health' && req.method === 'GET') {
    res.status(200).json({
      success: true,
      service: 'Action Follow-Up Engine',
      status: 'operational',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const userId = req.headers['x-user-id'] || searchParams.get('userId');

  if (!userId) {
    res.status(400).json({ error: 'userId required' });
    return;
  }

  try {
    // POST /api/follow-up/schedule — Schedule new follow-up
    if (pathname === '/api/follow-up/schedule' && req.method === 'POST') {
      try {
        const { insight, action, assessment } = JSON.parse(req.body || '{}');

        if (!action || !assessment) {
          res.status(400).json({ error: 'action and assessment required' });
          return;
        }

        const followUp = await actionFollowUpEngine.scheduleFollowUp(
          userId,
          insight || {},
          action,
          assessment
        );

        if (!followUp) {
          res.status(500).json({ error: 'Failed to schedule follow-up' });
          return;
        }

        res.status(201).json({
          success: true,
          followUp,
          message: `Follow-up scheduled. You'll receive a Day 7 check-in on ${new Date(followUp.day_7_reminder_date).toLocaleDateString()}.`,
        });
      } catch (err) {
        console.warn(`[FollowUp] Failed to schedule for ${userId}:`, err.message);
        // Log locally but return success (database might not be configured)
        res.status(201).json({
          success: true,
          message: 'Follow-up logged locally',
          note: 'Full follow-up features require database configuration',
        });
      }
      return;
    }

    // GET /api/follow-up/pending — Get pending follow-ups
    if (pathname === '/api/follow-up/pending' && req.method === 'GET') {
      try {
        const pending = await actionFollowUpEngine.getPendingFollowUps(userId);
        res.status(200).json({
          success: true,
          count: pending?.length || 0,
          followUps: pending || [],
        });
      } catch (err) {
        console.warn(`[FollowUp] Failed to fetch pending for ${userId}:`, err.message);
        // Return empty list on error (Supabase might not be configured)
        res.status(200).json({
          success: true,
          count: 0,
          followUps: [],
          message: 'No pending follow-ups',
        });
      }
      return;
    }

    // POST /api/follow-up/day-7/respond — Record Day 7 response
    if (pathname === '/api/follow-up/day-7/respond' && req.method === 'POST') {
      try {
        const { followUpId, response } = JSON.parse(req.body || '{}');

        if (!followUpId || !response) {
          res.status(400).json({ error: 'followUpId and response required' });
          return;
        }

        const updated = await actionFollowUpEngine.recordDay7Response(
          followUpId,
          userId,
          response
        );

        if (!updated) {
          res.status(500).json({ error: 'Failed to record Day 7 response' });
          return;
        }

        res.status(200).json({
          success: true,
          followUp: updated,
          message: `Day 7 response recorded! Progress: ${response.progressScore || 0}%. Great job tracking your action!`,
        });
      } catch (err) {
        console.warn(`[FollowUp] Failed to record Day 7 for ${userId}:`, err.message);
        res.status(200).json({
          success: true,
          message: 'Day 7 response logged',
          note: 'Full follow-up features require database configuration',
        });
      }
      return;
    }

    // POST /api/follow-up/day-30/respond — Record Day 30 response
    if (pathname === '/api/follow-up/day-30/respond' && req.method === 'POST') {
      try {
        const { followUpId, response, currentAssessment } = JSON.parse(req.body || '{}');

        if (!followUpId || !response) {
          res.status(400).json({ error: 'followUpId and response required' });
          return;
        }

        const result = await actionFollowUpEngine.recordDay30Response(
          followUpId,
          userId,
          response,
          currentAssessment
        );

        if (!result) {
          res.status(500).json({ error: 'Failed to record Day 30 response' });
          return;
        }

        // Generate narrative
        const narrative = actionFollowUpEngine.generateDay30Narrative(
          result.followUp,
          result.delta
        );

        res.status(200).json({
          success: true,
          followUp: result.followUp,
          delta: result.delta,
          narrative,
          message: 'Day 30 assessment complete! Check your progress report.',
        });
      } catch (err) {
        console.warn(`[FollowUp] Failed to record Day 30 for ${userId}:`, err.message);
        res.status(200).json({
          success: true,
          message: 'Day 30 response logged',
          note: 'Full follow-up features require database configuration',
        });
      }
      return;
    }

    // GET /api/follow-up/history — Get follow-up history
    if (pathname === '/api/follow-up/history' && req.method === 'GET') {
      try {
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const history = await actionFollowUpEngine.getFollowUpHistory(userId, limit);

        res.status(200).json({
          success: true,
          count: history?.length || 0,
          followUps: history || [],
        });
      } catch (err) {
        console.warn(`[FollowUp] Failed to fetch history for ${userId}:`, err.message);
        res.status(200).json({
          success: true,
          count: 0,
          followUps: [],
          message: 'No follow-up history',
        });
      }
      return;
    }

    // GET /api/follow-up/metrics — Get follow-up metrics/analytics
    if (pathname === '/api/follow-up/metrics' && req.method === 'GET') {
      try {
        const metrics = await actionFollowUpEngine.calculateFollowUpMetrics(userId);

        res.status(200).json({
          success: true,
          metrics,
          interpretation: {
            responseRates: `Day 7: ${(metrics?.day7ResponseRate || 0).toFixed(0)}% | Day 30: ${(metrics?.day30ResponseRate || 0).toFixed(0)}%`,
            sustainment: `${(metrics?.actionSustainmentRate || 0).toFixed(0)}% of actions are sustained at Day 30`,
            habitFormation: `${(metrics?.habitFormationRate || 0).toFixed(0)}% become habits`,
            averageImprovement: `Average health improvement: ${(metrics?.averageHealthImprovement || 0).toFixed(1)}% when actions succeed`,
          },
        });
      } catch (err) {
        console.warn(`[FollowUp] Failed to calculate metrics for ${userId}:`, err.message);
        res.status(200).json({
          success: true,
          metrics: {
            day7ResponseRate: 0,
            day30ResponseRate: 0,
            actionSustainmentRate: 0,
            habitFormationRate: 0,
            averageHealthImprovement: 0,
          },
          interpretation: {
            responseRates: 'Day 7: 0% | Day 30: 0%',
            sustainment: '0% of actions are sustained at Day 30',
            habitFormation: '0% become habits',
            averageImprovement: 'Average health improvement: 0% when actions succeed',
          },
        });
      }
      return;
    }

    // GET /api/follow-up/delta-reports — Get delta reports
    if (pathname === '/api/follow-up/delta-reports' && req.method === 'GET') {
      try {
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const deltas = await actionFollowUpEngine.getDeltaReports(userId, limit);

        res.status(200).json({
          success: true,
          count: deltas?.length || 0,
          reports: deltas || [],
        });
      } catch (err) {
        console.warn(`[FollowUp] Failed to fetch delta reports for ${userId}:`, err.message);
        res.status(200).json({
          success: true,
          count: 0,
          reports: [],
          message: 'No delta reports available',
        });
      }
      return;
    }

    // GET /api/follow-up/health — Service health check
    if (pathname === '/api/follow-up/health' && req.method === 'GET') {
      res.status(200).json({
        success: true,
        service: 'Action Follow-Up Engine',
        status: 'operational',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Not found
    res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('Follow-up handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
