/*
 * TLVPark service worker.
 *
 * Strategy:
 *   - Page navigations: network-first. Pages show live availability and
 *     bookings, so they are never served stale. When the network is
 *     unreachable:
 *       1. a booking page the renter saved for offline use is served from
 *          BOOKINGS_CACHE (gate number + access instructions work inside
 *          underground garages without signal);
 *       2. otherwise the precached offline page is shown, listing those
 *          saved bookings.
 *   - /_next/static/*: cache-first. These files are content-hashed by the
 *     Next.js build, so a cached copy can never be outdated.
 *   - PRECACHE_URLS (offline page + icons): cache-first, so the offline page
 *     can render its own images without a network.
 *   - Everything else (API calls, server actions, POSTs): untouched.
 *
 * Bump CACHE_VERSION whenever PRECACHE_URLS or the strategy changes; the
 * activate step deletes old static caches. BOOKINGS_CACHE is owned by the
 * page (src/lib/offline.ts) and is never deleted here.
 */

const CACHE_VERSION = "v2";
const STATIC_CACHE = `tlvpark-${CACHE_VERSION}`;
/** MUST match OFFLINE_BOOKINGS_CACHE in src/lib/offline.ts. */
const BOOKINGS_CACHE = "tlvpark-bookings";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
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
            .filter((cacheName) => cacheName !== STATIC_CACHE && cacheName !== BOOKINGS_CACHE)
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
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

/** Saved booking page for this exact path, else the generic offline page. */
async function offlineResponseFor(request) {
  const bookingsCache = await caches.open(BOOKINGS_CACHE);
  const savedBookingPage = await bookingsCache.match(new URL(request.url).pathname);
  if (savedBookingPage !== undefined) return savedBookingPage;
  return caches.match(OFFLINE_URL);
}

function networkFirstWithOfflineFallback(request) {
  // The one deliberate catch in this file (agreed exception to the
  // fail-fast rule): fetch() rejecting is the only signal that the device is
  // offline, and serving the fallback page IS the required behavior.
  // HTTP error responses (404, 500) resolve normally and are NOT caught.
  return fetch(request).catch(() => offlineResponseFor(request));
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
