/**
 * ML Behaviour Prediction Engine
 * Predicts future financial behaviors based on historical patterns
 *
 * Predicts:
 * - Impulse spending likelihood
 * - Savings consistency
 * - Stress-triggered spending
 * - Decision pattern changes
 * - Behavioral archetypes evolution
 */

import { buildModelLineage } from "./modelRegistry.js";
import { extractFeatures, sigmoid, softmax, calculateMetrics } from "./mlUtilities.js";

function behaviorGovernance(modelType, historicalData = [], metrics = null) {
  return buildModelLineage({
    modelType,
    metrics,
    dataPoints: Array.isArray(historicalData) ? historicalData.length : 0
  });
}

/**
 * Simple linear regression for behavior prediction
 */
class LinearRegressor {
  constructor() {
    this.weights = [];
    this.bias = 0;
    this.trainedAt = null;
  }

  train(X, y, learningRate = 0.01, epochs = 100) {
    const m = X.length;
    if (m === 0 || X[0].length === 0) {
      return;
    }

    const numFeatures = X[0].length;
    this.weights = Array(numFeatures).fill(0);
    this.bias = 0;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalError = 0;

      for (let i = 0; i < m; i++) {
        // Forward pass
        let prediction = this.bias;
        for (let j = 0; j < numFeatures; j++) {
          prediction += this.weights[j] * X[i][j];
        }

        const error = y[i] - prediction;
        totalError += error * error;

        // Backward pass (gradient descent)
        this.bias += (learningRate * error) / m;
        for (let j = 0; j < numFeatures; j++) {
          this.weights[j] += (learningRate * error * X[i][j]) / m;
        }
      }
    }

    this.trainedAt = new Date().toISOString();
  }

  predict(X) {
    if (!Array.isArray(X[0])) {
      // Single prediction
      let result = this.bias;
      for (let j = 0; j < this.weights.length; j++) {
        result += this.weights[j] * (X[j] || 0);
      }
      return result;
    }

    // Batch prediction
    return X.map(x => {
      let result = this.bias;
      for (let j = 0; j < this.weights.length; j++) {
        result += this.weights[j] * (x[j] || 0);
      }
      return result;
    });
  }
}

/**
 * Logistic regression for binary classification
 */
class LogisticRegressor {
  constructor() {
    this.weights = [];
    this.bias = 0;
    this.trainedAt = null;
  }

  train(X, y, learningRate = 0.01, epochs = 100) {
    const m = X.length;
    if (m === 0 || X[0].length === 0) {
      return;
    }

    const numFeatures = X[0].length;
    this.weights = Array(numFeatures).fill(0);
    this.bias = 0;

    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = 0; i < m; i++) {
        let logit = this.bias;
        for (let j = 0; j < numFeatures; j++) {
          logit += this.weights[j] * X[i][j];
        }

        const prediction = sigmoid(logit);
        const error = y[i] - prediction;

        this.bias += (learningRate * error) / m;
        for (let j = 0; j < numFeatures; j++) {
          this.weights[j] += (learningRate * error * X[i][j]) / m;
        }
      }
    }

    this.trainedAt = new Date().toISOString();
  }

  predictProba(X) {
    if (!Array.isArray(X[0])) {
      // Single prediction
      let logit = this.bias;
      for (let j = 0; j < this.weights.length; j++) {
        logit += this.weights[j] * (X[j] || 0);
      }
      return sigmoid(logit);
    }

    // Batch prediction
    return X.map(x => {
      let logit = this.bias;
      for (let j = 0; j < this.weights.length; j++) {
        logit += this.weights[j] * (x[j] || 0);
      }
      return sigmoid(logit);
    });
  }

  predict(X) {
    const probas = this.predictProba(X);
    if (Array.isArray(probas)) {
      return probas.map(p => (p > 0.5 ? 1 : 0));
    }
    return probas > 0.5 ? 1 : 0;
  }
}

// Trained models
const impulseSpendingModel = new LogisticRegressor();
const savingsConsistencyModel = new LinearRegressor();
const stressSpendingModel = new LogisticRegressor();

