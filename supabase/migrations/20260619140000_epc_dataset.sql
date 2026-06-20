-- Bulk EPC dataset backend.
--
-- We dropped the live per-request EPC API (impractical at portal scale) in
-- favour of bulk-loading the downloaded domestic EPC dataset, linking each
-- certificate to its property (UPRN, else postcode + PAON), and denormalising
-- the result onto `properties` so the detail page and renovation algorithm read
-- it instantly. This migration is the storage layer:
--   - epc_certificates : one row per property (latest cert kept by ingest)
--   - epc_ingest_runs  : per-file ingest audit (mirror ppd_ingest_runs)
--   - properties.epc_* : denormalised columns the page/renovation read
--
-- epc_rating / epc_score already exist on properties (003001_property_portal).

-- ---------------------------------------------------------------------------
-- epc_certificates
-- ---------------------------------------------------------------------------
create table if not exists public.epc_certificates (
  certificate_number text primary key,
  uprn text,
  postcode text,
  address1 text,
  address2 text,
  address3 text,
  address_full text,
  paon text,
  -- Dedup key: uprn when present, else normalised "postcode|paon". The ingest
  -- upserts on this and keeps the row with the latest inspection_date, so the
  -- table holds one (latest) certificate per property.
  property_key text,
  current_energy_rating text,
  current_energy_efficiency integer,
  potential_energy_rating text,
  potential_energy_efficiency integer,
  property_type text,
  built_form text,
  total_floor_area numeric,
  construction_age_band text,
  tenure text,
  main_fuel text,
  inspection_date date,
  ingest_run_id uuid,
  updated_at timestamptz not null default now()
);

-- Match keys: postcode gate + PAON compare, and exact UPRN joins. Lean btree
-- only (no trigram) to keep the table small — matching does the PAON compare
-- in-app after the postcode/uprn lookup.
create index if not exists epc_certificates_postcode_idx
  on public.epc_certificates (postcode);
create index if not exists epc_certificates_uprn_idx
  on public.epc_certificates (uprn);
create index if not exists epc_certificates_paon_idx
  on public.epc_certificates (lower(paon));
-- Unique arbiter for the per-property upsert (NULLs are distinct, so rows that
-- cannot form a property_key are never deduped together).
create unique index if not exists epc_certificates_property_key_idx
  on public.epc_certificates (property_key);

alter table public.epc_certificates enable row level security;
-- No client policy: epc_certificates is internal (service-role ingest/link
-- only). The property page reads the denormalised epc_* columns off properties.

-- ---------------------------------------------------------------------------
-- epc_ingest_runs (audit — mirror ppd_ingest_runs)
-- ---------------------------------------------------------------------------
create table if not exists public.epc_ingest_runs (
  id uuid primary key default gen_random_uuid(),
  file_label text not null,
  file_sha256 text not null,
  rows_processed integer not null default 0,
  rows_upserted integer not null default 0,
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'failed')),
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists epc_ingest_runs_sha_idx
  on public.epc_ingest_runs (file_sha256);

alter table public.epc_ingest_runs enable row level security;

-- ---------------------------------------------------------------------------
-- properties: denormalised EPC columns (read by the detail page + renovation
-- ROI service). epc_rating / epc_score already exist.
-- ---------------------------------------------------------------------------
alter table if exists public.properties
  add column if not exists epc_potential_rating text,
  add column if not exists epc_potential_score integer,
  add column if not exists epc_floor_area_sqm numeric,
  add column if not exists epc_property_type text,
  add column if not exists epc_built_form text,
  add column if not exists epc_construction_age_band text,
  add column if not exists epc_inspection_date date,
  add column if not exists epc_lmk_key text,
  add column if not exists epc_match_confidence numeric;
