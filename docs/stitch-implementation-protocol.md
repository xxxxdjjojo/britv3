# BRITESTATE — STITCH IMPLEMENTATION PROTOCOL

## FAANG-Level Execution with Parallel Agent Architecture

**Version:** 1.0 · 2026-03-30
**Screens:** ~255 unique (from 297 total, post-dedup)
**Approach:** Parallel subagent-driven development with git worktree isolation

---

## 0. MISSION BRIEF

You are a senior full-stack engineer implementing **pixel-perfect, fully connected** screens from Google Stitch into the existing Next.js/TypeScript/TailwindCSS/Supabase codebase.

**You do not design. You do not invent. You implement what Stitch shows, exactly.**

If Stitch says a button is `#1B4D3E` at `16px` with `600` weight, that is what ships.

---

## 1. ENVIRONMENT

```
Project:        Britestate — UK PropTech Platform
Stack:          Next.js 16 (App Router), React 19, TypeScript 5, TailwindCSS v4, Supabase
Package Mgr:    pnpm (run all commands from britv3.0/)
Local dev:      http://localhost:3000
Stitch Project: 15021896094385971092
Design System:  "The Invisible Estate" (Plus Jakarta Sans + Inter, #1B4D3E primary)
```

**MCP Tools Available:**
| Tool | Purpose |
|------|---------|
| `mcp__stitch__get_screen` | Fetch screen design from Stitch |
| `mcp__stitch__list_screens` | List all screens in project |
| `mcp__chrome-devtools__*` | Browser automation, screenshots, E2E testing |
| `mcp__supabase__*` | Database schema verification, query testing |

**DO NOT MODIFY:**
- Header, Footer, Navbar, MegaMenu, MobileNav, Breadcrumbs (keep as-is)
- `/supabase/migrations/` (schema is locked)
- `.env.local` (do not touch secrets)
- `tailwind.config.ts` base tokens (extend only)

**ALWAYS REFERENCE:**
- `CLAUDE.md` for project-specific rules
- `src/lib/supabase/` for all DB calls
- `src/types/` for TypeScript types
- `britestatestyle.txt` for design tokens

---

## 2. PARALLEL AGENT ARCHITECTURE

### Agent Types Required

Each stage uses a combination of these specialized agents dispatched in parallel:

#### Orchestrator Agent (1 per stage)
- **Role:** Coordinates the stage, tracks progress, resolves conflicts
- **Model:** Opus (needs complex reasoning)
- **Tools:** All tools
- **Responsibilities:** Fetches Stitch screens, creates design specs, dispatches implementation agents, runs final verification

#### Implementation Agents (up to 5 parallel per stage)
- **Role:** Implement individual screens pixel-perfect
- **Model:** Sonnet (cost-effective, fast)
- **Isolation:** Git worktree per agent (prevents conflicts)
- **Tools:** Read, Write, Edit, Bash, Glob, Grep
- **Pattern:** Each agent gets 1-3 screens that share components/routes

#### Visual QA Agent (1 per stage)
- **Role:** Screenshot comparison between Stitch and implementation
- **Model:** Sonnet
- **Tools:** `mcp__chrome-devtools__*`, `mcp__stitch__get_screen`
- **Responsibilities:** Take screenshots at 1440px + 390px, compare layouts, flag >4px deviations

#### Backend Verification Agent (1 per stage)
- **Role:** Verify all Supabase connections work
- **Model:** Haiku (simple verification tasks)
- **Tools:** `mcp__supabase__*`, Bash (read-only)
- **Responsibilities:** Check table/column existence, verify RLS, test queries, validate auth gates

#### Code Review Agent (1 per stage)
- **Role:** Review all changes before merge
- **Model:** Sonnet
- **Tools:** Read, Grep, Glob
- **Responsibilities:** TypeScript strict compliance, no hardcoded hex, no duplicate components, accessibility audit

