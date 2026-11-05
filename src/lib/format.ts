import type { Locale } from "../i18n/config";
import { TIME_ZONE } from "./time";

const INTL_LOCALE: Record<Locale, string> = { he: "he-IL", en: "en-IL" };

/** "₪15" for whole shekels, "₪7.50" otherwise. */
export function formatIls(agorot: number, locale: Locale): string {
  const isWholeShekel = agorot % 100 === 0;
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: isWholeShekel ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(agorot / 100);
}

export function formatDateTime(instant: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(instant);
}

export function formatDateTimeRange(startsAt: Date, endsAt: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatRange(startsAt, endsAt);
}

export function formatAverageRating(ratings: number[]): string | null {
  if (ratings.length === 0) return null;
  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return average.toFixed(1);
}
