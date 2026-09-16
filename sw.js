const CACHE_NAME = 'wc-hunter-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/main.css',
  './js/app.js',
  './js/state.js',
  './js/algorithms.js',
  './js/map.js',
  './js/seedData.js',
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
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
