/**
 * src/lib/storageManager.ts
 * User-scoped storage layer with TypeScript support
 * When logged in, all keys are prefixed with the user ID so data is
 * isolated per account AND survives cross-device sync.
 * When anonymous, falls back to the original generic keys.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type StorageValue = Record<string, unknown> | unknown[] | string | number | boolean | null | undefined;

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_PREFIX = "arth-os";

// ============================================================================
// STORAGE KEY MANAGEMENT
// ============================================================================

/**
 * Build a scoped storage key.
 * If a userId is provided, the key becomes "arth-os:{userId}:{key}".
 * If anonymous, the key stays "arth-os:{key}" for backward compatibility.
 * @param key - The storage key name
 * @param userId - Optional user ID for scoping (optional)
 * @returns Scoped storage key string
 */
export function scopedKey(key: string, userId?: string): string {
  if (userId && userId !== "demo" && userId !== "anonymous") {
    return `${STORAGE_PREFIX}:${userId}:${key}`;
  }
  return `${STORAGE_PREFIX}:${key}`;
}

// ============================================================================
// STORAGE READ/WRITE OPERATIONS
// ============================================================================

/**
 * Read a value from localStorage with user-scoped key.
 * Falls back to the unscoped key if the scoped one doesn't exist
 * (for data that existed before login).
 * @param key - The storage key name
 * @param userId - Optional user ID for scoping
 * @returns Parsed value or null if not found or parsing fails
 */
export function scopedRead<T = StorageValue>(key: string, userId?: string): T | null {
  if (typeof localStorage === "undefined") return null;

  const scoped = scopedKey(key, userId);
  try {
    const raw = localStorage.getItem(scoped);
    if (raw !== null) return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[storageManager] Failed to parse scoped key "${scoped}":`, (err as Error).message);
  }

  // Fallback: try the unscoped key
  const unscoped = `${STORAGE_PREFIX}:${key}`;
  if (scoped !== unscoped) {
    try {
      const raw = localStorage.getItem(unscoped);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[storageManager] Failed to parse unscoped key "${unscoped}":`, (err as Error).message);
    }
  }

  return null;
}

/**
 * Write a value to localStorage with user-scoped key.
 * When logging in with a userId, this automatically scopes writes.
 * @param key - The storage key name
 * @param value - The value to store (will be JSON stringified)
 * @param userId - Optional user ID for scoping
 */
export function scopedWrite(key: string, value: StorageValue, userId?: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(scopedKey(key, userId), JSON.stringify(value));
  } catch (err) {
    console.warn(
      `[storageManager] Failed to write key "${key}" (quota or access error):`,
      (err as Error).message
    );
  }
}

/**
 * Remove a scoped key from localStorage.
 * @param key - The storage key name
 * @param userId - Optional user ID for scoping
 */
export function scopedRemove(key: string, userId?: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(scopedKey(key, userId));
  } catch (err) {
    console.warn(`[storageManager] Failed to remove key "${key}":`, (err as Error).message);
  }
}

/**
 * Check if a scoped key exists in localStorage.
 * @param key - The storage key name
 * @param userId - Optional user ID for scoping
 * @returns True if key exists and has a value, false otherwise
 */
export function scopedExists(key: string, userId?: string): boolean {
  if (typeof localStorage === "undefined") return false;

  const scoped = scopedKey(key, userId);
  if (localStorage.getItem(scoped) !== null) return true;

  // Check unscoped fallback
  const unscoped = `${STORAGE_PREFIX}:${key}`;
  return scoped !== unscoped && localStorage.getItem(unscoped) !== null;
}

/**
 * Clear all scoped keys for a given user ID.
 * @param userId - User ID to clear storage for
 */
export function scopedClear(userId?: string): void {
  if (typeof localStorage === "undefined") return;
  if (!userId || userId === "demo" || userId === "anonymous") return;

  const prefix = `${STORAGE_PREFIX}:${userId}:`;
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[storageManager] Failed to remove key "${key}":`, (err as Error).message);
    }
  }
}

// ============================================================================
// DATA MIGRATION
// ============================================================================

/**
 * Migrate all data from anonymous (unscoped) keys to user-scoped keys.
 * Called after login to preserve local data under the new user ID.
 * @param userId - The user ID to migrate data to
 */
export function migrateAnonymousData(userId: string): void {
  if (!userId || userId === "demo" || userId === "anonymous") return;
  if (typeof localStorage === "undefined") return;

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
          console.warn(`[storageManager] Migration failed for key "${key}":`, (err as Error).message);
        }
      }
    }
  }
}

/**
 * Get all localStorage keys for a given user ID
 * @param userId - User ID to get keys for
 * @returns Array of storage keys for the user
 */
export function getScopedKeys(userId?: string): string[] {
  if (typeof localStorage === "undefined") return [];

  const prefix = scopedKey("", userId);
  const keys: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      keys.push(key);
    }
  }

  return keys;
}
