/**
 * Contract test for the CH-enforcement trigger on `service_provider_details`.
 *
 * Security (HIGH): PR #64's authoritative gate
 * (`20260619130000_company_verification_authoritative.sql`) attached the
 * `enforce_company_house_verification()` trigger to `agencies` and
 * `service_provider_profiles` — but `service_provider_profiles` does NOT exist.
 * The real provider legal-entity table is `public.service_provider_details`
 * (it carries the `companies_house_*` columns, added by
 * `20260619120000_companies_house_verification.sql`). So providers' trust
 * columns were never server-enforced.
 *
 * A follow-up migration
 * (`*_attach_ch_enforcement_to_service_provider_details.sql`) attaches the same
 * EXISTING function as a BEFORE INSERT OR UPDATE trigger on
 * `service_provider_details`. This test stubs that table (the columns the
 * provider onboarding writes), applies the `…130000` migration to create the
 * function + `company_verifications`, then the new attach migration, and
 * asserts the trust columns are forced from the authoritative record (or NULL)
 * on both INSERT and a subsequent UPDATE.
 *
 * While the attach migration is missing, `beforeAll` fails (ENOENT) on the
 * second `sqlFile` → RED.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { startPostgres, applyPrerequisites, type DbHarness } from "./harness";

const MIGRATIONS_DIR = fileURLToPath(
  new URL("../supabase/migrations", import.meta.url),
);

const AUTHORITATIVE_MIGRATION = join(
  MIGRATIONS_DIR,
  "20260619130000_company_verification_authoritative.sql",
);

/** Resolve the attach migration by suffix so it works regardless of the
 *  14-digit UTC prefix the Supabase CLI stamped. Missing → RED (throws). */
function attachMigrationPath(): string {
  const match = readdirSync(MIGRATIONS_DIR).find((name) =>
    name.endsWith("_attach_ch_enforcement_to_service_provider_details.sql"),
  );
  if (!match) {
    throw new Error(
      "attach_ch_enforcement_to_service_provider_details migration not found",
    );
  }
  return join(MIGRATIONS_DIR, match);
}

const RUN = process.env.RUN_DB_TESTS === "1";
const U1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const U2 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

describe.skipIf(!RUN)("CH enforcement on service_provider_details", () => {
  let h: DbHarness;

  beforeAll(() => {
    h = startPostgres();
    applyPrerequisites(h);
    // service_provider_details PK is user_id (matches the function's non-agencies
    // branch, which keys on new.user_id). Stub the trust columns the provider
    // onboarding clients write.
    h.sql(`
      create table public.service_provider_details (
        user_id uuid primary key references auth.users(id),
        company_number text,
        companies_house_status text,
        companies_house_verified_at timestamptz,
        incorporation_date date
      );
      insert into auth.users (id) values ('${U1}'), ('${U2}');
    `);
    h.sqlFile(AUTHORITATIVE_MIGRATION);
    h.sqlFile(attachMigrationPath());
  });

  afterAll(() => h?.stop());

  it("forces trust fields to NULL on INSERT when there is no authoritative record", () => {
    h.sql(
      `insert into public.service_provider_details
         (user_id, company_number, companies_house_status, companies_house_verified_at, incorporation_date)
       values ('${U1}', '00000000', 'verified', now(), date '1900-01-01');`,
    );
    const row = h.sql(
      `select coalesce(companies_house_status,'<null>') || '|' ||
              coalesce(incorporation_date::text,'<null>') || '|' ||
              coalesce(companies_house_verified_at::text,'<null>')
       from public.service_provider_details where user_id = '${U1}';`,
    );
    expect(row).toBe("<null>|<null>|<null>");
  });

  it("overwrites client-supplied trust fields with the authoritative record on INSERT", () => {
    h.sql(
      `insert into public.company_verifications (user_id, company_number, status, incorporation_date, verified_at)
       values ('${U2}', '12345678', 'verified', date '2010-05-05', timestamptz '2026-01-02 03:04:05+00');`,
    );
    h.sql(
      `insert into public.service_provider_details
         (user_id, company_number, companies_house_status, incorporation_date)
       values ('${U2}', '12345678', 'pending_review', date '1900-01-01');`,
    );
    const row = h.sql(
      `select companies_house_status || '|' || incorporation_date::text
       from public.service_provider_details where user_id = '${U2}';`,
    );
    expect(row).toBe("verified|2010-05-05");
  });

  it("re-enforces on UPDATE (client cannot self-promote an existing row)", () => {
    h.sql(
      `update public.service_provider_details
       set companies_house_status = 'verified', incorporation_date = date '1800-01-01'
       where user_id = '${U2}';`,
    );
    const row = h.sql(
      `select companies_house_status || '|' || incorporation_date::text
       from public.service_provider_details where user_id = '${U2}';`,
    );
    expect(row).toBe("verified|2010-05-05");
  });
});
