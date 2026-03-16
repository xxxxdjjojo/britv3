---
phase: 15-estate-agent-dashboard
verified: 2026-03-15T14:30:00Z
status: gaps_found
score: 26/32 requirements verified
gaps:
  - truth: "Lead pipeline shows Kanban board with 5 columns and drag-and-drop between stages"
    status: failed
    reason: "LeadPipelineKanban.tsx, LeadCard.tsx, LeadDetailTimeline.tsx, and the real leads/page.tsx exist only on feature/15-estate-agent-dashboard branch — never merged to main. The main branch has a hardcoded stub leads page with static data, no service calls, no Kanban."
    artifacts:
      - path: "src/components/dashboard/agent/leads/LeadPipelineKanban.tsx"
        issue: "MISSING from main branch — exists in commits 2f2ee91 and 3faf8d9 on feature branch only"
      - path: "src/components/dashboard/agent/leads/LeadCard.tsx"
        issue: "MISSING from main branch"
      - path: "src/components/dashboard/agent/leads/LeadDetailTimeline.tsx"
        issue: "MISSING from main branch"
      - path: "src/app/(protected)/dashboard/agent/leads/page.tsx"
        issue: "STUB on main — hardcoded const leads = [...] array, no imports from agent-lead-service, no Kanban rendering"
    missing:
      - "Merge commits 2f2ee91 and 3faf8d9 from feature/15-estate-agent-dashboard to main"
      - "Or cherry-pick: LeadPipelineKanban.tsx, LeadCard.tsx, LeadDetailTimeline.tsx, leads/page.tsx, leads/[id]/page.tsx, api/agent/leads/activities/route.ts"

  - truth: "Lead detail page shows full timeline of activities"
    status: failed
    reason: "LeadDetailTimeline component and leads/[id]/page.tsx are absent from main for the same reason as above."
    artifacts:
      - path: "src/app/(protected)/dashboard/agent/leads/[id]/page.tsx"
        issue: "MISSING from main branch — no lead detail route exists on main"
    missing:
      - "Merge the feature branch or cherry-pick leads detail page and activity timeline"

  - truth: "Lead assignment updates assigned_to and creates activity entry"
    status: failed
    reason: "The entire leads implementation is on the unmerged feature branch. The main branch stub does not call agent-lead-service at all."
    artifacts:
      - path: "src/app/(protected)/dashboard/agent/leads/page.tsx"
        issue: "No calls to updateLeadAssignment or any lead service function"
    missing:
      - "Merge leads feature branch to main"

  - truth: "Agent can generate API keys showing the full key only once"
    status: partial
    reason: "ApiKeyManager calls GET /api/agent/billing?action=list_keys to refresh the key list after generation, but the billing route's GET handler uses ?type=keys not ?action=list_keys. This means the post-generation key list refresh silently fails (returns subscription data instead of keys)."
    artifacts:
      - path: "src/components/dashboard/agent/integrations/ApiKeyManager.tsx"
        issue: "Line 44: fetches /api/agent/billing?action=list_keys — action param is ignored in GET handler"
      - path: "src/app/api/agent/billing/route.ts"
        issue: "GET handler reads ?type= param (line 32), not ?action=. list_keys action is never handled in GET."
    missing:
      - "Either update ApiKeyManager to use ?type=keys, or add action=list_keys handling to the billing route GET handler"

  - truth: "Viewing calendar shows day/week/month modes with real scheduled viewings — drag-to-reschedule"
    status: partial
    reason: "AGT-12 requires drag-to-reschedule. ViewingCalendar has day/week/month modes and real data but no drag-to-reschedule implementation — no @dnd-kit usage, no drag handlers."
    artifacts:
      - path: "src/components/dashboard/agent/viewings/ViewingCalendar.tsx"
        issue: "No drag-to-reschedule. DayPicker rendered correctly with mode switching. Real slots fetched from DB."
    missing:
      - "Add drag-to-reschedule support to ViewingCalendar (AGT-12 partially unmet)"

  - truth: "Market appraisal shows comparable sales from Land Registry data"
    status: partial
    reason: "AGT-18 specifies Land Registry data. getMarketAppraisalData queries active listings in the same postcode district — not historical sold prices from Land Registry. The PRD requires comparable SOLD sales, not active listings."
    artifacts:
      - path: "src/services/agent/agent-analytics-service.ts"
        issue: "Lines 412-458: queries properties table with ilike postcode matching. No land_registry table or external Land Registry API call."
    missing:
      - "Connect to Land Registry Price Paid data (external API or dedicated DB table) for comparable sold prices"
