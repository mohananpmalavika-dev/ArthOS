/**
 * peerComparisonEngine.js
 * Generates anonymized peer comparison data showing where the user's score
 * falls relative to a simulated distribution. All data is local — no external
 * data sharing required.
 */

/**
 * Generate a bell-curve-like distribution of scores around a midpoint,
 * modeling what anonymized peers might look like.
 * @param {number} userScore - The current user's financial health score (0-100)
 * @param {number} sampleSize - Number of simulated peer data points
 * @returns {{ distribution: number[], userPercentile: number, stats: object }}
 */
export function generatePeerDistribution(userScore, sampleSize = 1000) {
  // Start with a baseline distribution centered around 35-45 (typical user base)
  // and shift based on the user's score (users with higher scores exist in a
  // slightly higher-average population)
  const baseMean = 38;
  const baseStd = 18;

  // The user's score shifts the distribution slightly toward their level
  const shift = (userScore - baseMean) * 0.15;
  const mean = baseMean + shift;
  const std = baseStd;

  // Generate normally distributed samples using Box-Muller transform
  const distribution = [];
  for (let i = 0; i < sampleSize; i++) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const sample = Math.round(Math.max(0, Math.min(100, mean + z * std)));
    distribution.push(sample);
  }

  // Calculate user's percentile rank
  const belowUser = distribution.filter(s => s < userScore).length;
  const atUser = distribution.filter(s => s === userScore).length;
  const userPercentile = Math.round(((belowUser + atUser / 2) / sampleSize) * 100);

  // Bucket into ranges for charting
  const buckets = [];
  for (let i = 0; i <= 100; i += 10) {
    const label = `${i}-${i + 9}`;
    const count = distribution.filter(s => s >= i && s <= i + 9).length;
    buckets.push({ label, count, percent: Math.round((count / sampleSize) * 100) });
  }

  // Stats
  const sorted = [...distribution].sort((a, b) => a - b);
  const avg = Math.round(sorted.reduce((s, v) => s + v, 0) / sorted.length);
  const median = sorted[Math.floor(sorted.length / 2)];

  return {
    distribution,
    userPercentile,
    stats: {
      average: avg,
      median,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      sampleSize,
      userScore
    },
    buckets
  };
}

/**
 * Get a human-readable peer comparison summary.
 */
export function getPeerSummary(userScore, percentile) {
  if (percentile >= 90) {
    return "You're in the top 10% of financial health scores. Outstanding!";
  }
  if (percentile >= 75) {
    return "You're in the top quarter — ahead of most peers.";
  }
  if (percentile >= 50) {
    return "You're above average, performing better than half of users.";
  }
  if (percentile >= 25) {
    return "You're in the middle range with room to grow.";
  }
  return "You're in the early stages — every point up moves you ahead of others.";
}

/**
 * Get percentile emoji indicator
 */
export function getPercentileEmoji(percentile) {
  if (percentile >= 90) {
    return "🏆";
  }
  if (percentile >= 75) {
    return "👏";
  }
  if (percentile >= 50) {
    return "👍";
  }
  if (percentile >= 25) {
    return "📊";
  }
  return "🌱";
}
