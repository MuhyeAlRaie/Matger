/**
 * SERVICE-WORKER.JS
 * Handles Offline Caching and Asset Management
 */

// Version your cache to force updates when you change files
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `ecommerce-store-${CACHE_VERSION}`;

// 1. The "App Shell" - Files required for the basic layout to load
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './cart.html',
    './checkout.html',
    './login.html',
    './register.html',
    './category.html',
    './product.html',
    './css/style.css',
    './js/supabase-config.js',
    './js/app.js',
    './js/cart.js',
    './js/products.js',
    './js/auth.js',
    './js/checkout.js',
    './js/pwa-installer.js',
    './manifest.json',
    // External Libraries (Crucial for offline look & feel)
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://unpkg.com/@supabase/supabase-js@2'
];

// ==========================================
// INSTALL EVENT
// ==========================================
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.error('[Service Worker] Installation failed:', error);
            })
    );
    
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// ==========================================
// ACTIVATE EVENT
// ==========================================
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    // Delete old caches if the name has changed
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    
    // Take control of all pages immediately
    return self.clients.claim();
});

// ==========================================
// FETCH EVENT
// ==========================================
self.addEventListener('fetch', (event) => {
    // Network First Strategy for HTML pages (to get fresh content)
    // Cache First Strategy for Assets (Images, CSS, JS) for speed
    
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            
            // CACHE HIT: Return the cached version immediately
            if (cachedResponse) {
                // Optional: Fetch in background to update cache for next time (Stale-While-Revalidate)
                fetchAndCache(event.request);
                return cachedResponse;
            }

            // CACHE MISS: Fetch from network
            return fetchAndCache(event.request);
        })
    );
});

// Helper function to fetch and store in cache
function fetchAndCache(request) {
    return fetch(request).then((networkResponse) => {
        // Check if valid response
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
        }

        // Clone the response because it's a stream and can only be consumed once
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
        });

        return networkResponse;
    }).catch((error) => {
        console.log('[Service Worker] Fetch failed:', error);
        // You could return a custom offline fallback page here if needed
        throw error;
    });
}

// ==========================================
// PUSH NOTIFICATION HANDLERS
// (Add this to the end of service-worker.js)
// ==========================================

// 1. Listen for Push Event
self.addEventListener('push', (event) => {
    const data = event.data.json();
    console.log('Push Received:', data);

    const options = {
        body: data.body || 'New update from MyStore',
        icon: 'images/icons/icon-192x192.png',
        badge: 'images/icons/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            { action: 'explore', title: 'Go to Store', icon: 'images/icons/icon-192x192.png' },
            { action: 'close', title: 'Close', icon: 'images/icons/icon-192x192.png' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'MyStore', options)
    );
});

// 2. Handle Notification Click
self.addEventListener('notificationclick', (event) => {
    console.log('Notification click Received.');

    event.notification.close();

    event.waitUntil(
        clients.openWindow('https://your-username.github.io/repo-name/')
    );
});