alter table public.referral_credits
  add column if not exists application_token uuid,
  add column if not exists application_lease_expires_at timestamptz;

create or replace function public.claim_referral_credit(
  p_credit_id uuid,
  p_application_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_credit public.referral_credits%rowtype;
begin
  select * into v_credit
  from public.referral_credits
  where id = p_credit_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'referral_credit_not_found';
  end if;

  if p_application_token is null then
    raise exception using errcode = '22004', message = 'application_token_required';
  end if;

  if v_credit.status in ('applied', 'voided') then
    return jsonb_build_object(
      'credit_id', v_credit.id,
      'status', v_credit.status,
      'stripe_balance_transaction_id', v_credit.stripe_balance_transaction_id
    );
  end if;

  if v_credit.status = 'applying'
     and v_credit.application_lease_expires_at > now()
     and v_credit.application_token is distinct from p_application_token then
    return jsonb_build_object(
      'credit_id', v_credit.id,
      'status', 'busy',
      'lease_expires_at', v_credit.application_lease_expires_at
    );
  end if;

  update public.referral_credits
  set status = 'applying',
      attempt_count = attempt_count + 1,
      last_attempted_at = now(),
      application_token = p_application_token,
      application_lease_expires_at = now() + interval '5 minutes',
      updated_at = now()
  where id = p_credit_id
  returning * into v_credit;

  return jsonb_build_object(
    'credit_id', v_credit.id,
    'referral_id', v_credit.referral_id,
    'member_id', v_credit.member_id,
    'credit_months', v_credit.credit_months,
    'status', v_credit.status,
    'idempotency_key', v_credit.idempotency_key
  );
end;
$$;

create or replace function public.mark_referral_credit_applied(
  p_credit_id uuid,
  p_application_token uuid,
  p_stripe_balance_transaction_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.referral_credits
  set status = 'applied',
      stripe_balance_transaction_id = p_stripe_balance_transaction_id,
      applied_at = coalesce(applied_at, now()),
      error_details = null,
      application_lease_expires_at = null,
      updated_at = now()
  where id = p_credit_id
    and application_token = p_application_token
    and status in ('applying', 'applied');

  if not found then
    raise exception using errcode = '23514', message = 'referral_credit_not_applying';
  end if;
end;
$$;

create or replace function public.mark_referral_credit_failed(
  p_credit_id uuid,
  p_application_token uuid,
  p_error_details jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.referral_credits
  set status = 'failed',
      error_details = coalesce(p_error_details, '{}'::jsonb),
      application_lease_expires_at = null,
      updated_at = now()
  where id = p_credit_id
    and application_token = p_application_token
    and status in ('pending', 'applying', 'failed');

  if not found then
    raise exception using errcode = '23514', message = 'referral_credit_not_retryable';
  end if;
end;
$$;

revoke all on function public.claim_referral_credit(uuid,uuid)
  from public, anon, authenticated;
revoke all on function public.mark_referral_credit_applied(uuid,uuid,text)
  from public, anon, authenticated;
revoke all on function public.mark_referral_credit_failed(uuid,uuid,jsonb)
  from public, anon, authenticated;

grant execute on function public.claim_referral_credit(uuid,uuid) to service_role;
grant execute on function public.mark_referral_credit_applied(uuid,uuid,text) to service_role;
grant execute on function public.mark_referral_credit_failed(uuid,uuid,jsonb) to service_role;
