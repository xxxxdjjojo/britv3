-- Referral ownership is assigned only by the locked callback RPC. Historical
-- rows remain authoritative: attribute_referral_signup returns
-- already_attributed and never destructively reassigns a referred member.
revoke insert, update on table public.referrals from authenticated;
revoke insert (
  referrer_id, referred_id, referral_code, track, status,
  referred_name, created_at, converted_at
) on table public.referrals from authenticated;

create or replace function public.revoke_vouch_request(
  p_request_id uuid,
  p_provider_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  select status into v_status
  from public.vouch_requests
  where id = p_request_id and provider_id = p_provider_id
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'vouch_request_not_owned';
  end if;
  if v_status <> 'pending' then
    raise exception using errcode = '23514', message = 'vouch_request_not_pending';
  end if;

  update public.vouch_requests
  set status = 'revoked', revoked_at = now()
  where id = p_request_id;
  return 'revoked';
end;
$$;

revoke all on function public.revoke_vouch_request(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.revoke_vouch_request(uuid,uuid) to service_role;
