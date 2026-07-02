-- Newsletter audiences — one subscription row per (email, audience).
--
-- Adds an `audience` discriminator to newsletter_subscribers so the same email
-- can independently subscribe to the consumer newsletter, the Independent
-- Agent Briefing, the Landlord Deadline Diary, and the FTB Bootcamp.
-- Double-opt-in audiences use status 'pending' until the confirm link is
-- clicked (`confirmed_at` records when). The old lower(email) unique index is
-- replaced by a (lower(email), audience) composite so per-audience
-- resubscribes stay idempotent.

alter table public.newsletter_subscribers
  add column if not exists audience text not null default 'consumer';

alter table public.newsletter_subscribers
  add column if not exists confirmed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'newsletter_subscribers_audience_check'
      and conrelid = 'public.newsletter_subscribers'::regclass
  ) then
    alter table public.newsletter_subscribers
      add constraint newsletter_subscribers_audience_check
      check (audience in ('consumer', 'agent_briefing', 'landlord_diary', 'ftb_bootcamp'));
  end if;

  -- Status is now a three-state text column: pending (awaiting double-opt-in
  -- confirmation) | subscribed | unsubscribed. Existing rows only ever hold
  -- 'subscribed' or 'unsubscribed', so the CHECK is safe to add.
  if not exists (
    select 1 from pg_constraint
    where conname = 'newsletter_subscribers_status_check'
      and conrelid = 'public.newsletter_subscribers'::regclass
  ) then
    alter table public.newsletter_subscribers
      add constraint newsletter_subscribers_status_check
      check (status in ('pending', 'subscribed', 'unsubscribed'));
  end if;
end;
$$;

-- Replace the email-only unique index with a per-audience composite.
drop index if exists public.newsletter_subscribers_email_lower_idx;

create unique index if not exists newsletter_subscribers_email_lower_audience_idx
  on public.newsletter_subscribers (lower(email), audience);