---

# Phase 15: Estate Agent Dashboard Verification Report

**Phase Goal:** Complete Estate Agent Dashboard — all estate agent portal pages, service layer, and database foundation built and integrated
**Verified:** 2026-03-15T14:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | All agent DB tables exist with correct columns, FKs, RLS policies | VERIFIED | 824-line migration `20260313_agent_dashboard.sql` with 13 tables, RLS on all, CHECK constraints verified |
| 2 | TypeScript types cover every table shape | VERIFIED | `src/types/agent.ts` (594 lines), covers all domain types |
| 3 | Lead stage CHECK constraint enforces 5-stage pipeline | VERIFIED | Migration line 84: `CHECK (stage IN ('new_enquiry', 'qualified', 'viewing_booked', 'offer_made', 'closed'))` |
| 4 | Sale progression CHECK constraint enforces 8-stage UK conveyancing | VERIFIED | Migration lines 328-337: all 8 stages present |
| 5 | Agent team member roles enforce 5-tier model | VERIFIED | Migration line 466: `CHECK (role IN ('admin', 'senior_negotiator', 'negotiator', 'lettings_manager', 'viewer'))` |
| 6 | Agent dashboard KPIs fetched via RPC and returned as AgentDashboardKpis | VERIFIED | `agent-dashboard-service.ts` (91 lines), dashboard page wired to `getAgentDashboardKpis` |
| 7 | Listings queried by status with view/save/enquiry counts | VERIFIED | `agent-listings-service.ts` (200 lines), listings page → `getAgentListings` → API |
| 8 | Leads queried by stage, created, updated, moved between stages | FAILED | Service exists but leads page on main is a hardcoded stub with no service calls |
| 9 | Lead assignment updates assigned_to and creates activity entry | FAILED | Implementation exists only on feature branch — not on main |
| 10 | Lead pipeline shows Kanban board with 5 columns and drag-and-drop | FAILED | LeadPipelineKanban.tsx missing from main branch |
| 11 | Drag-and-drop uses optimistic updates (card moves instantly, reverts on error) | FAILED | Component not on main |
| 12 | Lead detail page shows full timeline of activities | FAILED | LeadDetailTimeline.tsx missing from main branch |
| 13 | Viewing slots created, queried by date range, marked as booked | VERIFIED | `agent-viewing-service.ts` (239 lines), ViewingCalendar wired |
| 14 | Viewing calendar shows day/week/month modes with real viewings | VERIFIED | DayPicker with ViewMode type, real slots fetched and rendered |
| 15 | Post-viewing feedback form collects structured data | VERIFIED | `ViewingFeedbackForm.tsx` (351 lines), wired to `/api/agent/viewings/feedback` |
| 16 | Offers dashboard groups offers by property with status badges | VERIFIED | `OffersDashboard.tsx` (314 lines), wired to `getAgentOffers` |
| 17 | Negotiation thread supports accept/reject/counter with audit trail | VERIFIED | `NegotiationThread.tsx` (592 lines), wired to `/api/agent/offers` |
| 18 | Sale progression Kanban shows 8 columns | VERIFIED | `SaleProgressionKanban.tsx` (639 lines) with @dnd-kit, 8 columns |
| 19 | Stage transitions validated (sequential forward or one-step rollback) | VERIFIED | Sale service comment + Kanban enforces adjacent-stage-only moves (line 504) |
| 20 | Sale progression Kanban has optimistic updates with revert on error | VERIFIED | Lines 509-535: prevGrouped captured, revert on catch |
| 21 | Vendor report generates downloadable PDF | VERIFIED | `VendorReportPDF.tsx` (291 lines) uses `@react-pdf/renderer` |
| 22 | Market appraisal shows comparable data with suggested price range | PARTIAL | Uses active listings in postcode district, not Land Registry sold prices (AGT-18 gap) |
| 23 | CRM client list shows searchable, filterable table | VERIFIED | `ClientList.tsx` (702 lines), wired to `/api/agent/crm` with search/filter |
| 24 | Client profile shows communication history, preferences, notes | VERIFIED | `ClientProfile.tsx` (659 lines), tabbed, wired to CRM API |
| 25 | Team members invited by email, assigned roles, linked to branches | VERIFIED | `TeamMemberList.tsx` (655 lines), wired to `/api/agent/team` |
| 26 | Reviews dashboard shows overall rating, distribution, recent reviews | VERIFIED | `ReviewsDashboard.tsx` (276 lines), page queries `reviews` table directly |
| 27 | Agent can respond publicly to reviews with profanity filter | VERIFIED | `ReviewResponseForm.tsx` (237 lines), profanity check, wired to `/api/agent/reviews/[id]/respond` |
| 28 | Billing shows subscription plan, links to Stripe Customer Portal | VERIFIED | `SubscriptionBilling.tsx` (377 lines), Stripe checkout and portal wired |
| 29 | Agent can generate API keys showing full key only once | PARTIAL | Key generation works (POST /api/agent/billing action=generate_key), but list-refresh after generation uses wrong query param (`?action=list_keys` vs `?type=keys`) |
| 30 | Agent can revoke API keys | VERIFIED | DELETE /api/agent/billing with keyId param, calls `revokeApiKey` service |
| 31 | Performance reports at agent and branch level | VERIFIED | `AgentPerformanceCharts.tsx` + `BranchPerformanceCharts.tsx`, wired to analytics API |
| 32 | Competitor analysis shows area agencies | VERIFIED | `CompetitorAnalysis.tsx` (366 lines), wired to `/api/agent/analytics?type=competitor` |
| 33 | Featured listing boost via Stripe with duration selection | VERIFIED | `FeaturedListingBoost.tsx` (406 lines), wired to `/api/agent/billing?action=boost` |
| 34 | Feed integration config for Reapit/Alto/Jupix | VERIFIED | `FeedIntegrationConfig.tsx` (636 lines), wired to `/api/agent/feeds` |
| 35 | Agent can configure property feed with sync status visible | VERIFIED | Feed service (158 lines), sync status tracked |

