/**
 * B2B API Key Validation Endpoint
 * POST /api/b2b/validate-key
 *
 * Blueprint §19: Allows partners to validate their API key and check
 * their plan status, rate limits, and available features.
 *
 * No authentication required — the API key is the auth itself.
 *
 * Returns: partner info, plan details, rate limit status, features
 */

import { b2bPartnerEngine } from '../../src/lib/b2bPartnerEngine.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract API key from Authorization header or query param
    const authHeader = req.headers.authorization || '';
    let apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    // Also allow GET with query param for simple curl testing
    if (!apiKey && req.method === 'GET') {
      apiKey = req.query?.apiKey || '';
    }

    if (!apiKey) {
      return res.status(400).json({
        valid: false,
        error: 'API key is required',
        usage: {
          header: 'Authorization: Bearer <your_api_key>',
          query: 'GET /api/b2b/validate-key?apiKey=<your_api_key>',
        },
      });
    }

    const partner = b2bPartnerEngine.validateApiKey(apiKey);

    if (!partner) {
      return res.status(401).json({
        valid: false,
        error: 'Invalid, expired, or suspended API key',
        message: 'Check your API key or generate a new one from your partner dashboard.',
      });
    }

    // Set rate limit headers
    const rateLimitHeaders = b2bPartnerEngine.getRateLimitHeaders(partner);
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      res.setHeader(key, value);
    }

    return res.status(200).json({
      valid: true,
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        tier: partner.tier,
        tierName: partner.tierName,
        status: partner.status,
        billingCycle: partner.billingCycle,
        createdAt: partner.createdAt,
      },
      plan: {
        name: partner.tierName,
        tier: partner.tier,
        features: partner.features,
        monthlyPrice: partner.billing.monthlyPrice,
        annualPrice: partner.billing.annualPrice,
        revenueSharePct: partner.billing.revenueSharePct,
        paymentStatus: partner.billing.paymentStatus,
        nextBillingDate: partner.billing.nextBillingDate,
      },
      rateLimit: {
        perMinute: parseInt(rateLimitHeaders['X-RateLimit-Limit'] || '0', 10),
        remaining: parseInt(rateLimitHeaders['X-RateLimit-Remaining'] || '0', 10),
        perMonth: parseInt(rateLimitHeaders['X-RateLimit-Monthly-Limit'] || '0', 10),
        monthlyRemaining: parseInt(rateLimitHeaders['X-RateLimit-Monthly-Remaining'] || '0', 10),
      },
      usage: {
        totalRequests: partner.metrics.totalRequests,
        activeUsersThisMonth: partner.metrics.activeUsersThisMonth.size,
        apiKeyCount: partner.apiKeyCount,
      },
      sdk: {
        serverSide: {
          npm: 'arthos-partner-sdk',
          docs: 'https://docs.arthos.io/b2b/server-sdk',
          example: `const sdk = new ArthOSPartnerSDK({ apiKey: '${apiKey.substring(0, 12)}...' });`,
        },
        clientSide: {
          import: "import { ArthOSSDK } from './lib/ArthOSSDK.js';",
          docs: 'https://docs.arthos.io/b2b/client-sdk',
        },
      },
    });
  } catch (err) {
    console.error('[B2B Validate Key] Error:', err);
    return res.status(500).json({
      valid: false,
      error: 'Key validation failed',
      detail: err.message,
    });
  }
}
