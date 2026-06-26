import { decisionLedger } from '../../../src/lib/decisionLedger.js';
import { decisionTrend } from '../../services/decisionIntelligence.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const userId = req.query?.userId || req.params?.userId || (() => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const parts = url.pathname.split('/').filter(Boolean);
      return parts[parts.length - 2];
    } catch {
      return undefined;
    }
  })();
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const decisions = decisionLedger.getDecisions(userId);
  const trend = decisionTrend(decisions);
  return res.status(200).json({ healthScore: trend.currentScore, trend: trend.trend, decisions: decisions.length });
}
