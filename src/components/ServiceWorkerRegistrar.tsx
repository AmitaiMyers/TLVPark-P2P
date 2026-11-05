"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js once the page has loaded.
 *
 * Production only: dev-server chunks are not content-hashed, so the
 * service worker's cache-first rule for /_next/static would serve stale code
 * during development.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  }, []);

  return null;
}
