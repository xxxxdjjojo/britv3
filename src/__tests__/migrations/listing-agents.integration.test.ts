/**
 * Contract tests for 20260714110421_listing_agents_viewing_parity.sql.
 *
 * Asserts the post-migration schema state: the new listing_agents table + its
 * partial-unique index + RLS policies, and the extension of the viewing RLS
 * policies / respond_viewing_request RPC to grant a represented estate agent
 * full parity with the listing owner ("host") for viewings.
 *
 * Connects directly to whatever `MIGRATION_DB_URL` (preferred) or
 * `SUPABASE_DB_URL` points to. Run against local Supabase before pushing, then
 * re-run against production after applying:
 *
 *   MIGRATION_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
 *     RUN_DB_TESTS=1 pnpm test src/__tests__/migrations/listing-agents.integration.test.ts --run
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

describe.runIf(ENABLED)("listing_agents_viewing_parity migration — post-state", () => {
  it("listing_agents table has the expected columns", async () => {
    const { rows } = await getPool().query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_schema='public' and table_name='listing_agents'`,
    );
    const cols = rows.map((r) => r.column_name);
    for (const c of ["id", "listing_id", "agent_id", "status", "created_by", "created_at"]) {
      expect(cols).toContain(c);
    }
  });

  it("listing_agents has the partial unique index for active representation", async () => {
    const { rows } = await getPool().query<{ indexname: string }>(
      `select indexname from pg_indexes
       where schemaname='public' and tablename='listing_agents'
         and indexname='listing_agents_unique_active'`,
    );
    expect(rows).toHaveLength(1);
  });

  it("listing_agents has RLS enabled", async () => {
    const { rows } = await getPool().query<{ relrowsecurity: boolean }>(
      `select relrowsecurity from pg_class
       where oid = 'public.listing_agents'::regclass`,
    );
    expect(rows[0]?.relrowsecurity).toBe(true);
  });

  it("listing_agents has SELECT/INSERT/UPDATE policies (and no DELETE policy)", async () => {
    const { rows } = await getPool().query<{ cmd: string }>(
      `select cmd from pg_policies where tablename='listing_agents'`,
    );
    const cmds = rows.map((r) => r.cmd);
    expect(cmds).toContain("SELECT");
    expect(cmds).toContain("INSERT");
    expect(cmds).toContain("UPDATE");
    expect(cmds).not.toContain("DELETE");
  });

  it("viewing_slots_select_public references listing_agents (represented agent) and listings (owner clause)", async () => {
    const { rows } = await getPool().query<{ qual: string }>(
      `select qual from pg_policies
       where tablename='viewing_slots' and policyname='viewing_slots_select_public'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].qual).toContain("listing_agents");
    // Owner-of-listing clause: the host must see booked agent-created slots on
    // their own listing.
    expect(rows[0].qual).toContain("listings");
  });

  it("viewing_slots host insert/update/delete policies reference listing_agents", async () => {
    const { rows } = await getPool().query<{ policyname: string; qual: string | null; with_check: string | null }>(
      `select policyname, qual, with_check from pg_policies
       where tablename='viewing_slots'
         and policyname in ('viewing_slots_host_insert','viewing_slots_host_update','viewing_slots_host_delete')`,
    );
    expect(rows).toHaveLength(3);
    for (const r of rows) {
      const combined = `${r.qual ?? ""} ${r.with_check ?? ""}`;
      expect(combined).toContain("listing_agents");
    }
  });

  it("viewings_select references listing_agents and preserves owner/user clauses", async () => {
    const { rows } = await getPool().query<{ qual: string }>(
      `select qual from pg_policies
       where tablename='viewings' and policyname='viewings_select'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].qual).toContain("listing_agents");
    expect(rows[0].qual).toContain("user_id");
    expect(rows[0].qual).toContain("listings");
  });

  it("respond_viewing_request authorizes represented agents (references listing_agents)", async () => {
    const { rows } = await getPool().query<{ def: string }>(
      `select pg_get_functiondef(oid) as def from pg_proc where proname='respond_viewing_request'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].def).toContain("listing_agents");
  });

  it("is_estate_agent(uuid) exists and is authenticated-only", async () => {
    const { rows } = await getPool().query<{ nargs: number; acl: string | null }>(
      `select pronargs as nargs, array_to_string(proacl::text[], ',') as acl
       from pg_proc where proname='is_estate_agent'`,
    );
    expect(rows.some((r) => r.nargs === 1)).toBe(true);
    // authenticated has EXECUTE; anon must not
    const acl = rows.find((r) => r.nargs === 1)?.acl ?? "";
    expect(acl).toContain("authenticated=X");
    expect(acl).not.toMatch(/(^|,)anon=X/);
  });

  it("list_estate_agents() exists and is authenticated-only", async () => {
    const { rows } = await getPool().query<{ nargs: number; acl: string | null }>(
      `select pronargs as nargs, array_to_string(proacl::text[], ',') as acl
       from pg_proc where proname='list_estate_agents'`,
    );
    expect(rows.some((r) => r.nargs === 0)).toBe(true);
    // authenticated has EXECUTE; anon must not (returns directory names, not
    // for anonymous callers).
    const acl = rows.find((r) => r.nargs === 0)?.acl ?? "";
    expect(acl).toContain("authenticated=X");
    expect(acl).not.toMatch(/(^|,)anon=X/);
  });
});