**Score:** 26/32 requirements verified (6 gaps: 4 from unmerged leads feature, 1 API key wiring bug, 1 market appraisal data source)

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `supabase/migrations/20260313_agent_dashboard.sql` | VERIFIED | 824 lines, 13 tables, RLS, CHECK constraints |
| `src/types/agent.ts` | VERIFIED | 594 lines, all domain types present |
| `src/services/agent/agent-dashboard-service.ts` | VERIFIED | 91 lines, KPIs + activity feed |
| `src/services/agent/agent-listings-service.ts` | VERIFIED | 200 lines, status-filtered queries |
| `src/services/agent/agent-lead-service.ts` | VERIFIED | 197 lines, substantive — but not wired in main branch leads page |
| `src/services/agent/agent-viewing-service.ts` | VERIFIED | 239 lines |
| `src/services/agent/agent-offer-service.ts` | VERIFIED | 317 lines |
| `src/services/agent/agent-sale-service.ts` | VERIFIED | 164 lines, transition validation |
| `src/services/agent/agent-crm-service.ts` | VERIFIED | 184 lines |
| `src/services/agent/agent-team-service.ts` | VERIFIED | 315 lines |
| `src/services/agent/agent-analytics-service.ts` | VERIFIED | 465 lines |
| `src/services/agent/agent-billing-service.ts` | VERIFIED | 228 lines, Stripe + API keys |
| `src/services/agent/agent-feed-service.ts` | VERIFIED | 158 lines |
| `src/app/(protected)/dashboard/agent/page.tsx` | VERIFIED | Wired to service + AgentDashboardHome |
| `src/components/dashboard/agent/AgentDashboardHome.tsx` | VERIFIED | 432 lines, real KPIs, Recharts chart |
| `src/components/dashboard/agent/AgencyProfileForm.tsx` | VERIFIED | 312 lines |
| `src/components/dashboard/agent/AgencyBrandingForm.tsx` | VERIFIED | 365 lines |
| `src/components/dashboard/agent/listings/ActiveListings.tsx` | VERIFIED | 183 lines, wired via page server component |
| `src/components/dashboard/agent/listings/CreateListingWizard.tsx` | VERIFIED | 886 lines, calls `/api/agent/listings` and AI description endpoint |
| `src/components/dashboard/agent/listings/ListingAnalyticsCharts.tsx` | VERIFIED | 221 lines, Recharts |
| `src/components/dashboard/agent/leads/LeadPipelineKanban.tsx` | MISSING | Not on main branch |
| `src/components/dashboard/agent/leads/LeadCard.tsx` | MISSING | Not on main branch |
| `src/components/dashboard/agent/leads/LeadDetailTimeline.tsx` | MISSING | Not on main branch |
| `src/components/dashboard/agent/viewings/ViewingCalendar.tsx` | VERIFIED | 565 lines, DayPicker, real data |
| `src/components/dashboard/agent/offers/OffersDashboard.tsx` | VERIFIED | 314 lines |
| `src/components/dashboard/agent/offers/NegotiationThread.tsx` | VERIFIED | 592 lines |
| `src/components/dashboard/agent/sales/SaleProgressionKanban.tsx` | VERIFIED | 639 lines, @dnd-kit, optimistic updates |
| `src/components/dashboard/agent/sales/VendorReportPDF.tsx` | VERIFIED | 291 lines, @react-pdf/renderer |
| `src/components/dashboard/agent/sales/MarketAppraisalTool.tsx` | PARTIAL | 301 lines, wired — but uses active listings not Land Registry sold data |
| `src/components/dashboard/agent/crm/ClientList.tsx` | VERIFIED | 702 lines, wired to CRM API |
| `src/components/dashboard/agent/crm/ClientProfile.tsx` | VERIFIED | 659 lines |
| `src/components/dashboard/agent/team/TeamMemberList.tsx` | VERIFIED | 655 lines |
| `src/components/dashboard/agent/team/RolesPermissions.tsx` | VERIFIED | 334 lines |
| `src/components/dashboard/agent/team/BranchManager.tsx` | VERIFIED | 609 lines |
| `src/components/dashboard/agent/reviews/ReviewsDashboard.tsx` | VERIFIED | 276 lines |
| `src/components/dashboard/agent/reviews/ReviewResponseForm.tsx` | VERIFIED | 237 lines, profanity filter |
| `src/components/dashboard/agent/billing/SubscriptionBilling.tsx` | VERIFIED | 377 lines |
| `src/components/dashboard/agent/analytics/AgentPerformanceCharts.tsx` | VERIFIED | 350 lines |
| `src/components/dashboard/agent/analytics/BranchPerformanceCharts.tsx` | VERIFIED | 352 lines |
| `src/components/dashboard/agent/analytics/CompetitorAnalysis.tsx` | VERIFIED | 366 lines |
| `src/components/dashboard/agent/billing/FeaturedListingBoost.tsx` | VERIFIED | 406 lines |
| `src/components/dashboard/agent/integrations/ApiKeyManager.tsx` | PARTIAL | 318 lines — list-refresh after generate uses wrong query param |
| `src/components/dashboard/agent/integrations/FeedIntegrationConfig.tsx` | VERIFIED | 636 lines |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `dashboard/agent/page.tsx` | `agent-dashboard-service.ts` | `getAgentDashboardKpis` server call | WIRED | Direct import and call |
| `dashboard/agent/page.tsx` | `AgentDashboardHome.tsx` | JSX render with props | WIRED | Props: kpis, activityFeed, agentName |
| `dashboard/agent/leads/page.tsx` | `agent-lead-service.ts` | None | NOT_WIRED | Stub uses const array, no service import |
| `SaleProgressionKanban.tsx` | `/api/agent/sales` | PATCH fetch on drag-end | WIRED | Lines 523, 548 |
| `NegotiationThread.tsx` | `/api/agent/offers` | PATCH fetch for accept/reject/counter | WIRED | Confirmed |
| `ApiKeyManager.tsx` | `/api/agent/billing` | GET `?action=list_keys` | BROKEN | Route expects `?type=keys` not `?action=list_keys` |
| `ApiKeyManager.tsx` | `/api/agent/billing` | POST generate_key + DELETE revoke | WIRED | Correct action params used |
| `SubscriptionBilling.tsx` | `/api/agent/billing` | POST action=checkout/portal | WIRED | Confirmed |
| `FeedIntegrationConfig.tsx` | `/api/agent/feeds` | fetch calls | WIRED | Lines 172, 203, 224 |
| `ClientList.tsx` | `/api/agent/crm` | fetch with query params | WIRED | Lines 352, 494, 509 |
| `ViewingCalendar.tsx` | Supabase Realtime | subscription filter agent_viewing_slots | WIRED | Line 243 |

