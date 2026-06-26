/**
 * B2B Embedded Finance Intelligence API
 * POST /api/b2b/intelligence
 *
 * Blueprint §19: The core "embedded finance intelligence layer" — partners
 * send user data and receive ARTH.OS behavioral finance analysis.
 *
 * Authentication: Bearer token (API key) in Authorization header
 * Rate limited per partner tier
 *
 * Returns: health score, risk profile, behaviour insights, cognitive biases,
 *          emotional triggers, forecast, recommendations
 */

import { b2bPartnerEngine, PARTNER_TIERS } from '../../src/lib/b2bPartnerEngine.js';
import { calculateFinancialHealthV2, componentMaximumsV2 } from '../../src/lib/scoring-v2.js';
import { buildRiskProfile } from '../services/cognitionEngine.js';
import { detectBiases } from '../../src/engines/biasEngine.js';
import { detectTriggers } from '../../src/engines/emotionalTriggerEngine.js';
import { generateAlerts } from '../../src/engines/riskOpportunityEngine.js';
import { opportunityForecast } from '../../src/engines/opportunityForecastEngine.js';
import { createDefaultProviderMarketplace } from '../../src/lib/providerMarketplace.js';

// Feature-level middleware
function checkFeature(partner, feature, res) {
  if (!b2bPartnerEngine.hasFeature(partner, feature)) {
    res.status(403).json({
      error: 'Feature not available on your plan',
      feature,
      upgradeUrl: '/api/b2b/register',
      currentTier: partner.tier,
      message: `The "${feature}" feature requires a ${feature === 'health_score' ? '' : 'higher '}plan tier.`,
    });
    return false;
  }
  return true;
}

