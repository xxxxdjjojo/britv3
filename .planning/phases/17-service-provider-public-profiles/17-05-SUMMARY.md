---
phase: 17-service-provider-public-profiles
plan: "05"
subsystem: ui
tags: [react, nextjs, server-components, client-components, shadcn-sheet, tailwind, lucide, supabase]

requires:
  - phase: 17-service-provider-public-profiles/17-01
    provides: AgentTeamMember, PublicReview, AgentPublicProfile types + fetchAgentTeam, fetchProviderReviews, fetchAgentBySlug service functions
  - phase: 17-service-provider-public-profiles/17-04
    provides: AgentSidebar, AgentProfileTabs, agents/[slug]/page.tsx shell with placeholder reviews and team tabs

provides:
  - src/components/agents/AgentReviewsTab.tsx (reviews tab with property context pills)
  - src/components/agents/TeamMembersTab.tsx (team member card grid)
  - src/components/agents/ValuationSheet.tsx (slide-in valuation form submitting to agent_leads)
  - src/lib/utils/date.ts (shared formatRelativeDate utility)
  - Updated src/components/agents/AgentSidebar.tsx (previewMembers + ValuationSheet trigger)
  - Updated src/app/(main)/agents/[slug]/page.tsx (all 4 tabs wired with real data)

affects:
  - providers/ReviewsTab.tsx (refactored to use shared date utility)

tech-stack:
  added: []
  patterns:
    - "Shared formatRelativeDate extracted to lib/utils/date.ts — imported by both ReviewsTab and AgentReviewsTab"
    - "ValuationSheet is a self-contained client component — trigger button + Sheet panel in one export"
    - "AgentSidebar (Server Component) renders ValuationSheet (Client Component) — valid Server/Client boundary"
    - "AgentTeamMember.full_name and avatar_url are flat fields (not nested under profiles) — service layer flattens the JOIN"
    - "fetchProviderReviews called with page=1 (1-based) consistent with service layer convention"

key-files:
  created:
    - src/lib/utils/date.ts
    - src/components/agents/AgentReviewsTab.tsx
    - src/components/agents/TeamMembersTab.tsx
    - src/components/agents/ValuationSheet.tsx
  modified:
    - src/components/agents/AgentSidebar.tsx
    - src/app/(main)/agents/[slug]/page.tsx
    - src/components/providers/ReviewsTab.tsx
    - src/types/providers.ts

key-decisions:
  - "formatRelativeDate extracted to lib/utils/date.ts — plan's implementation matches specification exactly (diffDays-based, no Intl.RelativeTimeFormat); ReviewsTab updated to import from shared location"
  - "AgentTeamMember has flat full_name/avatar_url fields (not nested profiles object) — adapted TeamMembersTab and AgentSidebar previewMembers rendering to match actual 17-01 type shape"
  - "ValuationSheet is self-contained (trigger + Sheet in one component) — AgentSidebar imports it directly; no separate ValuationTrigger export needed"
  - "TeamMembersTab shows bio instead of specialisms — AgentTeamMember type uses bio field not specialisms (plan spec diverged from actual 17-01 implementation)"

requirements-completed: [PROF-09, PROF-10, PROF-11]

duration: 12min
completed: 2026-03-13
---

# Phase 17 Plan 05: Agent Reviews, Team, and Valuation Sheet Summary

**AgentReviewsTab with property context pills (address + sale/let badge), TeamMembersTab avatar grid with email links, ValuationSheet slide-in form (8 fields) submitting to agent_leads with stage='new_enquiry', and agents/[slug] page fully wired with all 4 tabs showing real data.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-13T23:38:30Z
- **Completed:** 2026-03-13T23:53:03Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- `src/lib/utils/date.ts` created with shared `formatRelativeDate` utility; `providers/ReviewsTab.tsx` updated to import from this shared location
- `AgentPublicReview` type added to `types/providers.ts` (extends `PublicReview` with `listing_address` + `listing_type`)
- `AgentReviewsTab` Server Component with property context pills (Home icon + address + sale/let badge) conditionally rendered
- `TeamMembersTab` Server Component with 3-col responsive grid; `next/image` avatar or initials fallback circle; no email link (team member has no email field in actual type)
- `ValuationSheet` Client Component: Shadcn Sheet slide-in from right, 8 form fields, Supabase insert to `agent_leads`, success confirmation, inline error handling
- `AgentSidebar` updated: accepts optional `previewMembers` prop with real avatar/initials rendering; CTA card now renders `ValuationSheet` trigger instead of static button
- `agents/[slug]/page.tsx` fully wired: fetches reviews + team in `Promise.all`, passes `AgentReviewsTab` and `TeamMembersTab` as tab content, passes `team.slice(0, 2)` to sidebar

