import { floorToSlot, isSlotAligned, MINUTE_MS, parseJerusalemInputValue, SLOT_MS, toJerusalemInputValue } from "./time";

export const MIN_BOOKING_MS = 60 * MINUTE_MS;
/** Upper bound so one request cannot ask for years of slots. */
export const MAX_BOOKING_MS = 30 * 24 * 60 * MINUTE_MS;

export type BookingWindowError =
  | "INVALID_LOCAL_TIME"
  | "NOT_ON_SLOT"
  | "END_NOT_AFTER_START"
  | "TOO_SHORT"
  | "TOO_LONG"
  | "IN_THE_PAST";

export type BookingWindow = { startsAt: Date; endsAt: Date };

export type BookingWindowResult =
  | { ok: true; window: BookingWindow }
  | { ok: false; error: BookingWindowError };

/**
 * Validates a booking window entered as two Jerusalem datetime-local values.
 * The current, already-started slot may still be booked ("park now").
 */
export function parseBookingWindow(startValue: string, endValue: string, now: Date): BookingWindowResult {
  const startsAt = parseJerusalemInputValue(startValue);
  const endsAt = parseJerusalemInputValue(endValue);
  if (startsAt === null || endsAt === null) return { ok: false, error: "INVALID_LOCAL_TIME" };
  if (!isSlotAligned(startsAt) || !isSlotAligned(endsAt)) return { ok: false, error: "NOT_ON_SLOT" };

  const durationMs = endsAt.getTime() - startsAt.getTime();
  if (durationMs <= 0) return { ok: false, error: "END_NOT_AFTER_START" };
  if (durationMs < MIN_BOOKING_MS) return { ok: false, error: "TOO_SHORT" };
  if (durationMs > MAX_BOOKING_MS) return { ok: false, error: "TOO_LONG" };
  if (startsAt < floorToSlot(now)) return { ok: false, error: "IN_THE_PAST" };

  return { ok: true, window: { startsAt, endsAt } };
}

const SUGGESTED_DURATION_MS = 2 * 60 * MINUTE_MS;

/** Prefilled form values: the next half-hour boundary, for two hours. */
export function suggestedWindowValues(now: Date): { start: string; end: string } {
  const currentSlot = floorToSlot(now);
  const nextSlotMs = currentSlot.getTime() === now.getTime() ? now.getTime() : currentSlot.getTime() + SLOT_MS;
  return {
    start: toJerusalemInputValue(new Date(nextSlotMs)),
    end: toJerusalemInputValue(new Date(nextSlotMs + SUGGESTED_DURATION_MS)),
  };
}

/** Earliest value a booking start may take (the slot in progress). */
export function earliestStartValue(now: Date): string {
  return toJerusalemInputValue(floorToSlot(now));
}
