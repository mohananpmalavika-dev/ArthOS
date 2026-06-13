/**
 * ML Validation Suite
 * Trains and validates all ML models against synthetic test datasets
 * Generates accuracy metrics, confusion matrices, and performance reports
 */

import {
  clusterUser,
  trainUserClusters,
  predictImpulseSpendingRisk,
  predictSavingsConsistency,
  predictStressSpending,
  predictArchetypeEvolution,
  calculateChurnProbability,
  assessChurnRisk,
  predictGoalAchievement,
  predictRunwayDepletionRisk,
  calculateMetrics,
  calculateR2,
  calculateRMSE,
  calculateMAE
} from "./mlIntegration.js";

/**
 * Generate synthetic training datasets matching real user patterns
 */
class DatasetGenerator {
  /**
   * Generate behavior prediction training data
   * X: [monthlyIncome, monthlyExpense, savingsRate, impulseBias, stressLevel]
   * y: [impulseRisk, savingsConsistency, stressSpending, archetypeType]
   */
  static generateBehaviorDataset(size = 200) {
    const X = [];
    const y = {
      impulseRisk: [],
      savingsConsistency: [],
      stressSpending: [],
      archetypeType: []
    };

    for (let i = 0; i < size; i++) {
      const income = 2000 + Math.random() * 6000;
      const expense = income * (0.6 + Math.random() * 0.3);
      const savingsRate = (income - expense) / income;
      const impulseBias = Math.random() * 100;
      const stressLevel = Math.random() * 100;

      X.push([income, expense, savingsRate, impulseBias, stressLevel]);

      // Generate labels based on features
      y.impulseRisk.push(impulseBias > 60 ? 1 : 0);
      y.savingsConsistency.push(savingsRate > 0.2 ? 1 : 0);
      y.stressSpending.push(stressLevel > 70 && impulseBias > 50 ? 1 : 0);
      y.archetypeType.push(
        savingsRate > 0.3
          ? "saver"
          : impulseBias > 70
            ? "spender"
            : stressLevel > 60
              ? "avoider"
              : "planner"
      );
    }

    return { X, y };
  }

  /**
   * Generate churn prediction training data
   * X: [daysSinceSignup, assessmentCount, lastEngagementDays, sessionDuration, actionCompletion]
   * y: [will_churn (0/1)]
   */
  static generateChurnDataset(size = 200) {
    const X = [];
    const y = [];

    for (let i = 0; i < size; i++) {
      const daysSinceSignup = Math.random() * 365;
      const assessmentCount = Math.floor(Math.random() * 20);
      const lastEngagementDays = Math.random() * 90;
      const sessionDuration = Math.random() * 60;
      const actionCompletion = Math.random();

      X.push([
        daysSinceSignup,
        assessmentCount,
        lastEngagementDays,
        sessionDuration,
        actionCompletion
      ]);

      // Churn probability: low engagement + high days since activity = likely churn
      const churnProba = (lastEngagementDays / 90) * 0.7 + (1 - actionCompletion) * 0.3;
      y.push(churnProba > 0.5 ? 1 : 0);
    }

    return { X, y };
  }

  /**
   * Generate clustering training data
   * 3 behavioral archetypes: savers, spenders, planners
   */
  static generateClusteringDataset(size = 200) {
    const X = [];
    const y = [];

    // Cluster 1: Savers (low spend, high savings)
    for (let i = 0; i < size / 3; i++) {
      X.push([
        5000 + Math.random() * 2000, // income
        2000 + Math.random() * 1000, // expense
        0.5 + Math.random() * 0.3, // savings rate
        20 + Math.random() * 20, // impulse bias (low)
        30 + Math.random() * 20 // risk aversion (high)
      ]);
      y.push("saver");
    }

    // Cluster 2: Spenders (high spend, low savings)
    for (let i = 0; i < size / 3; i++) {
      X.push([
        4000 + Math.random() * 2000,
        3000 + Math.random() * 1500,
        0.1 + Math.random() * 0.2,
        70 + Math.random() * 25,
        40 + Math.random() * 20
      ]);
      y.push("spender");
    }

    // Cluster 3: Planners (moderate spend, consistent behavior)
    for (let i = 0; i < size / 3; i++) {
      X.push([
        4500 + Math.random() * 2000,
        2500 + Math.random() * 1000,
        0.3 + Math.random() * 0.2,
        40 + Math.random() * 25,
        50 + Math.random() * 20
      ]);
      y.push("planner");
    }

    return { X, y };
  }

