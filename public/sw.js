const CACHE_VERSION = 'noeul-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Never precache index.html: it points at hashed bundles, so a stale shell is
// pinned to deleted assets after a deploy. Navigations are network-first and
// only fall back to the cached shell when offline.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
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

function isHashedAsset(request) {
  return new URL(request.url).pathname.startsWith('/assets/');
}

function isPublicApiRequest(request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/v1/')) return false;
  const publicPrefixes = ['/api/v1/catalog/', '/api/v1/content/', '/api/v1/pages/', '/api/v1/products/', '/api/v1/store/settings/public'];
  return publicPrefixes.some((p) => url.pathname.startsWith(p) || url.pathname === p);
}

// Network-first navigation with an offline shell fallback.
async function handleNavigation(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put('/index.html', response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match('/index.html');
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isHashedAsset(request)) {
    // Content-hashed: immutable, safe to serve cache-first.
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response && response.status === 200) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

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
