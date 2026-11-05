import type { BookingWindowError } from "./bookingWindow";

/**
 * Business-rule failures a user can cause by honest input, shown as a
 * translated message next to the form. Everything else (tampered input,
 * missing records, bugs) throws instead.
 */
export type UserErrorCode =
  | BookingWindowError
  | "NOT_AVAILABLE"
  | "SLOT_TAKEN"
  | "OWN_SPOT"
  | "SPOT_INACTIVE"
  | "CANCEL_TOO_LATE"
  | "ALREADY_CANCELLED"
  | "REVIEW_TOO_EARLY"
  | "ALREADY_REVIEWED"
  | "NO_DAYS_SELECTED"
  | "RULE_END_NOT_AFTER_START"
  | "RULE_OVERLAP"
  | "EXCEPTION_OVERLAP"
  | "BLOCK_HAS_BOOKINGS"
  | "LOCATION_MISSING"
  | "LOCATION_OUTSIDE_TEL_AVIV"
  | "DAILY_CAP_BELOW_HOURLY"
  | "SPOT_TOO_SMALL"
  | "EMAIL_TAKEN";

/**
 * Result of a form-bound server action. `null` is the initial form state
 * before any submission. Actions that redirect on success never return.
 */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: UserErrorCode; details: string[] }
  | null;

export const ACTION_SUCCESS: ActionResult = { ok: true };

export function userError(error: UserErrorCode, details: string[] = []): ActionResult {
  return { ok: false, error, details };
}
