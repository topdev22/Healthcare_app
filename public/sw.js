// Basic Service Worker for Health Buddy PWA
// Implements caching for offline support: app shell (static assets) with cache-first
// Network-first for dynamic API calls (/api/*)
// Minimal setup without advanced features

const CACHE_NAME = 'health-buddy-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/global.css',
  '/App.tsx'  // Note: In dev, this is served; in prod, hashed - SW will cache on first fetch
  // Add more static assets as needed; dynamic JS/CSS cached on fetch below
];

// Install event: Pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event: Strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache-first for static assets (app shell)
  if (urlsToCache.some(cachedUrl => event.request.url.includes(cachedUrl) || url.origin === self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch and cache
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              // Clone and cache
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              return response;
            });
        })
    );
  } else if (url.pathname.startsWith('/api/')) {
    // Network-first for API calls, fallback to cache if offline
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful API responses for offline fallback
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
  }
  // For other requests, default to network
});