alter table public.vouch_requests
  add column invite_channel text not null default 'email'
    check (invite_channel in ('email', 'sms', 'whatsapp', 'link')),
  add column voucher_trade text,
  add column relationship_evidence jsonb not null default '{}'::jsonb;

alter table public.vouches
  add column voucher_trade text,
  add column relationship_evidence jsonb not null default '{}'::jsonb,
  alter column voucher_profile_id set not null;

alter table public.vouches drop constraint if exists vouches_peer_has_profile;
drop index if exists public.vouches_one_active_peer_per_provider;
create unique index vouches_one_active_pair
  on public.vouches (provider_id, voucher_profile_id)
  where revoked_at is null;

create policy vouches_voucher_read on public.vouches
  for select to authenticated using ((select auth.uid()) = voucher_profile_id);

alter table public.referrals
  add column signed_up_at timestamptz,
  add column gate_completed_at timestamptz,
  add column credited_at timestamptz;

alter table public.referral_credits
  drop constraint referral_credits_one_referrer;
alter table public.referral_credits
  add constraint referral_credits_one_referral unique (referral_id);

alter table public.fraud_flags
  add constraint fraud_flags_type_check check (
    flag_type in ('reciprocal_vouch', 'shared_device', 'shared_payment', 'rapid_account', 'ip_cluster')
  );

