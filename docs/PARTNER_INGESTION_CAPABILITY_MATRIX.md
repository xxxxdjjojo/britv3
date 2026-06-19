# Partner Ingestion Capability Matrix

> **Date:** 2026-06-19
> **Gate:** A (discovery).
> **Legend:** **Exists** (works) · **Partial** (works but incomplete/limited) ·
> **Missing** (not built) · **Broken** (built but defective).
> **Priority:** P0 (MVP-blocking) · P1 (pilot) · P2 (later).
> Every "Exists/Partial/Broken" row cites a file read in this worktree.

Cross-refs: [`PARTNER_INGESTION_CODEBASE_AUDIT.md`](./PARTNER_INGESTION_CODEBASE_AUDIT.md),
[`PARTNER_INGESTION_REQUIREMENTS_TRACEABILITY.md`](./PARTNER_INGESTION_REQUIREMENTS_TRACEABILITY.md).

| # | Capability | State | Files | Data model | Security risk | Tests | Priority |
|---|---|---|---|---|---|---|---|
| C1 | Record a feed connection per agency | **Exists** | `agent-feed-service.ts:createFeedIntegration`, `feeds/route.ts` POST | `agent_feed_integrations` | secret-ref placeholder only | feed-service.test | P0 |
| C2 | Never expose API key to client | **Exists** | `agent-feed-service.ts:toFeedIntegrationView`, `feeds/route.ts:redactFeedIntegration` | `has_secret` boolean | low | "without api_key_encrypted" | P0 |
| C3 | Store secret in real Vault | **Missing** (placeholder `vault://…`) | `agent-feed-service.ts:createSecretReference` | — | **HIGH** (no real secret store) | — | P0 |
| C4 | Provider connector abstraction (`SourceConnector`) | **Missing** | Reapit fixture inlined in `agent-feed-import-service.ts` | — | medium | — | P0 |
| C5 | CSV connector (pilot anchor) | **Missing** | — | needs `provider='csv'` | SSRF n/a (upload) | — | P0 |
| C6 | Generic sandbox/synthetic feed connector | **Partial** (deterministic Reapit fixture exists) | `agent-feed-import-service.ts:normalizeReapitFixture` | — | low | normalize/validate tests | P0 |
| C7 | Live Reapit connector (OIDC) | **Missing** (contract-test only) | — | `provider='reapit'` | OAuth secret handling | — | P2 |
| C8 | Live Alto / Jupix connectors | **Missing** | — | — | — | — | P2 |
| C9 | Normalize source → canonical listing | **Exists** (Reapit shape) | `normalizeReapitListing` | `NormalizedFeedListing` | low | normalize test | P0 |
| C10 | Material-information validation gate | **Exists** | `validateNormalizedListing` (address, city, postcode, type, title, desc, tenure, planning, price>0) | `validation_errors` | low | validate test | P0 |
| C11 | Withdrawn = tombstone, not publish | **Exists** | `isPublishEligible`, status `withdrawn` | item status | low | tombstone test | P0 |
| C12 | Durable import-run ledger | **Exists** | `createDeterministicReapitImportRun`, migration ledger | `feed_import_runs/items` | low | idempotent-run test | P0 |
| C13 | SHA256 source fingerprint (idempotent re-run) | **Exists** | `sha256`, `UNIQUE(integration_id,source_fingerprint)` | run table | low | idempotent test | P0 |
| C14 | Per-item payload SHA256 | **Exists** | `payload_sha256` upsert | item table | low | idempotent test | P0 |
| C15 | Explicit review/approval step | **Exists** | `approveFeedImportItem`, `approveEligibleFeedImportRunItems` | item status `approved` | low | approve test | P0 |
| C16 | Publish approved → canonical | **Broken** | `publishApprovedImportItem` | properties/listings/media | **dup on re-publish** | publish test | P0 |
| C17 | Published listing is searchable | **Broken** (inserts `status:'draft'`; MV is `status='active'`) | `publishApprovedImportItem:539` | `search_listings` MV | n/a | — | P0 |
| C18 | Map marker for imported listing | **Broken** (no `set_property_coordinates`) | publish path skips geocode | `properties.coordinates` | n/a | — | P0 |
| C19 | Reuse `createListing` (geocode+MV+slug+guard) | **Missing** (import bypasses it) | `listing-service.ts:createListing` vs import path | — | medium | — | P0 |
| C20 | Empty-feed safety check | **Missing** | — (no guard before publish) | run counts | **medium** (mass-archive risk) | — | P0 |
| C21 | Upstream deletion → archive + audit | **Partial** (withdrawn handled at item level; no listing archive on disappearance) | item `withdrawn`; `feed_listing_links.last_seen_run_id` exists | links | medium | — | P1 |
| C22 | Branch detection + mapping | **Partial** | `external_branch_id` captured; `feed_branch_links` exists; UI shows branch | `feed_branch_links` | low | branch mapping test | P1 |
| C23 | Media import + link | **Exists** | publish inserts `property_media` + `feed_media_links` | media tables | SSRF on `source_url` | publish test | P0 |
| C24 | Media SSRF allowlist | **Missing** | media URL inserted unvalidated | `feed_media_links.source_url` | **HIGH** | — | P0 |
| C25 | Media dedup by `source_sha256` | **Partial** (column exists, not populated) | `feed_media_links.source_sha256` | links | low | — | P1 |
| C26 | Strict tenant isolation (RLS) | **Exists** | ledger RLS `agent_id=auth.uid()` select | all ledger tables | low | static RLS tests | P0 |
| C27 | Tenant-consistency triggers | **Exists** | `assert_feed_*_tenant()` | triggers | low | trigger tests | P0 |
| C28 | Cross-tenant denial tests (6) | **Missing** | — | — | **HIGH** | — | P0 |
| C29 | Agent role guard on routes | **Exists** | `require-agent.ts`, `feeds/route.ts:requireAgentUser` | `profiles.active_role` | low | guard tests | P0 |
| C30 | Org/branch authorization model | **Missing** | per-user `agent_id` only | needs `organisations` | medium | — | P1 |
| C31 | Connect action (UI) | **Partial** | `FeedIntegrationConfig.tsx` add dialog | — | low | link-render | P1 |
| C32 | Real connection test (calls provider) | **Broken** (regex-only) | `handleTestConnection` | — | low | — | P1 |
| C33 | Review action (UI) | **Exists** | `FeedIntegrationConfig.tsx` review table | review JSON | low | — | P1 |
| C34 | Publish action (UI) | **Exists** | `FeedIntegrationConfig.tsx` publish button | — | low | — | P1 |
| C35 | Webhook receiver (provider push) | **Missing** (UI shows URL, no route) | UI `…/feeds/webhook/<id>` | — | **HIGH** (no sig verify yet) | — | P2 |
| C36 | Webhook signature + replay protection | **Missing** (reuse Stripe pattern) | `webhooks/stripe/route.ts` (template) | `webhook_events` | **HIGH** | — | P2 |
| C37 | Async processing (Inngest/queue) | **Missing** (sync in request) | sync route runs inline | — | medium (timeout risk) | — | P1 |
| C38 | Run error log / partial-failure surface | **Partial** | `feed_import_runs.error_log` exists; `setFeedIntegrationSyncStatus` overwrites integration error_log | run+integration | low | — | P1 |
| C39 | "HTTP 200 ≠ success" item-level gating | **Exists** (validation governs publish) | `validateNormalizedListing`+`isPublishEligible` | item status | low | validate test | P0 |
| C40 | Field-mapping config | **Partial** (UI table; not applied in normalize) | UI `formFieldMapping`; `field_mapping` JSONB | integration | low | — | P1 |
| C41 | Provenance columns on canonical rows | **Missing** | — | needs `properties.source*` | medium | — | P1 |
| C42 | Source-of-truth conflict policy enforcement | **Missing** | — | — | medium | — | P1 |
| C43 | Secrets never logged | **Partial** (key redacted from API; `console.error` used) | `feeds/route.ts` eslint-disable | — | medium | — | P0 |
| C44 | Audit trail for import actions | **Partial** (run/item rows are the trail; no separate audit_log entries) | ledger tables | — | low | — | P1 |

**P0 themes (MVP-blocking):** real secret store (C3), `SourceConnector` (C4) + CSV (C5),
fix publish (C16–C19), empty-feed guard (C20), SSRF allowlist (C24), cross-tenant denial
tests (C28).
