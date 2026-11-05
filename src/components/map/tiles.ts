import type { LatLngBoundsExpression } from "leaflet";
import { TEL_AVIV_BOUNDS } from "@/lib/geo";

/** Free OpenStreetMap tiles; the attribution is required by their policy. */
export const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Keeps panning inside Tel Aviv-Yafo. */
export const TEL_AVIV_MAX_BOUNDS: LatLngBoundsExpression = [
  [TEL_AVIV_BOUNDS.south, TEL_AVIV_BOUNDS.west],
  [TEL_AVIV_BOUNDS.north, TEL_AVIV_BOUNDS.east],
];
