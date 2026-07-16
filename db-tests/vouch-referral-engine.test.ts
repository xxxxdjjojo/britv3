import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { applyPrerequisites, startPostgres, type DbHarness } from "./harness";

const MIGRATIONS_DIR = fileURLToPath(
  new URL("../supabase/migrations", import.meta.url),
);

function migrationPath(suffix: string): string {
  const matches = readdirSync(MIGRATIONS_DIR).filter((name) =>
    name.endsWith(`_${suffix}.sql`),
  );
  if (matches.length !== 1) {
    throw new Error(`Expected one ${suffix} migration, found ${matches.length}`);
  }
  return `${MIGRATIONS_DIR}/${matches[0]}`;
}

const PREREQUISITES_SQL = `
create type public.user_role as enum ('homebuyer', 'renter', 'seller', 'landlord', 'agent', 'service_provider');
create type public.provider_verification_status as enum ('unverified', 'pending', 'verified', 'suspended', 'rejected');
create type public.referral_status as enum ('pending', 'rewarded');
create type public.referral_track as enum ('trade_to_trade', 'trade_to_homeowner');

alter table public.profiles
  add column active_role public.user_role not null default 'homebuyer',
  add column provider_verification_status public.provider_verification_status not null default 'unverified',
  add column created_at timestamptz not null default now(),
  add column deleted_at timestamptz;

create table public.service_provider_details (
  user_id uuid primary key references public.profiles(id),
  business_name text not null default 'Test provider',
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.provider_references (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id)
);
alter table public.provider_references enable row level security;
grant select on public.provider_references to authenticated;

create table public.provider_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id),
  referred_user_id uuid references auth.users(id),
  referral_code text not null,
  status text not null default 'pending',
  rewarded_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.provider_referrals enable row level security;
create policy provider_referrals_insert_own on public.provider_referrals
  for insert to authenticated with check ((select auth.uid()) = referrer_id);
create policy provider_referrals_update_own on public.provider_referrals
  for update to authenticated using ((select auth.uid()) = referrer_id)
  with check ((select auth.uid()) = referrer_id);
grant select, insert, update, delete on public.provider_referrals to authenticated;

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id),
  referred_id uuid references auth.users(id),
  referral_code text not null,
  track public.referral_track not null default 'trade_to_trade',
  status public.referral_status not null default 'pending',
  referred_name text,
  created_at timestamptz not null default now(),
  converted_at timestamptz,
  constraint unique_referred_id unique (referred_id)
);
alter table public.referrals enable row level security;
create policy referrals_insert_own on public.referrals
  for insert to authenticated with check ((select auth.uid()) = referrer_id);
grant select, insert on public.referrals to authenticated;
`;

let db: DbHarness;
const VERIFIED_AT_MIGRATION = "10000000-0000-4000-8000-000000000001";
const PENDING_AT_MIGRATION = "10000000-0000-4000-8000-000000000002";

describe.skipIf(!process.env.RUN_DB_TESTS)("canonical vouch and referral schema", () => {
  beforeAll(() => {
    db = startPostgres();
    applyPrerequisites(db);
    db.sql(PREREQUISITES_SQL);
    for (const [id, status] of [
      [VERIFIED_AT_MIGRATION, "verified"],
      [PENDING_AT_MIGRATION, "pending"],
    ]) {
      db.sql(`insert into auth.users(id,email) values ('${id}','${id}@example.test');
        insert into public.profiles(id,active_role,provider_verification_status)
          values ('${id}','service_provider','${status}');
        insert into public.service_provider_details(user_id,slug)
          values ('${id}','provider-${id.slice(-1)}');`);
    }
    db.sqlFile(migrationPath("vouch_referral_canonical_schema"));
  });

  afterAll(() => db?.stop());

  it("creates the four canonical ledgers with RLS enabled", () => {
    expect(
      db.sql(`select string_agg(c.relname, ',' order by c.relname)
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname in ('fraud_flags','referral_credits','vouch_requests','vouches')
          and c.relrowsecurity;`),
    ).toBe("fraud_flags,referral_credits,vouch_requests,vouches");
  });

  it("grandfathers only providers verified when the migration executes", () => {
    expect(db.sql(`select vouch_gate_grandfathered_at is not null
      from public.service_provider_details where user_id = '${VERIFIED_AT_MIGRATION}';`)).toBe("t");
    expect(db.sql(`select vouch_gate_grandfathered_at is null
      from public.service_provider_details where user_id = '${PENDING_AT_MIGRATION}';`)).toBe("t");
  });

  it("extends provider referrals without rewriting legacy states or tracks", () => {
    expect(db.sql(`select enum_range(null::public.referral_status)::text;`)).toBe(
      "{pending,rewarded,invited,signed_up,gate_complete,converted,credited}",
    );
    expect(db.sql(`select count(*) from information_schema.columns
      where table_schema='public' and table_name='referrals'
        and column_name in ('invite_token','provider_state','invited_email');`)).toBe("3");
  });

  it("exposes only owner reads and service writes", () => {
    expect(db.sql(`select has_table_privilege('authenticated','public.vouch_requests','INSERT');`)).toBe("f");
    expect(db.sql(`select has_table_privilege('authenticated','public.vouches','INSERT');`)).toBe("f");
    expect(db.sql(`select has_table_privilege('service_role','public.vouch_requests','INSERT');`)).toBe("t");
    expect(db.sql(`select has_table_privilege('authenticated','public.provider_referrals','UPDATE');`)).toBe("f");
    expect(db.sql(`select has_table_privilege('authenticated','public.provider_references','INSERT');`)).toBe("f");
  });

  it("derives a provider's peer and client progress", () => {
    const provider = "10000000-0000-4000-8000-000000000003";
    db.sql(`insert into auth.users(id,email) values ('${provider}','provider@example.test');
      insert into public.profiles(id,active_role,provider_verification_status)
        values ('${provider}','service_provider','pending');
      insert into public.service_provider_details(user_id,slug)
        values ('${provider}','progress-provider');`);
    expect(db.sql(`select peer_count || ':' || client_count || ':' || gate_complete
      from public.vouch_gate_status('${provider}');`)).toBe("0:0:false");
  });
});
