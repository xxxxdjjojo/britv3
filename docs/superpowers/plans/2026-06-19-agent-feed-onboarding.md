# Agent Feed Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tested link-render fix and a safe estate-agent feed onboarding MVP with review and publish gates.

**Architecture:** Feed integrations are tenant-owned records exposed only through redacted API views. Imports land in an append-only ledger first, then approved and valid items publish into canonical property/listing/media tables as drafts. Live portal or CRM distribution remains outside this change until credentials, Vault-backed secrets, and connector-specific onboarding are available.

**Tech Stack:** Next.js App Router, Supabase, Zod, Vitest, Playwright, SQL migrations.

---

## Assumptions

- Existing `agent_id` ownership remains the tenant boundary for this MVP.
- Live CRM or portal credentials are unavailable.
- Local development stores only secret references; production must back those references with Supabase Vault or an equivalent server-side secret manager.
- Current repo code and schema are the source of truth.

## Completed Task Checklist

### Task 1: Branch and Isolation

**Files:** none.

- [x] Create branch `codex/agent-feed-onboarding`.
- [x] Use an isolated worktree at `/Users/jojominime/Documents/britv3main/britv3-agent-feed-onboarding`.
- [x] Leave unrelated `.mcp.json` state untouched.

### Task 2: Blog Category Link Rendering

**Files:**
- Modify: `e2e/configured-navigation-render.spec.ts`
- Modify: `src/app/(main)/blog/page.tsx`
- Modify: `playwright.link-render.config.ts`

- [x] Add a red Playwright test proving `/blog?category=buying` renders Buying posts and excludes Renting posts.
- [x] Verify the test fails before implementation.
- [x] Implement server-side category parsing, active category state, filtering, and fallback copy.
- [x] Use webpack for the link-render dev server so isolated worktrees with external `node_modules` symlinks can run the evidence test.
- [x] Rerun the link-render test and capture screenshot evidence.
- [x] Commit the red test before the implementation commit.

### Task 3: Feed Route Navigation

**Files:**
- Modify: `src/config/navigation.ts`
- Modify: `e2e/fixtures/link-render-routes.ts`
- Modify: `e2e/dashboard-agent.spec.ts`
- Modify: `e2e/configured-navigation-render.spec.ts`

- [x] Add link-render and dashboard smoke coverage for `/dashboard/agent/integrations/feeds`.
- [x] Expose the Feeds route in agent navigation.
- [x] Remove stale off-navigation allowance for the protected route.
- [x] Commit the route/navigation coverage and implementation.

### Task 4: Feed API Hardening

**Files:**
- Modify: `src/app/api/agent/feeds/route.ts`
- Modify: `src/services/agent/agent-feed-service.ts`
- Modify: `src/components/dashboard/agent/integrations/FeedIntegrationConfig.tsx`
- Create: `src/lib/api/require-agent.ts`

- [x] Add API/unit tests for secret redaction, PATCH body `id`, validation errors, and agent-role guard.
- [x] Return `AgentFeedIntegrationView` records with no `api_key_encrypted`.
- [x] Add Zod request validation.
- [x] Remove client control over arbitrary `sync_status`.
- [x] Replace local base64 storage with a non-secret Vault reference.
- [x] Commit the hardened API contract.

### Task 5: Import Ledger Migration

**Files:**
- Create: `src/__tests__/agent/feed-import-migration.test.ts`
- Create: `supabase/migrations/20260619120003_agent_feed_import_ledger.sql`

- [x] Add migration/static tests for required tables, RLS, tenant indexes, idempotency, and tenant consistency triggers.
- [x] Add import run, item, branch link, listing link, and media link tables.
- [x] Add RLS select policies and service-role write posture.
- [x] Run `pnpm check:migrations`.
- [x] Commit the migration.

### Task 6: Import Services

**Files:**
- Create: `src/services/agent/agent-feed-import-service.ts`
- Create: `src/services/agent/agent-feed-import-service.test.ts`
- Modify: `src/services/listings/listing-service.ts`
- Modify: `src/__tests__/listings/create.test.ts`

