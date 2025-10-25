const CACHE_NAME = 'mala-counter-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html'
];

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event listener (Cache-first strategy)
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache, fetch from network.
        return fetch(event.request).then(
          networkResponse => {
            // Optional: You could also cache the new response here, but let's keep it simple.
            return networkResponse;
          }
        ).catch(error => {
          // This is a basic offline fallback.
          console.log('Fetch failed; returning offline page instead.', error);
        });
      })
  );
});
