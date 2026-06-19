const CACHE_NAME = 'eng-galaxy-v33';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/primary.html',
  '/middle-school.html',
  '/high-school.html',
  '/independent-learning.html',
  '/search.html',
  '/assets/css/style.css',
  '/assets/js/main.js',
  '/assets/js/theme-loader.js',
  '/assets/js/i18n.js',
  '/assets/images/logo_hero.png',
  '/assets/images/logo_small.png'
];

self.addEventListener('install', event => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', event => {
  // Tell the active service worker to take control of the page immediately
  event.waitUntil(self.clients.claim());
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  const isHtml = event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html');
  const isJs = event.request.url.endsWith('.js');

  if (isHtml || isJs) {
    // Network First for HTML and JS
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        const clonedResponse = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clonedResponse);
        });
        return networkResponse;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
  } else {
    // Cache First for CSS, Images, etc.
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request).then(networkResponse => {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return networkResponse;
        });
      })
    );
  }
});
