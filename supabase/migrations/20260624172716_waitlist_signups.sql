-- Coming-soon waitlist + referral queue.
--
-- One row per email on the early-access list. `referral_code` is the public
-- share token; `referred_by` is a SOFT reference to another row's
-- `referral_code` (intentionally NO foreign key — a bogus `?ref=` value in a
-- share link must never break a signup insert).

create extension if not exists citext;

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  referral_code text not null unique,
  referred_by text,
  variant text,
  created_at timestamptz not null default now()
);

-- Referral lookups: count how many signups a given code brought in.
create index if not exists waitlist_signups_referred_by_idx
  on public.waitlist_signups (referred_by);

-- Position lookups: head-count of rows by signup time.
create index if not exists waitlist_signups_created_at_idx
  on public.waitlist_signups (created_at);

-- RLS on, with NO anon/authenticated policies on purpose: every read and write
-- goes through the server-side waitlist service using the service role, which
-- bypasses RLS. No client ever touches this table directly, so leaving it with
-- zero policies denies all public access by default.
alter table public.waitlist_signups enable row level security;
