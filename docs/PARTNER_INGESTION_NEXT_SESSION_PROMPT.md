# Partner Ingestion — Next-Session Prompt & TDD Plan

> **Purpose:** a self-contained brief so a fresh Claude Code session (no prior
> conversation context) can finish the TrueDeed estate-agent **partner-ingestion**
> vertical: connector abstraction → three-action UI → E2E + screenshots → deploy.
> Everything needed to start is in this file. Read it top to bottom first.

---

## 0. How to use this file

1. Read §1–§4 to load context and the hard constraints.
2. Execute §5 phase by phase, **TDD: write the failing test first, watch it fail
   for the right reason, implement the minimum to pass, then refactor.**
3. Commit atomically per task (Conventional Commits). Run the §6 gate before
   claiming any phase done. Do not skip the gate.
4. Stop and ask the human only at the explicit gated steps (prod migration push,
   merge to main).

---

## 1. Role & mission

Act as a senior UK proptech product + integration engineer. The product goal:
an authorised estate agent onboards their existing portfolio into TrueDeed in
three principal actions — **Connect → Review → Publish** — by connecting an
authorised CRM/feed, **without re-keying stock and without scraping portals.**
This is the first vertical of a reusable partner-ingestion framework (other
trades/providers come later).

The earlier audit (Gate A) and the **organisations-model layer** are already
built and verified (see §3). Your job is the remaining four phases in §5,
finished to a "holy shit, that's done" standard: tested, screenshotted, shipped,
no dangling threads. Marginal cost of completeness is near zero — do the whole
thing, do it right.

---

## 2. Non-negotiables (enforce in code + tests)

- No portal scraping; no copied portal pages as portfolio source; never ask for
  a portal password; no fabricated listing data to fill gaps.
- Upstream deletion → **archive + audit**, never a destructive DB delete.
- **Empty-feed safety**: an empty full feed must never silently withdraw a
  published portfolio — block for manual approval (already implemented:
  `assessFeedSafety`).
- **Strict tenant isolation**: one organisation never reads another's
  connections / imports / items / links / listings / credentials.
- Secrets never written to logs/analytics. HTTP 200 ≠ import success (reconcile
  counts).
- Do **not** modify production data during dev/testing. `.env.local` points at
  **prod** — all write-testing targets **local** Supabase only.

---

## 3. Current state — already built & verified (DO NOT redo)

**Branch:** `feature/partner-ingestion`. **Worktree:** `/Users/jojominime/Documents/britv3main/wt-partner-ingestion`
(the canonical checkout `britv3` must stay on its own branch — never branch-switch
the shared `britv3` checkout; an external actor has reset it mid-work before).
If the worktree is gone, recreate: `git worktree add ../wt-partner-ingestion feature/partner-ingestion`.

**Commits on the branch (newest first):**
- `8e4f4c74` harden(organisations): security + code-review fixes
- `97dc36a0` fix(agent-feeds): bg-surface token (brand guard)
- `12a9ce04` feat(organisations): org-aware ingestion service + organisation-service
- `58d7b59e` feat(organisations): tenancy model + org-scoped ingestion + backfill
- `e51ebb3b` docs(partner-ingestion): Gate A doc package (14 docs under `docs/`)
- `1b62708a` feat(agent-feeds): publish→active, dedup re-publish, coordinates, search refresh, empty-feed guard, withdrawal archive
- (below: cherry-picked Codex agent-feed MVP — ledger schema, import service, feed API routes, FeedIntegrationConfig UI)

**What works today (verified):**
- **Import pipeline** (`src/services/agent/agent-feed-import-service.ts`):
  normalize Reapit-shaped fixture → validate → approve → **publish to `active`
  listing** with dedup (re-publish UPDATES, no duplicate), PostGIS coordinates,
  `search_listings` MV refresh, empty-feed guard, withdrawal→archive,
  idempotent re-import (no status reset). Stamps `organisation_id` onto run /
  items / links / published listing.
- **Org model** (migrations `20260619140000/140001/140002`): `organisations`,
  `organisation_memberships`, `is_org_member`/`has_org_role` SECURITY DEFINER
  helpers (non-recursive RLS), `organisation_id` on agent_branches /
  agent_feed_integrations / the 5 `feed_*` tables / listings, membership SELECT
  policies (integrations scoped to owner/admin), org-consistency feed triggers,
  idempotent agency→org backfill. `src/services/organisations/organisation-service.ts`.
