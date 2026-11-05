import { styles } from "./ui";

/** Suspense fallback for pages whose content depends on the request. */
export function PageLoading() {
  return (
    <main className={styles.page} aria-busy="true">
      <div className="h-8 w-2/3 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-40 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-24 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
    </main>
  );
}
