"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { NAGASAKI_CENTER } from "@/lib/geo";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function ClickToPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });
  }, [lat, lng, map]);
  return null;
}

/** Click (or drag the pin) to choose an approximate location. */
export default function LocationPickerMap({
  lat,
  lng,
  onPick,
}: {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const has = lat !== null && lng !== null;
  const center: [number, number] = has ? [lat!, lng!] : [NAGASAKI_CENTER.lat, NAGASAKI_CENTER.lng];
  return (
    <div className="h-64 sm:h-72 w-full overflow-hidden rounded-xl border-2 border-border shadow-xs">
      <MapContainer center={center} zoom={has ? 14 : 13} scrollWheelZoom={false} className="h-full w-full cursor-crosshair">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPick onPick={onPick} />
        {has && (
          <>
            <Recenter lat={lat!} lng={lng!} />
            {/* ~1 km circle: we only ever store the approximate area */}
            <Circle center={[lat!, lng!]} radius={600} pathOptions={{ color: "#c2410c", fillColor: "#c2410c", fillOpacity: 0.12, weight: 1.5 }} />
            <Marker
              position={[lat!, lng!]}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const p = (e.target as L.Marker).getLatLng();
                  onPick(p.lat, p.lng);
                },
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
