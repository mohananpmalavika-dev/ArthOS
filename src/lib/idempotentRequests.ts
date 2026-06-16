/**
 * src/lib/idempotentRequests.ts
 *
 * Idempotent request deduplication layer.
 * Ensures that retried requests don't duplicate side effects by:
 * - Assigning stable request IDs based on content hash
 * - Caching results for repeated requests
 * - Storing deduplication state in IndexedDB for crash-safety
 *
 * Usage:
 *   const req = await IdempotentRequest.create({
 *     endpoint: '/api/saveAssessment',
 *     payload: { assessment, result },
 *     type: 'assessment_save'
 *   });
 *   const result = await req.send();  // Safe to retry
 */

import crypto from 'crypto';

export interface DeduplicationEntry {
  requestId: string;
  contentHash: string;
  endpoint: string;
  type: string;
  result: any;
  timestamp: string;
  expiresAt: string;  // TTL: default 24h
}

export interface IdempotentRequestConfig {
  endpoint: string;
  payload: any;
  type: string;  // e.g., 'assessment_save', 'notification_send', 'followup_deliver'
  ttlMs?: number;  // Default 24 hours
  headers?: Record<string, string>;
}

export interface IdempotentRequestResult {
  success: boolean;
  isDuplicate: boolean;
  requestId: string;
  result?: any;
  error?: string;
}

// ============================================================================
// CONTENT HASHING
// ============================================================================

/**
 * Generate stable hash of payload for deduplication.
 * Same payload = same hash = same request ID.
 */
function hashPayload(payload: any, type: string): string {
  const normalized = JSON.stringify({
    type,
    payload: normalizePayload(payload)
  });

  return crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex')
    .slice(0, 16);  // Use first 16 chars for readability
}

/**
 * Normalize payload for hashing (remove transient fields like timestamps).
 */
function normalizePayload(payload: any): any {
  if (payload === null || payload === undefined) {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map(normalizePayload);
  }

  if (typeof payload === 'object') {
    const normalized: any = {};
    const keys = Object.keys(payload).sort();

    for (const key of keys) {
      // Skip transient fields
      if (key.match(/^(timestamp|createdAt|id|requestId|__.*)/)) {
        continue;
      }
      normalized[key] = normalizePayload(payload[key]);
    }

    return normalized;
  }

  return payload;
}

// ============================================================================
// INDEXEDDB DEDUPLICATION STORE
// ============================================================================

let dbInstance: IDBDatabase | null = null;

async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ArthOSDeduplication', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create deduplication store
      if (!db.objectStoreNames.contains('deduplication')) {
        const store = db.createObjectStore('deduplication', { keyPath: 'requestId' });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

async function storeDeduplicationEntry(entry: DeduplicationEntry): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('deduplication', 'readwrite');
    const store = tx.objectStore('deduplication');
    const request = store.put(entry);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getDeduplicationEntry(requestId: string): Promise<DeduplicationEntry | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('deduplication', 'readonly');
    const store = tx.objectStore('deduplication');
    const request = store.get(requestId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const entry = request.result;

      // Check expiration
      if (entry && new Date(entry.expiresAt) > new Date()) {
        resolve(entry);
      } else {
        resolve(null);
      }
    };
  });
}

async function cleanupExpiredEntries(): Promise<void> {
  const db = await initDB();
  const now = new Date().toISOString();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('deduplication', 'readwrite');
    const store = tx.objectStore('deduplication');
    const index = store.index('expiresAt');

    // Delete all entries where expiresAt < now
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);

    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
  });
}

// ============================================================================
// IDEMPOTENT REQUEST CLASS
// ============================================================================

export class IdempotentRequest {
  readonly config: IdempotentRequestConfig;
  readonly requestId: string;
  readonly contentHash: string;

  private constructor(config: IdempotentRequestConfig, requestId: string, hash: string) {
    this.config = config;
    this.requestId = requestId;
    this.contentHash = hash;
  }

  /**
   * Create an idempotent request.
   * Generates stable requestId from payload hash.
   */
  static create(config: IdempotentRequestConfig): IdempotentRequest {
    const hash = hashPayload(config.payload, config.type);
    const requestId = `${config.type}:${hash}`;
    return new IdempotentRequest(config, requestId, hash);
  }

  /**
   * Send request with deduplication.
   * Returns cached result if available, otherwise sends and caches.
   */
  async send(): Promise<IdempotentRequestResult> {
    try {
      // Check deduplication cache
      const cached = await getDeduplicationEntry(this.requestId);
      if (cached) {
        return {
          success: true,
          isDuplicate: true,
          requestId: this.requestId,
          result: cached.result
        };
      }

      // Add request ID to payload
      const payloadWithId = {
        ...this.config.payload,
        idempotency_key: this.requestId
      };

      // Send request
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': this.requestId,
          ...this.config.headers
        },
        body: JSON.stringify(payloadWithId),
        keepalive: true
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Store in deduplication cache
      const ttlMs = this.config.ttlMs ?? 24 * 60 * 60 * 1000;  // 24h default
      const expiresAt = new Date(Date.now() + ttlMs).toISOString();

      await storeDeduplicationEntry({
        requestId: this.requestId,
        contentHash: this.contentHash,
        endpoint: this.config.endpoint,
        type: this.config.type,
        result,
        timestamp: new Date().toISOString(),
        expiresAt
      });

      return {
        success: true,
        isDuplicate: false,
        requestId: this.requestId,
        result
      };
    } catch (error) {
      return {
        success: false,
        isDuplicate: false,
        requestId: this.requestId,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Clear cached result (useful for testing or explicit cache invalidation).
   */
  async clearCache(): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('deduplication', 'readwrite');
      const store = tx.objectStore('deduplication');
      const request = store.delete(this.requestId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// ============================================================================
// CLEANUP AND UTILITIES
// ============================================================================

/**
 * Run deduplication cleanup periodically (call from app initialization).
 */
export function startDeduplicationCleanup(intervalMs: number = 60 * 60 * 1000): void {
  // Initial cleanup
  void cleanupExpiredEntries();

  // Periodic cleanup (default: hourly)
  setInterval(() => {
    void cleanupExpiredEntries().catch(err => {
      console.error('[IdempotentRequests] Cleanup failed:', err);
    });
  }, intervalMs);
}

/**
 * Export for testing/debugging.
 */
export async function getDeduplicationStats(): Promise<{
  totalEntries: number;
  expiredEntries: number;
}> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('deduplication', 'readonly');
    const store = tx.objectStore('deduplication');
    const countRequest = store.count();

    countRequest.onerror = () => reject(countRequest.error);
    countRequest.onsuccess = () => {
      const totalEntries = countRequest.result;

      // Count expired
      const now = new Date().toISOString();
      const index = store.index('expiresAt');
      const rangeRequest = index.count(IDBKeyRange.upperBound(now));

      rangeRequest.onerror = () => reject(rangeRequest.error);
      rangeRequest.onsuccess = () => {
        resolve({
          totalEntries,
          expiredEntries: rangeRequest.result
        });
      };
    };
  });
}
