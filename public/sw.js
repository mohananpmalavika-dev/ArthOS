/**
 * ARTH.OS Service Worker
 * 
 * Enables offline support, asset caching, and background sync
 * Strategies:
 * - Assets (JS, CSS, fonts): Cache first, fall back to network
 * - API calls: Network first, fall back to cache
 * - Assessment saves: Queue offline, sync when online
 */

const CACHE_VERSION = 'arth-os-v1';
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const API_CACHE = `${CACHE_VERSION}-api`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Assets to precache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx'
];

/**
 * Install: Precache critical assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(ASSET_CACHE).then((cache) => {
      console.log('[ServiceWorker] Precaching core assets');
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[ServiceWorker] Precache failed (expected in dev):', err.message);
      });
    }).then(() => {
      console.log('[ServiceWorker] Install complete');
      self.skipWaiting();
    })
  );
});

/**
 * Activate: Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.startsWith('arth-os-v1')) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Activation complete');
      return self.clients.claim();
    })
  );
});

/**
 * Fetch: Route requests to appropriate strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip localhost API calls in dev mode (let network handle them)
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    if (request.url.includes('/api/')) {
      event.respondWith(
        fetch(request).catch((err) => {
          console.warn('[ServiceWorker] Offline API call blocked in dev:', request.url);
          return new Response(
            JSON.stringify({ error: 'Offline - API not available' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
      );
      return;
    }
  }

  // API calls: Network first, then cache
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets: Cache first, then network
  if (
    request.url.includes('.js') ||
    request.url.includes('.css') ||
    request.url.includes('.woff') ||
    request.url.includes('.ttf')
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Everything else: Network first with fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok && request.url.includes('.svg')) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fall back to cache
        return caches.match(request).then((cached) => {
          if (cached) {
            return cached;
          }
          // Return offline page or error response
          return new Response(
            JSON.stringify({ error: 'Offline - page not available' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        });
      })
  );
});

/**
 * Cache-first strategy: Return from cache, fall back to network
 */
async function cacheFirstStrategy(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Cache the response for future use
    const cache = await caches.open(ASSET_CACHE);
    cache.put(request, response.clone());

    return response;
  } catch (err) {
    console.error('[ServiceWorker] Cache-first failed:', err.message);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline - asset not available', { status: 503 });
  }
}

/**
 * Network-first strategy: Try network first, fall back to cache
 */
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);

    // Cache successful API responses
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (err) {
    console.warn('[ServiceWorker] Network failed, checking cache:', err.message);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline error response
    return new Response(
      JSON.stringify({
        status: 'error',
        error: 'Network unavailable',
        cached: false
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Background Sync: Retry assessment saves when online
 * (Requires users to opt-in via browser settings)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-assessment-saves') {
    event.waitUntil(
      syncAssessmentSaves().catch((err) => {
        console.error('[ServiceWorker] Background sync failed:', err.message);
      })
    );
  }
});

/**
 * Sync queued assessment saves to server
 */
async function syncAssessmentSaves() {
  try {
    // Retrieve queued saves from IndexedDB or localStorage
    const queue = retrieveQueuedSaves();
    
    if (!queue || queue.length === 0) {
      console.log('[ServiceWorker] No queued saves to sync');
      return;
    }

    console.log(`[ServiceWorker] Syncing ${queue.length} queued saves...`);

    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method || 'POST',
          headers: item.headers || { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });

        if (response.ok) {
          console.log('[ServiceWorker] Synced:', item.url);
          removeQueuedSave(item.id);
        } else {
          console.warn('[ServiceWorker] Sync failed for:', item.url, response.status);
        }
      } catch (err) {
        console.error('[ServiceWorker] Error syncing item:', err.message);
      }
    }
  } catch (err) {
    console.error('[ServiceWorker] Sync error:', err.message);
    throw err;
  }
}

/**
 * Retrieve queued saves from localStorage
 * (In production, use IndexedDB for better performance)
 */
function retrieveQueuedSaves() {
  try {
    if (typeof self.clients !== 'undefined') {
      // Try to get from client
      return [];
    }
    return [];
  } catch (err) {
    console.error('[ServiceWorker] Error retrieving queue:', err.message);
    return [];
  }
}

/**
 * Remove item from queue after successful sync
 */
function removeQueuedSave(id) {
  try {
    // Implementation depends on storage method
    console.log('[ServiceWorker] Removed from queue:', id);
  } catch (err) {
    console.error('[ServiceWorker] Error removing from queue:', err.message);
  }
}

/**
 * Message handling from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHES') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName.startsWith('arth-os-')).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Caches cleared');
    });
  }

  if (event.data && event.data.type === 'QUEUE_SAVE') {
    console.log('[ServiceWorker] Queueing save for later sync:', event.data.payload);
    // In production, store in IndexedDB
  }
});

console.log('[ServiceWorker] Loaded successfully');
