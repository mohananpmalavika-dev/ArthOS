/**
 * Offline-First Caching & Graceful Degradation
 * IndexedDB-backed cache for banking data, scores, and assessments
 * Sync queue for mutations when offline
 * Service Worker integration ready
 */

const DB_NAME = 'arth-os-cache';
const DB_VERSION = 1;

const STORES = {
  BANKING_DATA: 'banking_data',
  SCORE_HISTORY: 'score_history',
  ASSESSMENTS: 'assessments',
  COACHING_SESSION: 'coaching_sessions',
  NOTIFICATIONS: 'notifications',
  SYNC_QUEUE: 'sync_queue'
};

const CACHE_DURATION = {
  BANKING_DATA: 3600000, // 1 hour
  SCORE_HISTORY: 86400000, // 24 hours
  ASSESSMENTS: 604800000, // 7 days
  COACHING_SESSION: 1800000, // 30 minutes
  NOTIFICATIONS: 86400000 // 24 hours
};

class OfflineCacheManager {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.initPromise = this._initDB();
  }

  /**
   * Initialize IndexedDB
   */
  async _initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn('IndexedDB open failed:', request.error);
        reject(request.error);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        Object.values(STORES).forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        });

        // Index for timestamp-based queries
        Object.values(STORES).forEach(store => {
          const objStore = event.target.transaction.objectStore(store);
          if (!objStore.indexNames.contains('timestamp')) {
            objStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        });
      };

      request.onsuccess = () => {
        this.db = request.result;

        // Listen for online/offline events
        window.addEventListener('online', () => this._handleOnline());
        window.addEventListener('offline', () => this._handleOffline());

        resolve(this.db);
      };
    });
  }

  /**
   * Cache banking data (accounts, transactions)
   */
  async cacheBankingData(data) {
    await this.initPromise;
    const tx = this.db.transaction([STORES.BANKING_DATA], 'readwrite');
    const store = tx.objectStore(STORES.BANKING_DATA);

    const cacheEntry = {
      id: data.accountId || 'banking-' + Date.now(),
      data,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve(cacheEntry);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached banking data
   */
  async getBankingData(accountId) {
    await this.initPromise;
    const tx = this.db.transaction([STORES.BANKING_DATA], 'readonly');
    const store = tx.objectStore(STORES.BANKING_DATA);

    return new Promise((resolve, reject) => {
      const request = store.get(accountId || 'banking-data');
      request.onsuccess = () => {
        const entry = request.result;
        if (entry && this._isCacheValid(entry, CACHE_DURATION.BANKING_DATA)) {
          resolve(entry.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache score history
   */
  async cacheScoreHistory(scores) {
    await this.initPromise;
    const tx = this.db.transaction([STORES.SCORE_HISTORY], 'readwrite');
    const store = tx.objectStore(STORES.SCORE_HISTORY);

    const cacheEntry = {
      id: 'score-history',
      data: scores,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve(cacheEntry);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached score history
   */
  async getScoreHistory() {
    await this.initPromise;
    const tx = this.db.transaction([STORES.SCORE_HISTORY], 'readonly');
    const store = tx.objectStore(STORES.SCORE_HISTORY);

    return new Promise((resolve, reject) => {
      const request = store.get('score-history');
      request.onsuccess = () => {
        const entry = request.result;
        if (entry && this._isCacheValid(entry, CACHE_DURATION.SCORE_HISTORY)) {
          resolve(entry.data);
        } else {
          resolve([]);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Enqueue API mutation for later sync
   */
  async enqueueSyncOperation(operation) {
    await this.initPromise;
    const tx = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = tx.objectStore(STORES.SYNC_QUEUE);

    const queueEntry = {
      id: 'sync-' + Date.now() + '-' + Math.random(),
      operation,
      timestamp: Date.now(),
      retries: 0
    };

    return new Promise((resolve, reject) => {
      const request = store.add(queueEntry);
      request.onsuccess = () => resolve(queueEntry);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get queued sync operations
   */
  async getSyncQueue() {
    await this.initPromise;
    const tx = this.db.transaction([STORES.SYNC_QUEUE], 'readonly');
    const store = tx.objectStore(STORES.SYNC_QUEUE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove completed sync operation
   */
  async removeSyncOperation(id) {
    await this.initPromise;
    const tx = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = tx.objectStore(STORES.SYNC_QUEUE);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sync all queued operations when back online
   */
  async syncQueue() {
    if (!this.isOnline) return;

    const queue = await this.getSyncQueue();

    for (const entry of queue) {
      try {
        const response = await fetch(entry.operation.endpoint, {
          method: entry.operation.method,
          headers: entry.operation.headers,
          body: JSON.stringify(entry.operation.body)
        });

        if (response.ok) {
          await this.removeSyncOperation(entry.id);
        } else if (entry.retries < 3) {
          // Retry up to 3 times
          entry.retries++;
          await this._updateSyncEntry(entry);
        } else {
          // Max retries exceeded - remove from queue
          await this.removeSyncOperation(entry.id);
        }
      } catch (err) {
        console.warn('Sync failed for operation:', entry, err);
        if (entry.retries < 3) {
          entry.retries++;
          await this._updateSyncEntry(entry);
        }
      }
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache() {
    await this.initPromise;

    for (const [store, duration] of Object.entries(CACHE_DURATION)) {
      const tx = this.db.transaction([store], 'readwrite');
      const objStore = tx.objectStore(store);
      const index = objStore.index('timestamp');
      const range = IDBKeyRange.upperBound(Date.now() - duration);

      const request = index.openCursor(range);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    }
  }

  // Private helpers
  _isCacheValid(entry, duration) {
    return Date.now() - entry.timestamp < duration;
  }

  async _updateSyncEntry(entry) {
    const tx = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = tx.objectStore(STORES.SYNC_QUEUE);
    return new Promise((resolve) => {
      store.put(entry);
      resolve();
    });
  }

  _handleOnline() {
    this.isOnline = true;
    console.log('Back online - syncing queue...');
    this.syncQueue();
  }

  _handleOffline() {
    this.isOnline = false;
    console.log('Offline mode enabled');
  }
}

export const offlineCacheManager = new OfflineCacheManager();

/**
 * Hook to use offline cache
 */
import { useState, useEffect } from 'react';

export function useOfflineCache(key, fetcher, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // Try network first
        if (navigator.onLine) {
          const freshData = await fetcher();
          if (isMounted) {
            setData(freshData);
            setError(null);
            // Cache the data
            if (options.cacheStore) {
              await offlineCacheManager[`cache${options.cacheStore}`](freshData);
            }
          }
        } else {
          // Fall back to cache if offline
          throw new Error('Offline');
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          // Try to load from cache
          if (options.cacheGetter) {
            try {
              const cached = await offlineCacheManager[options.cacheGetter]();
              if (cached) {
                setData(cached);
                setError(null);
              }
            } catch (cacheErr) {
              setError(cacheErr);
            }
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [key, fetcher, options]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { data, loading, error, isOffline };
}
