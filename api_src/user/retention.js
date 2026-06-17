import { requireAuth } from '../auth/jwt.js';

export default async function handler(req, res) {
  // PATCH /api/user/retention/:categoryId
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { categoryId } = req.params || {};
  if (!categoryId) return res.status(400).json({ error: 'categoryId path parameter required' });

  const { retention } = req.body || {};
  if (!retention) return res.status(400).json({ error: 'retention value required in body' });

  try {
    // TODO: persist retention policy to user settings table. For now, log and acknowledge.
    console.info(`[User Retention] user=${user.id} category=${categoryId} retention=${retention}`);
    return res.status(200).json({ success: true, categoryId, retention });
  } catch (err) {
    console.error('[User Retention] Error updating retention', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
