"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "@/actions/auth";
import type { Locale } from "@/i18n/config";
import { clearOfflineBookings } from "@/lib/offline";

const OTHER_LOCALE: Record<Locale, Locale> = { he: "en", en: "he" };

/** Same page and query string, other language: /he/spots/x -> /en/spots/x. */
export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathWithoutLocale = pathname.slice(`/${locale}`.length);
  const query = searchParams.toString();
  const href = `/${OTHER_LOCALE[locale]}${pathWithoutLocale}${query === "" ? "" : `?${query}`}`;
  return (
    <Link href={href} className="text-sm underline">
      {label}
    </Link>
  );
}

/** Clears offline-saved booking pages before ending the session. */
export function SignOutButton({ locale, label }: { locale: Locale; label: string }) {
  async function handleSignOut() {
    await clearOfflineBookings();
    await signOut(locale);
  }
  return (
    <form action={handleSignOut}>
      <button type="submit" className="text-sm underline">
        {label}
      </button>
    </form>
  );
}