- **Feed ledger** (`20260619120003`): `feed_import_runs/items/listing_links/branch_links/media_links`.
- **Gate A docs**: `docs/PARTNER_INGESTION_*.md`, `ESTATE_AGENT_LISTING_DISTRIBUTION_RESEARCH.md`,
  `CANONICAL_LISTING_CONTRACT.md`, etc. (READ `PARTNER_CONNECTOR_ARCHITECTURE.md`
  and `THREE_ACTION_AGENCY_ONBOARDING_SPEC.md` and `PARTNER_INGESTION_TDD_PLAN.md`
  before starting — they hold the connector contract, UX spec, and 13 E2E scenarios).

**Verification already passing:** full `pnpm build` exit 0; full unit suite
(`pnpm exec vitest run`) 3,559 pass; `db-tests/organisations-model.test.ts` 10/10
on real Postgres (incl. cross-org isolation); migrations unique; live-DB proof of
publish (dedup + org_id + searchable + geocoded).

---

## 4. Environment & gotchas (critical — read before running anything)

- **App root** is the worktree itself (`src/app`, `supabase/migrations`, `docs`).
  `CLAUDE.md`'s "`britv3.0/` subdir" note is STALE — ignore it.
- **`.env.local` → PROD Supabase.** Never run write-tests against it. For local
  work use the running local stack at `http://127.0.0.1:54321`
  (`supabase status -o env` gives `API_URL` / `SERVICE_ROLE_KEY` / `ANON_KEY`).
