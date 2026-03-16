# MEGA PLAN REVIEW — ESTATE AGENT DASHBOARD (10.1–10.32)

**Date:** 2026-03-15
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
| AGT-31 — API key list refresh | `?action=list_keys` vs `?type=keys` query param mismatch | BUG |

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

| Sub-problem | Existing code |
|------------|--------------|
| Market appraisal comparables | `src/services/land-registry/land-registry.ts` ← **already built, just wire it** |
| Review system | `review-service.ts` + `reviews` table (Phase 4) |
| Profanity filter | `src/lib/profanity.ts` (tested) |
| PDF generation pattern | `OfferLetterPdf.tsx` — same `@react-pdf/renderer` approach |
| Stripe billing | `agent-billing-service.ts` already wired |
| Milestone tracking | `milestone-service.ts` — sale progression should emit milestone events |
| AI description generation | `/api/ai/generate-description/route.ts` — CreateListingWizard already calls this |

### 0C. Dream State Mapping

```
CURRENT STATE                THIS PLAN DELIVERS              12-MONTH IDEAL
─────────────────────        ────────────────────────────    ──────────────────────────────
feature/phase-15 built       • Merge to main (fix 6 gaps)    • AI co-pilot in every workflow
but not merged               • Leads Kanban on main          • Proactive "follow up" alerts
26/32 requirements           • Fix API key refresh bug        • Predictive time-on-market
Main has stub leads page     • Wire Land Registry to          • WhatsApp/SMS notifications
No DnD in calendar             appraisal tool                • Automated vendor report cadence
Market appraisal uses        • Add drag-to-reschedule        • Mobile-first agent app
active listings not sold     • Feed webhook receiver          • Cross-agent benchmarking
prices                       • Role enforcement in API        • Vendor portal (seller self-serve)
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
│   ├── agent-offer        │       │   ├── /leads/route.ts          │
│   ├── agent-sale         │       │   ├── /listings/route.ts       │
│   ├── agent-crm          │       │   ├── /offers/route.ts         │
│   ├── agent-team         │       │   ├── /reports/route.ts        │
│   ├── agent-analytics    │       │   ├── /reviews/route.ts        │
│   ├── agent-billing      │       │   ├── /sales/route.ts          │
│   └── agent-feed         │       │   ├── /team/route.ts           │
└───────────────────┬──────┘       │   ├── /viewings/route.ts       │
                    │              │   └── /viewings/feedback/       │
┌───────────────────▼──────────────▼──────────────┐
│              Supabase Layer                       │
│  ┌───────────┐  ┌────────────┐  ┌─────────────┐ │
│  │ PostgREST │  │  Realtime  │  │  Storage    │ │
│  │ (15 agent │  │ (leads,    │  │ (logos,     │ │
│  │  tables)  │  │  viewings, │  │  floorplans,│ │
│  │           │  │  offers)   │  │  PDFs)      │ │
│  └───────────┘  └────────────┘  └─────────────┘ │
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

**Lead Stage Transition:**
```
Agent drags card ──▶ DnD onDragEnd ──▶ optimistic update ──▶ PATCH /api/agent/leads
      │                                       │                       │
      ▼                                       ▼                       ▼
 [nil leadId?]               [same stage as current?]         [Supabase UPDATE]
 → DnD would not             → skip PATCH (no-op)             agent_leads SET stage
   start                     → card stays in place                    │
                                                                       ▼
                                                             [revert on error]
                                                             prevGrouped restored
                                                             toast("Failed to move lead")
```

**Market Appraisal — Current (Wrong) vs Correct:**
```
CURRENT (WRONG):                            CORRECT:
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
                                           │
                                           ├──▶ SELECT active listings (context)
                                           │
                                           ▼
                                      sold_comparables + active_supply
                                      → suggested price + confidence band
```

### Architecture Issues Found

| Issue | Severity | Fix |
|-------|----------|-----|
| Feed webhook receiver missing entirely | **CRITICAL** | Build `/api/agent/feeds/webhook/route.ts` |
| Land Registry not wired to appraisal | WARNING | One service call addition |
| `agent-analytics-service` queries reviews table directly (not via review-service) | WARNING | Call `review-service.ts` instead |
| Activity feed N+1 risk on actor names | WARNING | Join profiles in `getAgentActivityFeed()` |
| Mock activity chart data in production | WARNING | Real data or empty state |
| Stripe price IDs may be hardcoded | WARNING | Server-side lookup, not client payload |

### Scaling Characteristics

```
10x load:  KPI RPC acceptable — sequential joins, 10x concurrent
100x load: CRM ClientList uses offset pagination → slow at 1000+ entries
           LeadPipelineKanban fetches ALL leads client-side → large payload
           Fix: cursor pagination + server-side stage grouping
