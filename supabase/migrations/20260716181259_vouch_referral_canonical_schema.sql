-- Canonical, service-owned vouch and provider-referral foundation.
-- Legacy provider_references remains readable history and is never promoted.

alter type public.referral_status add value if not exists 'invited';
alter type public.referral_status add value if not exists 'signed_up';
alter type public.referral_status add value if not exists 'gate_complete';
alter type public.referral_status add value if not exists 'converted';
alter type public.referral_status add value if not exists 'credited';

alter table public.service_provider_details
  add column if not exists vouch_gate_grandfathered_at timestamptz;

update public.service_provider_details spd
set vouch_gate_grandfathered_at = statement_timestamp()
from public.profiles p
where p.id = spd.user_id
  and p.provider_verification_status = 'verified'::public.provider_verification_status
  and spd.vouch_gate_grandfathered_at is null;

alter table public.referrals
  add column if not exists invite_token uuid,
  add column if not exists invited_email text,
  add column if not exists provider_state public.referral_status;

create unique index if not exists referrals_invite_token_key
  on public.referrals (invite_token) where invite_token is not null;
create unique index if not exists referrals_provider_invited_email_key
  on public.referrals (referrer_id, lower(invited_email))
  where provider_state is not null and invited_email is not null;

create table public.vouch_requests (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  voucher_kind text not null check (voucher_kind in ('peer', 'client')),
  voucher_profile_id uuid references public.profiles(id) on delete restrict,
  invited_email text not null check (invited_email = lower(trim(invited_email))),
  invite_token uuid not null default gen_random_uuid() unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'expired', 'revoked')),
  public_attribution_consent boolean not null default false,
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  responded_at timestamptz,
  revoked_at timestamptz,
  constraint vouch_requests_not_self check (provider_id is distinct from voucher_profile_id)
);

create unique index vouch_requests_one_live_invite
  on public.vouch_requests (provider_id, voucher_kind, lower(invited_email))
  where status = 'pending';
create index vouch_requests_provider_status_idx
  on public.vouch_requests (provider_id, status);
create index vouch_requests_voucher_profile_idx
  on public.vouch_requests (voucher_profile_id) where voucher_profile_id is not null;

create table public.vouches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.vouch_requests(id) on delete restrict,
  provider_id uuid not null references public.profiles(id) on delete restrict,
  voucher_kind text not null check (voucher_kind in ('peer', 'client')),
  voucher_profile_id uuid references public.profiles(id) on delete restrict,
  accepted_at timestamptz not null default now(),
  revoked_at timestamptz,
  public_attribution_consent boolean not null default false,
  constraint vouches_peer_has_profile check (
    (voucher_kind = 'peer' and voucher_profile_id is not null)
    or voucher_kind = 'client'
  ),
  constraint vouches_not_self check (provider_id is distinct from voucher_profile_id)
);

create unique index vouches_one_active_peer_per_provider
  on public.vouches (provider_id, voucher_profile_id)
  where voucher_kind = 'peer' and revoked_at is null;
create index vouches_provider_kind_active_idx
  on public.vouches (provider_id, voucher_kind) where revoked_at is null;

create table public.referral_credits (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete restrict,
  member_id uuid not null references public.profiles(id) on delete restrict,
  credit_months integer not null default 1 check (credit_months > 0),
  status text not null default 'pending'
    check (status in ('pending', 'applying', 'applied', 'failed', 'voided')),
  stripe_balance_transaction_id text,
  idempotency_key text not null unique,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempted_at timestamptz,
  applied_at timestamptz,
  error_details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_credits_one_referrer unique (referral_id, member_id)
);
create index referral_credits_cap_idx
  on public.referral_credits (member_id, created_at desc)
  where status <> 'voided';

create table public.fraud_flags (
  id uuid primary key default gen_random_uuid(),
  subject_profile_id uuid not null references public.profiles(id) on delete restrict,
  vouch_request_id uuid references public.vouch_requests(id) on delete restrict,
  referral_id uuid references public.referrals(id) on delete restrict,
  flag_type text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'cleared', 'confirmed')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint fraud_flags_has_source check (vouch_request_id is not null or referral_id is not null)
);
create index fraud_flags_subject_status_idx on public.fraud_flags (subject_profile_id, status);

alter table public.vouch_requests enable row level security;
alter table public.vouches enable row level security;
alter table public.referral_credits enable row level security;
alter table public.fraud_flags enable row level security;

create policy vouch_requests_owner_read on public.vouch_requests
  for select to authenticated using ((select auth.uid()) = provider_id);
create policy vouches_owner_read on public.vouches
  for select to authenticated using ((select auth.uid()) = provider_id);
create policy referral_credits_member_read on public.referral_credits
  for select to authenticated using ((select auth.uid()) = member_id);

revoke all on table public.vouch_requests, public.vouches,
  public.referral_credits, public.fraud_flags from public, anon, authenticated;
grant select on table public.vouch_requests, public.vouches, public.referral_credits to authenticated;
grant select, insert, update, delete on table public.vouch_requests, public.vouches,
  public.referral_credits, public.fraud_flags to service_role;

revoke insert, update, delete on table public.provider_references from anon, authenticated;
-- Preserve the legacy pending-attribution insert surface temporarily, but do
-- not allow callers to forge per-invite tokens or provider state. PR2 moves
-- legacy attribution behind the authenticated callback before removing this.
revoke insert on table public.referrals from authenticated;
grant insert (
  referrer_id, referred_id, referral_code, track, status,
  referred_name, created_at, converted_at
) on table public.referrals to authenticated;
drop policy if exists provider_referrals_insert_own on public.provider_referrals;
drop policy if exists "provider_referrals_insert_own" on public.provider_referrals;
drop policy if exists provider_referrals_update_own on public.provider_referrals;
drop policy if exists "provider_referrals_update_own" on public.provider_referrals;
revoke insert, update, delete on table public.provider_referrals from anon, authenticated;

create or replace function public.vouch_gate_status(p_profile_id uuid)
returns table (
  peer_count integer,
  client_count integer,
  grandfathered boolean,
  gate_complete boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*) filter (where v.voucher_kind = 'peer' and v.revoked_at is null)::integer,
    count(*) filter (where v.voucher_kind = 'client' and v.revoked_at is null)::integer,
    spd.vouch_gate_grandfathered_at is not null,
    (spd.vouch_gate_grandfathered_at is not null)
      or (count(*) filter (where v.voucher_kind = 'peer' and v.revoked_at is null) >= 3
          and count(*) filter (where v.voucher_kind = 'client' and v.revoked_at is null) >= 3)
  from public.service_provider_details spd
  left join public.vouches v on v.provider_id = spd.user_id
  where spd.user_id = p_profile_id
  group by spd.vouch_gate_grandfathered_at;
$$;

revoke all on function public.vouch_gate_status(uuid) from public, anon;
grant execute on function public.vouch_gate_status(uuid) to authenticated, service_role;
