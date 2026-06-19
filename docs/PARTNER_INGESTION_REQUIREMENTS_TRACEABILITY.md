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
| PR5 | CSV connector (pilot anchor) | `PARTNER_CONNECTOR_ARCHITECTURE.md` §5 | CSV unit + db-test | **partial** (CSV parse → canonical mapping → per-row errors → error report: covered by `src/services/connectors/csv-connector.test.ts` unit tests. CSV → import run → approve + schema acceptance of an ACTIVE `listings` row + run-fingerprint idempotency UNIQUE on `(integration_id, source_fingerprint)`: covered by `db-tests/feed-csv-import.test.ts` raw-SQL on ephemeral Postgres. `publishApprovedImportItem` service function: covered by mocked unit tests in `src/services/agent/agent-feed-import-service.test.ts`. TRUE end-to-end "CSV import publishes a live active listing" via the real publish code against a Postgres+PostgREST stack is DEFERRED to Phase C2 E2E against the local Supabase stack.) |
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
| PR25 | Seeded agent for E2E + screenshots | `TDD_PLAN.md` §5,§6 | E1–E13 enablement | **done** (C1: `scripts/seed-onboarding-fixture.mjs` seeds org+membership+integration; `test-agent@britestate.test` authenticates against local API — proven; `e2e-onboarding-local.sh` is the reset-free onboarding gate runner) |

## Notes
- **done** rows are limited to what is verifiably present in this worktree.
- Several rows are **partial**: Codex's MVP built the *spine* (ledger, validation, RLS,
  review/approve, draft publish) but the connector abstraction, searchable/mapped publish,
  dedup, empty-feed guard, Vault, SSRF, and denial tests are not yet built.

## C1 — Reset-free local harness (2026-06-20)

**Why a separate runner:** The local DB has a pre-existing migration-history drift
(`schema_migrations` contains ~89 legacy short-prefix versions such as `"017"` that
pre-date the 14-digit `YYYYMMDDHHMMSS` convention). Running `supabase db reset`
replays the full history and fails at `017_service_provider_details(id)`, leaving
the dev DB broken. See `docs/PARTNER_INGESTION_NEXT_SESSION_PROMPT.md §4` for detail.

**Approach (C1):**
- `scripts/seed-onboarding-fixture.mjs`: idempotent seed (org + membership + integration
  for `test-agent@britestate.test`); asserts `SUPABASE_URL` contains `127.0.0.1` or
  `localhost` before doing anything; exits non-zero if that assertion fails.
- `scripts/e2e-onboarding-local.sh`: reset-free variant of `e2e-local.sh`. Runs
  `supabase start` (idempotent, no reset), exports local env from `supabase status`,
  nudges PostgREST schema cache, ensures `set_property_coordinates` exists locally,
  seeds users then the onboarding fixture, then runs Playwright with `CI=1`.

**The §6 gate's `bash scripts/e2e-local.sh` reference is superseded for onboarding
E2E by `bash scripts/e2e-onboarding-local.sh`** (the reset-free runner). The
canonical `e2e-local.sh` remains the gate for the dashboard smoke suite (where reset
is safe because those migrations don't hit the drift).
