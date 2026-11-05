"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { OSM_ATTRIBUTION, OSM_TILES, TEL_AVIV_MAX_BOUNDS } from "./tiles";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "@/lib/geo";

const PIN_ICON = L.divIcon({
  className: "",
  html: '<span class="tlvpark-pin"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function ClickToPlace({ onPick }: { onPick: (location: LatLng) => void }) {
  useMapEvents({
    click: (event) => onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
  });
  return null;
}

/** Pans to the pin whenever it moves (e.g. after an address search). */
function FollowPin({ location }: { location: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (location !== null) map.setView([location.latitude, location.longitude], Math.max(map.getZoom(), 16));
  }, [location, map]);
  return null;
}

export default function LeafletLocationPicker({
  location,
  center,
  pinLabel,
  onPick,
}: {
  location: LatLng | null;
  center: LatLng;
  /** Accessible name of the draggable pin (it is a focusable control). */
  pinLabel: string;
  onPick: (location: LatLng) => void;
}) {
  return (
    <MapContainer center={[center.latitude, center.longitude]} zoom={14} minZoom={12} maxBounds={TEL_AVIV_MAX_BOUNDS} className="h-full w-full">
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
      <ClickToPlace onPick={onPick} />
      <FollowPin location={location} />
      {location !== null && (
        <Marker
          position={[location.latitude, location.longitude]}
          icon={PIN_ICON}
          title={pinLabel}
          alt={pinLabel}
          draggable
          eventHandlers={{
            dragend: (event) => {
              const position = (event.target as L.Marker).getLatLng();
              onPick({ latitude: position.lat, longitude: position.lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
