/**
 * Assessment Usage Tracker
 * Tracks assessment count per month to enforce tier-based limits
 * 
 * Free tier: 1x/month
 * Plus+: Unlimited
 */

const STORAGE_KEY = 'arth_assessment_usage';

/**
 * @typedef {Object} AssessmentUsage
 * @property {string} month - YYYY-MM format
 * @property {number} count
 * @property {string[]} dates - ISO date strings of assessments
 */

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get usage for current month
 */
export function getMonthlyUsage() {
  try {
    if (typeof window === 'undefined') return null;

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const usage = JSON.parse(data);
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
 */
export function recordAssessment() {
  try {
    if (typeof window === 'undefined') return false;

    const currentMonth = getCurrentMonth();
    let usageHistory = [];

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
 * Check if user can take another assessment (for free tier)
 */
export function canTakeAnotherAssessment(tier = 'free') {
  // Plus and above have unlimited assessments
  if (tier !== 'free') return true;

  const usage = getMonthlyUsage();
  if (!usage) return true; // Default to allowing if no data

  // Free tier: max 1 per month
  return usage.count < 1;
}

/**
 * Get remaining assessments for this month
 */
export function getRemainingAssessments(tier = 'free') {
  if (tier !== 'free') return null; // Unlimited

  const usage = getMonthlyUsage();
  if (!usage) return 1;

  const limit = 1;
  return Math.max(0, limit - usage.count);
}

/**
 * Get last assessment date
 */
export function getLastAssessmentDate() {
  const usage = getMonthlyUsage();
  if (!usage || usage.dates.length === 0) return null;

  return new Date(usage.dates[usage.dates.length - 1]);
}

/**
 * Clear assessment data (for testing)
 */
export function clearAssessmentData() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export default {
  getMonthlyUsage,
  recordAssessment,
  canTakeAnotherAssessment,
  getRemainingAssessments,
  getLastAssessmentDate,
  clearAssessmentData,
};
