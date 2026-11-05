"use client";

import { useEffect, useState } from "react";
import { isCurrentPageSavedOffline, removeCurrentPageOffline, saveCurrentPageOffline } from "@/lib/offline";
import { styles } from "./ui";

/**
 * Keeps this booking page in the offline cache while it is upcoming or active,
 * and removes it otherwise (cancelled or finished bookings).
 */
export function SaveBookingOffline({ keepOffline, savedLabel }: { keepOffline: boolean; savedLabel: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Offline, this page is the saved copy: re-saving would need the network.
    if (!navigator.onLine) {
      void isCurrentPageSavedOffline().then(setSaved);
      return;
    }
    if (keepOffline) {
      void saveCurrentPageOffline().then(setSaved);
    } else {
      void removeCurrentPageOffline();
    }
  }, [keepOffline]);

  return saved ? <p className={styles.success}>✓ {savedLabel}</p> : null;
}