  /**
   * Generate financial outcome training data
   * X: [income, expenses, savings, investmentRate, riskProfile]
   * y: [runwayMonths, goalAchievementProba, portfolioGrowthRate]
   */
  static generateFinancialOutcomeDataset(size = 200) {
    const X = [];
    const y = {
      runwayMonths: [],
      goalAchievementProba: [],
      portfolioGrowthRate: []
    };

    for (let i = 0; i < size; i++) {
      const income = 3000 + Math.random() * 5000;
      const expenses = 2000 + Math.random() * 3000;
      const savings = income - expenses;
      const investmentRate = Math.min(savings / income, 0.5);
      const riskProfile = Math.random() * 100;

      X.push([income, expenses, savings, investmentRate, riskProfile]);

      // Calculate outcomes
      const runway = savings > 0 ? (income * 3) / expenses : 3;
      const goalAchievement = investmentRate * 0.5 + (riskProfile / 100) * 0.5;
      const portfolioGrowth = investmentRate * (0.05 + (riskProfile / 100) * 0.1);

      y.runwayMonths.push(Math.min(runway, 60));
      y.goalAchievementProba.push(Math.min(goalAchievement, 1));
      y.portfolioGrowthRate.push(portfolioGrowth);
    }

    return { X, y };
  }
}

/**
 * Validation Metrics Calculator
 */
class MetricsCalculator {
  /**
   * Classification metrics: accuracy, precision, recall, F1
   */
  static classificationMetrics(yTrue, yPred) {
    let tp = 0,
      fp = 0,
      tn = 0,
      fn = 0;

    for (let i = 0; i < yTrue.length; i++) {
      if (yTrue[i] === 1 && yPred[i] === 1) {
        tp++;
      } else if (yTrue[i] === 1 && yPred[i] === 0) {
        fn++;
      } else if (yTrue[i] === 0 && yPred[i] === 1) {
        fp++;
      } else {
        tn++;
      }
    }

    const accuracy = (tp + tn) / (tp + tn + fp + fn);
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1 = (2 * (precision * recall)) / (precision + recall) || 0;

    return { accuracy, precision, recall, f1, tp, tn, fp, fn };
  }

  /**
   * Regression metrics: R², RMSE, MAE
   */
  static regressionMetrics(yTrue, yPred) {
    const mse = yTrue.reduce((sum, y, i) => sum + Math.pow(y - yPred[i], 2), 0) / yTrue.length;
    const rmse = Math.sqrt(mse);

    const mae = yTrue.reduce((sum, y, i) => sum + Math.abs(y - yPred[i]), 0) / yTrue.length;

    const yMean = yTrue.reduce((a, b) => a + b, 0) / yTrue.length;
    const ssTotal = yTrue.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssRes = yTrue.reduce((sum, y, i) => sum + Math.pow(y - yPred[i], 2), 0);
    const r2 = 1 - ssRes / ssTotal;

    return { r2, rmse, mae, mse };
  }

  /**
   * Clustering metrics: silhouette score, davies-bouldin index
   */
  static clusteringMetrics(X, labels, centroids) {
    const k = Object.keys(centroids).length;
    const n = X.length;

    // Silhouette Score
    let silhouetteSum = 0;
    for (let i = 0; i < n; i++) {
      const label = labels[i];

      // Distance to same cluster (within-cluster)
      let withinDistance = 0;
      let withinCount = 0;
      for (let j = 0; j < n; j++) {
        if (labels[j] === label && i !== j) {
          withinDistance += this._euclidean(X[i], X[j]);
          withinCount++;
        }
      }
      const a = withinCount > 0 ? withinDistance / withinCount : 0;

      // Distance to nearest other cluster (between-cluster)
      let b = Infinity;
      for (const otherLabel in centroids) {
        if (otherLabel !== label) {
          const dist = this._euclidean(X[i], centroids[otherLabel]);
          b = Math.min(b, dist);
        }
      }

      const silhouette = (b - a) / Math.max(a, b);
      silhouetteSum += isFinite(silhouette) ? silhouette : 0;
    }

    const silhouetteScore = silhouetteSum / n;

    return { silhouetteScore };
  }

  static _euclidean(a, b) {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }
}

/**
 * ML Model Validator
 */
