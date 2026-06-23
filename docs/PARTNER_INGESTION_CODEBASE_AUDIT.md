# Partner Ingestion Codebase Audit

> **Date:** 2026-06-19
> **Gate:** A (discovery).
> **Supersedes** `docs/AGENT_FEED_CODEBASE_AUDIT.md` (Codex's 78-line note) — its
> content is folded in below. That file may now be treated as historical.
> **Method:** every row cites a file actually read in this worktree
> (`feature/partner-ingestion`). Quoted columns/enums/functions are verbatim from the
> migrations / source. Marks: **Keep** / **Adapt** / **Replace** / **Remove-later** /
> **Product-decision**.

Cross-refs: [`CURRENT_LISTING_DATA_FLOW.md`](./CURRENT_LISTING_DATA_FLOW.md),
[`AGENCY_AND_LISTING_DATA_DICTIONARY.md`](./AGENCY_AND_LISTING_DATA_DICTIONARY.md),
[`PARTNER_INGESTION_CAPABILITY_MATRIX.md`](./PARTNER_INGESTION_CAPABILITY_MATRIX.md).

---

## 1. Component table

| File | Purpose | Current behaviour | Data dependency | Auth requirement | Reusability | Defect / limitation | Test coverage | Disposition |
|---|---|---|---|---|---|---|---|---|
| `supabase/migrations/003001_property_portal.sql` | Core property/listing schema | `properties` (physical, global, `properties_select USING (TRUE)`), `listings` (user_id-scoped), `property_media`, `price_history`, `search_listings` MV (`WHERE l.status='active'`) | PostGIS, pg_trgm | RLS: listings owner = `auth.uid()`; properties insert `WITH CHECK (TRUE)` | **High** — canonical target tables | `properties` has no `source`/provenance columns; property INSERT is open to any authenticated user (`WITH CHECK (TRUE)`) | Existing portal tests | **Keep** (extend with provenance per [`CANONICAL_LISTING_CONTRACT.md`](./CANONICAL_LISTING_CONTRACT.md)) |
| `supabase/migrations/20260313_agent_dashboard.sql` | Agent CRM tables | `agent_agency_profiles` (1 per agent, `agent_id UNIQUE`), `agent_branches`, `agent_team_members`, `agent_feed_integrations` (`provider CHECK IN ('reapit','alto','jupix')`, `api_key_encrypted TEXT`, `sync_status`, `field_mapping JSONB`, `error_log JSONB[]`) | auth.users | RLS: `agent_id = auth.uid()` (FOR ALL) | **High** | **Single-user tenancy** — everything keyed on `agent_id` (one user), no org/branch membership; `provider` enum excludes CSV/generic | team-service tests | **Adapt** — migrate toward org model (see [`THREE_ACTION_AGENCY_ONBOARDING_SPEC.md`](./THREE_ACTION_AGENCY_ONBOARDING_SPEC.md) §migration) |
| `supabase/migrations/20260619120003_agent_feed_import_ledger.sql` | Import review ledger | `feed_import_runs` (`UNIQUE(integration_id, source_fingerprint)`, status `running/needs_review/succeeded/failed/published`), `feed_import_items` (`UNIQUE(run_id,item_type,external_id)`, status incl. `withdrawn`), `feed_listing_links`/`feed_branch_links`/`feed_media_links` with tenant-assert triggers | agent_feed_integrations, listings, agent_branches, property_media | RLS select `agent_id = auth.uid()`; **writes service-role only** | **High** | RLS has **SELECT only** (no agent INSERT/UPDATE) so all writes must go through admin client; `agent_id` not org_id | static migration tests (table/RLS/trigger presence) | **Keep + Adapt** (re-key `agent_id`→`organisation_id` later) |
| `src/services/agent/agent-feed-import-service.ts` | Normalize→validate→approve→publish pipeline | `normalizeReapitFixture()` (3 hardcoded listings incl. 1 `withdrawn`), `validateNormalizedListing()` (material-info gate), `createDeterministicReapitImportRun()` (SHA256 fingerprint, upsert on conflict), approve, `publishApprovedImportItem()` → inserts `properties`+`listings(status:'draft')`+`property_media`+link rows | feed_import_* tables, properties, listings, property_media | service-role client | **High** (pipeline shape); **Replace** the fixture for real connectors | **No `SourceConnector` abstraction** (Reapit fixture is inlined); **publish re-creates a NEW property+listing every time** (no upsert on `feed_listing_links.external_listing_id` before insert) → **duplicates on re-publish**; publishes `status:'draft'` so **not searchable** (MV is `status='active'`); **no coordinates set** → no map marker; **no empty-feed guard** | `agent-feed-import-service.test.ts` (7 tests: normalize, validate, tombstone, idempotent run, approve, publish-draft) | **Adapt** (extract connector interface) + **Keep** (validation/ledger logic) |
| `src/services/agent/agent-feed-service.ts` | Feed integration CRUD | CRUD on `agent_feed_integrations`; **never returns `api_key_encrypted`** (stripped in `toFeedIntegrationView`, `has_secret` boolean); `createSecretReference()` returns `vault://<agentId>/<provider>/<uuid>` (placeholder, **not real Vault**); `deleteFeedIntegration` is **hard delete** | agent_feed_integrations | supabase client (RLS) | **High** | Secret reference is a **non-secret placeholder string**, not backed by Supabase Vault; `setFeedIntegrationSyncStatus` overwrites `error_log` rather than appending | `agent-feed-service.test.ts` (secret redaction, secret-ref-only, no sync_status mutation) | **Keep + Adapt** (wire Vault per [`PARTNER_INGESTION_SECURITY_REVIEW.md`](./PARTNER_INGESTION_SECURITY_REVIEW.md)) |
| `src/app/api/agent/feeds/route.ts` | Feed CRUD API | GET/POST/PATCH/DELETE; `requireAgentUser()` checks `profiles.active_role === 'agent'`; Zod `createFeedIntegrationSchema` (`provider` enum, `api_key min(8)`, `.strict()`); `redactFeedIntegration` strips key; PATCH requires `id` in **body** | profiles, agent_feed_integrations | session (cookie) | **High** | DELETE takes `id` from query string (not body) — inconsistent with PATCH; `console.error` (eslint-disabled TODO to migrate to Sentry) | covered via service tests + route guard tests | **Keep** |
| `src/app/api/agent/feeds/[id]/sync/route.ts` | "Connect/Sync" trigger | POST → `createDeterministicReapitImportRun(adminClient,…)` → review → set sync_status `connected`; **uses `createAdminClient()` (service role)** | feed_import_*, agent_feed_integrations | `requireAgent()` then service role | **Adapt** | **Calls the deterministic fixture, not a real connector**; runs synchronously in the request (no Inngest/queue); no empty-feed guard | route returns review JSON; e2e auth blocked (no seeded agent) | **Replace** body (dispatch to connector + queue) / **Keep** route shape |
| `src/app/api/agent/feed-imports/[runId]/approve/route.ts` | Approve eligible items | POST → `approveEligibleFeedImportRunItems(adminClient,…)` | feed_import_items | `requireAgent()` + service role | **Keep** | none material | service-level | **Keep** |
| `src/app/api/agent/feed-imports/[runId]/publish/route.ts` | Publish approved → draft listings | POST → `publishApprovedFeedImportRunItems(adminClient,…)` | properties, listings, property_media, links | `requireAgent()` + service role | **Keep** shape | Inherits the **duplicate-on-re-publish** and **draft-not-searchable** defects from the service | service-level | **Adapt** (fix publish semantics) |
| `src/components/dashboard/agent/integrations/FeedIntegrationConfig.tsx` | Connect/Review/Publish UI | Client component; Connect/Review/Publish stepper (`activeStep` derived); Add/Edit dialog with field-mapping table; **"Test Connection" only regex-checks key format** (`/^[A-Za-z0-9\-_]{8,}$/`), it does **not** call the provider; webhook URL is display-only `…/api/agent/feeds/webhook/<id>` (**route does not exist**) | `/api/agent/feeds*` | agent session | **Adapt** | Hardcoded provider colours/labels for reapit/alto/jupix only; webhook URL shown but **no webhook handler implemented**; "Test Connection" is cosmetic | Playwright link-render covers route presence; **no authed wizard screenshots** (no seeded agent) | **Adapt** (3-action spec) |
| `src/lib/api/require-agent.ts` | Agent role guard | `requireAuth()` then `profiles.active_role === 'agent'` else 403 | profiles | session | **High** | Per-user role only; **no org/branch authorization** (can't yet express "is this agent's branch") | used across agent routes | **Keep + Adapt** (org-aware) |
| `src/services/listings/listing-service.ts` | Listing CRUD + publish guard | `createListing` **forces `status:'draft'`** even if caller passes another; `updateListing` publish guard: `status='active'` requires `planning_permission_status`; refreshes `search_listings` MV after writes (fire-and-forget); geocodes via `set_property_coordinates` RPC | properties, listings, postcodes.io, RPCs | supabase client | **High** | Import pipeline **bypasses `createListing`** (inserts `properties`/`listings` directly) so it **misses geocoding + MV refresh + publish guard** | listing-service tests | **Keep** (import path should **reuse** it) |
| `src/inngest/functions/truedeed-ppd-ingest.ts` | PPD bulk ingest (reuse pattern) | Inngest job: fetch CSV → `sha256Hex` → dedupe vs `ppd_ingest_runs.file_sha256` (skip if succeeded) → `startIngestRun` → re-fetch+verify sha → parse+apply; audit-logs skip/start | ppd_ingest_runs | server | **Reference** | n/a (different domain) | covered | **Keep** as the **reuse template** for feed runs (SHA dedup + run ledger + audit) |
| `src/app/api/webhooks/stripe/route.ts` | Webhook infra (reuse pattern) | Raw-body **signature verify** (`stripe.webhooks.constructEvent`); **idempotency** (duplicate event → 200 no-op); unknown types → 200 (don't break retries); persists payload for **DLQ replay** | webhook_events | signature | **Reference** | n/a | covered | **Keep** as the **reuse template** for provider push webhooks (see security review) |
| `src/types/agent.ts` | Agent types | `FEED_PROVIDERS = ['reapit','alto','jupix']`, `SYNC_STATUSES`, `AgentFeedIntegrationView` (omits key, adds `has_secret`) | — | — | **High** | provider list mirrors the too-narrow DB enum | typed | **Adapt** (add csv/generic) |
| `src/types/property.ts` | Property types | `PlanningPermissionStatus`, `PropertyType`, `TenureType`, `ListingType`, `RentFrequency` | — | — | **High** | — | typed | **Keep** |

---

## 2. Folded-in facts from the superseded `AGENT_FEED_CODEBASE_AUDIT.md`

Preserved because they are accurate and load-bearing:

- `/dashboard/agent/integrations/feeds` is wired into agent navigation, command-palette,
  dashboard smoke coverage, and link-render route coverage (no longer "off-navigation").
- API responses **never** include `api_key_encrypted`; PATCH requires `id` in the JSON
  body; clients **cannot** set arbitrary `sync_status` (server-owned only).
- Local secret handling stores a non-secret `vault://…` reference; **production must back
  this with Supabase Vault** (or equivalent server-side secret store).
- The link-render Playwright server uses `next dev --webpack` to avoid Turbopack's invalid
  external `node_modules` symlink panic in isolated worktrees.
- Static migration tests assert table presence, RLS posture, tenant indexes, idempotency
  constraints, and tenant-consistency triggers.
- **Known boundaries (still true):** no live Reapit/Rightmove/Zoopla/OnTheMarket/Street/
  Alto/Jupix credentials → no live connector shipped; the deterministic adapter is
  test/dev-only; production secret storage not yet wired; ledger/publish routes require
  `SUPABASE_SERVICE_ROLE_KEY`; authed agent wizard screenshots need a seeded
  `e2e/.auth/agent.json`.

---

## 3. Summary dispositions

- **Keep as-is:** core portal schema, listing-service publish guard, feed CRUD API +
  guard, approve route, types, PPD/Stripe reuse templates.
- **Adapt:** import-service (extract `SourceConnector`, fix publish semantics), sync route
  (dispatch + queue), UI (real 3-action), tenancy (agent_id → org), secret-ref (Vault).
- **Replace:** the inlined Reapit fixture as a "connector"; the cosmetic Test-Connection.
- **Remove-later:** display-only webhook URL until a real webhook handler exists.
- **Product-decision:** organisations/branches/memberships model; provider enum expansion
  (csv/generic/sandbox); which live connector pilots first.
