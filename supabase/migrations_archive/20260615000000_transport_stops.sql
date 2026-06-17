-- ============================================================================
-- transport_stops — NaPTAN station reference data for the property-detail
-- Local Area "Transport" widget.
--
-- Source: NaPTAN access-nodes (DfT, Open Government Licence v3.0). Ingested by
-- scripts/ingest-naptan.mjs, filtered to STATION-level stops only — rail
-- (RLY), metro/tram/underground (MET) and ferry (FER/FBT). On-street bus stops
-- are intentionally excluded (too dense to be useful on a property page).
--
-- Reference data: PUBLIC-READ (anon + authenticated), like the rest of the
-- local-area layers. Writes happen only via the service role / direct DB
-- connection at ingest time, which bypasses RLS — so there are no write
-- policies. Idempotent: keyed on the NaPTAN ATCOCode.
-- ============================================================================

create extension if not exists postgis;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.transport_stops (
  id          uuid primary key default gen_random_uuid(),
  atco_code   text not null unique,                 -- NaPTAN ATCOCode (natural key)
  name        text not null,                        -- NaPTAN CommonName
  stop_type   text not null
    check (stop_type in ('rail', 'tube', 'tram', 'ferry')),
  coordinates geography(point, 4326) not null,
  locality    text,
  source      text not null default 'naptan',
  created_at  timestamptz not null default now()
);

comment on table public.transport_stops is
  'NaPTAN station-level transport stops (rail/tube/tram/ferry) for the property Local Area widget. Source: DfT NaPTAN, OGL v3.0.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_transport_stops_coordinates
  on public.transport_stops using gist (coordinates);

-- ---------------------------------------------------------------------------
-- Nearest-stations lookup (PostGIS). DISTINCT ON (name) collapses multiple
-- access points that share a station name to the nearest one.
-- ---------------------------------------------------------------------------

create or replace function public.get_nearby_transport_stops(
  center_lat    double precision,
  center_lng    double precision,
  radius_meters double precision default 8000,
  max_results   integer default 6
)
returns table (
  name            text,
  stop_type       text,
  distance_meters double precision
) as $$
  select d.name, d.stop_type, d.distance_meters
  from (
    select distinct on (s.name)
      s.name,
      s.stop_type,
      st_distance(
        s.coordinates,
        st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography
      ) as distance_meters
    from public.transport_stops s
    where st_dwithin(
      s.coordinates,
      st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography,
      radius_meters
    )
    order by s.name, distance_meters asc
  ) d
  order by d.distance_meters asc
  limit max_results;
$$ language sql stable;

-- ---------------------------------------------------------------------------
-- RLS — public read, no write policies (service role bypasses RLS)
-- ---------------------------------------------------------------------------

alter table public.transport_stops enable row level security;

drop policy if exists transport_stops_public_read on public.transport_stops;
create policy transport_stops_public_read
  on public.transport_stops
  for select
  to anon, authenticated
  using (true);

grant execute on function public.get_nearby_transport_stops(
  double precision, double precision, double precision, integer
) to anon, authenticated;
