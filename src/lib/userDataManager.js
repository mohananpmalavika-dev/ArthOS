// src/lib/userDataManager.js
// Manages user-specific data storage and retrieval
// Isolates data by user ID to prevent cross-user data leakage

const STORAGE_PREFIX = "arth-os-user";

/**
 * Generate a storage key namespaced to a specific user
 * @param {string} userId - The authenticated user's ID
 * @param {string} dataType - Type of data (e.g., "assessments", "scores", "history")
 * @returns {string} - Namespaced storage key
 */
export function getUserStorageKey(userId, dataType) {
  if (!userId) {
    throw new Error("userId is required for user-scoped storage");
  }
  return `${STORAGE_PREFIX}:${userId}:${dataType}`;
}

/**
 * Save assessment to user-scoped localStorage
 * @param {string} userId - The authenticated user's ID
 * @param {object} assessment - The assessment data to save
 * @param {string} storageKey - Optional custom storage key
 */
export function saveUserAssessment(userId, assessment, storageKey = "current-assessment") {
  try {
    if (!userId) {
      console.warn("[UserDataManager] No userId provided, assessment not saved to user scope");
      return false;
    }

    const key = getUserStorageKey(userId, storageKey);
    window.localStorage.setItem(key, JSON.stringify(assessment));
    console.log(`[UserDataManager] Saved assessment for user ${userId}`);
    return true;
  } catch (error) {
    console.warn("[UserDataManager] Failed to save assessment:", error);
    return false;
  }
}

/**
 * Load assessment from user-scoped localStorage
 * @param {string} userId - The authenticated user's ID
 * @param {string} storageKey - Optional custom storage key
 * @returns {object|null} - The assessment data or null
 */
export function loadUserAssessment(userId, storageKey = "current-assessment") {
  try {
    if (!userId) {
      console.warn("[UserDataManager] No userId provided, cannot load user-scoped assessment");
      return null;
    }

    const key = getUserStorageKey(userId, storageKey);
    const stored = window.localStorage.getItem(key);
    if (stored) {
      const assessment = JSON.parse(stored);
      console.log(`[UserDataManager] Loaded assessment for user ${userId}`);
      return assessment;
    }
    return null;
  } catch (error) {
    console.warn("[UserDataManager] Failed to load assessment:", error);
    return null;
  }
}

/**
 * Clear all user-scoped data when user logs out
 * @param {string} userId - The user ID whose data should be cleared
 */
export function clearUserData(userId) {
  try {
    if (!userId) {
      return;
    }

    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.includes(`${STORAGE_PREFIX}:${userId}:`)) {
        keys.push(key);
      }
    }

    keys.forEach(key => {
      window.localStorage.removeItem(key);
      console.log(`[UserDataManager] Cleared ${key}`);
    });

    console.log(`[UserDataManager] Cleared all data for user ${userId}`);
  } catch (error) {
    console.warn("[UserDataManager] Failed to clear user data:", error);
  }
}

/**
 * Migrate anonymous data to user scope (called on login)
 * @param {string} userId - The newly authenticated user's ID
 * @param {object} anonymousData - Optional existing anonymous data
 */
export function migrateAnonymousDataToUser(userId, anonymousData = null) {
  try {
    if (!userId) {
      return;
    }

    // Try to load existing anonymous data
    let anonAssessment = anonymousData;
    if (!anonAssessment) {
      const anonKey = "arth-os-assessment";
      const stored = window.localStorage.getItem(anonKey);
      anonAssessment = stored ? JSON.parse(stored) : null;
    }

    // If we have anonymous data, save it to user scope
    if (anonAssessment) {
      saveUserAssessment(userId, anonAssessment, "migrated-anonymous-assessment");
      console.log(`[UserDataManager] Migrated anonymous assessment to user ${userId}`);
    }

    // Keep anonymous data but clearly mark it as migrated
    // This allows fallback if needed
  } catch (error) {
    console.warn("[UserDataManager] Failed to migrate anonymous data:", error);
  }
}

/**
 * Save score history for a user
 * @param {string} userId - The authenticated user's ID
 * @param {array} scoreHistory - Array of score entries
 */
export function saveUserScoreHistory(userId, scoreHistory) {
  try {
    if (!userId) {
      return false;
    }

    const key = getUserStorageKey(userId, "score-history");
    window.localStorage.setItem(key, JSON.stringify(scoreHistory));
    console.log(`[UserDataManager] Saved score history for user ${userId}`);
    return true;
  } catch (error) {
    console.warn("[UserDataManager] Failed to save score history:", error);
    return false;
  }
}

/**
 * Load score history for a user
 * @param {string} userId - The authenticated user's ID
 * @returns {array} - Score history array
 */
export function loadUserScoreHistory(userId) {
  try {
    if (!userId) {
      return [];
    }

    const key = getUserStorageKey(userId, "score-history");
    const stored = window.localStorage.getItem(key);
    if (stored) {
      const history = JSON.parse(stored);
      console.log(`[UserDataManager] Loaded score history for user ${userId}`);
      return Array.isArray(history) ? history : [];
    }
    return [];
  } catch (error) {
    console.warn("[UserDataManager] Failed to load score history:", error);
    return [];
  }
}

/**
 * Add a score entry to user's score history
 * @param {string} userId - The authenticated user's ID
 * @param {object} scoreEntry - Score entry to add
 */
export function addScoreToUserHistory(userId, scoreEntry) {
  try {
    if (!userId) {
      return false;
    }

    const history = loadUserScoreHistory(userId);
    history.push({
      ...scoreEntry,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 scores to manage storage
    const limited = history.slice(-100);
    saveUserScoreHistory(userId, limited);
    console.log(`[UserDataManager] Added score to history for user ${userId}`);
    return true;
  } catch (error) {
    console.warn("[UserDataManager] Failed to add score to history:", error);
    return false;
  }
}

/**
 * Get user's latest score
 * @param {string} userId - The authenticated user's ID
 * @returns {object|null} - Latest score entry or null
 */
export function getUserLatestScore(userId) {
  try {
    if (!userId) {
      return null;
    }

    const history = loadUserScoreHistory(userId);
    return history.length > 0 ? history[history.length - 1] : null;
  } catch (error) {
    console.warn("[UserDataManager] Failed to get latest score:", error);
    return null;
  }
}

/**
 * Check if data exists for a user
 * @param {string} userId - The authenticated user's ID
 * @returns {boolean} - True if user has any stored data
 */
export function userHasData(userId) {
  try {
    if (!userId) {
      return false;
    }

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.includes(`${STORAGE_PREFIX}:${userId}:`)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.warn("[UserDataManager] Failed to check user data:", error);
    return false;
  }
}