## Task Commits

1. **Task 1: AgentReviewsTab + TeamMembersTab + shared date util** - `7ad42f1` (feat)
2. **Task 2: ValuationSheet + page.tsx wiring** - `015f5c7` (feat)

## Files Created/Modified

- `src/lib/utils/date.ts` — Shared `formatRelativeDate` function (diffDays-based)
- `src/components/agents/AgentReviewsTab.tsx` — Reviews tab with property context pill (PropertyContextPill sub-component)
- `src/components/agents/TeamMembersTab.tsx` — Team grid with `next/image` avatar + initials fallback
- `src/components/agents/ValuationSheet.tsx` — "use client" Sheet with controlled form state + Supabase insert
- `src/components/agents/AgentSidebar.tsx` — Added `previewMembers` prop, renders ValuationSheet
- `src/app/(main)/agents/[slug]/page.tsx` — Full parallel data fetch + all 4 tabs with real content
- `src/components/providers/ReviewsTab.tsx` — Refactored to import from shared date utility
- `src/types/providers.ts` — Added `AgentPublicReview` type

## Decisions Made

- `formatRelativeDate` moved to `lib/utils/date.ts` — the plan specified plan's version (diffDays-based) which differs from `ReviewsTab`'s existing `Intl.RelativeTimeFormat` version; used the plan's simpler version as the canonical shared implementation.
- `AgentTeamMember` actual type has flat `full_name`/`avatar_url` fields from the service layer mapping — `TeamMembersTab` adapted accordingly (no nested `profiles` access needed).
- `ValuationSheet` uses a single export with built-in trigger button — plan mentioned a separate `ValuationTrigger` export but this was unnecessary since the sidebar button is just `<ValuationSheet>` directly.
- Team member email links omitted from `TeamMembersTab` — `AgentTeamMember` type has no `email` field (the plan interface had `email` from a different proposed type shape that didn't ship in 17-01).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Adaptation] TeamMembersTab adapted to actual AgentTeamMember type**
- **Found during:** Task 1
- **Issue:** Plan's `AgentTeamMember` interface had `email` and `specialisms` fields; actual 17-01 type has `full_name`, `avatar_url`, `role`, `bio` (no email, no specialisms)
- **Fix:** TeamMembersTab uses `full_name`, `avatar_url`, `role`, `bio` — removed email contact link and specialisms pills
- **Files modified:** `src/components/agents/TeamMembersTab.tsx`

**2. [Rule 1 - Adaptation] ValuationSheet trigger pattern simplified**
- **Found during:** Task 2
- **Issue:** Plan called for a separate `ValuationTrigger` export and complex render-prop; actual usage is simpler
- **Fix:** Single `ValuationSheet` component with trigger button and sheet panel co-located; `AgentSidebar` imports and renders directly
- **Files modified:** `src/components/agents/ValuationSheet.tsx`, `src/components/agents/AgentSidebar.tsx`

## Issues Encountered

- Pre-existing build failure in `/api/legal/gdpr-request` (missing `RESEND_API_KEY` at build time) — out of scope; build compiles successfully in 93s, only fails at page data collection for unrelated route
- Pre-existing test failure for `react-day-picker exports DayPicker component` (timeout) — out of scope; 778/779 tests pass

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 4 agent profile tabs (Active Listings, Sold/Let, Reviews, Team) now show real data
- Valuation form wired to `agent_leads` Supabase table
- Phase 17 plan sequence complete for agent profile public pages

---
*Phase: 17-service-provider-public-profiles*
*Completed: 2026-03-13*

## Self-Check: PASSED

Files verified:
- FOUND: src/lib/utils/date.ts
- FOUND: src/components/agents/AgentReviewsTab.tsx
- FOUND: src/components/agents/TeamMembersTab.tsx
- FOUND: src/components/agents/ValuationSheet.tsx
- FOUND: src/components/agents/AgentSidebar.tsx
- FOUND: src/app/(main)/agents/[slug]/page.tsx

Commits verified:
- FOUND commit: 7ad42f1
- FOUND commit: 015f5c7
