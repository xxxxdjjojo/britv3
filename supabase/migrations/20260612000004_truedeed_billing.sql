-- ============================================================================
-- Truedeed Phase 4 — GoCardless billing
-- Spec: docs/truedeed/billing-flow-gocardless.md §1–§2 + §5
--
-- agent_agency_profiles gains the GoCardless mandate columns (§1). invoices
-- carry sequential VAT numbers (§2.1) minted by a SECURITY DEFINER function
-- over a dedicated sequence, filled by trigger on insert. invoice_events is
-- fully append-only (truedeed_forbid_mutation, the Phase 1 ledger idiom).
-- invoices.state has exactly one write path: transition_invoice(), a
-- SECURITY DEFINER function implementing the §5 dunning lattice that gates a
-- guard trigger via the transaction-local GUC truedeed.billing — all other
-- invoice columns stay freely updatable by the service path.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. agent_agency_profiles — GoCardless mandate columns (§1)
-- ---------------------------------------------------------------------------

alter table if exists public.agent_agency_profiles
  add column if not exists gocardless_customer_id text;
alter table if exists public.agent_agency_profiles
  add column if not exists gocardless_mandate_id text;
alter table if exists public.agent_agency_profiles
  add column if not exists mandate_status text
    check (mandate_status in
      ('pending','submitted','active','failed','cancelled','expired'));
alter table if exists public.agent_agency_profiles
  add column if not exists billing_suspended_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,        -- filled by trigger when null
  org_agent_id uuid not null,
  invoice_candidate_id uuid unique references public.invoice_candidates(id),
  introduction_id uuid references public.introductions(id),
  net_pence bigint not null,
  vat_pence bigint not null,
  gross_pence bigint not null,
  issued_at timestamptz not null default now(),
  due_at timestamptz not null,                -- issued + 14 days (clause 8.1)
  state text not null default 'open'
    check (state in ('open','collecting','paid','overdue','final_notice',
                     'suspended','disputed','charged_back','cancelled')),
  state_before_dispute text,                  -- dispute freeze restore point
  gocardless_payment_id text,
  paid_at timestamptz
);
create index idx_invoices_org_agent
  on public.invoices (org_agent_id);

