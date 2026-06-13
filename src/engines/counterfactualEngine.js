export function compareAlternatives(actual = {}, alternative = {}) {
  const actualScore = actual.score || actual.overallDecisionQuality || 50;
  const alternativeScore = alternative.score || alternative.overallDecisionQuality || 50;
  const scoreDifference = alternativeScore - actualScore;

  return {
    actualScore,
    alternativeScore,
    scoreDifference,
    better: scoreDifference > 0 ? "alternative" : scoreDifference < 0 ? "actual" : "tie",
    recommendation:
      scoreDifference > 0
        ? "Alternative decision would have yielded better outcome"
        : scoreDifference < 0
          ? "Your actual decision was the better choice"
          : "Both decisions were equally sound",
    regretPotential: Math.abs(scoreDifference),
    timestamp: new Date().toISOString()
  };
}

export function simulateCounterfactual(decision = {}, scenario = {}) {
  const baseScore = decision.overallDecisionQuality || 50;
  const scenarioImpact = scenario.impact || 0;
  const projectedScore = Math.max(0, Math.min(100, baseScore + scenarioImpact));

  return {
    baseDecision: decision,
    scenario,
    projectedScore,
    improvement: projectedScore - baseScore,
    learningInsight:
      projectedScore > baseScore
        ? `If you had ${scenario.description || "adjusted your approach"}, this decision would have scored ${projectedScore}.`
        : `Your actual decision path was more resilient than the alternative scenario.`
  };
}
