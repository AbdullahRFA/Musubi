"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default leaflet marker icon in Next.js bundlers
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PostMapProps {
  lat: number;
  lng: number;
  locationName: string;
  title?: string;
}

export default function PostMap({ lat, lng, locationName, title }: PostMapProps) {
  return (
    <div className="h-56 sm:h-72 w-full rounded-xl overflow-hidden border-2 border-border shadow-xs">
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        scrollWheelZoom={false}
        // Avoid trapping page scroll on touch devices; pinch-zoom still works
        dragging={!L.Browser.mobile}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="p-1 text-center font-sans">
              <strong className="block text-sm text-primary">{locationName}</strong>
              {title && <span className="text-xs text-muted-foreground">{title}</span>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
