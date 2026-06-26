/**
 * ML Churn Prediction Engine
 * Identifies users at risk of abandonment or disengagement
 * 
 * Churn indicators:
 * - Declining engagement (fewer assessments)
 * - No improvement in scores over time
 * - High stress combined with low runway
 * - Pattern of crisis decisions
 * - User session inactivity
 */

import {
  extractFeatures,
  sigmoid,
} from './mlUtilities.js';
import { buildModelLineage } from './modelRegistry.js';

function churnGovernance(userHistory = [], assessmentHistory = []) {
  return buildModelLineage({
    modelType: 'churn',
    dataPoints:
      (Array.isArray(userHistory) ? userHistory.length : 0) +
      (Array.isArray(assessmentHistory) ? assessmentHistory.length : 0)
  });
}

/**
 * Calculate user engagement trajectory
 */
export function calculateEngagementTrajectory(userHistory) {
  if (!userHistory || userHistory.length < 2) {
    return {
      trend: 'insufficient_data',
      trajectory: 'unknown',
      engagementScore: 0,
    };
  }

  // Sort by date descending (most recent first)
  const sorted = [...userHistory].sort((a, b) =>
    new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
  );

  const recentCount = sorted.slice(0, 3).length;
  const olderCount = sorted.slice(3, 6).length;

  const engagementChange = ((recentCount - olderCount) / (olderCount || 1)) * 100;

  let trend = 'stable';
  if (engagementChange > 20) trend = 'increasing';
  else if (engagementChange < -20) trend = 'decreasing';

  return {
    trend,
    trajectory: engagementChange,
    recentActivityScore: (recentCount / 3) * 100,
    engagementScore: Math.max(0, Math.min(100, 50 + engagementChange)),
    daysActive: new Set(sorted.map(h => new Date(h.timestamp).toDateString())).size,
  };
}

/**
 * Calculate improvement velocity (positive = improving scores)
 */
