import './bankingWorkflow.js';
import { publishEvent } from './eventBus.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const result = await publishEvent(req.body || {});
    return res.status(202).json({
      ok: true,
      eventId: result.event.id,
      eventType: result.event.type,
      persistence: result.persistence,
      deliveries: result.deliveries
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || 'Invalid event'
    });
  }
}
