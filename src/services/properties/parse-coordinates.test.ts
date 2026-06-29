import { describe, it, expect } from "vitest";
import { parseCoordinates } from "./property-detail-service";

describe("parseCoordinates", () => {
  it("decodes the EWKB hex string PostgREST returns for a geography column", () => {
    // Exactly what `select=coordinates` returns over PostgREST for the
    // Shoreditch listing (geography(Point,4326)): SRID 4326, lng -0.0776,
    // lat 51.5232. This is the real-data path that was returning null.
    const ewkb = "0101000020E6100000E86A2BF697DDB3BF34A2B437F8C24940";
    const result = parseCoordinates(ewkb);
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(51.5232, 3);
    expect(result!.lng).toBeCloseTo(-0.0776, 3);
  });

  it("still parses a GeoJSON Point object", () => {
    const result = parseCoordinates({ type: "Point", coordinates: [-0.0776, 51.5232] });
    expect(result).toEqual({ lat: 51.5232, lng: -0.0776 });
  });

  it("returns null for null / empty / non-coordinate input", () => {
    expect(parseCoordinates(null)).toBeNull();
    expect(parseCoordinates(undefined)).toBeNull();
    expect(parseCoordinates("")).toBeNull();
    expect(parseCoordinates("not-hex-at-all")).toBeNull();
    expect(parseCoordinates({ type: "Polygon" })).toBeNull();
  });

  it("returns null for a non-Point EWKB geometry rather than guessing", () => {
    // LineString EWKB (type 2) — should not be read as a point.
    const lineString =
      "0102000020E610000002000000000000000000000000000000000000000000000000004940000000000000F03F";
    expect(parseCoordinates(lineString)).toBeNull();
  });
});
