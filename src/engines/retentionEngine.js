/**
 * Retention Engine v1.0
 * Tracks user cohorts and measures Day-7, 14, 30, 60 retention rates
 * Blueprint: Ch. 12 — "target 40%+ Day 30 retention"
 * 
 * Data Structure:
 * - cohorts[]: Array of { userId, enteredAt, returns: [timestamps] }
 * - Aggregates: Retention % by Day N across all cohorts
 * - Storage: localStorage (persistence across sessions)
 */

const STORAGE_KEY = 'arth_retention_cohorts';
const RETURN_TRACKING_KEY = 'arth_user_last_active';

/**
 * Initialize a user in the retention system
 * Call once per user on first app load
 */
export function initializeUserRetention(userId) {
  const cohorts = loadCohorts();
  
  // Check if user already exists
  const existing = cohorts.find(c => c.userId === userId);
  if (existing) {
    return existing;
  }
  
  // Create new cohort entry
  const cohort = {
    userId,
    enteredAt: new Date().toISOString(),
    returns: [], // Track subsequent visits
    assessmentCompleted: false,
    firstAssessmentDate: null,
  };
  
  cohorts.push(cohort);
  saveCohorts(cohorts);
  
  return cohort;
}

/**
 * Record a user return event (app opened/used)
 */
export function recordUserReturn(userId) {
  const cohorts = loadCohorts();
  const cohort = cohorts.find(c => c.userId === userId);
  
  if (!cohort) {
    // User not in system, initialize
    initializeUserRetention(userId);
    return;
  }
  
  // Don't record duplicate returns on same day
  const today = new Date().toDateString();
  const lastReturn = cohort.returns[cohort.returns.length - 1];
  
  if (lastReturn && new Date(lastReturn).toDateString() === today) {
    return; // Already recorded today
  }
  
  cohort.returns.push(new Date().toISOString());
  saveCohorts(cohorts);
  
  // Also update last active timestamp
  localStorage.setItem(RETURN_TRACKING_KEY, JSON.stringify({
    userId,
    lastActive: new Date().toISOString(),
  }));
}

/**
 * Record assessment completion for this user
 */
export function recordAssessmentCompletion(userId) {
  const cohorts = loadCohorts();
  const cohort = cohorts.find(c => c.userId === userId);
  
  if (!cohort) {
    initializeUserRetention(userId);
    return;
  }
  
  cohort.assessmentCompleted = true;
  cohort.firstAssessmentDate = new Date().toISOString();
  
  saveCohorts(cohorts);
}

/**
 * Calculate retention for a specific day
 * dayN: 7, 14, 30, 60, etc.
 * Returns: { retained: count, total: count, percentage: number }
 */
export function getRetentionForDay(dayN) {
  const cohorts = loadCohorts();
  
  let retained = 0;
  let total = 0;
  
  cohorts.forEach(cohort => {
    const enteredDate = new Date(cohort.enteredAt);
    const targetDate = new Date(enteredDate.getTime() + dayN * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    // Only count cohorts that are old enough to measure (entered >dayN days ago)
    if (now >= targetDate) {
      total++;
      
      // Check if user returned on or after dayN
      const hasReturn = cohort.returns.some(returnDate => {
        const rd = new Date(returnDate);
        const daysSinceEntry = Math.floor((rd - enteredDate) / (24 * 60 * 60 * 1000));
        return daysSinceEntry >= dayN;
      });
      
      if (hasReturn) retained++;
    }
  });
  
  return {
    retained,
    total,
    percentage: total > 0 ? Math.round((retained / total) * 100) : 0,
    dayN,
  };
}

/**
 * Get full retention curve across all measured days
 * Returns array: [Day7, Day14, Day30, Day60]
 */
export function getRetentionCurve() {
  return [
    getRetentionForDay(7),
    getRetentionForDay(14),
    getRetentionForDay(30),
    getRetentionForDay(60),
  ];
}

/**
 * Get cohort-level details
 */
export function getCohortDetails(userId) {
  const cohorts = loadCohorts();
  return cohorts.find(c => c.userId === userId);
}

/**
 * Get all cohorts (for admin/analytics)
 */
export function getAllCohorts() {
  return loadCohorts();
}

/**
 * Get cohort statistics
 */
export function getCohortStatistics() {
  const cohorts = loadCohorts();
  
  const stats = {
    totalCohorts: cohorts.length,
    assessmentCompleted: cohorts.filter(c => c.assessmentCompleted).length,
    assessmentCompletionRate: 0,
    totalReturns: cohorts.reduce((sum, c) => sum + c.returns.length, 0),
    avgReturnsPerUser: 0,
    retentionCurve: getRetentionCurve(),
    cohortsByAge: groupCohortsByAge(),
  };
  
  if (stats.totalCohorts > 0) {
    stats.assessmentCompletionRate = Math.round(
      (stats.assessmentCompleted / stats.totalCohorts) * 100
    );
    stats.avgReturnsPerUser = (
      stats.totalReturns / stats.totalCohorts
    ).toFixed(1);
  }
  
  return stats;
}

/**
 * Group cohorts by how old they are
 */
function groupCohortsByAge() {
  const cohorts = loadCohorts();
  const now = new Date();
  
  const groups = {
    'Day 0-7': 0,
    'Day 8-30': 0,
    'Day 31-60': 0,
    'Day 60+': 0,
  };
  
  cohorts.forEach(cohort => {
    const enteredDate = new Date(cohort.enteredAt);
    const ageInDays = Math.floor((now - enteredDate) / (24 * 60 * 60 * 1000));
    
    if (ageInDays <= 7) groups['Day 0-7']++;
    else if (ageInDays <= 30) groups['Day 8-30']++;
    else if (ageInDays <= 60) groups['Day 31-60']++;
    else groups['Day 60+']++;
  });
  
  return groups;
}

/**
 * Clear all retention data (dev only)
 */
export function clearRetentionData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(RETURN_TRACKING_KEY);
}