create table public.invoice_events (
  id bigint generated always as identity primary key,
  invoice_id uuid not null references public.invoices(id),
  event_type text not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index idx_invoice_events_invoice
  on public.invoice_events (invoice_id);

-- ---------------------------------------------------------------------------
-- 3. Sequential VAT invoice numbering (§2.1)
-- ---------------------------------------------------------------------------

create sequence public.invoice_number_seq;

create or replace function public.next_invoice_number() returns text
language sql security definer set search_path = public as $$
  select 'TD-' || to_char(now(), 'YYYY') || '-'
              || lpad(nextval('public.invoice_number_seq')::text, 4, '0')
$$;

revoke execute on function public.next_invoice_number()
from public, anon, authenticated;
grant execute on function public.next_invoice_number()
to service_role;

create or replace function public.truedeed_fill_invoice_number() returns trigger
language plpgsql as $$
begin
  if new.invoice_number is null then
    new.invoice_number := public.next_invoice_number();
  end if;
  return new;
end $$;

create trigger invoices_fill_number
  before insert on public.invoices
  for each row execute function public.truedeed_fill_invoice_number();

-- ---------------------------------------------------------------------------
-- 4. Append-only enforcement (fires for ALL roles incl. superuser)
-- ---------------------------------------------------------------------------

-- invoice_events: no mutation path at all (Phase 1 ledger idiom).
create trigger invoice_events_immutable
  before update or delete on public.invoice_events
  for each row execute function public.truedeed_forbid_mutation();

-- invoices.state: changes only under transition_invoice()'s transaction-local
-- GUC. Every other column stays freely updatable (gocardless_payment_id etc.).
create or replace function public.truedeed_invoices_guard() returns trigger
language plpgsql as $$
begin
  if new.state is distinct from old.state
     and current_setting('truedeed.billing', true) is distinct from 'on' then
    raise exception 'state changes only via transition_invoice';
  end if;
  return new;
end $$;

create trigger invoices_state_guard
  before update on public.invoices
  for each row execute function public.truedeed_invoices_guard();

-- ---------------------------------------------------------------------------
-- 5. Dunning state machine (§2 timeline + §5)
-- ---------------------------------------------------------------------------

create or replace function public.transition_invoice(
  p_id uuid, p_event text, p_days_overdue int default null,
  p_actor uuid default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_state text;
  v_before text;
  v_new text;
begin
  select state, state_before_dispute into v_state, v_before
    from invoices where id = p_id for update;
  if not found then
    raise exception 'invoice not found: %', p_id;
  end if;

  v_new := case
    -- I+14: first DD collection attempt
    when v_state = 'open' and p_event = 'collection_started'
      then 'collecting'
    -- dunning day 0
    when v_state = 'collecting' and p_event = 'payment_failed'
      then 'overdue'
    -- D+14: formal notice
    when v_state = 'overdue' and p_event = 'day_tick'
         and coalesce(p_days_overdue, 0) >= 14
      then 'final_notice'
    -- D+21: clause 11.1(a) suspension
    when v_state = 'final_notice' and p_event = 'day_tick'
         and coalesce(p_days_overdue, 0) >= 21
      then 'suspended'
    -- payment received at any point during collection/dunning
    when v_state in ('collecting','overdue','final_notice','suspended')
         and p_event = 'payment_confirmed'
      then 'paid'
    -- clause 8.6: debt survives a chargeback (ops-only recovery path)
    when v_state = 'paid' and p_event = 'charged_back'
      then 'charged_back'
    -- dispute freezes the dunning clock wherever it stands
    when v_state in ('open','collecting','overdue','final_notice','suspended')
         and p_event = 'dispute_raised'
      then 'disputed'
    -- rejected: clock resumes where it stopped
    when v_state = 'disputed' and p_event = 'dispute_resolved-rejected'
      then coalesce(v_before, 'open')
    -- upheld: invoice is written off
    when v_state = 'disputed' and p_event = 'dispute_resolved-upheld'
      then 'cancelled'
    else null
  end;

  if v_new is null then
    raise exception 'invalid dunning transition: % on state %', p_event, v_state;
  end if;

  perform set_config('truedeed.billing', 'on', true);
  update invoices
     set state = v_new,
         paid_at = case when v_new = 'paid' then now() else paid_at end,
         state_before_dispute = case
           when p_event = 'dispute_raised' then v_state
           when p_event = 'dispute_resolved-rejected' then null
           else state_before_dispute
         end
   where id = p_id;
  perform set_config('truedeed.billing', '', true);

  insert into invoice_events (invoice_id, event_type, detail)
  values (p_id, p_event,
          jsonb_strip_nulls(jsonb_build_object(
            'from', v_state,
            'to', v_new,
            'days_overdue', p_days_overdue,
            'actor', p_actor)));
end $$;

revoke execute on function
  public.transition_invoice(uuid, text, int, uuid)
from public, anon, authenticated;
grant execute on function
  public.transition_invoice(uuid, text, int, uuid)
to service_role;

-- ---------------------------------------------------------------------------
-- 6. invoice_candidates lattice extension (pinned by
--    src/services/truedeed/invoice-service.test.ts): the billing:create-invoice
--    worker flips approved → invoiced via review_invoice_candidate(). Replaces
--    the Phase 2 function preserving all of its existing behaviour (note
--    required on reject, 'invalid transition' otherwise); the guard trigger on
--    invoice_candidates is untouched.
-- ---------------------------------------------------------------------------

create or replace function public.review_invoice_candidate(
  p_id uuid, p_reviewer uuid, p_new_status text, p_note text
) returns void
language plpgsql security definer set search_path = public as $$
declare v_status text;
begin
  select status into v_status from invoice_candidates where id = p_id for update;
  if not found then
    raise exception 'invoice candidate not found: %', p_id;
  end if;
  if p_new_status = 'rejected' and (p_note is null or btrim(p_note) = '') then
    raise exception 'review note is required';
  end if;
  if not (
    (v_status = 'pending_review' and p_new_status in ('approved','rejected'))
    or (v_status = 'on_hold_branch_query' and p_new_status = 'pending_review')
    or (v_status = 'approved' and p_new_status = 'invoiced')
  ) then
    raise exception 'invalid transition: % -> %', v_status, p_new_status;
  end if;
  perform set_config('truedeed.review', 'on', true);
  update invoice_candidates
     set status = p_new_status,
         reviewed_by = p_reviewer,
         reviewed_at = now(),
         review_note = p_note
   where id = p_id;
  perform set_config('truedeed.review', '', true);
end $$;

-- ---------------------------------------------------------------------------
-- 7. RLS — agents read their own invoices; admins read all; invoices and
--    events are worker-created only (no authenticated write path).
-- ---------------------------------------------------------------------------

alter table public.invoices enable row level security;
alter table public.invoice_events enable row level security;

revoke insert, update, delete on
  public.invoices, public.invoice_events
from anon, authenticated;

create policy invoices_select_own_or_admin on public.invoices for select
  using (
    org_agent_id = auth.uid()
    or exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.is_admin)
  );

create policy invoice_events_select_via_invoice on public.invoice_events for select
  using (
    exists (
      select 1 from public.invoices i
       where i.id = invoice_id
         and (i.org_agent_id = auth.uid()
              or exists (select 1 from public.profiles p
                          where p.id = auth.uid() and p.is_admin))
    )
  );
