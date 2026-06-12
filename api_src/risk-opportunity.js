import { generateAlerts } from '../src/engines/riskOpportunityEngine.js';
import { createDefaultProviderMarketplace } from '../src/lib/providerMarketplace.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const payload = req.body || {};
  const user = payload.user || {};
  const profile = payload.profile || {};

  const alerts = generateAlerts(user);
  const marketplace = createDefaultProviderMarketplace();
  const recommendations = marketplace.recommend(profile);

  return res.status(200).json({ alerts, recommendations });
}
