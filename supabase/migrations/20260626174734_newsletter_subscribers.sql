-- Newsletter subscribers — emails captured from the blog and gated lead magnets.
--
-- One row per subscriber email. `source` records where the subscription came
-- from (e.g. 'blog', 'landlord_guide'); `status` toggles between 'subscribed'
-- and 'unsubscribed'. Email is stored lower-cased and de-duplicated via a
-- case-insensitive unique index so re-subscribing the same address is idempotent.

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'blog',
  status text not null default 'subscribed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive uniqueness: one subscription per email regardless of casing.
create unique index if not exists newsletter_subscribers_email_lower_idx
  on public.newsletter_subscribers (lower(email));

-- RLS on, with NO anon/authenticated policies on purpose: every read and write
-- goes through the server-side newsletter service using the service role, which
-- bypasses RLS. No client ever touches this table directly, so leaving it with
-- zero policies denies all public access by default (same posture as
-- waitlist_signups).
alter table public.newsletter_subscribers enable row level security;
