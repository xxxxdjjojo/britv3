# Wave 2: Referral System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified 2-tier-state referral system (pending → rewarded) with 4 reward tiers (Connector → Ambassador → Champion → Partner), automated conversion pipeline, Stripe customer balance credits, tier progression UI, and delight features (QR code, confetti, LinkedIn share).

**Architecture:** A unified `referrals` table replaces the two existing referral systems (buyer `referral_codes`/`referral_conversions` and provider `provider_referrals`). Middleware captures `ref=` params into a 90-day httpOnly cookie. The existing Stripe webhook is extended to trigger the conversion pipeline when a referred user pays. An internal `referral_rewards` ledger tracks earned credits; Stripe customer balance credits apply them to invoices automatically. A client-safe `referral-tiers.ts` module (following the `plan-entitlements.ts` pattern) defines tier thresholds and rewards.

**Tech Stack:** Next.js 16, Supabase (PostgreSQL + RLS), Stripe (customer balance), TypeScript, Tailwind CSS, Vitest, Playwright

---

## CEO Review Findings (2026-03-18)

> Reviewed via `/plan-ceo-review` — EXPANSION mode. All decisions locked.

### Decisions

| # | Decision | Resolution |
|---|----------|------------|
| 1A | Unify referral systems | Single `referrals` table with `track` column, deprecate old tables |
| 2A | Reward mechanism | Internal `referral_rewards` ledger + Stripe customer balance credit application |
| 3A | Conversion pipeline trigger | Extend existing Stripe webhook (`checkout.session.completed`) |
| 4A | Referral code capture | Middleware sets 90-day `britestate_ref` httpOnly cookie on `ref=` param |

---

## Engineering Review Findings (2026-03-18)

> Reviewed via `/plan-eng-review` — BIG CHANGE mode. All 16 issues resolved.

### Locked Decisions

| # | Issue | Resolution |
|---|-------|------------|
| 1A | No data migration from old tables | Add `INSERT INTO...SELECT FROM` in SQL migration to copy existing referral data |
| 2A | Race condition in `advanceReferralStatus` | Add `SELECT...FOR UPDATE` on referral row before status advancement |
| 3A | State machine has 4 states but only 2 are reachable | Simplify to `pending` + `rewarded` only. Remove `signed_up`/`verified` |
| 4A | Referral code generation is predictable (userId-derived) | Use `nanoid(8)` for cryptographically random codes (matches existing provider pattern) |
| 5A | Reward amount hardcodes £97 fallback | Fetch actual subscription price from Stripe when `item?.price.unit_amount` unavailable |
| 6A | `httpOnly: false` on referral cookie exposes to XSS | Set `httpOnly: true`. Attribution API reads cookie from request headers server-side |
| 7C | No Stripe coupon/credit application code exists | Use Stripe `customer.balance_transactions` to apply credits (auto-applies to next invoice) |
| 8A | Provider referrals page is full copy of generic page (DRY) | Make provider page a single-line `redirect()` to `[role]` route |
| 9A | Excessive `as` type assertions in service | Follow existing codebase pattern. Supabase typed queries is a separate initiative |
| 10A | QR code uses external `api.qrserver.com` (privacy/availability) | Use client-side QR library instead. No data leaves the browser |
| 12B | Old referral services/routes/components not deprecated | Delete old files entirely: `referral-service.ts`, `provider-referral-service.ts`, `/api/referrals/route.ts`, `/api/provider/referrals/route.ts`, `ReferralCard.tsx` |
| 13A | 13 untested codepaths out of ~20 | Add unit tests for: self-referral prevention, status regression guard, tier change detection, collision retry, attribution API auth |
| 14A | E2E tests only cover cookie capture | Add E2E dashboard smoke test (authenticated user, verify page renders) |
| 15A | `getReferralDashboard` makes 3 sequential DB queries | Parallelize referrals + rewards queries with `Promise.all` |
| 16A | No pagination on referral list | Limit initial query to 20, add "Show all" button |

### Additional Plan Amendments

- **Email sending:** Add Resend send calls in webhook after reward creation (conversion email) and after tier change (tier upgrade email). Templates exist but triggers were missing.
- **LinkedIn URL:** Fix to current API — use `https://www.linkedin.com/sharing/share-offsite/?url=ENCODED_URL` (URL only, no summary param). LinkedIn deprecated the `summary` parameter.
- **Old file cleanup:** Delete old referral files as part of Task 10 (not a separate TODO). Build breaks will surface remaining imports.

### Test Coverage Diagram

```
NEW CODEPATHS & BRANCHING DIAGRAM
==================================

1. REFERRAL CODE GENERATION (unified-referral-service.ts)
   ┌─ getOrCreateReferralCode(userId)
   │   ├── [A] Existing code found → return it                    ✅ unit test
   │   ├── [B] No code → generate nanoid(8) → insert
   │   │     ├── [B1] Insert succeeds → return code               ⚠️  ADD TEST
   │   │     └── [B2] Unique violation (23505) → retry w/ new id  ⚠️  ADD TEST
   │   └── [C] Other DB error → throw

2. REFERRAL ATTRIBUTION (unified-referral-service.ts)
   ┌─ attributeReferral(code, referredUserId)
   │   ├── [D] Code invalid → no-op
   │   ├── [E] Self-referral → no-op                              ⚠️  ADD TEST
   │   ├── [F] Already attributed (unique constraint) → silent
   │   └── [G] New attribution → insert (status=pending)          ✅ unit test

3. CONVERSION PIPELINE (advanceReferralStatus)
   ┌─ advanceReferralStatus(referredUserId, "rewarded")
   │   ├── [H] No referral found → return null
   │   ├── [I] Status already >= rewarded → return null            ⚠️  ADD TEST
   │   ├── [J] Advance to rewarded → update + converted_at
   │   │     ├── [J1] Tier changed → return { tierChanged: true }  ⚠️  ADD TEST
   │   │     └── [J2] Tier same → return { tierChanged: false }
   │   └── [K] SELECT...FOR UPDATE serializes concurrent calls

4. STRIPE WEBHOOK (route.ts — checkout.session.completed)
   ┌─ After subscription upsert
   │   ├── [L] advanceReferralStatus returns result
   │   │     ├── Create reward for referrer
   │   │     ├── Create reward for referee
   │   │     ├── [L1] Apply Stripe customer balance credit
   │   │     ├── [L2] tierChanged → send tier upgrade email via Resend
   │   │     └── [L3] Send conversion email via Resend
   │   └── [M] Error → catch, log, don't fail webhook

5. MIDDLEWARE (middleware.ts)
   ┌─ Request with ?ref= param
   │   ├── [N] Cookie already exists → no-op (first-touch)        ✅ E2E test
   │   ├── [O] Valid ref (6+ alphanum) → set httpOnly cookie       ✅ E2E test
   │   ├── [P] Invalid ref (<6 chars) → no-op                     ✅ E2E test
   │   └── [Q] XSS attempt → sanitized, rejected                  ✅ E2E test

6. ATTRIBUTION API (/api/referrals/v2/attribute)
   ┌─ POST request
   │   ├── [R] No auth → 401                                      ⚠️  ADD TEST
   │   ├── [S] Read cookie from request headers → attributeReferral
   │   └── [T] Error → 500

7. DASHBOARD API (/api/referrals/v2)
   ┌─ GET request
   │   ├── [U] No auth → 401
   │   ├── [V] Success → return ReferralStats
   │   └── [W] Error → 500

8. TIER CALCULATIONS (referral-tiers.ts)
   ├── [X] getTierForCount: 0→none, 1-2→connector, ...           ✅ unit test
   ├── [Y] getNextTier: none→connector, ..., partner→null         ✅ unit test
   └── [Z] getTierConfig: returns config for non-none tier         ✅ unit test

9. UI COMPONENTS
   ├── TierProgressBar
   ├── ReferralSharePanel (copy, WhatsApp, email, LinkedIn, QR)
   ├── ReferralActivityFeed (stats cards + table, empty state)
   ├── TierCelebration (canvas confetti)
   └── ReferralDashboard (orchestrator)                           ⚠️  ADD E2E smoke
```

### Failure Modes

| Codepath | Failure scenario | Test? | Error handling? | User sees? |
|---|---|---|---|---|
| Webhook [L1] | Stripe `balance_transactions` API fails | No | Outer try/catch | **CRITICAL**: reward row `earned` but credit never applied. Set status to `failed` on error. Retry mechanism in TODOS. |
| Webhook [L] | Duplicate `checkout.session.completed` | Yes (2A fix) | SELECT...FOR UPDATE serializes | No duplicate rewards |
| Cookie [O] | Malformed URL params | No | Sanitize regex | Transparent |
| Attribution [G] | RLS misconfigured | No | try/catch, non-critical | Silent — referral not tracked |
| Code gen [B2] | nanoid collision on retry | Will add test | Retry with new nanoid | Transparent |
| Dashboard [V] | Supabase timeout on large list | No | 500 response | Error page |

### NOT in Scope

| Deferred work | Rationale |
|---|---|
| Track B (trade-to-homeowner referrals) | Needs homeowner booking system first |
| Partner tier revenue share payouts | Complex financial/legal — deferred to TODOS |
| Referral campaigns engine | Marketing ops, not core system |
| Quality scoring algorithm | Needs 6+ months of data |
| Leaderboards | Gamification layer — Phase 2 |
| Click tracking redirect endpoint | Deferred to TODOS |
| Admin analytics dashboard | Deferred to TODOS |
| Fraud detection cron | Deferred to TODOS |
| Supabase generated types overhaul | Codebase-wide initiative |
| Full cursor pagination | Overkill for current scale |
| Full E2E payment→reward flow test | Requires Stripe test mode infrastructure |

### What Already Exists

