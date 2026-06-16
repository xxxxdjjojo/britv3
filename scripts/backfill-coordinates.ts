/**
 * scripts/backfill-coordinates.ts
 *
 * Backfills PostGIS coordinates for properties that are missing them, so the
 * public property detail page can render its Location map. Geocoding happens
 * here at ingest time (via postcodes.io), NOT at render time.
 *
 * Idempotent: only touches rows where `coordinates IS NULL`. Safe to re-run.
 * Dry-run by default — pass --commit to actually write.
 *
 * Usage:
 *   SUPABASE_URL='https://YOUR-PROJECT.supabase.co' \
 *   SUPABASE_SERVICE_ROLE_KEY='YOUR-SERVICE-ROLE-KEY' \
 *   pnpm tsx scripts/backfill-coordinates.ts            # dry run
 *   pnpm tsx scripts/backfill-coordinates.ts --commit   # write
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { geocodePostcode } from "../src/services/geocoding/postcodes-io";

const COMMIT = process.argv.includes("--commit");

/**
 * Load .env.local then .env from the cwd into process.env, without overriding
 * vars already set on the command line. Values may carry trailing emoji/text
 * annotations (project convention), so only the first whitespace-bounded token
 * is taken, with surrounding quotes stripped.
 */
function loadLocalEnv(): void {
  for (const file of [".env.local", ".env"]) {
    let content: string;
    try {
      content = readFileSync(join(process.cwd(), file), "utf8");
    } catch {
      continue;
    }
    for (const line of content.split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      const value = rawValue.trim().split(/\s+/)[0].replace(/^["']|["']$/g, "");
      if (value) process.env[key] = value;
    }
  }
}

loadLocalEnv();

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

type PropertyRow = { id: string; postcode: string };

async function main(): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("properties")
    .select("id, postcode")
    .is("coordinates", null)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as PropertyRow[];
  console.log(
    `Found ${rows.length} properties without coordinates.${COMMIT ? "" : " (dry run — no writes)"}`,
  );

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const geo = await geocodePostcode(row.postcode);
    if (!geo) {
      skipped += 1;
      console.warn(`  skip ${row.id} — could not geocode "${row.postcode}"`);
      continue;
    }

    if (COMMIT) {
      const { error: rpcError } = await supabase.rpc("set_property_coordinates", {
        p_property_id: row.id,
        p_lng: geo.longitude,
        p_lat: geo.latitude,
      });
      if (rpcError) {
        skipped += 1;
        console.warn(`  fail ${row.id} — ${rpcError.message}`);
        continue;
      }
    }

    updated += 1;
    console.log(
      `  ${COMMIT ? "set" : "would set"} ${row.id} ${row.postcode} -> ${geo.latitude}, ${geo.longitude}`,
    );
  }

  console.log(
    `Done. ${updated} ${COMMIT ? "updated" : "to update"}, ${skipped} skipped/failed.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
