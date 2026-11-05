import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { LanguageSwitcher, SignOutButton } from "./HeaderControls";

async function UserControls() {
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const user = await getCurrentUser();

  if (user === null) {
    return (
      <Link href={`/${locale}/login`} className="text-sm font-semibold text-brand">
        {dictionary.nav.login}
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span className="max-w-28 truncate text-sm">{user.name}</span>
      <SignOutButton locale={locale} label={dictionary.nav.logout} />
    </div>
  );
}

/** Static part (logo, links) prerenders; the signed-in user streams in. */
export async function AppHeader() {
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const links = [
    { href: `/${locale}`, label: dictionary.nav.findParking },
    { href: `/${locale}/bookings`, label: dictionary.nav.myBookings },
    { href: `/${locale}/host`, label: dictionary.nav.host },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-background/95 backdrop-blur dark:border-white/10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href={`/${locale}`} className="text-xl font-bold text-brand">
            {dictionary.meta.appName}
          </Link>
          <div className="flex items-center gap-3">
            <Suspense fallback={null}>
              <LanguageSwitcher locale={locale} label={dictionary.language.switchTo} />
            </Suspense>
            <Suspense fallback={<span className="h-4 w-16 animate-pulse rounded bg-neutral-200" />}>
              <UserControls />
            </Suspense>
          </div>
        </div>
        <nav className="flex gap-4 text-sm font-medium">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
