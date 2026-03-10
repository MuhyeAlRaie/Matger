/**
 * Service Worker for Multi-Category E-Commerce PWA
 * Strategy:
 * 1. HTML (Documents): Network First (Fetch fresh content, fallback to cache)
 * 2. Assets (CSS, JS, Images): Cache First (Load fast, fallback to network)
 */

const CACHE_NAME = 'store-v1';
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
  // CDN Assets (Optional: Caching these makes offline mode much better)
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];

// 1. Installation: Cache Critical Assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// 2. Activation: Clean Old Caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all pages immediately
});

// 3. Fetching: Serve Content
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy: Network First for HTML Documents (Ensure fresh data)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with fresh version
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline: Fallback to cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Strategy: Cache First for Assets (CSS, JS, Images) - Speed
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response to cache it
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// 4. Push Notifications Listener (Placeholder)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update from MyStore',
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('MyStore', options)
  );
});