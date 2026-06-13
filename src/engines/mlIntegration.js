/**
 * ML Engine Integration Layer
 * Coordinates all machine learning models:
 * - User Clustering (behavioral segmentation)
 * - Behaviour Prediction (future patterns)
 * - Churn Prediction (engagement risk)
 * - Financial Outcome Prediction (wealth trajectory)
 */

export {
  // ML Utilities
  normalize,
  denormalize,
  standardize,
  euclideanDistance,
  manhattanDistance,
  cosineSimilarity,
  mean,
  stdDev,
  extractFeatures,
  normalizeFeatureMatrix,
  calculateCentroid,
  calculateInertia,
  sigmoid,
  relu,
  softmax,
  calculateMetrics,
  calculateR2,
  calculateMAE,
  calculateRMSE
} from "./mlUtilities.js";

export {
  // User Clustering
  clusterUser,
  trainUserClusters,
  getClusterCharacteristics,
  exportClusterModel,
  importClusterModel
} from "./mlClusteringEngine.js";

export {
  // Behaviour Prediction
  predictImpulseSpendingRisk,
  predictSavingsConsistency,
  predictStressSpending,
  predictArchetypeEvolution,
  trainBehaviorModels,
  generateBehaviorPredictionReport
} from "./mlBehaviourPredictionEngine.js";

export {
  // Churn Prediction
  calculateEngagementTrajectory,
  calculateImprovementVelocity,
  calculateStressIndicators,
  calculateChurnProbability,
  assessChurnRisk,
  scoreChurnRisks,
  identifyAtRiskCohorts
} from "./mlChurnPredictionEngine.js";

export {
  // Financial Outcome Prediction
  runMonteCarloProjection,
  predictGoalAchievement,
  predictPortfolioOutcomes,
  predictRunwayDepletionRisk,
  predictSpendingBehaviorOutcome,
  generateFinancialOutcomeReport
} from "./mlFinancialOutcomeEngine.js";

/**
 * Unified ML Pipeline: Execute all models for a user
 */
export function runFullMLPipeline(assessment, result, userHistory = [], assessmentHistory = []) {
  return {
    timestamp: new Date().toISOString(),

    // 1. User Clustering
    cluster: {
      ...require("./mlClusteringEngine.js").clusterUser(assessment, result),
      description: "Identifies which behavioral segment the user belongs to"
    },

    // 2. Behavior Prediction
    behaviors: {
      ...require("./mlBehaviourPredictionEngine.js").generateBehaviorPredictionReport(
        assessment,
        result,
        assessmentHistory
      ),
      description: "Predicts future spending and decision-making patterns"
    },

    // 3. Churn Risk
    churnRisk: {
      ...require("./mlChurnPredictionEngine.js").assessChurnRisk(
        assessment,
        result,
        userHistory,
        assessmentHistory
      ),
      description: "Evaluates likelihood of user disengagement"
    },

    // 4. Financial Outcomes
    financialOutcomes: {
      ...require("./mlFinancialOutcomeEngine.js").generateFinancialOutcomeReport(
        assessment,
        result
      ),
      description: "Projects wealth trajectory and financial goals"
    },

    // Summary
    summary: {
      riskProfile: generateRiskProfile(result, userHistory),
      recommendedInterventions: generateInterventions(result, userHistory, assessmentHistory),
      modelConfidence: calculateModelConfidence(assessment, result, userHistory)
    }
  };
}

/**
 * Calculate risk profile across all models
 */
function generateRiskProfile(result, userHistory) {
  const riskFactors = [];

  if ((result?.runwayMonths || 0) < 3) {
    riskFactors.push({ factor: "Low Runway", severity: "Critical", weight: 0.35 });
  }

  if ((result?.riskScore || 0) > 70) {
    riskFactors.push({ factor: "High Financial Risk", severity: "High", weight: 0.25 });
  }

  if ((result?.awarenessScore || 0) < 15) {
    riskFactors.push({ factor: "Low Awareness", severity: "High", weight: 0.2 });
  }

  const totalWeight = riskFactors.reduce((sum, rf) => sum + rf.weight, 0);

  return {
    riskFactors: riskFactors,
    overallRiskScore: Math.round(totalWeight * 100),
    riskLevel:
      totalWeight > 0.7
        ? "Critical"
        : totalWeight > 0.5
          ? "High"
          : totalWeight > 0.3
            ? "Moderate"
            : "Low"
  };
}

/**
 * Generate personalized interventions
 */
