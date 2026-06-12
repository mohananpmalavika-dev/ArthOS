/**
 * ML Utilities - Common functions for machine learning models
 * Features: normalization, distance metrics, feature extraction
 */

/**
 * Min-Max normalization: scales values to [0, 1]
 */
export function normalize(value, min, max) {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Denormalize: reverse min-max normalization
 */
export function denormalize(value, min, max) {
  return value * (max - min) + min;
}

/**
 * Standard score (Z-score) normalization
 */
export function standardize(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return values.map(v => stdDev === 0 ? 0 : (v - mean) / stdDev);
}

/**
 * Calculate Euclidean distance between two points (vectors)
 */
export function euclideanDistance(point1, point2) {
  let sum = 0;
  for (let i = 0; i < point1.length; i++) {
    sum += Math.pow((point1[i] || 0) - (point2[i] || 0), 2);
  }
  return Math.sqrt(sum);
}

/**
 * Calculate Manhattan distance (L1 distance)
 */
export function manhattanDistance(point1, point2) {
  let sum = 0;
  for (let i = 0; i < point1.length; i++) {
    sum += Math.abs((point1[i] || 0) - (point2[i] || 0));
  }
  return sum;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vec1, vec2) {
  const dotProduct = vec1.reduce((sum, v, i) => sum + v * (vec2[i] || 0), 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0));
  
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}

/**
 * Calculate mean of array
 */
export function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Calculate standard deviation
 */
export function stdDev(arr) {
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Extract feature vector from user assessment
 */
export function extractFeatures(assessment, result) {
  const behaviour = assessment?.behaviour || {};
  const profile = assessment?.profile || {};
  
  return [
    // Awareness features
    normalize(result?.awarenessScore || 0, 0, 30),
    normalize(result?.awarenessGapDisplay || 0, 0, 100),
    
    // Behaviour features
    normalize(result?.behaviourScore || 0, 0, 45),
    behaviour?.spendWhenStressed ? 1 : 0,
    behaviour?.regretImpulseFreq === 'often' ? 1 : (behaviour?.regretImpulseFreq === 'sometimes' ? 0.5 : 0),
    
    // Stability features
    normalize(result?.stabilityScore || 0, 0, 25),
    normalize(result?.emergencySavings || 0, 0, 500000),
    normalize(result?.monthlyIncome || 0, 0, 500000),
    
    // Financial features
    normalize(result?.runwayMonths || 0, 0, 60),
    normalize(result?.riskScore || 0, 0, 100),
    normalize(result?.healthScore || 0, 0, 100),
    
    // Profile features
    result?.personalityType === 'Builder' ? 1 : 0,
    result?.personalityType === 'Survivor' ? 1 : 0,
    result?.personalityType === 'Optimizer' ? 1 : 0,
    result?.personalityType === 'Dreamer' ? 1 : 0,
    result?.personalityType === 'Risk Taker' ? 1 : 0,
  ];
}

/**
 * Feature normalization across dataset
 */
export function normalizeFeatureMatrix(matrix) {
  if (!matrix || matrix.length === 0) return matrix;
  
  const numFeatures = matrix[0].length;
  const normMatrix = [];
  
  for (let featureIdx = 0; featureIdx < numFeatures; featureIdx++) {
    const featureValues = matrix.map(row => row[featureIdx]);
    const min = Math.min(...featureValues);
    const max = Math.max(...featureValues);
    
    for (let dataIdx = 0; dataIdx < matrix.length; dataIdx++) {
      if (!normMatrix[dataIdx]) normMatrix[dataIdx] = [];
      normMatrix[dataIdx][featureIdx] = normalize(matrix[dataIdx][featureIdx], min, max);
    }
  }
  
  return normMatrix;
}

/**
 * Calculate centroid (center) of points
 */
export function calculateCentroid(points) {
  if (!points.length) return [];
  const numFeatures = points[0].length;
  const centroid = [];
  
  for (let i = 0; i < numFeatures; i++) {
    const sum = points.reduce((total, point) => total + (point[i] || 0), 0);
    centroid[i] = sum / points.length;
  }
  
  return centroid;
}

/**
 * Calculate inertia (sum of squared distances from centroids)
 */
export function calculateInertia(points, centroids, assignments) {
  let inertia = 0;
  for (let i = 0; i < points.length; i++) {
    const centroidIdx = assignments[i];
    const distance = euclideanDistance(points[i], centroids[centroidIdx]);
    inertia += distance * distance;
  }
  return inertia;
}

/**
 * Sigmoid activation function (squash values to 0-1)
 */
export function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

/**
 * ReLU activation function
 */
export function relu(x) {
  return Math.max(0, x);
}

/**
 * Softmax normalization (convert logits to probabilities)
 */
export function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const expLogits = logits.map(l => Math.exp(l - maxLogit));
  const sum = expLogits.reduce((a, b) => a + b, 0);
  return expLogits.map(exp => exp / sum);
}

/**
 * Calculate confusion matrix metrics
 */
export function calculateMetrics(predictions, actual) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  
  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i] > 0.5 ? 1 : 0;
    const act = actual[i] ? 1 : 0;
    
    if (pred === 1 && act === 1) tp++;
    else if (pred === 1 && act === 0) fp++;
    else if (pred === 0 && act === 0) tn++;
    else fn++;
  }
  
  const accuracy = (tp + tn) / (tp + tn + fp + fn);
  const precision = tp / (tp + fp || 1);
  const recall = tp / (tp + fn || 1);
  const f1 = 2 * (precision * recall) / (precision + recall || 1);
  
  return { accuracy, precision, recall, f1, tp, fp, tn, fn };
}

/**
 * Calculate R-squared (coefficient of determination)
 */
export function calculateR2(predictions, actual) {
  const meanActual = mean(actual);
  const ssTotal = actual.reduce((sum, y) => sum + Math.pow(y - meanActual, 2), 0);
  const ssRes = predictions.reduce((sum, yhat, i) => sum + Math.pow(actual[i] - yhat, 2), 0);
  
  return 1 - (ssRes / ssTotal);
}

/**
 * Calculate Mean Absolute Error
 */
export function calculateMAE(predictions, actual) {
  return predictions.reduce((sum, yhat, i) => sum + Math.abs(actual[i] - yhat), 0) / predictions.length;
}

/**
 * Calculate Root Mean Squared Error
 */
export function calculateRMSE(predictions, actual) {
  const sse = predictions.reduce((sum, yhat, i) => sum + Math.pow(actual[i] - yhat, 2), 0);
  return Math.sqrt(sse / predictions.length);
}