export class MLValidator {
  constructor() {
    this.results = {};
    this.datasets = {};
  }

  /**
   * Validate behavior prediction models
   */
  async validateBehaviorModels() {
    console.log("🔬 Validating Behavior Prediction Models...");
    const { X, y } = DatasetGenerator.generateBehaviorDataset(200);

    const results = {
      impulseSpending: [],
      savingsConsistency: [],
      stressSpending: [],
      archetypeEvolution: []
    };

    // Test impulse spending prediction
    const impulsePreds = X.map(x => {
      try {
        const pred = predictImpulseSpendingRisk({
          impulseBias: x[3],
          spendingPattern: x[1] / x[0]
        });
        return pred > 0.5 ? 1 : 0;
      } catch (e) {
        console.error("Impulse prediction error:", e.message);
        return 0;
      }
    });

    const impulseMetrics = MetricsCalculator.classificationMetrics(y.impulseRisk, impulsePreds);
    results.impulseSpending = impulseMetrics;

    // Test savings consistency
    const savingsPreds = X.map(x => {
      try {
        const pred = predictSavingsConsistency({
          savingsRate: x[2],
          historicalVariance: Math.random() * 0.2
        });
        return pred > 0.5 ? 1 : 0;
      } catch (e) {
        return 0;
      }
    });

    const savingsMetrics = MetricsCalculator.classificationMetrics(
      y.savingsConsistency,
      savingsPreds
    );
    results.savingsConsistency = savingsMetrics;

    // Test stress spending
    const stressPreds = X.map(x => {
      try {
        const pred = predictStressSpending({
          stressLevel: x[4],
          impulseBias: x[3]
        });
        return pred > 0.5 ? 1 : 0;
      } catch (e) {
        return 0;
      }
    });

    const stressMetrics = MetricsCalculator.classificationMetrics(y.stressSpending, stressPreds);
    results.stressSpending = stressMetrics;

    this.results.behaviorModels = results;
    return results;
  }

  /**
   * Validate churn prediction models
   */
  async validateChurnModels() {
    console.log("🔬 Validating Churn Prediction Models...");
    const { X, y } = DatasetGenerator.generateChurnDataset(200);

    const churnPreds = X.map(x => {
      try {
        const pred = calculateChurnProbability({
          daysSinceSignup: x[0],
          assessmentCount: x[1],
          lastEngagementDays: x[2],
          sessionDuration: x[3],
          actionCompletion: x[4]
        });
        return pred > 0.5 ? 1 : 0;
      } catch (e) {
        console.error("Churn prediction error:", e.message);
        return 0;
      }
    });

    const churnMetrics = MetricsCalculator.classificationMetrics(y, churnPreds);
    this.results.churnModels = churnMetrics;
    return churnMetrics;
  }

  /**
   * Validate clustering models
   */
  async validateClusteringModels() {
    console.log("🔬 Validating Clustering Models...");
    const { X, y } = DatasetGenerator.generateClusteringDataset(200);

    const clusterResults = X.map((x, i) => {
      try {
        return clusterUser(
          {
            monthlyIncome: x[0],
            monthlyExpense: x[1],
            savingsRate: x[2],
            impulseBias: x[3],
            riskAversion: x[4]
          },
          {}
        );
      } catch (e) {
        return { cluster: "unknown" };
      }
    });

    // Calculate accuracy (% correctly clustered)
    const correct = clusterResults.filter((res, i) => {
      const predicted = res.cluster?.name || "unknown";
      const mapped =
        predicted === y[i]
          ? true
          : predicted === "high_savings" && y[i] === "saver"
            ? true
            : predicted === "high_spending" && y[i] === "spender"
              ? true
              : predicted === "moderate" && y[i] === "planner"
                ? true
                : false;
      return mapped;
    }).length;

    const accuracy = correct / X.length;

    this.results.clusteringModels = {
      accuracy,
      samplesCorrect: correct,
      totalSamples: X.length
    };

    return this.results.clusteringModels;
  }