/**
 * Predict impulse spending likelihood (0-1)
 */
export function predictImpulseSpendingRisk(assessment, result, historicalData = []) {
  const features = extractFeatures(assessment, result);

  // Heuristic model if no training data
  if (historicalData.length === 0) {
    const awareness = result?.awarenessScore || 0;
    const behaviour = result?.behaviourScore || 0;
    const stability = result?.stabilityScore || 0;

    // Lower awareness + higher spending + lower stability = higher impulse risk
    const risk =
      (1 - awareness / 30) * 0.4 + (1 - behaviour / 45) * 0.4 + (1 - stability / 25) * 0.2;
    return {
      riskScore: Math.min(1, Math.max(0, risk)),
      riskLevel: risk > 0.7 ? "High" : risk > 0.4 ? "Moderate" : "Low",
      modelGovernance: behaviorGovernance("behavior-impulse-risk", historicalData),
      factors: [
        `Awareness: ${awareness}/30`,
        `Behavior Score: ${behaviour}/45`,
        `Stability: ${stability}/25`
      ]
    };
  }

  // Use trained model if available
  const probability = impulseSpendingModel.predictProba(features);
  return {
    riskScore: probability,
    riskLevel: probability > 0.7 ? "High" : probability > 0.4 ? "Moderate" : "Low",
    modelGovernance: behaviorGovernance("behavior-impulse-risk", historicalData),
    factors: features.map((f, i) => `Feature ${i}: ${(f * 100).toFixed(1)}%`)
  };
}

/**
 * Predict savings consistency score (0-100)
 */
export function predictSavingsConsistency(assessment, result, historicalData = []) {
  const features = extractFeatures(assessment, result);

  // Rule-based heuristic
  if (historicalData.length === 0) {
    const stability = ((result?.stabilityScore || 0) / 25) * 100;
    const awareness = ((result?.awarenessScore || 0) / 30) * 100;
    const runway = Math.min(100, ((result?.runwayMonths || 0) / 12) * 100);

    const consistency = stability * 0.4 + awareness * 0.35 + runway * 0.25;
    return {
      consistency: Math.round(consistency),
      trend: "stable",
      predictedMonthlyChange: 0,
      modelGovernance: behaviorGovernance("behavior-savings-consistency", historicalData),
      recommendation:
        consistency > 70
          ? "Maintain current savings pattern"
          : "Increase savings frequency and automate contributions"
    };
  }

  // Use trained model
  const prediction = savingsConsistencyModel.predict(features);
  return {
    consistency: Math.round(Math.min(100, Math.max(0, prediction))),
    trend: prediction > 50 ? "positive" : "negative",
    predictedMonthlyChange: (prediction - 50) / 10,
    modelGovernance: behaviorGovernance("behavior-savings-consistency", historicalData),
    recommendation:
      prediction > 60
        ? "Maintain current savings pattern"
        : "Increase savings frequency and automate contributions"
  };
}

/**
 * Predict stress-triggered spending likelihood
 */
export function predictStressSpending(assessment, result) {
  const stressSpendTrigger = assessment?.behaviour?.spendWhenStressed;
  const awareness = result?.awarenessScore || 0;
  const stability = result?.stabilityScore || 0;

  // Base probability on behavior
  const baseProbability = stressSpendTrigger ? 0.7 : 0.2;

  // Adjust by awareness and stability
  const awarenessAdjust = (1 - awareness / 30) * 0.2;
  const stabilityAdjust = (1 - stability / 25) * 0.15;

  const probability = Math.min(1, baseProbability + awarenessAdjust + stabilityAdjust);

  return {
    riskScore: probability,
    riskLevel: probability > 0.6 ? "High" : probability > 0.3 ? "Moderate" : "Low",
    modelGovernance: behaviorGovernance("behavior-stress-spending"),
    triggers: stressSpendTrigger
      ? ["Work stress", "Relationship issues", "Financial pressure", "Social comparison"]
      : [],
    mitigationStrategies: [
      "Create a 24-hour cooling-off period before purchases during stress",
      "Identify alternative stress-relief activities (exercise, social connection)",
      "Build emergency decision framework for stress situations",
      "Practice mindfulness and emotional awareness"
    ]
  };
}

