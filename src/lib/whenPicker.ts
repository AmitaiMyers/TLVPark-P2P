import { MINUTE_MS, parseJerusalemInputValue, toJerusalemInputValue } from "./time";

/**
 * Helpers for the "date · start time · duration" picker. The picker still
 * submits plain `start`/`end` datetime-local values, so the server-side
 * validation (parseBookingWindow) stays the single source of truth.
 */

/** Durations offered, in minutes: 1h ... 12h, then 1, 2, 3 and 7 days. */
export const DURATION_OPTIONS_MINUTES: readonly number[] = [
  60, 90, 120, 180, 240, 360, 480, 720, 1440, 2 * 1440, 3 * 1440, 7 * 1440,
];

export const DATE_OPTION_COUNT = 14;

/** "2026-11-08T10:30" -> { date: "2026-11-08", time: "10:30" } */
export function splitInputValue(value: string): { date: string; time: string } {
  const [date, time] = value.split("T");
  if (date === undefined || time === undefined) throw new Error(`Invalid datetime-local value "${value}"`);
  return { date, time };
}

/**
 * The next `count` calendar dates in Jerusalem, starting today, as
 * "YYYY-MM-DD". Calendar arithmetic (not +24h) so DST days are not skipped.
 */
export function upcomingJerusalemDates(now: Date, count: number): string[] {
  const { date } = splitInputValue(toJerusalemInputValue(now));
  const [year, month, day] = date.split("-").map(Number);
  return Array.from({ length: count }, (_, offset) =>
    new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10),
  );
}

/** start + duration as datetime-local values, or null for a DST-gap start. */
export function windowFromParts(
  date: string,
  time: string,
  durationMinutes: number,
): { start: string; end: string } | null {
  const start = `${date}T${time}`;
  const startsAt = parseJerusalemInputValue(start);
  if (startsAt === null) return null;
  return { start, end: toJerusalemInputValue(new Date(startsAt.getTime() + durationMinutes * MINUTE_MS)) };
}

/** Minutes between two datetime-local values, or null if either is invalid. */
export function durationBetween(start: string, end: string): number | null {
  const startsAt = parseJerusalemInputValue(start);
  const endsAt = parseJerusalemInputValue(end);
  if (startsAt === null || endsAt === null) return null;
  return (endsAt.getTime() - startsAt.getTime()) / MINUTE_MS;
}
