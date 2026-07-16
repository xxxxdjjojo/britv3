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
  select * into v_referral
  from public.referrals
  where id = p_referral_id
  for update;

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

  -- Serialize all cap decisions for this member, including different referrals.
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
    'converted'::public.referral_status,
    'credited'::public.referral_status
  ) then
    raise exception using errcode = '23514', message = 'referral_not_converted';
  end if;

  v_idempotency_key := 'referral-credit:' || p_referral_id::text || ':' || p_member_id::text;
  select id into v_existing_id from public.referral_credits
  where idempotency_key = v_idempotency_key;
  if found then
    return v_existing_id;
  end if;

  select coalesce(sum(credit_months), 0)::integer into v_used_months
  from public.referral_credits
  where member_id = p_member_id
    and status <> 'voided'
    and created_at >= now() - interval '12 months';
  if v_used_months + p_credit_months > 12 then
    raise exception using errcode = '23514', message = 'rolling_credit_cap_exceeded';
  end if;

  insert into public.referral_credits(
    referral_id, member_id, credit_months, status, idempotency_key
  ) values (
    p_referral_id, p_member_id, p_credit_months, 'pending', v_idempotency_key
  ) returning id into v_credit_id;

  update public.referrals
  set provider_state = 'credited'::public.referral_status
  where id = p_referral_id;
  return v_credit_id;
end;
$$;

revoke all on function public.advance_provider_referral(uuid,uuid,text)
  from public, anon, authenticated;
revoke all on function public.issue_referral_credit(uuid,uuid,integer)
  from public, anon, authenticated;
grant execute on function public.advance_provider_referral(uuid,uuid,text) to service_role;
grant execute on function public.issue_referral_credit(uuid,uuid,integer) to service_role;