- [x] Add red tests for deterministic Reapit-shaped fixture import, idempotency, branch mapping, validation failure, withdrawal/tombstone handling, approval, publish eligibility, and draft listing creation.
- [x] Implement normalization, validation, review approval, and publish services.
- [x] Ensure canonical listing create starts as `draft`.
- [x] Commit the import service implementation.

### Task 7: Review and Publish UI

**Files:**
- Modify: `src/components/dashboard/agent/integrations/FeedIntegrationConfig.tsx`
- Create: `src/app/api/agent/feeds/[id]/sync/route.ts`
- Create: `src/app/api/agent/feed-imports/[runId]/approve/route.ts`
- Create: `src/app/api/agent/feed-imports/[runId]/publish/route.ts`

- [x] Add Connect, Review, Publish flow.
- [x] Show detected branch, eligible listing count, validation errors, and publish count.
- [x] Add sync, approve, and publish API routes.
- [x] Commit the UI/API workflow.

### Task 8: Documentation and Final Verification

**Files:**
- Create: `docs/ESTATE_AGENT_LISTING_DISTRIBUTION_RESEARCH.md`
- Create: `docs/AGENT_FEED_CODEBASE_AUDIT.md`
- Create: `docs/superpowers/plans/2026-06-19-agent-feed-onboarding.md`

- [x] Document verified external integration sources and the no-scraping/no-password boundary.
- [x] Document implemented codebase surface and remaining production boundaries.
- [x] Run final targeted Vitest, migration check, scoped lint, Playwright screenshot evidence, and build.
- [x] Run full `pnpm lint`; record existing unrelated repo-wide lint failures.
- [x] Commit documentation and final verification notes.

## Final Verification Commands

```bash
pnpm exec vitest run src/app/api/agent/feeds/route.test.ts src/services/agent/agent-feed-service.test.ts src/services/agent/agent-feed-import-service.test.ts src/__tests__/agent/feed-import-migration.test.ts src/__tests__/listings/create.test.ts src/__tests__/routes/route-contract.test.ts
pnpm check:migrations
pnpm lint
PW_PORT=3107 PW_BASE_URL=http://127.0.0.1:3107 pnpm exec playwright test --config=playwright.link-render.config.ts --project=link-render-chromium e2e/configured-navigation-render.spec.ts
pnpm build
```

## Final Verification Notes

- `pnpm exec vitest run src/app/api/agent/feeds/route.test.ts src/services/agent/agent-feed-service.test.ts src/services/agent/agent-feed-import-service.test.ts src/__tests__/agent/feed-import-migration.test.ts src/__tests__/listings/create.test.ts src/__tests__/routes/route-contract.test.ts`: passed, 6 files and 37 tests.
- `pnpm check:migrations`: passed, 95 migrations with unique version tokens.
- Scoped ESLint for touched files: passed.
- `pnpm build`: passed. Build emitted existing Sentry/OpenTelemetry dynamic dependency warnings and Redis fallback warnings, then completed TypeScript, page data collection, static page generation, and route trace collection.
- Targeted link-render Playwright: passed for `agent sidebar configuration exposes feed integrations` and `configured blog category links render filtered category content`.
- Screenshot evidence: `/Users/jojominime/Documents/britv3main/britv3-agent-feed-onboarding/test-results/evidence/link-render/link-render-chromium-blog-category-buying.png`.
- Full `pnpm lint`: failed on existing unrelated repo-wide issues such as React purity/hook violations, unescaped entities, `prefer-const`, and `no-explicit-any` outside this feature surface.
- Full `e2e/configured-navigation-render.spec.ts`: the feature-specific tests passed, but the pre-existing all-public-destinations sweep failed in this local environment because Supabase and market-map environment variables were not configured.
- Authenticated agent wizard screenshots were not captured because this workspace has no seeded `e2e/.auth/agent.json` or live Supabase test user credentials. No test-only auth bypass was added.
