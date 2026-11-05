import type { BookingPhase } from "../lib/bookingPhase";
import type { Dictionary } from "./dictionaries/en";

export function bookingPhaseLabel(phase: BookingPhase, text: Dictionary["bookings"]): string {
  const labels: Record<BookingPhase, string> = {
    ACTIVE: text.active,
    UPCOMING: text.upcoming,
    PAST: text.past,
    CANCELLED: text.cancelled,
  };
  return labels[phase];
}
