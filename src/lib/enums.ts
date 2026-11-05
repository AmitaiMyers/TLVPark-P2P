import { AvailabilityExceptionKind, SpotType } from "../generated/prisma/enums";

/** Enum value lists derived from the Prisma schema (single source of truth). */
export const SPOT_TYPES: readonly SpotType[] = Object.values(SpotType);
export const EXCEPTION_KINDS: readonly AvailabilityExceptionKind[] = Object.values(AvailabilityExceptionKind);
