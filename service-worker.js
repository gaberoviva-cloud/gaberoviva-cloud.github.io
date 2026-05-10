/* ═══════════════════════════════════════════════
   RG DO PET — Service Worker
   Estratégia: Cache First + Network Fallback
   100% offline após primeiro carregamento
   ═══════════════════════════════════════════════ */

const CACHE_NAME = 'rgpet-v2';

const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json'
];

/* ── INSTALL: pré-cacheia os assets essenciais ── */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

/* ── ACTIVATE: limpa caches antigos ── */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ── FETCH: Cache First, depois rede ── */
self.addEventListener('fetch', (e) => {
  // Ignorar requisições não-GET e cross-origin (Google Maps etc)
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => {
        // Fallback: qualquer navegação retorna o index.html
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
