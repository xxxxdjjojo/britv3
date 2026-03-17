# MEGA PLAN REVIEW — ESTATE AGENT DASHBOARD (10.1–10.32)

**CEO Review Date:** 2026-03-15
**Eng Review Date:** 2026-03-16
**Mode:** SCOPE EXPANSION
**Phase:** 15 (feature/phase-15-estate-agent-dashboard)
**Status:** Built, NOT merged to main. Score: 26/32 requirements verified.

---

## PRE-REVIEW SYSTEM AUDIT

### Current System State

```
git log --oneline (relevant)
  41cc494  feat(phase-22): transactional email templates (React Email + Resend)
  1778edb  feat(admin): Waves 2-4 merge (20.12-20.30)
  d084948  fix(agent-dashboard): replace hardcoded mock data + nested button violations  ← recent hotfix
  1926c6a  feat(21): error & system state pages
```

### What Is In Flight

| Item | Status |
|------|--------|
| `feature/phase-15-estate-agent-dashboard` | **15 commits AHEAD of main** — full Phase 15 implementation, NOT merged |
| `feature/15-estate-agent-dashboard` (old) | Stale/abandoned |
| Package.json diff on main | Only `package.json` + `pnpm-lock.yaml` modified (uncommitted deps) |
| Stash list | Empty |

### Phase 15 Verification Score: 26/32 Requirements

| Gap | Root Cause | Severity |
|-----|-----------|----------|
| AGT-09/10/11 — Leads Kanban | Feature branch not merged; main has hardcoded stub | **BLOCKER** |
| AGT-12 — Drag-to-reschedule | No DnD implementation in `ViewingCalendar.tsx` | WARNING |
| AGT-18 — Land Registry data | `agent-analytics-service.ts` uses active listings, not sold prices | WARNING |
| ~~AGT-31 — API key list refresh~~ | ~~`?action=list_keys` vs `?type=keys` query param mismatch~~ | ~~BUG~~ **RESOLVED** — `ApiKeyManager.tsx:45` already uses `?type=keys` correctly |

**Critical discovery:** `src/services/land-registry/land-registry.ts` already exists. AGT-18 is a wiring gap, NOT a missing service.

**Recurring pain area:** Commit `d084948` on main is the third touch of agent dashboard stubs. Any agent dashboard code on main is a recurring problem — treat with extra scrutiny during merge.

### Taste Calibration

**Well-designed patterns to follow:**
1. `src/lib/marketplace/booking-state-machine.ts` — explicit state machine with tested transitions
2. `src/services/agent/agent-sale-service.ts` — sale progression with sequential validation + audit trail

**Anti-patterns to avoid:**
1. Hardcoded const arrays as mock data in page.tsx (exactly what the leads stub does on main)
2. API route query param inconsistency (`?action=` vs `?type=`)

---

## STEP 0: NUCLEAR SCOPE CHALLENGE

### 0A. Premise Challenge

The actual business outcome: **agent retention through workflow lock-in + 2.5% platform commission on deals**. The 32 pages are not about features — they're about making an agent's *entire working day* happen inside Britestate.

The difference between this and a listing portal: £20/month per agent vs £200/month per agent ARR.

### 0B. Existing Code to Leverage (Reuse These)

| Sub-problem | Existing code | Reused? |
|------------|--------------|---------|
| Market appraisal comparables | `src/services/land-registry/land-registry.ts` ← **already built, just wire it** | NOT YET — wire it |
| Review system | `review-service.ts` + `reviews` table (Phase 4) | ALREADY USED |
| Profanity filter | `src/lib/profanity.ts` (tested) | ALREADY USED |
| PDF generation pattern | `OfferLetterPdf.tsx` — same `@react-pdf/renderer` approach | REUSED in VendorReportPDF |
| Stripe billing | `agent-billing-service.ts` already wired | ALREADY WIRED |
| Milestone tracking | `milestone-service.ts` — sale progression should emit milestone events | NOT YET — TODOS.md P1 |
| AI description generation | `/api/ai/generate-description/route.ts` — CreateListingWizard already calls this | ALREADY WIRED |
| DnD drag pattern | `@dnd-kit` already used in `SaleProgressionKanban.tsx` | REUSE for ViewingCalendar |
| Activity logging pattern | `addLeadActivity()` in lead service | REPLACED BY DB TRIGGER (see Decision 15) |

### 0C. Dream State Mapping

```
CURRENT STATE                THIS PLAN DELIVERS              12-MONTH IDEAL
─────────────────────        ────────────────────────────    ──────────────────────────────
feature/phase-15 built       • Merge to main (fix 6 gaps)    • AI co-pilot in every workflow
but not merged               • Leads Kanban on main          • Proactive "follow up" alerts
26/32 requirements           • Wire Land Registry to          • Predictive time-on-market
Main has stub leads page       appraisal tool                • WhatsApp/SMS notifications
No DnD in calendar           • Add drag-to-reschedule        • Automated vendor report cadence
Market appraisal uses        • Feed webhook receiver          • Mobile-first agent app
active listings not sold     • Role enforcement in API        • Cross-agent benchmarking
prices                       • TOCTOU version guards         • Vendor portal (seller self-serve)
                             • DB activity log trigger
                             • 3 delight features
```

### 0D. Delight Opportunities (EXPANSION)

1. **"Last contacted" warning badge** — amber indicator on lead cards not touched in 7+ days. 15 min. `updated_at` field already exists.
2. **"Send to vendor now"** — one-click email dispatch after PDF generation. 30 min. Resend + VendorReportPDF already exist.
3. **Lead source doughnut chart** — Recharts PieChart on Dashboard Home. 20 min. `agent_leads.source` already stored.
4. **Sale stage ETA badges** — green/amber/red based on UK conveyancing averages. S effort, post-launch.
5. **Viewing confirmation auto-email** — on slot booking, one-click send via Resend. P1 fast-follow.

### 0F. Mode Selected: SCOPE EXPANSION ✓

---

## SECTION 1: ARCHITECTURE REVIEW

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ESTATE AGENT DASHBOARD                           │
│              feature/phase-15-estate-agent-dashboard                │
└─────────────────────────────────────────────────────────────────────┘

