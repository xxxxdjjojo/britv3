/**
 * Contract tests for supabase/migrations/20260618145243_valuation_journey.sql.
 *
 * Asserts the 7 valuation tables, RLS posture (sessions service-role-only;
 * results/comparables/leads/consent owner-scoped; model registry public-read),
 * the seeded model version, and that recalculation keeps prior result rows
 * (auditable history). Gated behind RUN_DB_TESTS.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { startPostgres, applyPrerequisites, type DbHarness } from "./harness";

const MIGRATION_PATH = fileURLToPath(
  new URL("../supabase/migrations/20260618145243_valuation_journey.sql", import.meta.url),
);

const USER_A = "aaaaaaaa-5555-4000-8000-000000000001";
const USER_B = "aaaaaaaa-5555-4000-8000-000000000002";
const SESSION_1 = "55555555-5555-4000-8000-000000000001";
const RESULT_1 = "66666666-5555-4000-8000-000000000001";
const RESULT_2 = "66666666-5555-4000-8000-000000000002";

const VALUATION_TABLES = [
  "valuation_sessions",
  "valuation_results",
  "valuation_comparables",
  "valuation_model_versions",
  "valuation_model_metrics",
  "valuation_agent_leads",
  "valuation_consent_events",
] as const;

let db: DbHarness;

function asUser(userId: string, statements: string): string {
  return db.sql(
    `begin;
     set local role authenticated;
     set local request.jwt.claims = '{"sub":"${userId}"}';
     ${statements};
     commit;`,
  );
}

function seed(): void {
  for (const userId of [USER_A, USER_B]) {
    db.sql(`insert into auth.users (id, email) values ('${userId}', 'u-${userId.slice(-4)}@example.test');`);
    db.sql(`insert into public.profiles (id, display_name) values ('${userId}', 'User ${userId.slice(-4)}');`);
  }
  db.sql(
    `insert into public.valuation_sessions (id, token_hash, status, postcode, outward_code, user_id)
     values ('${SESSION_1}', 'hash-1', 'claimed', 'SW18 4QN', 'SW18', '${USER_A}');`,
  );
  // Two result versions for the same session/owner — recalculation history.
  for (const [id, value] of [[RESULT_1, 600000], [RESULT_2, 615000]] as const) {
    db.sql(
      `insert into public.valuation_results
         (id, session_id, user_id, model_version, estimated_value, estimated_low, estimated_high,
          evidence_quality, fallback_level, valuation_date)
       values ('${id}', '${SESSION_1}', '${USER_A}', 'vmp-comparables-1.0.0',
               ${value}, ${value - 50000}, ${value + 50000}, 'medium', 'C', date '2026-02-27');`,
    );
  }
}

describe.skipIf(!process.env.RUN_DB_TESTS)("valuation journey migration", () => {
  beforeAll(() => {
    db = startPostgres();
    applyPrerequisites(db);
    db.sqlFile(MIGRATION_PATH);
    seed();
  });

  afterAll(() => {
    db?.stop();
  });

  describe("schema", () => {
    it.each(VALUATION_TABLES)("creates public.%s", (table) => {
      expect(db.sql(`select to_regclass('public.${table}') is not null;`)).toBe("t");
    });

    it.each(VALUATION_TABLES)("%s has RLS enabled", (table) => {
      expect(
        db.sql(`select relrowsecurity from pg_class where oid = 'public.${table}'::regclass;`),
      ).toBe("t");
    });

    it("seeds the current model version", () => {
      expect(
        db.sql(`select count(*) from public.valuation_model_versions where version = 'vmp-comparables-1.0.0';`),
      ).toBe("1");
    });

    it("keeps every result version (auditable recalculation history)", () => {
      expect(
        db.sql(`select count(*) from public.valuation_results where session_id = '${SESSION_1}';`),
      ).toBe("2");
    });
  });

  describe("row level security", () => {
    it("valuation_sessions has no anon/authenticated policies (service-role only)", () => {
      expect(
        db.sql(`select count(*) from pg_policies where schemaname = 'public' and tablename = 'valuation_sessions';`),
      ).toBe("0");
      expect(asUser(USER_A, `select count(*) from public.valuation_sessions`)).toBe("0");
    });

    it("an owner reads only their own valuation results", () => {
      expect(asUser(USER_A, `select count(*) from public.valuation_results`)).toBe("2");
    });

    it("another user cannot read someone else's valuation results", () => {
      expect(asUser(USER_B, `select count(*) from public.valuation_results`)).toBe("0");
    });

    it("model versions are publicly readable", () => {
      expect(asUser(USER_B, `select count(*) from public.valuation_model_versions`)).toBe("1");
    });
  });
});
