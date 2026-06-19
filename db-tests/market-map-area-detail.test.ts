/**
 * Contract tests for the market_map_area_detail RPC (flat vs house breakdown).
 *
 * Unlike the truedeed db-tests (which boot a plain postgres:15 container), the
 * market-map RPCs need PostGIS + the full geography stack, so this suite runs
 * against the configured Supabase instance using the deterministic ZZ fixture
 * loaded by `scripts/seed-market-map-fixture.mjs`.
 *
 * Skips cleanly when SUPABASE_DB_URL is not available (e.g. CI without creds).
 * When it does run, it expects the fixture to be present — run:
 *   node scripts/seed-market-map-fixture.mjs
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

type Segment = { median_pence: number | null; count: number; latest_date: string | null };
type Detail = {
  area_id: string;
  geography_level: string;
  overall: Segment & { p10_pence: number | null; p90_pence: number | null };
  flat: Segment;
  house: Segment;
};

describe.skipIf(!DB_URL)("market_map_area_detail (Supabase + ZZ fixture)", () => {
  let client: pg.Client;

  async function detail(level: string, areaId: string): Promise<Detail> {
    const r = await client.query("select public.market_map_area_detail($1,$2) as j", [level, areaId]);
    return r.rows[0].j as Detail;
  }

  beforeAll(async () => {
    client = new pg.Client({ connectionString: DB_URL, ssl: CA ? { ca: CA } : undefined });
    await client.connect();
    const seeded = await client.query(
      "select count(*)::int as n from public.ppd_with_geography where lsoa_cd = 'ZZS01'",
    );
    if (seeded.rows[0].n === 0) {
      throw new Error(
        "ZZ fixture not present. Run: node scripts/seed-market-map-fixture.mjs",
      );
    }
  }, 30_000);

  afterAll(async () => {
    if (client) await client.end();
  });

  it("splits a well-populated LSOA into distinct flat and house medians (pence)", async () => {
    const d = await detail("lsoa", "ZZS01");
    expect(d.flat.median_pence).toBe(30_000_000); // £300k
    expect(d.flat.count).toBe(30);
    expect(d.house.median_pence).toBe(60_000_000); // £600k
    expect(d.house.count).toBe(30);
    expect(d.overall.count).toBe(60);
  });

  it("partitions flats + houses with no overlap and no join duplication", async () => {
    const d = await detail("lsoa", "ZZS01");
    // flats (F) + houses (D,S,T) == overall, proving a clean partition.
    expect(d.flat.count + d.house.count).toBe(d.overall.count);
    // overall count equals the raw geo-joined row count (each ppd row joins one postcode).
    const raw = await client.query(
      `select count(*)::int as n from public.ppd_with_geography
         where lsoa_cd = 'ZZS01' and transfer_date >= current_date - interval '36 months'`,
    );
    expect(d.overall.count).toBe(raw.rows[0].n);
  });

  it("returns null median + count 0 for a property type with no sales (never 0 price)", async () => {
    const d = await detail("postcode_district", "ZZ2B"); // 2 houses, 0 flats
    expect(d.flat.count).toBe(0);
    expect(d.flat.median_pence).toBeNull();
    expect(d.house.count).toBe(2);
    expect(d.house.median_pence).toBe(40_000_000); // £400k
  });

  it("rejects an unknown geography level", async () => {
    await expect(detail("galaxy", "ZZS01")).rejects.toThrow();
  });
});
