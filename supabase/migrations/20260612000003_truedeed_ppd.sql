-- ============================================================================
-- Truedeed Phase 3 — PPD audit backstop
-- Spec: docs/truedeed/attribution-tracking-spec.md §2 (ppd_* tables) + §4
--
-- ppd_ingest_runs and ppd_transactions are MUTABLE: PPD is a revisable
-- dataset (§4.1) — monthly updates apply A (insert), C (update) and D
-- (delete) rows via plain upserts, and the ingest job closes runs out with a
-- plain UPDATE. No append-only triggers here, unlike the Phase 1/2 ledgers.
--
-- RLS (§2.2): all three ppd_* tables are internal/service-role only — RLS
-- enabled with ZERO policies. anon/authenticated (even admins) see nothing;
-- the service role bypasses RLS and needs no policy.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extensions (trigram matching for the address matcher)
-- ---------------------------------------------------------------------------

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

-- One row per HMLR PPD file ingested (full dump or monthly update).
create table public.ppd_ingest_runs (
  id uuid primary key default gen_random_uuid(),
  file_label text not null,
  file_sha256 text not null,
  rows_added integer,
  rows_changed integer,
  rows_deleted integer,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running','succeeded','failed'))
);

-- HMLR Price Paid Data, keyed by HMLR's own TUID (text, not uuid).
create table public.ppd_transactions (
  ppd_tuid text primary key,
  price_pence bigint not null,
  transfer_date date not null,
  postcode text,
  property_type text,
  new_build boolean,
  tenure text,
  paon text,
  saon text,
  street text,
  locality text,
  town text,
  district text,
  county text,
  ppd_category text not null,
  last_record_status text check (last_record_status in ('A','C','D')),
  ingest_run_id uuid references public.ppd_ingest_runs(id),
  updated_at timestamptz not null default now()
);

-- Matcher output: a PPD transaction tentatively linked to one of our listings.
create table public.ppd_match_candidates (
  id uuid primary key default gen_random_uuid(),
  ppd_tuid text not null references public.ppd_transactions(ppd_tuid),
  listing_id uuid not null references public.listings(id),
  introduction_id uuid references public.introductions(id),
  mode text not null check (mode in ('verification','audit')),
  score numeric(4,3) not null,
  score_components jsonb not null,
  status text not null default 'pending_review'
    check (status in ('pending_review','branch_queried','confirmed','dismissed')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  unique (ppd_tuid, listing_id)
);

-- ---------------------------------------------------------------------------
-- 3. Matcher indexes
-- ---------------------------------------------------------------------------

create index idx_ppd_transactions_postcode
  on public.ppd_transactions using btree (postcode);

create index ppd_paon_trgm
  on public.ppd_transactions using gin (paon gin_trgm_ops);

create index idx_ppd_match_candidates_listing
  on public.ppd_match_candidates (listing_id);

-- ---------------------------------------------------------------------------
-- 4. Deferred Phase 2 FK + listings address-shape columns
-- ---------------------------------------------------------------------------

-- invoice_candidates.ppd_match_id gains its real FK now that
-- ppd_match_candidates exists.
alter table public.invoice_candidates
  add constraint invoice_candidates_ppd_match_id_fkey
  foreign key (ppd_match_id) references public.ppd_match_candidates(id);

-- listings mirror PPD address shape so the matcher can compare like-for-like.
alter table public.listings add column if not exists paon text;
alter table public.listings add column if not exists saon text;
alter table public.listings add column if not exists uprn text;

-- ---------------------------------------------------------------------------
-- 5. RLS — internal/service-role only (§2.2): enabled, zero policies
-- ---------------------------------------------------------------------------

alter table public.ppd_ingest_runs enable row level security;
alter table public.ppd_transactions enable row level security;
alter table public.ppd_match_candidates enable row level security;
