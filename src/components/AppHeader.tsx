import { CircleParking } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { LanguageSwitcher } from "./HeaderControls";

/** Slim top bar: brand + language. Navigation lives in the bottom TabBar. */
export async function AppHeader() {
  const locale = await getLocale();
  const dictionary = await getDictionary();

  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-background/95 backdrop-blur dark:border-white/10">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link href={`/${locale}`} className="flex items-center gap-1.5 text-xl font-bold text-accent">
          <CircleParking size={26} aria-hidden />
          {dictionary.meta.appName}
        </Link>
        <Suspense fallback={null}>
          <LanguageSwitcher locale={locale} label={dictionary.language.switchTo} />
        </Suspense>
      </div>
    </header>
  );
}