function buildResponse(features, partnerId, userId, assessment, result, extra) {
  const response = {
    meta: {
      partnerId,
      userId,
      timestamp: new Date().toISOString(),
      version: '1.0',
    },
  };

  if (features.includes('health_score')) {
    response.healthScore = {
      score: result.healthScore,
      category: result.categoryBand?.label,
      summary: result.summary,
      components: {
        behaviour: { score: result.behaviourScore, max: componentMaximumsV2.behaviour },
        awareness: { score: result.awarenessScore, max: componentMaximumsV2.awareness },
        stability: { score: result.stabilityScore, max: componentMaximumsV2.stability },
      },
      personality: {
        type: result.personalityType,
        title: result.personalityReport?.title,
      },
      survival: {
        months: result.survivalMonthsRaw,
        crisisMonths: result.bareMinimumSurvivalMonthsRaw,
        perceivedMonths: result.perceivedSurvivalMonths ?? 0,
        awarenessGap: result.awarenessGap ?? 0,
      },
      blindSpot: {
        perceived: result.blindSpotPerceived,
        actual: result.blindSpotActual,
        gap: result.blindSpotGap,
      },
    };
  }

  if (features.includes('risk_profile') || features.includes('risk_profile_basic')) {
    const riskScore = buildRiskProfile(
      {
        ...assessment.profile,
        ...assessment.behaviour,
        ...assessment.awareness,
      },
      { scope: `${partnerId}:${userId}` }
    );
    response.riskProfile = {
      score: riskScore.riskScore,
      level: riskScore.riskLevel,
      calibration: riskScore.profile?.riskCalibration || null,
    };
  }

  if (features.includes('behaviour_insights')) {
    response.behaviourInsights = {
      personalityType: result.personalityType,
      strongestComponent: result.strongestComponent?.label,
      weakestComponent: result.lowestComponent?.label,
      recommendedAction: result.recommendedActionText,
      diagnosis: result.diagnosis || null,
    };
  }

  if (features.includes('cognitive_biases')) {
    const biases = detectBiases({
      ...assessment.profile,
      ...assessment.behaviour,
      ...assessment.awareness,
    });
    response.cognitiveBiases = {
      presentBias: biases.presentBias,
      lossAversion: biases.lossAversion,
      optimismBias: biases.optimismBias,
      anchoringBias: biases.anchoringBias,
      sunkCostBias: biases.sunkCostBias,
      biasLoad: Math.round(
        (biases.presentBias + biases.lossAversion + biases.optimismBias +
         biases.anchoringBias + biases.sunkCostBias) / 5
      ),
    };
  }

  if (features.includes('emotional_triggers')) {
    const triggers = detectTriggers({
      ...assessment.profile,
      ...assessment.behaviour,
    });
    response.emotionalTriggers = triggers;
  }

  if (features.includes('forecast_engine')) {
    response.forecast = {
      opportunity: extra.opportunity.action,
      opportunityBenefit: extra.opportunity.benefit,
    };
  }

  if (features.includes('marketplace_recommendations')) {
    const market = createDefaultProviderMarketplace();
    const recommendations = market.recommend({
      ...assessment.profile,
      ...assessment.behaviour,
      monthlyExpense: assessment.profile.monthlyExpense || assessment.profile.monthlySpending,
    });
    response.recommendations = recommendations.map((r) => ({
      id: r.id,
      name: r.name,
    }));
  }

  if (features.includes('basic_recommendations')) {
    const alerts = generateAlerts({
      ...assessment.profile,
      ...assessment.behaviour,
      survivalMonths: result.survivalMonthsRaw,
    });
    response.alerts = alerts;
  }

  return response;
}

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
    // ─── Auth ───
    const authHeader = req.headers.authorization || '';
    const apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const partner = b2bPartnerEngine.validateApiKey(apiKey);

    if (!partner) {
      return res.status(401).json({
        error: 'Invalid or missing API key',
        message: 'Provide a valid API key in the Authorization header (Bearer <key>)',
        docs: 'https://docs.arthos.io/b2b#authentication',
      });
    }

    // ─── Rate limit ───
    if (!b2bPartnerEngine.checkRateLimit(partner)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Your ${partner.tierName} plan allows ${PARTNER_TIERS[partner.tier].rateLimit.requestsPerMinute} requests/minute and ${PARTNER_TIERS[partner.tier].rateLimit.requestsPerMonth} requests/month.`,
        upgradeUrl: '/api/b2b/upgrade',
      });
    }

    // ─── Request body ───
    const { userId, profile, behaviour, awareness, habits } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // ─── Build assessment shape ───
    const assessment = {
      profile: profile || {},
      behaviour: behaviour || {},
      awareness: awareness || {},
      habits: habits || {},
    };

    // ─── Compute health score ───
    const result = calculateFinancialHealthV2(assessment);
    const opportunity = opportunityForecast(assessment.profile);

    // ─── Rate limit headers ───
    const rateLimitHeaders = b2bPartnerEngine.getRateLimitHeaders(partner);
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      res.setHeader(key, value);
    }

    // ─── Log usage ───
    b2bPartnerEngine.logUsage({
      partnerId: partner.id,
      endpoint: '/api/b2b/intelligence',
      userId,
      tier: partner.tier,
    });

    // ─── Build response based on partner features ───
    const response = buildResponse(
      partner.features,
      partner.id,
      userId,
      assessment,
      result,
      { opportunity }
    );

    // Add usage info (logUsage already incremented requestsThisMonth)
    response.usage = {
      requestsThisMonth: partner.metrics.requestsThisMonth,
      plan: partner.tierName,
      rateLimit: {
        perMinute: PARTNER_TIERS[partner.tier].rateLimit.requestsPerMinute,
        perMonth: PARTNER_TIERS[partner.tier].rateLimit.requestsPerMonth,
        remaining: parseInt(rateLimitHeaders['X-RateLimit-Remaining'] || '0', 10),
        monthlyRemaining: parseInt(rateLimitHeaders['X-RateLimit-Monthly-Remaining'] || '0', 10),
      },
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error('[B2B Intelligence] Error:', err);
    return res.status(500).json({
      error: 'Intelligence processing failed',
      detail: err.message,
    });
  }
}
