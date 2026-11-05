import "server-only";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Row-locks a spot for the rest of the transaction.
 *
 * Booking creation and adding a BLOCKED window both take this lock, so they
 * run one after the other per spot. Without it, a renter could book a slot
 * at the same instant the host blocks it, and both checks would pass.
 * (Booking-vs-booking overlap is already prevented by the EXCLUDE constraint.)
 */
export async function lockSpot(transaction: Prisma.TransactionClient, spotId: string): Promise<void> {
  const locked = await transaction.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "ParkingSpot" WHERE "id" = ${spotId} FOR UPDATE`;
  if (locked.length !== 1) throw new Error(`Spot ${spotId} not found`);
}
