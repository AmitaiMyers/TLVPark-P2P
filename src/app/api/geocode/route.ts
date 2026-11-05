import type { NextRequest } from "next/server";
import { isLocale } from "@/i18n/config";
import { isInsideTelAviv, TEL_AVIV_BOUNDS } from "@/lib/geo";

/**
 * Address search restricted to Tel Aviv-Yafo, via OpenStreetMap Nominatim.
 * Proxied through the server so every request carries an identifying
 * User-Agent, as the Nominatim usage policy requires.
 *
 * GET /api/geocode?q=Dizengoff%2050&lang=he -> [{ label, latitude, longitude }]
 */

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "TLVPark/0.1 (+https://github.com/AmitaiMyers/TLVPark-P2P)";
const MAX_RESULTS = 5;

export type GeocodeResult = { label: string; latitude: number; longitude: number };

type NominatimPlace = { display_name: string; lat: string; lon: string };

export async function GET(request: NextRequest) {
  // URLSearchParams only exposes `.get()`; both values are checked explicitly.
  const query = request.nextUrl.searchParams.get("q");
  const lang = request.nextUrl.searchParams.get("lang");
  if (query === null || query.trim() === "") return Response.json({ error: "Missing q" }, { status: 400 });
  if (lang === null || !isLocale(lang)) return Response.json({ error: "Invalid lang" }, { status: 400 });

  const url = new URL(NOMINATIM_SEARCH);
  url.search = new URLSearchParams({
    q: query,
    format: "jsonv2",
    countrycodes: "il",
    viewbox: `${TEL_AVIV_BOUNDS.west},${TEL_AVIV_BOUNDS.north},${TEL_AVIV_BOUNDS.east},${TEL_AVIV_BOUNDS.south}`,
    bounded: "1",
    limit: String(MAX_RESULTS),
    "accept-language": lang,
  }).toString();

  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    return Response.json({ error: `Geocoder responded ${response.status}` }, { status: 502 });
  }

  const places = (await response.json()) as NominatimPlace[];
  const results: GeocodeResult[] = places
    .map((place) => ({ label: place.display_name, latitude: Number(place.lat), longitude: Number(place.lon) }))
    .filter(isInsideTelAviv);
  return Response.json(results);
}
