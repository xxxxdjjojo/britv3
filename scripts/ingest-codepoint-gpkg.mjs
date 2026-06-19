#!/usr/bin/env node
/**
 * Ingest OS Code-Point Open GeoPackage (codepo_gb.gpkg) into postcode_centroids.
 *
 * The .gpkg `codepoint` table stores the point in a GeoPackage geometry BLOB
 * (EPSG:27700, no easting/northing columns). We stream `postcode | hex(geometry)`
 * via the sqlite3 CLI, parse the GP header + WKB point to recover easting/northing,
 * convert OSGB36 -> WGS84, and batch-upsert. No GDAL / no node-sqlite needed.
 *
 * Usage:
 *   SUPABASE_DB_URL=... node scripts/ingest-codepoint-gpkg.mjs /path/to/codepo_gb.gpkg
 */
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import pg from "pg";

const gpkg = process.argv[2];
if (!gpkg) {
  console.error("Usage: node scripts/ingest-codepoint-gpkg.mjs <codepo_gb.gpkg>");
  process.exit(1);
}
const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("SUPABASE_DB_URL is required");
  process.exit(1);
}

// --- OSGB36 E/N -> WGS84 (same maths as src/lib/valuation/osgb.ts) ---
const A_AIRY = 6377563.396, B_AIRY = 6356256.909, F0 = 0.9996012717;
const LAT0 = (49 * Math.PI) / 180, LON0 = (-2 * Math.PI) / 180, E0 = 400000, N0 = -100000;
const A_WGS = 6378137.0, B_WGS = 6356752.3141;
const TX = 446.448, TY = -125.157, TZ = 542.06, S = 20.4894e-6;
const RX = (0.1502 / 3600) * (Math.PI / 180), RY = (0.247 / 3600) * (Math.PI / 180), RZ = (0.8421 / 3600) * (Math.PI / 180);
function osgb36ToWgs84(E, N) {
  const e2 = (A_AIRY * A_AIRY - B_AIRY * B_AIRY) / (A_AIRY * A_AIRY);
  const n = (A_AIRY - B_AIRY) / (A_AIRY + B_AIRY);
  let lat = LAT0, M = 0;
  do {
    lat = (N - N0 - M) / (A_AIRY * F0) + lat;
    const dL = lat - LAT0, sL = lat + LAT0;
    M = B_AIRY * F0 * ((1 + n + 1.25 * n * n + 1.25 * n ** 3) * dL
      - (3 * n + 3 * n * n + 2.625 * n ** 3) * Math.sin(dL) * Math.cos(sL)
      + (1.875 * n * n + 1.875 * n ** 3) * Math.sin(2 * dL) * Math.cos(2 * sL)
      - (35 / 24) * n ** 3 * Math.sin(3 * dL) * Math.cos(3 * sL));
  } while (Math.abs(N - N0 - M) >= 0.00001);
  const sinLat = Math.sin(lat);
  const nu = (A_AIRY * F0) / Math.sqrt(1 - e2 * sinLat * sinLat);
  const rho = (A_AIRY * F0 * (1 - e2)) / Math.pow(1 - e2 * sinLat * sinLat, 1.5);
  const eta2 = nu / rho - 1;
  const tL = Math.tan(lat), t2 = tL * tL, t4 = t2 * t2, t6 = t4 * t2, sec = 1 / Math.cos(lat);
  const VII = tL / (2 * rho * nu);
  const VIII = (tL / (24 * rho * nu ** 3)) * (5 + 3 * t2 + eta2 - 9 * t2 * eta2);
  const IX = (tL / (720 * rho * nu ** 5)) * (61 + 90 * t2 + 45 * t4);
  const X = sec / nu, XI = (sec / (6 * nu ** 3)) * (nu / rho + 2 * t2);
  const XII = (sec / (120 * nu ** 5)) * (5 + 28 * t2 + 24 * t4);
  const XIIA = (sec / (5040 * nu ** 7)) * (61 + 662 * t2 + 1320 * t4 + 720 * t6);
  const dE = E - E0;
  const latA = lat - VII * dE ** 2 + VIII * dE ** 4 - IX * dE ** 6;
  const lonA = LON0 + X * dE - XI * dE ** 3 + XII * dE ** 5 - XIIA * dE ** 7;
  const ea = e2, sA = Math.sin(latA), nuA = A_AIRY / Math.sqrt(1 - ea * sA * sA);
  const x0 = nuA * Math.cos(latA) * Math.cos(lonA);
  const y0 = nuA * Math.cos(latA) * Math.sin(lonA);
  const z0 = (1 - ea) * nuA * sA;
  const x = TX + (1 + S) * x0 - RZ * y0 + RY * z0;
  const y = TY + RZ * x0 + (1 + S) * y0 - RX * z0;
  const z = TZ - RY * x0 + RX * y0 + (1 + S) * z0;
  const ew = (A_WGS * A_WGS - B_WGS * B_WGS) / (A_WGS * A_WGS);
  const p = Math.sqrt(x * x + y * y);
  let latW = Math.atan2(z, p * (1 - ew));
  for (let i = 0; i < 10; i++) {
    const s = Math.sin(latW);
    const nuW = A_WGS / Math.sqrt(1 - ew * s * s);
    latW = Math.atan2(z + ew * nuW * s, p);
  }
  return { lat: (latW * 180) / Math.PI, lng: (Math.atan2(y, x) * 180) / Math.PI };
}

