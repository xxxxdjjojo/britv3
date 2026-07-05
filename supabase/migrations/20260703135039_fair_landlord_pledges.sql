-- Fair Landlord Register: landlord pledge table (Influence Strategy 3.4)
--
-- Landlords self-select to sign a public charter of good practice.
-- This is a pledge, not a vetting service — no legal due-diligence is performed.
-- Status flow: pending → published (admin action) | revoked (landlord action).

create table fair_landlord_pledges (
  id           uuid primary key default gen_random_uuid(),
  landlord_id  uuid not null references auth.users (id) on delete cascade,
  display_name text,
  area         text,
  pledged_at   timestamptz not null default now(),
  status       text not null default 'pending'
               check (status in ('pending', 'published', 'revoked'))
);

-- One active pledge per landlord (pending or published).
-- Revoked rows are kept for audit; a landlord may re-pledge after revocation.
create unique index fair_landlord_pledges_landlord_active_idx
  on fair_landlord_pledges (landlord_id)
  where status in ('pending', 'published');

alter table fair_landlord_pledges enable row level security;

-- Public read: published rows only.
create policy "public read published"
  on fair_landlord_pledges
  for select
  using (status = 'published');

-- Authenticated landlords may insert their own pledge.
create policy "landlord insert own"
  on fair_landlord_pledges
  for insert
  with check (
    landlord_id = (select auth.uid())
    and (
      select raw_app_meta_data->>'role'
      from auth.users
      where id = auth.uid()
    ) = 'landlord'
  );

-- Landlords may update (revoke) their own pledge.
create policy "landlord update own"
  on fair_landlord_pledges
  for update
  using (landlord_id = (select auth.uid()));
