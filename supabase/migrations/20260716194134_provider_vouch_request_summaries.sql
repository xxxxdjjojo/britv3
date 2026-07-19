create or replace function public.provider_vouch_request_summaries(
  p_provider_id uuid
)
returns table (
  id uuid,
  voucher_kind text,
  status text,
  requested_at timestamptz,
  expires_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    request.id,
    request.voucher_kind,
    case
      when request.status = 'pending' and request.expires_at <= now() then 'expired'
      else request.status
    end,
    request.requested_at,
    request.expires_at
  from public.vouch_requests request
  where request.provider_id = p_provider_id
  order by request.requested_at desc;
$$;

revoke all on function public.provider_vouch_request_summaries(uuid)
  from public, anon, authenticated;
grant execute on function public.provider_vouch_request_summaries(uuid)
  to service_role;
