import { requireAuth } from '../auth/jwt.js';

export default async function handler(req, res) {
  // POST /api/user/export
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return; // requireAuth already sent response

  const { format = 'json' } = req.body || {};

  // Minimal export payload — expand later to include assessments, banking, insights
  const data = {
    personal: {
      id: user.id,
      email: user.email || null,
      exportedAt: new Date().toISOString()
    },
    assessments: [],
    banking: [],
    insights: []
  };

  if (format === 'csv') {
    const csv = `ID,Email,ExportedAt\n${data.personal.id},${data.personal.email || ''},${data.personal.exportedAt}\n`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="arthos-export-${user.id}.csv"`);
    return res.end(csv);
  }

  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(data, null, 2));
}
