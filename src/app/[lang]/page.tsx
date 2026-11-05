import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

const OTHER_LOCALE: Record<Locale, Locale> = { he: "en", en: "he" };

/**
 * Placeholder landing page. The map search and host flows replace the
 * call-to-action links once those features are built.
 */
export default async function HomePage() {
  const locale = await getLocale();
  const dictionary = await getDictionary();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold text-brand">{dictionary.meta.appName}</h1>
        <p className="text-lg">{dictionary.home.tagline}</p>
      </header>

      <nav className="flex flex-col gap-3">
        <span className="rounded-xl bg-brand px-4 py-3 text-center font-semibold text-white">
          {dictionary.home.findSpot}
        </span>
        <span className="rounded-xl border border-brand px-4 py-3 text-center font-semibold text-brand">
          {dictionary.home.listSpot}
        </span>
      </nav>

      <Link href={`/${OTHER_LOCALE[locale]}`} className="text-center text-sm underline">
        {dictionary.language.switchTo}
      </Link>
    </main>
  );
}
