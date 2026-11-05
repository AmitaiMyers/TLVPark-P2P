/**
 * Vehicle size categories. A spot's category is DERIVED from its dimensions
 * (never stored), so the two can never disagree.
 */

export const VEHICLE_SIZES = ["MOTORCYCLE", "SMALL", "REGULAR", "SUV_VAN"] as const;

export type VehicleSize = (typeof VEHICLE_SIZES)[number];

type SpaceRequirement = { minLengthCm: number; minWidthCm: number; minHeightCm: number };

/** Minimum parking space each category needs, smallest first. */
export const VEHICLE_SPACE_REQUIREMENTS: Record<VehicleSize, SpaceRequirement> = {
  MOTORCYCLE: { minLengthCm: 220, minWidthCm: 100, minHeightCm: 150 },
  SMALL: { minLengthCm: 400, minWidthCm: 190, minHeightCm: 160 },
  REGULAR: { minLengthCm: 480, minWidthCm: 220, minHeightCm: 170 },
  SUV_VAN: { minLengthCm: 530, minWidthCm: 240, minHeightCm: 210 },
};

export type SpotDimensions = {
  lengthCm: number;
  widthCm: number;
  /** null = no height limit. */
  heightClearanceCm: number | null;
};

export function spotFitsVehicle(spot: SpotDimensions, size: VehicleSize): boolean {
  const requirement = VEHICLE_SPACE_REQUIREMENTS[size];
  return (
    spot.lengthCm >= requirement.minLengthCm &&
    spot.widthCm >= requirement.minWidthCm &&
    (spot.heightClearanceCm === null || spot.heightClearanceCm >= requirement.minHeightCm)
  );
}

/** The largest category that fits. Throws if not even a motorcycle fits. */
export function deriveSpotSize(spot: SpotDimensions): VehicleSize {
  const fitting = VEHICLE_SIZES.filter((size) => spotFitsVehicle(spot, size));
  if (fitting.length === 0) {
    throw new Error(`Spot ${JSON.stringify(spot)} is too small for any vehicle`);
  }
  return fitting[fitting.length - 1];
}

export function isVehicleSize(value: string): value is VehicleSize {
  return (VEHICLE_SIZES as readonly string[]).includes(value);
}
