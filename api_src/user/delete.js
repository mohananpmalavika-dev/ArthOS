import { requireAuth } from '../auth/jwt.js';

export default async function handler(req, res) {
  // DELETE /api/user/delete
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { backup = false } = req.body || {};

  try {
    if (backup) {
      // In-production: create a backup/export before deletion. Here we just log.
      console.info(`[User Delete] Backup requested for ${user.id}`);
    }

    // TODO: implement actual deletion from database. For now, acknowledge.
    return res.status(200).json({ success: true, deletedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[User Delete] Error deleting user', user.id, err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
