/**
 * Contract tests for 20260706155747_fix_viewing_booking.sql.
 *
 * Asserts the post-migration schema state: new columns, the listing FK, the
 * rewritten RLS policies, the widened CHECK constraints, the dropped feedback
 * FK, and the three booking RPCs (claim_viewing_slot, request_viewing,
 * respond_viewing_request).
 *
 * Connects directly to whatever `MIGRATION_DB_URL` (preferred) or
 * `SUPABASE_DB_URL` points to. Run against local Supabase before pushing, then
 * re-run against production after applying:
 *
 *   MIGRATION_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
 *     RUN_DB_TESTS=1 pnpm test src/__tests__/migrations/viewing-booking-fix.integration.test.ts --run
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

describe.runIf(ENABLED)("fix_viewing_booking migration — post-state", () => {
  it("viewing_slots gains booked_by and notes columns", async () => {
    const { rows } = await getPool().query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_schema='public' and table_name='viewing_slots'
         and column_name in ('booked_by','notes')`,
    );
    const cols = rows.map((r) => r.column_name);
    expect(cols).toContain("booked_by");
    expect(cols).toContain("notes");
  });

  it("viewing_slots.listing_id has a FK to listings", async () => {
    const { rows } = await getPool().query<{ def: string }>(
      `select pg_get_constraintdef(oid) as def from pg_constraint
       where conname='viewing_slots_listing_id_fkey'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].def).toMatch(/REFERENCES (public\.)?listings\(id\)/);
  });

  it("viewings supports slot-less pending requests", async () => {
    const { rows } = await getPool().query<{ is_nullable: string }>(
      `select is_nullable from information_schema.columns
       where table_schema='public' and table_name='viewings' and column_name='slot_id'`,
    );
    expect(rows[0]?.is_nullable).toBe("YES");

    const pref = await getPool().query(
      `select 1 from information_schema.columns
       where table_schema='public' and table_name='viewings' and column_name='preferred_time'`,
    );
    expect(pref.rows).toHaveLength(1);
  });

  it("viewings status CHECK includes pending and declined", async () => {
    const { rows } = await getPool().query<{ def: string }>(
      `select pg_get_constraintdef(oid) as def from pg_constraint where conname='viewings_status_check'`,
    );
    expect(rows[0].def).toContain("pending");
    expect(rows[0].def).toContain("declined");
  });

  it("platform_events entity_type CHECK allows 'viewing'", async () => {
    const { rows } = await getPool().query<{ def: string }>(
      `select pg_get_constraintdef(oid) as def from pg_constraint where conname='platform_events_entity_type_check'`,
    );
    expect(rows[0].def).toContain("viewing");
  });

  it("agent_viewing_feedback FK to agent_viewing_slots is dropped", async () => {
    const { rows } = await getPool().query(
      `select 1 from pg_constraint where conname='agent_viewing_feedback_viewing_slot_id_fkey'`,
    );
    expect(rows).toHaveLength(0);
  });

  it("viewing_slots SELECT policy lets anyone read available slots", async () => {
    const { rows } = await getPool().query<{ roles: string; qual: string }>(
      `select array_to_string(roles,',') as roles, qual from pg_policies
       where tablename='viewing_slots' and policyname='viewing_slots_select_public'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].roles).toContain("anon");
    expect(rows[0].roles).toContain("authenticated");
    expect(rows[0].qual).toContain("available");
  });

  it("viewing_slots host INSERT/UPDATE/DELETE policies exist", async () => {
    const { rows } = await getPool().query<{ policyname: string }>(
      `select policyname from pg_policies
       where tablename='viewing_slots'
         and policyname in ('viewing_slots_host_insert','viewing_slots_host_update','viewing_slots_host_delete')`,
    );
    expect(rows.map((r) => r.policyname).sort()).toEqual([
      "viewing_slots_host_delete",
      "viewing_slots_host_insert",
      "viewing_slots_host_update",
    ]);
  });

  it("claim_viewing_slot(uuid,uuid) exists and is authenticated-only", async () => {
    const { rows } = await getPool().query<{ nargs: number; acl: string | null }>(
      `select pronargs as nargs, array_to_string(proacl::text[], ',') as acl
       from pg_proc where proname='claim_viewing_slot'`,
    );
    expect(rows.some((r) => r.nargs === 2)).toBe(true);
    // authenticated has EXECUTE; anon must not
    const acl = rows.find((r) => r.nargs === 2)?.acl ?? "";
    expect(acl).toContain("authenticated=X");
    expect(acl).not.toMatch(/(^|,)anon=X/);
  });

  it("request_viewing and respond_viewing_request exist", async () => {
    const { rows } = await getPool().query<{ proname: string }>(
      `select proname from pg_proc where proname in ('request_viewing','respond_viewing_request')`,
    );
    const names = rows.map((r) => r.proname);
    expect(names).toContain("request_viewing");
    expect(names).toContain("respond_viewing_request");
  });
});
