/**
 * Fixed Service Worker
 * Removed missing icon paths from cache to prevent crashes.
 */

const CACHE_NAME = 'store-v1';

// We REMOVED the icon URLs from this list because you haven't created the files yet.
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
  // '/manifest.json', // Temporarily commented out to prevent errors
  '/css/style.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];

// 1. Installation
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE.map(url => new Request(url, {cache: 'reload'})));
    }).catch(err => {
        console.error('[SW] Cache addAll failed:', err);
    })
  );
  self.skipWaiting();
});

// 2. Activation
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
  self.clients.claim();
});

// 3. Fetching
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // FIX: Ignore non-http requests (chrome-extension, etc)
  if (!url.protocol.startsWith('http')) {
    return; 
  }

  // Network First for HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache First for Assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(err => console.log('[SW] Fetch failed', err));
    })
  );
});

// 4. Push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update',
    icon: '/images/icons/icon-192x192.png', // Will just fail silently if missing
    badge: '/images/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now(), primaryKey: 1 }
  };
  event.waitUntil(self.registration.showNotification('MyStore', options));
});