-- ============================================================================
-- sold-parcels: OS Open UPRN → public.os_open_uprn
--
-- WHAT: UPRN → precise coordinate. Populated by scripts/ingest-os-open-uprn.mjs
-- from the OS Open UPRN national CSV (filtered to the UPRNs present in
-- epc_certificates — ~0.8M of the 40M national rows — to keep it small).
--
-- WHY: an EPC carries a UPRN but no coordinate. To snap a sale to its parcel we
-- need a precise point: PPD sale → EPC (uprn) → os_open_uprn (lat/lng) →
-- point-in-polygon vs parcels. The CSV already ships WGS84 lat/lng, so no
-- reprojection is needed. Sales whose UPRN is missing here fall back to the
-- postcode centroid (flagged) in the materialisation.
--
-- Internal lookup table: RLS on, NO public policy (never read by the browser;
-- the materialisation runs as service_role, which bypasses RLS).
--
-- ATTRIBUTION (OS Open UPRN, shown with INSPIRE geometry):
--   "© Crown copyright and database rights {year} Ordnance Survey AC0000851063."
--
-- ROLLBACK: drop table public.os_open_uprn;
-- ============================================================================

create table if not exists public.os_open_uprn (
  uprn      bigint primary key,
  latitude  double precision not null,
  longitude double precision not null,
  geom      geometry(Point, 4326) generated always as
              (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) stored
);

create index if not exists os_open_uprn_geom_gist on public.os_open_uprn using gist (geom);

alter table public.os_open_uprn enable row level security;
-- intentionally no policy: locked to service_role / postgres only.
