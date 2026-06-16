import { hasDatabaseConfig, query } from './dbClient.js';

/**
 * Background health endpoint for server diagnostics.
 *
 * GET /api/background/health
 */
export default async function handler(req, res) {
  const pathname = req.url?.split('?')[0] || '';
  const method = req.method?.toUpperCase();

  if (method !== 'GET' || pathname !== '/api/background/health') {
    return res.status(404).json({ error: 'Not found' });
  }

  const dbConfigured = hasDatabaseConfig();
  let dbConnected = false;
  let dbStatus = {
    configured: dbConfigured,
    connected: false,
    driver: null,
    details: null
  };

  if (dbConfigured) {
    try {
      await query('SELECT 1 AS ok', []);
      dbConnected = true;
      dbStatus = {
        configured: true,
        connected: true,
        driver: process.env.DATABASE_URL ? 'postgres' : 'supabase',
        details: null
      };
    } catch (error) {
      dbConnected = false;
      dbStatus.details = {
        error: error?.message || 'Unable to connect to configured database'
      };
    }
  }

  const diagnostics = {
    success: true,
    service: 'background-services',
    status: dbConfigured && !dbConnected ? 'degraded' : 'operational',
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      database: dbStatus
    },
    features: {
      durableJobProcessor: true,
      subscriptionsPersistence: true,
      notificationsWorkflow: true
    },
    timestamp: new Date().toISOString()
  };

  if (dbConnected) {
    try {
      const rows = await query(
        `SELECT status, COUNT(*) AS count FROM durable_jobs GROUP BY status`,
        []
      );
      diagnostics.durableJobs = Array.isArray(rows)
        ? rows.reduce((agg, row) => {
            agg[row.status] = Number(row.count || 0);
            return agg;
          }, {
            queued: 0,
            'in-flight': 0,
            failed: 0,
            complete: 0
          })
        : null;
    } catch (error) {
      diagnostics.durableJobs = {
        error: error?.message || 'Unable to read durable_jobs table'
      };
    }
  }

  return res.status(200).json(diagnostics);
}
