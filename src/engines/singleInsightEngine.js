/**
 * Single Insight Engine
 *
 * Extracts THE single most important insight from the generated list.
 * Blueprint spec: "ARTH.OS surfaces the single most important insight.
 * Not ten. One. The most impactful one."
 *
 * Priority ranking: critical > high > medium > low
 * Within same priority: the first one encountered wins.
 */

export function getSingleMostImportantInsight(insights = []) {
  if (!insights.length) return null;

  // Priority ranking (lower number = higher priority)
  const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 };

  // Sort by priority (critical first), then by position in original array
  const sorted = [...insights].sort((a, b) => {
    const aRank = priorityRank[a.priority] ?? 99;
    const bRank = priorityRank[b.priority] ?? 99;
    if (aRank !== bRank) return aRank - bRank;
    // Same priority — keep original order (first recorded wins)
    return insights.indexOf(a) - insights.indexOf(b);
  });

  return sorted[0] || null;
}

/**
 * Get the remaining (non-primary) insights for the "show all" view.
 */
export function getSecondaryInsights(insights = []) {
  if (!insights.length) return [];
  const primary = getSingleMostImportantInsight(insights);
  if (!primary) return insights;
  return insights.filter((i) => i.id !== primary.id);
}

/**
 * Get a human-readable label for an insight's impact level.
 */
export function getImpactLabel(priority) {
  switch (priority) {
    case 'critical':
      return { label: 'Critical Impact', emoji: '🚨', className: 'impact-critical' };
    case 'high':
      return { label: 'High Impact', emoji: '⚠️', className: 'impact-high' };
    case 'medium':
      return { label: 'Moderate Impact', emoji: '📈', className: 'impact-medium' };
    case 'low':
      return { label: 'Good Progress', emoji: '✅', className: 'impact-low' };
    default:
      return { label: 'Insight', emoji: '💡', className: 'impact-default' };
  }
}

/**
 * Get a category-based color/icon for the insight.
 */
export function getCategoryMeta(category) {
  const categories = {
    Behaviour: { icon: '🧠', color: '#7c3aed' },
    Awareness: { icon: '👁️', color: '#0891b2' },
    Stability: { icon: '🛡️', color: '#059669' },
    Debt: { icon: '💰', color: '#dc2626' },
    'Cash Flow': { icon: '💸', color: '#ea580c' },
    Personality: { icon: '🎭', color: '#9333ea' },
  };
  return categories[category] || { icon: '💡', color: '#6366f1' };
}