/**
 * Predict behavioral archetype evolution
 */
export function predictArchetypeEvolution(assessment, result, previousAssessments = []) {
  const currentPersonality = result?.personalityType || "Unknown";

  const evolution = {
    current: currentPersonality,
    predicted: currentPersonality,
    stabilityScore: 0.8,
    changeFactors: [],
    timeframe: "3 months",
    modelGovernance: behaviorGovernance("behavior-archetype-evolution", previousAssessments)
  };

  if (previousAssessments.length > 0) {
    const prevPersonality = previousAssessments[previousAssessments.length - 1]?.personalityType;
    const awarenessGrowth =
      (result?.awarenessScore || 0) - (previousAssessments[0]?.awarenessScore || 0);

    if (awarenessGrowth > 5) {
      evolution.predictedTrajectory = "Toward more awareness-driven archetype";
      evolution.changeFactors.push(`Awareness growth: +${awarenessGrowth}`);
    }

    if (previousAssessments.length >= 2 && prevPersonality === currentPersonality) {
      evolution.stabilityScore = 0.9;
      evolution.changeFactors.push("Stable personality (consistent for 2+ cycles)");
    }
  }

  return evolution;
}

/**
 * Train behavior prediction models on historical data
 */
export function trainBehaviorModels(historicalDataset) {
  if (!historicalDataset || historicalDataset.length < 10) {
    return { trained: false, recordsUsed: historicalDataset?.length || 0 };
  }

  const X = historicalDataset.map(record => extractFeatures(record.assessment, record.result));

  // Train impulse spending model
  const impulseLabels = historicalDataset.map(record =>
    record.assessment?.behaviour?.regretImpulseFreq === "often" ? 1 : 0
  );
  impulseSpendingModel.train(X, impulseLabels);

  // Train savings consistency model
  const savingsLabels = historicalDataset.map(
    record => ((record.result?.stabilityScore || 0) / 25) * 100
  );
  savingsConsistencyModel.train(X, savingsLabels);

  // Train stress spending model
  const stressLabels = historicalDataset.map(record =>
    record.assessment?.behaviour?.spendWhenStressed ? 1 : 0
  );
  stressSpendingModel.train(X, stressLabels);

  return {
    trained: true,
    recordsUsed: historicalDataset.length,
    modelsValidation: {
      impulseSpending: impulseSpendingModel.trainedAt,
      savingsConsistency: savingsConsistencyModel.trainedAt,
      stressSpending: stressSpendingModel.trainedAt
    }
  };
}

/**
 * Get comprehensive behavior prediction report
 */
export function generateBehaviorPredictionReport(assessment, result, historicalData = []) {
  return {
    timestamp: new Date().toISOString(),
    modelGovernance: {
      impulseSpendingRisk: behaviorGovernance("behavior-impulse-risk", historicalData),
      savingsConsistency: behaviorGovernance("behavior-savings-consistency", historicalData),
      stressSpendingRisk: behaviorGovernance("behavior-stress-spending", historicalData),
      archetypeEvolution: behaviorGovernance("behavior-archetype-evolution", historicalData)
    },
    impulseSpendingRisk: predictImpulseSpendingRisk(assessment, result, historicalData),
    savingsConsistency: predictSavingsConsistency(assessment, result, historicalData),
    stressSpendingRisk: predictStressSpending(assessment, result),
    archetypeEvolution: predictArchetypeEvolution(assessment, result, historicalData),
    modelConfidence:
      historicalData.length > 50 ? "High" : historicalData.length > 10 ? "Medium" : "Low",
    recommendedActions: [
      "Monitor impulse spending patterns weekly",
      "Schedule monthly savings automation check-in",
      "Build stress-response playbook for high-risk scenarios",
      "Track behavior changes against predicted patterns"
    ]
  };
}
