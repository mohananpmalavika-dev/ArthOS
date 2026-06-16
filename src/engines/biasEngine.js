function clamp(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeInput(value, fallback = 50) {
  if (typeof value === "number" && !Number.isNaN(value)) {
    if (value >= 0 && value <= 1) {
      return clamp(value * 100);
    }
    return clamp(value);
  }
  return fallback;
}

function severityFromScore(score) {
  if (score <= 0) return 'none';
  if (score <= 30) return 'low';
  if (score <= 60) return 'moderate';
  return 'high';
}

function buildBiasResult(label, score, recommendation) {
  const severity = severityFromScore(score);
  return {
    detected: severity !== 'none',
    severity,
    score,
    recommendation: severity === 'none' ? undefined : recommendation,
    label,
  };
}

function booleanScore(value) {
  if (typeof value === 'boolean') {
    return value ? 80 : 10;
  }
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (['yes', 'true', 'extremely', 'very_high', 'very_slowly', 'unchanging', 'follows_initial_budget'].includes(normalized)) {
      return 85;
    }
    if (['no', 'false', 'low', 'slowly', 'changeable', 'varies'].includes(normalized)) {
      return 15;
    }
  }
  if (typeof value === 'number') {
    return normalizeInput(value);
  }
  return 50;
}

export function detectBiases(user = {}) {
  const anchoringScore = Math.round(
    (booleanScore(user.follows_initial_budget) * 0.4) +
    (booleanScore(user.reacts_to_new_info === 'very_slowly' ? 'very_slowly' : 'slowly') * 0.6)
  );

  const availabilityScore = Math.round(
    (booleanScore(user.recent_losses) * 0.3) +
    (booleanScore(user.risk_perception === 'very_high' ? 'very_high' : user.risk_perception) * 0.4) +
    (booleanScore(user.makes_decisions_based_on === 'recent_events' ? 'recent_events' : 'historical_data') * 0.3)
  );

  const confirmationScore = Math.round(
    (user.seeks_diverse_info === false ? 45 : 15) +
    (user.ignores_contrary_evidence === true ? 45 : 15) +
    (user.financial_beliefs === 'unchanging' ? 25 : 10)
  );

  const lossAversionScore = Math.round(
    (user.avoids_losses === 'extremely' ? 55 : booleanScore(user.avoids_losses)) +
    (user.risk_tolerance === 'very_low' ? 30 : booleanScore(user.risk_tolerance)) +
    (user.has_made_risky_investments === false ? 15 : 0)
  );

  const overconfidenceScore = Math.round(
    (booleanScore(user.believes_better_than_average) * 0.5) +
    ((normalizeInput(user.prediction_accuracy_perceived ?? 50) - normalizeInput(user.prediction_accuracy_actual ?? 50)) * 0.5)
  );

  return {
    anchoring: buildBiasResult(
      'anchoring',
      anchoringScore,
      'Re-evaluate new information and avoid anchoring on the first estimate.'
    ),
    availability: buildBiasResult(
      'availability',
      availabilityScore,
      'Broaden evidence beyond recent examples to reduce availability bias.'
    ),
    confirmation: buildBiasResult(
      'confirmation',
      confirmationScore,
      'Actively seek contrary evidence and question assumptions.'
    ),
    loss_aversion: buildBiasResult(
      'loss_aversion',
      lossAversionScore,
      'Balance loss avoidance with objective long-term risk assessment.'
    ),
    overconfidence: buildBiasResult(
      'overconfidence',
      overconfidenceScore,
      'Check predictions against actual outcomes and calibrate expectations.'
    ),
  };
}

export function calculateRiskCalibration(perceivedRisk = 50, actualRisk = 50, weight = 1) {
  const p = normalizeInput(perceivedRisk, 50);
  const a = normalizeInput(actualRisk, 50);
  const rawGap = (p - a) * weight;
  return Math.max(-100, Math.min(100, rawGap));
}
