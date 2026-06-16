/**
 * B2B Admin & Analytics API (JWT + Role-Based Auth)
 * GET /api/b2b/admin — Get all partner analytics (requires admin role)
 * GET /api/b2b/admin?partnerId=xxx — Get specific partner analytics
 * POST /api/b2b/admin/change-tier — Change a partner's tier
 * POST /api/b2b/admin/suspend — Suspend a partner
 * POST /api/b2b/admin/reactivate — Reactivate a partner
 *
 * Blueprint §19: Full partner management dashboard backend.
 * ⚠️  ALL endpoints now require valid JWT with admin role.
 */

import { b2bPartnerEngine, PARTNER_TIERS } from '../../src/lib/b2bPartnerEngine.js';
import { requireAdminRole } from '../auth/jwt.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ─── Enforce admin role for ALL endpoints ───
  const admin = await requireAdminRole(req, res);
  if (!admin) return; // requireAdminRole already sent error response

  try {
    // ─── POST sub-routes ───
    if (req.method === 'POST') {
      const { action, partnerId, newTier } = req.body || {};
      const url = req.url || '';
      const subroute = url.split('?')[0].replace(/\/+$/, '').split('/').pop();

      switch (subroute) {
        case 'change-tier': {
          if (!partnerId || !newTier) {
            return res.status(400).json({ error: 'partnerId and newTier required' });
          }
          const updated = b2bPartnerEngine.changeTier(partnerId, newTier);
          return res.status(200).json({ success: true, partner: updated });
        }
        case 'suspend': {
          if (!partnerId) {
            return res.status(400).json({ error: 'partnerId required' });
          }
          const suspended = b2bPartnerEngine.suspendPartner(partnerId);
          return res.status(200).json({ success: true, partner: suspended });
        }
        case 'reactivate': {
          if (!partnerId) {
            return res.status(400).json({ error: 'partnerId required' });
          }
          const reactivated = b2bPartnerEngine.reactivatePartner(partnerId);
          return res.status(200).json({ success: true, partner: reactivated });
        }
        case 'rotate-key': {
          if (!partnerId) {
            return res.status(400).json({ error: 'partnerId required' });
          }
          const result = b2bPartnerEngine.rotateApiKey(partnerId);
          return res.status(200).json({ success: true, ...result });
        }
        case 'record-revenue': {
          const { partnerId: revPartnerId, amount, source } = req.body || {};
          if (!revPartnerId || amount === undefined) {
            return res.status(400).json({ error: 'partnerId and amount required' });
          }
          b2bPartnerEngine.recordRevenue({ partnerId: revPartnerId, amount, source });
          return res.status(200).json({ success: true });
        }
        default:
          return res.status(404).json({ error: `Unknown admin action: ${subroute}` });
      }
    }

    // ─── GET — analytics ───
    if (req.method === 'GET') {
      const { partnerId } = req.query || {};

      if (partnerId) {
        const analytics = b2bPartnerEngine.getPartnerAnalytics(partnerId);
        return res.status(200).json(analytics);
      }

      const allAnalytics = b2bPartnerEngine.getAllPartnerAnalytics();
      return res.status(200).json(allAnalytics);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[B2B Admin] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
