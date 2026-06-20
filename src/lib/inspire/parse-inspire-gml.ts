/**
 * HM Land Registry INSPIRE Index Polygons — GML parser.
 *
 * The download is a geoserver WFS 2.0 FeatureCollection: each `<wfs:member>`
 * holds one `<LR:PREDEFINED gml:id="…">` freehold title parcel, whose geometry
 * is one or more `<gml:Polygon srsName="…EPSG::27700">` with a `<gml:exterior>`
 * LinearRing and zero or more `<gml:interior>` holes. Coordinates in `posList`
 * are space-separated EASTING NORTHING pairs in EPSG:27700 (British National
 * Grid), srsDimension 2.
 *
 * This parser reprojects every vertex to WGS84 (EPSG:4326) and returns GeoJSON
 * MultiPolygon coordinates, ready to feed `ST_GeomFromGeoJSON`. The schema is
 * machine-generated and stable, so we scan with index-based slicing (no large
 * backtracking regexes) to stay fast on the ~25 MB per-borough files.
 *
 * Pure — no I/O. Unit-tested in parse-inspire-gml.test.ts.
 */
import proj4 from "proj4";

/** OSGB36 / British National Grid → WGS84 (7-param Helmert, ~1 m accuracy — */
/*  ample for parcel point-in-polygon containment). */
const BNG =
  "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 " +
  "+ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 " +
  "+units=m +no_defs";
const WGS84 = "+proj=longlat +datum=WGS84 +no_defs";
const toWgs84 = proj4(BNG, WGS84);

/** A GeoJSON linear ring: [[lng, lat], …] (closed). */
export type Ring = [number, number][];
/** A GeoJSON polygon: [exteriorRing, ...holeRings]. */
export type PolygonCoords = Ring[];

export type InspireParcel = {
  /** The LR:PREDEFINED feature's gml:id — nationally stable parcel identifier. */
  inspireId: string;
  /** GeoJSON MultiPolygon coordinates (one parcel may have multiple polygons). */
  polygons: PolygonCoords[];
};

/** Convert a `posList` body (EASTING NORTHING …, EPSG:27700) to a WGS84 ring. */
export function posListToRing(posList: string): Ring {
  const nums = posList.trim().split(/\s+/).map(Number);
  const ring: Ring = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const easting = nums[i];
    const northing = nums[i + 1];
    if (!Number.isFinite(easting) || !Number.isFinite(northing)) continue;
    const [lng, lat] = toWgs84.forward([easting, northing]);
    ring.push([lng, lat]);
  }
  return ring;
}

/** Extract the text body of the first `<tag …>BODY</tag>` at/after `from`. */
function tagBody(
  xml: string,
  tag: string,
  from: number,
): { body: string; end: number } | null {
  const open = xml.indexOf(`<${tag}`, from);
  if (open === -1) return null;
  const openEnd = xml.indexOf(">", open);
  if (openEnd === -1) return null;
  const close = xml.indexOf(`</${tag}>`, openEnd);
  if (close === -1) return null;
  return { body: xml.slice(openEnd + 1, close), end: close + tag.length + 3 };
}

/** All `posList` bodies inside an XML fragment, in document order. */
function allPosLists(fragment: string): string[] {
  const out: string[] = [];
  let pos = 0;
  for (;;) {
    const next = tagBody(fragment, "gml:posList", pos);
    if (!next) break;
    out.push(next.body);
    pos = next.end;
  }
  return out;
}

/** Parse one `<gml:Polygon>…</gml:Polygon>` fragment into a GeoJSON polygon. */
function parsePolygon(fragment: string): PolygonCoords | null {
  const exterior = tagBody(fragment, "gml:exterior", 0);
  if (!exterior) return null;
  const exteriorPos = allPosLists(exterior.body)[0];
  if (!exteriorPos) return null;

  const rings: PolygonCoords = [posListToRing(exteriorPos)];

  // Interiors (holes): scan after the exterior closes.
  let pos = exterior.end;
  for (;;) {
    const interior = tagBody(fragment, "gml:interior", pos);
    if (!interior) break;
    const holePos = allPosLists(interior.body)[0];
    if (holePos) rings.push(posListToRing(holePos));
    pos = interior.end;
  }
  return rings;
}

/** Parse a full INSPIRE GML document into reprojected parcels. */
export function parseInspireGml(gml: string): InspireParcel[] {
  const parcels: InspireParcel[] = [];
  let pos = 0;

  for (;;) {
    const memberOpen = gml.indexOf("<wfs:member>", pos);
    if (memberOpen === -1) break;
    const memberClose = gml.indexOf("</wfs:member>", memberOpen);
    if (memberClose === -1) break;
    const member = gml.slice(memberOpen, memberClose);
    pos = memberClose + 13;

    const idMatch = member.match(/gml:id="([^"]+)"/);
    if (!idMatch) continue;
    const inspireId = idMatch[1];

    // Each polygon in the member geometry.
    const polygons: PolygonCoords[] = [];
    let pPos = 0;
    for (;;) {
      const polyOpen = member.indexOf("<gml:Polygon", pPos);
      if (polyOpen === -1) break;
      const polyClose = member.indexOf("</gml:Polygon>", polyOpen);
      if (polyClose === -1) break;
      const fragment = member.slice(polyOpen, polyClose + 14);
      pPos = polyClose + 14;
      const polygon = parsePolygon(fragment);
      if (polygon && polygon[0].length >= 4) polygons.push(polygon);
    }

    if (polygons.length > 0) parcels.push({ inspireId, polygons });
  }

  return parcels;
}