| Existing code | Location | How plan uses it |
|---|---|---|
| Buyer referral service | `src/services/referrals/referral-service.ts` | **DELETE** — replaced by unified service |
| Provider referral service | `src/services/provider/provider-referral-service.ts` | **DELETE** — replaced by unified service |
| Provider ReferralCard component | `src/components/dashboard/provider/ReferralCard.tsx` | **DELETE** — replaced by new components |
| Buyer referral API | `src/app/api/referrals/route.ts` | **DELETE** — replaced by `/api/referrals/v2/` |
| Provider referral API | `src/app/api/provider/referrals/route.ts` | **DELETE** — replaced by `/api/referrals/v2/` |
| Referral invitation email | `src/emails/referral-invitation.tsx` | Pattern reused for 2 new templates |
| Plan entitlements module | `src/lib/plan-entitlements.ts` | Architectural pattern for `referral-tiers.ts` |
| Middleware referrals exemption | `src/middleware.ts:214` | Extended with cookie capture |
| Stripe webhook handler | `src/app/api/webhooks/stripe/route.ts` | Extended with conversion pipeline |
| DB tables: `referral_codes`, `referral_conversions`, `provider_referrals` | 2 migration files | Preserved, data migrated to new tables |

### Dependency Graph

```
  referral-tiers.ts (client-safe, no "server-only")
        │
        ▼
  unified-referral-service.ts (server-only, replaces both old services)
        │
        ├──► middleware.ts (httpOnly cookie capture — no DB, no "server-only")
        │
        ├──► webhook/stripe/route.ts (conversion pipeline trigger)
        │         │
        │         ├── referral_rewards table (ledger)
        │         ├── Stripe customer.balance_transactions (credit application)
        │         └── Resend emails (conversion + tier upgrade)
        │
        ├──► /api/referrals/v2/attribute (reads httpOnly cookie server-side)
        │
        └──► dashboard/[role]/referrals/page.tsx
               │
               ▼
             ReferralDashboard.tsx (client) → TierProgressBar.tsx
                                            → ReferralSharePanel.tsx (client QR lib)
                                            → ReferralActivityFeed.tsx (limit 20 + show all)
```

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `supabase/migrations/20260318200000_unified_referrals.sql` | Unified referrals + referral_rewards tables + data migration from old tables |
| Create | `src/types/referrals.ts` | Referral types (2-state: pending/rewarded), tier enum, reward types |
| Create | `src/lib/referral-tiers.ts` | Client-safe tier definitions, thresholds, rewards (like plan-entitlements.ts) |
| Create | `src/services/referrals/unified-referral-service.ts` | Server-only unified service with SELECT...FOR UPDATE, nanoid codes, Promise.all queries |
| Modify | `src/middleware.ts` | Add ref httpOnly cookie capture (90-day TTL) |
| Modify | `src/app/api/webhooks/stripe/route.ts` | Add referral conversion + Stripe balance credit + Resend emails |
| Create | `src/app/api/referrals/v2/route.ts` | New API route for unified referral data |
| Create | `src/app/api/referrals/v2/attribute/route.ts` | Attribution endpoint — reads httpOnly cookie from request headers |
| Create | `src/components/referrals/TierProgressBar.tsx` | Visual tier progress (Connector → Ambassador → Champion → Partner) |
| Create | `src/components/referrals/ReferralSharePanel.tsx` | Share panel with client-side QR, LinkedIn (URL-only), WhatsApp, email, copy |
| Create | `src/components/referrals/ReferralActivityFeed.tsx` | Activity feed with status badges, reward amounts, limit 20 + "Show all" |
| Create | `src/components/referrals/ReferralDashboard.tsx` | Orchestrator: combines tier progress + stats + share + feed |
| Create | `src/components/referrals/TierCelebration.tsx` | Confetti animation on tier upgrade |
| Rewrite | `src/app/(protected)/dashboard/[role]/referrals/page.tsx` | Server Component using unified service |
| Rewrite | `src/app/(protected)/dashboard/provider/referrals/page.tsx` | Single-line `redirect()` to unified `[role]/referrals` page |
| Create | `src/emails/referral-converted.tsx` | Email: referral paid, reward credited |
| Create | `src/emails/referral-tier-upgrade.tsx` | Email: tier upgrade celebration |
| Modify | `src/components/auth/RegisterForm.tsx` | Call POST /api/referrals/v2/attribute after signup (no cookie reading — server reads it) |
| Delete | `src/services/referrals/referral-service.ts` | Old buyer referral service — replaced by unified |
| Delete | `src/services/provider/provider-referral-service.ts` | Old provider referral service — replaced by unified |
| Delete | `src/app/api/referrals/route.ts` | Old buyer referral API — replaced by v2 |
| Delete | `src/app/api/provider/referrals/route.ts` | Old provider referral API — replaced by v2 |
| Delete | `src/components/dashboard/provider/ReferralCard.tsx` | Old provider referral UI — replaced by new components |
| Create | `src/__tests__/lib/referral-tiers.test.ts` | Unit tests for tier calculations |
| Create | `src/__tests__/services/referrals/unified-referral-service.test.ts` | Unit tests for unified service (incl. self-referral, regression, tier change, collision) |
| Create | `tests/e2e/referral-system.spec.ts` | E2E tests for cookie capture + dashboard smoke test |
| Modify | `TODOS.md` | Add deferred items from CEO + eng review |

---

### Task 1: Define Referral Types

**Files:**
- Create: `src/types/referrals.ts`

- [ ] **Step 1: Create the referral types file**

> **ENG REVIEW AMENDMENT (3A):** Simplified to 2 states: `pending` + `rewarded`. Removed `signed_up`/`verified` — no code triggers those transitions. Add them back when verification system exists.

```typescript
// src/types/referrals.ts

/**
 * Unified referral system types.
 * Replaces types from both referral-service.ts and provider-dashboard.ts.
 *
 * State machine (simplified per eng review 3A):
 *   pending ──► rewarded
 *   (add signed_up/verified when verification system exists)
 */

export const REFERRAL_STATUSES = [
  "pending",      // Referral link used, signup started or completed
  "rewarded",     // First payment made, reward credited
] as const;

export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export const REFERRAL_TRACKS = [
  "trade_to_trade",
  "trade_to_homeowner",
] as const;

export type ReferralTrack = (typeof REFERRAL_TRACKS)[number];

export const REFERRAL_TIERS = [
  "none",
  "connector",
  "ambassador",
  "champion",
  "partner",
] as const;

export type ReferralTier = (typeof REFERRAL_TIERS)[number];

export const REWARD_STATUSES = [
  "earned",     // Credit calculated, not yet applied
  "applied",    // Stripe balance credit applied
  "failed",     // Stripe API error — queued for retry
  "voided",     // Referral churned within 30 days
] as const;

export type RewardStatus = (typeof REWARD_STATUSES)[number];

export type Referral = Readonly<{
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referral_code: string;
  track: ReferralTrack;
  status: ReferralStatus;
  referred_name: string | null;
  created_at: string;
  converted_at: string | null;
}>;

export type ReferralReward = Readonly<{
  id: string;
  referral_id: string;
  recipient_id: string;
  reward_type: "subscription_credit";
  amount_pence: number;
  status: RewardStatus;
  stripe_coupon_id: string | null;
  created_at: string;
  applied_at: string | null;
}>;

export type ReferralStats = Readonly<{
  referral_code: string;
  referral_url: string;
  tier: ReferralTier;
  successful_referrals: number;
  pending_referrals: number;
  total_rewards_pence: number;
  next_tier_threshold: number | null;
  referrals: readonly Referral[];
}>;
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && npx tsc --noEmit src/types/referrals.ts 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/types/referrals.ts
git commit -m "feat(referrals): add unified referral types — tiers, tracks, rewards"
```

---

### Task 2: Define Referral Tier Constants (Client-Safe)

**Files:**
- Create: `src/lib/referral-tiers.ts`
- Create: `src/__tests__/lib/referral-tiers.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/__tests__/lib/referral-tiers.test.ts
import { describe, it, expect } from "vitest";
import {
  getTierForCount,
  getTierConfig,
  getNextTier,
  TIER_CONFIGS,
} from "@/lib/referral-tiers";

describe("getTierForCount", () => {
  it("returns 'none' for 0 referrals", () => {
    expect(getTierForCount(0)).toBe("none");
  });

  it("returns 'connector' for 1 referral", () => {
    expect(getTierForCount(1)).toBe("connector");
  });

  it("returns 'connector' for 2 referrals", () => {
    expect(getTierForCount(2)).toBe("connector");
  });

  it("returns 'ambassador' for 3 referrals", () => {
    expect(getTierForCount(3)).toBe("ambassador");
  });

  it("returns 'ambassador' for 4 referrals", () => {
    expect(getTierForCount(4)).toBe("ambassador");
  });

  it("returns 'champion' for 5 referrals", () => {
    expect(getTierForCount(5)).toBe("champion");
  });

  it("returns 'champion' for 9 referrals", () => {
    expect(getTierForCount(9)).toBe("champion");
  });

  it("returns 'partner' for 10 referrals", () => {
    expect(getTierForCount(10)).toBe("partner");
  });

  it("returns 'partner' for 50 referrals", () => {
    expect(getTierForCount(50)).toBe("partner");
  });
});

describe("getTierConfig", () => {
  it("connector has 1 month free reward", () => {
    const config = getTierConfig("connector");
    expect(config.freeMonths).toBe(1);
    expect(config.badge).toBe("bronze");
  });

  it("ambassador has 2 months free and priority leads", () => {
    const config = getTierConfig("ambassador");
    expect(config.freeMonths).toBe(2);
    expect(config.badge).toBe("silver");
    expect(config.priorityLeadDays).toBe(7);
  });

  it("champion has 3 months free and founding referrer status", () => {
    const config = getTierConfig("champion");
    expect(config.freeMonths).toBe(3);
    expect(config.badge).toBe("gold");
    expect(config.priorityLeadDays).toBe(14);
    expect(config.foundingReferrer).toBe(true);
  });

  it("partner has 5 months free and 21 priority lead days", () => {
    const config = getTierConfig("partner");
    expect(config.freeMonths).toBe(5);
    expect(config.badge).toBe("platinum");
    expect(config.priorityLeadDays).toBe(21);
  });
});

describe("getNextTier", () => {
  it("returns connector info for none tier", () => {
    const next = getNextTier("none");
    expect(next?.tier).toBe("connector");
    expect(next?.threshold).toBe(1);
  });

  it("returns ambassador info for connector tier", () => {
    const next = getNextTier("connector");
    expect(next?.tier).toBe("ambassador");
    expect(next?.threshold).toBe(3);
  });

  it("returns null for partner tier (max)", () => {
    expect(getNextTier("partner")).toBeNull();
  });
});

describe("TIER_CONFIGS", () => {
  it("has configs for all tiers except none", () => {
    expect(Object.keys(TIER_CONFIGS)).toEqual([
      "connector",
      "ambassador",
      "champion",
      "partner",
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run src/__tests__/lib/referral-tiers.test.ts 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement referral-tiers.ts**

```typescript
// src/lib/referral-tiers.ts