create or replace function public.accept_vouch_request(
  p_request_id uuid,
  p_actor_profile_id uuid,
  p_public_attribution_consent boolean default false
)
returns table(outcome text, vouch_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.vouch_requests%rowtype;
  v_existing_id uuid;
  v_actor_email text;
  v_actor_email_confirmed_at timestamptz;
  v_peer_eligible boolean;
begin
  select * into v_request from public.vouch_requests
  where id = p_request_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'vouch_request_not_found';
  end if;
  if v_request.status = 'accepted' then
    select id into v_existing_id from public.vouches where request_id = p_request_id;
    return query select 'accepted'::text, v_existing_id;
    return;
  end if;
  if v_request.status <> 'pending' then
    raise exception using errcode = 'P0001', message = 'vouch_request_not_pending';
  end if;
  if v_request.expires_at <= now() then
    update public.vouch_requests set status = 'expired', responded_at = now()
      where id = p_request_id;
    return query select 'expired'::text, null::uuid;
    return;
  end if;
  if v_request.voucher_profile_id is not null
     and v_request.voucher_profile_id is distinct from p_actor_profile_id then
    raise exception using errcode = '42501', message = 'vouch_actor_mismatch';
  end if;

  select lower(trim(email)), email_confirmed_at
  into v_actor_email, v_actor_email_confirmed_at from auth.users
  where id = p_actor_profile_id;
  if v_actor_email_confirmed_at is null then
    raise exception using errcode = '42501', message = 'confirmed_email_required';
  end if;
  if v_actor_email is distinct from lower(trim(v_request.invited_email)) then
    raise exception using errcode = '42501', message = 'invited_email_mismatch';
  end if;
  if v_request.voucher_profile_id is null then
    update public.vouch_requests set voucher_profile_id = p_actor_profile_id
    where id = p_request_id;
  end if;

  if v_request.voucher_kind = 'peer' then
    select
      p.active_role = 'service_provider'::public.user_role
      and p.created_at <= now() - interval '7 days'
      and p.deleted_at is null
      and p.provider_verification_status not in (
        'suspended'::public.provider_verification_status,
        'rejected'::public.provider_verification_status
      )
      and (
        spd.vouch_gate_grandfathered_at is not null
        or (
          (select count(*) from public.vouches peer_v
            where peer_v.provider_id = p.id and peer_v.voucher_kind = 'peer'
              and peer_v.revoked_at is null) >= 3
          and (select count(*) from public.vouches client_v
            where client_v.provider_id = p.id and client_v.voucher_kind = 'client'
              and client_v.revoked_at is null) >= 3
        )
      )
    into v_peer_eligible
    from public.profiles p
    join public.service_provider_details spd on spd.user_id = p.id
    where p.id = p_actor_profile_id;
    if coalesce(v_peer_eligible, false) is false then
      raise exception using errcode = '42501', message = 'peer_not_eligible';
    end if;

    if exists (
      select 1 from public.vouches reverse_vouch
      where reverse_vouch.provider_id = p_actor_profile_id
        and reverse_vouch.voucher_profile_id = v_request.provider_id
        and reverse_vouch.voucher_kind = 'peer'
        and reverse_vouch.revoked_at is null
        and reverse_vouch.accepted_at >= now() - interval '90 days'
    ) then
      insert into public.fraud_flags(subject_profile_id, vouch_request_id, flag_type, details)
      values (v_request.provider_id, v_request.id, 'reciprocal_vouch',
        jsonb_build_object('voucher_profile_id', p_actor_profile_id));
    end if;
  end if;

  insert into public.vouches(
    request_id, provider_id, voucher_kind, voucher_profile_id,
    public_attribution_consent, voucher_trade, relationship_evidence
  ) values (
    v_request.id, v_request.provider_id, v_request.voucher_kind,
    p_actor_profile_id, p_public_attribution_consent,
    v_request.voucher_trade, v_request.relationship_evidence
  ) returning id into v_existing_id;
  update public.vouch_requests
  set status = 'accepted', responded_at = now(),
      public_attribution_consent = p_public_attribution_consent
  where id = p_request_id;
  return query select 'accepted'::text, v_existing_id;
end;
$$;

create or replace function public.advance_provider_referral(
  p_referral_id uuid,
  p_referred_profile_id uuid,
  p_target_state text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_referral public.referrals%rowtype;
  v_expected_target text;
begin
  select * into v_referral from public.referrals
  where id = p_referral_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'referral_not_found';
  end if;
  if v_referral.referrer_id = p_referred_profile_id then
    raise exception using errcode = '23514', message = 'self_referral_not_allowed';
  end if;
  if v_referral.referred_id is not null
     and v_referral.referred_id is distinct from p_referred_profile_id then
    raise exception using errcode = '23505', message = 'referred_member_mismatch';
  end if;
  v_expected_target := case v_referral.provider_state::text
    when 'invited' then 'signed_up'
    when 'signed_up' then 'gate_complete'
    when 'gate_complete' then 'converted'
    else null
  end;
  if v_expected_target is distinct from p_target_state then
    raise exception using errcode = '23514', message = 'invalid_referral_transition';
  end if;
  update public.referrals
  set referred_id = coalesce(referred_id, p_referred_profile_id),
      provider_state = p_target_state::public.referral_status,
      signed_up_at = case when p_target_state = 'signed_up' then now() else signed_up_at end,
      gate_completed_at = case when p_target_state = 'gate_complete' then now() else gate_completed_at end,
      converted_at = case when p_target_state = 'converted' then now() else converted_at end
  where id = p_referral_id;
  return p_target_state;
end;
$$;

create or replace function public.issue_referral_credit(
  p_referral_id uuid,
  p_member_id uuid,
  p_credit_months integer default 1
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_referral public.referrals%rowtype;
  v_existing_id uuid;
  v_credit_id uuid;
  v_used_months integer;
  v_idempotency_key text;
begin
  if p_credit_months <= 0 then
    raise exception using errcode = '23514', message = 'credit_months_must_be_positive';
  end if;
  perform 1 from public.profiles where id = p_member_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'credit_member_not_found';
  end if;
  select * into v_referral from public.referrals
  where id = p_referral_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'referral_not_found';
  end if;
  if v_referral.referrer_id is distinct from p_member_id then
    raise exception using errcode = '42501', message = 'credit_recipient_must_be_referrer';
  end if;
  if v_referral.provider_state not in (
    'converted'::public.referral_status, 'credited'::public.referral_status
  ) then
    raise exception using errcode = '23514', message = 'referral_not_converted';
  end if;
  v_idempotency_key := 'referral-credit:' || p_referral_id::text || ':' || p_member_id::text;
  select id into v_existing_id from public.referral_credits
  where idempotency_key = v_idempotency_key;
  if found then return v_existing_id; end if;
  select coalesce(sum(credit_months), 0)::integer into v_used_months
  from public.referral_credits
  where member_id = p_member_id and status <> 'voided'
    and created_at >= now() - interval '12 months';
  if v_used_months + p_credit_months > 12 then
    raise exception using errcode = '23514', message = 'rolling_credit_cap_exceeded';
  end if;
  insert into public.referral_credits(
    referral_id, member_id, credit_months, status, idempotency_key
  ) values (p_referral_id, p_member_id, p_credit_months, 'pending', v_idempotency_key)
  returning id into v_credit_id;
  update public.referrals set provider_state = 'credited'::public.referral_status,
    credited_at = now() where id = p_referral_id;
  return v_credit_id;
end;
$$;

revoke all on function public.accept_vouch_request(uuid,uuid,boolean)
  from public, anon, authenticated;
revoke all on function public.advance_provider_referral(uuid,uuid,text)
  from public, anon, authenticated;
revoke all on function public.issue_referral_credit(uuid,uuid,integer)
  from public, anon, authenticated;
grant execute on function public.accept_vouch_request(uuid,uuid,boolean) to service_role;
grant execute on function public.advance_provider_referral(uuid,uuid,text) to service_role;
grant execute on function public.issue_referral_credit(uuid,uuid,integer) to service_role;

create or replace function public.decline_vouch_request(
  p_request_id uuid,
  p_actor_profile_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.vouch_requests%rowtype;
  v_actor_email text;
  v_confirmed_at timestamptz;
begin
  select * into v_request from public.vouch_requests
  where id = p_request_id for update;
  if not found or v_request.status <> 'pending' then
    raise exception using errcode = 'P0001', message = 'vouch_request_not_pending';
  end if;
  if v_request.voucher_profile_id is not null
     and v_request.voucher_profile_id is distinct from p_actor_profile_id then
    raise exception using errcode = '42501', message = 'vouch_actor_mismatch';
  end if;
  select lower(trim(email)), email_confirmed_at into v_actor_email, v_confirmed_at
  from auth.users where id = p_actor_profile_id;
  if v_confirmed_at is null then
    raise exception using errcode = '42501', message = 'confirmed_email_required';
  end if;
  if v_actor_email is distinct from lower(trim(v_request.invited_email)) then
    raise exception using errcode = '42501', message = 'invited_email_mismatch';
  end if;
  update public.vouch_requests
  set voucher_profile_id = coalesce(voucher_profile_id, p_actor_profile_id),
      status = 'declined', responded_at = now()
  where id = p_request_id;
  return true;
end;
$$;

revoke all on function public.decline_vouch_request(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.decline_vouch_request(uuid,uuid) to service_role;
