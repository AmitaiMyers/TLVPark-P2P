"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { GeocodeResult } from "@/app/api/geocode/route";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { TEL_AVIV_CENTER, type LatLng } from "@/lib/geo";
import { styles } from "../ui";

const LeafletLocationPicker = dynamic(() => import("./LeafletLocationPicker"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-neutral-200 dark:bg-neutral-800" />,
});

type SearchState =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "results"; results: GeocodeResult[] }
  | { status: "failed" };

type LocationPickerProps = {
  locale: Locale;
  text: Dictionary["spotForm"];
  defaultAddress: string;
  defaultLocation: LatLng | null;
};

/**
 * Address search + draggable pin. Submits `addressLine`, `latitude` and
 * `longitude` with the surrounding form; the coordinates stay empty until
 * the host places the pin (the server then answers LOCATION_MISSING).
 */
export function LocationPicker({ locale, text, defaultAddress, defaultLocation }: LocationPickerProps) {
  const [address, setAddress] = useState(defaultAddress);
  const [location, setLocation] = useState<LatLng | null>(defaultLocation);
  const [search, setSearch] = useState<SearchState>({ status: "idle" });

  async function searchAddress() {
    setSearch({ status: "searching" });
    const params = new URLSearchParams({ q: address, lang: locale });
    // Agreed exception to the no-catch rule: fetch() rejects when the device
    // has no network. That is an expected user situation (not a bug), and
    // without handling it the button would stay on "Searching…" forever.
    const response = await fetch(`/api/geocode?${params.toString()}`).catch(() => null);
    if (response === null || !response.ok) {
      setSearch({ status: "failed" });
      return;
    }
    const results = (await response.json()) as GeocodeResult[];
    setSearch({ status: "results", results });
    if (results.length > 0) {
      setLocation({ latitude: results[0].latitude, longitude: results[0].longitude });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className={styles.label}>
        {text.address}
        <div className="flex gap-2">
          <input
            name="addressLine"
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder={text.addressPlaceholder}
            className={styles.input}
          />
          <button
            type="button"
            onClick={() => void searchAddress()}
            disabled={address.trim() === "" || search.status === "searching"}
            className={`${styles.buttonSecondary} shrink-0`}
          >
            {search.status === "searching" ? text.searching : text.findOnMap}
          </button>
        </div>
      </label>

      {search.status === "failed" && <p className={styles.error}>{text.geocodeFailed}</p>}
      {search.status === "results" && search.results.length === 0 && (
        <p className={styles.muted}>{text.noAddressMatches}</p>
      )}
      {search.status === "results" && search.results.length > 1 && (
        <ul className="flex flex-col gap-1 text-sm">
          {search.results.map((result) => (
            <li key={`${result.latitude},${result.longitude}`}>
              <button
                type="button"
                className="text-start underline"
                onClick={() => setLocation({ latitude: result.latitude, longitude: result.longitude })}
              >
                {result.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className={styles.muted}>{location === null ? text.pinMissing : text.pinHint}</p>
      <div className="h-72 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
        <LeafletLocationPicker
          location={location}
          center={location ?? TEL_AVIV_CENTER}
          pinLabel={text.pinHint}
          onPick={setLocation}
        />
      </div>

      <input type="hidden" name="latitude" value={location === null ? "" : location.latitude.toFixed(6)} />
      <input type="hidden" name="longitude" value={location === null ? "" : location.longitude.toFixed(6)} />
    </div>
  );
}
