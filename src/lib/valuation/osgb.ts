/**
 * OSGB36 British National Grid (easting/northing, EPSG:27700) → WGS84 lat/long
 * (EPSG:4326). Lets the centroid ingest accept OS Code-Point Open directly.
 *
 * Two steps: reverse Transverse Mercator on the Airy 1830 ellipsoid to OSGB36
 * geodetic, then a 7-parameter Helmert datum shift OSGB36 → WGS84. Accurate to
 * a few metres — far finer than postcode-centroid weighting needs. Algorithm per
 * Ordnance Survey "A guide to coordinate systems in Great Britain".
 */

const deg = (rad: number) => (rad * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;

// Airy 1830 (OSGB36) ellipsoid + National Grid projection constants.
const A_AIRY = 6377563.396;
const B_AIRY = 6356256.909;
const F0 = 0.9996012717;
const LAT0 = rad(49);
const LON0 = rad(-2);
const E0 = 400000;
const N0 = -100000;

// GRS80 / WGS84 ellipsoid.
const A_WGS = 6378137.0;
const B_WGS = 6356752.3141;

type Geodetic = { lat: number; lon: number; h: number };

function gridToAiryGeodetic(easting: number, northing: number): Geodetic {
  const e2 = (A_AIRY * A_AIRY - B_AIRY * B_AIRY) / (A_AIRY * A_AIRY);
  const n = (A_AIRY - B_AIRY) / (A_AIRY + B_AIRY);

  let lat = LAT0;
  let M = 0;
  do {
    lat = (northing - N0 - M) / (A_AIRY * F0) + lat;
    const dLat = lat - LAT0;
    const sLat = lat + LAT0;
    M =
      B_AIRY *
      F0 *
      ((1 + n + (5 / 4) * n * n + (5 / 4) * n * n * n) * dLat -
        (3 * n + 3 * n * n + (21 / 8) * n * n * n) * Math.sin(dLat) * Math.cos(sLat) +
        ((15 / 8) * n * n + (15 / 8) * n * n * n) * Math.sin(2 * dLat) * Math.cos(2 * sLat) -
        (35 / 24) * n * n * n * Math.sin(3 * dLat) * Math.cos(3 * sLat));
  } while (Math.abs(northing - N0 - M) >= 0.00001);

  const sinLat = Math.sin(lat);
  const nu = (A_AIRY * F0) / Math.sqrt(1 - e2 * sinLat * sinLat);
  const rho = (A_AIRY * F0 * (1 - e2)) / Math.pow(1 - e2 * sinLat * sinLat, 1.5);
  const eta2 = nu / rho - 1;

  const tanLat = Math.tan(lat);
  const t2 = tanLat * tanLat;
  const t4 = t2 * t2;
  const t6 = t4 * t2;
  const secLat = 1 / Math.cos(lat);

  const VII = tanLat / (2 * rho * nu);
  const VIII = (tanLat / (24 * rho * nu ** 3)) * (5 + 3 * t2 + eta2 - 9 * t2 * eta2);
  const IX = (tanLat / (720 * rho * nu ** 5)) * (61 + 90 * t2 + 45 * t4);
  const X = secLat / nu;
  const XI = (secLat / (6 * nu ** 3)) * (nu / rho + 2 * t2);
  const XII = (secLat / (120 * nu ** 5)) * (5 + 28 * t2 + 24 * t4);
  const XIIA = (secLat / (5040 * nu ** 7)) * (61 + 662 * t2 + 1320 * t4 + 720 * t6);

  const dE = easting - E0;
  const latOut =
    lat - VII * dE ** 2 + VIII * dE ** 4 - IX * dE ** 6;
  const lonOut =
    LON0 + X * dE - XI * dE ** 3 + XII * dE ** 5 - XIIA * dE ** 7;

  return { lat: latOut, lon: lonOut, h: 0 };
}

function geodeticToCartesian(g: Geodetic, a: number, b: number) {
  const e2 = (a * a - b * b) / (a * a);
  const sinLat = Math.sin(g.lat);
  const nu = a / Math.sqrt(1 - e2 * sinLat * sinLat);
  return {
    x: (nu + g.h) * Math.cos(g.lat) * Math.cos(g.lon),
    y: (nu + g.h) * Math.cos(g.lat) * Math.sin(g.lon),
    z: ((1 - e2) * nu + g.h) * sinLat,
  };
}

function cartesianToGeodetic(c: { x: number; y: number; z: number }, a: number, b: number): Geodetic {
  const e2 = (a * a - b * b) / (a * a);
  const p = Math.sqrt(c.x * c.x + c.y * c.y);
  let lat = Math.atan2(c.z, p * (1 - e2));
  let nu = a;
  for (let i = 0; i < 10; i++) {
    const sinLat = Math.sin(lat);
    nu = a / Math.sqrt(1 - e2 * sinLat * sinLat);
    lat = Math.atan2(c.z + e2 * nu * sinLat, p);
  }
  return { lat, lon: Math.atan2(c.y, c.x), h: p / Math.cos(lat) - nu };
}

// Helmert OSGB36 -> WGS84 (negated published WGS84->OSGB36 parameters).
const TX = 446.448;
const TY = -125.157;
const TZ = 542.06;
const S = 20.4894e-6;
const RX = rad(0.1502 / 3600);
const RY = rad(0.247 / 3600);
const RZ = rad(0.8421 / 3600);

/** Convert an OSGB36 National Grid easting/northing to WGS84 latitude/longitude. */
export function osgb36ToWgs84(easting: number, northing: number): { lat: number; lng: number } {
  const airy = gridToAiryGeodetic(easting, northing);
  const c = geodeticToCartesian(airy, A_AIRY, B_AIRY);
  const x = TX + (1 + S) * c.x - RZ * c.y + RY * c.z;
  const y = TY + RZ * c.x + (1 + S) * c.y - RX * c.z;
  const z = TZ - RY * c.x + RX * c.y + (1 + S) * c.z;
  const wgs = cartesianToGeodetic({ x, y, z }, A_WGS, B_WGS);
  return { lat: deg(wgs.lat), lng: deg(wgs.lon) };
}
