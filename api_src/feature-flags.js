/**
 * Feature Flag Endpoint
 * GET /api/features?userId={userId}
 * GET /api/features/{featureName}?userId={userId}
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const userId = req.query.userId;
  const featureName = req.params?.featureName || null;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId query parameter' });
  }

  const flags = {
    big_reveal_v2: true,
    coaching_guided_mode: false,
    dashboard_redesign: true,
    offline_mode: false,
    aggressive_caching: false,
    banking_sync: true,
    transaction_classification: false,
    push_notifications: false,
    email_digest: true
  };

  const variants = {
    big_reveal_v2: 'control',
    coaching_guided_mode: 'control',
    dashboard_redesign: 'treatment',
    offline_mode: 'control'
  };

  if (featureName) {
    return res.status(200).json({
      enabled: Boolean(flags[featureName]),
      variant: variants[featureName] || 'control'
    });
  }

  return res.status(200).json({
    flags,
    variants
  });
}
