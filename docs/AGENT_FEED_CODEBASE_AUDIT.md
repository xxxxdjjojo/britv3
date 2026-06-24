# Agent Feed Codebase Audit

Last updated: 2026-06-19.

## Implemented Surface

### Link Rendering

- `/blog?category=buying` now parses the category query server-side, renders Buying as the active category, filters the visible posts, and shows a no-posts fallback for empty valid categories.
- `/dashboard/agent/integrations/feeds` is represented in agent navigation, command-palette navigation, dashboard smoke coverage, and link-render route coverage.
- The protected feed route is no longer listed as intentionally off-navigation.
- The link-render Playwright server uses `next dev --webpack`, matching the production build script and avoiding Turbopack's invalid external `node_modules` symlink panic in isolated worktrees.

### Feed API

- `GET /api/agent/feeds`, `POST /api/agent/feeds`, `PATCH /api/agent/feeds`, and `DELETE /api/agent/feeds` return `AgentFeedIntegrationView` records.
- API responses no longer include `api_key_encrypted`.
- `PATCH` now requires `id` in the JSON body; query-string `id` is not part of the update contract.
- Client updates cannot set arbitrary `sync_status`; sync state is changed only through server-owned service paths.
- Agent API access uses `requireAgent`, matching the protected agent layout role boundary.
- Local secret handling stores a non-secret `vault://agent-feed-integrations/<id>/api-key` reference. Production must back that reference with a server-side secret store such as Supabase Vault.

### Import Ledger

Migration `20260619120003_agent_feed_import_ledger.sql` adds:

- `feed_import_runs`
- `feed_import_items`
- `feed_listing_links`
- `feed_branch_links`
- `feed_media_links`

The migration includes tenant indexes, RLS select policies, service-role write posture, idempotency constraints, and triggers that reject cross-agent link rows.

### Import Services

- Deterministic Reapit-shaped fixture imports are available for tests and local development.
- Source payloads are normalized before ledger writes.
- Validation gates block publish when required material-information fields are missing.
- Review approval is explicit and only eligible items are approved.
- Publish writes canonical `properties`, `listings`, and `property_media` rows and starts listings as `draft`.
- `createListing` now enforces the invariant that new listings always start as `draft`, even if an unsafe caller passes another status.

### Agent UI

- `/dashboard/agent/integrations/feeds` now presents a Connect, Review, Publish flow.
- The page displays detected branch data, eligible/error counts, validation messages, and publish results.
- Connect forms use the hardened PATCH body contract and call the dedicated server sync route instead of mutating sync state directly.

## Key Files

- `src/config/navigation.ts`
- `src/app/(main)/blog/page.tsx`
- `src/app/api/agent/feeds/route.ts`
- `src/app/api/agent/feeds/[id]/sync/route.ts`
- `src/app/api/agent/feed-imports/[runId]/approve/route.ts`
- `src/app/api/agent/feed-imports/[runId]/publish/route.ts`
- `src/components/dashboard/agent/integrations/FeedIntegrationConfig.tsx`
- `src/lib/api/require-agent.ts`
- `src/services/agent/agent-feed-service.ts`
- `src/services/agent/agent-feed-import-service.ts`
- `src/services/listings/listing-service.ts`
- `playwright.link-render.config.ts`
- `supabase/migrations/20260619120003_agent_feed_import_ledger.sql`

## Verification Coverage

- API/service tests cover secret redaction, PATCH body contract, Zod validation, agent-role guard, import idempotency, branch mapping, validation failures, withdrawals, approval, publish eligibility, and canonical draft creation.
- Static migration tests cover table presence, RLS posture, tenant indexes, idempotency constraints, and tenant consistency triggers.
- Playwright link-render coverage covers blog category rendering and the agent feed navigation route.

## Known Boundaries

- Live Reapit, Rightmove, Zoopla, OnTheMarket, Street, Alto, or Jupix credentials were not available, so no live connector is shipped in this MVP.
- The deterministic adapter is test/dev-only and must not be treated as a production CRM connector.
- Production secret storage still requires wiring the local `vault://...` reference to a server-side secret store.
- API routes that perform ledger or publish writes require `SUPABASE_SERVICE_ROLE_KEY`.
- Authenticated agent wizard screenshots require a seeded `e2e/.auth/agent.json` or equivalent Supabase test user state; this workspace did not include those credentials.
