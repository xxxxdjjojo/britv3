import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { applyPrerequisites, startPostgres, type DbHarness } from "./harness";

const DIR = fileURLToPath(new URL("../supabase/migrations", import.meta.url));
function migration(suffix: string): string {
  const names = readdirSync(DIR).filter((name) => name.endsWith(`_${suffix}.sql`));
  if (names.length !== 1) throw new Error(`Expected one ${suffix} migration, found ${names.length}`);
  return `${DIR}/${names[0]}`;
}

const TARGET = "20000000-0000-4000-8000-000000000001";
const ELIGIBLE_PEER = "20000000-0000-4000-8000-000000000002";
const INELIGIBLE_PEER = "20000000-0000-4000-8000-000000000003";
const CLIENT = "20000000-0000-4000-8000-000000000004";

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
create table public.provider_referrals(id uuid primary key default gen_random_uuid(), referrer_id uuid references auth.users(id),
  referred_user_id uuid references auth.users(id), referral_code text not null, status text default 'pending', rewarded_at timestamptz, created_at timestamptz default now());
alter table public.provider_referrals enable row level security;
create table public.referrals(id uuid primary key default gen_random_uuid(), referrer_id uuid not null references auth.users(id),
  referred_id uuid references auth.users(id), referral_code text not null, track public.referral_track default 'trade_to_trade',
  status public.referral_status default 'pending', referred_name text, created_at timestamptz default now(), converted_at timestamptz,
  unique(referred_id));
