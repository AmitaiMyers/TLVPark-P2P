"use client";

import { CalendarCheck, House, Search, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

type Tab = { path: string; label: string; icon: LucideIcon };

type TabBarProps = { locale: Locale; text: Dictionary["nav"] };

function tabsFor(text: Dictionary["nav"]): Tab[] {
  return [
    { path: "", label: text.findParking, icon: Search },
    { path: "/bookings", label: text.myBookings, icon: CalendarCheck },
    { path: "/host", label: text.host, icon: House },
    { path: "/account", label: text.account, icon: UserRound },
  ];
}

/** Search is active on its page and spot pages; other tabs cover their sub-pages. */
function isActive(locale: Locale, tab: Tab, pathname: string): boolean {
  const href = `/${locale}${tab.path}`;
  if (tab.path === "") return pathname === href || pathname.startsWith(`/${locale}/spots/`);
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TabBarView({ locale, text, pathname }: TabBarProps & { pathname: string | null }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-white/10">
      <ul className="mx-auto grid max-w-3xl grid-cols-4">
        {tabsFor(text).map((tab) => {
          const active = pathname !== null && isActive(locale, tab, pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.path}>
              <Link
                href={`/${locale}${tab.path}`}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  active ? "text-accent" : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} aria-hidden />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Bottom navigation: the four main areas within thumb reach, active tab highlighted. */
export function TabBar(props: TabBarProps) {
  return <TabBarView {...props} pathname={usePathname()} />;
}

/** Same bar without an active tab: the Suspense fallback while the URL is read. */
export function TabBarPlaceholder(props: TabBarProps) {
  return <TabBarView {...props} pathname={null} />;
}
