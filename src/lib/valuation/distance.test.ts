import { describe, it, expect } from "vitest";
import { haversineMetres } from "./distance";

describe("haversineMetres", () => {
  it("is zero for the same point", () => {
    expect(haversineMetres({ lat: 51.45, lng: -0.19 }, { lat: 51.45, lng: -0.19 })).toBe(0);
  });

  it("approximates a known short distance (~690m across 0.01° lng in London)", () => {
    const d = haversineMetres({ lat: 51.5074, lng: -0.1278 }, { lat: 51.5074, lng: -0.1378 });
    expect(d).toBeGreaterThan(600);
    expect(d).toBeLessThan(800);
  });

  it("increases monotonically with separation", () => {
    const near = haversineMetres({ lat: 51.45, lng: -0.19 }, { lat: 51.451, lng: -0.19 });
    const far = haversineMetres({ lat: 51.45, lng: -0.19 }, { lat: 51.49, lng: -0.19 });
    expect(far).toBeGreaterThan(near);
  });
});
