alter table public.subscriptions
  add column if not exists billing_interval text
    check (billing_interval in ('day', 'week', 'month', 'year')),
  add column if not exists billing_interval_count integer
    check (billing_interval_count > 0);

alter table public.referral_credits
  add column if not exists stripe_customer_id text,
  add column if not exists amount_pence integer check (amount_pence > 0),
  add column if not exists currency text check (currency = lower(currency));

alter table public.referral_credits
  add constraint referral_credits_billing_snapshot_complete check (
    (stripe_customer_id is null and amount_pence is null and currency is null)
    or
    (stripe_customer_id is not null and amount_pence is not null and currency is not null)
  );

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
  select * into v_credit from public.referral_credits
  where id = p_credit_id for update;

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
    'idempotency_key', v_credit.idempotency_key,
    'stripe_customer_id', v_credit.stripe_customer_id,
    'amount_pence', v_credit.amount_pence,
    'currency', v_credit.currency
  );
end;
$$;

create or replace function public.snapshot_referral_credit_billing(
  p_credit_id uuid,
  p_application_token uuid,
  p_stripe_customer_id text,
  p_amount_pence integer,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_credit public.referral_credits%rowtype;
begin
  if nullif(trim(p_stripe_customer_id), '') is null
     or p_amount_pence <= 0
     or nullif(trim(p_currency), '') is null then
    raise exception using errcode = '23514', message = 'invalid_credit_billing_snapshot';
  end if;

  select * into v_credit from public.referral_credits
  where id = p_credit_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'referral_credit_not_found';
  end if;
  if v_credit.status <> 'applying'
     or v_credit.application_token is distinct from p_application_token then
    raise exception using errcode = '42501', message = 'referral_credit_not_owned';
  end if;

  if v_credit.stripe_customer_id is null then
    update public.referral_credits
    set stripe_customer_id = p_stripe_customer_id,
        amount_pence = p_amount_pence,
        currency = lower(p_currency),
        updated_at = now()
    where id = p_credit_id
    returning * into v_credit;
  end if;

  return jsonb_build_object(
    'stripe_customer_id', v_credit.stripe_customer_id,
    'amount_pence', v_credit.amount_pence,
    'currency', v_credit.currency
  );
end;
$$;

revoke all on function public.snapshot_referral_credit_billing(uuid,uuid,text,integer,text)
  from public, anon, authenticated;
grant execute on function public.snapshot_referral_credit_billing(uuid,uuid,text,integer,text)
  to service_role;