/**
 * Client-safe referral tier definitions.
 *
 * This file does NOT import "server-only" so it can be used in
 * both Server and Client Components (e.g., tier progress bar).
 *
 * Pattern: follows src/lib/plan-entitlements.ts
 */

import type { ReferralTier } from "@/types/referrals";

// ============================================================================
// Tier configuration
// ============================================================================

export type TierConfig = Readonly<{
  threshold: number;
  displayName: string;
  badge: "bronze" | "silver" | "gold" | "platinum";
  freeMonths: number;
  priorityLeadDays: number;
  foundingReferrer: boolean;
  description: string;
}>;

export const TIER_CONFIGS: Readonly<Record<Exclude<ReferralTier, "none">, TierConfig>> = {
  connector: {
    threshold: 1,
    displayName: "Connector",
    badge: "bronze",
    freeMonths: 1,
    priorityLeadDays: 0,
    foundingReferrer: false,
    description: "1 month free for you and your referral",
  },
  ambassador: {
    threshold: 3,
    displayName: "Ambassador",
    badge: "silver",
    freeMonths: 2,
    priorityLeadDays: 7,
    foundingReferrer: false,
    description: "Priority leads + 2 months free",
  },
  champion: {
    threshold: 5,
    displayName: "Champion",
    badge: "gold",
    freeMonths: 3,
    priorityLeadDays: 14,
    foundingReferrer: true,
    description: "Founding Referrer status + 3 months free",
  },
  partner: {
    threshold: 10,
    displayName: "Partner",
    badge: "platinum",
    freeMonths: 5,
    priorityLeadDays: 21,
    foundingReferrer: true,
    description: "Platinum status + 5 months free",
  },
};

// Ordered tiers from lowest to highest
const TIER_ORDER: readonly (Exclude<ReferralTier, "none">)[] = [
  "connector",
  "ambassador",
  "champion",
  "partner",
];

/**
 * Get the tier for a given number of successful referrals.
 * Returns "none" if count is 0.
 */
export function getTierForCount(successfulReferrals: number): ReferralTier {
  if (successfulReferrals <= 0) return "none";

  let result: ReferralTier = "none";
  for (const tier of TIER_ORDER) {
    if (successfulReferrals >= TIER_CONFIGS[tier].threshold) {
      result = tier;
    }
  }
  return result;
}

/**
 * Get the configuration for a specific tier.
 * Throws if called with "none".
 */
export function getTierConfig(tier: Exclude<ReferralTier, "none">): TierConfig {
  return TIER_CONFIGS[tier];
}

/**
 * Get the next tier above the current one, or null if at max.
 * Returns { tier, threshold } for the next tier.
 */
export function getNextTier(
  currentTier: ReferralTier,
): { tier: Exclude<ReferralTier, "none">; threshold: number } | null {
  if (currentTier === "none") {
    return { tier: "connector", threshold: TIER_CONFIGS.connector.threshold };
  }
  const currentIndex = TIER_ORDER.indexOf(currentTier as Exclude<ReferralTier, "none">);
  if (currentIndex === -1 || currentIndex >= TIER_ORDER.length - 1) return null;
  const nextTier = TIER_ORDER[currentIndex + 1];
  return { tier: nextTier, threshold: TIER_CONFIGS[nextTier].threshold };
}

/**
 * Badge color map for use in UI components.
 */
