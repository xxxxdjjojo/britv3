-- ============================================================================
-- Truedeed Phase 2 — reported outcomes + invoice candidates
-- Spec: docs/truedeed/attribution-tracking-spec.md §2 + §5
--
-- reported_outcomes is fully append-only (truedeed_forbid_mutation, same as
-- Phase 1 ledger tables). invoice_candidates has exactly one controlled write
-- path: review_invoice_candidate(), a SECURITY DEFINER function that gates a
-- guard trigger via the transaction-local GUC truedeed.review and may change
-- only the review fields (status / reviewed_by / reviewed_at / review_note /
-- hold_expires_at). DELETE is always forbidden on both tables.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table public.reported_outcomes (
  id uuid primary key default gen_random_uuid(),
  introduction_id uuid not null references public.introductions(id),
  reported_by uuid not null,
  outcome text not null check (outcome in
    ('offer_accepted','exchanged','completed','fell_through',
     'tenancy_commenced','tenancy_abandoned')),
  completion_date date,                              -- required when outcome='completed'
  agreed_price_pence bigint,                         -- required when outcome='completed'
  reported_at timestamptz not null default now(),
  constraint reported_outcomes_completed_requires_details check (
    outcome <> 'completed'
    or (completion_date is not null and agreed_price_pence is not null)
  )
);
create index idx_reported_outcomes_intro
  on public.reported_outcomes (introduction_id);

create table public.invoice_candidates (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('agent_report','audit_match')),
  introduction_id uuid not null references public.introductions(id),
  reported_outcome_id uuid references public.reported_outcomes(id),
  ppd_match_id uuid,                  -- FK added when ppd_match_candidates lands (Phase 3)
  amount_pence bigint not null default 24900,        -- £249 introduction fee
  vat_pence bigint not null default 4980,            -- 20% VAT
  status text not null default 'pending_review'
    check (status in ('pending_review','on_hold_branch_query','approved',
                      'invoiced','rejected')),
  hold_expires_at timestamptz,        -- branch query: 10 business days (clause 10.2)
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);
create index idx_invoice_candidates_intro
  on public.invoice_candidates (introduction_id);
create index idx_invoice_candidates_outcome
  on public.invoice_candidates (reported_outcome_id);

-- ---------------------------------------------------------------------------
-- 2. Append-only enforcement (fires for ALL roles incl. superuser)
-- ---------------------------------------------------------------------------

-- reported_outcomes: no mutation path at all (Phase 1 idiom).
create trigger reported_outcomes_immutable
  before update or delete on public.reported_outcomes
  for each row execute function public.truedeed_forbid_mutation();

-- invoice_candidates: UPDATE allowed only under review_invoice_candidate()'s
-- transaction-local GUC, and only on the review fields. DELETE never.
create or replace function public.truedeed_invoice_candidates_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'append-only table: DELETE blocked on invoice_candidates';
  end if;
  if current_setting('truedeed.review', true) = 'on'
     and new.id = old.id
     and new.source = old.source
     and new.introduction_id = old.introduction_id
     and new.reported_outcome_id is not distinct from old.reported_outcome_id
     and new.ppd_match_id is not distinct from old.ppd_match_id
     and new.amount_pence = old.amount_pence
     and new.vat_pence = old.vat_pence
     and new.created_at = old.created_at then
    return new;
  end if;
  raise exception 'append-only table: UPDATE blocked on invoice_candidates';
end $$;

create trigger invoice_candidates_guard
  before update or delete on public.invoice_candidates
  for each row execute function public.truedeed_invoice_candidates_guard();

-- ---------------------------------------------------------------------------
-- 3. Controlled write path (SECURITY DEFINER; service_role-only execution)
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

revoke execute on function
  public.review_invoice_candidate(uuid, uuid, text, text)
from public, anon, authenticated;
grant execute on function
  public.review_invoice_candidate(uuid, uuid, text, text)
to service_role;

-- ---------------------------------------------------------------------------
-- 4. RLS — branch side reports/reads its own outcomes; invoice_candidates are
--    internal ops only (admin read, service-role writes; default-deny INSERT
--    for authenticated).
-- ---------------------------------------------------------------------------

alter table public.reported_outcomes enable row level security;
alter table public.invoice_candidates enable row level security;

revoke update, delete on
  public.reported_outcomes, public.invoice_candidates
from anon, authenticated;

-- Branch side may report an outcome, only for its own introduction, only as
-- itself (same shape as Phase 1's rebuttal_insert, no deadline condition).
create policy outcome_insert_branch on public.reported_outcomes for insert
  with check (
    reported_by = auth.uid()
    and exists (
      select 1 from public.introductions i
       where i.id = introduction_id
         and (i.agent_id = auth.uid()
              or (i.branch_id is not null and exists (
                select 1 from public.agent_team_members tm
                 where tm.branch_id = i.branch_id and tm.user_id = auth.uid())))
    )
  );

create policy outcome_select_branch on public.reported_outcomes for select
  using (
    exists (
      select 1 from public.introductions i
       where i.id = introduction_id
         and (i.agent_id = auth.uid()
              or (i.branch_id is not null and exists (
                select 1 from public.agent_team_members tm
                 where tm.branch_id = i.branch_id and tm.user_id = auth.uid()))))
    or exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.is_admin)
  );

create policy invoice_candidates_select_admin on public.invoice_candidates for select
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid() and p.is_admin));
