import { describe, expect, it } from "vitest";
import { parseInspireGml, posListToRing } from "./parse-inspire-gml";

// A structurally faithful 2-feature INSPIRE FeatureCollection (geoserver WFS 2.0
// shape, EPSG:27700). Feature 1: a City-of-London triangle. Feature 2: a square
// with a triangular hole (interior ring).
const SAMPLE_GML = `<?xml version="1.0" encoding="UTF-8"?><wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:LR="www.landregistry.gov.uk" xmlns:gml="http://www.opengis.net/gml/3.2" numberMatched="2" numberReturned="2"><wfs:member><LR:PREDEFINED gml:id="PREDEFINED.fid-aaa"><LR:GEOMETRY><gml:Polygon srsName="urn:ogc:def:crs:EPSG::27700" srsDimension="2" gml:id="PREDEFINED.fid-aaa.GEOMETRY"><gml:exterior><gml:LinearRing><gml:posList>533750 180790 533760 180790 533760 180800 533750 180790</gml:posList></gml:LinearRing></gml:exterior></gml:Polygon></LR:GEOMETRY></LR:PREDEFINED></wfs:member><wfs:member><LR:PREDEFINED gml:id="PREDEFINED.fid-bbb"><LR:GEOMETRY><gml:Polygon srsName="urn:ogc:def:crs:EPSG::27700" srsDimension="2" gml:id="PREDEFINED.fid-bbb.GEOMETRY"><gml:exterior><gml:LinearRing><gml:posList>534000 181000 534100 181000 534100 181100 534000 181100 534000 181000</gml:posList></gml:LinearRing></gml:exterior><gml:interior><gml:LinearRing><gml:posList>534030 181030 534060 181030 534060 181060 534030 181030</gml:posList></gml:LinearRing></gml:interior></gml:Polygon></LR:GEOMETRY></LR:PREDEFINED></wfs:member></wfs:FeatureCollection>`;

describe("posListToRing", () => {
  it("reprojects EPSG:27700 easting/northing pairs into [lng,lat] inside London", () => {
    const ring = posListToRing("533750 180790 533760 180800");
    expect(ring).toHaveLength(2);
    const [lng, lat] = ring[0];
    // City of London — roughly 0°W, 51.5°N.
    expect(lng).toBeGreaterThan(-0.2);
    expect(lng).toBeLessThan(0.05);
    expect(lat).toBeGreaterThan(51.4);
    expect(lat).toBeLessThan(51.6);
  });

  it("skips malformed (odd-length / non-numeric) coordinates", () => {
    expect(posListToRing("533750 180790 nan")).toHaveLength(1);
    expect(posListToRing("")).toHaveLength(0);
  });
});

describe("parseInspireGml", () => {
  const parcels = parseInspireGml(SAMPLE_GML);

  it("extracts one parcel per wfs:member with its LR:PREDEFINED gml:id", () => {
    expect(parcels).toHaveLength(2);
    expect(parcels.map((p) => p.inspireId)).toEqual([
      "PREDEFINED.fid-aaa",
      "PREDEFINED.fid-bbb",
    ]);
  });

  it("produces a closed exterior ring in WGS84", () => {
    const exterior = parcels[0].polygons[0][0];
    expect(exterior.length).toBeGreaterThanOrEqual(4);
    expect(exterior[0]).toEqual(exterior[exterior.length - 1]); // closed
    for (const [lng, lat] of exterior) {
      expect(lng).toBeGreaterThan(-0.2);
      expect(lng).toBeLessThan(0.05);
      expect(lat).toBeGreaterThan(51.4);
      expect(lat).toBeLessThan(51.6);
    }
  });

  it("parses interior rings (holes)", () => {
    const polygon = parcels[1].polygons[0];
    expect(polygon).toHaveLength(2); // exterior + 1 hole
    expect(polygon[1].length).toBeGreaterThanOrEqual(4);
  });

  it("returns valid GeoJSON-MultiPolygon-shaped coordinates", () => {
    // [polygons][rings][points][lng,lat]
    for (const parcel of parcels) {
      expect(Array.isArray(parcel.polygons)).toBe(true);
      for (const polygon of parcel.polygons) {
        for (const ring of polygon) {
          for (const point of ring) {
            expect(point).toHaveLength(2);
            expect(typeof point[0]).toBe("number");
            expect(typeof point[1]).toBe("number");
          }
        }
      }
    }
  });

  it("returns an empty array for a document with no members", () => {
    expect(parseInspireGml("<wfs:FeatureCollection></wfs:FeatureCollection>")).toEqual([]);
  });
});
