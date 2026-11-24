"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Crosshair, Loader2, LocateFixed, Map as MapIcon, MapPin, ShieldCheck, X } from "lucide-react";
import { areaNameFor, roundCoord } from "@/lib/geo";
import { Button } from "@/components/ui/button";

const LocationPickerMap = dynamic(() => import("@/components/maps/LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="h-64 sm:h-72 w-full animate-pulse rounded-xl border-2 border-border bg-muted/40" />,
});

export interface MyLocation {
  name: string;
  lat: number | null;
  lng: number | null;
}

/**
 * "Your location": use the device's GPS or click on a map to set where you
 * are. Only an approximate point (~1 km) is saved, plus an area name the
 * member can edit before saving.
 */
export function MyLocationPicker({ value, onChange }: { value: MyLocation; onChange: (next: MyLocation) => void }) {
  const [busy, setBusy] = useState<"gps" | "name" | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasPoint = value.lat !== null && value.lng !== null;

  const setPoint = async (lat: number, lng: number, source: "gps" | "map") => {
    const rLat = roundCoord(lat);
    const rLng = roundCoord(lng);
    onChange({ ...value, lat: rLat, lng: rLng });
    setBusy("name");
    const name = await areaNameFor(rLat, rLng);
    onChange({ name, lat: rLat, lng: rLng });
    setBusy(null);
    if (source === "gps") setMapOpen(true);
  };

  const useGps = () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Your browser can't share your location. Please pick it on the map instead.");
      setMapOpen(true);
      return;
    }
    setBusy("gps");
    navigator.geolocation.getCurrentPosition(
      (pos) => setPoint(pos.coords.latitude, pos.coords.longitude, "gps"),
      (err) => {
        setBusy(null);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. You can allow it in your browser settings, or pick your area on the map."
            : "We couldn't find your location. Please pick it on the map instead.",
        );
        setMapOpen(true);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  };

  return (
    <div className="space-y-3 rounded-2xl border-2 border-primary/20 bg-primary/[0.03] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-extrabold text-foreground">
            <LocateFixed className="h-4 w-4 text-primary" />
            Your location
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Set where you are so neighbours nearby can find you.</p>
        </div>
        {hasPoint && (
          <button
            type="button"
            onClick={() => onChange({ name: value.name, lat: null, lng: null })}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> Clear pin
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button type="button" onClick={useGps} disabled={busy !== null} className="gap-2 font-bold">
          {busy === "gps" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
          Use my current location
        </Button>
        <Button type="button" variant="outline" onClick={() => setMapOpen((v) => !v)} className="gap-2 font-bold" aria-expanded={mapOpen}>
          <MapIcon className="h-4 w-4" />
          {mapOpen ? "Hide map" : "Pick on map"}
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          {error}
        </p>
      )}

      {mapOpen && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
          <LocationPickerMap lat={value.lat} lng={value.lng} onPick={(lat, lng) => setPoint(lat, lng, "map")} />
          <p className="text-xs text-muted-foreground">Tap the map or drag the pin to your area.</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="my-location-name" className="text-xs font-bold text-muted-foreground">
          Area name shown to neighbours
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <input
            id="my-location-name"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value.slice(0, 80) })}
            placeholder="e.g. Urakami, Nagasaki"
            className="h-11 w-full rounded-lg border-2 border-input bg-background pl-9 pr-9 text-sm font-medium text-foreground transition-colors focus-visible:border-primary/60 focus-visible:outline-none"
          />
          {busy === "name" && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        </div>
      </div>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
        For your safety we only save an approximate area (about 1 km), never your exact address.
      </p>
    </div>
  );
}
