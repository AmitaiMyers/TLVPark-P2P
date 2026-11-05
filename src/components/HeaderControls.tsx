"use client";

import { Languages, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "@/actions/auth";
import type { Locale } from "@/i18n/config";
import { clearOfflineBookings } from "@/lib/offline";
import { styles } from "./ui";

const OTHER_LOCALE: Record<Locale, Locale> = { he: "en", en: "he" };

/** Same page and query string, other language: /he/spots/x -> /en/spots/x. */
export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathWithoutLocale = pathname.slice(`/${locale}`.length);
  const query = searchParams.toString();
  const href = `/${OTHER_LOCALE[locale]}${pathWithoutLocale}${query === "" ? "" : `?${query}`}`;
  return (
    <Link
      href={href}
      lang={OTHER_LOCALE[locale]}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-black/15 px-3 text-sm font-medium dark:border-white/20"
    >
      <Languages size={16} aria-hidden />
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
      <button type="submit" className={`${styles.buttonDanger} w-full gap-2`}>
        <LogOut size={18} aria-hidden />
        {label}
      </button>
    </form>
  );
}
