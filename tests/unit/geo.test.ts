import { describe, expect, it, vi } from "vitest";
import { areaNameFor, nearestPlace, roundCoord } from "@/lib/geo";

describe("geo helpers", () => {
  it("rounds coordinates to ~1 km for privacy", () => {
    expect(roundCoord(32.773612)).toBe(32.77);
    expect(roundCoord(129.865911)).toBe(129.87);
  });

  it("finds the nearest known neighbourhood", () => {
    const { place, km } = nearestPlace(32.7725, 129.8665);
    expect(place.name).toBe("Urakami, Nagasaki");
    expect(km).toBeLessThan(0.1);
  });

  it("names an area from the reverse-geocoder", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ address: { suburb: "Hiranomachi", city: "Nagasaki" } }) })));
    await expect(areaNameFor(32.77, 129.87)).resolves.toBe("Hiranomachi, Nagasaki");
  });

  it("falls back to the nearest known area when offline", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    await expect(areaNameFor(32.7725, 129.8665)).resolves.toBe("Urakami, Nagasaki");
  });

  it("says 'Near …' when far from any known area", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    await expect(areaNameFor(35.68, 139.76)).resolves.toMatch(/^Near /);
  });

  it("only sends the rounded point to the geocoder", async () => {
    const f = vi.fn(async (_url: string) => ({ ok: false }));
    vi.stubGlobal("fetch", f);
    await areaNameFor(32.773612, 129.865911);
    expect(String(f.mock.calls[0][0])).toContain("lat=32.77&lon=129.87");
  });
});
