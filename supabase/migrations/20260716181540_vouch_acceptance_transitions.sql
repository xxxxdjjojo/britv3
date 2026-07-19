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
  v_peer_eligible boolean;
begin
  select * into v_request
  from public.vouch_requests
  where id = p_request_id
  for update;

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
    raise exception using errcode = 'P0001', message = 'vouch_request_expired';
  end if;
  if v_request.voucher_profile_id is distinct from p_actor_profile_id then
    raise exception using errcode = '42501', message = 'vouch_actor_mismatch';
  end if;

  select lower(trim(email)) into v_actor_email
  from auth.users where id = p_actor_profile_id;
  if v_actor_email is distinct from lower(trim(v_request.invited_email)) then
    raise exception using errcode = '42501', message = 'invited_email_mismatch';
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
          and
          (select count(*) from public.vouches client_v
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
    ) then
      insert into public.fraud_flags(subject_profile_id, vouch_request_id, flag_type, details)
      values (
        v_request.provider_id,
        v_request.id,
        'reciprocal_vouch',
        jsonb_build_object('voucher_profile_id', p_actor_profile_id)
      );
      update public.vouch_requests
      set status = 'declined', responded_at = now()
      where id = p_request_id;
      return query select 'flagged'::text, null::uuid;
      return;
    end if;
  end if;

  insert into public.vouches(
    request_id, provider_id, voucher_kind, voucher_profile_id,
    public_attribution_consent
  ) values (
    v_request.id, v_request.provider_id, v_request.voucher_kind,
    p_actor_profile_id, p_public_attribution_consent
  ) returning id into v_existing_id;

  update public.vouch_requests
  set status = 'accepted', responded_at = now(),
      public_attribution_consent = p_public_attribution_consent
  where id = p_request_id;

  return query select 'accepted'::text, v_existing_id;
end;
$$;

create or replace function public.decline_vouch_request(
  p_request_id uuid,
  p_actor_profile_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.vouch_requests
  set status = 'declined', responded_at = now()
  where id = p_request_id and voucher_profile_id = p_actor_profile_id
    and status = 'pending';
  if not found then
    raise exception using errcode = 'P0001', message = 'vouch_request_not_pending_or_actor_mismatch';
  end if;
  return true;
end;
$$;

create or replace function public.revoke_vouch(
  p_vouch_id uuid,
  p_provider_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.vouches set revoked_at = now()
  where id = p_vouch_id and provider_id = p_provider_id and revoked_at is null;
  if not found then
    raise exception using errcode = 'P0001', message = 'active_vouch_not_found';
  end if;
  update public.vouch_requests vr set status = 'revoked', revoked_at = now()
  where vr.id = (select request_id from public.vouches where id = p_vouch_id);
  return true;
end;
$$;

revoke all on function public.accept_vouch_request(uuid,uuid,boolean) from public, anon, authenticated;
revoke all on function public.decline_vouch_request(uuid,uuid) from public, anon, authenticated;
revoke all on function public.revoke_vouch(uuid,uuid) from public, anon, authenticated;
grant execute on function public.accept_vouch_request(uuid,uuid,boolean) to service_role;
grant execute on function public.decline_vouch_request(uuid,uuid) to service_role;
grant execute on function public.revoke_vouch(uuid,uuid) to service_role;
