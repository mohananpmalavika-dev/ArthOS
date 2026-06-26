/**
 * ML User Clustering Engine
 * Segments users into behavioral clusters using K-means clustering
 *
 * Clusters:
 * - Risk-Averse Planners: High awareness, high stability, conservative
 * - Impulse Spenders: Low awareness, high spending, reactive
 * - Disciplined Accumulators: Consistent savers, goal-oriented
 * - Struggling Survivors: Low runway, reactive decisions
 * - Balanced Growth Seekers: Moderate stability + growth seeking
 */

import {
  extractFeatures,
  normalizeFeatureMatrix,
  euclideanDistance,
  calculateCentroid,
  calculateInertia
} from "./mlUtilities.js";
import { buildModelLineage } from "./modelRegistry.js";

function clusteringGovernance(dataPoints = 0, metrics = null) {
  return buildModelLineage({
    modelType: "clustering",
    metrics,
    dataPoints
  });
}

const CLUSTER_NAMES = {
  0: "Risk-Averse Planner",
  1: "Impulse Spender",
  2: "Disciplined Accumulator",
  3: "Struggling Survivor",
  4: "Balanced Growth Seeker"
};

const CLUSTER_PROFILES = {
  "Risk-Averse Planner": {
    description: "Highly aware, stable, conservative. Prioritizes security over growth.",
    characteristics: [
      "High awareness",
      "Strong emergency fund",
      "Low risk tolerance",
      "Detailed budgeting"
    ],
    recommendations: [
      "Consider moderate growth investments while maintaining safety buffer",
      "Explore insurance and income protection strategies",
      "Balance caution with opportunity cost awareness"
    ]
  },
  "Impulse Spender": {
    description:
      "Low awareness of spending patterns, reactive financial decisions, high impulsive purchases.",
    characteristics: [
      "Low awareness",
      "Frequent regrets",
      "Reactive spending",
      "Weak emergency buffer"
    ],
    recommendations: [
      "Implement strict tracking and approval workflows",
      "Automate savings before discretionary spending",
      "Identify emotional spending triggers and create friction",
      "Build 30-day cooling-off rule for purchases >5% of monthly income"
    ]
  },
  "Disciplined Accumulator": {
    description: "Consistent saver, goal-oriented, methodical wealth builder.",
    characteristics: ["Regular savings", "Goal tracking", "Disciplined", "Runway-focused"],
    recommendations: [
      "Optimize investment allocation for tax efficiency",
      "Consider more aggressive growth strategies",
      "Set milestone-based increases in investment amounts",
      "Explore advanced financial products (options, real estate)"
    ]
  },
  "Struggling Survivor": {
    description: "Limited runway, living paycheck-to-paycheck, stressed financial state.",
    characteristics: ["Low runway (<3mo)", "High stress", "Reactive decisions", "Limited savings"],
    recommendations: [
      "Focus on emergency fund building (target: 3-month buffer)",
      "Reduce discretionary spending by 20% minimum",
      "Explore income increase opportunities (side income, skills)",
      "Negotiate fixed expenses (insurance, subscriptions, housing)"
    ]
  },
  "Balanced Growth Seeker": {
    description: "Moderate stability with growth orientation, balanced risk appetite.",
    characteristics: ["Moderate awareness", "Reasonable runway", "Growth mindset", "Some savings"],
    recommendations: [
      "Build 6-month emergency fund while investing for growth",
      "Diversify income streams to increase stability",
      "Create education/skill investments for career growth",
      "Balance safety with calculated risk-taking"
    ]
  }
};

/**
 * K-means clustering algorithm
 */
function kMeans(data, k, maxIterations = 50, tolerance = 0.001) {
  if (!data || data.length === 0 || data.length < k) {
    return { centroids: [], assignments: [], inertia: 0, converged: false };
  }

  // Initialize centroids randomly from data
  let centroids = [];
  const indices = new Set();
  while (centroids.length < k) {
    const idx = Math.floor(Math.random() * data.length);
    if (!indices.has(idx)) {
      centroids.push([...data[idx]]);
      indices.add(idx);
    }
  }

  let previousInertia = Infinity;
  let converged = false;
  let iterations = 0;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign points to nearest centroid
    const assignments = data.map(point =>
      centroids.reduce((nearest, centroid, idx) => {
        const distance = euclideanDistance(point, centroid);
        const nearestDistance = euclideanDistance(point, centroids[nearest]);
        return distance < nearestDistance ? idx : nearest;
      }, 0)
    );

    // Calculate new centroids
    const newCentroids = Array(k)
      .fill(null)
      .map((_, idx) => {
        const clusterPoints = data.filter((_, i) => assignments[i] === idx);
        return clusterPoints.length > 0 ? calculateCentroid(clusterPoints) : centroids[idx];
      });

    // Check convergence
    const inertia = calculateInertia(data, newCentroids, assignments);
    const inertiaChange = Math.abs(previousInertia - inertia);

    if (inertiaChange < tolerance) {
      centroids = newCentroids;
      converged = true;
      iterations = iter + 1;
      return { centroids, assignments, inertia, converged, iterations };
    }

    centroids = newCentroids;
    previousInertia = inertia;
    iterations = iter + 1;
  }

  return {
    centroids,
    assignments: data.map(p => 0),
    inertia: previousInertia,
    converged,
    iterations
  };
}

