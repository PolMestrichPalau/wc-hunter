// WC HUNTER — Service Worker (network-first)
// Siempre intenta la red (así las actualizaciones llegan al instante) y guarda copia
// de los recursos del propio sitio para poder abrir la app sin conexión.
// Nota: Tailwind/Leaflet/fuentes se cargan de CDN; sin conexión la interfaz puede verse sin estilos.
const CACHE = 'wc-hunter-v5.5';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // no tocar CDN, teselas ni APIs externas

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))
      )
  );
});