Browser (Next.js 16 App Router)
┌────────────────────────────────────────────────────────────────────┐
│  Server Components (default)         Client Components ("use client")│
│  ├── /dashboard/agent/page.tsx       ├── AgentDashboardHome.tsx    │
│  ├── /agent/leads/page.tsx  ← STUB   ├── LeadPipelineKanban.tsx ←  │
│  ├── /agent/viewings/page.tsx        │   (feature branch only)     │
│  ├── /agent/sales/page.tsx           ├── SaleProgressionKanban.tsx │
│  └── 28 more page.tsx files          ├── ViewingCalendar.tsx        │
│                                      ├── NegotiationThread.tsx      │
│                                      └── 14 more client components  │
└───────────────────┬────────────────────────────┬────────────────────┘
                    │ fetch/Server call            │ fetch (API routes)
┌───────────────────▼──────┐       ┌──────────────▼────────────────┐
│   Service Layer          │       │   API Routes                   │
│   src/services/agent/    │       │   src/app/api/agent/           │
│   ├── agent-dashboard    │       │   ├── /analytics/route.ts      │
│   ├── agent-listings     │       │   ├── /billing/route.ts        │
│   ├── agent-lead         │       │   ├── /crm/route.ts            │
│   ├── agent-viewing      │       │   ├── /feeds/route.ts          │
│   ├── agent-offer        │       │   ├── /feeds/webhook/route.ts ←NEW│
│   ├── agent-sale         │       │   ├── /leads/route.ts          │
│   ├── agent-crm          │       │   ├── /listings/route.ts       │
│   ├── agent-team         │       │   ├── /offers/route.ts         │
│   ├── agent-analytics    │       │   ├── /reports/route.ts        │
│   ├── agent-billing      │       │   ├── /reviews/route.ts        │
│   └── agent-feed         │       │   ├── /sales/route.ts          │
└───────────────────┬──────┘       │   ├── /team/route.ts           │
                    │              │   ├── /viewings/route.ts        │
                    │              │   └── /viewings/feedback/       │
┌───────────────────▼──────────────▼──────────────┐
│              Supabase Layer                       │
│  ┌───────────┐  ┌────────────┐  ┌─────────────┐ │
│  │ PostgREST │  │  Realtime  │  │  Storage    │ │
│  │ (15 agent │  │ (leads,    │  │ (logos,     │ │
│  │  tables + │  │  viewings, │  │  floorplans,│ │
│  │  feed_sync│  │  offers)   │  │  PDFs)      │ │
│  │  _log NEW)│  │            │  │             │ │
│  └───────────┘  └────────────┘  └─────────────┘ │
│  ┌──────────────────────────────────────────────┐ │
│  │  DB Triggers (NEW):                          │ │
│  │  agent_leads UPDATE → agent_lead_activities  │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘

External Services (partially wired):
┌──────────────────────────────────────────────────────────┐
│  Stripe Connect  │  Land Registry API  │  Resend email   │
│  (billing OK)    │  (service EXISTS,   │  (templates     │
│                  │   NOT wired to      │   exist, not    │
│                  │   appraisal tool)   │   wired to      │
│                  │                     │   agent flows)  │
│  Reapit/Alto/Jupix feed APIs                             │
│  (config UI exists; webhook handler MISSING ← GAP)      │
└──────────────────────────────────────────────────────────┘
```

### Key Data Flows

**Lead Stage Transition (updated — with version guard + DB trigger):**
```
Agent drags card ──▶ DnD onDragEnd ──▶ optimistic update ──▶ PATCH /api/agent/leads
      │                                       │                       │
      ▼                                       ▼                       ▼
 [nil leadId?]               [same stage as current?]         [role check]
 → DnD would not             → skip PATCH (no-op)             getTeamMemberRole()
   start                     → card stays in place             viewer → 403
                                                                       │
                                                                       ▼
                                                             [Supabase UPDATE]
                                                             .eq("updated_at", knownAt)
                                                              0 rows → 409 (stale)
                                                              1 row → success
                                                                       │
                                                                       ▼
                                                             [DB TRIGGER fires]
                                                             auto-insert agent_lead_activities
                                                             (no app-layer dependency)
                                                                       │
                                                                       ▼
                                                             [revert on error]
                                                             prevGrouped restored
                                                             toast("Lead updated by another user")
```

**Sale Stage Transition (TOCTOU fix — same pattern as leads):**
```
PATCH /api/agent/sales
      │
      ▼
 [role check] getTeamMemberRole() → viewer → 403
      │
      ▼
 updateSaleStage(progressionId, agentId, newStage, knownAt)
      │
      ├──▶ fetch current stage
      ├──▶ validate transition via ALLOWED_TRANSITIONS
      └──▶ UPDATE .eq("updated_at", knownAt)
                │
                ├── 0 rows returned → throw 409 "Stale — reload and retry"
                └── 1 row → success
```

**Market Appraisal — Current (Wrong) vs Correct:**
```
CURRENT (WRONG):                            CORRECT (after AGT-18 fix):
─────────────────                           ────────────────────────────
agent-analytics-service                     agent-analytics-service
getMarketAppraisalData()                    getMarketAppraisalData()
      │                                           │
      ▼                                           ├──▶ land-registry-service
SELECT * FROM properties                    │         getLandRegistryData(postcode)
WHERE postcode ILIKE '%[district]%'         │              │
AND status = 'active'  ← WRONG             │              ▼
(compares list prices to each              │    Land Registry PPD endpoint
 other, circular)                          │    (actual SOLD prices)
                                           │    try/catch → fallback on 503
                                           │
                                           ├──▶ SELECT active listings (context)
                                           │
                                           ▼
                                      sold_comparables + active_supply
                                      → suggested price + confidence band
```

**Feed Webhook — Store-and-Poll Architecture:**
```
POST /api/agent/feeds/webhook
      │
      ▼
 [validate provider signature]
      │
      ▼
 [validate payload schema] → malformed → 422
      │
      ▼
 [INSERT agent_feed_sync_log]
 { provider, raw_payload, status: 'pending', received_at }
      │
      ▼
 return 200 immediately (no timeout risk)
      │
      (async, decoupled)
      ▼
 Supabase cron (pg_cron)
 SELECT * FROM agent_feed_sync_log WHERE status = 'pending'
      │
      ▼
 [process each row: upsert properties]
      │
      ▼
 UPDATE agent_feed_sync_log SET status = 'processed'/'failed'
