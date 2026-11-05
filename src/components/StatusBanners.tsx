"use client";

import { useState, useSyncExternalStore } from "react";
import { styles } from "./ui";

function subscribeToConnectivity(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** Thin banner shown while the device has no network connection. */
export function OfflineBanner({ message }: { message: string }) {
  const isOffline = useSyncExternalStore(
    subscribeToConnectivity,
    () => !navigator.onLine,
    () => false, // Server render: assume online.
  );
  if (!isOffline) return null;
  return (
    <p role="status" className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
      {message}
    </p>
  );
}

const INSTALL_HINT_DISMISSED_KEY = "tlvpark-install-hint-dismissed";

function subscribeNever(): () => void {
  return () => {};
}

/**
 * iOS Safari never shows an install prompt, so iPhone users get a one-time
 * hint. Android/desktop Chrome show their own prompt from the manifest.
 */
function shouldOfferIosInstall(): boolean {
  const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isInstalled = window.matchMedia("(display-mode: standalone)").matches;
  return isIos && !isInstalled && localStorage.getItem(INSTALL_HINT_DISMISSED_KEY) === null;
}

export function InstallHint({ title, body, dismissLabel }: { title: string; body: string; dismissLabel: string }) {
  const offer = useSyncExternalStore(subscribeNever, shouldOfferIosInstall, () => false);
  const [dismissed, setDismissed] = useState(false);
  if (!offer || dismissed) return null;

  function dismiss() {
    localStorage.setItem(INSTALL_HINT_DISMISSED_KEY, "1");
    setDismissed(true);
  }

  return (
    <aside className={`${styles.card} fixed inset-x-4 bottom-20 z-20 flex flex-col gap-2 shadow-lg`}>
      <p className="font-semibold">{title}</p>
      <p className="text-sm">{body}</p>
      <button type="button" onClick={dismiss} className={`${styles.buttonSecondary} self-end`}>
        {dismissLabel}
      </button>
    </aside>
  );
}
