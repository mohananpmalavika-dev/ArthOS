/**
 * B2B Webhook Management API
 *
 * GET  /api/b2b/webhooks?partnerId=xxx   — List webhooks for a partner
 * POST /api/b2b/webhooks                  — Register a new webhook
 * DELETE /api/b2b/webhooks                — Delete a webhook
 *
 * Blueprint §19: Allows partners to receive real-time events about
 * usage, billing, and intelligence updates.
 */

import { b2bPartnerEngine, WEBHOOK_EVENTS } from '../../src/lib/b2bPartnerEngine.js';

const ADMIN_API_KEY = process.env.ARTHOS_ADMIN_KEY || 'arth_admin_key_change_in_prod';

function requireAuth(req, res) {
  const authHeader = req.headers.authorization || '';
  const suppliedKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (suppliedKey === ADMIN_API_KEY) {
    return { role: 'admin' };
  }

  const partner = b2bPartnerEngine.validateApiKey(suppliedKey);
  if (partner) {
    return { role: 'partner', partnerId: partner.id };
  }

  res.status(401).json({ error: 'Unauthorized. Valid API key required.' });
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const auth = requireAuth(req, res);
  if (!auth) return;

  try {
    // ─── GET: List webhooks ───
    if (req.method === 'GET') {
      const partnerId = req.query?.partnerId || (auth.role === 'partner' ? auth.partnerId : null);

      if (!partnerId) {
        return res.status(400).json({ error: 'partnerId is required' });
      }

      // Admin can read any partner's webhooks; partners can only read their own
      if (auth.role === 'partner' && auth.partnerId !== partnerId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const webhooks = b2bPartnerEngine.getWebhooks(partnerId);
      return res.status(200).json({
        partnerId,
        webhooks: webhooks.map((w) => ({
          url: w.url,
          events: w.events,
          active: w.active,
          createdAt: w.createdAt,
          lastDelivery: w.lastDelivery,
          failureCount: w.failureCount,
        })),
        availableEvents: Object.values(WEBHOOK_EVENTS),
      });
    }

    // ─── POST: Register webhook ───
    if (req.method === 'POST') {
      const { partnerId: bodyPartnerId, url, events } = req.body || {};
      const partnerId = bodyPartnerId || (auth.role === 'partner' ? auth.partnerId : null);

      if (!partnerId) {
        return res.status(400).json({ error: 'partnerId is required' });
      }

      if (auth.role === 'partner' && auth.partnerId !== partnerId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      if (!url) {
        return res.status(400).json({ error: 'url is required' });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch (error) {
        console.warn('[webhooks] Invalid webhook URL provided:', {
          url: url?.substring(0, 50) + '...',
          error: error?.message,
        });
        return res.status(400).json({ error: 'Invalid webhook URL format' });
      }

      const webhookEvents = events || Object.values(WEBHOOK_EVENTS);

      // Validate event types
      const validEvents = Object.values(WEBHOOK_EVENTS);
      for (const event of webhookEvents) {
        if (event !== '*' && !validEvents.includes(event)) {
          return res.status(400).json({
            error: `Invalid event type: "${event}". Valid events: ${validEvents.join(', ')}, or "*" for all.`,
          });
        }
      }

      const registration = b2bPartnerEngine.registerWebhook(partnerId, url, webhookEvents);

      return res.status(201).json({
        success: true,
        webhook: {
          url: registration.url,
          events: registration.events,
          active: registration.active,
          createdAt: registration.createdAt,
        },
        message: `Webhook registered. You will receive ${registration.events.length} event type(s) at ${url}.`,
      });
    }

    // ─── DELETE: Remove webhook ───
    if (req.method === 'DELETE') {
      const { partnerId: bodyPartnerId, url } = req.body || {};
      const partnerId = bodyPartnerId || (auth.role === 'partner' ? auth.partnerId : null);

      if (!partnerId) {
        return res.status(400).json({ error: 'partnerId is required' });
      }

      if (auth.role === 'partner' && auth.partnerId !== partnerId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      if (!url) {
        return res.status(400).json({ error: 'url is required' });
      }

      b2bPartnerEngine.deleteWebhook(partnerId, url);

      return res.status(200).json({
        success: true,
        message: `Webhook ${url} deleted successfully.`,
      });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[B2B Webhooks] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
