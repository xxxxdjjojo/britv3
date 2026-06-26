-- Role-based lifecycle email drip sequences (renter, homebuyer, landlord,
-- seller, agent). Orchestrated by the Inngest function lifecycle-drip, which
-- enrols a user on role assignment and steps through LIFECYCLE_SEQUENCES.
--
-- Both tables are written ONLY by the server-side lifecycle email service via
-- the Supabase service role (which bypasses RLS). RLS is enabled with NO
-- public policies on purpose: no anon/authenticated client ever touches these
-- tables, so zero policies denies all public access by default.

-- One enrolment row per (user_id, role). The unique constraint makes the
-- enrolment insert idempotent — re-firing lifecycle/role.assigned can't
-- double-enrol the same user into the same role's sequence.
create table if not exists public.lifecycle_email_enrolments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  status text not null default 'active'
    check (status in ('active', 'completed', 'stopped')),
  enrolled_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role)
);

comment on table public.lifecycle_email_enrolments is
  'One row per user+role lifecycle email enrolment. Service-role only.';

create index if not exists lifecycle_email_enrolments_user_idx
  on public.lifecycle_email_enrolments (user_id);

-- One row per actually-sent step. The unique constraint on
-- (user_id, role, step_key) is the per-step idempotency key: it blocks a
-- re-send if Inngest replays a step.
create table if not exists public.lifecycle_email_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  step_key text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, role, step_key)
);

comment on table public.lifecycle_email_sends is
  'One row per sent lifecycle drip step; unique (user_id, role, step_key) is the per-step idempotency guard. Service-role only.';

create index if not exists lifecycle_email_sends_user_idx
  on public.lifecycle_email_sends (user_id);

-- RLS on, NO policies — service-role writes only, all public access denied.
alter table public.lifecycle_email_enrolments enable row level security;
alter table public.lifecycle_email_sends enable row level security;
