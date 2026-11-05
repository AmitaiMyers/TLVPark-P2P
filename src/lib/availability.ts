import { jerusalemWeekdayAndMinute, SLOT_MINUTES, SLOT_MS } from "./time";

export type WeeklyRule = { dayOfWeek: number; startMinute: number; endMinute: number };

export type AvailabilityOverride = {
  kind: "BLOCKED" | "EXTRA";
  startsAt: Date;
  endsAt: Date;
};

/**
 * Is a single 30-minute slot open for booking?
 *
 * Precedence: a one-off exception (BLOCKED or EXTRA) wins over the weekly
 * schedule. Exceptions never overlap (database constraint) and are
 * slot-aligned, so at most one exception covers a slot, and it covers it fully.
 */
function isSlotAvailable(rules: WeeklyRule[], overrides: AvailabilityOverride[], slotStartMs: number): boolean {
  const slotEndMs = slotStartMs + SLOT_MS;
  const coveringOverride = overrides.find(
    (override) => override.startsAt.getTime() <= slotStartMs && slotEndMs <= override.endsAt.getTime(),
  );
  if (coveringOverride !== undefined) return coveringOverride.kind === "EXTRA";

  const { dayOfWeek, minuteOfDay } = jerusalemWeekdayAndMinute(new Date(slotStartMs));
  return rules.some(
    (rule) =>
      rule.dayOfWeek === dayOfWeek &&
      rule.startMinute <= minuteOfDay &&
      minuteOfDay + SLOT_MINUTES <= rule.endMinute,
  );
}

/**
 * True when every slot in [startsAt, endsAt) is open according to the host's
 * schedule. Existing bookings are NOT checked here: the database exclusion
 * constraint is the single source of truth for double-booking.
 *
 * Walking slot by slot keeps DST transitions correct: each slot's local
 * weekday and time are computed individually.
 */
export function isWindowAvailable(
  rules: WeeklyRule[],
  overrides: AvailabilityOverride[],
  startsAt: Date,
  endsAt: Date,
): boolean {
  for (let slotStartMs = startsAt.getTime(); slotStartMs < endsAt.getTime(); slotStartMs += SLOT_MS) {
    if (!isSlotAvailable(rules, overrides, slotStartMs)) return false;
  }
  return true;
}