```

### Architecture Issues Found

| Issue | Severity | Fix | Decision |
|-------|----------|-----|----------|
| Feed webhook receiver missing entirely | **CRITICAL** | Build `/api/agent/feeds/webhook/route.ts` with store-and-poll | Decision 13 |
| Land Registry not wired to appraisal | WARNING | One service call addition + try/catch fallback | Decision 14 (AGT-18) |
| `getTeamMemberRole()` doesn't exist | **CRITICAL** | Build in `agent-team-service.ts` first, then wire to 8 routes | Decision 15 |
| `updateLeadStage()` + `addLeadActivity()` not transactional | WARNING | DB trigger on `agent_leads UPDATE` | Decision 16 |
| `updateSaleStage()` TOCTOU race (missed by CEO review) | WARNING | `updated_at` version guard, same as lead service | Decision 17 |
| `updateLeadStage()` TOCTOU race | WARNING | `updated_at` version guard — `.eq("updated_at", knownAt)` → 409 | Decision 17 |
| `agent-analytics-service` queries reviews table directly (not via review-service) | WARNING | Call `review-service.ts` instead |  |
| Activity feed N+1 risk on actor names | WARNING | Join profiles in `getAgentActivityFeed()` |  |
| Mock activity chart data in production | WARNING | Real data or empty state | Decision 18 |
| Stripe price IDs may be hardcoded | WARNING | Server-side lookup, not client payload |  |

### Scaling Characteristics

```
10x load:  KPI RPC acceptable — sequential joins, 10x concurrent
100x load: CRM ClientList uses offset pagination → slow at 1000+ entries
           LeadPipelineKanban fetches ALL leads client-side → large payload
           PARTIAL FIX in merge PR: .limit(200) cap on getAgentLeads()
           Full fix: cursor pagination + server-side stage grouping (TODOS.md P2)
