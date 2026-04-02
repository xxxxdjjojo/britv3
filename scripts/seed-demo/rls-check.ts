/**
 * Seed Demo — RLS Visibility Validation
 *
 * Signs in as each demo user with a user-scoped Supabase client (NOT admin)
 * and verifies that RLS policies allow them to see their own seeded data.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_USERS, DEMO_PASSWORD } from "./config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RLSCheckResult {
  user: string;
  role: string;
  table: string;
  expected: number;
  actual: number;
  pass: boolean;
  error?: string;
}

export interface RLSCheckSummary {
  passed: number;
  failed: number;
  results: RLSCheckResult[];
}

// ---------------------------------------------------------------------------
// Per-Role Table Expectations
// ---------------------------------------------------------------------------

interface RoleCheck {
  table: string;
  minExpected: number;
  /** Optional filter to apply as .eq(column, value) */
  filter?: { column: string; userIdField: "id" };
  /** Optional select expression */
  select?: string;
}

function getChecksForRole(
  role: string,
  userId: string,
  isAdmin: boolean,
): RoleCheck[] {
  if (isAdmin) {
    return [
      { table: "profiles", minExpected: 7 },
    ];
  }

  switch (role) {
    case "homebuyer":
      return [
        { table: "saved_properties", minExpected: 8 },
      ];

    case "renter":
      return [
        { table: "tenant_applications", minExpected: 3 },
      ];

    case "seller":
      return [
        { table: "seller_listings", minExpected: 2 },
      ];

    case "landlord":
      return [
        {
          table: "tenancies",
          minExpected: 3,
          filter: { column: "landlord_id", userIdField: "id" },
        },
      ];

    case "agent":
      return [
        {
          table: "agent_leads",
          minExpected: 20,
          filter: { column: "agent_id", userIdField: "id" },
        },
      ];

    case "service_provider":
      return [
        { table: "service_requests", minExpected: 1 },
        { table: "bookings", minExpected: 1 },
      ];

    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// User-scoped Client
// ---------------------------------------------------------------------------

function createUserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ---------------------------------------------------------------------------
// Main Check
// ---------------------------------------------------------------------------

export async function checkRLS(): Promise<RLSCheckSummary> {
  const results: RLSCheckResult[] = [];

  const users = Object.entries(DEMO_USERS).map(([key, u]) => ({
    key,
    ...u,
    isAdmin: "isAdmin" in u && u.isAdmin === true,
  }));

  for (const user of users) {
    const displayRole = user.isAdmin ? "admin" : user.role;
    console.log(`\n  Checking RLS for ${user.name} (${displayRole})...`);

    // Create a fresh client and sign in as this user
    const client = createUserClient();

    const { error: authError } = await client.auth.signInWithPassword({
      email: user.email,
      password: DEMO_PASSWORD,
    });

    if (authError) {
      console.error(`    FAIL: Could not sign in — ${authError.message}`);
      results.push({
        user: user.name,
        role: displayRole,
        table: "(auth)",
        expected: 0,
        actual: 0,
        pass: false,
        error: `Sign-in failed: ${authError.message}`,
      });
      continue;
    }

    const checks = getChecksForRole(user.role, user.id, user.isAdmin);

    for (const check of checks) {
      try {
        let query = client
          .from(check.table)
          .select(check.select ?? "id", { count: "exact", head: true });

        if (check.filter) {
          query = query.eq(check.filter.column, user.id);
        }

        const { count, error: queryError } = await query;

        if (queryError) {
          console.error(`    FAIL: ${check.table} — ${queryError.message}`);
          results.push({
            user: user.name,
            role: displayRole,
            table: check.table,
            expected: check.minExpected,
            actual: 0,
            pass: false,
            error: queryError.message,
          });
          continue;
        }

        const actual = count ?? 0;
        const pass = actual >= check.minExpected;
        const icon = pass ? "PASS" : "FAIL";
        console.log(
          `    ${icon}: ${check.table} — ${actual} rows (expected >= ${check.minExpected})`,
        );

        results.push({
          user: user.name,
          role: displayRole,
          table: check.table,
          expected: check.minExpected,
          actual,
          pass,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`    FAIL: ${check.table} — ${msg}`);
        results.push({
          user: user.name,
          role: displayRole,
          table: check.table,
          expected: check.minExpected,
          actual: 0,
          pass: false,
          error: msg,
        });
      }
    }

    // Sign out to clean up
    await client.auth.signOut();
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;

  console.log(`\n  RLS Check Summary: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error("\n  CRITICAL: Some users cannot see their own data through RLS.");
    for (const r of results.filter((r) => !r.pass)) {
      console.error(`    - ${r.user} (${r.role}): ${r.table} — got ${r.actual}, expected >= ${r.expected}${r.error ? ` [${r.error}]` : ""}`);
    }
  }

  return { passed, failed, results };
}
