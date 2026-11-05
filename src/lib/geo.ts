/**
 * Tel Aviv-Yafo geography. The bounding box must match the
 * "ParkingSpot_inside_tel_aviv_check" constraint in the migrations.
 */

export type LatLng = { latitude: number; longitude: number };

export const TEL_AVIV_CENTER: LatLng = { latitude: 32.0853, longitude: 34.7818 };

export const TEL_AVIV_BOUNDS = {
  south: 32.02,
  north: 32.15,
  west: 34.74,
  east: 34.86,
} as const;

export function isInsideTelAviv({ latitude, longitude }: LatLng): boolean {
  return (
    latitude >= TEL_AVIV_BOUNDS.south &&
    latitude <= TEL_AVIV_BOUNDS.north &&
    longitude >= TEL_AVIV_BOUNDS.west &&
    longitude <= TEL_AVIV_BOUNDS.east
  );
}

/** Waze deep link: the navigation app most Tel Aviv drivers use. */
export function wazeNavigationUrl({ latitude, longitude }: LatLng): string {
  return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
}
