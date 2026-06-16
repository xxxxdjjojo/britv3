-- ============================================================================
-- Truedeed Phase 5 — invoice disputes (clause 9.5 Properly Raised Disputes)
-- Spec: docs/truedeed/dispute-playbook.md (D1–D5 + operating principles)
--       docs/truedeed/billing-flow-gocardless.md §2 (10 business-day window,
--         dispute pause/resume on the dunning state machine).
--
-- invoice_disputes is append-only via truedeed_invoice_disputes_guard: DELETE
-- is always blocked; UPDATE is blocked except when the transaction-local GUC
-- truedeed.dispute_decide is set inside decide_invoice_dispute() — the single
-- SECURITY DEFINER mutation path. decide_invoice_dispute() drives
-- transition_invoice() with 'dispute_resolved-upheld' (conceded → cancelled)
-- or 'dispute_resolved-rejected' (resumes at state_before_dispute), keeping
-- the dispute and invoice state machines in lockstep. RLS: agent reads/inserts
-- their own (via the invoice join + raised_by = auth.uid()), admin reads all,
-- no authenticated UPDATE or DELETE path exists.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------

create table public.invoice_disputes (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null unique references public.invoices(id),
  raised_by uuid not null references auth.users(id),
  grounds text not null,
  evidence_storage_paths text[] not null default '{}',
  category text
    check (category in (
      'D1_source','D2_fell_through','D3_different_applicant',
      'D4_no_tail_agreement','D5_fee_level'
    )),
  raised_at timestamptz not null default now(),
  properly_raised boolean not null default true,
  status text not null default 'open'
    check (status in ('open','conceded','rejected')),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  decision_reason text
);

create index idx_invoice_disputes_invoice on public.invoice_disputes (invoice_id);
create index idx_invoice_disputes_raised_by on public.invoice_disputes (raised_by);
create index idx_invoice_disputes_open
  on public.invoice_disputes (raised_at desc) where status = 'open';

-- ---------------------------------------------------------------------------
-- 2. Append-only guard — DELETE always blocked; UPDATE only via
--    decide_invoice_dispute()'s transaction-local GUC.
-- ---------------------------------------------------------------------------

create or replace function public.truedeed_invoice_disputes_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'append-only table: DELETE blocked on invoice_disputes';
  end if;

  if current_setting('truedeed.dispute_decide', true) = 'on'
     and old.status = 'open'
     and new.status in ('conceded','rejected')
     and new.category is not null
     and new.decided_by is not null
     and new.decided_at is not null
     and new.decision_reason is not null
     and new.id = old.id
     and new.invoice_id = old.invoice_id
     and new.raised_by = old.raised_by
     and new.grounds = old.grounds
     and new.evidence_storage_paths = old.evidence_storage_paths
     and new.raised_at = old.raised_at
     and new.properly_raised = old.properly_raised then
    return new;
  end if;

  raise exception 'append-only table: UPDATE blocked on invoice_disputes';
end $$;

create trigger invoice_disputes_immutable
  before update or delete on public.invoice_disputes
  for each row execute function public.truedeed_invoice_disputes_guard();

-- ---------------------------------------------------------------------------
-- 3. decide_invoice_dispute — the only mutation path. Validates inputs,
--    locks the dispute row, stamps the decision under the GUC, then drives
--    transition_invoice so the invoice and dispute state machines move
--    together inside one transaction.
-- ---------------------------------------------------------------------------

create or replace function public.decide_invoice_dispute(
  p_id uuid, p_admin uuid, p_decision text,
  p_category text, p_reason text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_status text;
  v_invoice uuid;
begin
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'decision reason is required';
  end if;
  if p_category is null or btrim(p_category) = '' then
    raise exception 'playbook category is required';
  end if;
  if p_decision not in ('conceded','rejected') then
    raise exception 'invalid decision: %', p_decision;
  end if;

  select status, invoice_id into v_status, v_invoice
    from invoice_disputes where id = p_id for update;
  if not found then
    raise exception 'dispute not found: %', p_id;
  end if;
  if v_status <> 'open' then
    raise exception 'already decided: %', p_id;
  end if;

  perform set_config('truedeed.dispute_decide', 'on', true);
  update invoice_disputes
     set status = p_decision,
         category = p_category,
         decided_by = p_admin,
         decided_at = now(),
         decision_reason = p_reason
   where id = p_id;
  perform set_config('truedeed.dispute_decide', '', true);

  if p_decision = 'conceded' then
    perform public.transition_invoice(
      v_invoice, 'dispute_resolved-upheld', null, p_admin
    );
  else
    perform public.transition_invoice(
      v_invoice, 'dispute_resolved-rejected', null, p_admin
    );
  end if;
end $$;

revoke execute on function
  public.decide_invoice_dispute(uuid, uuid, text, text, text)
from public, anon, authenticated;
grant execute on function
  public.decide_invoice_dispute(uuid, uuid, text, text, text)
to service_role;

-- ---------------------------------------------------------------------------
-- 4. RLS — agents read/insert their own (via the invoice's org_agent_id +
--    raised_by = auth.uid()); admins read all; no authenticated UPDATE/DELETE.
-- ---------------------------------------------------------------------------

alter table public.invoice_disputes enable row level security;

revoke update, delete on public.invoice_disputes
from anon, authenticated;

create policy invoice_disputes_select_own_or_admin
  on public.invoice_disputes for select
  using (
    exists (
      select 1 from public.invoices i
       where i.id = invoice_id
         and i.org_agent_id = auth.uid()
    )
    or exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.is_admin)
  );

create policy invoice_disputes_insert_own
  on public.invoice_disputes for insert
  with check (
    raised_by = auth.uid()
    and exists (
      select 1 from public.invoices i
       where i.id = invoice_id
         and i.org_agent_id = auth.uid()
    )
  );
