/**
 * Shared Tailwind class sets, so every page uses the same look. Logical
 * properties (ps/pe, ms/me, text-start) keep layouts correct in RTL and LTR.
 */
export const styles = {
  page: "mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6",
  card: "rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900",
  heading: "text-2xl font-bold",
  sectionTitle: "text-lg font-semibold",
  label: "flex flex-col gap-1 text-sm font-medium",
  input:
    "w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-base text-neutral-900 dark:border-white/20 dark:bg-neutral-800 dark:text-neutral-100",
  buttonPrimary:
    "inline-flex items-center justify-center rounded-xl bg-brand px-4 py-3 font-semibold text-white disabled:opacity-50",
  buttonSecondary:
    "inline-flex items-center justify-center rounded-xl border border-brand px-4 py-2 font-semibold text-brand disabled:opacity-50",
  buttonDanger:
    "inline-flex items-center justify-center rounded-xl border border-red-600 px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-50",
  muted: "text-sm text-neutral-500 dark:text-neutral-400",
  badge: "rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand",
  error: "rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300",
  success: "rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
} as const;
