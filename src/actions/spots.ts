"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { SpotType } from "@/generated/prisma/client";
import { assertLocale } from "@/i18n/config";
import { ACTION_SUCCESS, userError, type ActionResult } from "@/lib/actionResult";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  readCheckbox,
  readEnum,
  readFloat,
  readInteger,
  readOptionalInteger,
  readOptionalString,
  readRequiredString,
} from "@/lib/form";
import { SPOT_TYPES } from "@/lib/enums";
import { isInsideTelAviv } from "@/lib/geo";
import { spotFitsVehicle } from "@/lib/vehicle";
import { AGOROT_PER_SHEKEL } from "@/lib/pricing";
import { requireOwnedSpot } from "@/server/spots";

type SpotFormData = {
  title: string;
  description: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  spotType: SpotType;
  lengthCm: number;
  widthCm: number;
  heightClearanceCm: number | null;
  isCovered: boolean;
  isGated: boolean;
  hasEvCharger: boolean;
  hourlyRateAgorot: number;
  dailyCapAgorot: number;
  gatePhoneNumber: string | null;
  accessInstructions: string;
};

/** Shared by create and update, so both enforce identical rules. */
function parseSpotForm(formData: FormData): { ok: true; data: SpotFormData } | { ok: false; result: ActionResult } {
  // The location picker leaves these empty until the host places the pin.
  if (readOptionalString(formData, "latitude") === null || readOptionalString(formData, "longitude") === null) {
    return { ok: false, result: userError("LOCATION_MISSING") };
  }
  const location = {
    latitude: readFloat(formData, "latitude", { min: -90, max: 90 }),
    longitude: readFloat(formData, "longitude", { min: -180, max: 180 }),
  };
  if (!isInsideTelAviv(location)) return { ok: false, result: userError("LOCATION_OUTSIDE_TEL_AVIV") };

  const dimensions = {
    lengthCm: readInteger(formData, "lengthCm", { min: 1, max: 5000 }),
    widthCm: readInteger(formData, "widthCm", { min: 1, max: 5000 }),
    heightClearanceCm: readOptionalInteger(formData, "heightClearanceCm", { min: 1, max: 1000 }),
  };
  if (!spotFitsVehicle(dimensions, "MOTORCYCLE")) return { ok: false, result: userError("SPOT_TOO_SMALL") };

  const hourlyRateAgorot = readInteger(formData, "hourlyRateShekels", { min: 1, max: 1000 }) * AGOROT_PER_SHEKEL;
  const dailyCapAgorot = readInteger(formData, "dailyCapShekels", { min: 1, max: 10000 }) * AGOROT_PER_SHEKEL;
  if (dailyCapAgorot < hourlyRateAgorot) return { ok: false, result: userError("DAILY_CAP_BELOW_HOURLY") };

  return {
    ok: true,
    data: {
      title: readRequiredString(formData, "title"),
      description: readRequiredString(formData, "description"),
      addressLine: readRequiredString(formData, "addressLine"),
      ...location,
      spotType: readEnum(formData, "spotType", SPOT_TYPES),
      ...dimensions,
      isCovered: readCheckbox(formData, "isCovered"),
      isGated: readCheckbox(formData, "isGated"),
      hasEvCharger: readCheckbox(formData, "hasEvCharger"),
      hourlyRateAgorot,
      dailyCapAgorot,
      gatePhoneNumber: readOptionalString(formData, "gatePhoneNumber"),
      accessInstructions: readRequiredString(formData, "accessInstructions"),
    },
  };
}

export async function createSpot(localeValue: string, _previous: ActionResult, formData: FormData): Promise<ActionResult> {
  const locale = assertLocale(localeValue);
  const host = await requireCurrentUser(locale, `/${locale}/host/spots/new`);
  const parsed = parseSpotForm(formData);
  if (!parsed.ok) return parsed.result;

  const spot = await prisma.parkingSpot.create({ data: { ...parsed.data, hostId: host.id } });
  redirect(`/${locale}/host/spots/${spot.id}`);
}

export async function updateSpot(
  localeValue: string,
  spotId: string,
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const locale = assertLocale(localeValue);
  await requireOwnedSpot(locale, spotId);
  const parsed = parseSpotForm(formData);
  if (!parsed.ok) return parsed.result;

  await prisma.parkingSpot.update({ where: { id: spotId }, data: parsed.data });
  refresh();
  return ACTION_SUCCESS;
}

/** Unlisting hides the spot from search; existing bookings stay valid. */
export async function setSpotListed(localeValue: string, spotId: string, isActive: boolean): Promise<void> {
  const locale = assertLocale(localeValue);
  await requireOwnedSpot(locale, spotId);
  await prisma.parkingSpot.update({ where: { id: spotId }, data: { isActive } });
  refresh();
}