alter table public.referrals enable row level security;
`;

let db: DbHarness;
function request(kind: "peer" | "client", actor: string, email: string): string {
  return db.sql(`insert into public.vouch_requests(provider_id,voucher_kind,voucher_profile_id,invited_email)
    values ('${TARGET}','${kind}','${actor}','${email}') returning id;`);
}

describe.skipIf(!process.env.RUN_DB_TESTS)("atomic vouch acceptance", () => {
  beforeAll(() => {
    db = startPostgres();
    applyPrerequisites(db);
    db.sql(PREREQ);
    for (const [id, role, email, created] of [
      [TARGET, "service_provider", "target@example.test", "now() - interval '30 days'"],
      [ELIGIBLE_PEER, "service_provider", "peer@example.test", "now() - interval '30 days'"],
      [INELIGIBLE_PEER, "service_provider", "newpeer@example.test", "now() - interval '2 days'"],
      [CLIENT, "homebuyer", "client@example.test", "now()"],
    ]) {
      db.sql(`insert into auth.users(id,email,email_confirmed_at) values ('${id}','${email}',now());
        insert into public.profiles(id,active_role,provider_verification_status,created_at)
        values ('${id}','${role}','verified',${created});`);
    }
    db.sql(`insert into public.service_provider_details(user_id,slug) values
      ('${TARGET}','target'),('${ELIGIBLE_PEER}','eligible-peer'),('${INELIGIBLE_PEER}','new-peer');`);
    db.sqlFile(migration("vouch_referral_canonical_schema"));
    db.sqlFile(migration("vouch_acceptance_transitions"));
    db.sqlFile(migration("vouch_referral_contract_corrections"));
  });

  afterAll(() => db?.stop());

  it("accepts an eligible grandfathered peer exactly once", () => {
    const id = request("peer", ELIGIBLE_PEER, "peer@example.test");
    const first = db.sql(`select vouch_id from public.accept_vouch_request('${id}','${ELIGIBLE_PEER}',true);`);
    const second = db.sql(`select vouch_id from public.accept_vouch_request('${id}','${ELIGIBLE_PEER}',true);`);
    expect(second).toBe(first);
    expect(db.sql(`select count(*) from public.vouches where request_id='${id}';`)).toBe("1");
  });

  it("rejects an under-seven-day peer without partially accepting", () => {
    const id = request("peer", INELIGIBLE_PEER, "newpeer@example.test");
    expect(() => db.sql(`select * from public.accept_vouch_request('${id}','${INELIGIBLE_PEER}',false);`))
      .toThrow(/peer_not_eligible/);
    expect(db.sql(`select count(*) from public.vouches where request_id='${id}';`)).toBe("0");
    expect(db.sql(`select status from public.vouch_requests where id='${id}';`)).toBe("pending");
  });

  it("accepts a client immediately only when the authenticated email matches", () => {
    const id = request("client", CLIENT, "client@example.test");
    expect(db.sql(`select outcome from public.accept_vouch_request('${id}','${CLIENT}',true);`)).toBe("accepted");
    const other = "20000000-0000-4000-8000-000000000005";
    db.sql(`insert into auth.users(id,email,email_confirmed_at) values ('${other}','other@example.test',now());
      insert into public.profiles(id,active_role) values ('${other}','homebuyer');`);
    const mismatch = request("client", other, "invited@example.test");
    expect(() => db.sql(`select * from public.accept_vouch_request('${mismatch}','${other}',false);`))
      .toThrow(/invited_email_mismatch/);
  });

  it("atomically claims a client invite only after confirmed-email proof", () => {
    const unconfirmed = "20000000-0000-4000-8000-000000000009";
    db.sql(`insert into auth.users(id,email) values ('${unconfirmed}','claim@example.test');
      insert into public.profiles(id,active_role) values ('${unconfirmed}','homebuyer');`);
    const id = db.sql(`insert into public.vouch_requests(provider_id,voucher_kind,invited_email)
      values ('${TARGET}','client','claim@example.test') returning id;`);
    expect(() => db.sql(`select * from public.accept_vouch_request('${id}','${unconfirmed}',false);`))
      .toThrow(/confirmed_email_required/);
    expect(db.sql(`select voucher_profile_id is null from public.vouch_requests where id='${id}';`)).toBe("t");

    db.sql(`update auth.users set email_confirmed_at=now() where id='${unconfirmed}';`);
    expect(db.sql(`select outcome from public.accept_vouch_request('${id}','${unconfirmed}',false);`)).toBe("accepted");
    expect(db.sql(`select voucher_profile_id='${unconfirmed}' from public.vouch_requests where id='${id}';`)).toBe("t");
  });

  it("persists expiry as a terminal transition", () => {
    const id = db.sql(`insert into public.vouch_requests(provider_id,voucher_kind,voucher_profile_id,invited_email,expires_at)
      values ('${TARGET}','client','${CLIENT}','client@example.test',now()-interval '1 second') returning id;`);
    expect(db.sql(`select outcome from public.accept_vouch_request('${id}','${CLIENT}',false);`)).toBe("expired");
    expect(db.sql(`select status from public.vouch_requests where id='${id}';`)).toBe("expired");
    expect(db.sql(`select count(*) from public.vouches where request_id='${id}';`)).toBe("0");
  });

  it("binds a confirmed invited-email actor when declining", () => {
    const actor = "20000000-0000-4000-8000-00000000000a";
    db.sql(`insert into auth.users(id,email,email_confirmed_at)
      values ('${actor}','decliner@example.test',now());
      insert into public.profiles(id,active_role) values ('${actor}','homebuyer');`);
    const id = db.sql(`insert into public.vouch_requests(provider_id,voucher_kind,invited_email)
      values ('${TARGET}','client','decliner@example.test') returning id;`);
    expect(db.sql(`select public.decline_vouch_request('${id}','${actor}');`)).toBe("t");
    expect(db.sql(`select status || ':' || (voucher_profile_id='${actor}')::text
      from public.vouch_requests where id='${id}';`)).toBe("declined:true");
  });

  it("flags a reciprocal peer vouch within 90 days without blocking it", () => {
    expect(db.sql(`select count(*) from public.vouches
      where provider_id='${TARGET}' and voucher_profile_id='${ELIGIBLE_PEER}' and revoked_at is null;`)).toBe("1");
    const reciprocalRequest = db.sql(`insert into public.vouch_requests(provider_id,voucher_kind,voucher_profile_id,invited_email)
      values ('${ELIGIBLE_PEER}','peer','${TARGET}','target@example.test') returning id;`);
    expect(db.sql(`select outcome from public.accept_vouch_request('${reciprocalRequest}','${TARGET}',false);`)).toBe("accepted");
    expect(db.sql(`select count(*) from public.fraud_flags where vouch_request_id='${reciprocalRequest}' and flag_type='reciprocal_vouch';`)).toBe("1");
    expect(db.sql(`select count(*) from public.vouches where request_id='${reciprocalRequest}';`)).toBe("1");
    expect(db.sql(`select status from public.vouch_requests where id='${reciprocalRequest}';`)).toBe("accepted");
  });

  it("ignores reverse vouches older than 90 days", () => {
    const provider = "20000000-0000-4000-8000-000000000006";
    const peer = "20000000-0000-4000-8000-000000000007";
    for (const [id, email] of [[provider, "old-provider@example.test"], [peer, "old-peer@example.test"]]) {
      db.sql(`insert into auth.users(id,email,email_confirmed_at) values ('${id}','${email}',now());
        insert into public.profiles(id,active_role,provider_verification_status,created_at)
          values ('${id}','service_provider','verified',now()-interval '30 days');
        insert into public.service_provider_details(user_id,slug,vouch_gate_grandfathered_at)
          values ('${id}','old-${id.slice(-1)}',now());`);
    }
    const oldRequest = db.sql(`insert into public.vouch_requests(provider_id,voucher_kind,voucher_profile_id,invited_email)
      values ('${provider}','peer','${peer}','old-peer@example.test') returning id;`);
    db.sql(`insert into public.vouches(request_id,provider_id,voucher_kind,voucher_profile_id,accepted_at)
      values ('${oldRequest}','${provider}','peer','${peer}',now()-interval '91 days');
      update public.vouch_requests set status='accepted',responded_at=now()-interval '91 days' where id='${oldRequest}';`);
    const current = db.sql(`insert into public.vouch_requests(provider_id,voucher_kind,voucher_profile_id,invited_email)
      values ('${peer}','peer','${provider}','old-provider@example.test') returning id;`);
    expect(db.sql(`select outcome from public.accept_vouch_request('${current}','${provider}',false);`)).toBe("accepted");
    expect(db.sql(`select count(*) from public.fraud_flags where vouch_request_id='${current}';`)).toBe("0");
  });

  it("requires an authenticated voucher and one active provider-voucher pair", () => {
    expect(() => db.sql(`insert into public.vouches(request_id,provider_id,voucher_kind,voucher_profile_id)
      values (gen_random_uuid(),'${TARGET}','client',null);`)).toThrow();

    const duplicateKind = db.sql(`insert into public.vouch_requests(provider_id,voucher_kind,voucher_profile_id,invited_email)
      values ('${TARGET}','client','${ELIGIBLE_PEER}','peer@example.test') returning id;`);
    expect(() => db.sql(`select * from public.accept_vouch_request('${duplicateKind}','${ELIGIBLE_PEER}',false);`))
      .toThrow(/vouches_one_active_pair/);
  });

  it("lets an authenticated voucher read the vouch they supplied", () => {
    const count = db.sql(`begin;
      set local role authenticated;
      set local request.jwt.claims = '{"sub":"${ELIGIBLE_PEER}"}';
      select count(*) from public.vouches where voucher_profile_id='${ELIGIBLE_PEER}';
      commit;`).split("\n")[0];
    expect(Number(count)).toBeGreaterThan(0);
  });

  it("exposes transition RPCs only to service_role", () => {
    expect(db.sql(`select has_function_privilege('authenticated','public.accept_vouch_request(uuid,uuid,boolean)','EXECUTE');`)).toBe("f");
    expect(db.sql(`select has_function_privilege('service_role','public.accept_vouch_request(uuid,uuid,boolean)','EXECUTE');`)).toBe("t");
    expect(db.sql(`select has_function_privilege('anon','public.decline_vouch_request(uuid,uuid)','EXECUTE');`)).toBe("f");
  });

  it("preserves evidence when a request is declined and an accepted vouch is revoked", () => {
    const revokingClient = "20000000-0000-4000-8000-000000000008";
    db.sql(`insert into auth.users(id,email,email_confirmed_at) values ('${revokingClient}','revoker@example.test',now());
      insert into public.profiles(id,active_role) values ('${revokingClient}','homebuyer');`);
    const declineId = request("client", revokingClient, "revoker@example.test");
    expect(db.sql(`select public.decline_vouch_request('${declineId}','${revokingClient}');`)).toBe("t");
    expect(db.sql(`select status from public.vouch_requests where id='${declineId}';`)).toBe("declined");

    const acceptedId = request("client", revokingClient, "revoker@example.test");
    const vouchId = db.sql(`select vouch_id from public.accept_vouch_request('${acceptedId}','${revokingClient}',false);`);
    expect(db.sql(`select public.revoke_vouch('${vouchId}','${TARGET}');`)).toBe("t");
    expect(db.sql(`select status from public.vouch_requests where id='${acceptedId}';`)).toBe("revoked");
    expect(db.sql(`select revoked_at is not null from public.vouches where id='${vouchId}';`)).toBe("t");
  });
});
