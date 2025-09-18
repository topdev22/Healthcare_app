// Improved Service Worker for Health Buddy PWA
// Pre-caches stable app shell assets
// Runtime caches built assets (/assets/*), images, etc.
// Serves /index.html for SPA navigation requests
// Network-first for API, cache-first for static, network for others
// Compatible with Vite production builds on Vercel

const CACHE_NAME = 'health-buddy-v2'; // Bump version for cache cleanup
const urlsToPrecache = [
  '/',
  '/index.html',
  '/global.css',
  '/manifest.json'
  // Note: Dynamic JS/CSS files are cached on first fetch
];

// Install: Pre-cache stable assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Pre-caching app shell');
        return cache.addAll(urlsToPrecache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches and take control
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

// Fetch: Handle requests with appropriate strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET or cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // SPA Navigation: Serve /index.html for document requests (cache-first, fallback network)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch('/index.html')
            .then((response) => {
              // Cache the fresh index.html
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put('/index.html', responseToCache));
              return response;
            })
            .catch(() => {
              // Offline: Show offline page or cached index if available
              return caches.match('/index.html');
            });
        })
    );
    return;
  }

  // Static assets: Cache-first (JS/CSS/images/fonts from /assets/ or public/)
  const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|ico|woff2?|ttf|svg)(\?.*)?$/.test(url.pathname) ||
                        url.pathname.startsWith('/assets/') ||
                        url.pathname.startsWith('/images/') ||
                        url.pathname.startsWith('/character/');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              // Cache successful static responses
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(request, responseToCache));
              return response;
            });
        })
    );
    return;
  }

  // API calls: Network-first, cache successful responses for offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache even error responses? No, only successful for fallback
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, responseToCache));
          }
          return response;
        })
        .catch(() => {
          // Offline: Return cached response if available
          return caches.match(request);
        })
    );
    return;
  }

  // Default: Network-first (e.g., external resources)
  event.respondWith(fetch(request));
});