```

### Single Points of Failure

1. Stripe down → billing + boost both fail, no fallback UX
2. Land Registry API down → market appraisal shows nothing → **fix: try/catch + fallback to active listings only**
3. `get_agent_dashboard_kpis()` RPC fails → entire dashboard home blank → **fix: skeleton + retry button**

---

## SECTION 2: ERROR & RESCUE MAP

| Method | Exception | Rescued? | Action | User Sees |
|--------|-----------|---------|--------|-----------|
| `getAgentDashboardKpis()` | PostgrestError | **NO → FIX** | try/catch → null | Skeleton + retry button |
| `getLandRegistryData()` | NetworkError, 503 | **NO → FIX** | try/catch → fallback to active listings | "LR unavailable — using listing prices" notice |
| `getLandRegistryData()` | JSON.parse error | **NO → FIX** | try/catch → log + fallback | Same as above |
| `updateLeadStage()` | Concurrent collision (stale `updated_at`) | **NO → FIX** | `.eq("updated_at", knownAt)` → 409 → client reverts | "Lead updated by another user" toast |
| `updateSaleStage()` | Concurrent collision (stale `updated_at`) | **NO → FIX (CEO missed)** | Same version guard → 409 | "Sale updated by another user" toast |
| `createStripeCheckout()` | StripeError | PARTIAL | Named catch → redirect | "Payment unavailable" + retry |
| `generateApiKey()` | Double-submit | PARTIAL | `isGenerating` state | Button disabled |
| `submitViewingFeedback()` | Unique constraint | **UNKNOWN → VERIFY** | 409 → "Already submitted" | Toast |
| `insertOfferHistory()` + `updateOfferStatus()` | Partial failure | **NO → FIX** | Wrap in DB transaction | Offer state consistent |
| Feed webhook receipt | Malformed payload | **N/A (being built)** | Schema validate → 422 | N/A |
| PDF render | Null field | **UNKNOWN → VERIFY** | Null guards before render | Graceful empty sections |

### Failure Modes Registry (updated 2026-03-16)

| Codepath | Failure | Rescued? | Test? | User Sees | Status |
|---------|---------|---------|-------|-----------|--------|
| KPI RPC | PostgrestError | N | N | Blank screen | **CRITICAL GAP** |
| Lead PATCH | Concurrent collision (stale) | N→**FIX** | N→**ADD** | Silent wrong state | Will be fixed |
| Sale PATCH | Concurrent collision (stale) | N→**FIX** | N→**ADD** | Silent wrong state | **CEO plan missed — now fixed** |
| LR API call | 503 | N→**FIX** | N→**ADD** | Crash | Will be fixed |
| Activity log | DB error (fire-and-forget) | N→**DB TRIGGER** | N | Invisible audit gap | Mitigated by trigger |
| Team role check | Viewer bypasses API | N→**FIX** | N→**ADD** | Silent | Will be fixed |
| API key list refresh | Wrong query param | N/A | N/A | N/A | **ALREADY FIXED** |
| Feed webhook | Malformed payload | N→**FIX (build)** | N→**ADD** | 422 | Will be built |
| Feed payload | Large feed timeout | N→**STORE-AND-POLL** | N | Timeout | Mitigated by architecture |
| Vendor PDF | Null field | **UNKNOWN** | N→**ADD** | Crash | Verify + add test |

---

## SECTION 3: SECURITY & THREAT MODEL

| Threat | Likelihood | Impact | Status |
|--------|-----------|--------|--------|
| Agent A reads Agent B's leads | Med | High | **MITIGATED** — RLS on all tables |
| Team member viewer role bypasses API mutations | Med | Med | **CRITICAL GAP** — role is UI-only, `getTeamMemberRole()` doesn't exist yet |
| `api_key_encrypted` stored in plaintext despite name | Med | High | **VERIFY** — Supabase Vault or AES? |
| Reapit/Alto API keys exposed via DB access | Med | High | Same as above |
| Stripe price ID tampered by client | Med | High | **VERIFY** — server-side lookup? |
| XSS via review response text | Low | Med | MITIGATED — profanity + sanitize |
| CSRF on offer accept/reject | Low | High | MITIGATED — Next.js + Supabase auth |

### CRITICAL Security Finding

**Team member role enforcement is UI-only AND `getTeamMemberRole()` does not exist.**

The `viewer` role hides buttons in `RolesPermissions.tsx`. But `/api/agent/leads`, `/api/agent/offers`, etc. do not check team member role before mutations. A viewer with DevTools can PATCH any agent resource. Additionally, `grep -rn getTeamMemberRole src/` returns zero results — the function must be built before it can be wired.

**Fix (two steps — must both be in merge PR):**
1. Add `getTeamMemberRole(supabase, agentId, userId): Promise<TeamRole | null>` to `agent-team-service.ts`
   - Query: `SELECT role FROM agent_team_members WHERE agent_id = $1 AND user_id = $2 AND status = 'active'`
   - Returns `null` if user is not a team member (agent owner calling their own routes → skip check)
2. Call it in all 8 mutation API routes under `/api/agent/`: `leads`, `offers`, `sales`, `viewings`, `team`, `crm`, `listings`, `feeds`
   - If role is `viewer` → return 403

---

## SECTION 4: DATA FLOW & INTERACTION EDGE CASES

| Interaction | Edge Case | Handled? | Fix |
|------------|-----------|---------|-----|
| Lead Kanban drag | Two agents drag same card simultaneously | **FIXED** | `updated_at` version guard → 409, client reverts |
| Sale Kanban drag | Two users update same sale stage simultaneously | **FIXED** | Same version guard on `updateSaleStage()` |
| Lead Kanban drag | Any stage direction allowed (decision: YES) | ✓ | Log every move via DB trigger to `agent_lead_activities` |
| Create Listing Wizard | User abandons mid-wizard | ? | Verify draft state saved |
| Create Listing Wizard | Photo upload fails for 1 of 5 | ? | Verify partial upload handling |
| Offer accept | Buyer withdraws while agent is accepting | Race | No mutex — last write wins |
| ViewingCalendar | Two agents book same slot simultaneously | ? | Add `WHERE is_booked = false` to UPDATE |
| API key generate | Double-click generates two keys | PARTIAL | Verify `isGenerating` disables button |
| PDF vendor report | Property has 0 viewings (divide by zero) | ? | Verify null guards in VendorReportPDF — add test |
| CRM bulk email | Agent selects 500 clients → Resend rate limit | ? | Add batch size limit |
| Feed sync | Property deleted in Reapit feed | N/A | Handle deletes in webhook receiver store-and-poll processor |

---

## SECTION 5: CODE QUALITY REVIEW

### DRY Violations

| Pattern | Files | Fix | Priority |
|---------|-------|-----|----------|
| `agent_id = auth.uid()` RLS snippet in all 15 tables | Migration SQL | Extract to `agent_owns_row()` function | TODOS.md P2 |
| `useCallback` + `fetch('/api/agent/...')` in 10+ components | Client components | `useAgentApi()` hook | TODOS.md P2 |
| Stage label display (`new_enquiry` → "New Enquiry") inline in `leads/page.tsx` | `leads/page.tsx` | Add `LEAD_STAGE_LABELS: Record<LeadStage, string>` to `types/agent.ts`, remove inline map | **Fix in merge PR** |

### Naming Issues

- `agent-analytics-service.ts` (465 lines) covers analytics + market appraisal + performance — three distinct domains in one file. **Split at Phase 7 (TODOS.md P2).**
- `AgentDashboardHome.tsx` vs `AgentDashboard.tsx` (old) — naming collision. `AgentDashboard.tsx` has zero imports — **delete on merge**.

### WARNING: Mock data + SSR hydration risk

`AgentDashboardHome.tsx` line 57: `generateChartData()` uses `Math.random()` to produce 30 chart points that look like real historical data. Two problems:

1. **UX deception** — data looks real but is fabricated on every render
2. **SSR hydration mismatch** — server renders with one set of random values; client re-renders with different values → React hydration warning/error in production

**Fix in merge PR:** Replace with real 30-day data (query `agent_lead_activities GROUP BY DATE(created_at)`) or an "Activity data available after 30 days" empty state for new agents.

---

## SECTION 6: TEST REVIEW

### CRITICAL GAP: Zero Agent Tests

```
TEST PYRAMID (agent domain):
─────────────────────────────
E2E              0  ← NONE
Integration      0  ← NONE
Unit             0  ← NONE
─────────────────────────────
Every other phase has tests. Agent domain has state machines and security
boundaries. Tests MUST be written on the feature branch before merge.
```

### New Codepaths Diagram (all require tests)

```
NEW CODEPATHS — ESTATE AGENT DASHBOARD (Phase 15)
══════════════════════════════════════════════════

1. LEAD PIPELINE
   updateLeadStage(leadId, agentId, newStage, knownAt?)
   ├── [happy path] stage updates, activity auto-logged via DB trigger
   ├── [version mismatch] knownAt != DB updated_at → 409
   ├── [concurrent edit] same-as-current stage → no-op
   └── [unauthorized] viewer role → 403 (API route test)

2. SALE PROGRESSION
   updateSaleStage(progressionId, agentId, newStage, knownAt?)
   ├── [happy path] valid adjacent transition → updates
   ├── [invalid transition] non-adjacent stage → throws with message
   ├── [version mismatch] stale updated_at → 409
   └── [not found] agentId mismatch → throws

3. MARKET APPRAISAL
   getMarketAppraisalData(supabase, postcode)
   ├── [happy path] LR API + active listings → comparables
   ├── [LR API down] 503/timeout → fallback to active listings only
   └── [no data] 0 results → empty MarketAppraisalData returned, no crash

4. TEAM ROLE ENFORCEMENT (new function)
   getTeamMemberRole(supabase, agentId, userId) [MUST BUILD]
   ├── [owner] user is agentId → allow (null returned, route skips check)
   ├── [admin role] record exists with role='admin' → allow
   ├── [viewer role] record exists with role='viewer' → 403
   └── [not a member] no record → 403

