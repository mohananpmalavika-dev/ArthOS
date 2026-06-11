function normalizeScore(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 50;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function detectBias(decision = {}) {
  const text = String(decision.notes || '').toLowerCase();
  let score = 50;
  if (text.includes('urgent') || text.includes('now') || text.includes('must')) score -= 10;
  if (text.includes('fear') || text.includes('lose') || text.includes('loss')) score -= 10;
  if (text.includes('always') || text.includes('never')) score -= 8;
  if (text.includes('may') || text.includes('could') || text.includes('hope')) score += 5;
  return Math.max(0, Math.min(100, score));
}

function detectTimeOrientation(decision = {}) {
  const text = String(decision.notes || '').toLowerCase();
  if (/\b(future|later|planning|goal|long-term)\b/.test(text)) return 90;
  if (/\b(today|now|urgent|immediately|this week)\b/.test(text)) return 50;
  return 70;
}

function calculateGoalAlignment(decision = {}) {
  if (decision.goalAlignment === true) return 90;
  if (decision.goalAlignment === false) return 40;
  return normalizeScore(decision.goalAlignment || 50);
}

function calculateValues(decision = {}) {
  if (typeof decision.valueConsistency === 'number') return normalizeScore(decision.valueConsistency);
  const text = String(decision.notes || '').toLowerCase();
  if (text.includes('savings') || text.includes('invest') || text.includes('plan')) return 80;
  return 60;
}

export function scoreDecision(decision = {}) {
  const goalAlignment = calculateGoalAlignment(decision);
  const valueConsistency = calculateValues(decision);
  const biasEvidence = detectBias(decision);
  const timeOrientation = detectTimeOrientation(decision);

  const overallDecisionQuality = Math.round((goalAlignment + valueConsistency + biasEvidence + timeOrientation) / 4);

  return {
    ...decision,
    timestamp: decision.timestamp || new Date().toISOString(),
    goalAlignment,
    valueConsistency,
    biasEvidence,
    timeOrientation,
    overallDecisionQuality,
  };
}

export function decisionTrend(decisions = []) {
  if (!decisions.length) {
    return { currentScore: 0, trend: 'Unknown' };
  }

  const scored = decisions.map((d) => normalizeScore(d.overallDecisionQuality || d.score || 50));
  const avg = Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);

  return {
    currentScore: avg,
    trend: avg > 70 ? 'Improving' : 'At Risk',
  };
}
