# Agency & Listing Data Dictionary

> **Date:** 2026-06-19
> **Gate:** A (discovery).
> **Scope:** every table/column relevant to partner ingestion, quoted from the
> migrations. House style matches `VALUATION_DATA_DICTIONARY.md`.
> **Sources:** `003001_property_portal.sql`, `20260313_agent_dashboard.sql`,
> `20260619120003_agent_feed_import_ledger.sql`.

Marks: **(quoted)** = verbatim from migration; **(derived)** = computed by trigger/RPC.

---

## 1. Enums (from `003001_property_portal.sql`)

| Enum | Values |
|---|---|
| `property_type` | `detached, semi_detached, terraced, flat, bungalow, land, cottage, penthouse, studio, maisonette, other` |
| `listing_type` | `sale, rent` |
| `listing_status` | `draft, active, under_offer, sold, let, withdrawn, archived` |
| `tenure_type` | `freehold, leasehold, shared_ownership` |
| `media_type` | `image, floor_plan, epc_document` |
| `agent_feed_integrations.provider` (CHECK, not enum) | `reapit, alto, jupix` |
| `agent_feed_integrations.sync_status` (CHECK) | `disconnected, connected, syncing, error` |
| `feed_import_runs.status` (CHECK) | `running, needs_review, succeeded, failed, published` |
| `feed_import_items.status` (CHECK) | `needs_review, approved, rejected, published, failed, withdrawn` |
| `feed_import_items.item_type` (CHECK) | `listing, branch, media` |

> ⚠️ The `provider` CHECK has **no `csv`/`generic`/`sandbox`** value — the working-build
> pilot connectors are not representable in the current schema (see audit & capability matrix).

---

## 2. `properties` (physical asset) — `003001_property_portal.sql:37`

| Column | Type | Constraint / note |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `address_line1` | TEXT | NOT NULL |
| `address_line2` | TEXT | |
| `city` | TEXT | NOT NULL |
| `county` | TEXT | |
| `postcode` | TEXT | NOT NULL; `CONSTRAINT valid_postcode CHECK (postcode ~ '^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$')` |
| `coordinates` | GEOGRAPHY(POINT,4326) | set via `set_property_coordinates` RPC; GIST index |
| `property_type` | `property_type` | NOT NULL |
| `bedrooms` | INTEGER | NOT NULL, `CHECK (0..50)` |
| `bathrooms` | NUMERIC(3,1) | NOT NULL, `CHECK >= 0` |
| `reception_rooms` | INTEGER | `CHECK >= 0` |
| `square_footage` | INTEGER | `CHECK > 0` |
| `title` | TEXT | NOT NULL, `CHECK len <= 200` |
| `description` | TEXT | NOT NULL, `CHECK len <= 5000` |
| `description_tsv` | TSVECTOR | **(derived)** `trg_update_properties_tsv` |
| `features` | JSONB | default `{}` |
| `epc_rating` | CHAR(1) | `CHECK IN ('A'..'G')` |
| `epc_score` | INTEGER | `CHECK 1..100` |
| `tenure` | `tenure_type` | |
| `lease_remaining_years` | INTEGER | `CHECK >= 0` |
| `council_tax_band` | CHAR(1) | `CHECK IN ('A'..'H')` |
| `year_built` | INTEGER | `CHECK 1600..2050` |
| `new_build` | BOOLEAN | default FALSE |
| `created_at`/`updated_at` | TIMESTAMPTZ | `updated_at` via `trg_update_properties_updated_at` |
| `deleted_at` | TIMESTAMPTZ | soft-delete marker |

> Also referenced in code but **must be confirmed present**: `planning_permission_status`
> (used by `listing-service.ts` publish guard and by the import publish insert). It is in
> `src/types/property.ts:81` and inserted by `publishApprovedImportItem`. **Assumption:** a
> later migration added `properties.planning_permission_status` (not in `003001`); a
> column-existence check is a Gate-B task. **No `source`/provenance columns exist** — these
> are proposed in [`CANONICAL_LISTING_CONTRACT.md`](./CANONICAL_LISTING_CONTRACT.md).

