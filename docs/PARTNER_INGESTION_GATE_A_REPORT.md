# Partner Ingestion — Gate A Report

> **Date:** 2026-06-19
> **Branch:** `feature/partner-ingestion`
> **Author:** Gate-A documentation package (TrueDeed partner ingestion / three-action
> estate-agent portfolio onboarding).
> **Rule:** every conclusion cites a repo file / table / official source, or is marked an
> explicit **[assumption]**.

This is the 20-point Gate-A conclusion. It sits atop the package:
[Research](./ESTATE_AGENT_LISTING_DISTRIBUTION_RESEARCH.md) ·
[Audit](./PARTNER_INGESTION_CODEBASE_AUDIT.md) ·
[Data flow](./CURRENT_LISTING_DATA_FLOW.md) ·
[Dictionary](./AGENCY_AND_LISTING_DATA_DICTIONARY.md) ·
[Capability matrix](./PARTNER_INGESTION_CAPABILITY_MATRIX.md) ·
[Connector architecture](./PARTNER_CONNECTOR_ARCHITECTURE.md) ·
[Canonical contract](./CANONICAL_LISTING_CONTRACT.md) ·
[Source-of-truth policy](./LISTING_SOURCE_OF_TRUTH_POLICY.md) ·
[3-action spec](./THREE_ACTION_AGENCY_ONBOARDING_SPEC.md) ·
[Security review](./PARTNER_INGESTION_SECURITY_REVIEW.md) ·
[TDD plan](./PARTNER_INGESTION_TDD_PLAN.md) ·
[Traceability](./PARTNER_INGESTION_REQUIREMENTS_TRACEABILITY.md) ·
[Roadmap](./PARTNER_INGESTION_ROADMAP.md).

---

## 20-point conclusions

1. **Goal is achievable on the existing schema.** `properties` (physical) and `listings`
   (marketing) are already separate (`003001_property_portal.sql:37,68`); onboarding maps
   onto them without new core tables.
2. **Codex built the right spine.** `normalize→validate→ledger→review→approve→publish`
   exists (`agent-feed-import-service.ts`) with idempotency, RLS, and tenant triggers
   (`20260619120003_agent_feed_import_ledger.sql`).
3. **The MVP is connector-less.** The "Reapit connector" is a hardcoded 3-item fixture
   (`normalizeReapitFixture`, `:106`). A `SourceConnector` abstraction is needed
   (architecture §2).
