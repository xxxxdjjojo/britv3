-- ============================================================================
-- geography_boundaries — ONS Open Geography Portal polygon boundaries for
-- the market-map choropleth layer.
--
-- Source: ONS Open Geography Portal,
-- https://geoportal.statistics.gov.uk/
-- Open Government Licence v3.0.
--
-- Supported levels:
--   local_authority   — Local Authority Districts (LAD)
--   postcode_district — Postcode districts (e.g. SW1A)
--   msoa              — Middle Super Output Areas
--   lsoa              — Lower Super Output Areas
--   postcode_sector   — Postcode sectors (e.g. SW1A 1)
--   street            — Street-level aggregation (virtual; no polygon boundary)
--
-- Reference data: PUBLIC-READ (anon + authenticated). Writes happen only via
-- the service role / direct DB at ingest time (Task 5), which bypasses RLS.
--
-- Populated by: scripts/ingest-boundaries.mjs (Task 5)
-- ============================================================================

create extension if not exists postgis;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.geography_boundaries (
  id        bigint generated always as identity primary key,
  level     text not null
    check (level in (
      'local_authority',
      'postcode_district',
      'msoa',
      'lsoa',
      'postcode_sector',
      'street'
    )),
  area_id   text not null,   -- e.g. LAD code, MSOA code, district string
  area_name text not null,   -- human-readable label for the area
  geometry  geometry(multipolygon, 4326) not null,
  unique (level, area_id)
);

comment on table public.geography_boundaries is
  'ONS Open Geography Portal polygon boundaries for market-map choropleth rendering. '
  'One row per (level, area_id) pair. '
  'Source: ONS Open Geography Portal, OGL v3.0.';

comment on column public.geography_boundaries.level is
  'Aggregation level: local_authority | postcode_district | msoa | lsoa | postcode_sector | street.';
comment on column public.geography_boundaries.area_id is
  'Unique identifier for the area at the given level '
  '(e.g. LAD code ''E09000033'', MSOA code ''E02000001'', district ''SW1A'').';
comment on column public.geography_boundaries.area_name is
  'Human-readable area name (e.g. ''Westminster'', ''SW1A'').';
comment on column public.geography_boundaries.geometry is
  'PostGIS MultiPolygon in EPSG:4326. Use ST_Envelope for bbox, ST_Centroid for centroid.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- spatial index for intersection / containment queries
create index if not exists idx_geography_boundaries_geometry
  on public.geography_boundaries using gist (geometry);

-- btree for level + area_id lookups (used by market_map_area_bounds)
create index if not exists idx_geography_boundaries_level_area
  on public.geography_boundaries using btree (level, area_id);

-- ---------------------------------------------------------------------------
-- RLS — public read, no write policies (service role bypasses RLS)
-- ---------------------------------------------------------------------------

alter table public.geography_boundaries enable row level security;

drop policy if exists geography_boundaries_public_read on public.geography_boundaries;
create policy geography_boundaries_public_read
  on public.geography_boundaries
  for select
  to anon, authenticated
  using (true);
