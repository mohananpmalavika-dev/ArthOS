export function trackGoalEvolution(previousGoal, currentGoal) {
  return {
    changed: previousGoal !== currentGoal,
    previousGoal,
    currentGoal,
    timestamp: Date.now(),
  };
}
