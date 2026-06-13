/**
 * Scoring Helpers — Centralized utilities for component scoring
 * Reduces duplication of:
 * - Lowest component extraction
 * - Component key comparisons
 * - Component max score lookups
 * - Component label formatting
 */

/**
 * Component configuration: keys, labels, and max scores
 */
const COMPONENTS = {
  behaviour: {
    key: "behaviour",
    label: "Behaviour",
    maxScore: 45,
    description: "Impulse control and spending discipline"
  },
  awareness: {
    key: "awareness",
    label: "Awareness",
    maxScore: 30,
    description: "Financial tracking and visibility"
  },
  stability: {
    key: "stability",
    label: "Stability",
    maxScore: 25,
    description: "Emergency reserves and income resilience"
  }
};

/**
 * Component keys for iteration
 */
export const COMPONENT_KEYS = Object.keys(COMPONENTS);

/**
 * Get component configuration by key
 */
export function getComponentConfig(key) {
  return COMPONENTS[key?.toLowerCase()] || COMPONENTS.behaviour;
}

/**
 * Get display label for component key (e.g., "behaviour" → "Behaviour")
 */
export function getComponentLabel(key) {
  return getComponentConfig(key).label;
}

/**
 * Get maximum score for component (e.g., "behaviour" → 45)
 */
export function getComponentMaxScore(key) {
  return getComponentConfig(key).maxScore;
}

/**
 * Get component description
 */
export function getComponentDescription(key) {
  return getComponentConfig(key).description;
}

/**
 * Normalize component key for comparison
 * Handles both "behaviour"/"Behaviour" formats
 */
export function normalizeComponentKey(key) {
  return key?.toLowerCase() || "behaviour";
}

/**
 * Check if component key matches target
 * Normalizes both to lowercase for comparison
 */
export function isComponentKey(key, targetKey) {
  return normalizeComponentKey(key) === normalizeComponentKey(targetKey);
}

/**
 * Get the lowest scoring component from an array
 * Handles both formats: [{key, score, ...}] and [{label, score, ...}]
 */
export function getLowestScoringComponent(components) {
  if (!Array.isArray(components) || components.length === 0) {
    return null;
  }
  return components.reduce((lowest, current) =>
    (current.score ?? current.percent ?? 0) < (lowest.score ?? lowest.percent ?? 0)
      ? current
      : lowest
  );
}

/**
 * Get the second lowest scoring component
 */
export function getSecondLowestScoringComponent(components) {
  if (!Array.isArray(components) || components.length < 2) {
    return null;
  }
  const sorted = [...components].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  return sorted[1] || null;
}

/**
 * Extract component key from either key property or label property
 * Normalizes to lowercase key format
 */
export function extractComponentKey(component) {
  if (!component) return "behaviour";
  if (component.key) return normalizeComponentKey(component.key);
  if (component.label) return normalizeComponentKey(component.label);
  return "behaviour";
}

/**
 * Get diagnostic headline based on lowest component
 */
export function getDiagnosticHeadline(componentKey) {
  const key = normalizeComponentKey(componentKey);
  switch (key) {
    case "behaviour":
      return "Your biggest problem is behavior, not just the score.";
    case "awareness":
      return "Your largest blind spot is runway awareness.";
    case "stability":
      return "Your biggest problem is runway stability.";
    default:
      return "Your financial profile needs attention.";
  }
}

/**
 * Get focus area recommendation based on component
 */
export function getFocusArea(componentKey) {
  const key = normalizeComponentKey(componentKey);
  switch (key) {
    case "behaviour":
      return "Improve your purchase discipline and spend controls first.";
    case "awareness":
      return "Track expenses and top expenses clearly before acting on other decisions.";
    case "stability":
      return "Prioritize emergency savings and manageable debt repayment pacing.";
    default:
      return "Focus on your weakest component to create the fastest improvement.";
  }
}

/**
 * List all component keys for iteration
 */
export function getAllComponentKeys() {
  return Object.keys(COMPONENTS);
}

/**
 * Get all component configurations
 */
export function getAllComponents() {
  return Object.values(COMPONENTS);
}

/**
 * Validate that a key is a valid component
 */
export function isValidComponentKey(key) {
  return COMPONENT_KEYS.includes(normalizeComponentKey(key));
}
