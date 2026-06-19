-- ============================================================================
-- postcode_geography — ONS Postcode Directory (ONSPD) reference lookup,
-- keyed by normalised postcode (uppercase, no spaces).
--
-- Source: ONS Postcode Directory (ONSPD), Office for National Statistics,
-- Open Government Licence v3.0.
-- https://geoportal.statistics.gov.uk/datasets/ons-postcode-directory
--
-- Reference data: PUBLIC-READ (anon + authenticated), like the other local-area
-- layers. Writes happen only via the service role / direct DB connection at
-- ingest time (Task 5 ingest scripts), which bypasses RLS — so there are no
-- write policies here.
--
-- Populated by: scripts/ingest-onspd.mjs (Task 5)
-- ============================================================================

create extension if not exists postgis;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.postcode_geography (
  postcode_normalised  text primary key,               -- e.g. 'SW1A1AA' — join key
  postcode_display     text not null,                  -- e.g. 'SW1A 1AA' — human display
  latitude             double precision,
  longitude            double precision,
  lsoa_cd              text,                           -- Lower Super Output Area code
  msoa_cd              text,                           -- Middle Super Output Area code
  lad_cd               text,                           -- Local Authority District code
  lad_name             text,                           -- Local Authority District name
  ward_cd              text,                           -- Electoral ward code
  region               text,                           -- Region name (e.g. 'London')
  postcode_area        text,                           -- e.g. 'SW'
  postcode_district    text,                           -- e.g. 'SW1A'
  postcode_sector      text,                           -- e.g. 'SW1A 1'
  output_area          text,                           -- Census Output Area code
  coordinates          geography(point, 4326),         -- PostGIS point for spatial queries
  updated_at           timestamptz default now()
);

comment on table public.postcode_geography is
  'ONS Postcode Directory (ONSPD) reference data — one row per active UK postcode. '
  'Keyed on postcode_normalised (uppercase, no spaces). '
  'Source: ONS, OGL v3.0.';

comment on column public.postcode_geography.postcode_normalised is
  'Normalised postcode used as the join key (uppercase, spaces stripped). E.g. ''SW1A1AA''.';
comment on column public.postcode_geography.postcode_display is
  'Human-readable postcode with standard spacing. E.g. ''SW1A 1AA''.';
comment on column public.postcode_geography.coordinates is
  'PostGIS GEOGRAPHY(POINT,4326) computed from latitude/longitude. Populated by ingest script.';
comment on column public.postcode_geography.lsoa_cd is
  'Lower Super Output Area code (ONS Census 2021 boundaries).';
comment on column public.postcode_geography.msoa_cd is
  'Middle Super Output Area code (ONS Census 2021 boundaries).';
comment on column public.postcode_geography.lad_cd is
  'Local Authority District code (e.g. ''E09000033'').';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_postcode_geography_lad_cd
  on public.postcode_geography using btree (lad_cd);

create index if not exists idx_postcode_geography_msoa_cd
  on public.postcode_geography using btree (msoa_cd);

create index if not exists idx_postcode_geography_lsoa_cd
  on public.postcode_geography using btree (lsoa_cd);

create index if not exists idx_postcode_geography_postcode_district
  on public.postcode_geography using btree (postcode_district);

create index if not exists idx_postcode_geography_postcode_sector
  on public.postcode_geography using btree (postcode_sector);

create index if not exists idx_postcode_geography_coordinates
  on public.postcode_geography using gist (coordinates);

-- ---------------------------------------------------------------------------
-- RLS — public read, no write policies (service role bypasses RLS)
-- ---------------------------------------------------------------------------

alter table public.postcode_geography enable row level security;

drop policy if exists postcode_geography_public_read on public.postcode_geography;
create policy postcode_geography_public_read
  on public.postcode_geography
  for select
  to anon, authenticated
  using (true);