/**
 * Export retention data as CSV (for analysis)
 */
export function exportRetentionDataAsCSV() {
  const cohorts = loadCohorts();
  
  let csv = 'userId,enteredAt,assessmentCompleted,firstAssessmentDate,totalReturns,lastReturnDate\n';
  
  cohorts.forEach(cohort => {
    const lastReturn = cohort.returns[cohort.returns.length - 1] || 'N/A';
    csv += `${cohort.userId},"${cohort.enteredAt}",${cohort.assessmentCompleted},"${cohort.firstAssessmentDate}",${cohort.returns.length},"${lastReturn}"\n`;
  });
  
  return csv;
}

/**
 * Download retention data as file
 */
export function downloadRetentionData() {
  const csv = exportRetentionDataAsCSV();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arth-retention-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Get user retention day-specific info
 */
export function getUserRetentionStatus(userId) {
  const cohort = getCohortDetails(userId);
  if (!cohort) return null;
  
  const enteredDate = new Date(cohort.enteredAt);
  const now = new Date();
  const daysSinceEntry = Math.floor((now - enteredDate) / (24 * 60 * 60 * 1000));
  
  const lastReturn = cohort.returns[cohort.returns.length - 1];
  const daysSinceLastReturn = lastReturn
    ? Math.floor((now - new Date(lastReturn)) / (24 * 60 * 60 * 1000))
    : daysSinceEntry;
  
  return {
    userId,
    daysSinceEntry,
    daysSinceLastReturn,
    isActive: daysSinceLastReturn <= 1, // Active if returned in last 24h
    assessmentCompleted: cohort.assessmentCompleted,
    totalReturns: cohort.returns.length,
    enteredAt: cohort.enteredAt,
    lastReturnAt: lastReturn,
  };
}

/**
 * Get milestone status for user
 * Returns which retention days they've hit
 */
export function getUserRetentionMilestones(userId) {
  const cohort = getCohortDetails(userId);
  if (!cohort) return [];
  
  const enteredDate = new Date(cohort.enteredAt);
  const milestones = [7, 14, 30, 60];
  const achieved = [];
  
  milestones.forEach(dayN => {
    const targetDate = new Date(enteredDate.getTime() + dayN * 24 * 60 * 60 * 1000);
    const hasReturn = cohort.returns.some(returnDate => {
      const rd = new Date(returnDate);
      return rd >= targetDate;
    });
    
    if (hasReturn) {
      achieved.push({
        day: dayN,
        achievedAt: cohort.returns.find(rd => new Date(rd) >= targetDate),
      });
    }
  });
  
  return achieved;
}

// ============ STORAGE HELPERS ============

function loadCohorts() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load cohorts:', e);
    return [];
  }
}

function saveCohorts(cohorts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts));
  } catch (e) {
    console.error('Failed to save cohorts:', e);
  }
}
