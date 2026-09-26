// SWM Tactical Service Worker (PWA)
const CACHE_VERSION = 'swm-v1.0.0';
const STATIC_CACHE = `swm-static-${CACHE_VERSION}`;
const DATA_CACHE = `swm-data-${CACHE_VERSION}`;

// Core assets required for instant offline shell start
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SWM ServiceWorker] Pre-cache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== DATA_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET requests and internal browser schemes
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. Navigation requests (HTML SPA routing) -> Network-First, fall back to cached index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(STATIC_CACHE);
          return (await cache.match(req)) || (await cache.match('/index.html')) || (await cache.match('/'));
        })
    );
    return;
  }

  // 2. Vite hashed static assets (/assets/*), fonts, icons -> Cache-First
  if (url.pathname.startsWith('/assets/') || url.hostname.includes('fonts.gstatic.com') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // 3. Dynamic JSON data (/data/*, skills shards) -> Stale-While-Revalidate
  if (url.pathname.startsWith('/data/') || url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const networkFetch = fetch(req).then((res) => {
          if (res.ok) {
            cache.put(req, res.clone());
          }
          return res;
        }).catch(() => null);

        return cached || (await networkFetch);
      })
    );
    return;
  }

  // 4. Default: Network with Cache fallback
  event.respondWith(
    fetch(req)
      .then((res) => {
        return res;
      })
      .catch(async () => {
        const match = await caches.match(req);
        if (match) return match;
        return new Response('Network error occurred while offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});

// Allow client app to trigger instant update
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
