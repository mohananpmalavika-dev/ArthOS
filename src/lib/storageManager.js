/**
 * src/lib/storageManager.js
 * User-scoped storage layer.
 * When logged in, all keys are prefixed with the user ID so data is
 * isolated per account AND survives cross-device sync.
 * When anonymous, falls back to the original generic keys.
 */

const STORAGE_PREFIX = "arth-os";

/**
 * Build a scoped storage key.
 * If a userId is provided, the key becomes "arth-os:{userId}:{key}".
 * If anonymous, the key stays "arth-os:{key}" for backward compatibility.
 */
export function scopedKey(key, userId) {
  if (userId && userId !== "demo" && userId !== "anonymous") {
    return `${STORAGE_PREFIX}:${userId}:${key}`;
  }
  return `${STORAGE_PREFIX}:${key}`;
}

/**
 * Read a value from localStorage with user-scoped key.
 * Falls back to the unscoped key if the scoped one doesn't exist
 * (for data that existed before login).
 */
export function scopedRead(key, userId) {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const scoped = scopedKey(key, userId);
  try {
    const raw = localStorage.getItem(scoped);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`[storageManager] Failed to parse scoped key "${scoped}":`, err.message);
  }

  // Fallback: try the unscoped key
  const unscoped = `${STORAGE_PREFIX}:${key}`;
  if (scoped !== unscoped) {
    try {
      const raw = localStorage.getItem(unscoped);
      if (raw !== null) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn(`[storageManager] Failed to parse unscoped key "${unscoped}":`, err.message);
    }
  }

  return null;
}

/**
 * Write a value to localStorage with user-scoped key.
 * When logging in with a userId, this automatically scopes writes.
 */
export function scopedWrite(key, value, userId) {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(scopedKey(key, userId), JSON.stringify(value));
  } catch (err) {
    console.warn(
      `[storageManager] Failed to write key "${key}" (quota or access error):`,
      err.message
    );
  }
}

/**
 * Remove a scoped key.
 */
export function scopedRemove(key, userId) {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(scopedKey(key, userId));
  } catch (err) {
    console.warn(`[storageManager] Failed to remove key "${key}":`, err.message);
  }
}

/**
 * Migrate all data from anonymous (unscoped) keys to user-scoped keys.
 * Called after login to preserve local data under the new user ID.
 */
export function migrateAnonymousData(userId) {
  if (!userId || userId === "demo" || userId === "anonymous") {
    return;
  }
  if (typeof localStorage === "undefined") {
    return;
  }

  const keysToMigrate = [
    "score-history",
    "weekly-checkins",
    "assessment-history",
    "financial-memory",
    "goal-history",
    "twin-snapshots",
    "event-log",
    "pending-sync",
    "sync-metadata",
    "settings"
  ];

  for (const key of keysToMigrate) {
    const unscopedKey = `${STORAGE_PREFIX}:${key}`;
    const scopedK = scopedKey(key, userId);

    // Only migrate if scoped key doesn't already exist
    if (localStorage.getItem(scopedK) === null) {
      const raw = localStorage.getItem(unscopedKey);
      if (raw !== null) {
        try {
          localStorage.setItem(scopedK, raw);
        } catch (err) {
          console.warn(`[storageManager] Migration failed for key "${key}":`, err.message);
        }
      }
    }
  }
}
