import { b2bPartnerEngine, PARTNER_TIERS } from '../../src/lib/b2bPartnerEngine.js';
import { calculateFinancialHealthV2, componentMaximumsV2 } from '../../src/lib/scoring-v2.js';
import { buildRiskProfile } from '../services/cognitionEngine.js';
import { detectBiases } from '../../src/engines/biasEngine.js';
import { detectTriggers } from '../../src/engines/emotionalTriggerEngine.js';
import { generateAlerts } from '../../src/engines/riskOpportunityEngine.js';
import { opportunityForecast } from '../../src/engines/opportunityForecastEngine.js';
import { calculateDefaultProbability } from '../../src/engines/mlDefaultPredictionEngine.js';
import { createDefaultProviderMarketplace } from '../../src/lib/providerMarketplace.js';
import { calculateLoanHealth } from '../services/loanHealthEngine.js';

function checkFeature(partner, feature, res) {
  if (!b2bPartnerEngine.hasFeature(partner, feature)) {
    res.status(403).json({
      error: 'Feature not available on your plan',
      feature,
      upgradeUrl: '/api/b2b/upgrade',
      currentTier: partner.tier,
      message: `The \"${feature}\" feature requires a higher plan tier.`,
    });
    return false;
  }
  return true;
}

function deriveLoanType(loanData) {
  const balance = Number(loanData.loanBalance || 0);
  if (balance >= 500000) return 'Mortgage';
  if (balance >= 200000) return 'Business Loan';
  if (balance >= 50000) return 'Personal Loan';
  return 'Micro Loan';
}

