import { decisionLedger } from '../src/lib/decisionLedger.js';
import { hasDatabaseConfig, insertIntoTable, fetchDecisionsForUser } from './dbClient.js';
import { scoreDecision, decisionTrend } from '../src/engines/decisionIntelligence.js';

export default async function handler(req, res) {
  const method = req.method || 'GET';
  if (method === 'POST') {
    const { userId, decision } = req.body || {};
    if (!userId || !decision) return res.status(400).json({ error: 'Missing userId or decision' });

    const scoredDecision = scoreDecision(decision);
    decisionLedger.addDecision(userId, scoredDecision);

    if (hasDatabaseConfig()) {
      try {
        const row = { user_id: userId, decision: scoredDecision };
        const { error } = await insertIntoTable('decision_history', row);
        if (error) {
          console.warn('DB insert error', error);
        }
      } catch (err) {
        console.warn('DB persistence failed for decision:', err.message || err);
      }
    }

    return res.status(200).json({ ok: true, decision: scoredDecision });
  }

  if (method === 'GET') {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    let decisions = decisionLedger.getDecisions(userId);
    if (hasDatabaseConfig()) {
      try {
        const persisted = await fetchDecisionsForUser(userId);
        if (persisted.length > 0) {
          decisions = persisted;
        }
      } catch (err) {
        console.warn('DB read error for decision history:', err.message || err);
      }
    }

    return res.status(200).json({ decisions, trend: decisionTrend(decisions) });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end();
}
