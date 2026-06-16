/**
 * Service Worker - public/service-worker.js
 * 
 * Handles:
 * - Request interception and caching
 * - Push notification display
 * - Background sync events
 * - Offline fallback
 */

// Cache version
const CACHE_VERSIONS = {
  CRITICAL: 'v1-critical',
  API: 'v1-api',
  ASSETS: 'v1-assets'
};

const OFFLINE_FALLBACK = '/offline.html';

/**
 * Install event: cache critical assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    caches.open(CACHE_VERSIONS.CRITICAL).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        OFFLINE_FALLBACK
      ]).catch((error) => {
        console.warn('[SW] Failed to cache critical assets:', error);
      });
    })
  );

  self.skipWaiting();
});

/**
 * Activate event: clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !Object.values(CACHE_VERSIONS).includes(name))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  self.clients.claim();
});

/**
 * Fetch event: network-first for API, cache-first for assets
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleNetworkFirst(request));
  }
  // Cache-first for static assets
  else {
    event.respondWith(handleCacheFirst(request));
  }
});

/**
 * Push event: receive and display notification
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  if (!event.data) {
    console.warn('[SW] Push event without data');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (error) {
    console.warn('[SW] Failed to parse push data:', error);
    notificationData = {
      title: 'ARTH.OS Notification',
      body: event.data.text()
    };
  }

  const { title, body, badge, icon, tag, data } = notificationData;

  const options = {
    body,
    badge: badge || '/badge.png',
    icon: icon || '/app-icon.png',
    tag: tag || 'default',
    data: data || {},
    persistent: true,
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification click event: navigate to deep link
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');

  const { notification, action } = event;
  const url = notification.data?.url || '/dashboard';

  notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Find existing window with matching URL
      for (const client of clientList) {
        if (new URL(client.url).pathname === new URL(url, self.location.origin).pathname) {
          return client.focus();
        }
      }

      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

/**
 * Notification close event: track dismissal
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');

  event.waitUntil(
    clients.matchAll().then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          type: 'NOTIFICATION_CLOSE',
          data: event.notification.data
        });
      }
    })
  );
});

/**
 * Background sync event: retry offline operations
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll();
        for (const client of clients) {
          client.postMessage({
            type: 'SYNC_OFFLINE_QUEUE'
          });
        }
      })()
    );
  }
});

/**
 * Message event: receive commands from client
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data.type);

  const { type, payload } = event.data;

  if (type === 'GET_PUSH_SUBSCRIPTION') {
    self.registration.pushManager.getSubscription().then((subscription) => {
      event.ports[0].postMessage({
        type: 'PUSH_SUBSCRIPTION',
        subscription: subscription ? {
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.getKey('auth'),
            p256dh: subscription.getKey('p256dh')
          }
        } : null
      });
    });
  }

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (type === 'CLEAR_CACHES') {
    caches.keys().then((names) => {
      Promise.all(names.map((name) => caches.delete(name)));
    });
  }
});

// ============ Private helpers ============

/**
 * Network-first strategy with fallback
 */
async function handleNetworkFirst(request) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSIONS.API);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.warn('[SW] Network request failed:', error);

    // Try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Fallback to offline page
    return caches.match(OFFLINE_FALLBACK) ||
      new Response('Offline', { status: 503 });
  }
}

/**
 * Cache-first strategy with network fallback
 */
async function handleCacheFirst(request) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(CACHE_VERSIONS.ASSETS);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.warn('[SW] Asset fetch failed:', error);

    // Return offline fallback for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match(OFFLINE_FALLBACK) ||
        new Response('Offline', { status: 503 });
    }

    // Return 404 for other asset types
    return new Response('Not Found', { status: 404 });
  }
}

console.log('[SW] Service worker loaded');
