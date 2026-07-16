create or replace function public.attribute_referral_signup(
  p_referred_profile_id uuid,
  p_referral_code text default null,
  p_invite_token uuid default null
)
returns table(outcome text, referral_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_referral public.referrals%rowtype;
  v_referrer_id uuid;
  v_actor_email text;
begin
  if p_referral_code is null and p_invite_token is null then
    return query select 'no_attribution'::text, null::uuid;
    return;
  end if;

  select r.* into v_referral
  from public.referrals r
  where r.referred_id = p_referred_profile_id
  for update;
  if found then
    return query select 'already_attributed'::text, v_referral.id;
    return;
  end if;

  if p_invite_token is not null then
    select r.* into v_referral
    from public.referrals r
    where r.invite_token = p_invite_token
    for update;
    if not found then
      raise exception using errcode = 'P0002', message = 'referral_invite_not_found';
    end if;
    if v_referral.referred_id is not null then
      raise exception using errcode = '23505', message = 'referral_invite_already_claimed';
    end if;
    if v_referral.referrer_id = p_referred_profile_id then
      raise exception using errcode = '23514', message = 'self_referral_not_allowed';
    end if;

    if v_referral.invited_email is not null then
      select lower(trim(email)) into v_actor_email
      from auth.users where id = p_referred_profile_id;
      if v_actor_email is distinct from lower(trim(v_referral.invited_email)) then
        raise exception using errcode = '42501', message = 'invited_email_mismatch';
      end if;
    end if;

    update public.referrals
    set referred_id = p_referred_profile_id,
        provider_state = 'signed_up'::public.referral_status,
        signed_up_at = now()
    where id = v_referral.id;
    return query select 'attributed'::text, v_referral.id;
    return;
  end if;

  select rc.user_id into v_referrer_id
  from public.referral_codes_v2 rc
  where rc.code = upper(regexp_replace(coalesce(p_referral_code, ''), '[^A-Za-z0-9]', '', 'g'))
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'referral_code_not_found';
  end if;
  if v_referrer_id = p_referred_profile_id then
    raise exception using errcode = '23514', message = 'self_referral_not_allowed';
  end if;

  insert into public.referrals(
    referrer_id, referred_id, referral_code, track, status, provider_state,
    signed_up_at
  ) values (
    v_referrer_id, p_referred_profile_id,
    upper(regexp_replace(coalesce(p_referral_code, ''), '[^A-Za-z0-9]', '', 'g')),
    'trade_to_trade'::public.referral_track,
    'pending'::public.referral_status,
    'signed_up'::public.referral_status,
    now()
  ) returning id into v_referral.id;
  return query select 'attributed'::text, v_referral.id;
end;
$$;

revoke all on function public.attribute_referral_signup(uuid,text,uuid)
  from public, anon, authenticated;
grant execute on function public.attribute_referral_signup(uuid,text,uuid) to service_role;

create or replace function public.create_vouch_request(
  p_provider_id uuid,
  p_voucher_kind text,
  p_invited_email text
)
returns table(id uuid, invite_token uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_token uuid;
  v_email text := lower(trim(p_invited_email));
begin
  if p_voucher_kind not in ('peer', 'client') then
    raise exception using errcode = '23514', message = 'invalid_voucher_kind';
  end if;
  if not exists (
    select 1 from public.profiles p
    join public.service_provider_details spd on spd.user_id = p.id
    where p.id = p_provider_id
      and p.active_role = 'service_provider'::public.user_role
      and p.deleted_at is null
  ) then
    raise exception using errcode = '42501', message = 'provider_role_required';
  end if;
  if exists (
    select 1 from auth.users u
    where u.id = p_provider_id and lower(trim(u.email)) = v_email
  ) then
    raise exception using errcode = '23514', message = 'self_vouch_not_allowed';
  end if;

  insert into public.vouch_requests as vr(provider_id, voucher_kind, invited_email)
  values (p_provider_id, p_voucher_kind, v_email)
  returning vr.id, vr.invite_token into v_id, v_token;
  return query select v_id, v_token;
end;
$$;

create or replace function public.create_provider_referral_invite(
  p_referrer_id uuid,
  p_invited_email text
)
returns table(id uuid, invite_token uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_token uuid := gen_random_uuid();
  v_email text := lower(trim(p_invited_email));
begin
  if not exists (
    select 1 from public.profiles p
    join public.service_provider_details spd on spd.user_id = p.id
    where p.id = p_referrer_id
      and p.active_role = 'service_provider'::public.user_role
      and p.deleted_at is null
  ) then
    raise exception using errcode = '42501', message = 'provider_role_required';
  end if;
  if exists (
    select 1 from auth.users u
    where u.id = p_referrer_id and lower(trim(u.email)) = v_email
  ) then
    raise exception using errcode = '23514', message = 'self_referral_not_allowed';
  end if;

  insert into public.referrals as r(
    referrer_id, referral_code, track, status, provider_state,
    invite_token, invited_email
  ) values (
    p_referrer_id, upper(left(replace(v_token::text, '-', ''), 12)),
    'trade_to_trade'::public.referral_track,
    'pending'::public.referral_status,
    'invited'::public.referral_status,
    v_token, v_email
  ) returning r.id into v_id;
  return query select v_id, v_token;
end;
$$;

revoke all on function public.create_vouch_request(uuid,text,text)
  from public, anon, authenticated;
revoke all on function public.create_provider_referral_invite(uuid,text)
  from public, anon, authenticated;
grant execute on function public.create_vouch_request(uuid,text,text) to service_role;
grant execute on function public.create_provider_referral_invite(uuid,text) to service_role;

create or replace function public.respond_to_vouch_request(
  p_invite_token uuid,
  p_actor_profile_id uuid,
  p_decision text,
  p_public_attribution_consent boolean default false
)
returns table(outcome text, vouch_id uuid, gate_just_completed boolean, provider_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.vouch_requests%rowtype;
  v_actor_email text;
  v_gate_before boolean;
begin
  if p_decision not in ('accept', 'decline') then
    raise exception using errcode = '23514', message = 'invalid_vouch_decision';
  end if;

  select * into v_request from public.vouch_requests
  where invite_token = p_invite_token
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'vouch_request_not_found';
  end if;

  select lower(trim(email)) into v_actor_email from auth.users
  where id = p_actor_profile_id;
  if v_actor_email is distinct from lower(trim(v_request.invited_email)) then
    raise exception using errcode = '42501', message = 'invited_email_mismatch';
  end if;
  if v_request.voucher_profile_id is not null
     and v_request.voucher_profile_id is distinct from p_actor_profile_id then
    raise exception using errcode = '42501', message = 'vouch_actor_mismatch';
  end if;

  update public.vouch_requests
  set voucher_profile_id = p_actor_profile_id
  where id = v_request.id and voucher_profile_id is null;

  if p_decision = 'decline' then
    perform public.decline_vouch_request(v_request.id, p_actor_profile_id);
    return query select 'declined'::text, null::uuid, false, v_request.provider_id;
    return;
  end if;

  select status.gate_complete into v_gate_before
  from public.vouch_gate_status(v_request.provider_id) status;

  return query select accepted.outcome, accepted.vouch_id,
    (not coalesce(v_gate_before, false) and status.gate_complete),
    v_request.provider_id
  from public.accept_vouch_request(
    v_request.id,
    p_actor_profile_id,
    p_public_attribution_consent
  ) accepted
  cross join public.vouch_gate_status(v_request.provider_id) status;
end;
$$;

revoke all on function public.respond_to_vouch_request(uuid,uuid,text,boolean)
  from public, anon, authenticated;
grant execute on function public.respond_to_vouch_request(uuid,uuid,text,boolean)
  to service_role;