### Agent Dispatch Matrix Per Stage

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (Opus)                        │
│    Fetches Stitch screens → Creates design specs             │
│    Dispatches parallel agents → Collects results             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Impl     │ │ Impl     │ │ Impl     │ │ Impl     │       │
│  │ Agent 1  │ │ Agent 2  │ │ Agent 3  │ │ Agent 4  │       │
│  │ Worktree │ │ Worktree │ │ Worktree │ │ Worktree │       │
│  │ 3 screens│ │ 3 screens│ │ 3 screens│ │ 3 screens│       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │             │             │             │             │
│       └─────────────┴──────┬──────┴─────────────┘             │
│                            ▼                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Code     │  │ Visual QA    │  │ Backend      │           │
│  │ Reviewer │  │ Agent        │  │ Verifier     │           │
│  │ (Sonnet) │  │ (Chrome MCP) │  │ (Supabase)   │           │
│  └──────────┘  └──────────────┘  └──────────────┘           │
│                            ▼                                  │
│              [STAGE N COMPLETE] or [BLOCKED]                  │
└─────────────────────────────────────────────────────────────┘
```

### Parallel Agent Spawn Rules

1. **Group screens by route proximity** — screens sharing components go to the same agent
2. **Max 5 implementation agents** per stage (token budget control)
3. **Each agent gets a git worktree** (`isolation: "worktree"`) for conflict-free parallel work
4. **Agents use Sonnet model** (`model: "sonnet"`) for cost efficiency
5. **Verification agents run AFTER all implementation agents complete** (sequential gate)
6. **If an agent is blocked**, it outputs `[BLOCKED]` and the orchestrator reassigns

### Token Optimization

- Implementation agents: `model: "sonnet"` (60% cheaper than Opus)
- Backend verification: `model: "haiku"` (cheapest, simple checks)
- Orchestrator: `model: "opus"` (complex coordination)
- Each agent summarizes findings before returning (iterative retrieval pattern)
- Use `/compact` between stages

---

## 3. PER-SCREEN EXECUTION PROTOCOL

For **every single screen**, each Implementation Agent executes:

### Step 1: FETCH — Get Stitch Design

```
ACTION: mcp__stitch__get_screen with screenName: "projects/15021896094385971092/screens/{SCREEN_ID}"
```

Extract from the response:
- [ ] Exact hex colours (map to existing Tailwind tokens or extend)
- [ ] Typography: font family, size, weight, line-height, letter-spacing
- [ ] Spacing: padding, margin, gap (to nearest 4px grid)
- [ ] Component hierarchy: every discrete UI component
- [ ] State variants (default, hover, error, loading, empty, success)
- [ ] Icons (map to Lucide equivalents)

Output a **Design Spec Block**:
```
=== DESIGN SPEC: /route/path ===
Colours: background #[X], primary CTA #[X], text #[X]
Typography: heading [font/size/weight], body [font/size/weight]
Components: [Component1, Component2, ...]
States: [default, loading, error, empty]
Supabase tables: [table1, table2]
Existing components to reuse: [grep results]
===================================
```

### Step 2: IMPLEMENT — Pixel-Perfect Code

Rules:
- Match Stitch **pixel-for-pixel** on desktop (1440px)
- Mobile must be faithful at 390px and 768px
- Use Tailwind tokens — never hardcode hex in JSX
- **Reuse existing components** — `grep -r "ComponentName" src/components/` before building
- Form validation: `react-hook-form` + `zod`, schema matching Supabase constraints
- Loading states on every async action (spinner/skeleton)
- Error states for every Supabase error code (user-facing, not raw Postgres)
- TypeScript: `strict: true`, zero `any`, zero `@ts-ignore`
- Accessibility: `aria-label` on interactive elements, focus ring, AA contrast
- No `!important` in CSS, no `console.log` in production, no TODO comments

### Step 3: WIRE — Backend Connectivity

For every Supabase call:
1. Use existing helpers from `src/lib/supabase/`
2. Use generated types from `src/types/database.ts`
3. Verify table/column existence via Supabase MCP before referencing
4. Auth gates via existing middleware pattern
5. Never bypass RLS

```typescript
const supabase = createServerClient()
const { data, error } = await supabase.from('table').select('...')
if (error) redirect('/error?code=' + error.code)
```

### Step 4: LOCAL VERIFY

```bash
pnpm build          # zero TypeScript errors, build succeeds
pnpm lint           # zero ESLint errors
```

Fix any failures before proceeding. Do not proceed with a broken build.

### Step 5: CHROME MCP E2E TEST

#### 5A. Visual Fidelity
```
1. mcp__chrome-devtools__navigate_page to screen URL
2. mcp__chrome-devtools__take_screenshot at 1440x900
3. Compare layout against Stitch screen
4. Flag any element misaligned >4px or wrong colour
5. mcp__chrome-devtools__resize_page to 390x844
6. mcp__chrome-devtools__take_screenshot for mobile
```

#### 5B. Functional Flow
```
1. Navigate to screen
2. Test form submissions (empty → validation, invalid → error, valid → success)
3. Verify redirects and auth gates
4. Check session/cookie state
```

#### 5C. Responsive
```
1. Resize to 768px → screenshot → verify no broken layouts
2. Resize to 390px → verify tap targets ≥44x44px
3. Verify no horizontal scroll at any breakpoint
```

#### 5D. Backend Connectivity
```
1. mcp__chrome-devtools__list_network_requests
2. Trigger all Supabase calls on screen
3. Verify zero 4xx/5xx responses
4. Verify response times <2000ms
```

### Step 6: SELF-HEALING LOOP

If any test fails:
1. Read failure output
2. Identify root cause
3. Fix the code
4. Re-run ONLY the failed test category
5. Max 3 iterations → then `[BLOCKED]`

### Step 7: SCREEN SIGN-OFF

```
╔══════════════════════════════════════════════════╗
║  ✅ SCREEN COMPLETE: /route/path                 ║
║  Visual Fidelity:     PASS                       ║
║  Functional Flow:     PASS                       ║
║  Responsive:          PASS                       ║
║  Backend:             PASS                       ║
║  TypeScript:          PASS                       ║
║  Build:               PASS                       ║
║  Files changed:       N                          ║
║  Next screen:         /next/route                ║
╚══════════════════════════════════════════════════╝
```

---

## 4. STAGE DEFINITIONS

### STAGE 1 — AUTH & ONBOARDING (28 screens)

**Parallel Agent Assignment:**

| Agent | Screens | Worktree Branch |
|-------|---------|-----------------|
| Impl-1 | Login, Sign Up Form, Sign Up Role Selector, Password Reset | `style/stage1-auth-core` |
| Impl-2 | Email Verify (Pending + Confirmed), 2FA Setup, 2FA Code Entry | `style/stage1-auth-2fa` |
| Impl-3 | Session Expired, Account Locked, Account Suspended, Account Deletion, Welcome | `style/stage1-auth-states` |
| Impl-4 | Buyer Onboarding (4 steps), Renter Onboarding | `style/stage1-onboard-buyer` |
| Impl-5 | Landlord Onboarding (3 steps), Agent Onboarding (3 steps), Provider Onboarding (4 steps) | `style/stage1-onboard-pro` |
| Visual QA | All 28 screens after impl complete | — |
| Code Review | Full diff review | — |

**Key Stitch IDs:** See plan file for complete mapping.

**Files:** `src/app/(auth)/` all pages, `src/components/auth/` all components

---

### STAGE 2 — PUBLIC PAGES (24 screens)

**Parallel Agent Assignment:**

| Agent | Screens | Worktree Branch |
|-------|---------|-----------------|
| Impl-1 | Homepage Hero, How It Works, About, Pricing, Contact, Careers | `style/stage2-marketing` |
| Impl-2 | Search Results + all search variants (6 screens) | `style/stage2-search` |
| Impl-3 | Property Detail, Photo Gallery, Floor Plan, Environmental Modals, Local Experts | `style/stage2-property` |
| Impl-4 | Area Guides (2), Sold Prices (2), Market Trends (2) | `style/stage2-areas` |
| Impl-5 | Property Comparison, Map & Local Area Guide | `style/stage2-tools` |
| Visual QA | All 24 screens | — |
| Backend Verify | Supabase queries for search, properties, areas | — |

**Files:** `src/app/(main)/` pages, `src/components/search/`, `src/components/properties/`, `src/components/areas/`

---

### STAGE 3 — BUYER & SELLER DASHBOARDS (15 screens)

| Agent | Screens | Worktree Branch |
|-------|---------|-----------------|
| Impl-1 | Buyer Home, Saved Properties, Saved Searches, AI Match | `style/stage3-buyer` |
| Impl-2 | Buyer Viewings, Offers, Documents, Messages | `style/stage3-buyer-detail` |
| Impl-3 | Seller Home, My Listings, Analytics | `style/stage3-seller` |
| Impl-4 | Offers (Sent, Received, Negotiation Hub), Sale Progress | `style/stage3-offers` |

---

### STAGE 4 — AGENT DASHBOARD (15 screens)

| Agent | Screens | Worktree Branch |
|-------|---------|-----------------|
| Impl-1 | Overview, Active Listings, Listings Management, Create Listing (2 steps) | `style/stage4-agent-listings` |
| Impl-2 | CRM, CRM Detail, Leads Pipeline, Lead Detail | `style/stage4-agent-crm` |
| Impl-3 | Offers Mgmt, Sale Progression, Branding, Team, Viewings, Reviews | `style/stage4-agent-ops` |

---

### STAGE 5 — LANDLORD DASHBOARD (23 screens)

| Agent | Screens | Worktree Branch |
|-------|---------|-----------------|
| Impl-1 | Home, Portfolio View, Properties List, Property Hub, Financials | `style/stage5-landlord-core` |
| Impl-2 | Compliance Matrix, Compliance Mgmt, Maintenance Inbox, Maintenance Detail | `style/stage5-landlord-compliance` |
| Impl-3 | Tenant List, Tenant Review, Tenancy Agreement, Tenancy Mgmt, Rental Apps | `style/stage5-landlord-tenants` |
| Impl-4 | Rent Collection, Rent Tracker, Deposits, Analytics, Insurance | `style/stage5-landlord-finance` |
| Impl-5 | Inventory, Yield Calculator, Tenancy History, New Listing | `style/stage5-landlord-tools` |

---

### STAGE 6 — PROVIDER DASHBOARD (14 screens)

| Agent | Screens | Worktree Branch |
|-------|---------|-----------------|
| Impl-1 | Jobs Overview, Job Detail, Job Leads, Availability | `style/stage6-provider-jobs` |
| Impl-2 | Quotes Overview, Quote Builder, Payments, Billing & Earnings | `style/stage6-provider-money` |
| Impl-3 | Profile Settings, Work Portfolio, Credentials, Verification Hub, Badges, Analytics | `style/stage6-provider-profile` |

---

### STAGE 7 — PROFESSIONAL PROFILES & DIRECTORIES (21 screens)

| Agent | Screens | Worktree Branch |
|-------|---------|-----------------|
| Impl-1 | Service Directory, Services Index, Find Tradesperson, Find & Compare Agents, Find Letting Agent | `style/stage7-directories` |
| Impl-2 | Tradesperson Profile, Enhanced Profile, Portfolio Gallery, Professional Profile | `style/stage7-provider-profiles` |
| Impl-3 | Agency Profile, Conveyancer Profile, Surveyor Profile, Broker Profile, Architect Profile | `style/stage7-pro-profiles` |
| Impl-4 | Directory pages (Architects, Agents, Brokers, Surveyors), Category Pages, Service Landings (3), Provider Comparison | `style/stage7-listings` |

---

### STAGE 8 — CALCULATORS & TOOLS (12 screens)

| Agent | Screens | Worktree Branch |
|-------|---------|-----------------|
| Impl-1 | Mortgage Calc, Affordability Calc, SDLT Calc, Buy vs Rent | `style/stage8-calc-core` |
| Impl-2 | Rental Yield, Energy Bill, Mortgage Comparison, Equity Calc | `style/stage8-calc-advanced` |
| Impl-3 | Investment Calc, LTV Calc, Moving Cost, Overpayment | `style/stage8-calc-extra` |

---

### STAGE 9 — SETTINGS, BILLING & MESSAGING (15 screens)

| Agent | Screens | Worktree Branch |
|-------|---------|-----------------|
| Impl-1 | Settings (Personal, Security, Notifications, Privacy, Preferences) | `style/stage9-settings` |
| Impl-2 | Billing Central, Subscription, Checkouts (2), Email Subscription | `style/stage9-billing` |
| Impl-3 | Inbox, Conversation Thread, Notification Centre, Booking Tracking, Transaction Progress | `style/stage9-comms` |

---

### STAGE 10 — BROKER, ADMIN & REMAINING (13+ screens)

| Agent | Screens | Worktree Branch |
|-------|---------|-----------------|
| Impl-1 | Broker (Overview, Pipeline, Products, Profile, Analytics, FCA) | `style/stage10-broker` |
| Impl-2 | Admin (Overview, Users, Moderation, System Health) | `style/stage10-admin` |
| Impl-3 | Error States (404, 403, 500, 503, Offline, Rate Limited), Legal template, Blog/Help | `style/stage10-remaining` |

---

## 5. AGENT SPAWN COMMANDS (Claude Code)

### How to dispatch each stage

```typescript
// Stage N Orchestrator Pattern:

// 1. Fetch all Stitch screens for the stage
for (const screen of stageScreens) {
  await mcp__stitch__get_screen({ screenName: `projects/15021896094385971092/screens/${screen.id}` })
}

// 2. Dispatch implementation agents in parallel (single message, multiple Agent tool calls)
Agent({ description: "Impl-1: auth core screens", isolation: "worktree", model: "sonnet", prompt: "..." })
Agent({ description: "Impl-2: auth 2FA screens", isolation: "worktree", model: "sonnet", prompt: "..." })
Agent({ description: "Impl-3: auth states", isolation: "worktree", model: "sonnet", prompt: "..." })
// ... up to 5 agents

// 3. After all complete, dispatch verification agents in parallel
Agent({ description: "Visual QA", model: "sonnet", prompt: "..." })
Agent({ description: "Backend verify", model: "haiku", prompt: "..." })
Agent({ description: "Code review", subagent_type: "superpowers:code-reviewer", prompt: "..." })
```

### Full Agent Roster (per stage)

| Agent | Type | Model | Isolation | Count |
|-------|------|-------|-----------|-------|
| Orchestrator | `general-purpose` | opus | none | 1 |
| Implementation | `general-purpose` | sonnet | worktree | 3-5 |
| Visual QA | `general-purpose` | sonnet | none | 1 |
| Backend Verifier | `general-purpose` | haiku | none | 1 |
| Code Reviewer | `superpowers:code-reviewer` | sonnet | none | 1 |

**Total agents per stage:** 7-9
**Total across all 10 stages:** 70-90 agent dispatches

---

## 6. QUALITY GATES (Every Screen)

| Gate | Requirement |
|------|-------------|
| TypeScript | `strict: true`, zero `any`, zero errors |
| Build | `pnpm build` exits 0 |
| Lint | Zero ESLint errors |
| Visual fidelity | Matches Stitch within 4px + correct colours |
| Mobile | Responsive at 390px, 768px, 1440px |
| Accessibility | Zero WCAG critical violations, AA contrast |
| Backend | All Supabase calls return 2xx, <2s |
| Loading states | Every async action has loading UI |
| Error states | Every Supabase error has user-facing message |
| Empty states | Every list/table has empty state UI |

---

## 7. BLOCKING CONDITIONS

Output `[BLOCKED: /route/path]` if:
- Stitch screen needs component requiring >30min from scratch
- Supabase table/column doesn't exist
- RLS policy prevents required access
- Third-party integration not configured
- Chrome MCP cannot reach dev server
- Self-healing failed 3 iterations

Format:
```
[BLOCKED: /path/to/screen]
Reason: [specific technical reason]
What I need: [specific ask]
Estimated unblock time: [X minutes]
```

---

## 8. FORBIDDEN PATTERNS

```
❌ Hardcode hex colours in JSX (use Tailwind tokens)
❌ Use fetch() directly to Supabase (use src/lib/ client)
❌ Disable TypeScript with @ts-ignore or any
❌ Import from nonexistent path
❌ Create duplicate components (search first)
❌ Modify Supabase schema
❌ Use !important in CSS
❌ Leave TODO or console.log in production code
❌ Skip E2E test because "it looks right"
❌ Proceed with failing build
❌ Modify Header, Footer, Navbar, MegaMenu, Breadcrumbs
```

---

## 9. STAGE COMPLETION PROTOCOL

When all screens in a stage are signed off:

```
╔══════════════════════════════════════════════════════════╗
║  🏁 STAGE N — [NAME] — COMPLETE                         ║
║  Screens implemented:    X/X                             ║
║  Agents dispatched:      Y                               ║
║  Total files changed:    Z                               ║
║  Regressions introduced: 0                               ║
║  Blocked screens:        0                               ║
║  Ready for:              STAGE N+1 — [NAME]              ║
╚══════════════════════════════════════════════════════════╝

Type CONTINUE to advance to Stage N+1.
```

---

## 10. STARTING COMMAND

```
BRITESTATE IMPLEMENTATION PROTOCOL LOADED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stage:          1 — AUTH & ONBOARDING
First screen:   /login
Total screens:  ~255
Stitch MCP:     CONNECTED
Chrome MCP:     CONNECTED
Supabase MCP:   CONNECTED
Dev server:     [CHECK STATUS]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fetching Stitch designs for Stage 1...
Dispatching 5 implementation agents in parallel...
```

---

## Reference Files

- `docs/stitch-screens-reference.md` — Original 177 screens catalog
- `docs/stitch-missing-screens.md` — 122 new screens catalog
- `britestatestyle.txt` — Design system tokens
- `.planning/codebase/DESIGN.md` — Design system documentation
- `CLAUDE.md` — Project rules and conventions

---

*Protocol version: 1.0 · Britestate · March 2026*