5. API KEY LIFECYCLE
   POST /api/agent/billing?action=generate_key
   ├── [happy path] key generated, shown once in UI
   ├── [list refresh] GET ?type=keys after generation returns updated list
   └── [double-submit] isGenerating guard prevents second call

6. FEED WEBHOOK RECEIVER (new route)
   POST /api/agent/feeds/webhook
   ├── [happy path] validates payload → inserts agent_feed_sync_log → 200
   ├── [malformed payload] schema validation fails → 422
   └── [unknown provider] provider not in enum → 400

7. VIEWING CALENDAR
   drag-to-reschedule (new DnD interaction)
   ├── [happy path] PATCH viewing slot, calendar updates
   └── [double-booking] WHERE is_booked = false guard prevents conflict

8. VENDOR REPORT PDF
   VendorReportPDF(property, viewings, offers)
   ├── [happy path] renders with all data
   └── [0 viewings] no divide-by-zero, empty section renders cleanly

9. DELIGHT FEATURES
   LeadCard isStale: updated_at > 7 days → isStale=true → amber badge
```

### Required Tests (minimum — 12 total, use /gsd:add-tests)

| # | Test | Type | Why |
|---|------|------|-----|
| 1 | `agent-lead-service` — `updateLeadStage()` happy path | Unit | Stage update returns updated row |
| 2 | `agent-lead-service` — stale `updated_at` → 409 | Unit | Version guard works |
| 3 | `agent-team-service` — `getTeamMemberRole()` returns correct role for owner/admin/viewer/stranger | Unit | Core security function |
| 4 | `/api/agent/leads` — viewer role → 403 on PATCH | Integration | Role enforcement wired correctly |
| 5 | `agent-sale-service` — non-adjacent stage transition rejected | Unit | Sequential enforcement works |
| 6 | `agent-sale-service` — stale `updated_at` → 409 | Unit | Version guard on sale service too |
| 7 | `agent-analytics-service` — `getMarketAppraisalData()` falls back gracefully on LR 503 | Unit | Graceful degradation |
| 8 | `/api/agent/billing` — key generated, shown once, list refreshes | Integration | API key lifecycle |
| 9 | `/api/agent/feeds/webhook` — valid payload → `agent_feed_sync_log` row inserted → 200 | Integration | Webhook happy path |
| 10 | `/api/agent/feeds/webhook` — malformed payload → 422 | Integration | Schema validation |
| 11 | `VendorReportPDF` — renders without crash when viewings = [] | Unit | Null guard |
| 12 | `LeadCard` — `isStale` is `true` when `updated_at` > 7 days | Unit | Staleness badge logic |

---

## SECTION 7: PERFORMANCE REVIEW

### N+1 Risks

| Component | Risk | Fix |
|-----------|------|-----|
| `AgentDashboardHome` activity feed — actor names | Potential N+1 | Join profiles in query |
| `ClientList.tsx` — linked property count per client | If sub-query per row | Batch count in CRM query |
| `TeamMemberList.tsx` — metrics per member | If per-member fetch | Batch all member metrics |
| `LeadPipelineKanban` — all leads loaded client-side | Unbounded payload | **`.limit(200)` cap in merge PR** — cursor pagination deferred to TODOS.md P2 |

### Database Index Gaps

| Query | Index? | Fix |
|-------|--------|-----|
| `WHERE agent_id = $1 AND stage = $2` (leads) | YES — composite exists | ✓ |
| `WHERE agent_id = $1 AND status = $2` (offers) | YES — composite exists | ✓ |
| `WHERE agent_id = $1 ORDER BY created_at DESC` (activity) | Only agent_id | Add `(agent_id, created_at DESC)` |
| `WHERE agent_id = $1 AND name ILIKE '%x%'` (CRM) | No full-text | Add `pg_trgm` GIN index |

### Top 3 Slow Paths

1. **Market appraisal + Land Registry** — external HTTP + DB. p99 ~3-5s. Redis 24hr TTL cache by `(postcode_district, property_type)` deferred to **TODOS.md P1** — ship LR wiring first, cache once rate limits are a real problem.
2. **Vendor report PDF generation** — `@react-pdf/renderer` in-process. Large listings = slow. Consider edge function + cached PDF URL post-launch.
3. **CRM ILIKE search** — sequential scan. `pg_trgm` GIN index reduces O(n) → O(log n).

---

## SECTION 8: OBSERVABILITY

### Logging Gaps

| Codepath | Logged? | What's missing |
|----------|---------|----------------|
| Lead stage transition | **YES (via DB trigger)** | Covered by `agent_lead_activities` auto-insert |
| Sale stage transition | **NO** | DB trigger deferred to **TODOS.md P1** — `agent_sale_activities` table |
| Offer accept/reject | YES (`agent_offer_history` table) | ✓ |
| API key generation | Unknown | `{agentId, keyPrefix, createdAt}` — NOT the full key |
| Stripe webhook receipt | Unknown | Event type, success/failure |
| Land Registry API call | Unknown | Postcode, response time, fallback triggered |

### Day-1 Alerts Needed

1. `agent_lead_activities` insert rate → zero: leads service or trigger down
2. Stripe webhook failures > 3 in 5 min: payment processing broken
3. Land Registry API p99 > 5s: market appraisal timing out
4. `agent_feed_sync_log` pending count > 100 for > 1hr: cron processor down

---

## SECTION 9: DEPLOYMENT & ROLLOUT

### Migration Safety

`20260313_agent_dashboard.sql` creates 15 new tables — **additive only**. No existing tables altered. Zero-downtime, fully backward-compatible.

**New migration needed in merge PR:**
- `agent_feed_sync_log` table
- DB trigger on `agent_leads UPDATE` → `agent_lead_activities`
- `(agent_id, created_at DESC)` index on activity table

### Merge Deployment Sequence (updated 2026-03-16)

```
Step 1: Apply migrations to Supabase
         • 20260313_agent_dashboard.sql (15 existing tables)
         • NEW: agent_feed_sync_log table
         • NEW: DB trigger agent_leads UPDATE → agent_lead_activities
         • NEW: composite index (agent_id, created_at DESC) on activity table

