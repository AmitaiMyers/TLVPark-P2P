/**
 * Cache Storage bucket for booking pages saved for offline use (gate number
 * and access instructions inside underground garages with no signal).
 *
 * MUST match BOOKINGS_CACHE in public/sw.js, which reads it while offline.
 * (sw.js is a plain static file and cannot import this module.)
 */
export const OFFLINE_BOOKINGS_CACHE = "tlvpark-bookings";

function cacheStorageAvailable(): boolean {
  return typeof window !== "undefined" && "caches" in window;
}

/** Saves (or refreshes) the current page's copy for offline viewing. */
export async function saveCurrentPageOffline(): Promise<boolean> {
  if (!cacheStorageAvailable()) return false;
  const cache = await caches.open(OFFLINE_BOOKINGS_CACHE);
  await cache.add(window.location.pathname);
  return true;
}

export async function removeCurrentPageOffline(): Promise<void> {
  if (!cacheStorageAvailable()) return;
  const cache = await caches.open(OFFLINE_BOOKINGS_CACHE);
  await cache.delete(window.location.pathname);
}

/** Called on sign-out, so the next person on this device can't read them. */
export async function clearOfflineBookings(): Promise<void> {
  if (!cacheStorageAvailable()) return;
  await caches.delete(OFFLINE_BOOKINGS_CACHE);
}

export async function isCurrentPageSavedOffline(): Promise<boolean> {
  if (!cacheStorageAvailable()) return false;
  const cache = await caches.open(OFFLINE_BOOKINGS_CACHE);
  return (await cache.match(window.location.pathname)) !== undefined;
}
