const CACHE_NAME = 'wc-hunter-cache-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/main.css',
  './js/app.js',
  './js/state.js',
  './js/seedData.js',
  './js/map.js',
  './js/engines/wcEngine.js',
  './js/engines/gameEngine.js',
  './js/engines/userEngine.js',
  './js/views/mapView.js',
  './js/views/nearView.js',
  './js/views/rankingView.js',
  './js/views/hunterView.js',
  './js/views/profileView.js',
  './js/views/wcDetailModal.js',
  './js/views/addWcModal.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => console.warn('Cache install warning:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Purgando cache antigua:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia Network-First: Intenta obtener de la red para estar siempre al día. Si falla (sin internet), recurre a la caché.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

