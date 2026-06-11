/**
 * Decision Quality Index Engine
 * Measures the quality of financial decision-making
 * Different from health score - focuses on decision-making capacity
 *
 * Formula: (awarenessScore * 0.4 + behaviourScore * 0.4 + stabilityScore * 0.2)
 * Normalized to 0-100
 */

/**
 * Calculate Decision Quality Index
 * Higher DQI = better decision-making capacity
 * Lower DQI = decisions made under pressure/with blindspots
 */
export function calculateDecisionQualityIndex(result) {
  if (!result) {
    return {
      index: 0,
      band: "Unable to calculate",
      narrative: "",
    };
  }

  const awarenessScore = result.awarenessScore || 0;
  const behaviourScore = result.behaviourScore || 0;
  const stabilityScore = result.stabilityScore || 0;

  // Component maximums
  const maxAwareness = 30;
  const maxBehaviour = 45;
  const maxStability = 25;

  // Normalize to 0-1 scale
  const awarenessFactor = awarenessScore / maxAwareness;
  const behaviourFactor = behaviourScore / maxBehaviour;
  const stabilityFactor = stabilityScore / maxStability;

  // DQI formula: weighted average of normalized components
  const dqi = (awarenessFactor * 0.4 + behaviourFactor * 0.4 + stabilityFactor * 0.2) * 100;

  const rounded = Math.round(dqi * 10) / 10;

  return {
    index: rounded,
    band: getDecisionQualityBand(rounded),
    narrative: getDecisionQualityNarrative(rounded, result),
    componentBreakdown: {
      awareness: Math.round(awarenessFactor * 100),
      behaviour: Math.round(behaviourFactor * 100),
      stability: Math.round(stabilityFactor * 100),
    },
    whatItMeans: getDecisionQualityExplanation(rounded),
  };
}

/**
 * Map DQI to quality bands
 */
function getDecisionQualityBand(index) {
  if (index <= 20) return "Poor";
  if (index <= 35) return "Below Average";
  if (index <= 50) return "Average";
  if (index <= 70) return "Good";
  if (index <= 85) return "Very Good";
  return "Excellent";
}

/**
 * Generate narrative explaining the DQI score
 */
function getDecisionQualityNarrative(index, result) {
  if (index <= 20) {
    return "Your financial decisions are likely made under stress, with incomplete information, or with inconsistent follow-through. High risk of regret or suboptimal outcomes.";
  }

  if (index <= 35) {
    return "Your decision-making is limited by awareness gaps or impulse patterns. You likely make okay short-term decisions but struggle with longer-term planning.";
  }

  if (index <= 50) {
    return "Your decision quality is moderate. You have decent awareness but could improve discipline or stability. Decisions are reasonably sound.";
  }

  if (index <= 70) {
    return "You make good financial decisions most of the time. Clear enough visibility + decent discipline + reasonable stability combine for reliable choices.";
  }

  if (index <= 85) {
    return "Very strong decision-making. You have clarity, control, and resilience. Your financial decisions are consistently sound.";
  }

  return "Excellent decision quality. You make thoughtful, informed, resilient financial choices. You're well-positioned to handle complexity.";
}

/**
 * Plain-language explanation of what DQI means
 */
function getDecisionQualityExplanation(index) {
  if (index <= 30) {
    return "You're making emergency decisions, not strategic ones.";
  }
  if (index <= 50) {
    return "You make decisions, but blindspots and impulses interfere.";
  }
  if (index <= 70) {
    return "Your decisions are generally sound and well-reasoned.";
  }
  return "You consistently make strategic, well-informed financial decisions.";
}

/**
 * Identify which component is constraining decision quality most
 */
export function getDecisionQualityConstraint(result) {
  if (!result) return null;

  const awarenessScore = result.awarenessScore || 0;
  const behaviourScore = result.behaviourScore || 0;
  const stabilityScore = result.stabilityScore || 0;

  // Normalize
  const awarenessNorm = awarenessScore / 30;
  const behaviourNorm = behaviourScore / 45;
  const stabilityNorm = stabilityScore / 25;

  // Find lowest
  const components = [
    { name: "Awareness", score: awarenessNorm, impact: 0.4 },
    { name: "Behaviour", score: behaviourNorm, impact: 0.4 },
    { name: "Stability", score: stabilityNorm, impact: 0.2 },
  ];

  const sorted = components.sort((a, b) => a.score - b.score);
  const lowestComponent = sorted[0];

  if (lowestComponent.score >= 0.8) {
    return null; // All components strong
  }

  return {
    component: lowestComponent.name,
    relativeWeakness: (1 - lowestComponent.score) * 100,
    impact: lowestComponent.impact,
    recommendation: getConstraintRecommendation(lowestComponent.name),
  };
}

/**
 * Recommendation for addressing the constraint
 */
function getConstraintRecommendation(component) {
  if (component === "Awareness") {
    return "Improving visibility into your finances will immediately improve decision quality. Start with a 14-day expense audit.";
  }
  if (component === "Behaviour") {
    return "Strengthening discipline and impulse control will make your decisions more consistent. Try the 24-hour waiting rule.";
  }
  if (component === "Stability") {
    return "Building financial resilience will reduce panic-driven decisions. Focus on emergency fund and income stability.";
  }
  return "Focus on the weakest area from the assessment.";
}

/**
 * Predict how decision quality will change if interventions are completed
 */
export function projectDecisionQualityAfterIntervention(result, interventions) {
  if (!result || !interventions || interventions.length === 0) {
    return result;
  }

  // Each intervention adds estimated points
  let projectedAwareness = result.awarenessScore || 0;
  let projectedBehaviour = result.behaviourScore || 0;
  let projectedStability = result.stabilityScore || 0;

  interventions.forEach((intervention) => {
    // Parse impact text: "+6 Awareness" or "+4 Behaviour"
    const impactMatch = intervention.impact.match(/([+-])(\d+)\s+(\w+)/);
    if (!impactMatch) return;

    const [, sign, points, component] = impactMatch;
    const delta = parseInt(points) * (sign === "+" ? 1 : -1);

    if (component === "Awareness") projectedAwareness += delta;
    if (component === "Behaviour") projectedBehaviour += delta;
    if (component === "Stability") projectedStability += delta;
  });

  // Cap at component maximums
  projectedAwareness = Math.min(projectedAwareness, 30);
  projectedBehaviour = Math.min(projectedBehaviour, 45);
  projectedStability = Math.min(projectedStability, 25);

  // Calculate projected DQI
  const currentDQI = calculateDecisionQualityIndex(result).index;

  const projectedResult = {
    ...result,
    awarenessScore: projectedAwareness,
    behaviourScore: projectedBehaviour,
    stabilityScore: projectedStability,
  };

  const projectedDQI = calculateDecisionQualityIndex(projectedResult).index;

  return {
    currentDQI,
    projectedDQI,
    improvement: Math.round((projectedDQI - currentDQI) * 10) / 10,
    interventionCount: interventions.length,
  };
}
