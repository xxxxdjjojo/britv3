# Product Data Source Matrix — TrueDeed (britv3)

**Audit type:** read-only static inspection of `/Users/jojominime/Documents/britv3main/britv3` (canonical clone, `main` branch state).
**Date:** 2026-06-20.
**Scope:** Identify the *actual* backing data source for every Gate A.5 product surface, how it is populated, its freshness/licence, and integrity risks.

> Legend — **Type**: `live-api` (called at render) · `monthly-snapshot` (precomputed DB, refreshed on a schedule) · `db-user` (rows created by users) · `db-derived` (DB trigger/materialised view) · `hardcoded` (constant in source) · `placeholder` (scaffolded, no real data) · `not-implemented`.

---

## 1. Summary matrix

| # | Product surface | Type | Source / table | Populate path | Licence | Render reads | Freshness |
|---|---|---|---|---|---|---|---|
| 1 | Active **sale** listings | `db-user` (+ `hardcoded` fallback) | `listings` (listing_type=`sale`), `properties` | `listing-service.ts createListing` (users/agents) | internal | `search_listings` matview (`search/actions.ts`) | real-time on create; matview refresh RPC |
| 2 | Active **rental** listings | `db-user` (+ fallback) | `listings` (listing_type=`rent`) | same | internal | same | same |
| 3 | Property **coordinates** | `live-api` (at create) → `db-derived` | `properties.coordinates` (PostGIS) | `geocodePostcode` (postcodes.io) → `set_property_coordinates` RPC; `backfill-coordinates.ts` | OGL | precomputed DB | set once at create |
| 4 | **Provider** records | `db-user` | `providers` / `provider_profiles` | self-registration onboarding | internal | DB | real-time |
| 5 | **Estate agents & branches** | `db-user` | `agent_team_service`, `branches` (branch_id) | self-registration; CRM feed **scaffold only** | internal | DB | real-time |
| 6 | **Sold-price** data (HMLR) | `live-api` + `monthly-snapshot` | HMLR PPD → DB; live Linked-Data API | `fetchLandRegistryComparables` (live); Inngest `truedeedPpdIngest` (bulk) | OGL | both | live 24h cache / monthly file |
| 7 | **UK market-trend** (HPI) | `monthly-snapshot` | UK HPI (ONS/HMLR) | `ingest-uk-hpi.mjs` | OGL | DB (`lib/valuation/hpi`) | monthly |
| 8 | **Area-price** data | `monthly-snapshot` | `market_map_features` RPC = HMLR PPD ⋈ ONS boundaries | `ingest-ons-boundaries.mjs` + PPD | OGL | DB RPC | monthly (boundary static) |
| 9 | **Valuation** (AVM) | `db-derived` | computed from PPD + HPI + centroids | `valuation-service.ts` / `lib/valuation/engine` | OGL-derived | computed at request | dataCutoffDate tracked |
| 10 | **Mortgage products** | `not-implemented` | — | pure calculator only (`lib/calculators/mortgage.ts`) | n/a | calculator | n/a |
| 11 | **Auction** content | `not-implemented` | — | filter string only | n/a | — | n/a |
| 12 | **Renter** content | `db-user` | tenant applications, rent reminders | `tenant-application-service.ts` | internal | DB | real-time |
| 13 | **Landlord** content | `db-user` | maintenance, deposits, batch reminders | landlord services | internal | DB | real-time |
| 14 | **Viewing dates** | `db-user` | bookings | user schedules; `booking-service` | internal | DB | real-time |
| 15 | **Rental features** | `db-user` | `listings` fields (rent_frequency, service_charge, ground_rent, available_from) | landlord entry (`LISTING_FIELDS`) | internal | DB | real-time |
| 16 | **Price history** | `db-derived` | `price_history` | DB trigger on listing price change | internal | DB | real-time |
| 17 | **Email addresses & consent** | `db-user` | `profiles.email`, `notification_preferences`, `email_logs` | user signup + pref toggles | internal | DB | real-time |
| 18 | **Credit-reporting** (tenant referencing) | `placeholder` | `mock` adapter only | `REFERENCING_PROVIDER=mock` | internal | mock | n/a |
| 19 | **Insurance** integration | `not-implemented` | document upload step | `provider-verification-service` | n/a | upload | n/a |

