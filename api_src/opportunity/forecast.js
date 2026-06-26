import { forecastOpportunity } from '../services/opportunityEngine.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const forecast = forecastOpportunity(req.body || {});
  return res.status(200).json({
    ok: true,
    forecast
  });
}