function generateInterventions(result, userHistory, assessmentHistory) {
  const interventions = [];

  if ((result?.runwayMonths || 0) < 3) {
    interventions.push({
      priority: "urgent",
      type: "financial_stabilization",
      action: "Build emergency fund to 3+ months",
      timeline: "60 days"
    });
  }

  if ((result?.awarenessScore || 0) < 10) {
    interventions.push({
      priority: "high",
      type: "awareness_building",
      action: "Daily spending awareness tracking",
      timeline: "14 days"
    });
  }

  if (
    assessmentHistory.length > 0 &&
    (assessmentHistory[assessmentHistory.length - 1]?.healthScore || 0) >
      (assessmentHistory[0]?.healthScore || 0) + 10
  ) {
    interventions.push({
      priority: "low",
      type: "momentum_building",
      action: "Set stretch goal - celebrate progress",
      timeline: "7 days"
    });
  }

  return interventions;
}

/**
 * Calculate overall model confidence based on data quality
 */
function calculateModelConfidence(assessment, result, userHistory) {
  let confidence = 0.6; // Base confidence

  // More history = higher confidence
  if (userHistory?.length > 50) {
    confidence += 0.25;
  } else if (userHistory?.length > 20) {
    confidence += 0.15;
  } else if (userHistory?.length > 5) {
    confidence += 0.05;
  }

  // Complete data = higher confidence
  if (result?.healthScore && result?.riskScore && result?.runwayMonths) {
    confidence += 0.1;
  }
  if (assessment?.behaviour && assessment?.profile) {
    confidence += 0.05;
  }

  return Math.min(1, confidence);
}

/**
 * Batch process multiple users for cohort analysis
 */
export function runBatchMLPipeline(userList) {
  return {
    processedAt: new Date().toISOString(),
    totalUsers: userList.length,
    results: userList.map(user => ({
      userId: user.userId,
      pipeline: runFullMLPipeline(
        user.assessment,
        user.result,
        user.userHistory,
        user.assessmentHistory
      )
    })),
    cohortAnalysis: generateCohortAnalysis(userList)
  };
}

/**
 * Generate cohort-level insights
 */
function generateCohortAnalysis(userList) {
  const results = userList.map(u => u.result || {});

  const avgHealthScore = results.reduce((sum, r) => sum + (r.healthScore || 0), 0) / results.length;
  const avgRunway = results.reduce((sum, r) => sum + (r.runwayMonths || 0), 0) / results.length;
  const avgRiskScore = results.reduce((sum, r) => sum + (r.riskScore || 0), 0) / results.length;

  const atRiskCount = results.filter(r => (r.runwayMonths || 0) < 3).length;
  const healthyCount = results.filter(r => (r.healthScore || 0) > 70).length;

  return {
    cohortSize: userList.length,
    averageHealthScore: Math.round(avgHealthScore),
    averageRunway: Math.round(avgRunway * 10) / 10,
    averageRiskScore: Math.round(avgRiskScore),
    atRiskPercentage: ((atRiskCount / userList.length) * 100).toFixed(1),
    healthyPercentage: ((healthyCount / userList.length) * 100).toFixed(1),
    recommendations: [
      atRiskCount > userList.length * 0.2 &&
        "High proportion at-risk - prioritize support programs",
      avgRunway < 6 && "Cohort runway is low - focus on income/expense strategies",
      avgHealthScore < 50 && "Cohort health declining - increase engagement efforts"
    ].filter(Boolean)
  };
}

/**
 * Model explainability: Why did the model predict X?
 */
export function explainPrediction(predictionType, result, explicitFactors = []) {
  const explanations = {
    churnRisk: () => ({
      reason: "Churn prediction based on:",
      factors: [
        ...explicitFactors,
        "Recent engagement patterns",
        "Score improvement velocity",
        "Stress levels and runway risk"
      ],
      confidence: "See individual factor weights in detailed report"
    }),
    clusterAssignment: () => ({
      reason: "User assigned to cluster based on:",
      factors: [
        ...explicitFactors,
        "Awareness and behavioral scores",
        "Financial stability metrics",
        "Decision pattern analysis"
      ],
      confidence: "Euclidean distance to cluster centroid"
    }),
    spendingRisk: () => ({
      reason: "Spending risk estimated from:",
      factors: [...explicitFactors, "Behavioral history", "Stress indicators", "Awareness gaps"],
      confidence: "Logistic regression probability"
    })
  };

  return explanations[predictionType]?.() || { reason: "Unknown prediction type" };
}
