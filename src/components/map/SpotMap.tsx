"use client";

import dynamic from "next/dynamic";
import { TEL_AVIV_CENTER } from "@/lib/geo";

export type MapSpot = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  priceLabel: string;
  /** Popup link target, or null for a marker without a popup. */
  href: string | null;
};

// Leaflet touches `window` on import, so it must never render on the server.
const LeafletSpotMap = dynamic(() => import("./LeafletSpotMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-neutral-200 dark:bg-neutral-800" />,
});

type SpotMapProps = {
  spots: MapSpot[];
  viewLabel: string;
  /** Defaults to Tel Aviv's center. */
  center?: [number, number];
  zoom?: number;
  heightClassName?: string;
};

export function SpotMap({ spots, viewLabel, center, zoom, heightClassName }: SpotMapProps) {
  return (
    <div className={`${heightClassName ?? "h-80"} overflow-hidden rounded-2xl border border-black/10 dark:border-white/10`}>
      <LeafletSpotMap
        spots={spots}
        viewLabel={viewLabel}
        center={center ?? [TEL_AVIV_CENTER.latitude, TEL_AVIV_CENTER.longitude]}
        zoom={zoom ?? 13}
      />
    </div>
  );
}