```

### Single Points of Failure

1. Stripe down → billing + boost both fail, no fallback UX
2. Land Registry API down → market appraisal shows nothing (need fallback)
3. `get_agent_dashboard_kpis()` RPC fails → entire dashboard home blank

---

## SECTION 2: ERROR & RESCUE MAP

| Method | Exception | Rescued? | Action | User Sees |
|--------|-----------|---------|--------|-----------|
| `getAgentDashboardKpis()` | PostgrestError | **NO → FIX** | try/catch → null | Skeleton + retry button |
| `getLandRegistryData()` | NetworkError, 503 | **NO → FIX** | try/catch → fallback | "LR unavailable" notice |
| `getLandRegistryData()` | JSON.parse error | **NO → FIX** | try/catch → log + fallback | Same as above |
| `updateLeadStage()` | Concurrent collision | **NO → FIX** | 409 → client reverts | "Lead updated by another user" |
| `createStripeCheckout()` | StripeError | PARTIAL | Named catch → redirect | "Payment unavailable" + retry |
| `generateApiKey()` | Double-submit | PARTIAL | `isGenerating` state | Button disabled |
| `submitViewingFeedback()` | Unique constraint | **UNKNOWN → VERIFY** | 409 → "Already submitted" | Toast |
| `insertOfferHistory()` + `updateOfferStatus()` | Partial failure | **NO → FIX** | Wrap in DB transaction | Offer state consistent |
| Feed webhook receipt | Malformed payload | N/A (being built) | Schema validate → 422 | N/A |
| PDF render | Null field | **UNKNOWN → VERIFY** | Null guards before render | Graceful empty sections |

### Failure Modes Registry

| Codepath | Failure | Rescued? | Test? | User Sees | Status |
|---------|---------|---------|-------|-----------|--------|
| KPI RPC | PostgrestError | N | N | Blank screen | **CRITICAL GAP** |
| Lead PATCH | Concurrent collision | N | N | Silent wrong state | **CRITICAL GAP** |
| LR API call | 503 | N | N | Crash | **CRITICAL GAP** |
| Offer history write | DB error | N | N | Inconsistent state | **CRITICAL GAP** |
| Team role check | Viewer bypasses API | N | N | Silent | **CRITICAL GAP** |
| API key list refresh | Wrong query param | N | N | List doesn't refresh | BUG |

---

## SECTION 3: SECURITY & THREAT MODEL

| Threat | Likelihood | Impact | Status |
|--------|-----------|--------|--------|
| Agent A reads Agent B's leads | Med | High | **MITIGATED** — RLS on all tables |
| Team member viewer role bypasses API mutations | Med | Med | **CRITICAL GAP** — role is UI-only |
| `api_key_encrypted` stored in plaintext despite name | Med | High | **VERIFY** — Supabase Vault or AES? |
| Reapit/Alto API keys exposed via DB access | Med | High | Same as above |
| Stripe price ID tampered by client | Med | High | **VERIFY** — server-side lookup? |
| XSS via review response text | Low | Med | MITIGATED — profanity + sanitize |
| CSRF on offer accept/reject | Low | High | MITIGATED — Next.js + Supabase auth |

### CRITICAL Security Finding

**Team member role enforcement is UI-only.** The `viewer` role hides buttons in `RolesPermissions.tsx`. But `/api/agent/leads`, `/api/agent/offers`, etc. do not check team member role before mutations. A viewer with DevTools can PATCH any agent resource.

**Fix:** Add `getTeamMemberRole(agentId, userId)` check to all 8 mutation API routes. Reject with 403 if role is `viewer`. **Must be in merge PR.**

---

## SECTION 4: DATA FLOW & INTERACTION EDGE CASES

| Interaction | Edge Case | Handled? | Fix |
|------------|-----------|---------|-----|
| Lead Kanban drag | Two agents drag same card simultaneously | PARTIAL | Add `updated_at` version guard to PATCH |
| Lead Kanban drag | Any stage direction allowed (decision: YES) | ✓ | Log every move in `agent_lead_activities` |
| Create Listing Wizard | User abandons mid-wizard | ? | Verify draft state saved |
| Create Listing Wizard | Photo upload fails for 1 of 5 | ? | Verify partial upload handling |
| Offer accept | Buyer withdraws while agent is accepting | Race | No mutex — last write wins |
| ViewingCalendar | Two agents book same slot simultaneously | ? | Add `WHERE is_booked = false` to UPDATE |
| API key generate | Double-click generates two keys | PARTIAL | Verify `isGenerating` disables button |
| PDF vendor report | Property has 0 viewings (divide by zero) | ? | Verify null guards in VendorReportPDF |
| CRM bulk email | Agent selects 500 clients → Resend rate limit | ? | Add batch size limit |
| Feed sync | Property deleted in Reapit feed | N/A | Handle deletes in webhook receiver |

---

## SECTION 5: CODE QUALITY REVIEW

### DRY Violations

| Pattern | Files | Fix |
|---------|-------|-----|
| `agent_id = auth.uid()` RLS snippet in all 15 tables | Migration SQL | Extract to `agent_owns_row()` function |
| `useCallback` + `fetch('/api/agent/...')` in 10+ components | Client components | `useAgentApi()` hook |
| Stage label display (`new_enquiry` → "New Enquiry") | LeadPipelineKanban, LeadCard | Add display labels to `LEAD_STAGES` const |

### Naming Issues

- `agent-analytics-service.ts` (465 lines) covers analytics + market appraisal + performance — three distinct domains in one file. **Split at Phase 7.**
- `AgentDashboardHome.tsx` vs `AgentDashboard.tsx` (old) — naming collision. Delete old one on merge.

### WARNING: Mock data in production-facing chart

`AgentDashboardHome.tsx` line 57: "Generate mock 30-day activity chart data seeded from KPIs." The activity trend chart shows fabricated data that looks real. **Fix in merge PR** — real 30-day data or "Data available after 30 days" empty state.

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
boundaries. Tests must be written BEFORE this merges.
```

