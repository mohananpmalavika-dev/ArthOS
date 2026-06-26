import './bankingWorkflow.js';
import { getRecentEvents, getSubscriberSummary } from './eventBus.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const limit = Math.min(Number(req.query?.limit || 50), 100);

  return res.status(200).json({
    ok: true,
    events: getRecentEvents({
      type: req.query?.type,
      userId: req.query?.userId,
      limit
    }),
    subscribers: getSubscriberSummary()
  });
}
