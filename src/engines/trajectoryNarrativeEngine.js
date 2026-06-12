export function buildTrajectoryNarrative(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return "No financial history available.";
  }

  const first = history[0];
  const last = history[history.length - 1];
  const firstScore = Number(first.score ?? first.healthScore ?? 0);
  const lastScore = Number(last.score ?? last.healthScore ?? 0);
  const delta = lastScore - firstScore;

  if (delta > 150) {
    return `Major breakthrough achieved (+${delta}) — your financial twin is accelerating into long-term stability.`;
  }

  if (delta > 50) {
    return `Consistent improvement trend (+${delta}) — steady gains are becoming your new normal.`;
  }

  if (delta > 10) {
    return `Positive recovery momentum (+${delta}) — small wins are stacking into a stronger trajectory.`;
  }

  if (delta >= -10) {
    return `Measured stability with minor volatility (${delta}) — keep reinforcing the gains.`;
  }

  if (delta >= -100) {
    return `Setback detected (${delta}) — rebalancing cash flow and savings discipline can restore momentum.`;
  }

  return `Recovery pivot required (${delta}) — the twin is signaling a deeper reset to rebuild resilience.`;
}
