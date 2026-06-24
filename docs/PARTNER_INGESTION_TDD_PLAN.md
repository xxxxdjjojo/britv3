# Partner Ingestion TDD Plan

> **Date:** 2026-06-19
> **Gate:** A (test design).
> **Frameworks:** Vitest (`vitest.config.mts`) for unit/contract/db-static;
> Playwright (`playwright.config.ts`, `playwright.link-render.config.ts`) for E2E.
> House style matches `VALUATION_TDD_PLAN.md` (RED → GREEN → REFACTOR, AAA, ≥80% on
> the pipeline). Existing coverage is folded in and gaps marked **new**.

Cross-refs: [`PARTNER_INGESTION_REQUIREMENTS_TRACEABILITY.md`](./PARTNER_INGESTION_REQUIREMENTS_TRACEABILITY.md),
[`PARTNER_INGESTION_SECURITY_REVIEW.md`](./PARTNER_INGESTION_SECURITY_REVIEW.md).

---

## 1. Fixtures (synthetic only — no real credentials, no fabricated "real" data)

| Fixture | Purpose | Notes |
|---|---|---|
| `REAPIT_FIXTURE` (exists, `agent-feed-import-service.ts:106`) | 3 listings incl. 1 `withdrawn`, 1 with missing media | reuse for SandboxConnector |
| `csv-portfolio.fixture.csv` **new** | CSV connector input (valid + invalid rows) | exercises CSV parse + validation |
| `sandbox-feed.fixture.json` **new** | generic connector full-snapshot | exercises empty-feed guard variants |
| `empty-feed.fixture` **new** | 0 items | empty-feed guard must abort, archive nothing |
| `reapit-contract.fixture.json` **new** | shape from Reapit public docs (HAL, paged) | contract test only; no network |
| `jupix-xml.fixture.xml` **new** | absent-equals-removed snapshot | tombstone + guard |
| `ssrf-media.fixture` **new** | media URLs incl. `http://169.254.169.254`, `localhost`, redirect-to-internal | SSRF allowlist tests |

## 2. Unit tests (Vitest)

Existing (`agent-feed-import-service.test.ts`, 7): normalize fixture; validate material
info; withdrawn=tombstone; idempotent run+items; approve; publish-to-draft.
Existing (`agent-feed-service.test.ts`, 3): redaction; secret-ref-only; no sync_status mutation.

**New:**
- `SourceConnector` contract: each connector returns `NormalizedFeedListing[]` + fingerprint.
- CSV parse: valid rows normalize; bad rows → `validation_errors`.
- Empty-feed guard: 0 items → run `failed`, **no archival**.
- Publish **dedup**: re-publishing same `external_id` updates the existing listing
  (no second `properties`/`listings` row) — reproduces & fixes C16.
- Publish **searchable**: published item ends `status='active'` and geocode RPC called
  (reproduces & fixes C17/C18/C19).
- Source-of-truth S2: feed update over a `truedeed_edit` field does not overwrite.
- SSRF allowlist: internal/loopback/redirect URLs rejected before fetch.

## 3. Contract tests (Vitest, no network)

- Reapit: fixture matches documented envelope (`statusCode`,`errors[]`, `_embedded`,
  pagination); `reapit-customer` header required; soft-delete maps to tombstone.
- Jupix: absent items → tombstone; full-snapshot semantics.
- "HTTP 200 ≠ success": a connector `fetch` with `transport.ok=true` but invalid items →
  zero publishable.

## 4. DB / RLS / trigger tests (Vitest static + live where available)

Existing static: table presence, RLS posture, tenant indexes, idempotency constraints,
tenant triggers. **New (live or static-assert):**
- `assert_feed_listing_link_tenant` raises on cross-tenant `listing_id`.
- `assert_feed_branch_link_tenant` raises on cross-tenant `branch_id`.
- `UNIQUE(integration_id, external_listing_id)` blocks duplicate link.
- The **six cross-tenant denial tests** D1–D6 (security review §5).

## 5. E2E scenarios (Playwright) — 13

Requires a seeded agent (`e2e/.auth/agent.json`) — **currently missing** (audit known
boundary); seeding is a prerequisite task.

| # | Scenario | Asserts |
|---|---|---|
| E1 | Connect CSV | upload → integration row, `sync_status='connected'` |
| E2 | Connect sandbox | demo connect with no secret |
| E3 | Test Connection (real probe) | success/failure message reflects actual probe, not regex |
| E4 | Import → Review populates | run `needs_review`; items + validation visible |
| E5 | Material-info gate | item missing tenure shows error, not publishable |
| E6 | Empty-feed guard | 0-item import blocks, archives nothing |
| E7 | Approve eligible | items → `approved` |
| E8 | Publish → searchable | published listing appears in search + map marker |
| E9 | Re-import dedup | second import does not duplicate listings |
| E10 | Upstream withdrawal | withdrawn item archives listing (soft), audit present |
| E11 | Source-of-truth divergence | edited field preserved, divergence surfaced |
| E12 | Branch mapping | unmapped branch prompts map/create |
| E13 | Cross-tenant denial (UI) | agent B cannot see/approve/publish agent A's run |

## 6. Screenshots

Capture Connect / Review / Publish states at 1440 + 768 (`playwright.screenshots.config.ts`)
once the seeded agent exists. Empty-feed and error states included.

## 7. Coverage target

≥80% on `agent-feed-import-service.ts`, the new connectors, and the publish/guard paths
(matches the valuation engine bar). Visual regression supplements, does not replace.