---

## 2. Per-item detail

### 1–2. Active sale & rental listings
- **Actual source:** user-generated rows in `listings` + `properties`. Created via `src/services/listings/listing-service.ts → createListing`, which geocodes the postcode, inserts the property, sets PostGIS coordinates via `set_property_coordinates` RPC, inserts the listing as `status=draft`, and fire-and-forget calls `refresh_search_listings` to refresh the materialised view.
- **Render path:** `src/app/(main)/search/actions.ts → searchProperties` queries the `search_listings` materialised view when the `search_live_data` feature flag is **on**. When the flag is **off**, it returns the hard-coded `MOCK_PROPERTIES` array (8 fake London listings at `actions.ts:70`).
- **Agent CRM feeds (Reapit / Alto / Jupix):** `src/services/agent/agent-feed-service.ts` only **stores** an integration row (`agent_feed_integrations`, `sync_status='disconnected'`, API key base64-encoded as a placeholder for Vault). There is **no sync/ingest implementation** — feeds never populate listings.
- **Licence:** internal (user content). **Cadence:** real-time on create/update.
- **Risk:** thin real inventory; the mock fallback can present fabricated properties as live results. "commercial", "land", "auction" listing types silently return empty (no schema support).

### 3. Property coordinates
- **Source at create:** `geocodePostcode` (postcodes.io — free, OGL v3.0) in `src/services/geocoding/postcodes-io`. Result stored via `set_property_coordinates` PostGIS RPC.
- **Backfill:** `scripts/backfill-coordinates.ts`. Postcode centroid bulk sources: `scripts/ingest-postcode-centroids.mjs` (ONSPD/NSPL or OS Code-Point Open CSV) and `scripts/ingest-codepoint-gpkg.mjs` (OS Code-Point Open GeoPackage) → `postcode_centroids`.
- **Render:** reads precomputed `properties.coordinates` (GeoJSON Point), **not** a live API. A missing coordinate silently falls back to London centroid (`51.5074,-0.1278`) in the search mapper — a data-quality smell.
- **Licence:** OGL (postcodes.io / ONSPD / OS OGL). **Cadence:** set once at create.

### 4. Provider records
- **Source:** self-registered provider profiles (internal DB). Verification is a multi-stage document-upload workflow (`provider-verification-service.ts`: id_check, insurance, qualifications, references).
- **Licence:** internal. **Cadence:** real-time.

### 5. Estate agents & branches
- **Source:** agent/branch rows created on onboarding (`agent_team_service.ts`). `branch_id` is referenced from Truedeed introductions (`truedeed-notify-introduction.ts`).
- **CRM feed ingest:** scaffold only (see §1–2) — base64 key storage, `sync_status` permanently `'disconnected'`, **no actual data pull**.
- **Licence:** internal. **Cadence:** real-time (but no external feed refresh).

### 6. Sold-price data — HM Land Registry ⚠️ distinct from active listings
- **This is historical completed-sale transaction data, NOT current marketing/listing data.** Two independent paths:
  1. **Live API** — `src/services/properties/land-registry-service.ts → fetchLandRegistryComparables` calls the public HMLR Linked-Data API `https://api.landregistry.data.gov.uk/linked-data/resource/ppi/transactions-by-postcode`, Redis-cached 24h. Used by the property-detail "comparable sales" widget and to upsert `property_last_sold`.
  2. **Bulk monthly ingest** — Inngest job `truedeedPpdIngest` (`src/inngest/functions/truedeed-ppd-ingest.ts`, cron `0 7 25 * *`) fetches the HMLR PPD **monthly-update** CSV (fixed S3 URL, sha256 integrity anchor), streams it through `src/lib/truedeed/ppd-parser.ts → iteratePpdCsv`, and upserts via `ppd-ingest-service.ts`. A follow-up `truedeedPpdMatch` links sales to properties.
