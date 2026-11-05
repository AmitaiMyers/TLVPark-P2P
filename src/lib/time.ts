/**
 * Time helpers. All booking logic works on 30-minute slots, and all local
 * (wall-clock) times are Asia/Jerusalem, regardless of the server's zone.
 *
 * Israel's UTC offset is always a whole number of hours (+02/+03), so a UTC
 * half-hour boundary is also a local half-hour boundary. The database relies
 * on the same fact (see is_half_hour_aligned in the migrations).
 */

export const TIME_ZONE = "Asia/Jerusalem";

export const MINUTE_MS = 60 * 1000;
export const SLOT_MINUTES = 30;
export const SLOT_MS = SLOT_MINUTES * MINUTE_MS;
export const MINUTES_PER_DAY = 24 * 60;

/** Matches the value of <input type="datetime-local">: "2026-11-10T14:30". */
const LOCAL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const jerusalemPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
});

type JerusalemParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dayOfWeek: number;
};

function jerusalemParts(instant: Date): JerusalemParts {
  const parts: Record<string, string> = {};
  for (const part of jerusalemPartsFormatter.formatToParts(instant)) {
    parts[part.type] = part.value;
  }
  return {
    year: Number(parts["year"]),
    month: Number(parts["month"]),
    day: Number(parts["day"]),
    hour: Number(parts["hour"]),
    minute: Number(parts["minute"]),
    dayOfWeek: WEEKDAY_INDEX[parts["weekday"]],
  };
}

/** Milliseconds to add to a UTC instant to get Jerusalem wall-clock time. */
function jerusalemOffsetMs(instant: Date): number {
  const p = jerusalemParts(instant);
  const wallClockAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  const instantToTheMinute = Math.floor(instant.getTime() / MINUTE_MS) * MINUTE_MS;
  return wallClockAsUtc - instantToTheMinute;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Formats an instant as a datetime-local value in Jerusalem time. */
export function toJerusalemInputValue(instant: Date): string {
  const p = jerusalemParts(instant);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}`;
}

/**
 * Converts a Jerusalem datetime-local value ("2026-11-10T14:30") to an instant.
 *
 * Throws on a malformed value (a tampered request, since the browser input
 * always produces this format). Returns null for a wall-clock time that does
 * not exist, which happens once a year when clocks jump forward (DST).
 */
export function parseJerusalemInputValue(value: string): Date | null {
  const match = LOCAL_DATE_TIME_PATTERN.exec(value);
  if (match === null) {
    throw new Error(`Invalid local date-time "${value}", expected YYYY-MM-DDTHH:MM`);
  }
  const [, year, month, day, hour, minute] = match.map(Number);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute);

  // Two passes: the offset at the first guess can differ from the offset at
  // the true instant when the value is close to a DST transition.
  const firstGuess = new Date(wallClockAsUtc - jerusalemOffsetMs(new Date(wallClockAsUtc)));
  const instant = new Date(wallClockAsUtc - jerusalemOffsetMs(firstGuess));

  return toJerusalemInputValue(instant) === value ? instant : null;
}

/** Local weekday (0 = Sunday) and minutes since local midnight. */
export function jerusalemWeekdayAndMinute(instant: Date): { dayOfWeek: number; minuteOfDay: number } {
  const p = jerusalemParts(instant);
  return { dayOfWeek: p.dayOfWeek, minuteOfDay: p.hour * 60 + p.minute };
}

export function isSlotAligned(instant: Date): boolean {
  return instant.getTime() % SLOT_MS === 0;
}

/** Start of the 30-minute slot containing `instant`. */
export function floorToSlot(instant: Date): Date {
  return new Date(Math.floor(instant.getTime() / SLOT_MS) * SLOT_MS);
}

/** Formats minutes since midnight as "HH:MM" (1440 is shown as "24:00"). */
export function formatMinuteOfDay(minuteOfDay: number): string {
  return `${pad2(Math.floor(minuteOfDay / 60))}:${pad2(minuteOfDay % 60)}`;
}

/** Every slot boundary of a day: 0, 30, ..., 1440. Used for time selects. */
export const MINUTE_OF_DAY_OPTIONS: readonly number[] = Array.from(
  { length: MINUTES_PER_DAY / SLOT_MINUTES + 1 },
  (_, index) => index * SLOT_MINUTES,
);

/** True when the half-open ranges [aStart, aEnd) and [bStart, bEnd) overlap. */
export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}
