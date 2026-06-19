/**
 * RED-phase contract test for
 * `supabase/migrations/20260619130000_company_verification_authoritative.sql`.
 *
 * Security (HIGH): the Companies House trust fields
 * (companies_house_status / companies_house_verified_at / incorporation_date)
 * on `agencies` + `service_provider_profiles` must NOT be settable by the
 * browser. The migration adds `company_verifications` (written only by the
 * server, via the service-role client in /api/verification/company) plus
 * BEFORE INSERT/UPDATE triggers that overwrite those columns from the
 * authoritative record — or force them NULL when no record exists.
 *
 * `agencies` / `service_provider_profiles` are provisioned outside the
 * migration set (that is why 20260619120000 uses `ALTER TABLE IF EXISTS`), so
 * this test stubs them with the columns the onboarding clients write, then
 * applies the migration on top.
 *
 * The migration does not exist yet → `beforeAll` fails (ENOENT) on sqlFile.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { startPostgres, applyPrerequisites, type DbHarness } from "./harness";

const MIGRATION_PATH = fileURLToPath(
  new URL(
    "../supabase/migrations/20260619130000_company_verification_authoritative.sql",
    import.meta.url,
  ),
);

const RUN = process.env.RUN_DB_TESTS === "1";
const U1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const U2 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

describe.skipIf(!RUN)("company_verifications authoritative trigger", () => {
  let h: DbHarness;

  beforeAll(() => {
    h = startPostgres();
    applyPrerequisites(h);
    h.sql(`
      create table public.agencies (
        id uuid primary key default gen_random_uuid(),
        owner_id uuid references auth.users(id),
        name text,
        company_number text,
        companies_house_status text,
        companies_house_verified_at timestamptz,
        incorporation_date date
      );
      create table public.service_provider_profiles (
        user_id uuid primary key references auth.users(id),
        company_number text,
        companies_house_status text,
        companies_house_verified_at timestamptz,
        incorporation_date date
      );
      insert into auth.users (id) values ('${U1}'), ('${U2}');
    `);
    h.sqlFile(MIGRATION_PATH);
  });

  afterAll(() => h?.stop());

  it("forces trust fields to NULL when the user has no authoritative verification", () => {
    h.sql(
      `insert into public.agencies (owner_id, name, company_number, companies_house_status, companies_house_verified_at, incorporation_date)
       values ('${U1}', 'Hacker Estates', '00000000', 'verified', now(), date '1900-01-01');`,
    );
    const row = h.sql(
      `select coalesce(companies_house_status,'<null>') || '|' ||
              coalesce(incorporation_date::text,'<null>') || '|' ||
              coalesce(companies_house_verified_at::text,'<null>')
       from public.agencies where owner_id = '${U1}';`,
    );
    expect(row).toBe("<null>|<null>|<null>");
  });

  it("overwrites client-supplied trust fields with the authoritative record", () => {
    h.sql(
      `insert into public.company_verifications (user_id, company_number, status, incorporation_date, verified_at)
       values ('${U2}', '12345678', 'verified', date '2010-05-05', timestamptz '2026-01-02 03:04:05+00');`,
    );
    h.sql(
      `insert into public.agencies (owner_id, name, company_number, companies_house_status, incorporation_date)
       values ('${U2}', 'Legit Estates', '12345678', 'pending_review', date '1900-01-01');`,
    );
    const row = h.sql(
      `select companies_house_status || '|' || incorporation_date::text
       from public.agencies where owner_id = '${U2}';`,
    );
    expect(row).toBe("verified|2010-05-05");
  });

  it("re-enforces on UPDATE (client cannot self-promote an existing row)", () => {
    h.sql(
      `update public.agencies
       set companies_house_status = 'verified', incorporation_date = date '1800-01-01'
       where owner_id = '${U2}';`,
    );
    const row = h.sql(
      `select incorporation_date::text from public.agencies where owner_id = '${U2}';`,
    );
    expect(row).toBe("2010-05-05");
  });

  it("enforces the same on service_provider_profiles", () => {
    h.sql(
      `insert into public.service_provider_profiles (user_id, company_number, companies_house_status, incorporation_date)
       values ('${U1}', '99999999', 'verified', date '1700-01-01');`,
    );
    const row = h.sql(
      `select coalesce(companies_house_status,'<null>') || '|' || coalesce(incorporation_date::text,'<null>')
       from public.service_provider_profiles where user_id = '${U1}';`,
    );
    expect(row).toBe("<null>|<null>");
  });

  it("blocks authenticated clients from writing company_verifications directly (RLS)", () => {
    expect(() =>
      h.sql(
        `set role authenticated;
         insert into public.company_verifications (user_id, company_number, status)
         values ('${U1}', '1', 'verified');`,
      ),
    ).toThrow();
  });
});
