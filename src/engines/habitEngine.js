export function evaluateHabitProgress(history = []) {
  const safe = history || [];
  const last4Weeks = safe.slice(-4);
  const consistency = last4Weeks.filter(x => x.completed).length;

  return {
    score: Math.min(100, consistency * 25),
    milestone: consistency >= 4 ? "Habit Locked" : "In Progress",
    weeksReviewed: last4Weeks.length
  };
}
