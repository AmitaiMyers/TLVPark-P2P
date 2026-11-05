import type { Locale } from "../i18n/config";
import { fillTemplate } from "../i18n/template";
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

/** "Today", "Tomorrow", or e.g. "Sun, 8 Nov", for a "YYYY-MM-DD" date. */
export function formatDayOption(
  date: string,
  index: number,
  locale: Locale,
  labels: { today: string; tomorrow: string },
): string {
  if (index === 0) return labels.today;
  if (index === 1) return labels.tomorrow;
  const [year, month, day] = date.split("-").map(Number);
  // Noon UTC on that calendar date, formatted in UTC: always the same date.
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

type DurationLabels = { oneHour: string; hours: string; oneDay: string; days: string };

/** 60 -> "1 hour", 90 -> "1.5 hours", 2880 -> "2 days". */
export function formatDuration(minutes: number, labels: DurationLabels): string {
  const minutesPerDay = 24 * 60;
  if (minutes % minutesPerDay === 0) {
    const days = minutes / minutesPerDay;
    return days === 1 ? labels.oneDay : fillTemplate(labels.days, { count: days });
  }
  const hours = minutes / 60;
  return hours === 1 ? labels.oneHour : fillTemplate(labels.hours, { count: hours });
}
