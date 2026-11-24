import { PLACES } from "@/lib/constants";

/** Default map centre: Nagasaki Station. */
export const NAGASAKI_CENTER = { lat: 32.7503, lng: 129.8779 };

/**
 * Coordinates are rounded to 2 decimals (~1 km) before saving so a member's
 * exact home is never stored or shown — only their approximate area.
 */
export const roundCoord = (n: number) => Math.round(n * 100) / 100;

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearestPlace(lat: number, lng: number) {
  let best = PLACES[0];
  let bestKm = Infinity;
  for (const p of PLACES) {
    const km = distanceKm({ lat, lng }, p);
    if (km < bestKm) {
      best = p;
      bestKm = km;
    }
  }
  return { place: best, km: bestKm };
}

/**
 * Area name for a point, e.g. "Urakami, Nagasaki". Uses OpenStreetMap's
 * Nominatim (the same provider as our map tiles) with the rounded point, and
 * falls back to the nearest known neighbourhood if it can't be reached.
 */
export async function areaNameFor(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=en&lat=${roundCoord(lat)}&lon=${roundCoord(lng)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const data = await res.json();
      const a = data?.address ?? {};
      const area = a.suburb || a.neighbourhood || a.quarter || a.village || a.hamlet || a.city_district;
      const city = a.city || a.town || a.municipality || a.county;
      const name = [area, city].filter(Boolean).join(", ");
      if (name) return name;
    }
  } catch {
    // fall through to the nearest known area
  }
  const { place, km } = nearestPlace(lat, lng);
  return km < 3 ? place.name : `Near ${place.name}`;
}