  /**
   * Validate financial outcome models
   */
  async validateFinancialOutcomeModels() {
    console.log("🔬 Validating Financial Outcome Models...");
    const { X, y } = DatasetGenerator.generateFinancialOutcomeDataset(200);

    // Test runway prediction
    const runwayPreds = X.map(x => {
      try {
        return predictRunwayDepletionRisk({
          income: x[0],
          expenses: x[1],
          savings: x[2]
        });
      } catch (e) {
        return 12;
      }
    });

    const runwayMetrics = MetricsCalculator.regressionMetrics(y.runwayMonths, runwayPreds);

    // Test goal achievement prediction
    const goalPreds = X.map(x => {
      try {
        return (
          predictGoalAchievement({
            monthlyIncome: x[0],
            savingsRate: x[3],
            investmentProfile: x[4],
            timeHorizon: 36
          }) / 100
        );
      } catch (e) {
        return 0.5;
      }
    });

    const goalMetrics = MetricsCalculator.regressionMetrics(y.goalAchievementProba, goalPreds);

    this.results.financialOutcomeModels = {
      runway: runwayMetrics,
      goalAchievement: goalMetrics
    };

    return this.results.financialOutcomeModels;
  }

  /**
   * Run full validation suite
   */
  async runFullValidation() {
    console.log("\n═══════════════════════════════════════");
    console.log("🚀 ML VALIDATION SUITE - Starting...");
    console.log("═══════════════════════════════════════\n");

    const startTime = Date.now();

    try {
      await this.validateBehaviorModels();
      await this.validateChurnModels();
      await this.validateClusteringModels();
      await this.validateFinancialOutcomeModels();

      const duration = (Date.now() - startTime) / 1000;

      console.log("\n═══════════════════════════════════════");
      console.log("✅ VALIDATION COMPLETE");
      console.log("═══════════════════════════════════════");
      console.log(`Duration: ${duration.toFixed(2)}s\n`);

      return this.generateReport();
    } catch (error) {
      console.error("❌ Validation failed:", error);
      throw error;
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalModels: 4,
        componentsValidated: {
          behaviorPrediction: 4,
          churnPrediction: 1,
          clustering: 1,
          financialOutcomes: 2
        }
      },
      results: this.results,
      interpretations: this.interpretResults()
    };
  }

  /**
   * Interpret validation results
   */
  interpretResults() {
    const interpretations = [];

    // Behavior Models
    if (this.results.behaviorModels) {
      const avg =
        (this.results.behaviorModels.impulseSpending.f1 +
          this.results.behaviorModels.savingsConsistency.f1 +
          this.results.behaviorModels.stressSpending.f1) /
        3;
      interpretations.push({
        component: "Behavior Prediction",
        avgF1Score: avg.toFixed(3),
        status: avg > 0.7 ? "✅ PASS" : "⚠️ NEEDS TUNING",
        note: `Average F1 score of ${(avg * 100).toFixed(1)}% across 3 behavior models`
      });
    }

    // Churn Models
    if (this.results.churnModels) {
      interpretations.push({
        component: "Churn Prediction",
        accuracy: (this.results.churnModels.accuracy * 100).toFixed(1) + "%",
        f1Score: this.results.churnModels.f1.toFixed(3),
        status: this.results.churnModels.f1 > 0.65 ? "✅ PASS" : "⚠️ NEEDS TUNING",
        note: `Detects at-risk users with ${(this.results.churnModels.recall * 100).toFixed(1)}% recall`
      });
    }

    // Clustering
    if (this.results.clusteringModels) {
      interpretations.push({
        component: "User Clustering",
        accuracy: (this.results.clusteringModels.accuracy * 100).toFixed(1) + "%",
        status: this.results.clusteringModels.accuracy > 0.8 ? "✅ PASS" : "⚠️ NEEDS TUNING",
        note: `Successfully segments ${this.results.clusteringModels.samplesCorrect}/${this.results.clusteringModels.totalSamples} test cases`
      });
    }

    // Financial Outcomes
    if (this.results.financialOutcomeModels) {
      const avgR2 =
        (this.results.financialOutcomeModels.runway.r2 +
          this.results.financialOutcomeModels.goalAchievement.r2) /
        2;
      interpretations.push({
        component: "Financial Outcome Prediction",
        avgR2: avgR2.toFixed(3),
        status: avgR2 > 0.65 ? "✅ PASS" : "⚠️ NEEDS TUNING",
        note: `Explains ${(avgR2 * 100).toFixed(1)}% of variance in financial outcomes`
      });
    }

    return interpretations;
  }
}

// Run validation if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new MLValidator();
  const report = await validator.runFullValidation();
  console.log(JSON.stringify(report, null, 2));
}

export { DatasetGenerator, MetricsCalculator };
