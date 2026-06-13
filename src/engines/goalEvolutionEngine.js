/**
 * L10: Goal Evolution Engine — v2 Production Upgrade
 *
 * Full longitudinal history tracking for financial goal changes over time.
 * Records goal transitions with timestamps, reasons, and server-side sync.
 * The financialMemoryEngine.js handles persistence; this engine manages
 * the evolution logic and analysis.
 *
 * Blueprint spec: "Longitudinal behaviour history and goal evolution tracking"
 * Previously: single-point timestamp comparison (prototype).
 * Now: full goal transition history with pattern detection and trend analysis.
 */

const API_BASE = "/api";

async function apiPost(endpoint, payload) {
  try {
    const resp = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

const GOAL_HISTORY_KEY = "arth-os-goal-evolution";

function loadLocalHistory() {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(GOAL_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistLocalHistory(history) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(GOAL_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

/**
 * Record a goal change/evolution event.
 * Stores: previous goal, current goal, timestamp, reason/source, and
 * optionally a sentiment score (+/- indicating improvement or regression).
 *
 * @param {string} previousGoal - The user's previous financial goal
 * @param {string} currentGoal - The user's current financial goal
 * @param {object} [options] - Additional metadata
 * @param {string} [options.userId] - User ID for server-side sync
 * @param {string} [options.reason] - Why the goal changed
 * @param {number} [options.sentiment] - 1=upgrade, 0=sideways, -1=downgrade
 * @returns {object} The recorded event
 */
export function trackGoalEvolution(previousGoal, currentGoal, options = {}) {
  const { userId, reason, sentiment } = options;

  const changed = previousGoal !== currentGoal;
  const event = {
    changed,
    previousGoal: previousGoal || null,
    currentGoal: currentGoal || null,
    reason: reason || null,
    sentiment: sentiment ?? (changed ? 0 : 0),
    timestamp: new Date().toISOString(),
  };

  // Load existing history, append, persist
  const history = loadLocalHistory();
  history.push(event);
  persistLocalHistory(history);

  // Server-side sync (fire-and-forget)
  if (userId && changed) {
    apiPost("/memory/goal", { userId, ...event }).catch((error) => {
      console.warn('[goalEvolutionEngine] Failed to sync goal evolution to server:', {
        userId,
        goalId: event?.id,
        error: error?.message,
      });
    });
  }

  return event;
}

/**
 * Load full goal evolution history, sorted most recent first.
 * @returns {Array} Sorted goal events
 */
export function loadGoalHistory() {
  const history = loadLocalHistory();
  return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Get summary statistics for goal evolution over a time period.
 * @param {Array} [history] - Pre-loaded history or uses local storage
 * @returns {object} Summary stats
 */
export function getGoalEvolutionSummary(history) {
  const h = history || loadLocalHistory();
  if (!h.length) {
    return {
      totalChanges: 0,
      currentGoal: null,
      previousGoal: null,
      evolutionCount: 0,
      trend: 'no_data',
    };
  }

  const sorted = [...h].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const latest = sorted[0];
  const changes = sorted.filter((e) => e.changed);

  // Sentiment analysis
  const upgrades = changes.filter((e) => e.sentiment > 0).length;
  const downgrades = changes.filter((e) => e.sentiment < 0).length;
  const stability = changes.length === 0 ? 'stable'
    : upgrades > downgrades ? 'improving'
    : downgrades > upgrades ? 'regressing'
    : 'fluctuating';

  return {
    totalChanges: changes.length,
    currentGoal: latest.currentGoal,
    previousGoal: latest.previousGoal,
    latestChange: latest.timestamp,
    evolutionCount: sorted.length,
    upgrades,
    downgrades,
    stability,
    trend: sorted.length < 2 ? 'single_observation' : stability,
    latestEvent: latest,
  };
}

/**
 * Detect goal pattern shifts — e.g., user repeatedly oscillates between
 * saving and spending goals, indicating indecision.
 * @param {Array} [history] - Goal history
 * @returns {object|null} Pattern analysis
 */
export function detectGoalPatterns(history) {
  const h = history || loadLocalHistory();
  if (h.length < 3) return null;

  const uniqueGoals = new Set(h.map((e) => e.currentGoal).filter(Boolean));
  const changes = h.filter((e) => e.changed);

  // Oscillation detection: same goal appearing multiple times
  const goalCounts = {};
  h.forEach((e) => {
    if (e.currentGoal) {
      goalCounts[e.currentGoal] = (goalCounts[e.currentGoal] || 0) + 1;
    }
  });
  const oscillatingGoals = Object.entries(goalCounts)
    .filter(([, count]) => count > 2)
    .map(([goal]) => goal);

  return {
    totalUniqueGoals: uniqueGoals.size,
    totalChanges: changes.length,
    oscillatingGoals: oscillatingGoals.length > 0 ? oscillatingGoals : null,
    pattern: oscillatingGoals.length > 0
      ? 'oscillating'
      : uniqueGoals.size <= 2 && changes.length > 0
        ? 'focused'
        : 'exploring',
    insight: oscillatingGoals.length > 0
      ? `You've returned to "${oscillatingGoals[0]}" multiple times — clarify your primary financial priority.`
      : uniqueGoals.size <= 2
        ? 'Your goal direction is consistent and focused.'
        : 'You are exploring different financial goals — consider narrowing to 1-2 priorities.',
  };
}

/**
 * Clear all goal history (for testing or reset).
 */
export function clearGoalHistory() {
  persistLocalHistory([]);
}

// Backward-compatible export for older consumers
export { trackGoalEvolution as deprecatedTrackGoalEvolution };
