-- ============================================================================
-- broadband_coverage — Ofcom Connected Nations fixed-broadband availability,
-- keyed by postcode, for the property-detail Local Area "Broadband" widget.
--
-- Source: Ofcom Connected Nations 2025, fixed postcode coverage (Open
-- Government Licence v3.0). Ingested by scripts/ingest-ofcom-broadband.mjs.
--
-- Ofcom's postcode open data expresses connectivity as AVAILABILITY
-- PERCENTAGES per speed tier (the % of premises in the postcode that can get
-- that tier) — it carries no single download/upload Mbit/s figure and no
-- upload data, so we store the tier availabilities verbatim and let the widget
-- derive the fastest available tier. No fabricated speeds.
--
-- Reference data: PUBLIC-READ (anon + authenticated), like the other local-area
-- layers. Writes happen only via the service role / direct DB connection at
-- ingest time, which bypasses RLS — so there are no write policies.
-- ============================================================================

create table if not exists public.broadband_coverage (
  postcode      text primary key,            -- normalised: uppercase, no spaces (e.g. AL100AA)
  sfbb_pct      numeric(5, 2),               -- Superfast (>=30 Mbit/s) availability, % of premises
  ufbb_pct      numeric(5, 2),               -- Ultrafast (>=300 Mbit/s) availability, % of premises
  gigabit_pct   numeric(5, 2),               -- Gigabit-capable availability, % of premises
  below_uso_pct numeric(5, 2),               -- premises below the Universal Service Obligation, %
  source        text not null default 'ofcom-cn2025',
  updated_at    timestamptz not null default now()
);

comment on table public.broadband_coverage is
  'Ofcom Connected Nations 2025 fixed-broadband availability by postcode (% of premises per tier). Source: Ofcom, OGL v3.0.';

-- ---------------------------------------------------------------------------
-- RLS — public read, no write policies (service role bypasses RLS)
-- ---------------------------------------------------------------------------

alter table public.broadband_coverage enable row level security;

drop policy if exists broadband_coverage_public_read on public.broadband_coverage;
create policy broadband_coverage_public_read
  on public.broadband_coverage
  for select
  to anon, authenticated
  using (true);