function buildResponse(features, partner, userId, assessment, result, extra) {
  const response = {
    meta: {
      partnerId: partner.id,
      userId,
      timestamp: new Date().toISOString(),
      version: '1.0',
      endpoint: '/api/b2b/borrower-intelligence'
    },
    loanSummary: {
      loanType: extra.loanType,
      loanBalance: extra.loanData.loanBalance || 0,
      emi: extra.loanData.emi || 0,
      tenureMonths: extra.loanData.tenureMonths || null,
      dpd: extra.loanData.dpd || 0,
      creditScore: extra.loanData.creditScore || 650,
      borrowerSince: extra.loanData.borrowerSince || null,
    },
    underWriting: {
      defaultProbability: extra.defaultRisk.probability,
      defaultRiskCategory: extra.defaultRisk.riskCategory,
      defaultRiskScore: extra.defaultRisk.riskScore,
      explanation: extra.defaultRisk.explanation,
      borrowerHealth: extra.loanHealth,
      recommendation:
        extra.defaultRisk.probability > 0.45 || extra.loanHealth.risk === 'High'
          ? 'Review borrower profile and payment plan'
          : 'Continue monitoring',
    }
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
    response.riskProfile = {
      score: extra.riskResult.riskScore,
      level: extra.riskResult.riskLevel,
      calibration: extra.riskResult.profile?.riskCalibration || null,
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
    response.cognitiveBiases = {
      presentBias: extra.biases.presentBias,
      lossAversion: extra.biases.lossAversion,
      optimismBias: extra.biases.optimismBias,
      anchoringBias: extra.biases.anchoringBias,
      sunkCostBias: extra.biases.sunkCostBias,
      biasLoad: Math.round(
        (extra.biases.presentBias + extra.biases.lossAversion + extra.biases.optimismBias +
         extra.biases.anchoringBias + extra.biases.sunkCostBias) / 5
      ),
    };
  }

  if (features.includes('emotional_triggers')) {
    response.emotionalTriggers = extra.triggers;
  }

  if (features.includes('forecast_engine')) {
    response.forecast = {
      opportunity: extra.forecast.action,
      opportunityBenefit: extra.forecast.benefit,
      generatedAt: extra.forecast.generatedAt,
    };
  }

  if (features.includes('basic_recommendations')) {
    response.alerts = generateAlerts({
      ...assessment.profile,
      ...assessment.behaviour,
      survivalMonths: result.survivalMonthsRaw,
    });
  }

  if (features.includes('marketplace_recommendations')) {
    const market = createDefaultProviderMarketplace();
    response.recommendations = market.recommend({
      ...assessment.profile,
      ...assessment.behaviour,
      monthlyExpense: assessment.profile.monthlyExpense || assessment.profile.monthlySpending,
    }).map((r) => ({ id: r.id, name: r.name }));
  }

  response.usage = {
    plan: partner.tierName || partnerId,
    rateLimit: {
      perMinute: PARTNER_TIERS[partner.tier].rateLimit.requestsPerMinute,
      perMonth: PARTNER_TIERS[partner.tier].rateLimit.requestsPerMonth,
      remaining: parseInt(extra.rateLimitHeaders['X-RateLimit-Remaining'] || '0', 10),
      monthlyRemaining: parseInt(extra.rateLimitHeaders['X-RateLimit-Monthly-Remaining'] || '0', 10),
    },
  };

  return response;
}

export default async function handler(req, res) {
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
    const authHeader = req.headers.authorization || '';
    const apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const partner = b2bPartnerEngine.validateApiKey(apiKey);

    if (!partner) {
      return res.status(401).json({
        error: 'Invalid or missing API key',
        message: 'Provide a valid API key in the Authorization header (Bearer <key>)',
      });
    }

    if (!b2bPartnerEngine.checkRateLimit(partner)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Your ${partner.tierName} plan allows ${PARTNER_TIERS[partner.tier].rateLimit.requestsPerMinute} requests/minute and ${PARTNER_TIERS[partner.tier].rateLimit.requestsPerMonth} requests/month.`,
        upgradeUrl: '/api/b2b/upgrade',
      });
    }

    const {
      userId,
      profile = {},
      behaviour = {},
      awareness = {},
      habits = {},
      loanData = {},
      history = {}
    } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const assessment = { profile, behaviour, awareness, habits };
    const result = calculateFinancialHealthV2(assessment);
    const riskResult = buildRiskProfile(
      { ...assessment.profile, ...assessment.behaviour, ...assessment.awareness },
      { scope: `${partner.id}:${userId}` }
    );
    const biases = detectBiases({ ...assessment.profile, ...assessment.behaviour, ...assessment.awareness });
    const triggers = detectTriggers({ ...assessment.profile, ...assessment.behaviour });
    const forecast = opportunityForecast(assessment.profile);

    const defaultRisk = calculateDefaultProbability(
      {
        creditScore: loanData.creditScore || 650,
        loanBalance: loanData.loanBalance || 0,
        dpd: loanData.dpd || 0,
        emi: loanData.emi || profile.emi || 0,
        monthlyIncome: profile.monthlyIncome || profile.salary || profile.income || 0,
        salaryDelay: profile.salaryDelay,
        salaryStability: profile.salaryStability,
        upiCashFlow: profile.upiCashFlow,
        behaviourChange: profile.behaviourChange,
        behaviourChangeScore: profile.behaviourChangeScore,
        stressLevel: profile.stressLevel,
      },
      history
    );

    const loanHealth = calculateLoanHealth({
      salaryDelay: profile.salaryDelay,
      gamblingExpense: profile.gamblingExpense,
      emergencySavings: profile.emergencySavings,
      emi: loanData.emi,
      stressLevel: profile.stressLevel,
      loanShopping: profile.loanShopping,
    });

    const rateLimitHeaders = b2bPartnerEngine.getRateLimitHeaders(partner);
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      res.setHeader(key, value);
    }

    b2bPartnerEngine.logUsage({
      partnerId: partner.id,
      endpoint: '/api/b2b/borrower-intelligence',
      userId,
      tier: partner.tier,
    });

    const response = buildResponse(
      partner.features,
      partner.id,
      userId,
      assessment,
      result,
      {
        loanData,
        defaultRisk,
        riskResult,
        biases,
        triggers,
        forecast,
        loanHealth,
        loanType: loanData.loanType || deriveLoanType(loanData),
        partnerTier: partner.tier,
        rateLimitHeaders,
      }
    );

    return res.status(200).json(response);
  } catch (err) {
    console.error('[B2B Borrower Intelligence] Error:', err);
    return res.status(500).json({
      error: 'Borrower intelligence processing failed',
      detail: err.message,
    });
  }
}
