/**
 * milestoneEngine.js
 * Detects progress milestones and achievement badges from score history,
 * checkin streaks, and assessment patterns.
 */

const MILESTONE_STORAGE_KEY = "arth-os-milestones";

// All possible badge definitions
const BADGE_DEFINITIONS = [
  // --- Score milestones ---
  { id: "first_assessment", label: "First Steps", description: "Completed your first financial health assessment", icon: "🌟", category: "score" },
  { id: "score_30", label: "On Your Way", description: "Reached a financial health score of 30+", icon: "📈", category: "score", check: (s) => s >= 30 },
  { id: "score_50", label: "Halfway There", description: "Reached a financial health score of 50+", icon: "🔥", category: "score", check: (s) => s >= 50 },
  { id: "score_70", label: "Resilient", description: "Reached a financial health score of 70+", icon: "💪", category: "score", check: (s) => s >= 70 },
  { id: "score_90", label: "Sovereign", description: "Reached a financial health score of 90+", icon: "👑", category: "score", check: (s) => s >= 90 },
  { id: "score_100", label: "Perfect Score", description: "Achieved a perfect financial health score", icon: "🏆", category: "score", check: (s) => s >= 100 },

  // --- Streak milestones ---
  { id: "streak_3", label: "Consistency Starter", description: "3-day check-in streak", icon: "📅", category: "streak", check: (s) => s >= 3 },
  { id: "streak_7", label: "Week Warrior", description: "7-day check-in streak", icon: "📅", category: "streak", check: (s) => s >= 7 },
  { id: "streak_14", label: "Fortnight Focus", description: "14-day check-in streak", icon: "📅", category: "streak", check: (s) => s >= 14 },
  { id: "streak_30", label: "Monthly Master", description: "30-day check-in streak", icon: "📅", category: "streak", check: (s) => s >= 30 },

  // --- Improvement milestones ---
  { id: "improve_10", label: "Rising Star", description: "Improved your score by 10+ points from first assessment", icon: "⭐", category: "improvement", check: (d) => d >= 10 },
  { id: "improve_25", label: "Momentum Builder", description: "Improved your score by 25+ points from first assessment", icon: "⭐", category: "improvement", check: (d) => d >= 25 },
  { id: "improve_50", label: "Transformation", description: "Improved your score by 50+ points from first assessment", icon: "🌈", category: "improvement", check: (d) => d >= 50 },

  // --- Assessment count ---
  { id: "assess_5", label: "Dedicated", description: "Completed 5 assessments", icon: "📋", category: "count", check: (c) => c >= 5 },
  { id: "assess_10", label: "Committed", description: "Completed 10 assessments", icon: "📋", category: "count", check: (c) => c >= 10 },
  { id: "assess_25", label: "Veteran", description: "Completed 25 assessments", icon: "📋", category: "count", check: (c) => c >= 25 },

  // --- Decision tracking ---
  { id: "decision_5", label: "Decision Maker", description: "Tracked 5 financial decisions", icon: "🎯", category: "decisions", check: (c) => c >= 5 },
  { id: "decision_25", label: "Strategy Builder", description: "Tracked 25 financial decisions", icon: "🎯", category: "decisions", check: (c) => c >= 25 },

  // --- Special ---
  { id: "sms_enrich", label: "Data Detective", description: "Enriched your assessment with banking data", icon: "🔍", category: "special" },
  { id: "twin_simulated", label: "Future Gazer", description: "Simulated your financial twin scenarios", icon: "🔮", category: "special" },
  { id: "partner_connected", label: "Ecosystem Player", description: "Connected to the ARTH.OS partner ecosystem", icon: "🔗", category: "special" },
];

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeRead(key) {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function safeWrite(key, value) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('[milestoneEngine] Failed to persist milestones:', {
      key,
      error: error?.message,
      code: error?.code,
    });
  }
}

/** Load all unlocked milestone IDs */
export function loadMilestones() {
  return safeRead(MILESTONE_STORAGE_KEY);
}

/** Check if a specific badge is unlocked */
export function hasMilestone(badgeId) {
  return loadMilestones().includes(badgeId);
}

/** Unlock a milestone — returns true if newly unlocked */
export function unlockMilestone(badgeId) {
  const current = loadMilestones();
  if (current.includes(badgeId)) return false; // already unlocked
  current.push(badgeId);
  safeWrite(MILESTONE_STORAGE_KEY, current);
  return true;
}

/** Get full badge definition by ID */
export function getBadgeDef(badgeId) {
  return BADGE_DEFINITIONS.find((b) => b.id === badgeId) || null;
}

/** Get all badge definitions (useful for seeding UI) */
export function getAllBadgeDefs() {
  return BADGE_DEFINITIONS;
}

/** Get unlocked badges with their definitions */
export function getUnlockedBadges() {
  const ids = loadMilestones();
  return ids
    .map((id) => BADGE_DEFINITIONS.find((b) => b.id === id))
    .filter(Boolean);
}

/** Get locked badge definitions (still achievable) */
export function getLockedBadgeDefs() {
  const unlockedIds = loadMilestones();
  return BADGE_DEFINITIONS.filter((b) => !unlockedIds.includes(b.id));
}

/**
 * Check and unlock milestones based on current app state.
 * Returns an array of newly unlocked badges (for showing a popup).
 */
export function checkAndUnlockMilestones({
  currentScore,
  firstScore,
  earliestScore,
  assessmentCount,
  streak,
  decisionCount,
  hasSmsEnrichment,
  hasTwinSimulation,
  hasPartnerConnection,
}) {
  if (!isBrowser()) return [];

  const newlyUnlocked = [];
  const improvement = firstScore != null ? currentScore - firstScore : 0;

  for (const badge of BADGE_DEFINITIONS) {
    if (loadMilestones().includes(badge.id)) continue;

    let shouldUnlock = false;

    switch (badge.category) {
      case "score":
        if (badge.check && currentScore != null) shouldUnlock = badge.check(currentScore);
        // first_assessment is special — auto-unlock on first score
        if (badge.id === "first_assessment" && currentScore > 0 && assessmentCount >= 1) shouldUnlock = true;
        break;
      case "streak":
        if (badge.check) shouldUnlock = badge.check(streak);
        break;
      case "improvement":
        if (badge.check) shouldUnlock = badge.check(improvement);
        break;
      case "count":
        if (badge.check) shouldUnlock = badge.check(assessmentCount);
        break;
      case "decisions":
        if (badge.check) shouldUnlock = badge.check(decisionCount);
        break;
      case "special":
        if (badge.id === "sms_enrich" && hasSmsEnrichment) shouldUnlock = true;
        if (badge.id === "twin_simulated" && hasTwinSimulation) shouldUnlock = true;
        if (badge.id === "partner_connected" && hasPartnerConnection) shouldUnlock = true;
        break;
    }

    if (shouldUnlock) {
      unlockMilestone(badge.id);
      newlyUnlocked.push(badge);
    }
  }

  return newlyUnlocked;
}

/** Returns counts for a progress dashboard */
export function getMilestoneStats() {
  const unlocked = loadMilestones();
  return {
    unlockedCount: unlocked.length,
    totalCount: BADGE_DEFINITIONS.length,
    unlockedBadges: getUnlockedBadges(),
    lockedBadges: getLockedBadgeDefs(),
    progress: Math.round((unlocked.length / BADGE_DEFINITIONS.length) * 100),
  };
}