Step 2: On feature/phase-15-estate-agent-dashboard, implement all fixes:

  SECURITY
  (a) Build getTeamMemberRole() in agent-team-service.ts
  (b) Wire getTeamMemberRole() into 8 mutation API routes → 403 for viewer

  BUG FIXES
  (c) AGT-31: ALREADY FIXED — remove from checklist
  (d) AGT-12: Add DnD reschedule to ViewingCalendar.tsx (reuse @dnd-kit from SaleProgressionKanban)
  (e) AGT-18: Wire land-registry-service to getMarketAppraisalData() + try/catch fallback

  DATA INTEGRITY
  (f) Add updated_at version guard to updateLeadStage() → 409 on stale
  (g) Add updated_at version guard to updateSaleStage() → 409 on stale (CEO plan missed this)
  (h) Add .limit(200) to getAgentLeads() query

  CODE QUALITY
  (i) Add LEAD_STAGE_LABELS: Record<LeadStage, string> to types/agent.ts; remove inline map in leads/page.tsx
  (j) Replace generateChartData() Math.random() with real 30-day data or "available after 30 days" empty state
  (k) Delete AgentDashboard.tsx (old, confirmed zero imports)

  WEBHOOK
  (l) Build /api/agent/feeds/webhook/route.ts (store-and-poll: validate → insert feed_sync_log → 200)
  (m) Set up Supabase pg_cron job to process agent_feed_sync_log

Step 3: Write 12 tests on feature branch (gates merge — see Section 6)
         Use /gsd:add-tests for agent domain

Step 4: Add 3 delight features
         • isStale badge on LeadCard (updated_at > 7 days → amber)
         • "Send to vendor now" button after PDF generation
         • Lead source PieChart on AgentDashboardHome

Step 5: Verify (before claiming done)
         • api_key_encrypted — confirm AES-GCM/Vault, not just column name
         • submitViewingFeedback() — confirm unique constraint returns 409
         • VendorReportPDF — confirm null guards on 0-viewing properties

Step 6: pnpm build && pnpm lint → must pass clean

Step 7: Merge feature/phase-15-estate-agent-dashboard → main
         Resolve conflicts with d084948 hotfix first

