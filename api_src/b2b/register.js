/**
 * B2B Partner Registration API
 * POST /api/b2b/register
 *
 * Blueprint §19: Enables companies to register as ARTH.OS partners,
 * get API keys, and embed financial intelligence into their products.
 */

import { b2bPartnerEngine } from '../../src/lib/b2bPartnerEngine.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, email, companyUrl, tier, useCase, billingCycle } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'email'],
        received: { name: !!name, email: !!email },
      });
    }

    const result = b2bPartnerEngine.registerPartner({
      name,
      email,
      companyUrl: companyUrl || '',
      tier: tier || 'free',
      useCase: useCase || '',
      billingCycle: billingCycle || 'monthly',
    });

    // Log initial revenue event for the subscription
    if (result.partner.billing.monthlyPrice > 0) {
      b2bPartnerEngine.recordRevenue({
        partnerId: result.partner.id,
        amount: result.partner.billing.monthlyPrice,
        source: 'subscription_init',
      });
    }

    return res.status(201).json({
      success: true,
      partner: {
        id: result.partner.id,
        name: result.partner.name,
        email: result.partner.email,
        tier: result.partner.tier,
        tierName: result.partner.tierName,
        status: result.partner.status,
        features: result.partner.features,
        billing: {
          plan: result.partner.billing.monthlyPrice > 0 ? 'paid' : 'free',
          monthlyPrice: result.partner.billing.monthlyPrice,
          nextBillingDate: result.partner.billing.nextBillingDate,
        },
        createdAt: result.partner.createdAt,
      },
      apiKey: result.apiKey,
      message: `Welcome to ARTH.OS Partners! Your ${result.partner.tierName} plan is active. Use the API key in the Authorization header for all B2B requests.`,
      docs: 'https://docs.arthos.io/b2b',
    });
  } catch (err) {
    console.error('[B2B Register] Error:', err);
    return res.status(500).json({
      error: 'Registration failed',
      detail: err.message,
    });
  }
}
