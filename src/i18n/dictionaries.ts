import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";
import { en } from "./dictionaries/en";
import { he } from "./dictionaries/he";

const DICTIONARIES: Record<Locale, Dictionary> = { en, he };

/** Resolves the current request's locale from the `[lang]` root segment. */
export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!isLocale(locale)) notFound();
  return locale;
}

export async function getDictionary(): Promise<Dictionary> {
  return DICTIONARIES[await getLocale()];
}