### Required Tests (Minimum — use /gsd:add-tests)

| Test | Type | Why |
|------|------|-----|
| `agent-lead-service` — `updateLeadStage()` happy path | Unit | Stage update returns updated row |
| `agent-lead-service` — concurrent update collision | Unit | 409 returned, client reverts |
| `agent-sale-service` — non-adjacent stage rejected (sale progression) | Unit | Sequential enforcement works |
| `agent-billing-service` — API key hash never stored in plaintext | Unit | Security invariant |
| `agent-analytics-service` — market appraisal falls back on LR failure | Unit | Graceful degradation |
| `/api/agent/leads` — viewer role rejected on PATCH | Integration | Role enforcement works |
| `ViewingCalendar` — double-booking prevention | Integration | `is_booked` uniqueness |
| `ApiKeyManager` — key shown once + list refresh after fix | Integration | AGT-31 bug class |

---

## SECTION 7: PERFORMANCE REVIEW

### N+1 Risks

| Component | Risk | Fix |
|-----------|------|-----|
| `AgentDashboardHome` activity feed — actor names | Potential N+1 | Join profiles in query |
| `ClientList.tsx` — linked property count per client | If sub-query per row | Batch count in CRM query |
| `TeamMemberList.tsx` — metrics per member | If per-member fetch | Batch all member metrics |
| `LeadPipelineKanban` — all leads loaded client-side, grouped | 500 leads = large payload | Server-side GROUP BY stage + pagination |

### Database Index Gaps

| Query | Index? | Fix |
|-------|--------|-----|
| `WHERE agent_id = $1 AND stage = $2` (leads) | YES — composite exists | ✓ |
| `WHERE agent_id = $1 AND status = $2` (offers) | YES — composite exists | ✓ |
| `WHERE agent_id = $1 ORDER BY created_at DESC` (activity) | Only agent_id | Add `(agent_id, created_at DESC)` |
| `WHERE agent_id = $1 AND name ILIKE '%x%'` (CRM) | No full-text | Add `pg_trgm` GIN index |

### Top 3 Slow Paths

1. **Market appraisal + Land Registry** — external HTTP + DB. p99 ~3-5s. Cache in Redis 24hr TTL by `(postcode_district, property_type)`.
2. **Vendor report PDF generation** — `@react-pdf/renderer` in-process. Large listings = slow. Consider edge function + cached PDF URL.
3. **CRM ILIKE search** — sequential scan. `pg_trgm` GIN index reduces O(n) → O(log n).