export function calculateImprovementVelocity(assessmentHistory) {
  if (!assessmentHistory || assessmentHistory.length < 2) {
    return {
      healthScoreVelocity: 0,
      awarenessTrend: 'unknown',
      behaviourTrend: 'unknown',
      stabilityTrend: 'unknown',
      overallTrend: 'new_user',
    };
  }

  const sorted = [...assessmentHistory].sort((a, b) =>
    new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const daysElapsed = Math.max(1, (new Date(last.timestamp) - new Date(first.timestamp)) / (1000 * 60 * 60 * 24));

  const healthScoreDelta = (last.healthScore || 0) - (first.healthScore || 0);
  const awarenessDelta = (last.awarenessScore || 0) - (first.awarenessScore || 0);
  const behaviourDelta = (last.behaviourScore || 0) - (first.behaviourScore || 0);
  const stabilityDelta = (last.stabilityScore || 0) - (first.stabilityScore || 0);

  return {
    healthScoreVelocity: (healthScoreDelta / daysElapsed) * 30, // Points per month
    awarenessVelocity: (awarenessDelta / daysElapsed) * 30,
    behaviourVelocity: (behaviourDelta / daysElapsed) * 30,
    stabilityVelocity: (stabilityDelta / daysElapsed) * 30,
    awarenessTrend: awarenessDelta > 2 ? 'improving' : awarenessDelta < -2 ? 'declining' : 'stable',
    behaviourTrend: behaviourDelta > 2 ? 'improving' : behaviourDelta < -2 ? 'declining' : 'stable',
    stabilityTrend: stabilityDelta > 1 ? 'improving' : stabilityDelta < -1 ? 'declining' : 'stable',
    overallTrend: healthScoreDelta > 5 ? 'positive' : healthScoreDelta < -5 ? 'negative' : 'stagnant',
  };
}

/**
 * Calculate stress indicators
 */
export function calculateStressIndicators(result, recentHistory = []) {
  const runwayMonths = result?.runwayMonths || 0;
  const riskScore = result?.riskScore || 0;
  const behaviourScore = result?.behaviourScore || 0;
  const healthScore = result?.healthScore || 0;

  let stressLevel = 0;

  // Runway stress (< 3 months is critical)
  if (runwayMonths < 1) stressLevel += 40;
  else if (runwayMonths < 3) stressLevel += 25;
  else if (runwayMonths < 6) stressLevel += 10;

  // Risk score stress
  if (riskScore > 70) stressLevel += 20;
  else if (riskScore > 50) stressLevel += 10;

  // Behavior degradation
  if (behaviourScore < 15) stressLevel += 15;

  // Score declining pattern
  if (recentHistory.length >= 2) {
    const avgPrevScore = recentHistory.slice(0, -1).reduce((s, h) => s + (h.healthScore || 0), 0) / (recentHistory.length - 1);
    const scoreDrop = avgPrevScore - healthScore;
    if (scoreDrop > 15) stressLevel += 20;
  }

  return {
    stressLevel: Math.min(100, stressLevel),
    stressCategory: stressLevel > 60 ? 'Critical' : stressLevel > 40 ? 'High' : stressLevel > 20 ? 'Moderate' : 'Low',
    riskFactors: [
      runwayMonths < 3 && 'Low runway (crisis mode)',
      riskScore > 70 && 'Very high risk score',
      behaviourScore < 15 && 'Poor behavioral control',
      healthScore < 30 && 'Low overall financial health',
    ].filter(Boolean),
  };
}

/**
 * Calculate churn probability (0-1)
 */
export function calculateChurnProbability(assessment, result, userHistory = [], assessmentHistory = []) {
  const engagement = calculateEngagementTrajectory(userHistory);
  const improvement = calculateImprovementVelocity(assessmentHistory);
  const stress = calculateStressIndicators(result, assessmentHistory);

  let churnScore = 0;

  // Engagement decline (highest weight)
  if (engagement.trend === 'decreasing') {
    churnScore += 0.35;
  } else if (engagement.trend === 'stable') {
    churnScore += 0.1;
  }

  // No improvement (high weight)
  if (improvement.overallTrend === 'stagnant') {
    churnScore += 0.25;
  } else if (improvement.overallTrend === 'negative') {
    churnScore += 0.4;
  }

  // High stress
  if (stress.stressCategory === 'Critical') {
    churnScore += 0.2;
  } else if (stress.stressCategory === 'High') {
    churnScore += 0.1;
  }

  // Recent inactivity
  if (userHistory.length > 0) {
    const lastActivity = new Date(userHistory[userHistory.length - 1].timestamp);
    const daysSinceActivity = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);
    
    if (daysSinceActivity > 30) churnScore += 0.2;
    else if (daysSinceActivity > 14) churnScore += 0.1;
  }

  // Cap at 1
  const probability = Math.min(1, churnScore);

  return {
    probability: probability,
    churnRisk: probability > 0.7 ? 'Critical' : probability > 0.5 ? 'High' : probability > 0.3 ? 'Moderate' : 'Low',
    riskScore: Math.round(probability * 100),
    modelGovernance: churnGovernance(userHistory, assessmentHistory),
  };
}

/**
 * Generate churn risk assessment
 */
export function assessChurnRisk(assessment, result, userHistory = [], assessmentHistory = []) {
  const churnProb = calculateChurnProbability(assessment, result, userHistory, assessmentHistory);
  const engagement = calculateEngagementTrajectory(userHistory);
  const improvement = calculateImprovementVelocity(assessmentHistory);
  const stress = calculateStressIndicators(result, assessmentHistory);

  // Determine intervention type
  let interventionType = 'maintenance';
  if (churnProb.probability > 0.7) {
    interventionType = 'critical_retention';
  } else if (churnProb.probability > 0.5) {
    interventionType = 'high_priority_engagement';
  } else if (churnProb.probability > 0.3 && improvement.overallTrend === 'stagnant') {
    interventionType = 'motivation_boost';
  }

  return {
    churnRiskAssessment: churnProb,
    riskFactors: {
      engagement: engagement,
      improvement: improvement,
      stress: stress,
    },
    interventionType: interventionType,
    recommendedActions: getRetentionActions(churnProb.churnRisk, stress.stressCategory),
    followUpRecommendation: {
      nextCheckDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: churnProb.probability > 0.5 ? 'high' : 'normal',
      suggestedCommunication: generateCommunicationStrategy(churnProb.probability, interventionType),
    },
    modelGovernance: churnGovernance(userHistory, assessmentHistory),
  };
}