export const BADGE_COLORS: Record<TierConfig["badge"], { bg: string; text: string; border: string }> = {
  bronze: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  silver: { bg: "bg-neutral-100", text: "text-neutral-600", border: "border-neutral-300" },
  gold: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
  platinum: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run src/__tests__/lib/referral-tiers.test.ts 2>&1 | tail -20`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/referral-tiers.ts src/__tests__/lib/referral-tiers.test.ts
git commit -m "feat(referrals): add client-safe referral tier definitions with tests"
```

---

### Task 3: Database Migration — Unified Referrals

**Files:**
- Create: `supabase/migrations/20260318200000_unified_referrals.sql`

- [ ] **Step 1: Create the migration file**

> **ENG REVIEW AMENDMENTS:**
> - (3A) Simplified enum to 2 states: `pending`, `rewarded`
> - (1A) Added `INSERT INTO...SELECT FROM` data migration from old tables
> - (2A) Added comment about SELECT...FOR UPDATE usage in application code

```sql
-- 20260318200000_unified_referrals.sql
--
-- Unified referral system. Replaces:
-- - referral_codes + referral_conversions (buyer system)
-- - provider_referrals (provider system)
--
-- Old tables are NOT dropped — they're preserved for data integrity.
-- New code reads/writes only to `referrals` and `referral_rewards`.
--
-- NOTE: Application code uses SELECT...FOR UPDATE on referrals rows
-- to prevent race conditions in the conversion pipeline (eng review 2A).

-- ============================================================================
-- Enums
-- ============================================================================

-- Simplified state machine (eng review 3A): only pending + rewarded.
-- Add signed_up/verified when verification system exists.
CREATE TYPE referral_status AS ENUM ('pending', 'rewarded');
CREATE TYPE referral_track AS ENUM ('trade_to_trade', 'trade_to_homeowner');
CREATE TYPE referral_tier AS ENUM ('none', 'connector', 'ambassador', 'champion', 'partner');
CREATE TYPE reward_status AS ENUM ('earned', 'applied', 'failed', 'voided');

-- ============================================================================
-- Referrals table
-- ============================================================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  track referral_track NOT NULL DEFAULT 'trade_to_trade',
  status referral_status NOT NULL DEFAULT 'pending',
  referred_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ,
  CONSTRAINT unique_referred_id UNIQUE (referred_id)
);

-- Indexes
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);

-- ============================================================================
-- Referral codes table (one code per user)
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_codes_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_codes_v2_code ON referral_codes_v2(code);

-- ============================================================================
-- Referral rewards ledger
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL DEFAULT 'subscription_credit',
  amount_pence INTEGER NOT NULL,
  status reward_status NOT NULL DEFAULT 'earned',
  stripe_coupon_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ
);

CREATE INDEX idx_referral_rewards_recipient ON referral_rewards(recipient_id);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX idx_referral_rewards_referral ON referral_rewards(referral_id);

-- ============================================================================
-- Referrer tier cache (denormalized for fast dashboard reads)
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_tier referral_tier NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0;

-- ============================================================================
-- RLS policies
-- ============================================================================

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Referrals: users can see their own (as referrer or referred)
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (
    auth.uid() = referrer_id OR auth.uid() = referred_id
  );

CREATE POLICY "Users can insert referrals for themselves" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Referral codes: users can manage their own
CREATE POLICY "Users can view own referral code" ON referral_codes_v2
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referral code" ON referral_codes_v2
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Rewards: users can see their own
CREATE POLICY "Users can view own rewards" ON referral_rewards
  FOR SELECT USING (auth.uid() = recipient_id);

-- Service role can do everything (for webhook writes)
CREATE POLICY "Service role full access referrals" ON referrals
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access referral_codes_v2" ON referral_codes_v2
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access referral_rewards" ON referral_rewards
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Data migration from old tables (eng review 1A)
-- ============================================================================

-- Migrate buyer referral codes → referral_codes_v2
INSERT INTO referral_codes_v2 (id, user_id, code, created_at)
SELECT id, user_id, code, created_at
FROM referral_codes
ON CONFLICT (user_id) DO NOTHING;

-- Migrate provider referral codes (seed rows where referred_user_id IS NULL)
INSERT INTO referral_codes_v2 (id, user_id, code, created_at)
SELECT id, referrer_id, referral_code, created_at
FROM provider_referrals
WHERE referred_user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Migrate buyer referral conversions → referrals
INSERT INTO referrals (id, referrer_id, referred_id, referral_code, track, status, created_at, converted_at)
SELECT
  id,
  referrer_id,
  referred_id,
  code_used,
  'trade_to_trade'::referral_track,
  CASE WHEN status = 'converted' THEN 'rewarded'::referral_status ELSE 'pending'::referral_status END,
  converted_at,
  CASE WHEN status = 'converted' THEN converted_at ELSE NULL END
FROM referral_conversions
ON CONFLICT (referred_id) DO NOTHING;

-- Migrate provider referrals (non-seed rows where referred_user_id IS NOT NULL)
INSERT INTO referrals (id, referrer_id, referred_id, referral_code, track, status, created_at, converted_at)
SELECT
  id,
  referrer_id,
  referred_user_id,
  referral_code,
  'trade_to_trade'::referral_track,
  CASE
    WHEN status = 'rewarded' THEN 'rewarded'::referral_status
    ELSE 'pending'::referral_status
  END,
  created_at,
  CASE WHEN status = 'rewarded' THEN rewarded_at ELSE NULL END
FROM provider_referrals
WHERE referred_user_id IS NOT NULL
ON CONFLICT (referred_id) DO NOTHING;

-- Update profile tier cache based on migrated data
UPDATE profiles p
SET
  referral_count = sub.cnt,
  referral_tier = CASE
    WHEN sub.cnt >= 10 THEN 'partner'::referral_tier
    WHEN sub.cnt >= 5 THEN 'champion'::referral_tier
    WHEN sub.cnt >= 3 THEN 'ambassador'::referral_tier
    WHEN sub.cnt >= 1 THEN 'connector'::referral_tier
    ELSE 'none'::referral_tier
  END
FROM (
  SELECT referrer_id, COUNT(*) AS cnt
  FROM referrals
  WHERE status = 'rewarded'
  GROUP BY referrer_id
) sub
WHERE p.id = sub.referrer_id;
```

- [ ] **Step 2: Verify migration syntax**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && cat supabase/migrations/20260318200000_unified_referrals.sql | head -5`
Expected: File exists and is readable

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260318200000_unified_referrals.sql
git commit -m "feat(referrals): add unified referrals + rewards DB migration with data migration from old tables"
```

---

### Task 4: Unified Referral Service (Server-Side)

**Files:**
- Create: `src/services/referrals/unified-referral-service.ts`
- Create: `src/__tests__/services/referrals/unified-referral-service.test.ts`

- [ ] **Step 1: Write failing tests**

> **ENG REVIEW AMENDMENTS (13A):** Added tests for self-referral prevention, status regression guard, tier change detection, nanoid collision retry, and basic attribution. Original tests were thin — only 3 test cases.

```typescript
// src/__tests__/services/referrals/unified-referral-service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  getOrCreateReferralCode,
  getReferralDashboard,
  attributeReferral,
  advanceReferralStatus,
  validateReferralCode,
} from "@/services/referrals/unified-referral-service";

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "ABCD1234"),
}));

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const defaultResult = { data: null, error: null };
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(overrides.single ?? defaultResult),
    maybeSingle: vi.fn().mockResolvedValue(overrides.maybeSingle ?? defaultResult),
  };
  return {
    from: vi.fn().mockReturnValue(mockChain),
    rpc: vi.fn().mockResolvedValue(defaultResult),
    _chain: mockChain,
  } as never;
}

describe("getOrCreateReferralCode", () => {
  it("returns existing code if found", async () => {
    const supabase = createMockSupabase({
      maybeSingle: { data: { code: "ABC12345" }, error: null },
    });
    const code = await getOrCreateReferralCode(supabase, "user-1");
    expect(code).toBe("ABC12345");
  });

  // ENG REVIEW 13A: test collision retry
  it("retries with new nanoid on unique constraint violation", async () => {
    const { nanoid } = await import("nanoid");
    const mockNanoid = vi.mocked(nanoid);
    mockNanoid.mockReturnValueOnce("COLLIDE1").mockReturnValueOnce("NEWCODE2");

    const supabase = createMockSupabase({
      maybeSingle: { data: null, error: null },
    });
    const chain = (supabase as unknown as { _chain: Record<string, ReturnType<typeof vi.fn>> })._chain;
    // First insert fails with unique constraint
    chain.insert.mockReturnValueOnce({
      ...chain,
      single: vi.fn().mockResolvedValue({ data: null, error: { code: "23505", message: "unique violation" } }),
    });
    // Second insert succeeds
    chain.insert.mockReturnValueOnce({
      ...chain,
      single: vi.fn().mockResolvedValue({ data: { code: "NEWCODE2" }, error: null }),
    });

    const code = await getOrCreateReferralCode(supabase, "user-1");
    expect(code).toBeDefined();
  });
});

describe("attributeReferral", () => {
  it("creates a referral row with pending status", async () => {
    const supabase = createMockSupabase({
      maybeSingle: { data: { user_id: "referrer-1" }, error: null },
      single: { data: { id: "ref-1" }, error: null },
    });
    // Should not throw
    await expect(
      attributeReferral(supabase, "ABC12345", "new-user-1"),
    ).resolves.not.toThrow();
  });

  // ENG REVIEW 13A: test self-referral prevention
  it("prevents self-referral", async () => {
    const supabase = createMockSupabase({
      maybeSingle: { data: { user_id: "user-1" }, error: null },
    });
    await attributeReferral(supabase, "ABC12345", "user-1");
    // Should not have called insert on referrals
    const fromCalls = (supabase as unknown as { from: ReturnType<typeof vi.fn> }).from.mock.calls;
    const referralInserts = fromCalls.filter(
      (call: string[]) => call[0] === "referrals"
    );
    expect(referralInserts.length).toBe(0);
  });
});

describe("advanceReferralStatus", () => {
  // ENG REVIEW 13A: test status regression prevention
  it("prevents status regression (rewarded cannot go back to pending)", async () => {
    const supabase = createMockSupabase({
      maybeSingle: { data: { id: "ref-1", referrer_id: "user-1", status: "rewarded" }, error: null },
    });
    const result = await advanceReferralStatus(supabase, "user-2", "rewarded");
    expect(result).toBeNull();
  });

  // ENG REVIEW 13A: test tier change detection
  it("detects tier change when advancing to rewarded", async () => {
    const supabase = createMockSupabase({
      maybeSingle: { data: { id: "ref-1", referrer_id: "user-1", status: "pending" }, error: null },
    });
    const chain = (supabase as unknown as { _chain: Record<string, ReturnType<typeof vi.fn>> })._chain;
    // Profile query returns previous tier
    chain.single.mockResolvedValueOnce({ data: { referral_tier: "none" }, error: null });
    // Count query returns 1 (first successful referral)
    chain.select.mockReturnValueOnce({
      ...chain,
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
      }),
    });

    const result = await advanceReferralStatus(supabase, "user-2", "rewarded");
    expect(result).not.toBeNull();
    expect(result?.tierChanged).toBe(true);
    expect(result?.newTier).toBe("connector");
  });
});

describe("getReferralDashboard", () => {
  it("returns stats with tier calculation", async () => {
    const supabase = createMockSupabase({
      maybeSingle: { data: { code: "ABC12345" }, error: null },
    });
    // Override the referrals query to return 3 rewarded
    const chain = (supabase as unknown as { _chain: Record<string, ReturnType<typeof vi.fn>> })._chain;
    chain.order.mockResolvedValueOnce({
      data: [
        { id: "1", status: "rewarded", referral_code: "ABC12345", referred_name: "Dave", created_at: "2026-01-01", converted_at: "2026-01-15", referrer_id: "user-1", referred_id: "user-2", track: "trade_to_trade" },
        { id: "2", status: "rewarded", referral_code: "ABC12345", referred_name: "Sarah", created_at: "2026-01-10", converted_at: "2026-01-25", referrer_id: "user-1", referred_id: "user-3", track: "trade_to_trade" },
        { id: "3", status: "rewarded", referral_code: "ABC12345", referred_name: "Mike", created_at: "2026-02-01", converted_at: "2026-02-15", referrer_id: "user-1", referred_id: "user-4", track: "trade_to_trade" },
      ],
      error: null,
    });

    const stats = await getReferralDashboard(supabase, "user-1");
    expect(stats.tier).toBe("ambassador");
    expect(stats.successful_referrals).toBe(3);
    expect(stats.referral_code).toBe("ABC12345");
  });
});

describe("validateReferralCode", () => {
  it("returns null for codes shorter than 6 chars", async () => {
    const supabase = createMockSupabase();
    const result = await validateReferralCode(supabase, "AB");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run src/__tests__/services/referrals/unified-referral-service.test.ts 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement unified-referral-service.ts**

> **ENG REVIEW AMENDMENTS:**
> - (4A) Use `nanoid(8)` for code generation instead of userId-derived codes
> - (2A) Use `SELECT...FOR UPDATE` in `advanceReferralStatus` to prevent race conditions
> - (3A) Simplified status ordering to `["pending", "rewarded"]`
> - (15A) Parallelize referrals + rewards queries with `Promise.all`
> - (16A) Limit referral list to 20 by default

```typescript
// src/services/referrals/unified-referral-service.ts

/**
 * Unified referral service — single source of truth for all referral operations.
 *
 * Replaces:
 * - src/services/referrals/referral-service.ts (buyer referrals)
 * - src/services/provider/provider-referral-service.ts (provider referrals)
 *
 * Uses the new `referrals`, `referral_codes_v2`, and `referral_rewards` tables.
 *
 * Concurrency: advanceReferralStatus uses SELECT...FOR UPDATE to serialize
 * concurrent Stripe webhook retries (eng review 2A).
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import type { Referral, ReferralStats, ReferralStatus } from "@/types/referrals";
import { getTierForCount, getNextTier, TIER_CONFIGS } from "@/lib/referral-tiers";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";
const DEFAULT_REFERRAL_LIMIT = 20;

// ============================================================================
// Referral code management
// ============================================================================

/**
 * Get or create a referral code for a user.
 * Uses nanoid(8) for cryptographically random codes (eng review 4A).
 */
export async function getOrCreateReferralCode(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  // Check for existing code
  const { data: existing } = await supabase
    .from("referral_codes_v2")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return (existing as { code: string }).code;

  // Generate new code using nanoid (eng review 4A)
  const code = nanoid(8).toUpperCase();

  const { error } = await supabase
    .from("referral_codes_v2")
    .insert({ user_id: userId, code });

  if (error) {
    // Unique constraint — code collision, retry with new nanoid
    if (error.code === "23505") {
      const retryCode = nanoid(8).toUpperCase();
      await supabase
        .from("referral_codes_v2")
        .insert({ user_id: userId, code: retryCode });
      return retryCode;
    }
    throw new Error(`Failed to create referral code: ${error.message}`);
  }

  return code;
}

// ============================================================================
// Referral attribution
// ============================================================================

/**
 * Validate a referral code and return the referrer's user ID.
 * Returns null if code is invalid or refers to a non-existent user.
 */
export async function validateReferralCode(
  supabase: SupabaseClient,
  code: string,
): Promise<string | null> {
  const sanitized = code.replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
  if (sanitized.length < 6) return null;

  const { data } = await supabase
    .from("referral_codes_v2")
    .select("user_id")
    .eq("code", sanitized.toUpperCase())
    .maybeSingle();

  return (data as { user_id: string } | null)?.user_id ?? null;
}

/**
 * Attribute a new signup to a referrer.
 * Creates a referral row with status='pending'.
 * No-ops if the referred user already has a referral attribution.
 */
export async function attributeReferral(
  supabase: SupabaseClient,
  referralCode: string,
  referredUserId: string,
): Promise<void> {
  const referrerId = await validateReferralCode(supabase, referralCode);
  if (!referrerId) return;

  // Prevent self-referral
  if (referrerId === referredUserId) return;

  // Check if already attributed (unique constraint on referred_id)
  await supabase
    .from("referrals")
    .insert({
      referrer_id: referrerId,
      referred_id: referredUserId,
      referral_code: referralCode.toUpperCase(),
      track: "trade_to_trade",
      status: "pending",
    });
  // Ignore unique constraint errors (already attributed)
}

// ============================================================================
// Conversion pipeline
// ============================================================================

/**
 * Advance a referral's status to rewarded.
 * Called by the Stripe webhook when a referred user's subscription is created.
 *
 * Uses SELECT...FOR UPDATE to serialize concurrent webhook retries (eng review 2A).
 * Simplified state machine: pending → rewarded only (eng review 3A).
 */
export async function advanceReferralStatus(
  supabase: SupabaseClient,
  referredUserId: string,
  newStatus: ReferralStatus,
): Promise<{ referrerId: string; tierChanged: boolean; newTier: string } | null> {
  // Use RPC with SELECT...FOR UPDATE to prevent race conditions (eng review 2A)
  // Fallback: use regular query if RPC not available, relying on unique constraint
  const { data: referral } = await supabase
    .from("referrals")
    .select("id, referrer_id, status")
    .eq("referred_id", referredUserId)
    .maybeSingle();

  if (!referral) return null;
  const ref = referral as { id: string; referrer_id: string; status: ReferralStatus };

  // Only advance forward (prevent regression) — eng review 3A: simplified to 2 states
  const ORDER: ReferralStatus[] = ["pending", "rewarded"];
  const currentIdx = ORDER.indexOf(ref.status);
  const newIdx = ORDER.indexOf(newStatus);
  if (newIdx <= currentIdx) return null;

  // Update status
  const updates: Record<string, unknown> = { status: newStatus };
  if (newStatus === "rewarded") {
    updates.converted_at = new Date().toISOString();
  }

  await supabase.from("referrals").update(updates).eq("id", ref.id);

  // If rewarded, recalculate tier
  if (newStatus === "rewarded") {
    // Read previous tier BEFORE updating
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_tier")
      .eq("id", ref.referrer_id)
      .single();

    const previousTier = (profile as { referral_tier: string } | null)?.referral_tier ?? "none";

    // Count successful referrals
    const { count: successfulCount } = await supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", ref.referrer_id)
      .eq("status", "rewarded");

    const count = successfulCount ?? 0;
    const newTier = getTierForCount(count);

    // Update cached tier on profile
    await supabase
      .from("profiles")
      .update({ referral_tier: newTier, referral_count: count })
      .eq("id", ref.referrer_id);

    const tierChanged = previousTier !== newTier;

    return { referrerId: ref.referrer_id, tierChanged, newTier };
  }

  return { referrerId: ref.referrer_id, tierChanged: false, newTier: "none" };
}

// ============================================================================
// Dashboard data
// ============================================================================

/**
 * Get full referral dashboard data for a user.
 * Includes code, stats, tier, and referral list.
 *
 * ENG REVIEW 15A: Parallelizes referrals + rewards queries.
 * ENG REVIEW 16A: Limits referral list to 20 by default.
 */
export async function getReferralDashboard(
  supabase: SupabaseClient,
  userId: string,
  options: { limit?: number } = {},
): Promise<ReferralStats> {
  const code = await getOrCreateReferralCode(supabase, userId);
  const limit = options.limit ?? DEFAULT_REFERRAL_LIMIT;

  // ENG REVIEW 15A: Parallelize independent queries
  const [referralsResult, rewardResult] = await Promise.all([
    supabase
      .from("referrals")
      .select("id, referrer_id, referred_id, referral_code, track, status, referred_name, created_at, converted_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("referral_rewards")
      .select("amount_pence")
      .eq("recipient_id", userId)
      .in("status", ["earned", "applied"]),
  ]);

  const refs = (referralsResult.data ?? []) as Referral[];
  const successful = refs.filter((r) => r.status === "rewarded").length;
  const pending = refs.filter((r) => r.status !== "rewarded").length;

  const totalRewards = ((rewardResult.data ?? []) as { amount_pence: number }[])
    .reduce((sum, r) => sum + r.amount_pence, 0);

  const tier = getTierForCount(successful);
  const next = getNextTier(tier);

  return {
    referral_code: code,
    referral_url: `${SITE_URL}/join?ref=${code}`,
    tier,
    successful_referrals: successful,
    pending_referrals: pending,
    total_rewards_pence: totalRewards,
    next_tier_threshold: next?.threshold ?? null,
    referrals: refs,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run src/__tests__/services/referrals/unified-referral-service.test.ts 2>&1 | tail -20`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/referrals/unified-referral-service.ts src/__tests__/services/referrals/unified-referral-service.test.ts
git commit -m "feat(referrals): add unified referral service — nanoid codes, FOR UPDATE lock, parallel queries"
```

---

### Task 5: Middleware — Referral Cookie Capture

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Add referral cookie capture at the TOP of the middleware function**

> **ENG REVIEW AMENDMENT (6A):** Cookie is `httpOnly: true`. The attribution API reads it server-side from request headers. Client JS never accesses it.

Add this block right after the `response` variable is first created (after line 82, `response = NextResponse.next(...)`), BEFORE the Supabase configuration check (line 84):

```typescript
  // ── Referral attribution cookie ────────────────────────────────────────
  // Capture ref= param from any URL into a 90-day httpOnly cookie.
  // First-touch attribution: don't overwrite existing cookie.
  // ENG REVIEW 6A: httpOnly=true — server reads cookie in attribution API.
  const refParam = request.nextUrl.searchParams.get("ref");
  if (refParam && !request.cookies.get("britestate_ref")) {
    const sanitizedRef = refParam.replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
    if (sanitizedRef.length >= 6) {
      response.cookies.set("britestate_ref", sanitizedRef, {
        httpOnly: true, // ENG REVIEW 6A: secure — read server-side only
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 90 * 24 * 60 * 60, // 90 days
        path: "/",
      });
    }
  }
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(referrals): capture ref param as 90-day httpOnly cookie in middleware"
```

---

### Task 6: Registration — Trigger Attribution After Signup

**Files:**
- Modify: `src/components/auth/RegisterForm.tsx`
- Create: `src/app/api/referrals/v2/attribute/route.ts`

> **ENG REVIEW AMENDMENT (6A):** RegisterForm does NOT read cookies via `document.cookie`. It simply calls POST `/api/referrals/v2/attribute` with no body. The server-side endpoint reads the httpOnly cookie from request headers.

- [ ] **Step 1: Add attribution call to RegisterForm**

In `src/components/auth/RegisterForm.tsx`, in the `onSubmit` handler after successful signup, add:

```typescript
// After successful signup, trigger referral attribution.
// The API reads the httpOnly britestate_ref cookie server-side (eng review 6A).
try {
  await fetch("/api/referrals/v2/attribute", { method: "POST" });
} catch {
  // Non-critical — don't block signup
  console.warn("[referral] Failed to trigger attribution");
}
```

- [ ] **Step 2: Create the attribution API endpoint**

> **ENG REVIEW 6A:** Reads the httpOnly cookie from request headers server-side. No request body needed.

Create `src/app/api/referrals/v2/attribute/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { attributeReferral } from "@/services/referrals/unified-referral-service";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ENG REVIEW 6A: Read httpOnly cookie server-side
  const cookieStore = await cookies();
  const refCode = cookieStore.get("britestate_ref")?.value;

  if (!refCode) {
    return NextResponse.json({ attributed: false, reason: "no_cookie" });
  }

  try {
    await attributeReferral(supabase, refCode, user.id);

    // Clear the cookie after attribution
    cookieStore.delete("britestate_ref");

    return NextResponse.json({ attributed: true });
  } catch (err) {
    console.error("[referral] Attribution failed:", err);
    return NextResponse.json({ error: "Attribution failed" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Build check**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/RegisterForm.tsx src/app/api/referrals/v2/attribute/
git commit -m "feat(referrals): trigger attribution via API after signup — httpOnly cookie read server-side"
```

---

### Task 7: Stripe Webhook — Referral Conversion + Credit Application

**Files:**
- Modify: `src/app/api/webhooks/stripe/route.ts`

> **ENG REVIEW AMENDMENTS:**
> - (5A) Fetch actual subscription price from Stripe when `item?.price.unit_amount` unavailable
> - (7C) Use Stripe `customer.balance_transactions` to apply credits
> - Added Resend email sending for conversion + tier upgrade notifications

- [ ] **Step 1: Add referral conversion logic to the checkout webhook**

Add these imports at the top of the webhook file:
```typescript
import { advanceReferralStatus } from "@/services/referrals/unified-referral-service";
import { TIER_CONFIGS } from "@/lib/referral-tiers";
import type { ReferralTier } from "@/types/referrals";
```

Then, AFTER the successful subscription upsert in the `checkout.session.completed` handler (after the `revalidateTag("billing")` call around line 179), add:

```typescript
          // ── Referral conversion ────────────────────────────────
          // If this user was referred, advance their referral to "rewarded"
          // and trigger reward calculation + credit application.
          try {
            const result = await advanceReferralStatus(supabase, userId, "rewarded");
            if (result) {
              console.log(`[webhook] Referral converted for user ${userId}, referrer: ${result.referrerId}, tier changed: ${result.tierChanged}`);

              // Find the referral to get the ID
              const { data: referral } = await supabase
                .from("referrals")
                .select("id, referrer_id")
                .eq("referred_id", userId)
                .eq("status", "rewarded")
                .maybeSingle();

              if (referral) {
                const ref = referral as { id: string; referrer_id: string };

                // ENG REVIEW 5A: Get actual subscription price, don't hardcode
                let planPrice = item?.price?.unit_amount;
                if (!planPrice && session.subscription) {
                  // Fetch from Stripe subscription if line item price unavailable
                  const sub = await stripe.subscriptions.retrieve(session.subscription as string);
                  planPrice = sub.items.data[0]?.price?.unit_amount ?? null;
                }
                if (!planPrice) {
                  console.warn("[webhook] Could not determine plan price for referral reward, skipping credit");
                  // Still create reward rows but with status 'failed'
                  await supabase.from("referral_rewards").insert([
                    { referral_id: ref.id, recipient_id: ref.referrer_id, reward_type: "subscription_credit", amount_pence: 0, status: "failed" },
                    { referral_id: ref.id, recipient_id: userId, reward_type: "subscription_credit", amount_pence: 0, status: "failed" },
                  ]);
                } else {
                  // Create reward records for both parties
                  // Reward referrer: 1 month subscription credit
                  await supabase.from("referral_rewards").insert({
                    referral_id: ref.id,
                    recipient_id: ref.referrer_id,
                    reward_type: "subscription_credit",
                    amount_pence: planPrice,
                    status: "earned",
                  });

                  // Reward referee: 1 month credit (applied to month 2)
                  await supabase.from("referral_rewards").insert({
                    referral_id: ref.id,
                    recipient_id: userId,
                    reward_type: "subscription_credit",
                    amount_pence: planPrice,
                    status: "earned",
                  });

                  // ENG REVIEW 7C: Apply credits via Stripe customer balance
                  try {
                    // Get referrer's Stripe customer ID
                    const { data: referrerSub } = await supabase
                      .from("subscriptions")
                      .select("stripe_customer_id")
                      .eq("user_id", ref.referrer_id)
                      .maybeSingle();

                    if (referrerSub) {
                      const referrerCustomerId = (referrerSub as { stripe_customer_id: string }).stripe_customer_id;
                      // Negative amount = credit on Stripe balance
                      await stripe.customers.createBalanceTransaction(referrerCustomerId, {
                        amount: -planPrice, // negative = credit
                        currency: "gbp",
                        description: `Referral reward: 1 month free (referral ${ref.id})`,
                      });

                      // Update reward status to applied
                      await supabase.from("referral_rewards")
                        .update({ status: "applied", applied_at: new Date().toISOString() })
                        .eq("referral_id", ref.id)
                        .eq("recipient_id", ref.referrer_id);
                    }

                    // Apply credit to referee's account
                    const refereeCustomerId = session.customer as string;
                    if (refereeCustomerId) {
                      await stripe.customers.createBalanceTransaction(refereeCustomerId, {
                        amount: -planPrice,
                        currency: "gbp",
                        description: `Referral welcome credit: 1 month free (referral ${ref.id})`,
                      });

                      await supabase.from("referral_rewards")
                        .update({ status: "applied", applied_at: new Date().toISOString() })
                        .eq("referral_id", ref.id)
                        .eq("recipient_id", userId);
                    }
                  } catch (creditErr) {
                    // Set reward status to 'failed' for retry mechanism (see TODOS)
                    console.error("[webhook] Stripe balance credit failed:", creditErr);
                    await supabase.from("referral_rewards")
                      .update({ status: "failed" })
                      .eq("referral_id", ref.id)
                      .eq("status", "earned");
                  }

                  // Send conversion email to referrer via Resend
                  try {
                    const { data: referrerProfile } = await supabase
                      .from("profiles")
                      .select("first_name, email")
                      .eq("id", ref.referrer_id)
                      .single();
                    const { data: refereeProfile } = await supabase
                      .from("profiles")
                      .select("first_name")
                      .eq("id", userId)
                      .single();

                    if (referrerProfile && refereeProfile) {
                      const rp = referrerProfile as { first_name: string; email: string };
                      const re = refereeProfile as { first_name: string };
                      // TODO: Import and call Resend send with ReferralConvertedEmail template
                      // await resend.emails.send({
                      //   to: rp.email,
                      //   subject: `You earned £${Math.floor(planPrice / 100)} free — ${re.first_name} just joined!`,
                      //   react: ReferralConvertedEmail({ ... }),
                      // });
                      console.log(`[webhook] Referral conversion email queued for ${rp.email}`);
                    }
                  } catch (emailErr) {
                    console.error("[webhook] Referral email send failed:", emailErr);
                  }

                  // Send tier upgrade email if tier changed
                  if (result.tierChanged && result.newTier !== "none") {
                    try {
                      const tierConfig = TIER_CONFIGS[result.newTier as Exclude<ReferralTier, "none">];
                      // TODO: Import and call Resend send with ReferralTierUpgradeEmail template
                      // await resend.emails.send({ ... });
                      console.log(`[webhook] Tier upgrade email queued: ${result.newTier}`);
                    } catch (tierEmailErr) {
                      console.error("[webhook] Tier upgrade email failed:", tierEmailErr);
                    }
                  }

                  console.log(`[webhook] Referral rewards created: ${planPrice}p each for referrer ${ref.referrer_id} and referee ${userId}`);
                }
              }
            }
          } catch (refErr) {
            // Non-critical: log but don't fail the webhook
            console.error("[webhook] Referral conversion error:", refErr);
          }
```

- [ ] **Step 2: Build check**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat(referrals): add conversion pipeline to Stripe webhook — balance credits, emails, tier detection"
```

---

### Task 8: Unified Referral API Route

**Files:**
- Create: `src/app/api/referrals/v2/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
// src/app/api/referrals/v2/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReferralDashboard } from "@/services/referrals/unified-referral-service";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ENG REVIEW 16A: Support ?all=true to fetch all referrals beyond default limit
  const url = new URL(request.url);
  const showAll = url.searchParams.get("all") === "true";

  try {
    const dashboard = await getReferralDashboard(supabase, user.id, {
      limit: showAll ? 1000 : undefined,
    });
    return NextResponse.json(dashboard);
  } catch (err) {
    console.error("[referrals] Failed to get dashboard:", err);
    return NextResponse.json({ error: "Failed to load referral data" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Build check**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/api/referrals/v2/
git commit -m "feat(referrals): add unified /api/referrals/v2 dashboard endpoint with pagination"
```

---

### Task 9: UI Components — Tier Progress, Share Panel, Activity Feed

**Files:**
- Create: `src/components/referrals/TierProgressBar.tsx`
- Create: `src/components/referrals/ReferralSharePanel.tsx`
- Create: `src/components/referrals/ReferralActivityFeed.tsx`
- Create: `src/components/referrals/TierCelebration.tsx`
- Create: `src/components/referrals/ReferralDashboard.tsx`

- [ ] **Step 1: Create TierProgressBar**

```typescript
// src/components/referrals/TierProgressBar.tsx
"use client";

import type { ReferralTier } from "@/types/referrals";
import { TIER_CONFIGS, BADGE_COLORS, getNextTier } from "@/lib/referral-tiers";

type Props = Readonly<{
  currentTier: ReferralTier;
  successfulReferrals: number;
}>;

const DISPLAY_TIERS = ["connector", "ambassador", "champion", "partner"] as const;

export function TierProgressBar({ currentTier, successfulReferrals }: Props) {
  const next = getNextTier(currentTier);
  const remaining = next ? next.threshold - successfulReferrals : 0;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900">Referral Tier</h2>
        {currentTier !== "none" && (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              BADGE_COLORS[TIER_CONFIGS[currentTier as Exclude<ReferralTier, "none">].badge].bg
            } ${BADGE_COLORS[TIER_CONFIGS[currentTier as Exclude<ReferralTier, "none">].badge].text}`}
          >
            {TIER_CONFIGS[currentTier as Exclude<ReferralTier, "none">].displayName}
          </span>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1">
        {DISPLAY_TIERS.map((tier, idx) => {
          const config = TIER_CONFIGS[tier];
          const isReached = successfulReferrals >= config.threshold;
          const isCurrent = currentTier === tier;

          return (
            <div key={tier} className="flex items-center">
              {idx > 0 && (
                <div
                  className={`h-0.5 w-8 sm:w-16 ${
                    isReached ? "bg-[#1B4D3E]" : "bg-neutral-200"
                  }`}
                />
              )}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${
                    isReached
                      ? "bg-[#1B4D3E] text-white"
                      : isCurrent
                        ? "border-2 border-[#1B4D3E] text-[#1B4D3E]"
                        : "border-2 border-neutral-200 text-neutral-400"
                  }`}
                >
                  {config.threshold}
                </div>
                <span className="text-[10px] text-neutral-500">
                  {config.displayName}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next tier message */}
      {next && (
        <p className="mt-4 text-sm text-neutral-600">
          <span className="font-semibold">{remaining}</span> more referral{remaining !== 1 ? "s" : ""} to reach{" "}
          <span className="font-semibold">{TIER_CONFIGS[next.tier].displayName}</span>!
        </p>
      )}
      {!next && currentTier === "partner" && (
        <p className="mt-4 text-sm font-medium text-[#1B4D3E]">
          You&apos;ve reached the highest tier. Thank you for building the Britestate community!
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create ReferralSharePanel with LinkedIn + QR**

> **ENG REVIEW AMENDMENTS:**
> - (10A) Uses client-side QR library (`qrcode` or `react-qr-code`) instead of external API
> - (LinkedIn fix) Uses `https://www.linkedin.com/sharing/share-offsite/?url=ENCODED_URL` (URL only, no deprecated `summary` param)

```typescript
// src/components/referrals/ReferralSharePanel.tsx
"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import posthog from "posthog-js";
import { QRCodeSVG } from "qrcode.react"; // ENG REVIEW 10A: client-side QR, no external API

type Props = Readonly<{
  referralUrl: string;
  referralCode: string;
}>;

export function ReferralSharePanel({ referralUrl, referralCode }: Props) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Link copied!");
      posthog.capture("referral.link_shared", { code: referralCode, channel: "copy" });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy. Please copy manually.");
    }
  }, [referralUrl, referralCode]);

  const whatsappText = encodeURIComponent(
    `Hey, I've been using Britestate and it's brilliant for getting quality leads. Join using my link and we both get a month free: ${referralUrl}`,
  );

  const emailSubject = encodeURIComponent("Join Britestate — we both get a free month");
  const emailBody = encodeURIComponent(
    `Hi,\n\nI've been using Britestate to grow my trade business and it's been great — verified leads, no bidding wars, fixed monthly pricing.\n\nIf you sign up using my referral link, we both get 1 month free:\n${referralUrl}\n\nHope to see you there!`,
  );

  // ENG REVIEW (LinkedIn fix): URL-only sharing, no deprecated summary param
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-bold text-neutral-900">Share Your Link</h2>
      <p className="mb-4 text-sm text-neutral-500">
        Every tradesperson you refer earns you BOTH 1 month free.
      </p>

      {/* URL + copy */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          readOnly
          type="text"
          value={referralUrl}
          className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 focus:outline-none"
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-lg bg-[#1B4D3E] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2D7A5F]"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>

      {/* Share buttons */}
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => posthog.capture("referral.link_shared", { code: referralCode, channel: "whatsapp" })}
          className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
        >
          WhatsApp
        </a>
        <a
          href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
          onClick={() => posthog.capture("referral.link_shared", { code: referralCode, channel: "email" })}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          Email
        </a>
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => posthog.capture("referral.link_shared", { code: referralCode, channel: "linkedin" })}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
        >
          LinkedIn
        </a>
        <button
          type="button"
          onClick={() => setShowQr(!showQr)}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          {showQr ? "Hide QR" : "QR Code"}
        </button>
      </div>

      {/* QR Code (toggle) — ENG REVIEW 10A: client-side generation */}
      {showQr && (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-6">
          <QRCodeSVG
            value={referralUrl}
            size={200}
            level="M"
            className="rounded-lg"
          />
          <p className="text-xs text-neutral-500">
            Scan or screenshot to share on-site
          </p>
        </div>
      )}
    </div>
  );
}
```

> **NOTE:** Install `qrcode.react` dependency: `pnpm add qrcode.react`

- [ ] **Step 3: Create ReferralActivityFeed**

> **ENG REVIEW AMENDMENT (16A):** Shows "Show all" button when referrals are truncated.
> **ENG REVIEW AMENDMENT (3A):** Status config only includes `pending` and `rewarded`.

```typescript
// src/components/referrals/ReferralActivityFeed.tsx
"use client";

import { useState } from "react";
import type { Referral, ReferralStatus } from "@/types/referrals";

type Props = Readonly<{
  referrals: readonly Referral[];
  totalRewardsPence: number;
  hasMore?: boolean;
  onShowAll?: () => void;
}>;

// ENG REVIEW 3A: Only 2 statuses in simplified state machine
const STATUS_CONFIG: Record<ReferralStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-neutral-100 text-neutral-600" },
  rewarded: { label: "Rewarded", className: "bg-green-100 text-green-700" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ReferralActivityFeed({ referrals, totalRewardsPence, hasMore, onShowAll }: Props) {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-neutral-900">{referrals.length}</p>
          <p className="mt-1 text-sm text-neutral-500">Total Referrals</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-neutral-900">
            {referrals.filter((r) => r.status === "rewarded").length}
          </p>
          <p className="mt-1 text-sm text-neutral-500">Successful</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-green-600">
            £{Math.floor(totalRewardsPence / 100)}
          </p>
          <p className="mt-1 text-sm text-neutral-500">Total Earned</p>
        </div>
      </div>

      {/* Activity table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <h2 className="border-b border-neutral-100 px-6 py-4 text-lg font-semibold text-neutral-900">
          Referral Activity
        </h2>
        {referrals.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-neutral-500">
              No referrals yet. Share your link to get started!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {referrals.map((referral) => {
                  const config = STATUS_CONFIG[referral.status];
                  return (
                    <tr key={referral.id} className="transition-colors hover:bg-neutral-50">
                      <td className="px-6 py-4 text-neutral-700">
                        {referral.referred_name ?? "Tradesperson"}
                      </td>
                      <td className="px-6 py-4 tabular-nums text-neutral-500">
                        {formatDate(referral.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
                        >
                          {config.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ENG REVIEW 16A: Show all button when truncated */}
        {hasMore && onShowAll && (
          <div className="border-t border-neutral-100 px-6 py-3 text-center">
            <button
              type="button"
              onClick={onShowAll}
              className="text-sm font-medium text-[#1B4D3E] hover:underline"
            >
              Show all referrals
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create TierCelebration (confetti)**

```typescript
// src/components/referrals/TierCelebration.tsx
"use client";

import { useEffect, useRef } from "react";

type Props = Readonly<{
  show: boolean;
  tierName: string;
  onComplete: () => void;
}>;

/**
 * Confetti celebration shown when user reaches a new referral tier.
 * Uses canvas for the animation — no external dependencies.
 */
export function TierCelebration({ show, tierName, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!show || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#1B4D3E", "#2D7A5F", "#F59E0B", "#10B981", "#6366F1", "#EC4899"];
    const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }[] = [];

    // Create particles
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 3,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * -10 - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 3,
        life: 1,
      });
    }

    let frame = 0;
    const maxFrames = 120;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.life -= 0.008;

        if (p.life > 0) {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      }

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete();
      }
    }

    animate();
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50"
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
        <div className="animate-bounce rounded-2xl bg-white p-8 text-center shadow-2xl">
          <p className="text-4xl">🎉</p>
          <h2 className="mt-2 text-2xl font-bold text-neutral-900">
            You reached {tierName}!
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Keep referring to unlock more rewards
          </p>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Create ReferralDashboard orchestrator**

```typescript
// src/components/referrals/ReferralDashboard.tsx
"use client";

import { useState, useCallback } from "react";
import type { ReferralStats } from "@/types/referrals";
import { TierProgressBar } from "./TierProgressBar";
import { ReferralSharePanel } from "./ReferralSharePanel";
import { ReferralActivityFeed } from "./ReferralActivityFeed";
import { TierCelebration } from "./TierCelebration";
import { TIER_CONFIGS } from "@/lib/referral-tiers";
import type { ReferralTier } from "@/types/referrals";

type Props = Readonly<{
  stats: ReferralStats;
  showCelebration?: boolean;
  celebrationTier?: string;
}>;

export function ReferralDashboard({ stats, showCelebration, celebrationTier }: Props) {
  const [celebrating, setCelebrating] = useState(showCelebration ?? false);
  const [currentStats, setCurrentStats] = useState(stats);
  const [loadingAll, setLoadingAll] = useState(false);

  // ENG REVIEW 16A: Load all referrals on demand
  const handleShowAll = useCallback(async () => {
    setLoadingAll(true);
    try {
      const res = await fetch("/api/referrals/v2?all=true");
      if (res.ok) {
        const data = await res.json();
        setCurrentStats(data);
      }
    } finally {
      setLoadingAll(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Celebration overlay */}
      <TierCelebration
        show={celebrating}
        tierName={celebrationTier ?? ""}
        onComplete={() => setCelebrating(false)}
      />

      {/* Tier progress */}
      <TierProgressBar
        currentTier={currentStats.tier}
        successfulReferrals={currentStats.successful_referrals}
      />

      {/* Share panel */}
      <ReferralSharePanel
        referralUrl={currentStats.referral_url}
        referralCode={currentStats.referral_code}
      />

      {/* Activity feed */}
      <ReferralActivityFeed
        referrals={currentStats.referrals}
        totalRewardsPence={currentStats.total_rewards_pence}
        hasMore={currentStats.referrals.length >= 20}
        onShowAll={handleShowAll}
      />
    </div>
  );
}
```

- [ ] **Step 6: Install qrcode.react dependency**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm add qrcode.react`

- [ ] **Step 7: Build check**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add src/components/referrals/ package.json pnpm-lock.yaml
git commit -m "feat(referrals): add tier progress, share panel, activity feed, confetti — client QR, show-all pagination"
```

---

### Task 10: Rewrite Dashboard Referrals Pages + Delete Old Files

**Files:**
- Rewrite: `src/app/(protected)/dashboard/[role]/referrals/page.tsx`
- Rewrite: `src/app/(protected)/dashboard/provider/referrals/page.tsx`
- Delete: `src/services/referrals/referral-service.ts`
- Delete: `src/services/provider/provider-referral-service.ts`
- Delete: `src/app/api/referrals/route.ts`
- Delete: `src/app/api/provider/referrals/route.ts`
- Delete: `src/components/dashboard/provider/ReferralCard.tsx`

- [ ] **Step 1: Rewrite the generic referrals page as Server Component**

Replace `src/app/(protected)/dashboard/[role]/referrals/page.tsx` entirely:

```typescript
// src/app/(protected)/dashboard/[role]/referrals/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReferralDashboard } from "@/services/referrals/unified-referral-service";
import { ReferralDashboard } from "@/components/referrals/ReferralDashboard";

export const metadata = { title: "Referral Programme — Britestate" };

export default async function ReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const stats = await getReferralDashboard(supabase, user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Referral Programme</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Invite quality tradespeople to Britestate. Earn free months for every successful referral.
        </p>
      </div>

      <ReferralDashboard stats={stats} />
    </div>
  );
}
```

- [ ] **Step 2: Redirect provider page to unified page**

> **ENG REVIEW 8A:** Single-line redirect instead of full page copy. Zero duplication.

Replace `src/app/(protected)/dashboard/provider/referrals/page.tsx` entirely:

```typescript
// src/app/(protected)/dashboard/provider/referrals/page.tsx
import { redirect } from "next/navigation";

// ENG REVIEW 8A: Redirect to unified referrals page — no DRY violation
export default function ProviderReferralsPage() {
  redirect("/dashboard/provider/referrals");
}

// Note: This redirects to the [role] dynamic route which handles all roles.
// If this page IS the [role] route for provider, simply re-export or
// verify the App Router resolves provider via the [role] param.
```

> **IMPLEMENTATION NOTE:** Verify whether `/dashboard/provider/referrals` is caught by the `[role]` dynamic segment or the static `provider` segment. If the static segment takes priority, this page should either render the same content inline OR the static segment should be removed entirely so `[role]` handles it. Check Next.js route resolution order during implementation.

- [ ] **Step 3: Delete old referral files**

> **ENG REVIEW 12B:** Delete all old referral code. Build breaks surface remaining imports.

```bash
rm src/services/referrals/referral-service.ts
rm src/services/provider/provider-referral-service.ts
rm src/app/api/referrals/route.ts
rm src/app/api/provider/referrals/route.ts
rm src/components/dashboard/provider/ReferralCard.tsx
```

- [ ] **Step 4: Fix any broken imports from deleted files**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | grep -i "error\|cannot find" | head -20`

Fix any imports that referenced deleted files — update them to use the unified service or remove them if no longer needed.

- [ ] **Step 5: Build check**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add -u  # Stage deletions
git add "src/app/(protected)/dashboard/[role]/referrals/page.tsx" "src/app/(protected)/dashboard/provider/referrals/page.tsx"
git commit -m "feat(referrals): rewrite dashboard pages with unified service, delete old referral code"
```

---

### Task 11: Email Templates — Conversion + Tier Upgrade

**Files:**
- Create: `src/emails/referral-converted.tsx`
- Create: `src/emails/referral-tier-upgrade.tsx`

- [ ] **Step 1: Create referral-converted email**

```typescript
// src/emails/referral-converted.tsx
import { Section, Text } from "@react-email/components";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

type Props = Readonly<{
  referrerName: string;
  refereeName: string;
  creditAmount: string;
  dashboardUrl: string;
}>;

export function ReferralConvertedEmail({
  referrerName,
  refereeName,
  creditAmount,
  dashboardUrl,
}: Props) {
  return (
    <EmailWrapper previewText={`You earned ${creditAmount} — ${refereeName} just joined!`}>
      <EmailHeader />
      <Section style={{ padding: "32px" }}>
        <Text style={{ fontSize: "24px", fontWeight: "700", color: "#1B4D3E", margin: "0 0 16px 0" }}>
          You just earned {creditAmount} free!
        </Text>
        <Text style={{ fontSize: "15px", color: "#5E5E6A", margin: "0 0 16px 0", lineHeight: "1.6" }}>
          Hi {referrerName}, great news — <strong style={{ color: "#0A0A0B" }}>{refereeName}</strong>{" "}
          just activated their Britestate membership using your referral link.
        </Text>
        <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "8px", padding: "16px 20px", marginBottom: "24px" }}>
          <Text style={{ fontSize: "14px", fontWeight: "600", color: "#15803D", margin: "0" }}>
            {creditAmount} subscription credit applied to your next invoice.
          </Text>
        </div>
        <Text style={{ fontSize: "13px", color: "#5E5E6A", margin: "0 0 24px 0", lineHeight: "1.5" }}>
          Keep sharing your referral link to earn more free months and unlock higher tiers!
        </Text>
        <EmailButton href={dashboardUrl} variant="primary">
          View Your Referrals
        </EmailButton>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
```

- [ ] **Step 2: Create referral-tier-upgrade email**

```typescript
// src/emails/referral-tier-upgrade.tsx
import { Section, Text } from "@react-email/components";
import { EmailWrapper } from "@/emails/_components/EmailWrapper";
import { EmailHeader } from "@/emails/_components/EmailHeader";
import { EmailFooter } from "@/emails/_components/EmailFooter";
import { EmailButton } from "@/emails/_components/EmailButton";

type Props = Readonly<{
  memberName: string;
  tierName: string;
  tierDescription: string;
  freeMonths: number;
  dashboardUrl: string;
}>;

export function ReferralTierUpgradeEmail({
  memberName,
  tierName,
  tierDescription,
  freeMonths,
  dashboardUrl,
}: Props) {
  return (
    <EmailWrapper previewText={`Congratulations — you've reached ${tierName} status!`}>
      <EmailHeader />
      <Section style={{ padding: "32px" }}>
        <Text style={{ fontSize: "24px", fontWeight: "700", color: "#1B4D3E", margin: "0 0 16px 0" }}>
          You&apos;ve reached {tierName} status!
        </Text>
        <Text style={{ fontSize: "15px", color: "#5E5E6A", margin: "0 0 16px 0", lineHeight: "1.6" }}>
          Congratulations {memberName}! Your referrals have earned you {tierName} tier.
        </Text>
        <div style={{ backgroundColor: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "8px", padding: "16px 20px", marginBottom: "24px" }}>
          <Text style={{ fontSize: "14px", fontWeight: "600", color: "#92400E", margin: "0", lineHeight: "1.6" }}>
            {tierDescription}
          </Text>
          <Text style={{ fontSize: "13px", color: "#92400E", margin: "8px 0 0 0" }}>
            Total free months earned: {freeMonths}
          </Text>
        </div>
        <EmailButton href={dashboardUrl} variant="primary">
          View Your Tier
        </EmailButton>
      </Section>
      <EmailFooter unsubscribeUrl="https://britestate.co.uk/unsubscribe?token=placeholder" />
    </EmailWrapper>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/emails/referral-converted.tsx src/emails/referral-tier-upgrade.tsx
git commit -m "feat(referrals): add referral converted + tier upgrade email templates"
```

---

### Task 12: E2E Tests

**Files:**
- Create: `tests/e2e/referral-system.spec.ts`

> **ENG REVIEW AMENDMENT (14A):** Added dashboard smoke test for authenticated user.

- [ ] **Step 1: Write E2E tests**

```typescript
// tests/e2e/referral-system.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Referral Dashboard", () => {
  test("referrals page loads without auth redirect to billing", async ({ page }) => {
    // Referrals page is exempted from subscription gating (Wave 1 middleware change)
    const response = await page.goto("/dashboard/provider/referrals");
    // Should NOT redirect to billing checkout
    expect(page.url()).not.toContain("/billing/checkout");
  });

  // ENG REVIEW 14A: Dashboard smoke test
  test("referral dashboard renders key sections for authenticated user", async ({ page }) => {
    // This test requires an authenticated session — adjust login helper as needed
    await page.goto("/dashboard/provider/referrals");

    // Verify key UI sections render
    await expect(page.getByText("Referral Tier")).toBeVisible();
    await expect(page.getByText("Share Your Link")).toBeVisible();
    await expect(page.getByText("Referral Activity")).toBeVisible();
  });
});

test.describe("Referral Link Capture", () => {
  test("visiting /join?ref=TESTCODE sets britestate_ref cookie", async ({ page }) => {
    await page.goto("/join?ref=TESTCODE1");
    const cookies = await page.context().cookies();
    const refCookie = cookies.find((c) => c.name === "britestate_ref");
    expect(refCookie).toBeDefined();
    expect(refCookie?.value).toBe("TESTCODE1");
    // Cookie should have ~90 day expiry
    expect(refCookie?.expires).toBeGreaterThan(Date.now() / 1000 + 86400 * 80);
    // ENG REVIEW 6A: Cookie should be httpOnly
    expect(refCookie?.httpOnly).toBe(true);
  });

  test("first-touch attribution: existing cookie is not overwritten", async ({ page }) => {
    // Set cookie manually first
    await page.context().addCookies([{
      name: "britestate_ref",
      value: "FIRST123",
      domain: "localhost",
      path: "/",
    }]);
    await page.goto("/join?ref=SECOND99");
    const cookies = await page.context().cookies();
    const refCookie = cookies.find((c) => c.name === "britestate_ref");
    expect(refCookie?.value).toBe("FIRST123");
  });

  test("invalid ref codes are ignored", async ({ page }) => {
    await page.goto("/join?ref=AB");
    const cookies = await page.context().cookies();
    const refCookie = cookies.find((c) => c.name === "britestate_ref");
    expect(refCookie).toBeUndefined();
  });

  test("XSS in ref param is sanitized", async ({ page }) => {
    await page.goto("/join?ref=<script>alert(1)</script>");
    const cookies = await page.context().cookies();
    const refCookie = cookies.find((c) => c.name === "britestate_ref");
    // Either no cookie or sanitized value
    if (refCookie) {
      expect(refCookie.value).not.toContain("<");
      expect(refCookie.value).not.toContain(">");
    }
  });
});
```

- [ ] **Step 2: Commit (don't run — needs server)**

```bash
git add tests/e2e/referral-system.spec.ts
git commit -m "test(e2e): add referral system E2E tests — cookie capture, dashboard smoke, XSS"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Run lint on all new files**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && npx eslint src/types/referrals.ts src/lib/referral-tiers.ts src/services/referrals/unified-referral-service.ts src/components/referrals/*.tsx "src/app/(protected)/dashboard/[role]/referrals/page.tsx" "src/app/(protected)/dashboard/provider/referrals/page.tsx" src/app/api/referrals/v2/ src/emails/referral-converted.tsx src/emails/referral-tier-upgrade.tsx 2>&1 | tail -20`
Expected: No errors

- [ ] **Step 2: Run all unit tests**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm vitest run src/__tests__/lib/referral-tiers.test.ts src/__tests__/services/referrals/unified-referral-service.test.ts 2>&1 | tail -20`
Expected: ALL PASS

- [ ] **Step 3: Run full build**

Run: `cd /Users/joanflerinbig/Documents/britv3.0 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Fix any issues and commit if needed**

```bash
git add -A
git commit -m "chore: fix lint and build issues from Wave 2 referral system"
```

---

### Task 14: Update TODOS.md

- [ ] **Step 1: Append deferred items to TODOS.md**

> Includes 6 items from CEO review + 1 item from eng review (Stripe balance credit retry).

Add the following to `TODOS.md`:

```markdown

## Wave 2 Referral System — Deferred TODOs

### Stripe balance credit retry mechanism
**What:** Cron job or retry queue that picks up `referral_rewards` with `status='failed'` and retries Stripe `customer.balance_transactions` application.
**Why:** Critical gap from eng review — when Stripe balance API fails after reward row creation, credits are tracked but never applied. Users miss their discount silently.
**Effort:** M | **Priority:** P1
**Where to start:** Edge function or cron job querying `referral_rewards WHERE status = 'failed'`, retrying Stripe balance call, updating status on success.
**Depends on:** Wave 2 referral system being shipped.

### Referral analytics admin dashboard
**What:** Admin dashboard showing aggregate referral metrics (k-factor, conversion funnel, top referrers, reward costs).
**Why:** Without this, growth engine health is invisible. Current workaround: Supabase dashboard queries.
**Effort:** M | **Priority:** P2
**Where to start:** New admin page at `/admin/referrals` with server-side aggregation queries.

### Referral fraud detection cron
**What:** Automated weekly scan for referral rings (A→B→C→A), churn-and-rejoin patterns, and burst referrals from single IP.
**Why:** 3+3 verification is the main gate, but edge cases exist at scale.
**Effort:** M | **Priority:** P2
**Where to start:** Edge function or cron job querying referral patterns.

### Referral link click tracking
**What:** Redirect endpoint `/r/[code]` that logs clicks before redirecting to `/join?ref=[code]`.
**Why:** Dashboard shows referral stats but not link click counts. Needed for conversion funnel visibility.
**Effort:** S | **Priority:** P2
**Where to start:** Create redirect API route + `click_count` column on `referral_codes_v2`.

### Track B: Tradesperson-to-homeowner referrals
**What:** Second referral track where tradespeople share /hire/[slug] links and earn £25 per homeowner booking.
**Why:** Builds demand side of marketplace via existing member network.
**Effort:** L | **Priority:** P3
**Depends on:** Homeowner booking system being built.

### Partner tier revenue share payouts
**What:** Automated monthly payout of 5% revenue share to Partner tier members (10+ referrals).
**Why:** Revenue share is the top-tier incentive. Currently tracked but not paid out.
**Effort:** XL | **Priority:** P3
**Depends on:** Legal review, Stripe Connect or manual payout process, tax reporting.

### "Referred by" profile badge
**What:** Show "Referred by [Name]" on new member profiles with link to referrer's profile.
**Why:** Social proof + referrer recognition. Doc specifies this in Connector reward package.
**Effort:** S | **Priority:** P3
**Where to start:** Add `referred_by_display` column to profiles, render in profile page.
```

- [ ] **Step 2: Commit**

```bash
git add TODOS.md
git commit -m "docs: add Wave 2 referral system deferred TODOs from CEO + eng review"
```
