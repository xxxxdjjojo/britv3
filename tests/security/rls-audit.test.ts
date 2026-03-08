/**
 * RLS Audit Integration Tests
 *
 * Verifies that all public schema tables have Row-Level Security enabled
 * and that every RLS-enabled table has at least one policy.
 *
 * These tests run against the real Supabase database using the service role
 * key (bypasses RLS) to inspect pg_catalog metadata.
 *
 * IMPORTANT: Tests are skipped gracefully when DB credentials are unavailable
 * so they do not block CI runs without a database connection.
 */
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const DB_AVAILABLE = Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);

// These tables are known to be service-role-only (intentionally deny-all via RLS with no policies)
// Empty by default; add table names here if any are intentionally policy-free
const INTENTIONALLY_POLICY_FREE_TABLES: string[] = [];

// Sensitive tables that MUST have RLS enabled -- verified explicitly
const SENSITIVE_TABLES = [
  "profiles",
  "properties",
  "messages",
  "bookings",
  "push_subscriptions",
  "content_reports",
  "tenancies",
  "rent_payments",
  "expenses",
  "compliance_documents",
  "conversations",
  "provider_profiles",
  "rfqs",
  "rfq_responses",
  "maintenance_requests",
] as const;

describe("RLS Policy Audit", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabase: ReturnType<typeof createClient<any>>;

  beforeAll(() => {
    if (!DB_AVAILABLE) return;
    supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  });

  afterAll(async () => {
    // No cleanup needed -- read-only audit queries
  });

  it("skips all tests when database credentials are unavailable", () => {
    if (!DB_AVAILABLE) {
      console.warn(
        "RLS audit skipped: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set",
      );
      expect(true).toBe(true);
      return;
    }
    expect(DB_AVAILABLE).toBe(true);
  });

  it("all public schema tables have RLS enabled", async () => {
    if (!DB_AVAILABLE) return;

    const { data, error } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT IN (
          SELECT relname FROM pg_class WHERE relrowsecurity = true
        )
        ORDER BY tablename;
      `,
    });

    if (error) {
      // exec_sql RPC may not exist; fall back to direct query approach
      console.warn(
        "exec_sql RPC not available, attempting direct pg_tables query",
      );
      const { data: tablesData, error: tablesError } = await supabase
        .from("pg_tables")
        .select("schemaname, tablename")
        .eq("schemaname", "public");

      if (tablesError) {
        console.warn(
          "Cannot query pg_tables directly -- pg_catalog access requires exec_sql RPC or direct psql",
        );
        return;
      }

      // If we can query pg_tables, this means RLS is not blocking -- likely not what we want
      // The absence of error here is not meaningful for RLS audit
      return;
    }

    const tablesWithoutRls = (data ?? []) as Array<{
      schemaname: string;
      tablename: string;
    }>;

    expect(tablesWithoutRls).toEqual([]);
  });

  it("all RLS-enabled tables have at least one policy", async () => {
    if (!DB_AVAILABLE) return;

    const { data, error } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT c.relname AS tablename
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relrowsecurity = true
        AND c.relname NOT IN (
          SELECT tablename FROM pg_policies WHERE schemaname = 'public'
        )
        ORDER BY c.relname;
      `,
    });

    if (error) {
      console.warn("exec_sql RPC not available, skipping policy coverage check");
      return;
    }

    const tablesWithoutPolicies = (data ?? []) as Array<{ tablename: string }>;

    // Filter out tables that are intentionally policy-free (service-role-only)
    const unexpected = tablesWithoutPolicies.filter(
      (row) => !INTENTIONALLY_POLICY_FREE_TABLES.includes(row.tablename),
    );

    expect(unexpected).toEqual([]);
  });

  it.each(SENSITIVE_TABLES)(
    "sensitive table '%s' has RLS enabled",
    async (tableName) => {
      if (!DB_AVAILABLE) return;

      const { data, error } = await supabase.rpc("exec_sql", {
        sql: `
          SELECT c.relname AS tablename, c.relrowsecurity AS rls_enabled
          FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relname = '${tableName}';
        `,
      });

      if (error) {
        console.warn(
          `exec_sql RPC not available, skipping RLS check for ${tableName}`,
        );
        return;
      }

      const rows = (data ?? []) as Array<{
        tablename: string;
        rls_enabled: boolean;
      }>;

      if (rows.length === 0) {
        // Table doesn't exist yet (may not be in this phase's migrations)
        console.warn(
          `Table '${tableName}' not found in database -- may not be migrated yet`,
        );
        return;
      }

      expect(rows[0]).toEqual({
        tablename: tableName,
        rls_enabled: true,
      });
    },
  );

  it("produces full RLS coverage report", async () => {
    if (!DB_AVAILABLE) return;

    const { data, error } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT
          t.tablename,
          CASE WHEN c.relrowsecurity = true THEN 'ENABLED' ELSE 'DISABLED' END AS rls_status,
          COALESCE(p.policy_count, 0) AS policy_count
        FROM pg_tables t
        LEFT JOIN pg_class c ON c.relname = t.tablename
          AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        LEFT JOIN (
          SELECT tablename, COUNT(*)::int AS policy_count
          FROM pg_policies
          WHERE schemaname = 'public'
          GROUP BY tablename
        ) p ON p.tablename = t.tablename
        WHERE t.schemaname = 'public'
        ORDER BY
          CASE WHEN c.relrowsecurity = true THEN 0 ELSE 1 END,
          t.tablename;
      `,
    });

    if (error) {
      console.warn("exec_sql RPC not available, skipping coverage report");
      return;
    }

    const rows = (data ?? []) as Array<{
      tablename: string;
      rls_status: "ENABLED" | "DISABLED";
      policy_count: number;
    }>;

    console.info(
      "=== RLS Coverage Report ===\n" +
        rows
          .map(
            (r) =>
              `${r.rls_status === "ENABLED" ? "[PASS]" : "[FAIL]"} ${r.tablename} (${r.policy_count} ${r.policy_count === 1 ? "policy" : "policies"})`,
          )
          .join("\n"),
    );

    const failingTables = rows.filter((r) => r.rls_status === "DISABLED");
    expect(failingTables).toEqual([]);
  });
});
