/**
 * Modern Service Worker
 * 
 * Strategy:
 * 1. HTML (Documents): Network First (Fresh content is critical for e-commerce).
 * 2. Assets (CSS, JS, Images): Stale-While-Revalidate (Fast load + Auto-update).
 * 3. Non-HTTP Requests: Ignored (prevents chrome-extension errors).
 */

const CACHE_NAME = 'store-modern-v1';

// Assets to cache immediately on install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/category.html',
  '/product.html',
  '/cart.html',
  '/checkout.html',
  '/account.html',
  '/login.html',
  '/register.html',
  '/thank-you.html',
  '/manifest.json',
  '/css/style.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];

// ==========================================
// 1. INSTALLATION: Cache the App Shell
// ==========================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Modern Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching App Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// ==========================================
// 2. ACTIVATION: Clean Old Caches
// ==========================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Modern Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all open pages immediately
});

// ==========================================
// 3. FETCH: Handle Network Requests
// ==========================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // SAFETY: Ignore non-http requests (extensions, data:, etc.)
  if (!url.protocol.startsWith('http')) {
    return; 
  }

  // STRATEGY A: HTML Pages (Network First)
  // We want fresh HTML to ensure users see the latest prices/products.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with the fresh HTML version
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline Fallback
          return caches.match(event.request);
        })
    );
    return;
  }

  // STRATEGY B: Assets (Stale-While-Revalidate)
  // 1. Serve from Cache (Instant Load).
  // 2. Fetch from Network in background.
  // 3. Update Cache for next visit.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // 1. Serve Cached Asset
        // 2. Update in background (Fire-and-Forget)
        fetchAndCache(event.request);
        return cachedResponse;
      }

      // Not in cache -> Fetch from Network
      return fetchAndCache(event.request);
    })
  );
});

// Helper: Fetch and Cache Logic
async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    
    // Only cache valid responses (success, basic type)
    if (!response || response.status !== 200 || response.type !== 'basic') {
      return response;
    }

    const responseToCache = response.clone();
    caches.open(CACHE_NAME).then((cache) => {
      cache.put(request, responseToCache);
    });

    return response;
  } catch (error) {
    console.error('[SW] Fetch failed for:', request.url, error);
    // Return a generic error or fallback image if possible
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
}

// ==========================================
// 4. PUSH NOTIFICATIONS
// ==========================================
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update from Modern Store',
    icon: '/images/icons/icon-192x192.png', // Ensure this file exists
    badge: '/images/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  event.waitUntil(self.registration.showNotification('Modern Store', options));
});