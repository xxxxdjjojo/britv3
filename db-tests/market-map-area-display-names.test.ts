/**
 * Contract tests for human-facing area display names.
 *
 * Verifies geography_boundaries.display_name (added by
 * 20260624180000_market_map_area_display_names.sql) and that
 * public.market_map_features surfaces it as area_name for MSOA/LSOA — the field
 * the map's tooltip, price card and detail panel render. Levels whose area_name
 * is already human (postcode_district) carry display_name = null and are
 * returned unchanged.
 *
 * Runs against the configured Supabase instance using the deterministic ZZ
 * fixture (scripts/seed-market-map-fixture.mjs). Skips cleanly when
 * SUPABASE_DB_URL is not available (e.g. CI without creds). Run:
 *   node scripts/seed-market-map-fixture.mjs
 *   pnpm test:db
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

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
    /* no .env.local */
  }
  return "";
}

const DB_URL = loadDbUrl();
const CA = (() => {
  try {
    return readFileSync(resolve(process.cwd(), "scripts/certs/supabase-prod-ca-2021.crt"), "utf8");
  } catch {
    return undefined;
  }
})();

// Bbox covering the fictional ZZ fixture (lat ~51.47–51.56, lng ~-0.12–-0.08).
const ZZ_BBOX = [-0.2, 51.4, 0.0, 51.6] as const;

describe.skipIf(!DB_URL)("market-map area display names (Supabase + ZZ fixture)", () => {
  let client: pg.Client;

  async function displayName(level: string, areaId: string): Promise<string | null> {
    const r = await client.query(
      "select display_name from public.geography_boundaries where level=$1 and area_id=$2",
      [level, areaId],
    );
    return r.rows[0]?.display_name ?? null;
  }

  async function featureName(level: string, areaId: string): Promise<string | null> {
    const r = await client.query(
      `select area_name from public.market_map_features($1,'all',null,null,$2,$3,$4,$5)
         where area_id = $6`,
      [level, ZZ_BBOX[0], ZZ_BBOX[1], ZZ_BBOX[2], ZZ_BBOX[3], areaId],
    );
    return r.rows[0]?.area_name ?? null;
  }

  beforeAll(async () => {
    client = new pg.Client({ connectionString: DB_URL, ssl: CA ? { ca: CA } : undefined });
    await client.connect();

    const col = await client.query(
      `select 1 from information_schema.columns
         where table_name='geography_boundaries' and column_name='display_name'`,
    );
    if (col.rowCount === 0) {
      throw new Error(
        "geography_boundaries.display_name missing — apply " +
          "supabase/migrations/20260624180000_market_map_area_display_names.sql, " +
          "then re-seed: node scripts/seed-market-map-fixture.mjs",
      );
    }

    const seeded = await client.query(
      "select count(*)::int as n from public.geography_boundaries where area_id = 'ZZM01'",
    );
    if (seeded.rows[0].n === 0) {
      throw new Error("ZZ fixture not present. Run: node scripts/seed-market-map-fixture.mjs");
    }
  }, 30_000);

  afterAll(async () => {
    if (client) await client.end();
  });

  it("backfills MSOA display_name as '<district> · <borough>'", async () => {
    expect(await displayName("msoa", "ZZM01")).toBe("ZZ1A · Northgate");
  });

  it("backfills LSOA display_name as '<district> · <borough>'", async () => {
    expect(await displayName("lsoa", "ZZS01")).toBe("ZZ1A · Northgate");
  });

  it("market_map_features returns the MSOA display_name as area_name — never the ONS code", async () => {
    const name = await featureName("msoa", "ZZM01");
    expect(name).toBe("ZZ1A · Northgate");
    expect(name).not.toMatch(/^[EWSNK]\d{8}$/); // never a raw ONS code
  });

  it("market_map_features returns the LSOA display_name as area_name", async () => {
    expect(await featureName("lsoa", "ZZS01")).toBe("ZZ1A · Northgate");
  });

  it("leaves postcode_district names unchanged (display_name null → area_name)", async () => {
    expect(await displayName("postcode_district", "ZZ1A")).toBeNull();
    expect(await featureName("postcode_district", "ZZ1A")).toBe("ZZ1A");
  });
});
