import "server-only";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { isWindowAvailable } from "@/lib/availability";
import type { BookingWindow } from "@/lib/bookingWindow";
import { computeBookingPriceAgorot } from "@/lib/pricing";
import { deriveSpotSize, spotFitsVehicle, type VehicleSize } from "@/lib/vehicle";

export type SpotFeatureFilters = { isCovered: boolean; isGated: boolean; hasEvCharger: boolean };

export type SearchFilters = {
  window: BookingWindow;
  vehicleSize: VehicleSize | null;
  features: SpotFeatureFilters;
};

export type SpotSearchResult = {
  id: string;
  title: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  hourlyRateAgorot: number;
  dailyCapAgorot: number;
  sizeCategory: VehicleSize;
  isCovered: boolean;
  isGated: boolean;
  hasEvCharger: boolean;
  ratings: number[];
  /** Price for the searched window. */
  totalPriceAgorot: number;
};

export type RatingsLookup = (spotId: string) => number[];

/**
 * Ratings for many spots in one query. The returned lookup throws for a spot
 * that was not requested, instead of silently answering "no ratings".
 */
export async function ratingsBySpot(spotIds: string[]): Promise<RatingsLookup> {
  const reviews = await prisma.review.findMany({
    where: { booking: { spotId: { in: spotIds } } },
    select: { rating: true, booking: { select: { spotId: true } } },
  });
  const grouped = new Map<string, number[]>(spotIds.map((id) => [id, []]));
  for (const review of reviews) {
    const ratings = grouped.get(review.booking.spotId);
    if (ratings === undefined) throw new Error(`Review for unexpected spot ${review.booking.spotId}`);
    ratings.push(review.rating);
  }
  return (spotId) => {
    const ratings = grouped.get(spotId);
    if (ratings === undefined) throw new Error(`Ratings were not loaded for spot ${spotId}`);
    return ratings;
  };
}

/** Spot ids that already have a confirmed booking overlapping the window. */
async function bookedSpotIds(window: BookingWindow): Promise<Set<string>> {
  const overlapping = await prisma.booking.findMany({
    where: { status: "CONFIRMED", startsAt: { lt: window.endsAt }, endsAt: { gt: window.startsAt } },
    select: { spotId: true },
  });
  return new Set(overlapping.map((booking) => booking.spotId));
}

/**
 * Listed spots matching the filters that are open for the whole window and
 * not already booked.
 * Size and availability are filtered in code so their rules exist only once
 * (in lib/vehicle and lib/availability).
 */
export async function searchSpots(filters: SearchFilters): Promise<SpotSearchResult[]> {
  const featureWhere = {
    ...(filters.features.isCovered ? { isCovered: true } : {}),
    ...(filters.features.isGated ? { isGated: true } : {}),
    ...(filters.features.hasEvCharger ? { hasEvCharger: true } : {}),
  };
  const spots = await prisma.parkingSpot.findMany({
    where: { isActive: true, ...featureWhere },
    include: { availabilityRules: true, availabilityExceptions: true },
    orderBy: { hourlyRateAgorot: "asc" },
  });

  const { window, vehicleSize } = filters;
  const booked = await bookedSpotIds(window);

  const matching = spots.filter((spot) => {
    if (vehicleSize !== null && !spotFitsVehicle(spot, vehicleSize)) return false;
    if (booked.has(spot.id)) return false;
    return isWindowAvailable(spot.availabilityRules, spot.availabilityExceptions, window.startsAt, window.endsAt);
  });

  const ratingsFor = await ratingsBySpot(matching.map((spot) => spot.id));
  return matching.map((spot) => ({
    id: spot.id,
    title: spot.title,
    addressLine: spot.addressLine,
    latitude: spot.latitude,
    longitude: spot.longitude,
    hourlyRateAgorot: spot.hourlyRateAgorot,
    dailyCapAgorot: spot.dailyCapAgorot,
    sizeCategory: deriveSpotSize(spot),
    isCovered: spot.isCovered,
    isGated: spot.isGated,
    hasEvCharger: spot.hasEvCharger,
    ratings: ratingsFor(spot.id),
    totalPriceAgorot: computeBookingPriceAgorot(window.startsAt, window.endsAt, spot),
  }));
}

/**
 * Loads a spot for its host. Signed-out users go to the login page; a
 * signed-in user who is not the host is a bug or a tampered request: throw.
 */
export async function requireOwnedSpot(locale: Locale, spotId: string) {
  const user = await getCurrentUser();
  if (user === null) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/host/spots/${spotId}`)}`);

  const spot = await prisma.parkingSpot.findUniqueOrThrow({ where: { id: spotId } });
  if (spot.hostId !== user.id) throw new Error(`User ${user.id} does not own spot ${spotId}`);
  return { user, spot };
}
