-- ============================================================================
-- schools — DfE GIAS establishment reference data for the property-detail
-- Local Area "Schools" widget.
--
-- Source: DfE Get Information About Schools (GIAS) bulk establishment export
-- joined to Ofsted "latest inspections" management information for the legacy
-- overall-effectiveness grade (Open Government Licence v3.0). Ingested by
-- scripts/ingest-gias-schools.mjs, filtered to Open establishments that have a
-- real PhaseOfEducation (Primary/Secondary/All-through/Nursery/16 plus/Middle
-- etc.); non-schools with no phase (e.g. children's centres) are excluded.
--
-- Reference data: PUBLIC-READ (anon + authenticated), like the rest of the
-- local-area layers. Writes happen only via the service role / direct DB
-- connection at ingest time, which bypasses RLS — so there are no write
-- policies. Idempotent: keyed on the GIAS URN.
-- ============================================================================

create extension if not exists postgis;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.schools (
  id                 uuid primary key default gen_random_uuid(),
  urn                text not null unique,             -- GIAS URN (natural key)
  name               text not null,                    -- GIAS EstablishmentName
  phase              text,                             -- GIAS PhaseOfEducation (name)
  establishment_type text,                             -- GIAS TypeOfEstablishment (name)
  ofsted_rating      text
    check (ofsted_rating is null or ofsted_rating in
      ('Outstanding', 'Good', 'Requires improvement', 'Inadequate')),
  coordinates        geography(point, 4326) not null,
  street             text,
  locality           text,
  town               text,
  postcode           text,
  la_name            text,
  source             text not null default 'gias',
  created_at         timestamptz not null default now()
);

comment on table public.schools is
  'GIAS school establishments (Open, with a real phase) for the property Local Area widget. Source: DfE GIAS + Ofsted management information, OGL v3.0.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_schools_coordinates
  on public.schools using gist (coordinates);

-- ---------------------------------------------------------------------------
-- Nearest-schools lookup (PostGIS). Each school is one row keyed by URN, so no
-- DISTINCT ON is needed — simply order by distance and limit.
-- ---------------------------------------------------------------------------

create or replace function public.get_nearby_schools(
  center_lat    double precision,
  center_lng    double precision,
  radius_meters double precision default 4800,
  max_results   integer default 8
)
returns table (
  name               text,
  phase              text,
  establishment_type text,
  ofsted_rating      text,
  street             text,
  locality           text,
  town               text,
  postcode           text,
  urn                text,
  distance_meters    double precision
) as $$
  select
    s.name,
    s.phase,
    s.establishment_type,
    s.ofsted_rating,
    s.street,
    s.locality,
    s.town,
    s.postcode,
    s.urn,
    st_distance(
      s.coordinates,
      st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography
    ) as distance_meters
  from public.schools s
  where st_dwithin(
    s.coordinates,
    st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography,
    radius_meters
  )
  order by distance_meters asc
  limit max_results;
$$ language sql stable;

-- ---------------------------------------------------------------------------
-- RLS — public read, no write policies (service role bypasses RLS)
-- ---------------------------------------------------------------------------

alter table public.schools enable row level security;

drop policy if exists schools_public_read on public.schools;
create policy schools_public_read
  on public.schools
  for select
  to anon, authenticated
  using (true);

grant execute on function public.get_nearby_schools(
  double precision, double precision, double precision, integer
) to anon, authenticated;
