import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "@/i18n/config";

/**
 * Picks the first supported locale from the Accept-Language header, in the
 * browser's preference order. Example header: "en-US,en;q=0.9,he;q=0.8".
 */
function localeFromAcceptLanguage(header: string | null): Locale {
  if (header === null) return DEFAULT_LOCALE;

  const languageTags = header.split(",").map((part) => part.split(";")[0].trim());
  for (const tag of languageTags) {
    const baseLanguage = tag.split("-")[0].toLowerCase();
    if (isLocale(baseLanguage)) return baseLanguage;
  }
  return DEFAULT_LOCALE;
}

function pathnameHasLocale(pathname: string): boolean {
  return LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathnameHasLocale(pathname)) return;

  // `Headers` only exposes `.get()`; a missing header is handled explicitly above.
  const locale = localeFromAcceptLanguage(request.headers.get("accept-language"));
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Skip Next internals, API routes, and any file with an extension
  // (sw.js, manifest, icons, offline.html, favicon.ico, ...).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
