/**
 * Contract tests for the three "sold-within filter" migrations:
 *   - 20260619091004_create_property_last_sold.sql
 *   - 20260619091212_backfill_property_last_sold.sql
 *   - 20260619091437_search_listings_add_last_sold_date.sql
 *
 * Connects directly to whatever `MIGRATION_DB_URL` (preferred) or
 * `SUPABASE_DB_URL` points to and asserts the post-migration schema. Run
 * against local Supabase before pushing to production; re-run against
 * production after push to confirm.
 *
 *   MIGRATION_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
 *     RUN_DB_TESTS=1 pnpm test src/__tests__/migrations/sold-within-filter.integration.test.ts --run
 */
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

const DB_URL = process.env.MIGRATION_DB_URL ?? process.env.SUPABASE_DB_URL ?? "";
const ENABLED = process.env.RUN_DB_TESTS === "1" && DB_URL.length > 0;

let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DB_URL,
      max: 2,
      idleTimeoutMillis: 10_000,
      statement_timeout: 30_000,
    });
  }
  return pool;
}

afterAll(async () => {
  if (pool) await pool.end();
});

describe.runIf(ENABLED)("sold-within filter migrations — post-state", () => {
  it("property_last_sold table exists with the right columns", async () => {
    const { rows } = await getPool().query<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>(
      `select column_name, data_type, is_nullable
       from information_schema.columns
       where table_schema = 'public' and table_name = 'property_last_sold'
       order by ordinal_position`,
    );
    const cols = Object.fromEntries(rows.map((r) => [r.column_name, r]));
    expect(cols.property_id?.data_type).toBe("uuid");
    expect(cols.property_id?.is_nullable).toBe("NO");
    expect(cols.last_sold_date?.data_type).toBe("date");
    expect(cols.last_sold_date?.is_nullable).toBe("NO");
    expect(cols.source?.data_type).toBe("text");
    expect(cols.updated_at?.data_type).toBe("timestamp with time zone");
  });

  it("property_last_sold has a primary key on property_id", async () => {
    const { rows } = await getPool().query<{ column_name: string }>(
      `select kcu.column_name
       from information_schema.table_constraints tc
       join information_schema.key_column_usage kcu
         on kcu.constraint_name = tc.constraint_name
        and kcu.table_schema = tc.table_schema
       where tc.table_schema = 'public'
         and tc.table_name = 'property_last_sold'
         and tc.constraint_type = 'PRIMARY KEY'`,
    );
    expect(rows.map((r) => r.column_name)).toEqual(["property_id"]);
  });

  it("property_last_sold has the last_sold_date descending index", async () => {
    const { rows } = await getPool().query<{ indexname: string }>(
      `select indexname from pg_indexes
       where schemaname = 'public' and tablename = 'property_last_sold'`,
    );
    expect(rows.map((r) => r.indexname)).toEqual(
      expect.arrayContaining(["property_last_sold_date_idx"]),
    );
  });

  it("property_last_sold has RLS enabled with public-read policy", async () => {
    const { rows: relrows } = await getPool().query<{ relrowsecurity: boolean }>(
      `select relrowsecurity from pg_class
       where relnamespace = 'public'::regnamespace and relname = 'property_last_sold'`,
    );
    expect(relrows[0]?.relrowsecurity).toBe(true);

    const { rows: polrows } = await getPool().query<{ policyname: string; cmd: string }>(
      `select policyname, cmd from pg_policies
       where schemaname = 'public' and tablename = 'property_last_sold'`,
    );
    expect(polrows.map((r) => r.policyname)).toEqual(
      expect.arrayContaining(["property_last_sold_select_all"]),
    );
  });

  it("search_listings materialized view exposes last_sold_date", async () => {
    const { rows } = await getPool().query<{ attname: string; typname: string }>(
      `select a.attname, t.typname
       from pg_attribute a
       join pg_class c on c.oid = a.attrelid
       join pg_namespace n on n.oid = c.relnamespace
       join pg_type t on t.oid = a.atttypid
       where n.nspname = 'public'
         and c.relname = 'search_listings'
         and c.relkind = 'm'
         and a.attnum > 0
         and not a.attisdropped`,
    );
    const cols = Object.fromEntries(rows.map((r) => [r.attname, r.typname]));
    expect(cols.last_sold_date).toBe("date");
  });

  it("search_listings has the last_sold_date desc-nulls-last index", async () => {
    const { rows } = await getPool().query<{ indexname: string }>(
      `select indexname from pg_indexes
       where schemaname = 'public' and tablename = 'search_listings'`,
    );
    expect(rows.map((r) => r.indexname)).toEqual(
      expect.arrayContaining(["idx_search_listings_last_sold_date"]),
    );
  });

  it("search_listings preserves all four pre-existing indexes", async () => {
    const { rows } = await getPool().query<{ indexname: string }>(
      `select indexname from pg_indexes
       where schemaname = 'public' and tablename = 'search_listings'`,
    );
    const names = rows.map((r) => r.indexname);
    expect(names).toEqual(
      expect.arrayContaining([
        "idx_search_listings_listing_id",
        "idx_search_listings_type_price",
        "idx_search_listings_coordinates",
        "idx_search_listings_tsv",
      ]),
    );
  });

  it("refresh_search_listings() function still exists", async () => {
    const { rows } = await getPool().query<{ proname: string }>(
      `select proname from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = 'refresh_search_listings'`,
    );
    expect(rows.length).toBeGreaterThan(0);
  });

  it("filtering search_listings by last_sold_date is queryable end-to-end", async () => {
    const result = await getPool().query<{ n: number }>(
      `select count(*)::int as n from public.search_listings
       where last_sold_date >= current_date - interval '3 months'`,
    );
    expect(result.rows[0].n).toBeGreaterThanOrEqual(0);
  });
});
