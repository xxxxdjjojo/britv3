-- ============================================================================
-- Truedeed Phase 1 — introductions ledger (append-only, hash-chained)
-- Design: docs/superpowers/specs/2026-06-12-truedeed-phase1-introductions-ledger-design.md
-- Spec:   docs/truedeed/attribution-tracking-spec.md §2–§3
--
-- Evidence-grade tables: append-only enforced by triggers (fire even for
-- superuser/service_role), with exactly three controlled write paths, each
-- gated by a transaction-local GUC set inside a SECURITY DEFINER function:
--   truedeed.allow_notify  — one-shot notified_at/rebuttal_deadline write
--   truedeed.gdpr_scrub    — PII erasure (applicant fields only)
--   truedeed.decide        — rebuttal decision fields (once)
-- The row hash covers identity fields + occurred_at only, so notification
-- and GDPR scrubbing never break chain verification.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Extend existing tables (schema reconciliation: reuse, don't duplicate)
-- ---------------------------------------------------------------------------

alter table public.listings
  add column if not exists branch_id uuid references public.agent_branches(id);
create index if not exists idx_listings_branch_id on public.listings (branch_id);

-- Legal-entity binding for the Network Agreement (populated at Phase 4 onboarding).
alter table if exists public.agent_agency_profiles
  add column if not exists company_number text;

-- ---------------------------------------------------------------------------
-- 2. Ledger tables
-- ---------------------------------------------------------------------------

create table public.introductions (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid references auth.users(id),     -- nullable only after GDPR scrub
  applicant_name text not null,                    -- evidence snapshot at insert
  applicant_email text not null,                   -- evidence snapshot at insert
  listing_id uuid not null references public.listings(id),
  agent_id uuid not null references auth.users(id),
  branch_id uuid references public.agent_branches(id),
  first_contact_type text not null
    check (first_contact_type in ('enquiry','viewing_request','message')),
  occurred_at timestamptz not null default now(),  -- THE timestamp
  notified_at timestamptz,                         -- set once via mark_introduction_notified
  rebuttal_deadline timestamptz,                   -- notified_at + 5 business days (computed in app layer)
  tail_expires_at timestamptz not null,            -- occurred_at + 6 months (set by trigger)
  prev_hash text,
  row_hash text not null,
  unique (applicant_id, listing_id)                -- "FIRST registered contact" semantics
);

create index idx_introductions_agent on public.introductions (agent_id);
create index idx_introductions_listing on public.introductions (listing_id);
create index idx_introductions_applicant on public.introductions (applicant_id);
create index idx_introductions_branch on public.introductions (branch_id);
create index idx_introductions_occurred on public.introductions (occurred_at desc);

create table public.introduction_status_history (
  id bigint generated always as identity primary key,
  introduction_id uuid not null references public.introductions(id),
  status text not null check (status in
    ('active','rebutted','cancelled_manifest_error','converted_sstc',
     'converted_exchanged','converted_completed','expired')),
  reason text,
  actor uuid,                                      -- null = system
  created_at timestamptz not null default now()
);
create index idx_intro_status_history_intro
  on public.introduction_status_history (introduction_id, created_at desc);

create table public.introduction_events (
  id bigint generated always as identity primary key,
  introduction_id uuid not null references public.introductions(id),
  event_type text not null check (event_type in
    ('enquiry','viewing_requested','viewing_booked','viewing_attended',
     'viewing_cancelled','message_sent','offer_relayed','note')),
  payload jsonb not null default '{}',             -- ids only, no PII duplication
  created_at timestamptz not null default now()
);
create index idx_intro_events_intro
  on public.introduction_events (introduction_id, created_at desc);

create table public.rebuttals (
  id uuid primary key default gen_random_uuid(),
  introduction_id uuid not null references public.introductions(id),
  submitted_by uuid not null,
  submitted_at timestamptz not null default now(),
  evidence_storage_paths text[] not null,
  evidence_dated_at date not null,                 -- claimed prior contact; must pre-date occurred_at
  decision text check (decision in ('upheld','rejected')),
  decided_by uuid,
  decided_at timestamptz,
  decision_reason text
);
create index idx_rebuttals_intro on public.rebuttals (introduction_id);

create table public.truedeed_audit_log (
  id bigint generated always as identity primary key,
  actor uuid,                                      -- null = system
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index idx_truedeed_audit_entity
  on public.truedeed_audit_log (entity, entity_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Hash chain (BEFORE INSERT; advisory lock prevents concurrent chain forks)
-- ---------------------------------------------------------------------------

create or replace function public.truedeed_set_intro_hash() returns trigger
language plpgsql security definer set search_path = public as $$
declare prev text;
begin
  perform pg_advisory_xact_lock(hashtext('truedeed_introductions_chain'));
  select i.row_hash into prev
    from public.introductions i
   order by i.occurred_at desc, i.id desc
   limit 1;
  new.prev_hash := prev;
  new.tail_expires_at := coalesce(new.tail_expires_at, new.occurred_at + interval '6 months');
  new.row_hash := encode(sha256(convert_to(
    coalesce(prev, 'genesis') || new.id::text || new.applicant_id::text ||
    new.listing_id::text || new.first_contact_type ||
    to_char(new.occurred_at, 'YYYY-MM-DD"T"HH24:MI:SS.US'),
  'utf8')), 'hex');
  return new;
end $$;

create trigger introductions_hash
  before insert on public.introductions
  for each row execute function public.truedeed_set_intro_hash();

-- ---------------------------------------------------------------------------
-- 4. Append-only enforcement (fires for ALL roles incl. superuser)
-- ---------------------------------------------------------------------------

create or replace function public.truedeed_introductions_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'append-only table: DELETE blocked on introductions';
  end if;

  -- Controlled path 1: one-shot notification stamp (mark_introduction_notified)
  if current_setting('truedeed.allow_notify', true) = 'on'
     and old.notified_at is null and old.rebuttal_deadline is null
     and new.notified_at is not null and new.rebuttal_deadline is not null
     and new.id = old.id
     and new.applicant_id is not distinct from old.applicant_id
     and new.applicant_name = old.applicant_name
     and new.applicant_email = old.applicant_email
     and new.listing_id = old.listing_id
     and new.agent_id = old.agent_id
     and new.branch_id is not distinct from old.branch_id
     and new.first_contact_type = old.first_contact_type
     and new.occurred_at = old.occurred_at
     and new.tail_expires_at = old.tail_expires_at
     and new.prev_hash is not distinct from old.prev_hash
     and new.row_hash = old.row_hash then
    return new;
  end if;

  -- Controlled path 2: GDPR erasure of applicant PII (gdpr_scrub_introductions)
  if current_setting('truedeed.gdpr_scrub', true) = 'on'
     and new.applicant_id is null
     and new.applicant_name = '[erased]'
     and new.applicant_email = '[erased]'
     and new.id = old.id
     and new.listing_id = old.listing_id
     and new.agent_id = old.agent_id
     and new.branch_id is not distinct from old.branch_id
     and new.first_contact_type = old.first_contact_type
     and new.occurred_at = old.occurred_at
     and new.notified_at is not distinct from old.notified_at
     and new.rebuttal_deadline is not distinct from old.rebuttal_deadline
     and new.tail_expires_at = old.tail_expires_at
     and new.prev_hash is not distinct from old.prev_hash
     and new.row_hash = old.row_hash then
    return new;
  end if;

  raise exception 'append-only table: UPDATE blocked on introductions';
end $$;

create trigger introductions_immutable
  before update or delete on public.introductions
  for each row execute function public.truedeed_introductions_guard();

create or replace function public.truedeed_forbid_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'append-only table: % blocked on %', tg_op, tg_table_name;
end $$;

create trigger introduction_events_immutable
  before update or delete on public.introduction_events
  for each row execute function public.truedeed_forbid_mutation();
create trigger introduction_status_history_immutable
  before update or delete on public.introduction_status_history
  for each row execute function public.truedeed_forbid_mutation();
create trigger truedeed_audit_log_immutable
  before update or delete on public.truedeed_audit_log
  for each row execute function public.truedeed_forbid_mutation();

-- Rebuttals: decision fields writable exactly once, via decide_rebuttal() only.
create or replace function public.truedeed_rebuttals_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'append-only table: DELETE blocked on rebuttals';
  end if;
  if current_setting('truedeed.decide', true) = 'on'
     and old.decision is null
     and new.decision is not null
     and new.id = old.id
     and new.introduction_id = old.introduction_id
     and new.submitted_by = old.submitted_by
     and new.submitted_at = old.submitted_at
     and new.evidence_storage_paths = old.evidence_storage_paths
     and new.evidence_dated_at = old.evidence_dated_at then
    return new;
  end if;
  raise exception 'append-only table: UPDATE blocked on rebuttals';
end $$;

create trigger rebuttals_guard
  before update or delete on public.rebuttals
  for each row execute function public.truedeed_rebuttals_guard();

-- ---------------------------------------------------------------------------
-- 5. Controlled write paths (SECURITY DEFINER; service_role-only execution)
-- ---------------------------------------------------------------------------

create or replace function public.mark_introduction_notified(
  p_id uuid, p_notified_at timestamptz, p_deadline timestamptz
) returns void
language plpgsql security definer set search_path = public as $$
declare v_notified timestamptz;
begin
  select notified_at into v_notified from introductions where id = p_id for update;
  if not found then
    raise exception 'introduction not found: %', p_id;
  end if;
  if v_notified is not null then
    raise exception 'already notified: %', p_id;
  end if;
  perform set_config('truedeed.allow_notify', 'on', true);
  update introductions
     set notified_at = p_notified_at, rebuttal_deadline = p_deadline
   where id = p_id;
  perform set_config('truedeed.allow_notify', '', true);
end $$;

create or replace function public.gdpr_scrub_introductions(p_user_id uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  perform set_config('truedeed.gdpr_scrub', 'on', true);
  update introductions
     set applicant_id = null,
         applicant_name = '[erased]',
         applicant_email = '[erased]'
   where applicant_id = p_user_id;
  get diagnostics v_count = row_count;
  perform set_config('truedeed.gdpr_scrub', '', true);
  return v_count;
end $$;

create or replace function public.transition_introduction(
  p_id uuid, p_new_status text, p_reason text, p_actor uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare v_current text;
begin
  select status into v_current
    from introduction_status_history
   where introduction_id = p_id
   order by created_at desc, id desc
   limit 1;
  if v_current is null then
    v_current := 'active';
  end if;

  if not (
    (v_current = 'active' and p_new_status in
      ('rebutted','cancelled_manifest_error','expired',
       'converted_sstc','converted_exchanged','converted_completed'))
    or (v_current = 'converted_sstc' and p_new_status in
      ('active','converted_exchanged','converted_completed','expired'))
    or (v_current = 'converted_exchanged' and p_new_status in
      ('active','converted_completed','expired'))
  ) then
    raise exception 'invalid transition: % -> %', v_current, p_new_status;
  end if;

  insert into introduction_status_history (introduction_id, status, reason, actor)
  values (p_id, p_new_status, p_reason, p_actor);
end $$;

create or replace function public.decide_rebuttal(
  p_rebuttal_id uuid, p_admin_id uuid, p_decision text, p_reason text
) returns void
language plpgsql security definer set search_path = public as $$
declare v_decision text;
begin
  if p_decision not in ('upheld','rejected') then
    raise exception 'invalid decision: %', p_decision;
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'decision reason is required';
  end if;
  select decision into v_decision from rebuttals where id = p_rebuttal_id for update;
  if not found then
    raise exception 'rebuttal not found: %', p_rebuttal_id;
  end if;
  if v_decision is not null then
    raise exception 'already decided: %', p_rebuttal_id;
  end if;
  perform set_config('truedeed.decide', 'on', true);
  update rebuttals
     set decision = p_decision,
         decided_by = p_admin_id,
         decided_at = now(),
         decision_reason = p_reason
   where id = p_rebuttal_id;
  perform set_config('truedeed.decide', '', true);
end $$;

revoke execute on function
  public.mark_introduction_notified(uuid, timestamptz, timestamptz),
  public.gdpr_scrub_introductions(uuid),
  public.transition_introduction(uuid, text, text, uuid),
  public.decide_rebuttal(uuid, uuid, text, text)
from public, anon, authenticated;
grant execute on function
  public.mark_introduction_notified(uuid, timestamptz, timestamptz),
  public.gdpr_scrub_introductions(uuid),
  public.transition_introduction(uuid, text, text, uuid),
  public.decide_rebuttal(uuid, uuid, text, text)
to service_role;

-- ---------------------------------------------------------------------------
-- 6. RLS — clients read narrowly; ALL ledger writes are server-side
--    (service_role) so timestamps can never be client-forged. Deliberately no
--    INSERT policies anywhere except rebuttals (default-deny ⇒ RLS violation).
-- ---------------------------------------------------------------------------

alter table public.introductions enable row level security;
alter table public.introduction_status_history enable row level security;
alter table public.introduction_events enable row level security;
alter table public.rebuttals enable row level security;
alter table public.truedeed_audit_log enable row level security;

revoke update, delete on
  public.introductions, public.introduction_status_history,
  public.introduction_events, public.rebuttals, public.truedeed_audit_log
from anon, authenticated;

create policy intro_select_agent on public.introductions for select
  using (
    agent_id = auth.uid()
    or (branch_id is not null and exists (
      select 1 from public.agent_team_members tm
       where tm.branch_id = introductions.branch_id
         and tm.user_id = auth.uid()))
  );

create policy intro_select_applicant on public.introductions for select
  using (applicant_id = auth.uid());

create policy intro_status_select on public.introduction_status_history for select
  using (exists (
    select 1 from public.introductions i
     where i.id = introduction_id
       and (i.agent_id = auth.uid()
            or i.applicant_id = auth.uid()
            or (i.branch_id is not null and exists (
              select 1 from public.agent_team_members tm
               where tm.branch_id = i.branch_id and tm.user_id = auth.uid())))
  ));

create policy intro_events_select on public.introduction_events for select
  using (exists (
    select 1 from public.introductions i
     where i.id = introduction_id
       and (i.agent_id = auth.uid()
            or i.applicant_id = auth.uid()
            or (i.branch_id is not null and exists (
              select 1 from public.agent_team_members tm
               where tm.branch_id = i.branch_id and tm.user_id = auth.uid())))
  ));

-- Branch side may submit a rebuttal, only for its own introduction, only
-- while the window is open, and only as itself.
create policy rebuttal_insert on public.rebuttals for insert
  with check (
    submitted_by = auth.uid()
    and exists (
      select 1 from public.introductions i
       where i.id = introduction_id
         and (i.agent_id = auth.uid()
              or (i.branch_id is not null and exists (
                select 1 from public.agent_team_members tm
                 where tm.branch_id = i.branch_id and tm.user_id = auth.uid())))
         and i.rebuttal_deadline is not null
         and now() <= i.rebuttal_deadline)
  );

create policy rebuttal_select on public.rebuttals for select
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

create policy truedeed_audit_select_admin on public.truedeed_audit_log for select
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid() and p.is_admin));

-- ---------------------------------------------------------------------------
-- 7. Storage: private bucket for rebuttal evidence (service-role access +
--    signed URLs only; no storage.objects policies needed)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('rebuttal-evidence', 'rebuttal-evidence', false)
on conflict (id) do nothing;
