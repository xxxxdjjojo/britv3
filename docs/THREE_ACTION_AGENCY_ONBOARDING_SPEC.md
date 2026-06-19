# Three-Action Agency Onboarding Spec

> **Date:** 2026-06-19
> **Gate:** A (UX spec).
> **Goal:** an estate agency onboards its existing portfolio in **three actions —
> Connect → Review → Publish** — by connecting an authorised CRM/feed. No scraping,
> no portal passwords, no fabricated data.

Cross-refs: [`PARTNER_CONNECTOR_ARCHITECTURE.md`](./PARTNER_CONNECTOR_ARCHITECTURE.md),
[`LISTING_SOURCE_OF_TRUTH_POLICY.md`](./LISTING_SOURCE_OF_TRUTH_POLICY.md),
[`PARTNER_INGESTION_SECURITY_REVIEW.md`](./PARTNER_INGESTION_SECURITY_REVIEW.md).

---

## 1. Route mapping (existing surfaces — verified)

| Action | Route | File | Today |
|---|---|---|---|
| Hub | `/dashboard/agent/integrations` | `src/app/(protected)/dashboard/agent/integrations/page.tsx` | exists |
| **All three actions** | `/dashboard/agent/integrations/feeds` | `src/app/(protected)/dashboard/agent/integrations/feeds/page.tsx` → renders `FeedIntegrationConfig.tsx` | Connect/Review/Publish stepper already present |
| Nav entry | — | `src/config/navigation.ts:566` ("Feeds", `Plug` icon) + command-palette `:761` | wired |

The UI already derives `activeStep` (`Connect`/`Review`/`Publish`) in
`FeedIntegrationConfig.tsx:349`. This spec tightens each step.

## 2. Action 1 — Connect

**User intent:** "link my CRM/feed." **Outcome:** an `agent_feed_integrations` row +
a verified, secret-backed credential.

- Provider picker. **Add to the picker now:** `csv` (upload) and `sandbox` (demo) — the
  working-build pilots — alongside reapit/alto/jupix. *(Requires widening the `provider`
  CHECK; see capability matrix C5/C6 and data dictionary §1.)*
- Credential entry per connector:
  - **CSV:** file upload (no secret) → stored object handle.
  - **Sandbox:** none (synthetic).
  - **Reapit/Alto/Jupix:** API key / OAuth — stored as a **real Vault reference**, never
    the placeholder string (security review).
- **Test Connection must actually probe the source** (`SourceConnector.testConnection`),
  not the current regex-only check (`handleTestConnection`, C32).
- Never ask for a **portal** password (Rightmove/Zoopla/OTM). Connect is CRM/feed only.

**Done when:** `sync_status='connected'` and a credential resolves.

## 3. Action 2 — Review

**User intent:** "check what's about to be imported." **Outcome:** an import run in
`needs_review`, with per-item validation + branch mapping visible.

- Triggering Connect's "Sync"/"Import" runs `runImport(connector, ctx)` →
  `feed_import_runs` + `feed_import_items` (reuse existing ledger).
- Review table (already in `FeedIntegrationConfig.tsx:415`) shows: title, address, price,
  status, **validation errors**, branch, withdrawn count.
- **Empty-feed guard** surfaces here: a 0-item or sharply-reduced pull shows a blocking
  warning, not an archival sweep (source-of-truth S5).
- **Material-information gate** shown per item (NTSELAT Part A missing → red, blocks
  publish; Part B/C missing → warn). Backed by `validateNormalizedListing`.
- **Source-of-truth divergences** (re-import over edited fields, S2) listed for resolution.
- Branch detection: unmapped `external_branch_id` prompts map-to-`agent_branches` or create.

**Done when:** the agent has reviewed and clicked **Approve Eligible**
(`approveEligibleFeedImportRunItems` → items `approved`).

## 4. Action 3 — Publish

**User intent:** "make these live on TrueDeed." **Outcome:** canonical listings created,
**searchable**, with map markers.

- `publishApprovedFeedImportRunItems` — but **fixed** to:
  1. Publish **through** `createListing`/`uploadPropertyImage` (inherits geocode → map
     marker, MV refresh, slug/tsv, publish guard) — fixes C17/C18/C19.
  2. **Upsert** against `feed_listing_links.external_listing_id` — fixes duplicate-on-
     re-publish (C16/S6).
  3. Set `status='active'` (policy-gated) so listings hit `search_listings` — today they
     stop at `draft` (C17). Publishing as `draft` should be an explicit "stage, don't
     publish" choice, not the default.
- Result panel: N listings live, links to each, any items held back with reasons.

**Done when:** approved items are `published`, linked, active, and visible in search/map.

## 5. Empty/error/partial states

| State | UX |
|---|---|
| Empty feed | Block + "We received 0 listings — nothing was changed" (guard) |
| Partial failure | Publish what's eligible; list failures with item-level reasons (200≠success) |
| Connection error | Surface transport error; `sync_status='error'`; offer retry |
| Re-sync | Idempotent (same fingerprint → same run); diffs shown in Review |

## 6. Tenancy / org migration path

**Today:** one `agent_agency_profiles` per `agent_id` (UNIQUE), `agent_branches` and the
whole ledger keyed on `agent_id` (= one `auth.users` id). **Target:** proper
`organisations` / `branches` / `organisation_memberships`.

**Migration (additive, non-destructive):**

1. Add `organisations` (seed one org per existing `agent_agency_profiles`, `owner_user_id = agent_id`).
2. Add `organisation_memberships(organisation_id, user_id, role)` (seed owner from `agent_id`; absorb `agent_team_members`).
3. Add `organisation_id` to `agent_branches`, `agent_feed_integrations`, `listings`,
   `feed_import_*`, `feed_*_links` — **backfill from `agent_id`'s org**, keep `agent_id`
   for a deprecation window.
4. Re-point RLS from `agent_id = auth.uid()` to `organisation_id IN (memberships of auth.uid())`;
   keep the old policy until backfill verified.
5. Update `require-agent.ts` → org-aware authorization (is the user a member of the org
   that owns this integration/listing?).
6. Drop `agent_id` dependence once green.

Ownership migrates `agent_id → organisation_id`; the connector `ConnectorContext` already
carries `organisationId` (pre-migration it equals `agentId`).