**RLS:** `properties_select USING (TRUE)`; `properties_insert WITH CHECK (TRUE)`;
`properties_update` requires an owning listing (`l.property_id = properties.id AND l.user_id = auth.uid()`).

---

## 3. `listings` (marketing offering) — `:68`

| Column | Type | Constraint / note |
|---|---|---|
| `id` | UUID PK | |
| `property_id` | UUID | NOT NULL, FK `properties(id) ON DELETE CASCADE` |
| `user_id` | UUID | NOT NULL, FK `auth.users(id) ON DELETE CASCADE` — **the ownership key** |
| `listing_type` | `listing_type` | NOT NULL |
| `status` | `listing_status` | default `draft` |
| `price` | NUMERIC(12,2) | NOT NULL, `CHECK >= 0` |
| `rent_frequency` | TEXT | `CHECK IN ('weekly','monthly','yearly')`; `valid_rent_freq` requires it for rent |
| `price_qualifier` | TEXT | `CHECK IN ('offers_over','guide_price','fixed_price','from','poa')` |
| `service_charge_annual` / `ground_rent_annual` | NUMERIC | |
| `listed_date` | DATE | default `CURRENT_DATE` |
| `available_from` | DATE | |
| `slug` | TEXT UNIQUE | **(derived)** `trg_generate_listing_slug` |
| `view_count`/`enquiry_count`/`favorite_count` | INTEGER | default 0 |
| `created_at`/`updated_at`/`deleted_at` | TIMESTAMPTZ | |

**RLS:** `listings_select_active USING (status='active' AND deleted_at IS NULL)` (anon-readable);
`listings_select_own (user_id=auth.uid())`; insert/update/delete all gated on `user_id=auth.uid()`.

---

## 4. `property_media` — `:94`

`id`, `listing_id` (FK `listings ON DELETE CASCADE`), `media_type`, `url` (NOT NULL),
`thumbnail_url`, `caption`, `alt_text`, `sort_order` (default 0), `file_size`,
`original_filename`, `uploaded_by` (FK auth.users), `created_at`.
**RLS:** select if listing active or owned; insert/update/delete if listing owned.

## 5. `price_history` — `:110`

`id`, `listing_id` (FK CASCADE), `old_price`, `new_price`, `changed_at`, `changed_by`.
Written **only** by `trg_track_price_changes` (SECURITY DEFINER); no direct INSERT policy.

## 6. `search_listings` (materialized view) — `:289`

Join `listings l JOIN properties p` LEFT JOIN cover image (`pm.sort_order=0 AND media_type='image'`),
filtered `WHERE l.status='active' AND l.deleted_at IS NULL AND p.deleted_at IS NULL`.
Unique index `idx_search_listings_listing_id` (required for `REFRESH … CONCURRENTLY`).
Refreshed by `refresh_search_listings()` (SECURITY DEFINER).

---

## 7. Agency tables (`20260313_agent_dashboard.sql`)

### `agent_agency_profiles` — `:40` (one per agent: `agent_id UUID NOT NULL UNIQUE`)
`id`, `agent_id` (UNIQUE, FK auth.users), `agency_name` (NOT NULL), `contact_email`,
`contact_phone`, `address_line_1/2`, `city`, `postcode`, `description`,
`specializations TEXT[]`, `coverage_areas TEXT[]`, `logo_url`, `brand_primary_colour`,
`brand_secondary_colour`, `social_*`, `website_url`, timestamps.
**RLS:** `agent_id = auth.uid()` FOR ALL.

### `agent_branches` — `:331`
`id`, `agent_id` (FK auth.users), `name` (NOT NULL), `address_line_1/2`, `city`,
`postcode`, `phone`, `email`, `is_head_office` (default false), timestamps.
**RLS:** `agent_id = auth.uid()` FOR ALL.

### `agent_team_members` — `:300`
`id`, `agent_id`, `user_id`, `branch_id` (FK `agent_branches` added via later ALTER),
`UNIQUE(agent_id, user_id)`. **RLS:** `agent_id = auth.uid()`.

