import { buildRiskProfile } from './services/cognitionEngine.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const user = req.body?.user;
  if (!user) return res.status(400).json({ error: 'Missing user payload' });

  const score = buildRiskProfile(user, { scope: user.id || user.userId || 'anonymous' });
  return res.status(200).json({
    riskScore: score.riskScore,
    riskLevel: score.riskLevel,
    profile: score.profile
  });
}
