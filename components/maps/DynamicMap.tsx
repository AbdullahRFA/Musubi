"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const MapComponent = dynamic(() => import("@/components/maps/PostMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 sm:h-72 w-full items-center justify-center rounded-lg border-2 border-border bg-muted/40">
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="h-5 w-5 animate-bounce text-primary" />
        <span className="text-sm font-medium">Loading OpenStreetMap area...</span>
      </div>
    </div>
  ),
});

interface DynamicMapProps {
  lat: number | null;
  lng: number | null;
  locationName: string;
  title?: string;
}

export function DynamicMap({ lat, lng, locationName, title }: DynamicMapProps) {
  if (lat === null || lng === null) {
    return (
      <div className="flex h-40 w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-4 text-center">
        <span className="text-sm text-muted-foreground font-medium">
          Location: {locationName} (approximate local area)
        </span>
      </div>
    );
  }

  return <MapComponent lat={lat} lng={lng} locationName={locationName} title={title} />;
}
