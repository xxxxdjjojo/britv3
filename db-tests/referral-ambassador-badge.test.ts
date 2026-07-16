import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { applyPrerequisites, startPostgres, type DbHarness } from "./harness";

const DIR = fileURLToPath(new URL("../supabase/migrations", import.meta.url));
function migration(suffix: string): string {
  const matches = readdirSync(DIR).filter((name) => name.endsWith(`_${suffix}.sql`));
  if (matches.length !== 1) throw new Error(`Expected one ${suffix} migration, found ${matches.length}`);
  return `${DIR}/${matches[0]}`;
}

const REFERRER = "70000000-0000-4000-8000-000000000001";
const PREREQ = `
create type public.user_role as enum ('homebuyer','renter','seller','landlord','agent','service_provider');
create type public.provider_verification_status as enum ('unverified','pending','verified','suspended','rejected');
create type public.referral_status as enum ('pending','rewarded');
create type public.referral_track as enum ('trade_to_trade','trade_to_homeowner');
alter table public.profiles add column active_role public.user_role not null default 'homebuyer',
  add column provider_verification_status public.provider_verification_status not null default 'unverified',
  add column created_at timestamptz not null default now(), add column deleted_at timestamptz;
create table public.service_provider_details(user_id uuid primary key references public.profiles(id),
  business_name text not null default 'Provider', slug text not null unique, created_at timestamptz default now());
create table public.provider_references(id uuid primary key default gen_random_uuid(), provider_id uuid references public.profiles(id));
create table public.provider_referrals(id uuid primary key default gen_random_uuid(), referrer_id uuid references auth.users(id));
create table public.referrals(id uuid primary key default gen_random_uuid(), referrer_id uuid not null references auth.users(id),
  referred_id uuid references auth.users(id), referral_code text not null, track public.referral_track default 'trade_to_trade',
  status public.referral_status default 'pending', referred_name text, created_at timestamptz default now(), converted_at timestamptz,
  unique(referred_id));
create table public.provider_badges(id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_provider_details(user_id), badge_type text not null,
  badge_label text not null, description text, earned_at timestamptz not null default now(),
  expires_at timestamptz, is_active boolean not null default true);
alter table public.provider_badges enable row level security;
create policy provider_badges_insert_own on public.provider_badges for insert to authenticated
  with check ((select auth.uid()) = provider_id);
create policy provider_badges_update_own on public.provider_badges for update to authenticated
  using ((select auth.uid()) = provider_id) with check ((select auth.uid()) = provider_id);
grant select,insert,update,delete on public.provider_badges to authenticated;
`;

let db: DbHarness;

describe.skipIf(!process.env.RUN_DB_TESTS)("service-owned referral Ambassador badge", () => {
  beforeAll(() => {
    db = startPostgres();
    applyPrerequisites(db);
    db.sql(PREREQ);
    db.sql(`insert into auth.users(id,email) values ('${REFERRER}','referrer@example.test');
      insert into public.profiles(id,active_role) values ('${REFERRER}','service_provider');
      insert into public.service_provider_details(user_id,slug) values ('${REFERRER}','ambassador');`);
    db.sqlFile(migration("vouch_referral_canonical_schema"));
    db.sqlFile(migration("vouch_referral_contract_corrections"));
    db.sqlFile(migration("referral_ambassador_badge"));
  });

  afterAll(() => db?.stop());

  it("awards exactly one Ambassador badge after three provider conversions", () => {
    for (let index = 0; index < 3; index += 1) {
      db.sql(`insert into public.referrals(referrer_id,referral_code,provider_state)
        values ('${REFERRER}','CODE-${index}','converted');`);
    }
    expect(db.sql(`select badge_type || ':' || badge_label || ':' || is_active
      from public.provider_badges where provider_id='${REFERRER}';`)).toBe("referral_ambassador:Ambassador:true");
    expect(db.sql(`select count(*) from public.provider_badges
      where provider_id='${REFERRER}' and badge_type='referral_ambassador';`)).toBe("1");
  });

  it("prevents authenticated providers from self-awarding the Ambassador badge", () => {
    expect(db.sql(`select has_table_privilege('authenticated','public.provider_badges','INSERT');`)).toBe("f");
    expect(db.sql(`select has_table_privilege('service_role','public.provider_badges','INSERT');`)).toBe("t");
  });
});
