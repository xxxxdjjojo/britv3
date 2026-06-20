/**
 * scripts/link-epc-to-properties.ts
 *
 * Links each property to its EPC certificate and denormalises the EPC onto
 * `properties` (read instantly by the detail page + renovation ROI service).
 *
 * Match: properties have no UPRN, so we gate on canonical postcode then compare
 * the PAON (leading token of address_line1) using the shared, unit-tested EPC
 * matcher (src/lib/epc/match-epc) — UNDER-link rather than mis-link. The newest
 * certificate wins. When a match carries a UPRN we backfill listings.uprn so
 * future PPD matching has the exact join key.
 *
 * Dry run by default (reports match counts, NO writes). --commit writes.
 *   node --experimental-strip-types scripts/link-epc-to-properties.ts
 *   node --experimental-strip-types scripts/link-epc-to-properties.ts --commit
 * Flags: --limit N (cap properties, for quick test slices).
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { extractPaon } from "../src/lib/epc/parse-epc-row.ts";
import { pickBestEpc, type EpcCandidate } from "../src/lib/epc/match-epc.ts";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const COMMIT = process.argv.includes("--commit");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX !== -1 ? Number(process.argv[LIMIT_IDX + 1]) : null;

/** Only denormalise at/above this confidence (postcode + PAON = 0.9). */
const MIN_CONFIDENCE = 0.9;

function loadDbUrl(): string {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL.split("#")[0].trim();
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i === -1 || line.slice(0, i).trim() !== "SUPABASE_DB_URL") continue;
      return line.slice(i + 1).trim().replace(/^["']|["']$/g, "").split("#")[0].trim().replace(/\s+.*$/, "");
    }
  } catch {
    /* ignore */
  }
  return "";
}

function loadCaCert(): string {
  const caPath = process.env.PGSSLROOTCERT || resolve(SCRIPT_DIR, "certs", "supabase-prod-ca-2021.crt");
  return readFileSync(caPath, "utf8");
}

const normPostcode = (pc: string): string => {
  const compact = pc.toUpperCase().replace(/\s+/g, "");
  return compact.length <= 3 ? compact : `${compact.slice(0, -3)} ${compact.slice(-3)}`;
};

/** EPC score column has a 1..100 CHECK — clamp out-of-range / null to null. */
const validScore = (n: number | null): number | null =>
  n !== null && Number.isInteger(n) && n >= 1 && n <= 100 ? n : null;

type CertRow = {
  certificate_number: string;
  uprn: string | null;
  postcode: string | null;
  paon: string | null;
  inspection_date: Date | null;
  current_energy_rating: string | null;
  current_energy_efficiency: number | null;
  potential_energy_rating: string | null;
  potential_energy_efficiency: number | null;
  total_floor_area: number | null;
  property_type: string | null;
  built_form: string | null;
  construction_age_band: string | null;
};

async function main(): Promise<void> {
  const dbUrl = loadDbUrl();
  if (!dbUrl) {
    console.error("SUPABASE_DB_URL not set (and not in .env.local).");
    process.exit(1);
  }
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { ca: loadCaCert(), rejectUnauthorized: true },
  });
  await client.connect();
  console.log(COMMIT ? "Linking EPC → properties (writing)." : "Dry run — no writes.");

  let linked = 0;
  let unmatched = 0;
  let uprnBackfilled = 0;

  try {
    const props = await client.query<{
      id: string;
      address_line1: string;
      postcode: string;
    }>(
      `select id, address_line1, postcode from public.properties
       where postcode is not null and address_line1 is not null
       ${LIMIT ? `limit ${LIMIT}` : ""}`,
    );

    for (const p of props.rows) {
      const paon = extractPaon(p.address_line1);
      if (!paon) {
        unmatched++;
        continue;
      }
      const pc = normPostcode(p.postcode);
      const certs = await client.query<CertRow>(
        `select certificate_number, uprn, postcode, paon, inspection_date,
                current_energy_rating, current_energy_efficiency,
                potential_energy_rating, potential_energy_efficiency,
                total_floor_area, property_type, built_form, construction_age_band
         from public.epc_certificates where postcode = $1`,
        [pc],
      );

      const candidates: EpcCandidate[] = certs.rows.map((r) => ({
        certificateNumber: r.certificate_number,
        uprn: r.uprn,
        postcode: r.postcode,
        paon: r.paon,
        inspectionDate: r.inspection_date ? r.inspection_date.toISOString().slice(0, 10) : null,
      }));

      const best = pickBestEpc({ uprn: null, postcode: pc, paon }, candidates);
      if (!best || best.confidence < MIN_CONFIDENCE) {
        unmatched++;
        continue;
      }
      const cert = certs.rows.find((r) => r.certificate_number === best.certificateNumber)!;

      if (COMMIT) {
        await client.query(
          `update public.properties set
             epc_rating = $2, epc_score = $3,
             epc_potential_rating = $4, epc_potential_score = $5,
             epc_floor_area_sqm = $6, epc_property_type = $7, epc_built_form = $8,
             epc_construction_age_band = $9, epc_inspection_date = $10,
             epc_lmk_key = $11, epc_match_confidence = $12
           where id = $1`,
          [
            p.id,
            cert.current_energy_rating,
            validScore(cert.current_energy_efficiency),
            cert.potential_energy_rating,
            cert.potential_energy_efficiency,
            cert.total_floor_area,
            cert.property_type,
            cert.built_form,
            cert.construction_age_band,
            cert.inspection_date,
            cert.certificate_number,
            best.confidence,
          ],
        );
        if (cert.uprn) {
          const res = await client.query(
            `update public.listings set uprn = $2
             where property_id = $1 and (uprn is null or uprn = '')`,
            [p.id, cert.uprn],
          );
          uprnBackfilled += res.rowCount ?? 0;
        }
      }
      linked++;
    }

    console.log(
      `Done. ${linked} ${COMMIT ? "linked" : "would link"}, ${unmatched} unmatched` +
        `${COMMIT ? `, ${uprnBackfilled} listings.uprn backfilled` : ""}.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