- **Local DB has migration-history drift**: `supabase migration up` FAILS
  (stale short-prefix versions in `schema_migrations`). Do **not** `supabase db
  reset` (hits the `017 service_provider_details(id)` drift). Apply individual
  migrations directly: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f <file>`
  (migrations are written idempotent: `CREATE TABLE IF NOT EXISTS`, `DROP POLICY
  IF EXISTS`, `CREATE OR REPLACE`). Local DB is currently at the org migrations.
- **`set_property_coordinates(p_property_id, p_lng, p_lat)`** exists on PROD but
  is in NO migration (out-of-band). For local testing it was created by hand; if
  missing locally, recreate:
  `update properties set coordinates = ST_SetSRID(ST_MakePoint(p_lng,p_lat),4326)::geography where id=p_property_id;`
- **`refresh_search_listings()`** (no args) and the `search_listings` MV exist.
- **Migration timestamps**: use a full 14-digit `YYYYMMDDHHMMSS_*` prefix that
  is unique — run `node scripts/check-migration-versions.mjs` (CI gate). Note
  `20260619130000` and `20260619140000` are taken; pick e.g. `20260619150000+`.
- **`provider` CHECK** lives at `supabase/migrations/20260313_agent_dashboard.sql:493`
  — `CHECK (provider IN ('reapit','alto','jupix'))`. Widen via a NEW migration
  (drop + re-add), do not edit history.
- **E2E against local DB**: there is an established runner `scripts/e2e-local.sh`
  and auth setup `e2e/auth.setup.ts` (seeds storageState for role users incl.
  `test-agent@britestate.test` / `TestPassword123!`). Playwright configs:
  `playwright.config.ts`, `playwright.screenshots.config.ts`. Map screenshots
  need Playwright's SwiftShader WebGL; MapTiler key 403s on localhost (OSM
  fallback exists).
- **db-test harness** (`db-tests/harness.ts`): boots an ephemeral
  `postgres:15-alpine` via docker, `applyPrerequisites()` stubs the schema.
  `agent_branches`/`agent_feed_integrations` RLS comes from migration `20260313`
  (NOT in the base stub) — `db-tests/organisations-model.test.ts`'s `EXTRA_STUB`
  shows how to mirror it. Run db-tests with `RUN_DB_TESTS=1 ... --config vitest.db.config.ts`.
- **Brand guard**: `src/__tests__/brand/dashboard-brand-guard.test.ts` fails on
  `bg-gray-50/100`, `bg-slate-50/100`, `bg-neutral-50`, hardcoded brand-green
  hex in dashboard source — use `bg-surface` and design tokens.
- **Test commands**: `pnpm test` (vitest watch — use `pnpm exec vitest run`),
  `pnpm test:db`, `pnpm test:e2e`, `pnpm build`, `pnpm lint`, `pnpm check:migrations`.
- **Subagents drift** (reword labels, drop displayed data, fabricate numbers,
  fake buttons) — run an adversarial diff-vs-HEAD review per area before commit.

---

## 5. The TDD plan — four phases

> Connectors are the dependency for a non-fake UI, so do them first. Each task:
> failing test → implement → pass → commit. Two standing defaults: **(1) media is
> URL-reference only this phase** (real download + SSRF hardening is a later media
> phase); **(2) prepare deploy (PR + green CI) but do NOT merge to main or push
> prod migrations without explicit human go.**

### Phase A — Connector abstraction + CSV + sandbox connectors

- **A1 — Widen provider CHECK.** New migration: drop + re-add
  `agent_feed_integrations.provider` CHECK to include `csv`, `sandbox`,
  `generic_feed`. Apply locally (idempotent). **Validate:** db-test asserts
  `csv`/`sandbox` insert succeeds and a junk provider is rejected;
  `pnpm check:migrations` green.
- **A2 — `SourceConnector` contract + registry.** `src/services/connectors/source-connector.ts`
  (type: `providerKey`, `capabilities`, `discoverBranches(input)`,
  `fetchListings(input) → { listings: NormalizedFeedListing[]; errors: RowError[] }`).
  `registry.ts` resolves providerKey → connector. **Validate:** unit test resolves
  each provider + capability flags.
- **A3 — Refactor import service to connector-driven.** Extract
  `createImportRunFromListings(supabase, agentId, integrationId, providerKey, listings)`
  from `createDeterministicReapitImportRun`; make Reapit a `reapit-sandbox`
  connector wrapping `normalizeReapitFixture`. **Validate:** existing
  `agent-feed-import-service.test.ts` stays green; new test drives the run via a
  connector.
- **A4 — Sandbox/generic-feed connector** (RTDF/BLM-shaped XML + JSON fixtures):
  full sync, incremental price-change, withdrawal/tombstone. **Validate:**
  connector contract tests — unknown enum, invalid payload, status change,
  deletion, pagination.
- **A5 — CSV connector** (field-mapping → canonical, per-row errors,
  downloadable error report). Mirror `iteratePpdCsv` streaming. **Validate:**
  unit tests (valid CSV; invalid CSV → row-level errors) + `db-tests/feed-csv-import.test.ts`
  proving a CSV import publishes an active listing.

### Phase B — Three-action UI

- **B1 — Connect/Review/Publish UI** wired to connectors. Extend/split
  `src/components/dashboard/agent/integrations/FeedIntegrationConfig.tsx`
  (keep files < 800 lines):
  - **Connect**: show ONLY genuinely-supported sources (reapit-sandbox, sandbox
    feed, CSV upload); data-access explainer; no fake/unsupported CRM buttons.
  - **Review**: detected org + branches; counts (source / new / eligible /
    warnings / blocked / duplicates / missing-media / missing-coords); branch +
    status mapping; progressive disclosure (don't force per-listing inspection).
  - **Publish**: publish eligible only; post-publish counts + search-index +
    map-marker status + links (view portfolio, sync settings, resolve exceptions).
  - Design-quality: brand tokens, hierarchy, intentional hover/focus states.
  - **Validate:** brand guard green; component-render tests; nav/link-render test
    (`configured-route-targets`) green.

### Phase C — E2E + authenticated screenshots (against LOCAL Supabase)

- **C1 — Seed + harness.** `scripts/seed-onboarding-fixture.mjs`: seed local
  `test-agent` user (admin API) + profile(agent) + organisation + membership +
  integration. Ensure `scripts/e2e-local.sh` boots `next dev` against local
  Supabase env. **Validate:** `test-agent` can log in locally; seed is idempotent.
- **C2 — `tests/e2e/agency-portfolio-onboarding.spec.ts`** — the 13 scenarios
  from `docs/PARTNER_INGESTION_TDD_PLAN.md`:
  1 connect supported CRM, 2 review portfolio, 3 publish (→ public, in search, on
  map, images load), 4 automatic price update (no dup, price history), 5 status
  changes, 6 upstream deletion (archive, audit kept), 7 import failures
  (bad creds/rate-limit/malformed/media timeout), 8 empty-feed protection,
  9 duplicates, 10 tenant isolation, 11 disconnect, 12 CSV fallback (valid +
  invalid downloadable errors), 13 (other-trader — defer, note in traceability).
  UI-drivable scenarios via Playwright; data-integrity ones (8,9,10, status,
  withdrawal) cite the existing `db-tests`/service tests in
  `docs/PARTNER_INGESTION_REQUIREMENTS_TRACEABILITY.md` — **no fake UI assertions.**
  **Screenshots** at 320/768/1024/1440 for Connect/Review/Publish + search results
  + map markers + a resolved public listing page; save under `test-results/evidence/`.
  **Validate:** `bash scripts/e2e-local.sh` green; screenshots present.

### Phase D — Deploy (gated)

- **D1 — Deploy prep.** Full §6 gate green → open PR `feature/partner-ingestion` →
  `main`; get CI green. **GATED — require explicit human go before:** (a) pushing
  the new migrations to the **prod** DB via the manual flow in
  `supabase/migrations/README.md`, and (b) squash-merging to `main` (which
  auto-deploys to Vercel / truedeed.co.uk). Do not do either without confirmation.

---

## 6. Verification gate (definition of done — run the FULL gate, not a subset)

```bash
cd /Users/jojominime/Documents/britv3main/wt-partner-ingestion
pnpm exec vitest run                         # full unit suite (currently 3,559 pass + new)
RUN_DB_TESTS=1 pnpm exec vitest run --config vitest.db.config.ts db-tests --testTimeout=120000
pnpm exec vitest run src/__tests__/brand/dashboard-brand-guard.test.ts
pnpm check:migrations
pnpm build                                   # must exit 0
bash scripts/e2e-local.sh                    # seeded local-DB E2E + screenshots
```
- Read the ACTUAL error on failure (OTel/Sentry/Redis warnings are noise; the
  real failure follows "Running TypeScript"). A failing file in feature code is
  YOUR bug, not "pre-existing".
- A portfolio is "onboarded" only when: listings exist, public pages resolve,
  search returns them, map markers render where geocoded, media loads, perms are
  correct, and reconciliation counts match.
- Adversarial diff-vs-HEAD review of any subagent-authored file before commit.

---

## 7. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| `next dev` can't boot onboarding routes vs local DB (missing 13 main migrations + drift) | HIGH | onboarding needs only org+ledger+listings (present); apply missing fns (`set_property_coordinates`) locally; use `e2e-local.sh` |
| Authenticated screenshots need working local login for `test-agent` | HIGH | seed user via admin API in seed script; mirror `auth.setup.ts` storageState |
| Some of the 13 scenarios aren't cleanly UI-drivable | MEDIUM | cover at db-test/service layer + cite in traceability; no fake UI assertions |
| New UI trips the dashboard brand guard | MEDIUM | use `bg-surface`/tokens; run guard in the loop |
| Media SSRF / download | MEDIUM | store source URL only this phase; SSRF allowlist is a later media phase |
| Deploy to prod | — | PR + CI only; prod migration push + merge are explicit gated steps |
| Subagent drift | MEDIUM | adversarial diff-vs-HEAD review per area |

---

## 8. Key file map

- Import pipeline: `src/services/agent/agent-feed-import-service.ts` (+ `.test.ts`)
- Feed integration CRUD: `src/services/agent/agent-feed-service.ts`
- Org service: `src/services/organisations/organisation-service.ts`
- Feed API routes: `src/app/api/agent/feeds/route.ts`, `feeds/[id]/sync/route.ts`,
  `feed-imports/[runId]/approve|publish/route.ts`; agent guard `src/lib/api/require-agent.ts`
- UI: `src/components/dashboard/agent/integrations/FeedIntegrationConfig.tsx`
- Migrations: `supabase/migrations/20260619120003_*` (ledger),
  `20260619140000/140001/140002_*` (org model)
- Ledger + org db-test: `db-tests/organisations-model.test.ts`; harness `db-tests/harness.ts`
- Listing lifecycle (reference): `src/services/listings/listing-service.ts`
- Connector contract spec: `docs/PARTNER_CONNECTOR_ARCHITECTURE.md`
- UX spec: `docs/THREE_ACTION_AGENCY_ONBOARDING_SPEC.md`
- 13 scenarios + fixtures: `docs/PARTNER_INGESTION_TDD_PLAN.md`
- Traceability (update as you go): `docs/PARTNER_INGESTION_REQUIREMENTS_TRACEABILITY.md`

---

*Generated as a handoff brief. Start a fresh session, read this file, and execute
§5 phase by phase under §6's gate. Build the complete thing.*
