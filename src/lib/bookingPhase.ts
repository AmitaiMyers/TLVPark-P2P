/**
 * A booking's phase is derived from its status and the current time, never
 * stored, so it can never go stale.
 */
export type BookingPhase = "ACTIVE" | "UPCOMING" | "PAST" | "CANCELLED";

export const BOOKING_PHASES_IN_DISPLAY_ORDER: readonly BookingPhase[] = ["ACTIVE", "UPCOMING", "PAST", "CANCELLED"];

type PhaseInput = { status: "CONFIRMED" | "CANCELLED"; startsAt: Date; endsAt: Date };

export function bookingPhase(booking: PhaseInput, now: Date): BookingPhase {
  if (booking.status === "CANCELLED") return "CANCELLED";
  if (now < booking.startsAt) return "UPCOMING";
  if (now < booking.endsAt) return "ACTIVE";
  return "PAST";
}

/** Gate number and instructions are shown only while they are useful. */
export function canSeeAccessDetails(phase: BookingPhase): boolean {
  return phase === "ACTIVE" || phase === "UPCOMING";
}