### `agent_feed_integrations` — `:489`
`id`, `agent_id` (FK auth.users), `provider TEXT NOT NULL CHECK IN ('reapit','alto','jupix')`,
`api_key_encrypted TEXT`, `webhook_url TEXT`,
`sync_status TEXT DEFAULT 'disconnected' CHECK IN ('disconnected','connected','syncing','error')`,
`last_sync_at TIMESTAMPTZ`, `field_mapping JSONB`, `error_log JSONB[]`, timestamps.
**RLS:** `agent_id = auth.uid()` FOR ALL. Index `idx_agent_feed_integrations_agent_id`.

> Note: `error_log` is a Postgres **array of JSONB** (`JSONB[]`), distinct from the
> ledger's `feed_import_runs.error_log JSONB` (a single JSONB array). Don't conflate them.

---

## 8. Import ledger (`20260619120003_agent_feed_import_ledger.sql`)

### `feed_import_runs` — `:5`
`id`, `integration_id` (FK agent_feed_integrations CASCADE), `agent_id` (FK auth.users),
`provider TEXT`, `source_fingerprint TEXT` (SHA256 of source payloads),
`status` (CHECK `running/needs_review/succeeded/failed/published`),
`total_items`/`eligible_items`/`error_items`/`published_items` (INTEGER, `CHECK >= 0`),
`started_at`, `finished_at`, `error_log JSONB DEFAULT '[]'`, timestamps,
**`UNIQUE(integration_id, source_fingerprint)`** (idempotent re-run key).

### `feed_import_items` — `:25`
`id`, `run_id` (FK CASCADE), `integration_id`, `agent_id`,
`item_type` (CHECK `listing/branch/media`), `external_id`, `external_branch_id`,
`payload JSONB` (raw), `normalized_payload JSONB`, `payload_sha256`,
`status` (CHECK incl. `withdrawn`), `validation_errors JSONB DEFAULT '[]'`,
`canonical_listing_id` (FK `listings ON DELETE SET NULL`), `last_seen_at`, timestamps,
**`UNIQUE(run_id, item_type, external_id)`**.

### `feed_listing_links` — `:46`
`id`, `integration_id`, `agent_id`, `external_listing_id`, `listing_id` (FK CASCADE),
`property_id` (FK SET NULL), `last_seen_run_id`, `last_seen_at`, timestamps,
**`UNIQUE(integration_id, external_listing_id)`** and **`UNIQUE(integration_id, listing_id)`**.

### `feed_branch_links` — `:61`
`id`, `integration_id`, `agent_id`, `external_branch_id`, `branch_id` (FK `agent_branches`
CASCADE), `last_seen_run_id`, timestamps, **`UNIQUE(integration_id, external_branch_id)`**,
**`UNIQUE(integration_id, branch_id)`**.

### `feed_media_links` — `:75`
`id`, `integration_id`, `agent_id`, `external_media_id`, `listing_id` (FK CASCADE),
`media_id` (FK `property_media` CASCADE), `source_url`, `source_sha256`, `last_seen_run_id`,
timestamps, **`UNIQUE(integration_id, listing_id, external_media_id)`**.

**RLS (all five):** `SELECT … USING (agent_id = (SELECT auth.uid()))` only — **no agent
INSERT/UPDATE/DELETE policies**, so all writes are service-role.
**Tenant triggers:** `assert_feed_*_tenant()` (SECURITY DEFINER) reject rows whose
`integration_id`/`listing_id`/`branch_id`/`media_id` don't belong to `agent_id`
(`:165`–`:318`).

---

## 9. Gaps to encode later (provenance & org)

- No `properties.source` / `listings.source` / `source_external_id` / `provenance` columns.
- No `organisations`/`organisation_memberships`; everything keyed on a single `agent_id`.
- `provider` CHECK too narrow for csv/generic/sandbox.

These are designed in [`CANONICAL_LISTING_CONTRACT.md`](./CANONICAL_LISTING_CONTRACT.md)
and the onboarding spec's migration-path section.