### Requirements Coverage

| Requirement | Plans | Status | Evidence |
|-------------|-------|--------|---------|
| AGT-01: Dashboard KPIs | 01, 02, 05 | SATISFIED | `agent-dashboard-service.ts` + real page wiring |
| AGT-02: Edit agency profile | 01, 05 | SATISFIED | `AgencyProfileForm.tsx` (312 lines), profile page |
| AGT-03: Agency branding | 01, 05 | SATISFIED | `AgencyBrandingForm.tsx` (365 lines), branding page |
| AGT-04: Active listings view | 01, 02, 06 | SATISFIED | `ActiveListings.tsx`, real data from service |
| AGT-05: Sold/Let listings | 01, 02, 06 | SATISFIED | `SoldLetListings.tsx` (125 lines) |
| AGT-06: Archived/Draft listings | 01, 02, 06 | SATISFIED | `ArchivedDraftListings.tsx` (229 lines) |
| AGT-07: Create listings with AI | 01, 02, 06 | SATISFIED | `CreateListingWizard.tsx` (886 lines), AI endpoint |
| AGT-08: Listing analytics | 01, 02, 06 | SATISFIED | `ListingAnalyticsCharts.tsx` (221 lines), Recharts |
| AGT-09: Filterable pipeline view | 01, 02, 07 | BLOCKED | Leads page on main is a stub — no pipeline view |
| AGT-10: Lead detail with timeline | 01, 02, 07 | BLOCKED | `leads/[id]/page.tsx` not on main |
| AGT-11: Assign/reassign leads | 01, 02, 07 | BLOCKED | No assignment UI on main |
| AGT-12: Viewing calendar with DnD reschedule | 03, 08 | PARTIAL | Calendar modes work, no drag-to-reschedule |
| AGT-13: Post-viewing feedback | 03, 08 | SATISFIED | `ViewingFeedbackForm.tsx`, structured form |
| AGT-14: Offers dashboard | 03, 08 | SATISFIED | `OffersDashboard.tsx`, grouped by property |
| AGT-15: Offer negotiation threads | 03, 08 | SATISFIED | `NegotiationThread.tsx`, accept/reject/counter |
| AGT-16: Sales Kanban 8 stages | 03, 09 | SATISFIED | `SaleProgressionKanban.tsx`, 8 UK stages |
| AGT-17: Vendor report PDF | 04, 09 | SATISFIED | `VendorReportPDF.tsx`, @react-pdf/renderer |
| AGT-18: Market appraisal (Land Registry) | 04, 09 | PARTIAL | Active listings used, not Land Registry sold data |
| AGT-19: CRM client list | 04, 10 | SATISFIED | `ClientList.tsx`, search/filter/bulk email |
| AGT-20: CRM client profile | 04, 10 | SATISFIED | `ClientProfile.tsx`, full tabbed profile |
| AGT-21: Team member management | 04, 11 | SATISFIED | `TeamMemberList.tsx`, invite/performance |
| AGT-22: Roles and permissions | 04, 11 | SATISFIED | `RolesPermissions.tsx`, 5 tiers + toggles |
| AGT-23: Branch management | 04, 11 | SATISFIED | `BranchManager.tsx` (609 lines) |
| AGT-24: Reviews dashboard | 04, 12 | SATISFIED | `ReviewsDashboard.tsx`, Recharts trend |
| AGT-25: Respond to reviews | 04, 12 | SATISFIED | `ReviewResponseForm.tsx`, profanity filter |
| AGT-26: Subscription and billing | 04, 12 | SATISFIED | `SubscriptionBilling.tsx`, Stripe portal |
| AGT-27: Agent performance reports | 13 | SATISFIED | `AgentPerformanceCharts.tsx`, Recharts |
| AGT-28: Branch performance reports | 13 | SATISFIED | `BranchPerformanceCharts.tsx` |
| AGT-29: Competitor analysis | 13 | SATISFIED | `CompetitorAnalysis.tsx`, area competitors |
| AGT-30: Featured listing boost | 13 | SATISFIED | `FeaturedListingBoost.tsx`, Stripe checkout |
| AGT-31: API key management | 14 | PARTIAL | Generation + revoke work; list refresh query param mismatch |
| AGT-32: Property feed integration | 14 | SATISFIED | `FeedIntegrationConfig.tsx`, Reapit/Alto/Jupix |