Step 8: Post-deploy verification (first 5 minutes)
```

### Post-Deploy Verification (first 5 minutes)

```
✓ /dashboard/agent loads without blank screen (KPI RPC works, skeleton on error)
✓ /dashboard/agent/leads shows Kanban, not hardcoded stub
✓ Create test API key → shown once → list refreshes correctly
✓ /dashboard/agent/sales/appraisal shows Land Registry comparables
✓ Stripe: click "Upgrade Plan" → Stripe Checkout page loads
✓ Feed config → connect → POST to webhook endpoint → check agent_feed_sync_log row inserted
✓ DevTools: PATCH /api/agent/leads as viewer role → confirms 403
```

---

## SECTION 10: LONG-TERM TRAJECTORY

### Technical Debt Introduced

| Debt | Type | Severity |
|------|------|----------|
| Activity chart uses seeded/mock data | Code debt | HIGH — **fixed in merge PR** |
| `agent-analytics-service.ts` 465 lines, 3 domains | Code debt | MED — split at Phase 7 |
| Feed sync is config-only (no actual sync) | Feature debt | HIGH — **fixed in merge PR** |
| Zero tests on agent domain | Testing debt | HIGH — **fixed before merge** |
| `api_key_encrypted` — encryption unclear | Operational debt | HIGH — verify before launch |
| No activity audit trail for sale stage changes | Audit debt | MED — **TODOS.md P1** |
| `getAgentLeads()` capped at 200, not paginated | Scale debt | MED — **TODOS.md P2** |

### Platform Potential (12-Month Vision)

1. **Agent intelligence API** — `agent_leads` + `agent_sale_progressions` tables at scale = cross-agent benchmarking dataset. "Your avg time-to-close is 47 days. Top agents in your area: 31 days."
2. **Vendor portal** — sellers get read-only view of their sale progression Kanban. One RLS policy change + new route. Eliminates "what's happening?" phone calls.
3. **Agent marketplace** — buyers can search for agents by rating, response time, and sale-to-asking ratio. Turns agent reputation into a search signal.

---

## ALL DECISIONS LOCKED (22 total)

### CEO Review Decisions (2026-03-15)

| # | Decision | Outcome |
|---|----------|---------|
| 1 | Feed webhook receiver | **Build in merge PR** (`/api/agent/feeds/webhook/route.ts`) |
| 2 | KPI error UX | **Skeleton + retry button** on `getAgentDashboardKpis()` failure |
| 3 | Team role enforcement | **Fix in merge PR** — `getTeamMemberRole()` in 8 mutation routes |
| 4 | Tests before merge | **Write tests first** — use `/gsd:add-tests`, gates merge |
| 5 | Mock chart data | **Fix in merge PR** — real data or "30 days" empty state |
| 6 | Lead stage direction | **Allow free movement** — any stage, all moves logged |
| 7 | Analytics service split | **TODOS.md P2** — split at Phase 7 |
| 8 | Vendor portal | **TODOS.md P1** — milestone events from sale stage changes |
| 9 | SMS/WhatsApp | **TODOS.md P1** — Twilio fast-follow post-launch |
| 10 | Auto vendor email cadence | **TODOS.md P2** — Inngest cron post-launch |
| 11 | Cross-agent benchmarking | **TODOS.md P2** — needs data volume + GDPR opt-in |
| 12 | Viewing confirmation email | **TODOS.md P1** — fast-follow after Phase 22 email templates |

### Eng Review Decisions (2026-03-16)

| # | Decision | Outcome |
|---|----------|---------|
| 13 | Feed webhook queue strategy | **Store-and-poll** — validate → insert `agent_feed_sync_log` → 200; Supabase pg_cron processes. No timeout risk, no new services. |
| 14 | AGT-31 status | **ALREADY FIXED** — `ApiKeyManager.tsx:45` uses `?type=keys`; `billing/route.ts:35` handles it. Remove from checklist. |
| 15 | `getTeamMemberRole()` location | **New function in `agent-team-service.ts`** — minimal diff, no new file, consistent with service pattern |
| 16 | Activity log transactional safety | **DB trigger on `agent_leads UPDATE`** — auto-inserts `agent_lead_activities`, eliminates app-layer dependency entirely |
| 17 | TOCTOU race on lead AND sale services | **`updated_at` version guard on both** — `.eq("updated_at", knownAt)` → 0 rows = 409; `updateSaleStage()` was missed by CEO review |
| 18 | `getAgentLeads()` pagination | **`.limit(200)` pragmatic cap in merge PR** — full cursor pagination deferred to TODOS.md P2 |
| 19 | Land Registry caching | **Deferred to TODOS.md P1** — ship LR wiring first; cache once rate limits are a real problem |
| 20 | `LEAD_STAGE_LABELS` | **Fix in merge PR** — add `LEAD_STAGE_LABELS: Record<LeadStage, string>` to `types/agent.ts`, remove inline map in `leads/page.tsx` |
| 21 | `AgentDashboard.tsx` (old) | **Delete on merge** — zero imports confirmed |
| 22 | Sale stage activity audit trigger | **TODOS.md P1** — reuse lead trigger pattern; `agent_sale_activities` table |

---

## DELIGHT FEATURES

| Feature | Decision | Effort | Notes |
|---------|----------|--------|-------|
| Lead staleness badge (amber if >7 days no contact) | **Build in merge PR** | 15 min | `updated_at` field exists on `agent_leads` |
| "Send to vendor now" after PDF generate | **Build in merge PR** | 30 min | Resend + VendorReportPDF already exist |
| Lead source doughnut chart on Dashboard Home | **Build in merge PR** | 20 min | `agent_leads.source` already stored |
| Sale stage ETA badges | **TODOS.md P2** | S | Needs `stage_entered_at` column + data |
| Viewing confirmation auto-email | **TODOS.md P1** | S | After Phase 22 email templates merged |

---

## TODOS.md Items (2026-03-15 CEO + 2026-03-16 Eng Review)

12 items total. Write to `/TODOS.md` under "Estate Agent Dashboard (Phase 15 / Reviews 2026-03-15 + 2026-03-16)".

### From CEO Review (2026-03-15)

1. **P2 — Split agent-analytics-service.ts** — 3 domains (analytics, market appraisal, vendor reports) into 3 separate services. 465 lines today. Phase 7 refactor window. Start: extract `getMarketAppraisalData()` and vendor report functions into their own files.

2. **P1 — Vendor portal: seller-facing sale progression** — `insertMilestone()` in `agent-sale-service.ts` when sale stage changes. One RLS policy change + new read-only route for sellers. Eliminates "what's happening?" calls.

3. **P1 — SMS/WhatsApp notifications via Twilio** — viewing confirmations, offer alerts, viewing feedback requests. Fast-follow post-Phase 15 merge. Blocked by: Twilio account setup.

4. **P2 — Automated weekly vendor report email cadence** — Inngest cron + Resend + new `VendorWeeklyUpdate` React Email template. Post-launch.

5. **P2 — Sale stage ETA badges** — UK conveyancing averages as baseline. Requires `stage_entered_at` column on `agent_sale_progressions` + data to calibrate. Post-launch.

6. **P2 — Cross-agent benchmarking (opt-in)** — aggregate queries across all agents, GDPR consent, `analytics_opt_in` flag on agent profiles. Needs data volume. Post-launch.

7. **P1 — Viewing confirmation auto-email** — `ViewingConfirmation.tsx` React Email template + hook in viewing service. Blocked by: Phase 22 email templates merged first.

### From Eng Review (2026-03-16)

8. **P1 — Land Registry API caching** — Cache `getMarketAppraisalData()` results in Upstash Redis by `(postcode_district, property_type)` with 24hr TTL. Without it, every appraisal hits the external LR API. Rate limits unknown. Start: add to `getMarketAppraisalData()` in `agent-analytics-service.ts` after LR wiring is live and usage patterns are visible.

9. **P1 — Sale stage activity audit trigger** — DB trigger on `agent_sale_progressions UPDATE` → auto-insert into `agent_sale_activities` table. Reuse the same pattern as the `agent_leads` trigger built in the merge PR. UK conveyancing audit trail: "who moved this stage and when?" matters for disputes. Start: same migration as leads trigger, same table shape as `agent_lead_activities`.

10. **P2 — Lead + Sale Kanban cursor pagination** — Replace `.limit(200)` pragmatic cap with server-side `GROUP BY stage` + cursor pagination. Required before agents with large portfolios (200+ active leads) onboard. Blocked by: needing real usage data to choose the right page size and UX pattern.

11. **P2 — Feed webhook async queue (Supabase Edge Function + pg_net)** — Replace store-and-poll with proper async queue via Edge Function. Required when a real CRM integration (Reapit, Alto) sends feeds with 1000+ listings. Store-and-poll works at launch scale. Blocked by: edge function infrastructure setup.

12. **P2 — Split `agent-analytics-service.ts`** (same as item 1 above — confirmed P2, Phase 7 refactor).

---

## NOT IN SCOPE (Deferred)

| Item | Rationale |
|------|-----------|
| Video tour creation/editing | Complex media pipeline — Phase 7 |
| White-label portal (`agency.britestate.com`) | Multi-tenant architecture — post-launch |
| AI lead scoring with ML | Requires training data that doesn't exist yet |
| Custom report builder | Over-engineering at current scale |
| AR/VR property staging | Far out |
| WhatsApp/SMS (in-PR) | Twilio — fast-follow after Phase 15 ships |
| Automated vendor email cadence (in-PR) | Inngest cron — fast-follow |
| Upstash Redis cache for Land Registry API | Ship LR wiring first; cache when rate limits are a real problem |
| Cursor pagination for Lead/Sale Kanban | `.limit(200)` buys time; design pagination with real usage data |
| Supabase Edge Function async feed queue | Store-and-poll sufficient for launch; upgrade when payload sizes known |

---

## WHAT TO DO IN THE NEXT SESSION

### Checklist: Everything Needed Before Merge (updated 2026-03-16)

**SECURITY**
- [ ] Build `getTeamMemberRole(supabase, agentId, userId): Promise<TeamRole | null>` in `agent-team-service.ts`
- [ ] Wire `getTeamMemberRole()` into 8 mutation API routes — reject viewer with 403
  - Routes: `/api/agent/leads`, `/api/agent/offers`, `/api/agent/sales`, `/api/agent/viewings`, `/api/agent/team`, `/api/agent/crm`, `/api/agent/listings`, `/api/agent/feeds`

**BUG FIXES**
- [x] ~~AGT-31~~: **ALREADY FIXED** — `ApiKeyManager.tsx:45` uses `?type=keys`, `billing/route.ts:35` handles it
- [ ] **AGT-18**: Add `getLandRegistryData(postcode)` call in `getMarketAppraisalData()` (`agent-analytics-service.ts:415`). Wrap in try/catch → fallback to active listings on failure. Service is at `src/services/land-registry/land-registry.ts`.
- [ ] **AGT-12**: Add `@dnd-kit` drag-to-reschedule to `ViewingCalendar.tsx`. Reuse setup from `SaleProgressionKanban.tsx`.

**DATA INTEGRITY**
- [ ] DB migration: trigger on `agent_leads UPDATE` → auto-insert `agent_lead_activities`
- [ ] DB migration: create `agent_feed_sync_log` table
- [ ] DB migration: composite index `(agent_id, created_at DESC)` on activity table
- [ ] Add `updated_at` version guard to `updateLeadStage()` → 409 on stale
- [ ] Add `updated_at` version guard to `updateSaleStage()` → 409 on stale **(CEO plan missed this)**
- [ ] Add `.limit(200)` to `getAgentLeads()` in `agent-lead-service.ts`

**CODE QUALITY**
- [ ] Add `LEAD_STAGE_LABELS: Record<LeadStage, string>` to `src/types/agent.ts`; remove inline map from `leads/page.tsx`
- [ ] Replace `generateChartData()` in `AgentDashboardHome.tsx:57` with real 30-day data or "available after 30 days" empty state
- [ ] Delete `AgentDashboard.tsx` (old — zero imports confirmed)

**WEBHOOK**
- [ ] Build `/api/agent/feeds/webhook/route.ts` — validate payload → insert `agent_feed_sync_log` → 200; malformed → 422
- [ ] Set up `pg_cron` job on Supabase to process `agent_feed_sync_log` rows

**TESTS (must pass before merge — 12 tests)**
- [ ] `agent-lead-service`: `updateLeadStage()` happy path
- [ ] `agent-lead-service`: stale `updated_at` → 409
- [ ] `agent-team-service`: `getTeamMemberRole()` for owner/admin/viewer/stranger
- [ ] `/api/agent/leads`: viewer role → 403 on PATCH
- [ ] `agent-sale-service`: non-adjacent stage transition rejected
- [ ] `agent-sale-service`: stale `updated_at` → 409
- [ ] `agent-analytics-service`: `getMarketAppraisalData()` falls back gracefully on LR 503
- [ ] `/api/agent/billing`: key generated + shown once + list refreshes
- [ ] `/api/agent/feeds/webhook`: valid payload → `agent_feed_sync_log` row inserted → 200
- [ ] `/api/agent/feeds/webhook`: malformed payload → 422
- [ ] `VendorReportPDF`: renders without crash when `viewings = []`
- [ ] `LeadCard`: `isStale = true` when `updated_at` > 7 days

**DELIGHT**
- [ ] Add `isStale` computed prop to `LeadCard.tsx` (amber badge if `updated_at` > 7 days)
- [ ] Add "Send to vendor now" button to vendor report flow (Resend + VendorReportPDF)
- [ ] Add lead source `<PieChart>` to `AgentDashboardHome.tsx` (`agent_leads.source`)

**VERIFY**
- [ ] `api_key_encrypted` in `agent_feed_integrations` — confirm actual AES-GCM/Vault encryption, not just column name
- [ ] `submitViewingFeedback()` returns 409 on double-submit (DB unique constraint caught)
- [ ] `VendorReportPDF.tsx` null guards handle 0-viewing properties

**FINAL**
- [ ] `pnpm build && pnpm lint` → clean
- [ ] Post-deploy verification checklist (see Section 9)

### Key Files to Know

| File | Why It Matters |
|------|---------------|
| `src/services/agent/agent-analytics-service.ts:415` | `getMarketAppraisalData()` — add LR call here with try/catch |
| `src/services/agent/agent-lead-service.ts:90` | `updateLeadStage()` — add `updated_at` version guard here |
| `src/services/agent/agent-sale-service.ts:91` | `updateSaleStage()` — add `updated_at` version guard here (CEO plan missed) |
| `src/services/agent/agent-team-service.ts` | Add `getTeamMemberRole()` here |
| `src/components/dashboard/agent/viewings/ViewingCalendar.tsx` | Add drag-to-reschedule |
| `src/components/dashboard/agent/AgentDashboardHome.tsx:57` | Replace `generateChartData()` mock data |
| `src/components/dashboard/agent/leads/LeadCard.tsx` | Add staleness badge |
| `src/app/api/agent/leads/route.ts` (+ 7 other mutation routes) | Add role enforcement |
| `src/services/land-registry/land-registry.ts` | Already built — just wire it into `getMarketAppraisalData()` |
| `src/types/agent.ts` | Add `LEAD_STAGE_LABELS` const here |
| `src/components/dashboard/agent/AgentDashboard.tsx` | Delete — zero imports |

### Diagrams to Add in Code Comments

| File | Diagram |
|------|---------|
| `agent-lead-service.ts` | State machine: `LEAD_STAGES` flow + version guard pattern |
| `agent-sale-service.ts` | ASCII above `ALLOWED_TRANSITIONS` const showing the 8-stage conveyancing pipeline |
| `/api/agent/feeds/webhook/route.ts` | Processing pipeline: receive → validate → insert → cron processes |

---

*CEO Review completed: 2026-03-15 — SCOPE EXPANSION*
*Eng Review completed: 2026-03-16 — BIG CHANGE (10 questions, all resolved)*
*Phase: 15 — Estate Agent Dashboard (10.1–10.32)*
*New items vs CEO plan: sale TOCTOU fix, LEAD_STAGE_LABELS DRY, SSR hydration risk, AGT-31 already fixed, feed webhook store-and-poll architecture, activity log → DB trigger*