/**
 * Cluster a single user
 */
export function clusterUser(assessment, result, trainedCentroids) {
  const features = extractFeatures(assessment, result);

  if (!trainedCentroids || trainedCentroids.length === 0) {
    // Fallback: simple rule-based clustering
    return assignClusterRuleBased(result);
  }

  // Find nearest centroid
  let nearestCluster = 0;
  let nearestDistance = Infinity;

  for (let i = 0; i < trainedCentroids.length; i++) {
    const distance = euclideanDistance(features, trainedCentroids[i]);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestCluster = i;
    }
  }

  return {
    clusterId: nearestCluster,
    clusterName: CLUSTER_NAMES[nearestCluster] || `Cluster ${nearestCluster}`,
    profile: CLUSTER_PROFILES[CLUSTER_NAMES[nearestCluster]] || {},
    confidence: 1 / (1 + nearestDistance), // Sigmoid confidence
    modelGovernance: clusteringGovernance(trainedCentroids.length)
  };
}

/**
 * Train clustering model on batch of users
 */
export function trainUserClusters(userDataset) {
  if (!userDataset || userDataset.length === 0) {
    return { centroids: [], assignments: [], model: null, converged: false };
  }

  // Extract features
  const featureMatrix = userDataset.map(({ assessment, result }) =>
    extractFeatures(assessment, result)
  );

  // Normalize features
  const normalizedFeatures = normalizeFeatureMatrix(featureMatrix);

  // Run K-means with 5 clusters
  const { centroids, assignments, inertia, converged, iterations } = kMeans(
    normalizedFeatures,
    5,
    100,
    0.0001
  );

  // Calculate cluster statistics
  const clusterStats = Array(5)
    .fill(null)
    .map((_, clusterIdx) => {
      const clusterUsers = userDataset.filter((_, i) => assignments[i] === clusterIdx);
      return {
        size: clusterUsers.length,
        avgHealthScore:
          clusterUsers.length > 0
            ? clusterUsers.reduce((sum, u) => sum + (u.result?.healthScore || 0), 0) /
              clusterUsers.length
            : 0,
        avgRunway:
          clusterUsers.length > 0
            ? clusterUsers.reduce((sum, u) => sum + (u.result?.runwayMonths || 0), 0) /
              clusterUsers.length
            : 0
      };
    });

  return {
    centroids,
    assignments,
    inertia,
    converged,
    iterations,
    clusterStats,
    model: {
      trainedAt: new Date().toISOString(),
      datasetSize: userDataset.length,
      numClusters: 5
    },
    modelGovernance: clusteringGovernance(userDataset.length, { inertia })
  };
}

/**
 * Rule-based cluster assignment (fallback)
 */
function assignClusterRuleBased(result) {
  const awareness = result?.awarenessScore || 0;
  const stability = result?.stabilityScore || 0;
  const runway = result?.runwayMonths || 0;
  const behaviour = result?.behaviourScore || 0;

  if (awareness > 25 && stability > 20) {
    return {
      clusterId: 0,
      clusterName: "Risk-Averse Planner",
      profile: CLUSTER_PROFILES["Risk-Averse Planner"],
      confidence: 0.7,
      modelGovernance: clusteringGovernance()
    };
  }

  if (behaviour < 20 && awareness < 15) {
    return {
      clusterId: 1,
      clusterName: "Impulse Spender",
      profile: CLUSTER_PROFILES["Impulse Spender"],
      confidence: 0.65,
      modelGovernance: clusteringGovernance()
    };
  }

  if (stability > 22 && awareness > 20) {
    return {
      clusterId: 2,
      clusterName: "Disciplined Accumulator",
      profile: CLUSTER_PROFILES["Disciplined Accumulator"],
      confidence: 0.75,
      modelGovernance: clusteringGovernance()
    };
  }

  if (runway < 3 && stability < 15) {
    return {
      clusterId: 3,
      clusterName: "Struggling Survivor",
      profile: CLUSTER_PROFILES["Struggling Survivor"],
      confidence: 0.7,
      modelGovernance: clusteringGovernance()
    };
  }

  return {
    clusterId: 4,
    clusterName: "Balanced Growth Seeker",
    profile: CLUSTER_PROFILES["Balanced Growth Seeker"],
    confidence: 0.6,
    modelGovernance: clusteringGovernance()
  };
}

/**
 * Get cluster centroid characteristics
 */
export function getClusterCharacteristics(clusterId, centroids) {
  if (!centroids || !centroids[clusterId]) {
    return null;
  }

  const centroid = centroids[clusterId];
  return {
    awarenessFeature: centroid[0],
    awarenessGap: centroid[1],
    behaviourFeature: centroid[2],
    stabilityFeature: centroid[4],
    runwayFeature: centroid[8],
    healthScoreFeature: centroid[10]
  };
}

/**
 * Export clustering model as JSON
 */
export function exportClusterModel(clusteringResult) {
  return {
    centroids: clusteringResult.centroids,
    clusterStats: clusteringResult.clusterStats,
    model: clusteringResult.model,
    modelGovernance: clusteringResult.modelGovernance || clusteringGovernance(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Import clustering model from JSON
 */
export function importClusterModel(modelJSON) {
  return modelJSON?.centroids || [];
}
