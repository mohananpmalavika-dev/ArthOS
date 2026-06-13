/**
 * PWA Utilities
 * 
 * Provides helpers for:
 * - Detecting online/offline status
 * - Queuing saves when offline
 * - Syncing when connection restored
 * - Update notifications
 */

/**
 * Check if device is online
 */
export function isOnline() {
  return navigator.onLine ?? true;
}

/**
 * Listen for online/offline events
 */
export function onlineStatusListener(callback) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Queue an assessment save for offline sync
 */
export function queueAssessmentSave(assessment, metadata = {}) {
  try {
    const queue = JSON.parse(localStorage.getItem('arth-os-offline-queue') || '[]');
    
    const item = {
      id: `save-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      url: '/api/saveAssessment',
      method: 'POST',
      data: { assessment, ...metadata },
      headers: { 'Content-Type': 'application/json' }
    };

    queue.push(item);
    localStorage.setItem('arth-os-offline-queue', JSON.stringify(queue));

    console.log('[PWA] Assessment queued for offline sync:', item.id);
    return item.id;
  } catch (err) {
    console.error('[PWA] Failed to queue save:', err.message);
    return null;
  }
}

/**
 * Get queued saves
 */
export function getQueuedSaves() {
  try {
    return JSON.parse(localStorage.getItem('arth-os-offline-queue') || '[]');
  } catch (err) {
    console.error('[PWA] Failed to retrieve queue:', err.message);
    return [];
  }
}

/**
 * Remove item from queue
 */
export function removeQueuedSave(id) {
  try {
    const queue = JSON.parse(localStorage.getItem('arth-os-offline-queue') || '[]');
    const filtered = queue.filter((item) => item.id !== id);
    localStorage.setItem('arth-os-offline-queue', JSON.stringify(filtered));
    console.log('[PWA] Removed from queue:', id);
  } catch (err) {
    console.error('[PWA] Failed to remove from queue:', err.message);
  }
}

/**
 * Manually trigger offline sync
 */
export async function manualSync() {
  try {
    const queue = getQueuedSaves();
    
    if (queue.length === 0) {
      console.log('[PWA] No items to sync');
      return { success: true, synced: 0 };
    }

    console.log(`[PWA] Starting manual sync of ${queue.length} items...`);
    
    let synced = 0;
    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method || 'POST',
          headers: item.headers || { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });

        if (response.ok) {
          removeQueuedSave(item.id);
          synced++;
          console.log('[PWA] Synced:', item.url);
        } else {
          console.warn('[PWA] Sync failed:', item.url, response.status);
        }
      } catch (err) {
        console.warn('[PWA] Error syncing item:', err.message);
      }
    }

    console.log(`[PWA] Manual sync complete: ${synced}/${queue.length} synced`);
    return { success: true, synced };
  } catch (err) {
    console.error('[PWA] Sync error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Request notification permission (for offline reminders, etc.)
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('[PWA] Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Send a notification
 */
export function sendNotification(title, options = {}) {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.warn('[PWA] Notifications not available');
    return;
  }

  if (Notification.permission === 'granted') {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SEND_NOTIFICATION',
        title,
        options
      });
    } else {
      new Notification(title, options);
    }
  }
}

/**
 * Request background sync (requires service worker)
 */
export async function requestBackgroundSync(tag = 'sync-assessment-saves') {
  try {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      console.warn('[PWA] Background sync not supported');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    if (registration.sync) {
      await registration.sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
      return true;
    }
  } catch (err) {
    console.error('[PWA] Failed to register background sync:', err.message);
  }
  return false;
}

/**
 * Update check and notification
 */
export function checkForUpdates() {
  try {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.controller?.postMessage({ type: 'CHECK_UPDATE' });
  } catch (err) {
    console.error('[PWA] Failed to check for updates:', err.message);
  }
}

/**
 * Unregister all service workers (for debugging)
 */
export async function unregisterAllServiceWorkers() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('[PWA] Service Worker unregistered');
    }
  } catch (err) {
    console.error('[PWA] Failed to unregister:', err.message);
  }
}

/**
 * Clear all caches (for debugging/reset)
 */
export async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    const deleted = await Promise.all(
      cacheNames
        .filter((name) => name.startsWith('arth-os-'))
        .map((name) => caches.delete(name))
    );
    console.log('[PWA] Cleared', deleted.length, 'caches');
    return deleted.length;
  } catch (err) {
    console.error('[PWA] Failed to clear caches:', err.message);
  }
}

export default {
  isOnline,
  onlineStatusListener,
  queueAssessmentSave,
  getQueuedSaves,
  removeQueuedSave,
  manualSync,
  requestNotificationPermission,
  sendNotification,
  requestBackgroundSync,
  checkForUpdates,
  unregisterAllServiceWorkers,
  clearAllCaches
};
