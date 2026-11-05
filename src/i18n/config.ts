/**
 * Locale configuration shared by the proxy (locale redirect), server components
 * and client components. Must stay free of server-only imports.
 */

export const LOCALES = ["he", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** Hebrew first: the app targets Tel Aviv residents. */
export const DEFAULT_LOCALE: Locale = "he";

export const LOCALE_DIRECTION: Record<Locale, "rtl" | "ltr"> = {
  he: "rtl",
  en: "ltr",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
