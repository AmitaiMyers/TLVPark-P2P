import { Prisma } from "@/generated/prisma/client";

const DOUBLE_BOOKING_CONSTRAINT = "Booking_no_double_booking";
const POSTGRES_EXCLUSION_VIOLATION = "23P01";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * True only for the Postgres exclusion-constraint violation raised when two
 * confirmed bookings of one spot would overlap (someone else just booked it).
 *
 * Shape verified against Prisma 7.10 + @prisma/adapter-pg:
 *   code "P2039", meta.driverAdapterError.cause = { code: "23P01", message: "... Booking_no_double_booking ..." }
 */
export function isDoubleBookingError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2039" || !isRecord(error.meta)) return false;

  const adapterError = error.meta["driverAdapterError"];
  if (!isRecord(adapterError) || !isRecord(adapterError["cause"])) return false;

  const cause = adapterError["cause"];
  return (
    cause["code"] === POSTGRES_EXCLUSION_VIOLATION &&
    typeof cause["message"] === "string" &&
    cause["message"].includes(DOUBLE_BOOKING_CONSTRAINT)
  );
}
