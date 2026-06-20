-- ============================================================================
-- sold-parcels: HM Land Registry INSPIRE Index Polygons → public.parcels
--
-- WHAT: one row per freehold title parcel (the "cadastre" geometry). Populated
-- per-LAD by scripts/ingest-inspire.mjs from the monthly INSPIRE GML download.
-- inspire_id is the LR PREDEFINED feature's gml:id (nationally stable).
--
-- WHY: the high-zoom "sold properties" layer snaps each real Land-Registry sale
-- to its containing parcel (point-in-polygon) and colours it by £/m². Geometry
-- is stored in WGS84 (4326) — the ingest reprojects from the source EPSG:27700.
--
-- LIMITS: INSPIRE is FREEHOLD ONLY. A block of flats is ONE polygon, so flat
-- sales share their building's parcel (surfaced as a list, never per-flat
-- parcels). See market_map_sold_parcels.
--
-- ATTRIBUTION (must be shown wherever this geometry is on screen):
--   "Contains HM Land Registry data © Crown copyright and database right {year}.
--    Licensed under the Open Government Licence v3.0."
--   "© Crown copyright and database rights {year} Ordnance Survey AC0000851063."
--
-- ROLLBACK: drop table public.parcels cascade; drop table public.parcel_ingest_runs;
-- ============================================================================

create table if not exists public.parcel_ingest_runs (
  id            uuid primary key default gen_random_uuid(),
  file_label    text not null,
  file_sha256   text,
  lad_cd        text,
  lad_name      text,
  status        text not null default 'running',
  rows_upserted integer,
  error         text,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);

create table if not exists public.parcels (
  inspire_id    text primary key,
  lad_cd        text,
  lad_name      text,
  geometry      geometry(MultiPolygon, 4326) not null,
  ingest_run_id uuid references public.parcel_ingest_runs(id) on delete set null,
  updated_at    timestamptz not null default now()
);

create index if not exists parcels_geometry_gist on public.parcels using gist (geometry);
create index if not exists parcels_lad_cd_idx     on public.parcels (lad_cd);

alter table public.parcels enable row level security;
alter table public.parcel_ingest_runs enable row level security;

-- Public read on geometry (the map renders it); ingest writes via service_role,
-- which bypasses RLS. No public-insert/update policy by design.
drop policy if exists "parcels public read" on public.parcels;
create policy "parcels public read" on public.parcels for select using (true);

grant select on public.parcels to anon, authenticated;