4. **Pilot anchor = CSV + Sandbox; first live = Reapit.** Reapit has public, complete
   OAuth2/OIDC REST docs + public sandbox (*confirmed-official*, research §2); Alto/Jupix
   specs are gated or decade-old (conflict #2).
5. **UK distribution is feed/API, never scraping.** Rightmove (RTDF three-call: Send/
   Remove/Get-branch-list, keystore auth, GO-LIVE call), Zoopla (branch-ID handshake),
   Jupix (nightly XML at a unique URL), Reapit/Street (REST+webhooks) — all
   credentialled (research §2).
6. **Material information is a hard publish gate.** NTSELAT Part A (council tax, price,
   tenure) always material under the CPRs (*confirmed-official*); `validateNormalizedListing`
   already enforces tenure/price/planning/address.
7. **Tenancy is single-user today.** Everything keys on `agent_id` (one `auth.users` id);
   `agent_agency_profiles.agent_id` is `UNIQUE` (`20260313:42`). Org model is additive
   (spec §6).
8. **RLS + triggers give real isolation,** but ledger RLS is **select-only** so writes are
   service-role — correctness depends on explicit `.eq("agent_id", …)` filters + the
   `assert_feed_*_tenant` triggers (security §1).
9. **Secrets are not really stored.** `createSecretReference` returns a placeholder
   `vault://…` string (`agent-feed-service.ts:32`); production needs real Vault (security §2).
10. **API never leaks the key** (`redactFeedIntegration`, `toFeedIntegrationView`) — good.
11. **SSRF is unmitigated.** Media `source_url` is inserted unvalidated and a real
    connector will fetch URLs; an allowlist is required (security §3).
12. **No webhook handler exists** though the UI advertises one
    (`FeedIntegrationConfig.tsx:602`); build it on the Stripe template (signature+replay)
    or remove the advertised URL (security §4).
13. **Publish is defective in four ways** (data flow §10, capability C16–C19) — see Known
    gaps below.
14. **The import path bypasses `createListing`/`media-service`,** so it loses geocoding,
    MV refresh, slug/tsv triggers, and the publish guard — the fix is to reuse them.
15. **Idempotency is solid:** `UNIQUE(integration_id, source_fingerprint)` on runs and
    `UNIQUE(run_id,item_type,external_id)` on items + SHA256 fingerprints; mirror PPD
    ingest (`truedeed-ppd-ingest.ts`) for async.
16. **Source-of-truth conflicts are unhandled.** No provenance model yet; policy designed
    in `LISTING_SOURCE_OF_TRUTH_POLICY.md` (14 scenarios) on a proposed `field_provenance`.
17. **Empty-feed guard is missing** — critical given Jupix's "absent = removed" model;
    without it a partial nightly pull could mass-archive a portfolio.
18. **The six cross-tenant denial tests do not exist** (capability C28); they are P0.
19. **E2E + screenshots are blocked** by a missing seeded agent (`e2e/.auth/agent.json`);
    seeding is a Gate-B prerequisite.
20. **Recommended sequence:** Gate B (working synthetic build + defect fixes + security)
    → C (org + Vault + async) → D (Reapit live) → E (Alto/Jupix + outbound). No live
    work needs credentials until D.

---

## Known gaps in the current Codex MVP

All verified by reading `src/services/agent/agent-feed-import-service.ts` +
`src/services/listings/listing-service.ts`:

1. **Publish creates duplicates on re-publish** — `publishApprovedImportItem` inserts a
   **new** `properties`+`listings` row every run; it never upserts against
   `feed_listing_links.external_listing_id` before insert (`:503`,`:531`,`:570`).
2. **Publishes as `draft`, so not searchable** — inserts `status:'draft'` (`:539`); the
   `search_listings` MV is `WHERE l.status='active'` (`003001:321`).
3. **No coordinates set, so no map markers** — publish skips `set_property_coordinates`
   (which `createListing` calls, `listing-service.ts:134`).
4. **No empty-feed guard** — nothing stops a 0-item / sharply-reduced pull from being
   treated as authoritative.
5. **No connector abstraction** — the Reapit fixture is inlined; there is no
   `SourceConnector` and no CSV/sandbox connector.
6. **No org model yet** — single-user `agent_id` tenancy throughout.

Secondary: cosmetic "Test Connection" (regex only), advertised-but-missing webhook route,
secret placeholder not Vault, SSRF unmitigated, no cross-tenant denial tests.

---

## Decisions needed from product

1. **Org model timing** — build the `organisations`/`memberships` migration in Gate B or
   defer to Gate C? (Spec §6 is additive either way.)
2. **Provider enum** — approve widening `agent_feed_integrations.provider` CHECK to add
   `csv`,`sandbox`,`generic` (data dictionary §1).
3. **Provenance storage** — approve Canonical Contract option **B** (`source` columns +
   `field_provenance JSONB`) vs A (in `features`) vs C (separate table).
4. **Empty-feed reduction threshold** — confirm the "< X% of last-known active → hold"
   value (proposed 50%, source-of-truth S5).
5. **Publish default** — should imported items publish `active` immediately on Publish, or
   stage as `draft` with an explicit go-live? (Affects PR10.)
6. **First live connector** — confirm Reapit (recommended) vs Alto/Jupix.
7. **Webhook URL** — remove from UI until a signed handler ships, or build the handler in
   Gate B?

---

## Verification note

This is a documentation-only Gate-A package; no code, migration, test, or config files
were changed. Build/test gates are **not** asserted green here — they are Gate-B exit
criteria (roadmap). All codebase claims were read from the cited files in the
`feature/partner-ingestion` worktree on 2026-06-19.
