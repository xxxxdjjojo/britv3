import { describe, it, expect } from "vitest";
import { osgb36ToWgs84 } from "./osgb";

describe("osgb36ToWgs84", () => {
  it("converts the OS worked-example grid point to ~the right WGS84 coordinate", () => {
    // OS guide example: E 651409.903, N 313177.270 -> OSGB36 52.6575703N, 1.7179215E.
    // WGS84 sits within ~120m of that after the datum shift.
    const { lat, lng } = osgb36ToWgs84(651409.903, 313177.27);
    expect(lat).toBeGreaterThan(52.655);
    expect(lat).toBeLessThan(52.659);
    expect(lng).toBeGreaterThan(1.715);
    expect(lng).toBeLessThan(1.722);
  });

  it("converts a central London grid reference to ~WGS84 London", () => {
    // Approx Trafalgar Square area.
    const { lat, lng } = osgb36ToWgs84(530034, 180381);
    expect(lat).toBeGreaterThan(51.5);
    expect(lat).toBeLessThan(51.52);
    expect(lng).toBeGreaterThan(-0.14);
    expect(lng).toBeLessThan(-0.11);
  });

  it("preserves ordering (a point further north maps to a higher latitude)", () => {
    const south = osgb36ToWgs84(530000, 180000);
    const north = osgb36ToWgs84(530000, 200000);
    expect(north.lat).toBeGreaterThan(south.lat);
  });
});
