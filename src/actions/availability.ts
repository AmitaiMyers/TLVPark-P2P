"use server";

import { refresh } from "next/cache";
import { assertLocale } from "@/i18n/config";
import { ACTION_SUCCESS, userError, type ActionResult } from "@/lib/actionResult";
import { prisma } from "@/lib/db";
import { EXCEPTION_KINDS } from "@/lib/enums";
import { formatDateTimeRange } from "@/lib/format";
import { readEnum, readInteger, readIntegerList, readOptionalString, readRequiredString } from "@/lib/form";
import { isSlotAligned, MINUTES_PER_DAY, parseJerusalemInputValue, SLOT_MINUTES } from "@/lib/time";
import { anyWindowsOverlap, windowsForDays, windowsOverlap } from "@/lib/weeklyWindows";
import { lockSpot } from "@/server/spotLock";
import { requireOwnedSpot } from "@/server/spots";

function readSlotMinute(formData: FormData, name: string, max: number): number {
  const minute = readInteger(formData, name, { min: 0, max });
  if (minute % SLOT_MINUTES !== 0) throw new Error(`Form field "${name}" must be a multiple of ${SLOT_MINUTES}`);
  return minute;
}

/** Adds the same time window to every selected weekday. */
export async function addWeeklyRules(
  localeValue: string,
  spotId: string,
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const locale = assertLocale(localeValue);
  await requireOwnedSpot(locale, spotId);

  const days = readIntegerList(formData, "days", { min: 0, max: 6 });
  if (days.length === 0) return userError("NO_DAYS_SELECTED");
  // The start select offers 00:00-23:30 and the end select 00:00-24:00.
  const startMinute = readSlotMinute(formData, "startMinute", MINUTES_PER_DAY - SLOT_MINUTES);
  const endMinute = readSlotMinute(formData, "endMinute", MINUTES_PER_DAY);
  // An end before the start is an overnight window; only equal times are invalid.
  if (endMinute === startMinute) return userError("RULE_EMPTY_WINDOW");

  const newWindows = windowsForDays(days, startMinute, endMinute);
  const overlapsEachOther = anyWindowsOverlap(newWindows);
  // Checked here for a friendly message; the database EXCLUDE constraint
  // remains the guarantee.
  const existingRules = await prisma.availabilityRule.findMany({ where: { spotId } });
  const overlapsExisting = newWindows.some((window) => existingRules.some((rule) => windowsOverlap(window, rule)));
  if (overlapsEachOther || overlapsExisting) return userError("RULE_OVERLAP");

  await prisma.availabilityRule.createMany({ data: newWindows.map((window) => ({ spotId, ...window })) });
  refresh();
  return ACTION_SUCCESS;
}

export async function deleteWeeklyRule(localeValue: string, spotId: string, ruleId: string): Promise<void> {
  const locale = assertLocale(localeValue);
  await requireOwnedSpot(locale, spotId);
  // Scoped to the spot so a tampered ruleId cannot touch another host's rule.
  await prisma.availabilityRule.delete({ where: { id: ruleId, spotId } });
  refresh();
}

/**
 * Adds a one-off BLOCKED or EXTRA window. A BLOCKED window over confirmed
 * bookings is refused (agreed rule): the host must cancel those first.
 */
export async function addAvailabilityException(
  localeValue: string,
  spotId: string,
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const locale = assertLocale(localeValue);
  await requireOwnedSpot(locale, spotId);

  const kind = readEnum(formData, "kind", EXCEPTION_KINDS);
  const startsAt = parseJerusalemInputValue(readRequiredString(formData, "start"));
  const endsAt = parseJerusalemInputValue(readRequiredString(formData, "end"));
  if (startsAt === null || endsAt === null) return userError("INVALID_LOCAL_TIME");
  if (!isSlotAligned(startsAt) || !isSlotAligned(endsAt)) return userError("NOT_ON_SLOT");
  if (endsAt <= startsAt) return userError("END_NOT_AFTER_START");

  const note = readOptionalString(formData, "note");
  const overlapping = { startsAt: { lt: endsAt }, endsAt: { gt: startsAt } };

  const result = await prisma.$transaction(async (transaction): Promise<ActionResult> => {
    // Serializes with createBooking, so no booking can slip in between the
    // check below and the insert.
    await lockSpot(transaction, spotId);

    const clashingException = await transaction.availabilityException.findFirst({ where: { spotId, ...overlapping } });
    if (clashingException !== null) return userError("EXCEPTION_OVERLAP");

    if (kind === "BLOCKED") {
      const bookingsInWindow = await transaction.booking.findMany({
        where: { spotId, status: "CONFIRMED", ...overlapping },
        include: { renter: { select: { name: true } } },
        orderBy: { startsAt: "asc" },
      });
      if (bookingsInWindow.length > 0) {
        return userError(
          "BLOCK_HAS_BOOKINGS",
          bookingsInWindow.map(
            (booking) => `${formatDateTimeRange(booking.startsAt, booking.endsAt, locale)} · ${booking.renter.name}`,
          ),
        );
      }
    }

    await transaction.availabilityException.create({ data: { spotId, kind, startsAt, endsAt, note } });
    return ACTION_SUCCESS;
  });
  const created = result !== null && result.ok;
  if (created) refresh();
  return result;
}

export async function deleteAvailabilityException(
  localeValue: string,
  spotId: string,
  exceptionId: string,
): Promise<void> {
  const locale = assertLocale(localeValue);
  await requireOwnedSpot(locale, spotId);
  await prisma.availabilityException.delete({ where: { id: exceptionId, spotId } });
  refresh();
}
