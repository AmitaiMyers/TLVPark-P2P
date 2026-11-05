"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { assertLocale } from "@/i18n/config";
import { ACTION_SUCCESS, userError, type ActionResult } from "@/lib/actionResult";
import { requireCurrentUser } from "@/lib/auth";
import { isWindowAvailable } from "@/lib/availability";
import { isDoubleBookingError } from "@/lib/bookingConflict";
import { parseBookingWindow } from "@/lib/bookingWindow";
import { prisma } from "@/lib/db";
import { readInteger, readOptionalString, readRequiredString } from "@/lib/form";
import { computeBookingPriceAgorot } from "@/lib/pricing";
import { lockSpot } from "@/server/spotLock";

export async function createBooking(
  localeValue: string,
  spotId: string,
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const locale = assertLocale(localeValue);
  const renter = await requireCurrentUser(locale, `/${locale}/spots/${spotId}`);

  const parsed = parseBookingWindow(
    readRequiredString(formData, "start"),
    readRequiredString(formData, "end"),
    new Date(),
  );
  if (!parsed.ok) return userError(parsed.error);
  const { startsAt, endsAt } = parsed.window;

  type Outcome = { ok: true; bookingId: string } | { ok: false; result: ActionResult };
  let outcome: Outcome;
  // Agreed exception to the no-try/catch rule: the database exclusion
  // constraint is the only race-free double-booking check, and losing that
  // race is an expected user outcome ("someone just booked it"), not a bug.
  // Only that exact error is translated; anything else is rethrown.
  try {
    outcome = await prisma.$transaction(async (transaction): Promise<Outcome> => {
      await lockSpot(transaction, spotId);
      const spot = await transaction.parkingSpot.findUniqueOrThrow({
        where: { id: spotId },
        include: { availabilityRules: true, availabilityExceptions: true },
      });
      if (!spot.isActive) return { ok: false, result: userError("SPOT_INACTIVE") };
      if (spot.hostId === renter.id) return { ok: false, result: userError("OWN_SPOT") };
      if (!isWindowAvailable(spot.availabilityRules, spot.availabilityExceptions, startsAt, endsAt)) {
        return { ok: false, result: userError("NOT_AVAILABLE") };
      }

      const booking = await transaction.booking.create({
        data: {
          spotId,
          renterId: renter.id,
          startsAt,
          endsAt,
          totalPriceAgorot: computeBookingPriceAgorot(startsAt, endsAt, spot),
        },
      });
      return { ok: true, bookingId: booking.id };
    });
  } catch (error) {
    if (isDoubleBookingError(error)) return userError("SLOT_TAKEN");
    throw error;
  }
  if (!outcome.ok) return outcome.result;

  redirect(`/${locale}/bookings/${outcome.bookingId}?confirmed=1`);
}

function cancellingParty(
  booking: { renterId: string; spot: { hostId: string } },
  userId: string,
): "RENTER" | "HOST" {
  if (booking.renterId === userId) return "RENTER";
  if (booking.spot.hostId === userId) return "HOST";
  throw new Error(`User ${userId} is neither the renter nor the host of this booking`);
}

/** Renter or host of the spot may cancel, any time before the booking starts. */
export async function cancelBooking(
  localeValue: string,
  bookingId: string,
  _previous: ActionResult,
): Promise<ActionResult> {
  const locale = assertLocale(localeValue);
  const user = await requireCurrentUser(locale, `/${locale}/bookings/${bookingId}`);
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { spot: { select: { hostId: true } } },
  });

  const cancelledBy = cancellingParty(booking, user.id);
  if (booking.status === "CANCELLED") return userError("ALREADY_CANCELLED");

  const now = new Date();
  if (booking.startsAt <= now) return userError("CANCEL_TOO_LATE");

  // The status condition makes a simultaneous second cancel a no-op.
  const { count } = await prisma.booking.updateMany({
    where: { id: bookingId, status: "CONFIRMED" },
    data: { status: "CANCELLED", cancelledAt: now, cancelledBy },
  });
  if (count === 0) return userError("ALREADY_CANCELLED");

  refresh();
  return ACTION_SUCCESS;
}

export async function submitReview(
  localeValue: string,
  bookingId: string,
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const locale = assertLocale(localeValue);
  const user = await requireCurrentUser(locale, `/${locale}/bookings/${bookingId}`);
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { review: true } });

  if (booking.renterId !== user.id) throw new Error(`User ${user.id} did not rent booking ${bookingId}`);
  if (booking.status !== "CONFIRMED") throw new Error(`Booking ${bookingId} was cancelled and cannot be reviewed`);
  if (booking.endsAt > new Date()) return userError("REVIEW_TOO_EARLY");
  if (booking.review !== null) return userError("ALREADY_REVIEWED");

  await prisma.review.create({
    data: {
      bookingId,
      rating: readInteger(formData, "rating", { min: 1, max: 5 }),
      comment: readOptionalString(formData, "comment"),
    },
  });
  refresh();
  return ACTION_SUCCESS;
}