**Requirements breakdown:** 26 SATISFIED, 3 BLOCKED (AGT-09, AGT-10, AGT-11), 3 PARTIAL (AGT-12, AGT-18, AGT-31)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/(protected)/dashboard/agent/leads/page.tsx` | 10-16 | `const leads = [...]` hardcoded array, no service calls | BLOCKER | AGT-09, AGT-11: pipeline view inoperable |
| `src/app/(protected)/dashboard/agent/leads/page.tsx` | 1 | `"use client"` on a page that should be Server Component | WARNING | Cannot fetch from DB on server |
| `src/components/dashboard/agent/AgentDashboardHome.tsx` | 57 | "Generate mock 30-day activity chart data seeded from KPIs" | INFO | Chart shows KPI-derived trends, not historical DB data |
| `src/components/dashboard/agent/integrations/ApiKeyManager.tsx` | 44 | `?action=list_keys` query param (route expects `?type=keys`) | BLOCKER | Key list silently fails after generate |

### Human Verification Required

#### 1. Drag-to-reschedule in Viewing Calendar

**Test:** Open `/dashboard/agent/viewings`, create two viewing slots on different days, then try to drag one slot to reschedule it to another day.
**Expected:** The viewing should move to the new date, triggering a PATCH to update the viewing slot's date/time.
**Why human:** Drag interactions cannot be verified programmatically. The component has no drag implementation currently — this is also a code gap.

#### 2. Lead Pipeline Kanban (after merge)

**Test:** Once the feature branch is merged to main, open `/dashboard/agent/leads`, drag a lead card from "New Enquiry" column to "Qualified".
**Expected:** Card moves immediately (optimistic), PATCH sent to `/api/agent/leads`, stage updates in DB.
**Why human:** Requires browser interaction with DnD to verify drag-and-drop works as intended.

#### 3. API Key One-Time Reveal

**Test:** Open `/dashboard/agent/integrations`, generate a new API key with a name, then close and reopen the dialog.
**Expected:** Full key is shown once in the dialog, never shown again in the key list.
**Why human:** Security flow requires browser interaction to verify key masking behavior.

#### 4. Stripe Checkout Flow

**Test:** Click "Upgrade Plan" in `/dashboard/agent/billing`, select a plan.
**Expected:** Redirect to Stripe Checkout with the correct price_id; successful purchase returns to dashboard.
**Why human:** Requires real or test-mode Stripe environment to verify redirect and webhook handling.

#### 5. PDF Vendor Report Download

**Test:** Open `/dashboard/agent/sales/reports`, select a listing, click "Download Vendor Report".
**Expected:** A PDF downloads with listing performance data populated.
**Why human:** PDF generation requires browser rendering to verify content and layout.

### Gaps Summary

**Root cause A — Unmerged feature branch (3 AGT requirements blocked):**
The entire leads Kanban implementation (Plan 07 — commits 2f2ee91 and 3faf8d9) exists on the `feature/15-estate-agent-dashboard` branch but was never merged or cherry-picked to main. The main branch still has a hardcoded stub leads page from before Plan 07 was executed. All other Phase 15 plans (01-06, 08-14) had their implementation commits land on main. Plan 07 is the sole exception. The fix is to merge or cherry-pick the 6 files from those two commits.

**Root cause B — API query param mismatch (AGT-31 partial):**
`ApiKeyManager.tsx` refreshes the key list using `GET /api/agent/billing?action=list_keys` but the billing route's GET handler reads `?type=` not `?action=`. The result: after generating a new key, the list refresh returns subscription data (not keys), so the new key does not appear in the list until page reload. This is a 1-line fix in either the component or the route.

**Root cause C — Data source limitation (AGT-12, AGT-18 partial):**
Two AGT requirements specify specific data sources that were not fully implemented:
- AGT-12 requires drag-to-reschedule in the viewing calendar — ViewingCalendar has no drag implementation.
- AGT-18 requires Land Registry sold-price data for market appraisal — the service uses active listing price data instead, which is functionally useful but technically misaligned with the requirement.

The build passes cleanly with no TypeScript errors (confirmed via `pnpm build`). 29 of 32 AGT requirements are fully or partially implemented on main; 3 are blocked by the unmerged feature branch.

---

_Verified: 2026-03-15T14:30:00Z_
_Verifier: Claude (gsd-verifier)_
