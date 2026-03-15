---
phase: 15-estate-agent-dashboard
plan: 14
subsystem: ui
tags: [react, api-keys, integrations, feed-sync, reapit, alto, jupix]

# Dependency graph
requires:
  - phase: 15-estate-agent-dashboard (plan 04)
    provides: agent service layer, agent billing service with generateApiKey/revokeApiKey/getApiKeys, agent feed service with getFeedIntegrations/createFeedIntegration/updateFeedIntegration/deleteFeedIntegration

provides:
  - API key management page at /dashboard/agent/integrations with one-time key reveal UX
  - Property feed integration page at /dashboard/agent/integrations/feeds for Reapit/Alto/Jupix
  - ApiKeyManager client component with generate/revoke/one-time-display pattern
  - FeedIntegrationConfig client component with provider selection, field mapping, sync status

affects: [16-tradesperson-dashboard, phase-10-buying-renting-transactions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "One-time secret reveal: API key shown in amber dialog once on generation, never retrievable again — only key_prefix stored in list responses"
    - "Empty state graceful fallback: try/catch around Supabase queries in Server Components; renders empty-state UI if table missing in dev"
    - "Feed provider card selection: button grid with border-2 blue highlight instead of Radix Select for visual provider choice"
    - "Error log panel: slide-up dialog showing last 10 JSONB error entries with timestamp/message/property fields"

key-files:
  created:
    - src/app/(protected)/dashboard/agent/integrations/page.tsx
    - src/components/dashboard/agent/integrations/ApiKeyManager.tsx
    - src/app/(protected)/dashboard/agent/integrations/feeds/page.tsx
    - src/components/dashboard/agent/integrations/FeedIntegrationConfig.tsx
  modified: []

key-decisions:
  - "next.config.ts already uses serverExternalPackages (Next.js 15+ name) for @react-pdf/renderer — plan referenced deprecated serverComponentsExternalPackages name; no config change needed"
  - "Test connection for feed API keys validates format only (regex 8+ char alphanumeric) — real provider handshake requires live credentials outside dev scope"
  - "FeedIntegrationConfig POST/PATCH to /api/agent/feeds endpoint — consistent with other agent API route patterns using action discriminator"

patterns-established:
  - "ApiKeyManager: one-time reveal stored in component state (GenerateState union type), cleared on dialog close — key never re-fetchable from server"
  - "FeedIntegrationConfig: AddDialogState discriminated union { open:false } | { open:true; mode:'add' } | { open:true; mode:'edit'; integration } — same pattern as other agent dialogs"

requirements-completed:
  - AGT-31
  - AGT-32

# Metrics
duration: 17min
completed: 2026-03-15
---

# Phase 15 Plan 14: API Keys and Property Feed Integration Summary

**API key management with one-time full-key reveal and property feed integration UI for Reapit/Alto/Jupix with sync status, field mapping, and error log display**

## Performance

- **Duration:** 17 min
- **Started:** 2026-03-15T12:33:57Z
- **Completed:** 2026-03-15T12:50:58Z
- **Tasks:** 2
- **Files modified:** 4 created

## Accomplishments

- API key management page with generate dialog showing raw key exactly once in amber warning box, key list table showing prefix/rate-limit/usage/status, and revoke confirmation flow
- Property feed integration page for Reapit, Alto, and Jupix with provider selection cards, API key input, webhook URL display (for edit mode), editable field mapping table, and per-integration sync status badge
- Error log panel showing last 10 JSONB error entries with timestamp and affected property for quick debugging of feed sync failures
- Both Server Component pages use graceful empty-state fallback if Supabase tables absent in dev environment

## Task Commits

Each task was committed atomically:

1. **Task 1: Build API Key Management page** - `86121c0` (feat)
2. **Task 2: Build Property Feed Integration page and update config** - `bb9feac` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/app/(protected)/dashboard/agent/integrations/page.tsx` - Server Component: fetches API keys, renders ApiKeyManager
- `src/components/dashboard/agent/integrations/ApiKeyManager.tsx` - Client Component: API key CRUD with one-time reveal dialog, revoke confirmation, key prefix table
- `src/app/(protected)/dashboard/agent/integrations/feeds/page.tsx` - Server Component: fetches feed integrations, renders FeedIntegrationConfig
- `src/components/dashboard/agent/integrations/FeedIntegrationConfig.tsx` - Client Component: provider card selection, API key + field mapping form, integration cards with sync status/error log

## Decisions Made

- `next.config.ts` already uses `serverExternalPackages` (Next.js 15+ renamed API) for `@react-pdf/renderer` — plan referenced the deprecated `serverComponentsExternalPackages` name; current config is correct, no change needed
- Test connection button for feed API keys validates format only (regex 8+ char alphanumeric) — real provider handshake requires live credentials unavailable in dev/stub context
- FeedIntegrationConfig POST/PATCH routes to `/api/agent/feeds` following the action discriminator pattern established across other agent API endpoints

## Deviations from Plan

### Auto-fixed Issues (2026-03-15 re-execution)

**1. [Rule 1 - Bug] Fixed billing API query param vs body confusion in ApiKeyManager**
- **Found during:** Task 1 review
- **Issue:** `handleGenerate` sent `action: "generate_key"` in the JSON body but `POST /api/agent/billing` reads `action` from `searchParams`. Key list refresh used `?action=list_keys` which doesn't exist — correct endpoint is `?type=keys` returning a direct array.
- **Fix:** Changed POST to `?action=generate_key`, removed action from body; changed refresh fetch to `?type=keys` handling direct array response.
- **Files modified:** `src/components/dashboard/agent/integrations/ApiKeyManager.tsx`
- **Commit:** 3a06f2f

**2. [Rule 1 - Bug] Fixed billing DELETE to use query param in ApiKeyManager**
- **Found during:** Task 1 review
- **Issue:** `handleRevoke` sent DELETE with JSON body `{ action: "revoke_key", key_id }` but the DELETE handler reads `keyId` from `searchParams` and does no body parsing.
- **Fix:** Changed to `DELETE /api/agent/billing?keyId=<id>` with no body.
- **Files modified:** `src/components/dashboard/agent/integrations/ApiKeyManager.tsx`
- **Commit:** 3a06f2f

**3. [Rule 1 - Bug] Fixed feeds API call patterns in FeedIntegrationConfig**
- **Found during:** Task 2 review
- **Issue:** `handleSave` used a single POST with `action: "update_feed"/"create_feed"` wrapper, but the feeds route uses REST semantics — PATCH for updates (with `?id=` query param), POST for creates. `handleSyncNow` incorrectly used POST with action body. `handleDelete` sent body that route ignores.
- **Fix:** Separated create (POST to `/api/agent/feeds`) from update (PATCH to `?id=<id>`); fixed syncNow to PATCH `?id=` with `{ sync_status: 'syncing' }`; fixed delete to `DELETE ?id=<id>` with no body.
- **Files modified:** `src/components/dashboard/agent/integrations/FeedIntegrationConfig.tsx`
- **Commit:** 7a3a207

## Issues Encountered

API call patterns in both client components didn't match the route handler contracts. All three discrepancies were auto-fixed (Rule 1).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Agent dashboard Phase 15 complete — all planned pages built across plans 01-14
- Integrations pages functional pending `/api/agent/feeds` API route implementation (stub route needed for full CRUD operations)
- API key generation/revocation routes already exist via `/api/agent/billing` established in Plan 13

---
*Phase: 15-estate-agent-dashboard*
*Completed: 2026-03-15*
