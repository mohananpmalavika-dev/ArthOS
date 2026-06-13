export function generateMemoryInsight(history = []) {
  const salaryEvent = history.find(
    h =>
      h.event === "salary_hike" ||
      h.event === "salary_increase" ||
      (typeof h.description === "string" && h.description.toLowerCase().includes("salary"))
  );

  if (!salaryEvent) {
    return null;
  }

  return {
    insight: "Previous salary increase resulted in elevated spending.",
    source: salaryEvent,
    generatedAt: new Date().toISOString()
  };
}
