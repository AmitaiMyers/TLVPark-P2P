import { SLOT_MS } from "./time";

export const AGOROT_PER_SHEKEL = 100;

const SLOTS_PER_DAY = 48;

export type SpotPricing = {
  /** Whole shekels in agorot (multiple of 100), enforced by the database. */
  hourlyRateAgorot: number;
  dailyCapAgorot: number;
};

/**
 * Total price of a booking, in agorot.
 *
 * Each full 24-hour block costs the daily cap. The remainder is charged per
 * 30-minute slot at half the hourly rate, but never more than the daily cap.
 *
 * Example (₪15/hour, ₪80 cap): 3h = ₪45; 10h = ₪80; 26h = ₪80 + ₪30 = ₪110.
 */
export function computeBookingPriceAgorot(startsAt: Date, endsAt: Date, pricing: SpotPricing): number {
  const durationMs = endsAt.getTime() - startsAt.getTime();
  if (durationMs <= 0 || durationMs % SLOT_MS !== 0) {
    throw new Error(`Booking duration must be a positive multiple of 30 minutes, got ${durationMs}ms`);
  }
  if (pricing.hourlyRateAgorot % 2 !== 0) {
    throw new Error(`Hourly rate must split into whole-agorot half hours, got ${pricing.hourlyRateAgorot}`);
  }

  const slotCount = durationMs / SLOT_MS;
  const fullDays = Math.floor(slotCount / SLOTS_PER_DAY);
  const remainingSlots = slotCount % SLOTS_PER_DAY;
  const remainderPrice = remainingSlots * (pricing.hourlyRateAgorot / 2);

  return fullDays * pricing.dailyCapAgorot + Math.min(remainderPrice, pricing.dailyCapAgorot);
}