---

## SECTION 8: OBSERVABILITY

### Logging Gaps

| Codepath | Logged? | What's missing |
|----------|---------|----------------|
| Lead stage transition | Unknown | `{agentId, leadId, from, to, actorId, timestamp}` |
| Offer accept/reject | YES (`agent_offer_history` table) | ✓ |
| API key generation | Unknown | `{agentId, keyPrefix, createdAt}` — NOT the full key |
| Stripe webhook receipt | Unknown | Event type, success/failure |
| Land Registry API call | Unknown | Postcode, response time, fallback triggered |

### Day-1 Alerts Needed

1. `agent_lead_activities` insert rate → zero: leads service down
2. Stripe webhook failures > 3 in 5 min: payment processing broken
3. Land Registry API p99 > 5s: market appraisal timing out

---

## SECTION 9: DEPLOYMENT & ROLLOUT

### Migration Safety

`20260313_agent_dashboard.sql` creates 15 new tables — **additive only**. No existing tables altered. Zero-downtime, fully backward-compatible.

### Merge Deployment Sequence

```
Step 1: Apply migration 20260313_agent_dashboard.sql to Supabase
         ↓ (15 tables created, existing data unaffected)

Step 2: Cherry-pick / merge feature/phase-15 → main
         ↓ Fix conflicts with d084948 hotfix first

Step 3: Fix 6 known gaps:
         (a) AGT-31: Fix ?action=list_keys → ?type=keys in ApiKeyManager.tsx
         (b) AGT-12: Add DnD reschedule to ViewingCalendar.tsx (@dnd-kit already in SaleProgressionKanban)
         (c) AGT-18: Wire land-registry-service to getMarketAppraisalData()
         (d) Leads stub: confirm feature branch leads page replaces stub
         (e) Add role enforcement to 8 mutation API routes (getTeamMemberRole)
         (f) Build /api/agent/feeds/webhook/route.ts

Step 4: Write tests (use /gsd:add-tests for agent domain)

Step 5: Fix activity chart mock data

Step 6: Add 3 delight features (lead staleness badge, vendor 1-click email, lead source chart)

Step 7: pnpm build + pnpm lint → must pass clean

Step 8: Merge to main + push
```

### Post-Deploy Verification (first 5 minutes)

