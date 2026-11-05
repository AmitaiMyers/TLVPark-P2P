/*
 * TLVPark service worker.
 *
 * Strategy:
 *   - Page navigations: network-first. Pages show live availability and
 *     bookings, so they are never served stale. If the network is
 *     unreachable, the precached offline page is shown instead.
 *   - /_next/static/*: cache-first. These files are content-hashed by the
 *     Next.js build, so a cached copy can never be outdated.
 *   - PRECACHE_URLS (offline page + icons): cache-first, so the offline page
 *     can render its own images without a network.
 *   - Everything else (API calls, server actions, POSTs): untouched.
 *
 * Bump CACHE_VERSION whenever PRECACHE_URLS or the strategy changes; the
 * activate step deletes caches from older versions.
 */

const CACHE_VERSION = "v1";
const CACHE_NAME = `tlvpark-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((staleCacheName) => caches.delete(staleCacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * Cache-first candidates: content-hashed build output, plus the precached
 * files themselves (the offline page needs its icon while offline).
 */
function isCacheFirstAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return url.pathname.startsWith("/_next/static/") || PRECACHE_URLS.includes(url.pathname);
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse !== undefined) return cachedResponse;

  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

function networkFirstWithOfflineFallback(request) {
  // The one deliberate catch in the codebase (agreed exception to the
  // fail-fast rule): fetch() rejecting is the only signal that the device is
  // offline, and serving the fallback page IS the required behavior.
  // HTTP error responses (404, 500) resolve normally and are NOT caught.
  return fetch(request).catch(() => caches.match(OFFLINE_URL));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  if (isCacheFirstAsset(new URL(request.url))) {
    event.respondWith(cacheFirst(request));
  }
});