- **Conflation check (Gate A.5 critical):** ✅ No surface presents sold data *as* active listings. The `search_listings` query filters on `listing_type`; sold data only appears as the `last_sold_date` enrichment field (the `soldWithin` filter, `search/actions.ts:226`). The market map's metadata explicitly labels its metric `median_sold_price` and source `"HM Land Registry Price Paid Data joined to postcode geography"`. These are correct attributions — but the shared `last_sold_date` column on the listing card is the one place an end-user could mistake a past sale date for listing activity.
- **Gap:** the npm script `pnpm ingest:land-registry` (package.json:21) points at `scripts/ingest-land-registry.mjs`, which **does not exist** — the script is dead/missing; PPD ingest is now exclusively the Inngest job. The full historical PPD **bootstrap** (multi-GB) is explicitly out of scope of the Inngest job and needs a one-off streaming pipeline.
- **Licence:** OGL v3.0. **"As of":** the monthly PPD file (refreshed ~HMLR's 20th working day); `latest_transaction_date` exposed per area.

### 7. UK market-trend data (HPI)
- **Source:** UK House Price Index (ONS/HMLR), OGL. `scripts/ingest-uk-hpi.mjs` stores the monthly index series used by the valuation engine's time-adjustment (`src/lib/valuation/hpi.ts`).
- **Licence:** OGL. **Cadence:** monthly.

### 8. Area-price data (market map)
- **Source:** `market_map_features` Postgres RPC returns median/p10/p90 **sold** price, transaction count and property-type mix per geography level (local-authority / MSOA / LSOA / postcode district/sector), with polygons from `geography_boundaries`.
- **Populate:** boundaries via `scripts/ingest-ons-boundaries.mjs` (ONS Open Geography Portal, OGL). Underlying prices = HMLR PPD (§6).
- **Render:** `src/services/market-map/market-map-service.ts`. Metric is `median_sold_price` — **sold** price, not asking/listing price. Correctly source-attributed.
- **Licence:** OGL. **Cadence:** monthly (prices) / static (boundaries).

### 9. Valuation data (AVM)
- **Source:** an internal comparable-sales AVM — `src/services/valuation/valuation-service.ts → calculateValuation` fetches eligible PPD comparables (`comparables-repo.ts`), anchors on the subject's prior PPD sale, and runs `lib/valuation/engine.ts` with HPI time-adjustment and postcode/street proximity weighting. **Not** a third-party AVM vendor.
- **Degrades to "Level E (no estimate)"** when a postcode is invalid or data is thin (e.g. Scotland is absent from PPD).
- **Licence:** OGL-derived / internal. **"As of":** `dataCutoffDate` carried on the result; backtest `asOfDate` prevents future leakage.

### 10. Mortgage products — NOT IMPLEMENTED
- Only a **pure calculator** (`src/lib/calculators/mortgage.ts`) and an SDLT calculator exist. Mortgage broker is a *marketplace provider role* with a Stripe billing plan (`provider_mortgage_broker`), not a product/rate data feed.
- **Type:** `not-implemented` (calculator only).

### 11. Auction content — NOT IMPLEMENTED
- The only reference is a listing-type filter string `"auction"` in the mock search mapper (`search/actions.ts:206`), which silently returns empty. No auction data source or model.

### 12–15. Renter / landlord / viewing / rental-features content
- All **internal user-generated** DB content: tenant applications (`tenant-application-service.ts`), landlord maintenance & deposits (landlord services), bookings/viewings (`booking-service`), and rental fields on the listing (`rent_frequency`, `service_charge_annual`, `ground_rent_annual`, `available_from` — `LISTING_FIELDS` in `listing-service.ts`).
- **Viewing dates** come from the booking a user/agent schedules (passed to `sendViewingConfirmation/Reminder`). **Licence:** internal. **Cadence:** real-time.

### 16. Price history
- **Source:** `price_history` table written by a **database trigger** on listing price changes; read by `listing-service.ts → getPriceHistory` and the property-detail `PriceHistorySection`. Also the PPD-derived `last_sold_date`.
- **Type:** `db-derived`. **Licence:** internal.

### 17. Email addresses & consent
- **Source:** internal DB — `profiles.email`, `notification_preferences` (per-type email flags, quiet hours, `digest_frequency`), and `email_logs` (status `sent`/`failed`/`suppressed`/`delivered`/`bounced`). GDPR export (`/api/gdpr/export`) and delete (`/api/gdpr/delete`) routes exist.
- **Type:** `db-user`. **Licence:** internal.

### 18. Credit-reporting (tenant referencing) — PLACEHOLDER
- `src/env.ts` → `REFERENCING_PROVIDER` defaults to `"mock"`. The factory (`referencing-service.ts`) only instantiates `MockReferencingAdapter` (`adapters/mock-adapter.ts`), which mints a local reference and HMAC-verifies a webhook for tests. **Goodlord/Homelet adapters are referenced but not implemented.**
- **Type:** `placeholder` (mock).

### 19. Insurance integration — NOT IMPLEMENTED
- Insurance is a **provider onboarding document-upload step** ("proof of public liability insurance", `provider-verification-service.ts`). The moving checklist has a static "Arrange buildings insurance" item. **No insurance vendor, quote, or policy integration.**
- **Type:** `not-implemented` (document upload only).

---

## 3. Property-detail "Local area" layers (bonus, per CLAUDE.md)
The property page's `LocalAreaSection` composes self-gating layers (each renders only when real data exists):

| Layer | Source | Type | Ingest | Licence |
|---|---|---|---|---|
| Schools + Crime | GIAS/Ofsted + data.police.uk | `live-api` (Redis-cached) | — | OGL v3.0 |
| Transport | `transport_stops` (PostGIS, stations) + `get_nearby_transport_stops` RPC | `monthly-snapshot` | `ingest-naptan.mjs` | OGL |
| Broadband | `broadband_coverage` (postcode availability %) | `monthly-snapshot` | `ingest-ofcom-broadband.mjs` | OGL |
| Flood risk | EA NaFRA2 `rofrs_4band` WMS GetFeatureInfo | `live-api` | — | OGL |
| Mobility (walk/transit/bike) | `mobility_scores` (keyed by property_id) | `monthly-snapshot` | `ingest-mobility-scores.ts` (OSM/Overpass) | ODbL + OGL |
| EPC | `epc_certificates` bulk dataset | `monthly-snapshot` | `ingest-epc.ts` + `link-epc-to-properties.ts` | OGL |

All three DB-backed layers are public-read RLS; ingest scripts connect via `SUPABASE_DB_URL` with pinned TLS. Mobility backfill runs daily via `.github/workflows/mobility-backfill.yml`. No live EPC API key exists (bulk dataset only — see `docs/epc-dataset.md`).

---

## 4. Cross-cutting integrity risks
1. **Mock fallback masquerading as live search.** With `search_live_data` off (or on any DB error, `search/actions.ts:268`), the search surface returns 8 fabricated properties. There is no visible "demo data" banner.
2. **Sold-vs-listing conflation surface.** The only soft conflation is the `last_sold_date` field shown on listing cards / used by the `soldWithin` filter. It is HMLR-derived and could be misread as listing activity. No active-listing surface sources from sold-price rows.
3. **Missing/abandoned ingest script.** `pnpm ingest:land-registry` references a non-existent file; the canonical PPD path is the Inngest monthly job, but the bootstrap (full historical) load is unimplemented — so first-time deploys have no PPD data until the monthly job catches up.
4. **Coordinate silent fallback to London.** Missing PostGIS points render at `51.5074,-0.1278`, silently misplacing properties.
5. **Mocks/stubs in payment-adjacent flows.** Referencing (`mock`) and KYC (`stub`) mean tenant credit/ID checks perform no real verification today.
6. **Cadence discoverability.** "Last successful run" for ingest scripts is not recorded in-repo; PPD/HPI/mobility run status lives in Supabase (`ppd_ingest_runs`) / GitHub Actions / Inngest dashboards — not inspectable here.

*Sources verified by reading: package.json, src/env.ts, src/config/brand.ts, src/services/{listings,properties,valuation,market-map,referencing,verification,agent}/*, src/app/(main)/properties/[slug]/page.tsx, src/app/(main)/search/actions.ts, src/app/api/webhooks/*, src/inngest/functions/*, scripts/ingest-*.{ts,mjs}, .env.example.*