```
✓ /dashboard/agent loads without blank screen (KPI RPC works)
✓ /dashboard/agent/leads shows Kanban, not hardcoded stub
✓ Create test API key → shown once → list refreshes correctly
✓ /dashboard/agent/sales/appraisal shows Land Registry comparables
✓ Stripe: click "Upgrade Plan" → Stripe Checkout page loads
✓ Feed config → connect → webhook fires (check server logs)
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

### Platform Potential (12-Month Vision)

1. **Agent intelligence API** — `agent_leads` + `agent_sale_progressions` tables at scale = cross-agent benchmarking dataset. "Your avg time-to-close is 47 days. Top agents in your area: 31 days."
2. **Vendor portal** — sellers get read-only view of their sale progression Kanban. One RLS policy change + new route. Eliminates "what's happening?" phone calls.
3. **Agent marketplace** — buyers can search for agents by rating, response time, and sale-to-asking ratio. Turns agent reputation into a search signal.

---

## ALL DECISIONS LOCKED (12 total)

| # | Decision | Outcome |
|---|----------|---------|
| 1 | Feed webhook receiver | **Build in merge PR** (`/api/agent/feeds/webhook/route.ts`) |
| 2 | KPI error UX | **Skeleton + retry button** on `getAgentDashboardKpis()` failure |
| 3 | Team role enforcement | **Fix in merge PR** — `getTeamMemberRole()` in 8 mutation routes |
| 4 | Tests before merge | **Write tests first** — use `/gsd:add-tests` |
| 5 | Mock chart data | **Fix in merge PR** — real data or "30 days" empty state |
| 6 | Lead stage direction | **Allow free movement** — any stage, all moves logged |
| 7 | Analytics service split | **TODOS.md P2** — split at Phase 7 |
| 8 | Vendor portal | **TODOS.md P1** — milestone events from sale stage changes |
| 9 | SMS/WhatsApp | **TODOS.md P1** — Twilio fast-follow post-launch |
| 10 | Auto vendor email cadence | **TODOS.md P2** — Inngest cron post-launch |
| 11 | Cross-agent benchmarking | **TODOS.md P2** — needs data volume + GDPR opt-in |
| 12 | Viewing confirmation email | **TODOS.md P1** — fast-follow after Phase 22 email templates |

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

## TODOS.md Items Added (2026-03-15)

All 7 items written to `/TODOS.md` under "Estate Agent Dashboard (Phase 15 / CEO Review 2026-03-15)":

1. **P2 — Split agent-analytics-service.ts** — 3 domains into 3 services. Phase 7 refactor.
2. **P1 — Vendor portal: seller-facing sale progression** — `insertMilestone()` in `agent-sale-service.ts` when stage changes.
3. **P1 — SMS/WhatsApp notifications via Twilio** — viewing confirmations, offer alerts, viewing feedback.
4. **P2 — Automated weekly vendor report email cadence** — Inngest cron + Resend + new `VendorWeeklyUpdate` template.
5. **P2 — Sale stage ETA badges** — UK conveyancing averages + `stage_entered_at` column.
6. **P2 — Cross-agent benchmarking (opt-in)** — aggregate queries, GDPR consent, `analytics_opt_in` flag.
7. **P1 — Viewing confirmation auto-email** — `ViewingConfirmation.tsx` template + hook in viewing service.

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

---

## WHAT TO DO IN THE NEXT SESSION

### Checklist: Everything Needed Before Merge

- [ ] Run `/gsd:add-tests` for agent domain (8-10 tests)
- [ ] Merge `feature/phase-15-estate-agent-dashboard` → main (resolve `d084948` conflicts)
- [ ] **Fix AGT-31**: `ApiKeyManager.tsx` line 44 — change `?action=list_keys` to `?type=keys`
- [ ] **Fix AGT-18**: Add `getLandRegistryData(postcode)` call in `getMarketAppraisalData()` (`agent-analytics-service.ts` lines 412-458). Service exists at `src/services/land-registry/land-registry.ts`
- [ ] **Fix AGT-12**: Add `@dnd-kit` drag-to-reschedule to `ViewingCalendar.tsx` (pattern: reuse setup from `SaleProgressionKanban.tsx`)
- [ ] **Security fix**: Add `getTeamMemberRole(agentId, userId)` check to 8 mutation API routes under `/api/agent/` — reject viewer role with 403
- [ ] **New feature**: Build `/api/agent/feeds/webhook/route.ts` — receive → validate schema → queue sync
- [ ] **UX fix**: Replace mock activity chart data in `AgentDashboardHome.tsx` line 57 with real data or "available after 30 days" empty state
- [ ] **Delight**: Add `isStale` computed prop to `LeadCard.tsx` (amber badge if `updated_at` > 7 days)
- [ ] **Delight**: Add "Send to vendor now" button to vendor report flow (Resend + VendorReportPDF)
- [ ] **Delight**: Add lead source `<PieChart>` to `AgentDashboardHome.tsx`
- [ ] **Verify**: `api_key_encrypted` in `agent_feed_integrations` — confirm actual encryption (Supabase Vault or AES-GCM), not just column name
- [ ] **Verify**: `submitViewingFeedback()` returns 409 on double-submit (DB unique constraint caught)
- [ ] **Verify**: `VendorReportPDF.tsx` null guards handle 0-viewing properties
- [ ] `pnpm build && pnpm lint` → clean
- [ ] Post-deploy verification checklist (see Section 9)

### Key Files to Know

| File | Why It Matters |
|------|---------------|
| `src/services/agent/agent-analytics-service.ts:412-458` | Market appraisal data source — add LR call here |
| `src/components/dashboard/agent/integrations/ApiKeyManager.tsx:44` | The `?action=list_keys` bug |
| `src/components/dashboard/agent/viewings/ViewingCalendar.tsx` | Add drag-to-reschedule |
| `src/components/dashboard/agent/AgentDashboardHome.tsx:57` | Mock chart data |
| `src/components/dashboard/agent/leads/LeadCard.tsx` | Add staleness badge |
| `src/app/api/agent/leads/route.ts` (+ 7 other mutation routes) | Add role enforcement |
| `src/services/land-registry/land-registry.ts` | Already built — just wire it |
| `src/services/milestones/milestone-service.ts` | Call from sale service on stage change |

---

*Review completed: 2026-03-15*
*Reviewed by: CEO Plan Review (EXPANSION mode)*
*Phase: 15 — Estate Agent Dashboard (10.1–10.32)*
