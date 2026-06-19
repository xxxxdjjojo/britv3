# Partner Ingestion Requirements Traceability

> **Date:** 2026-06-19
> **Gate:** A. Living matrix mapping each requirement → design doc → test → status.
> House style matches `VALUATION_REQUIREMENTS_TRACEABILITY.md`.
> **Status legend:** done · partial · planned.

| # | Requirement | Doc(s) | Test(s) | Status |
|---|---|---|---|---|
| PR1 | Three-action onboarding (Connect→Review→Publish) on existing dashboard route | `THREE_ACTION_AGENCY_ONBOARDING_SPEC.md` | E1–E13 | **partial** (UI stepper exists in `FeedIntegrationConfig.tsx`; CSV/sandbox connect not built) |
| PR2 | No scraping / no portal passwords | `ESTATE_AGENT_LISTING_DISTRIBUTION_RESEARCH.md` §1,§5; `SECURITY_REVIEW.md` §4 | n/a (design constraint) | **done** (Connect is CRM/feed only by design) |
| PR3 | No fabricated fields | `CANONICAL_LISTING_CONTRACT.md` §4; `SECURITY_REVIEW.md` §6 | validate tests, contract tests | **partial** (`validateNormalizedListing` enforces; sandbox fixtures labelled synthetic) |
| PR4 | Adapter-based `SourceConnector` | `PARTNER_CONNECTOR_ARCHITECTURE.md` §2,§3 | connector contract tests | **planned** (Reapit fixture inlined today) |
| PR5 | CSV connector (pilot anchor) | `PARTNER_CONNECTOR_ARCHITECTURE.md` §5 | CSV unit + E1 | **planned** |
| PR6 | Generic sandbox connector | `PARTNER_CONNECTOR_ARCHITECTURE.md` §5 | normalize/validate tests + E2 | **partial** (deterministic Reapit fixture) |
| PR7 | Material-information publish gate (NTSELAT A/B/C) | `RESEARCH.md` §3; `CANONICAL_LISTING_CONTRACT.md` §4 | validate test, E5 | **partial** (Part A enforced) |
| PR8 | Durable import ledger + idempotency (SHA256) | `DATA_DICTIONARY.md` §8; `CODEBASE_AUDIT.md` | idempotent-run/item tests | **done** (`feed_import_*`, fingerprints) |
| PR9 | Explicit review + approval | `THREE_ACTION…SPEC.md` §3 | approve test, E7 | **done** |
| PR10 | Publish creates canonical, **searchable**, mapped listing | `CURRENT_LISTING_DATA_FLOW.md` §10; `SPEC.md` §4 | publish-searchable test, E8 | **planned** (today: draft, no coords) |
| PR11 | No duplicates on re-publish/re-import | `SOURCE_OF_TRUTH_POLICY.md` S6 | dedup test, E9 | **planned** (currently **broken**) |
| PR12 | Upstream deletion → archive + audit (never destructive) | `SOURCE_OF_TRUTH_POLICY.md` S4 | withdrawal test, E10 | **partial** (item-level withdrawn) |
| PR13 | Empty-feed safety check | `PARTNER_CONNECTOR_ARCHITECTURE.md` §4; `SOURCE_OF_TRUTH_POLICY.md` S5 | empty-feed test, E6 | **planned** |
| PR14 | Strict tenant isolation (RLS + triggers) | `SECURITY_REVIEW.md` §1 | static RLS/trigger tests, D1–D6 | **partial** (RLS+triggers exist; denial tests missing) |
| PR15 | Six cross-tenant denial tests | `SECURITY_REVIEW.md` §5 | D1–D6, E13 | **planned** |
| PR16 | Real secret store (Vault), key never exposed/logged | `SECURITY_REVIEW.md` §2 | redaction tests | **partial** (redaction done; Vault placeholder) |
| PR17 | SSRF allowlist on feed/media URLs | `SECURITY_REVIEW.md` §3 | SSRF tests | **planned** |
| PR18 | Webhook signature + replay protection | `SECURITY_REVIEW.md` §4 | webhook tests | **planned** (no handler yet) |
| PR19 | HTTP 200 ≠ import success | `PARTNER_CONNECTOR_ARCHITECTURE.md` §2; `RESEARCH.md` framing | contract test, validate | **done** (item-level gating) |
| PR20 | Field provenance + source-of-truth conflict policy | `CANONICAL_LISTING_CONTRACT.md` §3; `SOURCE_OF_TRUTH_POLICY.md` | S2 test, E11 | **planned** |
| PR21 | Branch detection + mapping | `SPEC.md` §3; `DATA_DICTIONARY.md` §8 | branch test, E12 | **partial** (`feed_branch_links` + UI) |
| PR22 | Organisations/branches/memberships model | `SPEC.md` §6 | post-migration RLS tests | **planned** |
| PR23 | Reuse `createListing`/media-service on publish | `CURRENT_LISTING_DATA_FLOW.md` §10 | publish-searchable test | **planned** |
| PR24 | Async processing (Inngest) mirroring PPD ingest | `CONNECTOR_ARCHITECTURE.md` §4 | — | **planned** |
| PR25 | Seeded agent for E2E + screenshots | `TDD_PLAN.md` §5,§6 | E1–E13 enablement | **planned** (missing `e2e/.auth/agent.json`) |

## Notes
- **done** rows are limited to what is verifiably present in this worktree.
- Several rows are **partial**: Codex's MVP built the *spine* (ledger, validation, RLS,
  review/approve, draft publish) but the connector abstraction, searchable/mapped publish,
  dedup, empty-feed guard, Vault, SSRF, and denial tests are not yet built.
