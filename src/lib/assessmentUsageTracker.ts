/**
 * src/lib/assessmentUsageTracker.ts
 * Assessment Usage Tracker with TypeScript
 * Tracks assessment count per month to enforce tier-based limits
 * 
 * Free tier: 1x/month
 * Plus+: Unlimited
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type UserTier = 'free' | 'plus' | 'pro' | 'premium';

interface AssessmentUsage {
  month: string;           // YYYY-MM format
  count: number;
  dates: string[];         // ISO date strings of assessments
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'arth_assessment_usage';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current month in YYYY-MM format
 * @returns Current month string in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// ============================================================================
// ASSESSMENT TRACKING
// ============================================================================

/**
 * Get usage data for the current month
 * @returns AssessmentUsage object for current month, or null on error
 */
export function getMonthlyUsage(): AssessmentUsage | null {
  try {
    if (typeof window === 'undefined') return null;

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const usage: AssessmentUsage[] = JSON.parse(data);
    const currentMonth = getCurrentMonth();

    // Find current month's usage
    const monthlyUsage = usage.find((u) => u.month === currentMonth);
    return monthlyUsage || { month: currentMonth, count: 0, dates: [] };
  } catch (error) {
    console.error('Error reading assessment usage:', error);
    return null;
  }
}

/**
 * Record assessment completion
 * @returns True if recording was successful, false otherwise
 */
export function recordAssessment(): boolean {
  try {
    if (typeof window === 'undefined') return false;

    const currentMonth = getCurrentMonth();
    let usageHistory: AssessmentUsage[] = [];

    // Read existing data
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      usageHistory = JSON.parse(existing);
    }

    // Find or create current month entry
    let monthEntry = usageHistory.find((u) => u.month === currentMonth);
    if (!monthEntry) {
      monthEntry = { month: currentMonth, count: 0, dates: [] };
      usageHistory.push(monthEntry);
    }

    // Increment count
    monthEntry.count += 1;
    monthEntry.dates.push(new Date().toISOString());

    // Keep only last 12 months to avoid bloating localStorage
    usageHistory = usageHistory.slice(-12);

    // Save back
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usageHistory));
    return true;
  } catch (error) {
    console.error('Error recording assessment:', error);
    return false;
  }
}

/**
 * Check if user can take another assessment based on tier
 * @param tier - User subscription tier
 * @returns True if user can take another assessment, false otherwise
 */
export function canTakeAnotherAssessment(tier: UserTier = 'free'): boolean {
  // Plus and above have unlimited assessments
  if (tier !== 'free') return true;

  const usage = getMonthlyUsage();
  if (!usage) return true; // Default to allowing if no data

  // Free tier: max 1 per month
  return usage.count < 1;
}

/**
 * Get remaining assessments for this month
 * @param tier - User subscription tier
 * @returns Number of remaining assessments, or null for unlimited tiers
 */
export function getRemainingAssessments(tier: UserTier = 'free'): number | null {
  if (tier !== 'free') return null; // Unlimited

  const usage = getMonthlyUsage();
  if (!usage) return 1;

  const limit = 1;
  return Math.max(0, limit - usage.count);
}

/**
 * Get the date of the last completed assessment
 * @returns Date of last assessment, or null if none found
 */
export function getLastAssessmentDate(): Date | null {
  const usage = getMonthlyUsage();
  if (!usage || usage.dates.length === 0) return null;

  return new Date(usage.dates[usage.dates.length - 1]);
}

/**
 * Get the count of assessments for a specific month
 * @param monthStr - Month string in YYYY-MM format
 * @returns Count of assessments in that month, or null if not found
 */
export function getUsageForMonth(monthStr: string): number | null {
  try {
    if (typeof window === 'undefined') return null;

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const usage: AssessmentUsage[] = JSON.parse(data);
    const monthUsage = usage.find((u) => u.month === monthStr);

    return monthUsage?.count ?? null;
  } catch (error) {
    console.error(`Error reading usage for month ${monthStr}:`, error);
    return null;
  }
}

/**
 * Get all assessment usage history
 * @returns Array of AssessmentUsage objects
 */
export function getUsageHistory(): AssessmentUsage[] {
  try {
    if (typeof window === 'undefined') return [];

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading assessment history:', error);
    return [];
  }
}

/**
 * Clear assessment data (for testing or reset)
 */
export function clearAssessmentData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing assessment data:', error);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getMonthlyUsage,
  recordAssessment,
  canTakeAnotherAssessment,
  getRemainingAssessments,
  getLastAssessmentDate,
  getUsageForMonth,
  getUsageHistory,
  clearAssessmentData,
};
