export function calculateConfidence(historyLength = 0, decisionsTracked = 0) {
  const score = (Number(historyLength) || 0) * 4 + (Number(decisionsTracked) || 0) * 2;
  return Math.min(100, Math.max(0, score));
}
