const CACHE_VERSION = 'noeul-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

const STATIC_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function isImageRequest(request) {
  const url = new URL(request.url);
  if (request.destination === 'image') return true;
  return /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(url.pathname);
}

function isPublicApiRequest(request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/v1/')) return false;
  const publicPrefixes = ['/api/v1/catalog/', '/api/v1/content/', '/api/v1/pages/', '/api/v1/products/', '/api/v1/store/settings/public'];
  return publicPrefixes.some((p) => url.pathname.startsWith(p) || url.pathname === p);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (isImageRequest(request)) {
    // Cache-first for images.
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        } catch (e) {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  if (isPublicApiRequest(request)) {
    // Network-first for API, fallback to cache.
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        } catch (e) {
          const cached = await cache.match(request);
          if (cached) return cached;
          throw e;
        }
      })
    );
    return;
  }

  // Default: network-first with cache fallback.
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});