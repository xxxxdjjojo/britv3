-- Landlord Deadline Diary profiles — the 2–3 personalisation answers captured
-- alongside a landlord_diary newsletter subscription (Influence Strategy 3.2).
--
-- One row per email (case-insensitive, upserted). Keyed by email rather than
-- a subscriber FK on purpose: the newsletter row may not exist yet when the
-- profile lands (the two POSTs race), and profiles must survive an
-- unsubscribe/resubscribe cycle.

create table if not exists public.landlord_diary_profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  tenancy_pre_may boolean,
  region text,
  has_agent boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive uniqueness: one profile per email regardless of casing.
create unique index if not exists landlord_diary_profiles_email_lower_idx
  on public.landlord_diary_profiles (lower(email));

-- RLS on, with NO anon/authenticated policies on purpose: every read and write
-- goes through server-side code using the service role, which bypasses RLS.
-- No client ever touches this table directly, so leaving it with zero
-- policies denies all public access by default (same posture as
-- newsletter_subscribers).
alter table public.landlord_diary_profiles enable row level security;
