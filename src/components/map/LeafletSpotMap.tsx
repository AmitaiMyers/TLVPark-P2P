"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { OSM_ATTRIBUTION, OSM_TILES, TEL_AVIV_MAX_BOUNDS } from "./tiles";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { MapSpot } from "./SpotMap";

/** Escapes text placed into the marker's HTML label. */
function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
}

function priceTagIcon(label: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span class="tlvpark-price-tag">${escapeHtml(label)}</span>`,
    // Zero-size anchor at the spot; CSS centers the label above it, so labels
    // of any width point at the right place.
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export default function LeafletSpotMap({
  spots,
  center,
  zoom,
  viewLabel,
}: {
  spots: MapSpot[];
  center: [number, number];
  zoom: number;
  viewLabel: string;
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={12}
      maxBounds={TEL_AVIV_MAX_BOUNDS}
      maxBoundsViscosity={0.8}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
      {spots.map((spot) => (
        <Marker key={spot.id} position={[spot.latitude, spot.longitude]} icon={priceTagIcon(spot.priceLabel)}>
          {spot.href !== null && (
            <Popup>
              <div className="flex flex-col gap-1">
                <strong>{spot.title}</strong>
                <Link href={spot.href}>{viewLabel}</Link>
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}
