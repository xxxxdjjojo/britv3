-- ============================================================================
-- mobility_scores — precomputed walk / transit / bike scores per property, for
-- the property-detail Local Area "Mobility" widget.
--
-- Scores are an INDEPENDENT estimate (not the trademarked Walk Score®),
-- computed offline by scripts/ingest-mobility-scores.mjs from:
--   * OpenStreetMap amenities + cycleways (Overpass API, ODbL) — walk & bike
--   * our transport_stops table (NaPTAN/DfT, OGL v3.0) — transit
-- Precomputed (not live-at-render) because Overpass is rate-limited/unreliable;
-- the page reads instantly from here, like the other DB-backed local-area layers.
--
-- Reference data: PUBLIC-READ (anon + authenticated). Writes happen only via the
-- service role / direct DB connection at ingest time (bypasses RLS) — no write
-- policies. Keyed by property_id; recompute is an idempotent upsert.
-- ============================================================================

create table if not exists public.mobility_scores (
  property_id         uuid primary key references public.properties(id) on delete cascade,
  walk_score          smallint check (walk_score between 0 and 100),
  transit_score       smallint check (transit_score between 0 and 100),
  bike_score          smallint check (bike_score between 0 and 100),
  walk_amenity_count  integer,   -- basis/transparency: amenities counted nearby
  transit_stop_count  integer,   -- basis: transport stops counted nearby
  bike_cycleway_count integer,   -- basis: cycleway segments counted nearby
  source              text not null default 'osm+naptan',
  computed_at         timestamptz not null default now()
);

comment on table public.mobility_scores is
  'Independent walk/transit/bike mobility scores per property (0-100), computed from OpenStreetMap (ODbL) + NaPTAN transport_stops (OGL v3.0). Not affiliated with Walk Score(R).';

-- ---------------------------------------------------------------------------
-- RLS — public read, no write policies (service role bypasses RLS)
-- ---------------------------------------------------------------------------

alter table public.mobility_scores enable row level security;

drop policy if exists mobility_scores_public_read on public.mobility_scores;
create policy mobility_scores_public_read
  on public.mobility_scores
  for select
  to anon, authenticated
  using (true);