const ENV_BYTES = { 0: 0, 1: 32, 2: 48, 3: 48, 4: 64 };
/** Parse a GeoPackage POINT geometry blob (hex) -> { e, n } in source CRS (BNG). */
function parsePointBlob(hex) {
  const buf = Buffer.from(hex, "hex");
  if (buf[0] !== 0x47 || buf[1] !== 0x50) return null; // 'GP'
  const flags = buf[3];
  const envType = (flags >> 1) & 0x07;
  const wkb = 8 + (ENV_BYTES[envType] ?? 0);
  const le = buf[wkb] === 1;
  const x = le ? buf.readDoubleLE(wkb + 5) : buf.readDoubleBE(wkb + 5);
  const y = le ? buf.readDoubleLE(wkb + 13) : buf.readDoubleBE(wkb + 13);
  return { e: x, n: y };
}

function normPostcode(raw) {
  const c = String(raw ?? "").toUpperCase().replace(/\s+/g, "");
  if (c.length < 5 || c.length > 7) return null;
  return `${c.slice(0, -3)} ${c.slice(-3)}`;
}

const pool = new pg.Pool({ connectionString, max: 4 });
const BATCH = 1000;
async function upsert(batch) {
  if (!batch.length) return;
  const values = [];
  const params = [];
  batch.forEach((r, i) => {
    const b = i * 3;
    values.push(`($${b + 1}, $${b + 2}, $${b + 3}, 'codepoint')`);
    params.push(r.postcode, r.lat, r.lng);
  });
  await pool.query(
    `INSERT INTO public.postcode_centroids (postcode, latitude, longitude, source)
     VALUES ${values.join(",")}
     ON CONFLICT (postcode) DO UPDATE
       SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
           source = EXCLUDED.source, updated_at = NOW()`,
    params,
  );
}

async function main() {
  const child = spawn("sqlite3", ["-separator", "\t", gpkg, "SELECT postcode, hex(geometry) FROM codepoint;"]);
  const rl = createInterface({ input: child.stdout, crlfDelay: Infinity });
  let batch = [];
  let total = 0;
  let skipped = 0;
  for await (const line of rl) {
    const tab = line.indexOf("\t");
    if (tab < 0) continue;
    const postcode = normPostcode(line.slice(0, tab));
    const pt = postcode ? parsePointBlob(line.slice(tab + 1).trim()) : null;
    if (!postcode || !pt || !Number.isFinite(pt.e) || pt.e === 0) {
      skipped++;
      continue;
    }
    const { lat, lng } = osgb36ToWgs84(pt.e, pt.n);
    if (!Number.isFinite(lat) || lat < 49 || lat > 61) {
      skipped++;
      continue;
    }
    batch.push({ postcode, lat, lng });
    if (batch.length >= BATCH) {
      await upsert(batch);
      total += batch.length;
      batch = [];
      if (total % 100000 === 0) console.log(`  ${total.toLocaleString()} upserted…`);
    }
  }
  await upsert(batch);
  total += batch.length;
  console.log(`Done. Upserted ${total.toLocaleString()} centroids, skipped ${skipped.toLocaleString()}.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
