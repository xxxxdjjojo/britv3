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

const REFERRER = "30000000-0000-4000-8000-000000000001";
const REFERRED = "30000000-0000-4000-8000-000000000002";
const OTHER = "30000000-0000-4000-8000-000000000003";
const SQUATTED = "30000000-0000-4000-8000-000000000005";

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
create table public.referral_codes_v2(id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id),
  code text not null unique, created_at timestamptz not null default now());
create table public.subscriptions(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
  stripe_subscription_id text, stripe_customer_id text, status text default 'active', plan_name text,
  price_amount integer, currency text default 'gbp', role text, created_at timestamptz default now(), updated_at timestamptz default now());
`;

let db: DbHarness;
function createReferral(
  state: string,
  referredId: string | null = null,
  referrerId: string = REFERRER,
): string {
  return db.sql(`insert into public.referrals(referrer_id,referred_id,referral_code,invite_token,invited_email,provider_state)
    values ('${referrerId}',${referredId ? `'${referredId}'` : "null"},'CODE-${crypto.randomUUID()}',gen_random_uuid(),
      '${crypto.randomUUID()}@example.test','${state}') returning id;`);
}

describe.skipIf(!process.env.RUN_DB_TESTS)("transactional provider referral credits", () => {
  beforeAll(() => {
    db = startPostgres();
    applyPrerequisites(db);
    db.sql(PREREQ);
    for (const [id, email] of [[REFERRER, "referrer@example.test"], [REFERRED, "referred@example.test"], [OTHER, "other@example.test"]]) {
      db.sql(`insert into auth.users(id,email) values ('${id}','${email}');
        insert into public.profiles(id,active_role) values ('${id}','service_provider');`);
    }
    db.sql(`insert into auth.users(id,email) values ('${SQUATTED}','squatted@example.test');
      insert into public.profiles(id,active_role) values ('${SQUATTED}','service_provider');`);
    db.sqlFile(migration("vouch_referral_canonical_schema"));
    db.sqlFile(migration("referral_credit_transactions"));
    db.sqlFile(migration("vouch_referral_contract_corrections"));
    db.sqlFile(migration("durable_referral_credit_application"));
    db.sqlFile(migration("referral_credit_billing_snapshot"));
  });

  afterAll(() => db?.stop());

  it("advances provider referrals forward and binds signup once", () => {
    const id = createReferral("invited");
    expect(db.sql(`select public.advance_provider_referral('${id}','${REFERRED}','signed_up');`)).toBe("signed_up");
    expect(db.sql(`select public.advance_provider_referral('${id}','${REFERRED}','gate_complete');`)).toBe("gate_complete");
    expect(db.sql(`select public.advance_provider_referral('${id}','${REFERRED}','converted');`)).toBe("converted");
    expect(db.sql(`select signed_up_at is not null and gate_completed_at is not null and converted_at is not null
      from public.referrals where id='${id}';`)).toBe("t");
    expect(() => db.sql(`select public.advance_provider_referral('${id}','${REFERRED}','signed_up');`))
      .toThrow(/invalid_referral_transition/);
    expect(() => db.sql(`select public.advance_provider_referral('${id}','${OTHER}','credited');`))
      .toThrow(/referred_member_mismatch/);
  });

  it("rejects self-attribution without changing the invitation", () => {
    const id = createReferral("invited");
    expect(() => db.sql(`select public.advance_provider_referral('${id}','${REFERRER}','signed_up');`))
      .toThrow(/self_referral_not_allowed/);
    expect(db.sql(`select referred_id is null from public.referrals where id='${id}';`)).toBe("t");
  });

  it("issues exactly one referrer credit with a stable idempotency key", () => {
    const id = createReferral("converted");
    const first = db.sql(`select public.issue_referral_credit('${id}','${REFERRER}',1);`);
    const second = db.sql(`select public.issue_referral_credit('${id}','${REFERRER}',1);`);
    expect(second).toBe(first);
    expect(db.sql(`select count(*) from public.referral_credits where referral_id='${id}';`)).toBe("1");
    expect(db.sql(`select idempotency_key from public.referral_credits where id='${first}';`))
      .toBe(`referral-credit:${id}:${REFERRER}`);
    expect(db.sql(`select credited_at is not null from public.referrals where id='${id}';`)).toBe("t");
    expect(() => db.sql(`insert into public.referral_credits(referral_id,member_id,idempotency_key)
      values ('${id}','${OTHER}','second-credit-for-one-referral');`)).toThrow(/referral_credits_one_referral/);
  });

  it("cannot credit the referred member or any non-referrer", () => {
    const id = createReferral("converted");
    expect(() => db.sql(`select public.issue_referral_credit('${id}','${REFERRED}',1);`))
      .toThrow(/credit_recipient_must_be_referrer/);
    expect(db.sql(`select count(*) from public.referral_credits where referral_id='${id}';`)).toBe("0");
  });

  it("counts every non-void state toward the rolling 12-month cap", () => {
    const statuses = ["pending", "applying", "applied", "failed"];
    for (let i = 0; i < 12; i += 1) {
      const id = createReferral("converted", null, OTHER);
      db.sql(`insert into public.referral_credits(referral_id,member_id,status,idempotency_key)
        values ('${id}','${OTHER}','${statuses[i % statuses.length]}','seed-${i}');`);
    }
    const thirteenth = createReferral("converted", null, OTHER);
    expect(() => db.sql(`select public.issue_referral_credit('${thirteenth}','${OTHER}',1);`))
      .toThrow(/rolling_credit_cap_exceeded/);
    expect(db.sql(`select count(*) from public.referral_credits where member_id='${OTHER}';`)).toBe("12");
  });

  it("allows expired and void credits to fall outside the cap", () => {
    const member = "30000000-0000-4000-8000-000000000004";
    db.sql(`insert into auth.users(id,email) values ('${member}','void@example.test');
      insert into public.profiles(id) values ('${member}');`);
    for (let i = 0; i < 12; i += 1) {
      const id = createReferral("converted", null, member);
      db.sql(`insert into public.referral_credits(referral_id,member_id,status,idempotency_key,created_at)
        values ('${id}','${member}',${i === 0 ? "'voided'" : "'applied'"},'old-${i}',now()-interval '13 months');`);
    }
    const current = createReferral("converted", null, member);
    expect(db.sql(`select public.issue_referral_credit('${current}','${member}',1);`)).not.toBe("");
  });

  it("keeps referral mutation RPCs service-only", () => {
    expect(db.sql(`select has_function_privilege('authenticated','public.advance_provider_referral(uuid,uuid,text)','EXECUTE');`)).toBe("f");
    expect(db.sql(`select has_function_privilege('service_role','public.issue_referral_credit(uuid,uuid,integer)','EXECUTE');`)).toBe("t");
  });

  it("preserves an existing attribution when a later cookie claim is attempted", () => {
    const existing = createReferral("signed_up", SQUATTED, OTHER);
    db.sql(`insert into public.referral_codes_v2(user_id,code) values ('${REFERRER}','TRUSTED123');`);

    expect(db.sql(`select outcome from public.attribute_referral_signup('${SQUATTED}','TRUSTED123',null);`))
      .toBe("already_attributed");
    expect(db.sql(`select referrer_id from public.referrals where id='${existing}';`)).toBe(OTHER);
    expect(db.sql(`select has_table_privilege('authenticated','public.referrals','INSERT');`)).toBe("f");
    expect(db.sql(`select has_table_privilege('authenticated','public.referrals','UPDATE');`)).toBe("f");
    for (const column of ["referrer_id", "referred_id", "referral_code", "track", "status", "referred_name", "created_at", "converted_at"]) {
      expect(db.sql(`select has_column_privilege('authenticated','public.referrals','${column}','INSERT');`), column)
        .toBe("f");
    }
  });

  it("lets only the owning provider revoke a pending vouch request", () => {
    const requestId = db.sql(`insert into public.vouch_requests(provider_id,voucher_kind,invited_email)
      values ('${REFERRER}','client','client@example.test') returning id;`);
    expect(() => db.sql(`select public.revoke_vouch_request('${requestId}','${OTHER}');`))
      .toThrow(/vouch_request_not_owned/);
    expect(db.sql(`select public.revoke_vouch_request('${requestId}','${REFERRER}');`)).toBe("revoked");
    expect(db.sql(`select status || ':' || (revoked_at is not null) from public.vouch_requests where id='${requestId}';`))
      .toBe("revoked:true");
    expect(() => db.sql(`select public.revoke_vouch_request('${requestId}','${REFERRER}');`))
      .toThrow(/vouch_request_not_pending/);
  });

  it("persists retry attempts and a Stripe balance transaction atomically", () => {
    const referralId = createReferral("converted");
    const creditId = db.sql(`select public.issue_referral_credit('${referralId}','${REFERRER}',1);`);

    const firstToken = "30000000-0000-4000-8000-000000000101";
    const contenderToken = "30000000-0000-4000-8000-000000000102";
    expect(db.sql(`select public.claim_referral_credit('${creditId}','${firstToken}')->>'status';`)).toBe("applying");
    expect(db.sql(`select status || ':' || attempt_count from public.referral_credits where id='${creditId}';`))
      .toBe("applying:1");
    expect(db.sql(`select public.claim_referral_credit('${creditId}','${contenderToken}')->>'status';`)).toBe("busy");
    expect(db.sql(`select attempt_count from public.referral_credits where id='${creditId}';`)).toBe("1");
    expect(() => db.sql(`select public.mark_referral_credit_failed('${creditId}','${contenderToken}','{}'::jsonb);`))
      .toThrow(/referral_credit_not_retryable/);

    expect(db.sql(`select public.snapshot_referral_credit_billing('${creditId}','${firstToken}',
      'cus_original',10000,'gbp')->>'amount_pence';`)).toBe("10000");

    db.sql(`select public.mark_referral_credit_failed('${creditId}','${firstToken}','{"message":"temporary"}'::jsonb);`);
    expect(db.sql(`select public.claim_referral_credit('${creditId}','${contenderToken}')->>'status';`)).toBe("applying");
    expect(db.sql(`select status || ':' || attempt_count from public.referral_credits where id='${creditId}';`))
      .toBe("applying:2");
    expect(db.sql(`select public.snapshot_referral_credit_billing('${creditId}','${contenderToken}',
      'cus_mutated',3000,'usd')->>'stripe_customer_id';`)).toBe("cus_original");
    expect(db.sql(`select stripe_customer_id || ':' || amount_pence || ':' || currency
      from public.referral_credits where id='${creditId}';`)).toBe("cus_original:10000:gbp");

    db.sql(`select public.mark_referral_credit_applied('${creditId}','${contenderToken}','cbtxn_123');`);
    expect(db.sql(`select status || ':' || stripe_balance_transaction_id from public.referral_credits where id='${creditId}';`))
      .toBe("applied:cbtxn_123");
    expect(db.sql(`select public.claim_referral_credit('${creditId}','${firstToken}')->>'status';`)).toBe("applied");
    expect(db.sql(`select attempt_count from public.referral_credits where id='${creditId}';`)).toBe("2");
  });

  it("keeps credit application RPCs service-only", () => {
    expect(db.sql(`select has_function_privilege('authenticated','public.claim_referral_credit(uuid,uuid)','EXECUTE');`)).toBe("f");
    expect(db.sql(`select has_function_privilege('service_role','public.claim_referral_credit(uuid,uuid)','EXECUTE');`)).toBe("t");
    expect(db.sql(`select has_function_privilege('anon','public.mark_referral_credit_applied(uuid,uuid,text)','EXECUTE');`)).toBe("f");
    expect(db.sql(`select has_function_privilege('authenticated',
      'public.snapshot_referral_credit_billing(uuid,uuid,text,integer,text)','EXECUTE');`)).toBe("f");
  });
});