/**
 * Get retention actions based on risk level
 */
function getRetentionActions(riskLevel, stressCategory) {
  const actions = [];

  if (riskLevel === 'Critical') {
    actions.push({
      action: 'Emergency support call',
      description: 'Schedule immediate conversation with user',
      priority: 'urgent',
    });
    actions.push({
      action: 'Personalized recovery plan',
      description: 'Create tailored 30-day improvement plan',
      priority: 'urgent',
    });
  }

  if (stressCategory === 'Critical') {
    actions.push({
      action: 'Provide crisis resources',
      description: 'Share financial counseling, emergency funds guides',
      priority: 'high',
    });
    actions.push({
      action: 'Reduce feature complexity',
      description: 'Simplify interface, focus on immediate needs only',
      priority: 'high',
    });
  }

  if (riskLevel === 'High' || riskLevel === 'Moderate') {
    actions.push({
      action: 'Re-engagement email',
      description: 'Send personalized success story or tip',
      priority: 'medium',
    });
    actions.push({
      action: 'Feature highlight',
      description: 'Show how features can help address their pain points',
      priority: 'medium',
    });
  }

  actions.push({
    action: 'Community connection',
    description: 'Connect with peer group, share insights',
    priority: 'low',
  });

  return actions;
}

/**
 * Generate communication strategy
 */
function generateCommunicationStrategy(probability, interventionType) {
  if (interventionType === 'critical_retention') {
    return {
      channel: 'phone_call',
      tone: 'supportive',
      focus: 'immediate_help',
      message: 'We noticed you might be struggling. Here is how we can help.',
    };
  }

  if (interventionType === 'high_priority_engagement') {
    return {
      channel: 'email',
      tone: 'encouraging',
      focus: 'quick_wins',
      message: 'Quick progress update: here is what you can accomplish this week.',
    };
  }

  return {
    channel: 'in_app',
    tone: 'motivational',
    focus: 'milestone_celebration',
    message: 'Keep going! See your progress over time.',
  };
}

/**
 * Batch churn risk scoring for multiple users
 */
export function scoreChurnRisks(userProfiles) {
  return userProfiles.map(profile => ({
    userId: profile.userId,
    ...assessChurnRisk(
      profile.assessment,
      profile.result,
      profile.userHistory,
      profile.assessmentHistory
    ),
  }));
}

/**
 * Identify high-risk cohorts for targeted interventions
 */
export function identifyAtRiskCohorts(userProfiles) {
  const risks = scoreChurnRisks(userProfiles);
  
  const criticalRisk = risks.filter(r => r.churnRiskAssessment.probability > 0.7);
  const highRisk = risks.filter(r => r.churnRiskAssessment.probability > 0.5 && r.churnRiskAssessment.probability <= 0.7);
  const stressedUsers = risks.filter(r => r.riskFactors.stress.stressCategory === 'Critical');
  const disengaged = risks.filter(r => r.riskFactors.engagement.trend === 'decreasing');

  return {
    criticalRisk: { count: criticalRisk.length, users: criticalRisk },
    highRisk: { count: highRisk.length, users: highRisk },
    stressedUsers: { count: stressedUsers.length, users: stressedUsers },
    disengaged: { count: disengaged.length, users: disengaged },
    totalAtRisk: criticalRisk.length + highRisk.length,
    cohortInsights: {
      mostCommonRiskFactor: 'identify most common factor',
      recommendedIntervention: 'batch personalized emails with crisis resources',
    },
  };
}
