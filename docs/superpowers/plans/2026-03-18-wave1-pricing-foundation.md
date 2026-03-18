# Wave 1: Pricing Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update Britestate pricing to match the McKinsey strategy document — Provider tiers (Member £47/Pro £97/Elite £197), Agent tiers (Performance £0/Pro £297/Enterprise £497), role-aware pricing page, feature entitlements service, and feature gating middleware with contextual upgrade prompts.

**Architecture:** The Plan type in `billing-config.ts` gains an `entitlements` array of feature keys. A new `entitlements-service.ts` centralises "can user X do Y?" logic by combining subscription plan + referral tier. The pricing page becomes a Server Component that detects the user's role and renders the appropriate plan cards. Middleware extends the existing subscription check to support granular feature gating with contextual upsell redirects instead of hard billing redirects.

**Tech Stack:** Next.js 16, Supabase, Stripe, TypeScript, Tailwind CSS, Vitest, Playwright

---

## Engineering Review Findings (2026-03-18)

> Reviewed via `/plan-eng-review` — BIG CHANGE mode. All decisions locked.

### Decisions

| # | Decision | Resolution |
|---|---|---|
| 1B | Derive pricing page prices from billing-config | Server Component maps from `PLANS_BY_ROLE`, thin marketing overlay |
| 2B | UpgradePrompt gets `planDisplayName` prop | Remove hardcoded `PLAN_DISPLAY_NAMES` dict |
| 3A | Stripe $0 subscription is the path for free agent plan | Add assertion in resolveInternalPlanId test |
| 4 | Skip Task 5 Step 1 | `/pricing` already in `PUBLIC_ROUTES` |
| 5A | Legacy plan ID alias map | `LEGACY_PLAN_IDS` in plan-entitlements.ts |
| 6A | Dynamic savings text in BillingToggle | `savingsLabel` prop computed per-tab |
| 7A | Add legacy alias tests | 2-3 assertions in plan-entitlements.test.ts |
| 8A | Extract `resolveInternalPlanId()` + unit test | Clean webhook code + tested plan resolution |
| 9A | $0 plan assertion in 8A test | 1 extra line in resolveInternalPlanId test |
| 10A | E2E test for referrals exemption | Playwright test for /dashboard/provider/referrals access |

### Dependency Graph

```
  entitlements.ts (types)
        │
        ▼
  plan-entitlements.ts ◄── client-safe, no "server-only"
        │
        ▼
  entitlements-service.ts ◄── server-only, reads Supabase
        │
        ▼
  middleware.ts (does NOT use entitlements-service — inline query)

  billing-config.ts ◄── server-only, Plan defs + prices
        │
        ├──► webhook/stripe/route.ts (resolveInternalPlanId helper)
        │         │
        │         ▼
        │    subscriptions.plan_name = internal plan ID
        │         │
        │         ▼
        │    entitlements-service.ts (reads plan_name → features)
        │
        └──► pricing/page.tsx (Server Component derives tab data from PLANS_BY_ROLE)
               │
               ▼
             PricingTabs.tsx (client) → PricingCard.tsx → BillingToggle.tsx

  UpgradePrompt.tsx ◄── receives planDisplayName as prop from server parent
```

### NOT in Scope

| Deferred work | Rationale |
|---|---|
| Referral tier bonuses extending entitlements | Deferred to referral wave |
| Granular per-feature middleware gating | Middleware stays route-based; feature-level via UpgradePrompt |
| Stripe product/price creation automation | Price IDs assumed to exist in Stripe Dashboard |
| Feature usage tracking / quota enforcement | Entitlements are boolean, not quantitative |
| Migration of existing Stripe products to new names | Ops task, not code |
| Mobile-responsive pricing page polish | Basic responsive via Tailwind grid |
| A/B testing pricing variants | Out of scope for foundation wave |
| Proration preview for upgrade path | Already exists in billing-service.ts |

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/lib/billing-config.ts` | Update plan names, prices, features + export `resolveInternalPlanId` helper |
| Create | `src/lib/plan-entitlements.ts` | Client-safe plan feature/entitlement constants with legacy alias map (no `server-only`) |
| Create | `src/services/billing/entitlements-service.ts` | Server-side "can user do X?" logic — single source of truth |
| Create | `src/types/entitlements.ts` | Feature key enum + entitlement types |
| Modify | `src/middleware.ts` | Add referrals page exemption to subscription gating |
| Modify | `src/app/api/webhooks/stripe/route.ts` | Use `resolveInternalPlanId` instead of Stripe nickname |
| Rewrite | `src/app/(main)/pricing/page.tsx` | Server Component — derives tab data from `PLANS_BY_ROLE` (DRY) |
| Modify | `src/app/(main)/pricing/layout.tsx` | Update metadata description |
| Create | `src/components/pricing/PricingTabs.tsx` | Client Component — tab switcher with dynamic savings label |
| Create | `src/components/pricing/PricingCard.tsx` | Client Component — single plan card with billing toggle |
| Create | `src/components/pricing/BillingToggle.tsx` | Client Component — monthly/annual toggle with `savingsLabel` prop |
| Create | `src/components/billing/UpgradePrompt.tsx` | Client Component — contextual upgrade prompt with `planDisplayName` prop |
| Create | `src/__tests__/lib/billing-config.test.ts` | Unit tests for plan prices and `resolveInternalPlanId` |
| Create | `src/__tests__/services/billing/entitlements-service.test.ts` | Unit tests for entitlements |
| Create | `src/__tests__/lib/plan-entitlements.test.ts` | Unit tests for plan → feature mapping + legacy aliases |
| Create | `src/__tests__/components/billing/UpgradePrompt.test.tsx` | Unit test for upgrade prompt |
| Create | `tests/e2e/pricing-page.spec.ts` | E2E tests for pricing page + referrals exemption |

---

### Task 1: Define Feature Key Types

**Files:**
- Create: `src/types/entitlements.ts`

- [ ] **Step 1: Create the entitlements type file**

```typescript
// src/types/entitlements.ts

/**
 * Every gatable feature in the platform.
 * Add new keys here when new features need plan-based gating.
 *
 * Naming: DOMAIN_CAPABILITY (e.g., QUOTES_UNLIMITED, LEADS_PRIORITY)
 */
export const FEATURE_KEYS = [
  // Provider features
  "QUOTES_BASIC",           // 3 quotes/month (Member)
  "QUOTES_UNLIMITED",       // Unlimited quotes (Professional+)
  "LEADS_STANDARD",         // Standard lead notifications
  "LEADS_PRIORITY",         // Priority lead matching (Professional+)
  "LEADS_FIRST_ACCESS",     // First-access premium leads (Elite)
  "PROFILE_BASIC",          // Basic profile listing
  "PROFILE_FEATURED",       // Featured profile listing (Professional+)
  "PROFILE_PREMIUM_BADGE",  // Premium trust badges (Elite)
  "BOOKING_SYSTEM",         // Integrated booking (Professional+)
  "CRM_BASIC",              // Basic CRM (Professional+)
  "CRM_ADVANCED",           // Advanced CRM + analytics (Elite)
  "FOLLOW_UPS_AUTO",        // Automated follow-ups (Professional+)
  "ANALYTICS_BASIC",        // Basic analytics
  "ANALYTICS_ADVANCED",     // Advanced analytics (Professional+)
  "SUPPORT_EMAIL",          // Email support
  "SUPPORT_PRIORITY",       // Priority support 4hr SLA (Professional+)
  "SUPPORT_DEDICATED",      // Dedicated account manager (Elite)
  "TEAM_MULTI_USER",        // Multi-user team accounts (Elite)
  "API_ACCESS",             // API access (Elite)
  "WHITE_LABEL",            // White-label portal (Elite)
  "RECRUITMENT",            // Recruitment posting (Elite)
  // Agent features
  "LISTINGS_25",            // Up to 25 listings (Performance)
  "LISTINGS_UNLIMITED",     // Unlimited listings (Professional+)
  "LISTINGS_MULTI_BRANCH",  // Multi-branch management (Enterprise)
  "AGENT_CRM",              // Full CRM suite (Professional+)
  "AGENT_VIEWING_CALENDAR", // Viewing calendar (Professional+)
  "AGENT_OFFER_MGMT",      // Offer management (Professional+)
  "AGENT_CUSTOM_BRANDING",  // Custom branding (Enterprise)
  "AGENT_TEAM_ACCOUNTS",    // Team member accounts (Enterprise)
  "AGENT_API_ACCESS",       // API access (Enterprise)
  // Landlord features
  "PROPERTIES_3",           // Up to 3 properties (Essential)
  "PROPERTIES_UNLIMITED",   // Unlimited properties (Professional)
  "TENANT_SCREENING_BASIC", // Basic tenant screening
  "TENANT_SCREENING_ADV",   // Advanced tenant screening (Professional)
  "RENT_COLLECTION",        // Rent collection tools (Professional)
  "MAINTENANCE_BASIC",      // Basic maintenance tracking
  "MAINTENANCE_WORKFLOWS",  // Full maintenance workflows (Professional)
  "FINANCIAL_REPORTING",    // Financial reporting (Professional)
  // Universal
  "REFERRAL_PROGRAM",       // Access to referral program (all paid)
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export type UserEntitlements = {
  planId: string | null;
  planName: string | null;
  features: ReadonlySet<FeatureKey>;
};
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd britv3.0 && npx tsc --noEmit src/types/entitlements.ts 2>&1 | head -20`
Expected: No errors (or only unrelated errors from other files)

- [ ] **Step 3: Commit**

```bash
git add src/types/entitlements.ts
git commit -m "feat(billing): add FeatureKey type and entitlement types"
```

---

### Task 2: Update billing-config.ts with Document Prices

**Files:**
- Modify: `src/lib/billing-config.ts`

- [ ] **Step 1: Write failing test for new provider plan prices**

Create `src/__tests__/lib/billing-config.test.ts`:

```typescript
// src/__tests__/lib/billing-config.test.ts
import { describe, it, expect, vi } from "vitest";

// billing-config uses "server-only" import which breaks in test.
// We mock it to a no-op so the rest of the module can be imported.
vi.mock("server-only", () => ({}));

import {
  PROVIDER_PLANS,
  AGENT_PLANS,
  LANDLORD_PLANS,
  PLANS_BY_ROLE,
  isPriceIdAllowed,
  getPlanByPriceId,
} from "@/lib/billing-config";

describe("PROVIDER_PLANS", () => {
  it("has 3 tiers: Member, Professional, Elite", () => {
    expect(PROVIDER_PLANS).toHaveLength(3);
    expect(PROVIDER_PLANS.map((p) => p.name)).toEqual([
      "Member",
      "Professional",
      "Elite",
    ]);
  });

  it("Member is £47/month (4700 pence)", () => {
    const member = PROVIDER_PLANS[0];
    expect(member.priceMonthly).toBe(4700);
  });

  it("Professional is £97/month (9700 pence), highlighted", () => {
    const pro = PROVIDER_PLANS[1];
    expect(pro.priceMonthly).toBe(9700);
    expect(pro.highlighted).toBe(true);
  });

  it("Elite is £197/month (19700 pence)", () => {
    const elite = PROVIDER_PLANS[2];
    expect(elite.priceMonthly).toBe(19700);
  });

  it("annual pricing saves 2 months (Member: £470/yr)", () => {
    const member = PROVIDER_PLANS[0];
    expect(member.priceAnnual).toBe(47000);
  });

  it("annual pricing saves 2 months (Professional: £970/yr)", () => {
    const pro = PROVIDER_PLANS[1];
    expect(pro.priceAnnual).toBe(97000);
  });

  it("annual pricing saves 2 months (Elite: £1970/yr)", () => {
    const elite = PROVIDER_PLANS[2];
    expect(elite.priceAnnual).toBe(197000);
  });
});

describe("AGENT_PLANS", () => {
  it("has 3 tiers: Performance, Professional, Enterprise", () => {
    expect(AGENT_PLANS).toHaveLength(3);
    expect(AGENT_PLANS.map((p) => p.name)).toEqual([
      "Performance",
      "Professional",
      "Enterprise",
    ]);
  });

  it("Performance is £0/month (free tier with commission split)", () => {
    const perf = AGENT_PLANS[0];
    expect(perf.priceMonthly).toBe(0);
    expect(perf.priceAnnual).toBe(0);
  });

  it("Professional is £297/month", () => {
    const pro = AGENT_PLANS[1];
    expect(pro.priceMonthly).toBe(29700);
    expect(pro.highlighted).toBe(true);
  });

  it("Enterprise is £497/month", () => {
    const ent = AGENT_PLANS[2];
    expect(ent.priceMonthly).toBe(49700);
  });

  it("Professional annual is £2,850/yr", () => {
    expect(AGENT_PLANS[1].priceAnnual).toBe(285000);
  });

  it("Enterprise annual is £4,770/yr", () => {
    expect(AGENT_PLANS[2].priceAnnual).toBe(477000);
  });
});

describe("LANDLORD_PLANS (unchanged)", () => {
  it("has 2 tiers: Essential £19, Professional £49", () => {
    expect(LANDLORD_PLANS).toHaveLength(2);
    expect(LANDLORD_PLANS[0].priceMonthly).toBe(1900);
    expect(LANDLORD_PLANS[1].priceMonthly).toBe(4900);
  });
});

describe("PLANS_BY_ROLE", () => {
  it("maps agent, landlord, provider to their plans", () => {
    expect(PLANS_BY_ROLE.provider).toBe(PROVIDER_PLANS);
    expect(PLANS_BY_ROLE.agent).toBe(AGENT_PLANS);
    expect(PLANS_BY_ROLE.landlord).toBe(LANDLORD_PLANS);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd britv3.0 && pnpm vitest run src/__tests__/lib/billing-config.test.ts 2>&1 | tail -20`
Expected: FAIL — Provider plans have wrong names/prices, Agent plans have wrong names/prices

- [ ] **Step 3: Update PROVIDER_PLANS in billing-config.ts**

Replace lines 167-200 in `src/lib/billing-config.ts` (the entire `PROVIDER_PLANS` array) with:

```typescript
export const PROVIDER_PLANS: readonly Plan[] = [
  {
    id: "provider_member",
    name: "Member",
    priceIdMonthly: process.env.STRIPE_PROVIDER_MEMBER_PRICE_ID ?? "price_provider_member_test",
    priceIdAnnual: process.env.STRIPE_PROVIDER_MEMBER_ANNUAL_PRICE_ID ?? "price_provider_member_annual_test",
    priceMonthly: 4700, // £47/month
    priceAnnual: 47000, // £470/year — save £94 (2 months free)
    role: "provider",
    features: [
      "Verified profile listing",
      "Britestate Trust Badge",
      "3 quotes per month",
      "Review collection system",
      "Mobile app access",
      "Basic lead notifications",
      "Email support",
    ],
  },
  {
    id: "provider_professional",
    name: "Professional",
    priceIdMonthly: process.env.STRIPE_PROVIDER_PRO_PRICE_ID ?? "price_provider_pro_test",
    priceIdAnnual: process.env.STRIPE_PROVIDER_PRO_ANNUAL_PRICE_ID ?? "price_provider_pro_annual_test",
    priceMonthly: 9700, // £97/month
    priceAnnual: 97000, // £970/year — save £194 (2 months free)
    role: "provider",
    highlighted: true,
    features: [
      "Everything in Member",
      "Unlimited quote responses",
      "Priority lead matching",
      "Integrated booking system",
      "Automated follow-ups",
      "Basic CRM & analytics",
      "Branded quote templates",
      "Priority support (4hr SLA)",
    ],
  },
  {
    id: "provider_elite",
    name: "Elite",
    priceIdMonthly: process.env.STRIPE_PROVIDER_ELITE_PRICE_ID ?? "price_provider_elite_test",
    priceIdAnnual: process.env.STRIPE_PROVIDER_ELITE_ANNUAL_PRICE_ID ?? "price_provider_elite_annual_test",
    priceMonthly: 19700, // £197/month
    priceAnnual: 197000, // £1,970/year — save £394 (2 months free)
    role: "provider",
    features: [
      "Everything in Professional",
      "First-access to premium jobs",
      "Multi-user team accounts",
      "Advanced workflow automation",
      "White-label customer portal",
      "API access",
      "Dedicated account manager",
      "Recruitment posting access",
      "Premium trust badges",
    ],
  },
];
```

- [ ] **Step 4: Update AGENT_PLANS in billing-config.ts**

Replace lines 78-129 (the entire `AGENT_PLANS` array) with:

```typescript
export const AGENT_PLANS: readonly Plan[] = [
  {
    id: "agent_performance",
    name: "Performance",
    priceIdMonthly: process.env.STRIPE_AGENT_PERF_PRICE_ID ?? "price_agent_perf_test",
    priceIdAnnual: process.env.STRIPE_AGENT_PERF_ANNUAL_PRICE_ID ?? "price_agent_perf_annual_test",
    priceMonthly: 0, // £0/month — performance-based (50/50 commission split)
    priceAnnual: 0,
    role: "agent",
    features: [
      "Up to 25 active listings",
      "Standard property photos",
      "Lead management",
      "Email support",
      "50/50 commission split on sales",
      "70/30 split on managed rentals",
    ],
  },
  {
    id: "agent_professional",
    name: "Professional",
    priceIdMonthly: process.env.STRIPE_AGENT_PRO_PRICE_ID ?? "price_agent_pro_test",
    priceIdAnnual: process.env.STRIPE_AGENT_PRO_ANNUAL_PRICE_ID ?? "price_agent_pro_annual_test",
    priceMonthly: 29700, // £297/month
    priceAnnual: 285000, // £2,850/year — save £714 (2.4 months free)
    role: "agent",
    highlighted: true,
    features: [
      "Unlimited active listings",
      "Premium photo hosting",
      "Full CRM suite",
      "Viewing calendar",
      "Offer management",
      "Priority support",
      "75/25 commission split on sales",
      "85/15 split on managed rentals",
    ],
  },
  {
    id: "agent_enterprise",
    name: "Enterprise",
    priceIdMonthly: process.env.STRIPE_AGENT_ENT_PRICE_ID ?? "price_agent_ent_test",
    priceIdAnnual: process.env.STRIPE_AGENT_ENT_ANNUAL_PRICE_ID ?? "price_agent_ent_annual_test",
    priceMonthly: 49700, // £497/month
    priceAnnual: 477000, // £4,770/year — save £1,194 (2.4 months free)
    role: "agent",
    features: [
      "Everything in Professional",
      "Multi-branch management",
      "Team member accounts",
      "API access",
      "Dedicated account manager",
      "Custom branding",
      "90/10 commission split on sales",
      "95/5 split on managed rentals",
    ],
  },
];
```

- [ ] **Step 5: Update the ALLOWED_PRICE_IDS set**

Replace the entire ALLOWED_PRICE_IDS set (lines 43-68) with:

```typescript
export const ALLOWED_PRICE_IDS: ReadonlySet<string> = new Set([
  // Agent plans — monthly
  process.env.STRIPE_AGENT_PERF_PRICE_ID ?? "price_agent_perf_test",
  process.env.STRIPE_AGENT_PRO_PRICE_ID ?? "price_agent_pro_test",
  process.env.STRIPE_AGENT_ENT_PRICE_ID ?? "price_agent_ent_test",
  // Agent plans — annual
  process.env.STRIPE_AGENT_PERF_ANNUAL_PRICE_ID ?? "price_agent_perf_annual_test",
  process.env.STRIPE_AGENT_PRO_ANNUAL_PRICE_ID ?? "price_agent_pro_annual_test",
  process.env.STRIPE_AGENT_ENT_ANNUAL_PRICE_ID ?? "price_agent_ent_annual_test",
  // Landlord plans — monthly (unchanged)
  process.env.STRIPE_LANDLORD_ESSENTIAL_PRICE_ID ?? "price_landlord_ess_test",
  process.env.STRIPE_LANDLORD_PRO_PRICE_ID ?? "price_landlord_pro_test",
  // Landlord plans — annual (unchanged)
  process.env.STRIPE_LANDLORD_ESSENTIAL_ANNUAL_PRICE_ID ?? "price_landlord_ess_annual_test",
  process.env.STRIPE_LANDLORD_PRO_ANNUAL_PRICE_ID ?? "price_landlord_pro_annual_test",
  // Provider plans — monthly
  process.env.STRIPE_PROVIDER_MEMBER_PRICE_ID ?? "price_provider_member_test",
  process.env.STRIPE_PROVIDER_PRO_PRICE_ID ?? "price_provider_pro_test",
  process.env.STRIPE_PROVIDER_ELITE_PRICE_ID ?? "price_provider_elite_test",
  // Provider plans — annual
  process.env.STRIPE_PROVIDER_MEMBER_ANNUAL_PRICE_ID ?? "price_provider_member_annual_test",
  process.env.STRIPE_PROVIDER_PRO_ANNUAL_PRICE_ID ?? "price_provider_pro_annual_test",
  process.env.STRIPE_PROVIDER_ELITE_ANNUAL_PRICE_ID ?? "price_provider_elite_annual_test",
  // One-time boosts (unchanged)
  process.env.STRIPE_BOOST_7D_PRICE_ID ?? "price_boost_7d_test",
  process.env.STRIPE_BOOST_14D_PRICE_ID ?? "price_boost_14d_test",
  process.env.STRIPE_BOOST_30D_PRICE_ID ?? "price_boost_30d_test",
]);
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd britv3.0 && pnpm vitest run src/__tests__/lib/billing-config.test.ts 2>&1 | tail -20`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/billing-config.ts src/__tests__/lib/billing-config.test.ts
git commit -m "feat(billing): update plans to document prices — Provider £47/£97/£197, Agent £0/£297/£497"
```

---

### Task 2.5: Fix Stripe Webhook to Store Internal Plan ID

**Files:**
- Modify: `src/lib/billing-config.ts` (add `resolveInternalPlanId` helper)
- Modify: `src/app/api/webhooks/stripe/route.ts`

The Stripe webhook currently stores `plan?.nickname ?? plan?.metadata?.name` as `plan_name`. This is the Stripe display name (e.g., "Professional"), NOT our internal plan ID (e.g., "provider_professional"). The entitlements service needs the internal plan ID to look up features.

> **[ENG REVIEW 8A]** Extract the plan resolution logic into a testable helper function in billing-config.ts rather than inlining it in the webhook. This makes the most critical data flow change in this wave independently testable.

- [ ] **Step 1: Add `resolveInternalPlanId` helper to billing-config.ts**

Add at the bottom of `src/lib/billing-config.ts`, before the closing validation helpers section:

```typescript
/**
 * Resolve a Stripe price ID to our internal plan ID.
 * Used by the webhook to store the correct plan_name in the subscriptions table.
 * Falls back to the provided fallback (typically Stripe's plan nickname).
 */
export function resolveInternalPlanId(
  stripePriceId: string | undefined | null,
  fallback: string | null = null,
): string | null {
  if (!stripePriceId) return fallback;
  const matched = getPlanByPriceId(stripePriceId);
  return matched?.id ?? fallback;
}
```

- [ ] **Step 2: Add unit tests for resolveInternalPlanId**

Add to `src/__tests__/lib/billing-config.test.ts` (created in Task 2):

```typescript
describe("resolveInternalPlanId", () => {
  it("resolves a known monthly price ID to internal plan ID", () => {
    // In test env, falls back to test fixtures
    expect(resolveInternalPlanId("price_provider_member_test")).toBe("provider_member");
  });

  it("resolves a known annual price ID to internal plan ID", () => {
    expect(resolveInternalPlanId("price_agent_pro_annual_test")).toBe("agent_professional");
  });

  it("resolves $0 agent plan price ID correctly", () => {
    // [ENG REVIEW 9A] — critical: free plan must resolve to agent_performance
    expect(resolveInternalPlanId("price_agent_perf_test")).toBe("agent_performance");
  });

  it("returns fallback for unknown price ID", () => {
    expect(resolveInternalPlanId("price_unknown_xyz", "SomePlanNickname")).toBe("SomePlanNickname");
  });

  it("returns fallback for null/undefined price ID", () => {
    expect(resolveInternalPlanId(null, "FallbackName")).toBe("FallbackName");
    expect(resolveInternalPlanId(undefined)).toBeNull();
  });
});
```

Also update the import at the top of the test file to include `resolveInternalPlanId`:
```typescript
import {
  PROVIDER_PLANS,
  AGENT_PLANS,
  LANDLORD_PLANS,
  PLANS_BY_ROLE,
  isPriceIdAllowed,
  getPlanByPriceId,
  resolveInternalPlanId,
} from "@/lib/billing-config";
```

- [ ] **Step 3: Run tests**

Run: `cd britv3.0 && pnpm vitest run src/__tests__/lib/billing-config.test.ts 2>&1 | tail -20`
Expected: ALL PASS

- [ ] **Step 4: Update the webhook to use resolveInternalPlanId**

Add the import at the top of `src/app/api/webhooks/stripe/route.ts`:
```typescript
import { resolveInternalPlanId } from "@/lib/billing-config";
```

Then search for ALL occurrences of `plan?.nickname` in the file (there should be exactly 2 — in `checkout.session.completed` ~line 149 and `customer.subscription.updated` ~line 208). Replace each with:
```typescript
              plan_name: resolveInternalPlanId(plan?.id, plan?.nickname ?? null),
```

- [ ] **Step 5: Verify build**

Run: `cd britv3.0 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/lib/billing-config.ts src/__tests__/lib/billing-config.test.ts src/app/api/webhooks/stripe/route.ts
git commit -m "fix(billing): extract resolveInternalPlanId helper, store internal plan ID in subscriptions"
```

---

### Task 3: Create Plan Entitlements Mapping

**Files:**
- Create: `src/lib/plan-entitlements.ts`
- Create: `src/__tests__/lib/plan-entitlements.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/__tests__/lib/plan-entitlements.test.ts
import { describe, it, expect } from "vitest";
import { getEntitlementsForPlan, hasFeature, getMinimumPlanForFeature } from "@/lib/plan-entitlements";

describe("getEntitlementsForPlan", () => {
  it("provider_member gets 3 quotes but not unlimited", () => {
    const features = getEntitlementsForPlan("provider_member");
    expect(features.has("QUOTES_BASIC")).toBe(true);
    expect(features.has("QUOTES_UNLIMITED")).toBe(false);
  });

  it("provider_professional gets unlimited quotes and priority leads", () => {
    const features = getEntitlementsForPlan("provider_professional");
    expect(features.has("QUOTES_UNLIMITED")).toBe(true);
    expect(features.has("LEADS_PRIORITY")).toBe(true);
    expect(features.has("BOOKING_SYSTEM")).toBe(true);
  });

  it("provider_elite gets everything including API and white-label", () => {
    const features = getEntitlementsForPlan("provider_elite");
    expect(features.has("API_ACCESS")).toBe(true);
    expect(features.has("WHITE_LABEL")).toBe(true);
    expect(features.has("TEAM_MULTI_USER")).toBe(true);
    expect(features.has("SUPPORT_DEDICATED")).toBe(true);
  });

  it("agent_performance gets basic listings", () => {
    const features = getEntitlementsForPlan("agent_performance");
    expect(features.has("LISTINGS_25")).toBe(true);
    expect(features.has("LISTINGS_UNLIMITED")).toBe(false);
  });

  it("agent_professional gets unlimited listings and CRM", () => {
    const features = getEntitlementsForPlan("agent_professional");
    expect(features.has("LISTINGS_UNLIMITED")).toBe(true);
    expect(features.has("AGENT_CRM")).toBe(true);
  });

  it("agent_enterprise gets everything", () => {
    const features = getEntitlementsForPlan("agent_enterprise");
    expect(features.has("LISTINGS_MULTI_BRANCH")).toBe(true);
    expect(features.has("AGENT_API_ACCESS")).toBe(true);
    expect(features.has("AGENT_CUSTOM_BRANDING")).toBe(true);
  });

  it("null plan returns empty set", () => {
    const features = getEntitlementsForPlan(null);
    expect(features.size).toBe(0);
  });

  it("unknown plan returns empty set", () => {
    const features = getEntitlementsForPlan("nonexistent_plan");
    expect(features.size).toBe(0);
  });

  it("all paid plans include REFERRAL_PROGRAM", () => {
    for (const planId of [
      "provider_member",
      "provider_professional",
      "provider_elite",
      "agent_performance",
      "agent_professional",
      "agent_enterprise",
      "landlord_ess",
      "landlord_pro",
    ]) {
      expect(getEntitlementsForPlan(planId).has("REFERRAL_PROGRAM")).toBe(true);
    }
  });
});

// [ENG REVIEW 7A] — legacy plan ID alias resolution tests
describe("legacy plan ID aliases", () => {
  it("agent_basic resolves to agent_performance features", () => {
    const oldFeatures = getEntitlementsForPlan("agent_basic");
    const newFeatures = getEntitlementsForPlan("agent_performance");
    expect(oldFeatures).toEqual(newFeatures);
    expect(oldFeatures.has("LISTINGS_25")).toBe(true);
  });

  it("provider_starter resolves to provider_member features", () => {
    const oldFeatures = getEntitlementsForPlan("provider_starter");
    const newFeatures = getEntitlementsForPlan("provider_member");
    expect(oldFeatures).toEqual(newFeatures);
    expect(oldFeatures.has("QUOTES_BASIC")).toBe(true);
  });

  it("provider_growth resolves to provider_professional features", () => {
    const oldFeatures = getEntitlementsForPlan("provider_growth");
    const newFeatures = getEntitlementsForPlan("provider_professional");
    expect(oldFeatures).toEqual(newFeatures);
    expect(oldFeatures.has("QUOTES_UNLIMITED")).toBe(true);
  });
});

describe("hasFeature", () => {
  it("returns true when plan includes the feature", () => {
    expect(hasFeature("provider_elite", "API_ACCESS")).toBe(true);
  });

  it("returns false when plan does not include the feature", () => {
    expect(hasFeature("provider_member", "API_ACCESS")).toBe(false);
  });

  it("returns false for null plan", () => {
    expect(hasFeature(null, "API_ACCESS")).toBe(false);
  });
});

describe("getMinimumPlanForFeature", () => {
  it("returns provider_member for QUOTES_BASIC", () => {
    expect(getMinimumPlanForFeature("provider", "QUOTES_BASIC")).toBe("provider_member");
  });

  it("returns provider_professional for BOOKING_SYSTEM", () => {
    expect(getMinimumPlanForFeature("provider", "BOOKING_SYSTEM")).toBe("provider_professional");
  });

  it("returns provider_elite for API_ACCESS", () => {
    expect(getMinimumPlanForFeature("provider", "API_ACCESS")).toBe("provider_elite");
  });

  it("returns null for unknown feature", () => {
    expect(getMinimumPlanForFeature("provider", "NONEXISTENT" as never)).toBeNull();
  });

  it("returns agent_professional for LISTINGS_UNLIMITED", () => {
    expect(getMinimumPlanForFeature("agent", "LISTINGS_UNLIMITED")).toBe("agent_professional");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd britv3.0 && pnpm vitest run src/__tests__/lib/plan-entitlements.test.ts 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement plan-entitlements.ts**

```typescript
// src/lib/plan-entitlements.ts

/**
 * Client-safe plan → feature mapping.
 *
 * This file does NOT import "server-only" so it can be used in
 * both Server and Client Components (e.g., upgrade prompts).
 *
 * Higher tiers inherit all features from lower tiers within the same role.
 */

import type { FeatureKey } from "@/types/entitlements";

// ============================================================================
// Provider tier entitlements
// ============================================================================

const PROVIDER_MEMBER: readonly FeatureKey[] = [
  "QUOTES_BASIC",
  "LEADS_STANDARD",
  "PROFILE_BASIC",
  "ANALYTICS_BASIC",
  "SUPPORT_EMAIL",
  "REFERRAL_PROGRAM",
];

const PROVIDER_PROFESSIONAL: readonly FeatureKey[] = [
  ...PROVIDER_MEMBER,
  "QUOTES_UNLIMITED",
  "LEADS_PRIORITY",
  "PROFILE_FEATURED",
  "BOOKING_SYSTEM",
  "CRM_BASIC",
  "FOLLOW_UPS_AUTO",
  "ANALYTICS_ADVANCED",
  "SUPPORT_PRIORITY",
];

const PROVIDER_ELITE: readonly FeatureKey[] = [
  ...PROVIDER_PROFESSIONAL,
  "LEADS_FIRST_ACCESS",
  "PROFILE_PREMIUM_BADGE",
  "CRM_ADVANCED",
  "SUPPORT_DEDICATED",
  "TEAM_MULTI_USER",
  "API_ACCESS",
  "WHITE_LABEL",
  "RECRUITMENT",
];

// ============================================================================
// Agent tier entitlements
// ============================================================================

const AGENT_PERFORMANCE: readonly FeatureKey[] = [
  "LISTINGS_25",
  "SUPPORT_EMAIL",
  "REFERRAL_PROGRAM",
];

const AGENT_PROFESSIONAL: readonly FeatureKey[] = [
  ...AGENT_PERFORMANCE,
  "LISTINGS_UNLIMITED",
  "AGENT_CRM",
  "AGENT_VIEWING_CALENDAR",
  "AGENT_OFFER_MGMT",
  "SUPPORT_PRIORITY",
];

const AGENT_ENTERPRISE: readonly FeatureKey[] = [
  ...AGENT_PROFESSIONAL,
  "LISTINGS_MULTI_BRANCH",
  "AGENT_TEAM_ACCOUNTS",
  "AGENT_API_ACCESS",
  "AGENT_CUSTOM_BRANDING",
  "SUPPORT_DEDICATED",
];

// ============================================================================
// Landlord tier entitlements
// ============================================================================

const LANDLORD_ESSENTIAL: readonly FeatureKey[] = [
  "PROPERTIES_3",
  "TENANT_SCREENING_BASIC",
  "MAINTENANCE_BASIC",
  "SUPPORT_EMAIL",
  "REFERRAL_PROGRAM",
];

const LANDLORD_PROFESSIONAL: readonly FeatureKey[] = [
  ...LANDLORD_ESSENTIAL,
  "PROPERTIES_UNLIMITED",
  "TENANT_SCREENING_ADV",
  "RENT_COLLECTION",
  "MAINTENANCE_WORKFLOWS",
  "FINANCIAL_REPORTING",
  "SUPPORT_PRIORITY",
];

// ============================================================================
// Plan ID → feature set map
// ============================================================================

const PLAN_ENTITLEMENTS: Record<string, readonly FeatureKey[]> = {
  // Provider
  provider_member: PROVIDER_MEMBER,
  provider_professional: PROVIDER_PROFESSIONAL,
  provider_elite: PROVIDER_ELITE,
  // Agent
  agent_performance: AGENT_PERFORMANCE,
  agent_professional: AGENT_PROFESSIONAL,
  agent_enterprise: AGENT_ENTERPRISE,
  // Landlord
  landlord_ess: LANDLORD_ESSENTIAL,
  landlord_pro: LANDLORD_PROFESSIONAL,
};

// ============================================================================
// Legacy plan ID aliases
// [ENG REVIEW 5A] — old plan IDs from before the pricing rename.
// Existing subscription rows may still have these. Resolve to new IDs
// so entitlements work for users who subscribed before the rename.
// ============================================================================

const LEGACY_PLAN_IDS: Record<string, string> = {
  agent_basic: "agent_performance",
  agent_pro: "agent_professional",
  agent_ent: "agent_enterprise",
  provider_starter: "provider_member",
  provider_growth: "provider_professional",
};

/**
 * Get the set of features available to a given plan.
 * Returns empty set for null/unknown plans.
 * Resolves legacy plan IDs via LEGACY_PLAN_IDS alias map.
 */
export function getEntitlementsForPlan(
  planId: string | null,
): ReadonlySet<FeatureKey> {
  if (!planId) return new Set();
  const resolvedId = LEGACY_PLAN_IDS[planId] ?? planId;
  const features = PLAN_ENTITLEMENTS[resolvedId];
  if (!features) return new Set();
  return new Set(features);
}

/**
 * Check if a plan includes a specific feature.
 * Convenience wrapper around getEntitlementsForPlan.
 */
export function hasFeature(
  planId: string | null,
  feature: FeatureKey,
): boolean {
  return getEntitlementsForPlan(planId).has(feature);
}

/**
 * Get the minimum plan for a role that includes a given feature.
 * Useful for upgrade prompts: "Upgrade to [plan] to unlock [feature]".
 */
export function getMinimumPlanForFeature(
  role: "provider" | "agent" | "landlord",
  feature: FeatureKey,
): string | null {
  const rolePrefixes: Record<string, string[]> = {
    provider: ["provider_member", "provider_professional", "provider_elite"],
    agent: ["agent_performance", "agent_professional", "agent_enterprise"],
    landlord: ["landlord_ess", "landlord_pro"],
  };

  const planIds = rolePrefixes[role];
  if (!planIds) return null;

  for (const planId of planIds) {
    if (hasFeature(planId, feature)) return planId;
  }
  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd britv3.0 && pnpm vitest run src/__tests__/lib/plan-entitlements.test.ts 2>&1 | tail -20`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/plan-entitlements.ts src/__tests__/lib/plan-entitlements.test.ts
git commit -m "feat(billing): add plan entitlements mapping — plan ID to feature keys"
```

---

### Task 4: Create Entitlements Service (Server-Side)

**Files:**
- Create: `src/services/billing/entitlements-service.ts`
- Create: `src/__tests__/services/billing/entitlements-service.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/__tests__/services/billing/entitlements-service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { getUserEntitlements } from "@/services/billing/entitlements-service";

function createMockSupabase(subscriptionData: unknown) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: subscriptionData,
              error: null,
            }),
          }),
          maybeSingle: vi.fn().mockResolvedValue({
            data: subscriptionData,
            error: null,
          }),
        }),
      }),
    }),
  } as never;
}

describe("getUserEntitlements", () => {
  it("returns features for a subscribed provider_professional", async () => {
    const supabase = createMockSupabase({
      plan_name: "provider_professional",
      status: "active",
    });

    const result = await getUserEntitlements(supabase, "user-123");
    expect(result.planId).toBe("provider_professional");
    expect(result.features.has("QUOTES_UNLIMITED")).toBe(true);
    expect(result.features.has("LEADS_PRIORITY")).toBe(true);
  });

  it("returns empty features for user with no subscription", async () => {
    const supabase = createMockSupabase(null);

    const result = await getUserEntitlements(supabase, "user-456");
    expect(result.planId).toBeNull();
    expect(result.features.size).toBe(0);
  });

  it("returns empty features for cancelled subscription", async () => {
    const supabase = createMockSupabase({
      plan_name: "provider_elite",
      status: "canceled",
    });

    const result = await getUserEntitlements(supabase, "user-789");
    expect(result.planId).toBeNull();
    expect(result.features.size).toBe(0);
  });

  it("includes features for trialing subscription", async () => {
    const supabase = createMockSupabase({
      plan_name: "provider_member",
      status: "trialing",
    });

    const result = await getUserEntitlements(supabase, "user-trial");
    expect(result.planId).toBe("provider_member");
    expect(result.features.has("QUOTES_BASIC")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd britv3.0 && pnpm vitest run src/__tests__/services/billing/entitlements-service.test.ts 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement entitlements-service.ts**

```typescript
// src/services/billing/entitlements-service.ts
/**
 * Entitlements service — single source of truth for "can user X do Y?"
 *
 * Combines subscription plan data with feature entitlements.
 * Future: will also incorporate referral tier bonuses.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserEntitlements } from "@/types/entitlements";
import { getEntitlementsForPlan } from "@/lib/plan-entitlements";

const ACTIVE_STATUSES = ["active", "trialing"] as const;

/**
 * Get the full entitlements for a user based on their subscription.
 * Returns empty features if no active subscription exists.
 */
export async function getUserEntitlements(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserEntitlements> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_name, status")
    .eq("user_id", userId)
    .in("status", ACTIVE_STATUSES as unknown as string[])
    .maybeSingle();

  const sub = subscription as { plan_name: string; status: string } | null;

  if (!sub) {
    return { planId: null, planName: null, features: new Set() };
  }

  const features = getEntitlementsForPlan(sub.plan_name);

  return {
    planId: sub.plan_name,
    planName: sub.plan_name,
    features,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd britv3.0 && pnpm vitest run src/__tests__/services/billing/entitlements-service.test.ts 2>&1 | tail -20`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/billing/entitlements-service.ts src/__tests__/services/billing/entitlements-service.test.ts
git commit -m "feat(billing): add entitlements service — user subscription to feature set"
```

---

### Task 5: Rewrite Role-Aware Pricing Page

**Files:**
- Rewrite: `src/app/(main)/pricing/page.tsx`
- Modify: `src/app/(main)/pricing/layout.tsx`
- Create: `src/components/pricing/PricingTabs.tsx`
- Create: `src/components/pricing/PricingCard.tsx`
- Create: `src/components/pricing/BillingToggle.tsx`
> **[ENG REVIEW 4]** `/pricing` is already in `PUBLIC_ROUTES` in `src/lib/constants.ts` — no modification needed.

- [ ] **Step 1: Create BillingToggle component**

```typescript
// src/components/pricing/BillingToggle.tsx
"use client";

// [ENG REVIEW 6A] — savingsLabel is dynamic per-tab, computed by PricingTabs
// from actual plan prices. Avoids hardcoding "Save 2 months" which is only
// accurate for provider plans (agent/landlord save ~2.4 months).
type Props = Readonly<{
  annual: boolean;
  onToggle: (annual: boolean) => void;
  savingsLabel: string;
}>;

export function BillingToggle({ annual, onToggle, savingsLabel }: Props) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={`text-sm font-medium ${!annual ? "text-neutral-900" : "text-neutral-500"}`}
      >
        Monthly
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={annual}
        aria-label="Toggle annual billing"
        onClick={() => onToggle(!annual)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          annual ? "bg-[#1B4D3E]" : "bg-neutral-300"
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
            annual ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium ${annual ? "text-neutral-900" : "text-neutral-500"}`}
      >
        Annual
        <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
          {savingsLabel}
        </span>
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Create PricingCard component**

```typescript
// src/components/pricing/PricingCard.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type PricingCardProps = Readonly<{
  name: string;
  audience: string;
  monthlyPricePence: number;
  annualPricePence: number;
  features: readonly string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  annual: boolean;
  badge?: string;
}>;

function formatGBP(pence: number): string {
  if (pence === 0) return "Free";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(pence / 100);
}

export function PricingCard({
  name,
  audience,
  monthlyPricePence,
  annualPricePence,
  features,
  cta,
  ctaHref,
  highlighted,
  annual,
  badge,
}: PricingCardProps) {
  const displayPrice = annual
    ? Math.round(annualPricePence / 12)
    : monthlyPricePence;
  const isFree = monthlyPricePence === 0 && annualPricePence === 0;

  return (
    <div
      className={`flex flex-col rounded-xl border p-6 ${
        highlighted
          ? "border-[#1B4D3E] ring-2 ring-[#1B4D3E]/20"
          : "border-neutral-200"
      }`}
    >
      {badge && (
        <span className="mb-4 inline-flex w-fit rounded-full bg-[#1B4D3E] px-3 py-1 text-xs font-semibold text-white">
          {badge}
        </span>
      )}

      <h3 className="font-heading text-xl font-bold text-neutral-900">
        {name}
      </h3>
      <p className="mt-1 text-sm text-neutral-500">{audience}</p>

      <div className="mt-4">
        {isFree ? (
          <p className="text-3xl font-bold text-neutral-900">Free</p>
        ) : (
          <>
            <p className="text-3xl font-bold text-neutral-900">
              {formatGBP(displayPrice)}
              <span className="text-base font-normal text-neutral-500">
                /mo
              </span>
            </p>
            {annual && (
              <p className="mt-1 text-xs text-neutral-500">
                Billed annually ({formatGBP(annualPricePence)}/year)
              </p>
            )}
            {annual && annualPricePence < monthlyPricePence * 12 && (
              <p className="mt-0.5 text-xs font-medium text-green-700">
                Save {formatGBP(monthlyPricePence * 12 - annualPricePence)}
              </p>
            )}
          </>
        )}
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <svg
              className="mt-0.5 size-4 shrink-0 text-[#1B4D3E]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
            <span className="text-sm text-neutral-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        variant={highlighted ? "default" : "outline"}
        className={`mt-8 w-full ${
          highlighted ? "bg-[#1B4D3E] hover:bg-[#2D7A5F]" : ""
        }`}
      >
        <Link href={ctaHref}>{cta}</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Create PricingTabs component**

```typescript
// src/components/pricing/PricingTabs.tsx
"use client";

import { useState } from "react";
import { BillingToggle } from "./BillingToggle";
import { PricingCard } from "./PricingCard";

type PlanData = Readonly<{
  name: string;
  audience: string;
  monthlyPricePence: number;
  annualPricePence: number;
  features: readonly string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
}>;

type TabConfig = Readonly<{
  id: string;
  label: string;
  description: string;
  plans: readonly PlanData[];
}>;

type Props = Readonly<{
  tabs: readonly TabConfig[];
  defaultTab?: string;
}>;

// [ENG REVIEW 6A] — compute savings label from actual plan prices per tab
function computeSavingsLabel(plans: readonly PlanData[]): string {
  const paidPlans = plans.filter((p) => p.monthlyPricePence > 0);
  if (paidPlans.length === 0) return "";
  // Find the maximum months saved across plans in this tab
  const maxMonthsSaved = Math.max(
    ...paidPlans.map((p) => {
      const yearlyIfMonthly = p.monthlyPricePence * 12;
      const saved = yearlyIfMonthly - p.annualPricePence;
      return saved / p.monthlyPricePence;
    }),
  );
  const rounded = Math.round(maxMonthsSaved * 10) / 10;
  // Format: "Save 2 months" or "Save 2.4 months"
  return `Save ${rounded === Math.floor(rounded) ? rounded : rounded.toFixed(1)} months`;
}

export function PricingTabs({ tabs, defaultTab }: Props) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "");
  const [annual, setAnnual] = useState(false);

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];
  const savingsLabel = currentTab ? computeSavingsLabel(currentTab.plans) : "";

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Description */}
      {currentTab && (
        <p className="mx-auto mt-4 max-w-2xl text-center text-neutral-600">
          {currentTab.description}
        </p>
      )}

      {/* Billing Toggle — hide for free-only tabs */}
      {currentTab &&
        currentTab.plans.some((p) => p.monthlyPricePence > 0) && (
          <div className="mt-8">
            <BillingToggle annual={annual} onToggle={setAnnual} savingsLabel={savingsLabel} />
          </div>
        )}

      {/* Plan Cards */}
      {currentTab && (
        <div
          className={`mt-10 grid gap-6 ${
            currentTab.plans.length === 2
              ? "sm:grid-cols-2 max-w-3xl mx-auto"
              : "sm:grid-cols-3"
          }`}
        >
          {currentTab.plans.map((plan) => (
            <PricingCard key={plan.name} {...plan} annual={annual} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Rewrite the pricing page as Server Component**

> **[ENG REVIEW 1B]** The pricing page is a Server Component, so it CAN import from
> `billing-config.ts` (server-only). We derive prices and feature lists from
> `PLANS_BY_ROLE` — the single source of truth — and only add marketing-specific
> metadata (audience, cta, ctaHref, badge) as a thin overlay. This keeps prices DRY.

```typescript
// src/app/(main)/pricing/page.tsx
import { PLANS_BY_ROLE } from "@/lib/billing-config";
import type { Plan } from "@/lib/billing-config";
import { PricingTabs } from "@/components/pricing/PricingTabs";
import Link from "next/link";

// Marketing metadata that doesn't belong in billing-config.ts.
// Prices, names, and features are derived from PLANS_BY_ROLE (source of truth).
type PlanMeta = Readonly<{
  audience: string;
  cta: string;
  ctaHref: string;
  badge?: string;
}>;

const PLAN_META: Record<string, PlanMeta> = {
  // Provider plans
  provider_member: { audience: "Getting started", cta: "Request invite", ctaHref: "/register?role=service_provider" },
  provider_professional: { audience: "For growing businesses", cta: "Request invite", ctaHref: "/register?role=service_provider&plan=professional", badge: "Most Popular" },
  provider_elite: { audience: "For established firms", cta: "Request invite", ctaHref: "/register?role=service_provider&plan=elite" },
  // Agent plans
  agent_performance: { audience: "Zero risk, zero cost", cta: "Apply as founding agency", ctaHref: "/register?role=agent" },
  agent_professional: { audience: "Growing agencies", cta: "Apply as founding agency", ctaHref: "/register?role=agent&plan=professional", badge: "Most Popular" },
  agent_enterprise: { audience: "High-volume agencies", cta: "Contact sales", ctaHref: "/register?role=agent&plan=enterprise" },
  // Landlord plans
  landlord_ess: { audience: "Up to 3 properties", cta: "Start free trial", ctaHref: "/register?role=landlord" },
  landlord_pro: { audience: "Unlimited properties", cta: "Start free trial", ctaHref: "/register?role=landlord&plan=professional", badge: "Most Popular" },
};

function planToTabData(plan: Plan) {
  const meta = PLAN_META[plan.id] ?? { audience: "", cta: "Get started", ctaHref: "/register" };
  return {
    name: plan.name,
    audience: meta.audience,
    monthlyPricePence: plan.priceMonthly,
    annualPricePence: plan.priceAnnual,
    features: plan.features,
    cta: meta.cta,
    ctaHref: meta.ctaHref,
    highlighted: plan.highlighted,
    badge: meta.badge,
  };
}

const PRICING_TABS = [
  {
    id: "homeowners",
    label: "Homeowners",
    description:
      "Free forever for homebuyers and renters. Search properties, get AI recommendations, and book viewings.",
    plans: [
      {
        name: "Free",
        audience: "Homebuyers & Renters",
        monthlyPricePence: 0,
        annualPricePence: 0,
        features: [
          "Property search & saved searches",
          "AI-powered recommendations",
          "Viewing bookings",
          "Transaction tracking",
          "Marketplace access",
          "Move-in service bundles",
        ],
        cta: "Sign up free",
        ctaHref: "/register",
      },
    ],
  },
  {
    id: "tradespeople",
    label: "Tradespeople",
    description:
      "Join Britain's most trusted trade network. Invite-only membership with verified leads.",
    plans: PLANS_BY_ROLE.provider.map(planToTabData),
  },
  {
    id: "agents",
    label: "Estate Agents",
    description:
      "Zero upfront costs. We only earn when you earn — performance-based pricing.",
    plans: PLANS_BY_ROLE.agent.map(planToTabData),
  },
  {
    id: "landlords",
    label: "Landlords",
    description:
      "Manage your rental portfolio with professional tools and tenant screening.",
    plans: PLANS_BY_ROLE.landlord.map(planToTabData),
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          Free for homeowners. Performance-based for agents. Membership-based
          for tradespeople.
        </p>
      </div>

      <div className="mt-10">
        <PricingTabs tabs={PRICING_TABS} defaultTab="tradespeople" />
      </div>

      <p className="mt-16 text-center text-sm text-neutral-500">
        Have questions?{" "}
        <Link
          href="/contact"
          className="text-[#1B4D3E] underline-offset-4 hover:underline"
        >
          Contact our sales team
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Update pricing layout metadata**

Replace the metadata in `src/app/(main)/pricing/layout.tsx`:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Britestate",
  description:
    "Free for homeowners. Tradespeople from £47/month. Estate agents pay nothing upfront — performance-based pricing.",
};

export default function PricingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
```

- [ ] **Step 7: Build check**

Run: `cd britv3.0 && pnpm build 2>&1 | tail -30`
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add src/app/\(main\)/pricing/ src/components/pricing/
git commit -m "feat(pricing): rewrite pricing page with role-aware tabs — derives prices from billing-config (DRY)"
```

---

### Task 6: Create Upgrade Prompt Component

**Files:**
- Create: `src/components/billing/UpgradePrompt.tsx`

- [ ] **Step 1: Create the contextual upgrade prompt component**

```typescript
// src/components/billing/UpgradePrompt.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { FeatureKey } from "@/types/entitlements";

/**
 * Human-readable labels for features shown in upgrade prompts.
 */
const FEATURE_LABELS: Partial<Record<FeatureKey, string>> = {
  QUOTES_UNLIMITED: "unlimited quote responses",
  LEADS_PRIORITY: "priority lead matching",
  BOOKING_SYSTEM: "integrated booking",
  CRM_BASIC: "CRM tools",
  ANALYTICS_ADVANCED: "advanced analytics",
  API_ACCESS: "API access",
  TEAM_MULTI_USER: "team accounts",
  WHITE_LABEL: "white-label portal",
  LISTINGS_UNLIMITED: "unlimited listings",
  AGENT_CRM: "full CRM suite",
  AGENT_VIEWING_CALENDAR: "viewing calendar",
  PROPERTIES_UNLIMITED: "unlimited properties",
  RENT_COLLECTION: "rent collection tools",
};

// [ENG REVIEW 2B] — planDisplayName is passed as a prop from the server-side
// parent, which resolves it from billing-config.ts. This avoids hardcoding
// prices in a client component (DRY — prices live in one place).
type Props = Readonly<{
  feature: FeatureKey;
  requiredPlanId: string;
  planDisplayName: string;
  role: string;
  message?: string;
}>;

export function UpgradePrompt({ feature, planDisplayName, role, message }: Props) {
  const featureLabel = FEATURE_LABELS[feature] ?? feature.toLowerCase().replace(/_/g, " ");
  const billingUrl = `/dashboard/${role}/billing/checkout/subscription`;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-amber-100">
        <svg
          className="size-6 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-neutral-900">
        Upgrade to unlock {featureLabel}
      </h3>
      <p className="mt-2 max-w-md text-sm text-neutral-600">
        {message ??
          `This feature is available on the ${planDisplayName} plan. Upgrade to get access to ${featureLabel} and more.`}
      </p>
      <Button asChild className="mt-6 bg-[#1B4D3E] hover:bg-[#2D7A5F]">
        <Link href={billingUrl}>Upgrade to {planDisplayName}</Link>
      </Button>
      <Link
        href="/pricing"
        className="mt-3 text-xs text-neutral-500 underline-offset-4 hover:underline"
      >
        Compare all plans
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Write unit test for UpgradePrompt**

```typescript
// src/__tests__/components/billing/UpgradePrompt.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";

// Mock next/link to render as a plain anchor
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("UpgradePrompt", () => {
  it("renders feature label and plan display name", () => {
    render(
      <UpgradePrompt
        feature="API_ACCESS"
        requiredPlanId="provider_elite"
        planDisplayName="Elite (£197/mo)"
        role="provider"
      />,
    );
    expect(screen.getByText(/upgrade to unlock api access/i)).toBeInTheDocument();
    expect(screen.getByText(/Elite \(£197\/mo\)/)).toBeInTheDocument();
  });

  it("links to billing page for the correct role", () => {
    render(
      <UpgradePrompt
        feature="LISTINGS_UNLIMITED"
        requiredPlanId="agent_professional"
        planDisplayName="Professional (£297/mo)"
        role="agent"
      />,
    );
    const upgradeLink = screen.getByRole("link", { name: /upgrade to/i });
    expect(upgradeLink).toHaveAttribute("href", "/dashboard/agent/billing/checkout/subscription");
  });

  it("includes compare plans link", () => {
    render(
      <UpgradePrompt
        feature="QUOTES_UNLIMITED"
        requiredPlanId="provider_professional"
        planDisplayName="Professional (£97/mo)"
        role="provider"
      />,
    );
    expect(screen.getByRole("link", { name: /compare all plans/i })).toHaveAttribute("href", "/pricing");
  });
});
```

- [ ] **Step 3: Run test**

Run: `cd britv3.0 && pnpm vitest run src/__tests__/components/billing/UpgradePrompt.test.tsx 2>&1 | tail -20`
Expected: ALL PASS

- [ ] **Step 4: Build check**

Run: `cd britv3.0 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/components/billing/UpgradePrompt.tsx src/__tests__/components/billing/UpgradePrompt.test.tsx
git commit -m "feat(billing): add contextual UpgradePrompt component with unit tests"
```

---

### Task 7: Extend Middleware with Granular Feature Gating

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Update the middleware feature gating block**

The existing middleware (lines 197-234) already has subscription gating. We enhance it to exempt the referrals page (needed for sharing referral links without a subscription) and clean up the unused `BILLING_EXEMPT_SUFFIXES` constant.

Replace the feature gate block (lines 197-234) in `src/middleware.ts` with:

```typescript
  // Feature gate: subscription check for billing-gated routes
  // Routes under /dashboard/agent, /dashboard/landlord, /dashboard/provider
  // require an active subscription. Billing pages themselves are exempt.
  // Exempt: billing pages, main dashboard overview, referrals page
  const SUBSCRIPTION_GATED_PREFIXES = [
    "/dashboard/agent",
    "/dashboard/landlord",
    "/dashboard/provider",
  ];

  if (isAuthenticated) {
    const isGatedRoute = SUBSCRIPTION_GATED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    );
    const isBillingPage =
      pathname.includes("/billing") || pathname === "/dashboard";
    // Allow referrals page without subscription (needed to share referral links)
    const isReferralsPage = pathname.includes("/referrals");

    if (isGatedRoute && !isBillingPage && !isReferralsPage) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, plan_name")
        .eq("user_id", user!.id)
        .maybeSingle();

      const sub = subscription as { status?: string; plan_name?: string } | null;
      const isActive = sub?.status === "active" || sub?.status === "trialing";

      if (!isActive) {
        // Determine the role for the billing redirect
        const roleMatch = pathname.match(/^\/dashboard\/(agent|landlord|provider)/);
        const role = roleMatch?.[1] ?? "agent";
        const billingUrl = new URL(`/dashboard/${role}/billing/checkout/subscription`, request.url);
        const redirectResponse = NextResponse.redirect(billingUrl);
        setSecurityHeaders(redirectResponse, nonce);
        return redirectResponse;
      }

    }
  }
```

- [ ] **Step 2: Build check**

Run: `cd britv3.0 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(billing): extend middleware with plan header and referrals exemption"
```

---

### Task 8: E2E Test for Pricing Page

**Files:**
- Create: `tests/e2e/pricing-page.spec.ts`

- [ ] **Step 1: Write E2E test**

```typescript
// tests/e2e/pricing-page.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Pricing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  test("displays page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /simple, transparent pricing/i }),
    ).toBeVisible();
  });

  test("shows 4 role tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: /homeowners/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /tradespeople/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /estate agents/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /landlords/i })).toBeVisible();
  });

  test("defaults to tradespeople tab", async ({ page }) => {
    // Should see Member, Professional, Elite pricing
    await expect(page.getByRole("heading", { name: "Member" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Professional" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Elite" })).toBeVisible();
  });

  test("shows correct tradesperson prices", async ({ page }) => {
    await expect(page.getByText("£47")).toBeVisible();
    await expect(page.getByText("£97")).toBeVisible();
    await expect(page.getByText("£197")).toBeVisible();
  });

  test("switching to agents tab shows agent pricing", async ({ page }) => {
    await page.getByRole("button", { name: /estate agents/i }).click();
    await expect(page.getByRole("heading", { name: "Performance" })).toBeVisible();
    await expect(page.getByText("Free")).toBeVisible();
    await expect(page.getByText("£297")).toBeVisible();
    await expect(page.getByText("£497")).toBeVisible();
  });

  test("switching to homeowners tab shows free plan only", async ({ page }) => {
    await page.getByRole("button", { name: /homeowners/i }).click();
    await expect(page.getByText("Free")).toBeVisible();
    // Should NOT show billing toggle (all plans are free)
    await expect(page.getByRole("switch")).not.toBeVisible();
  });

  test("billing toggle switches to annual prices", async ({ page }) => {
    // Default tab is tradespeople
    const toggle = page.getByRole("switch", { name: /toggle annual/i });
    await toggle.click();
    // Should show annual pricing text
    await expect(page.getByText(/billed annually/i).first()).toBeVisible();
    await expect(page.getByText(/save/i).first()).toBeVisible();
  });

  test("landlords tab shows 2 plan cards", async ({ page }) => {
    await page.getByRole("button", { name: /landlords/i }).click();
    await expect(page.getByRole("heading", { name: "Essential" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Professional" })).toBeVisible();
  });

  test("CTA buttons link to registration with role", async ({ page }) => {
    // On tradespeople tab, the Member CTA should point to register
    const memberCta = page.getByRole("link", { name: /request invite/i }).first();
    await expect(memberCta).toHaveAttribute("href", /role=service_provider/);
  });
});

// [ENG REVIEW 10A] — middleware referrals exemption test
test.describe("Middleware referrals exemption", () => {
  test("referrals page is accessible without subscription", async ({ page }) => {
    // Navigate to a referrals page — middleware should NOT redirect to billing
    // even if the user has no active subscription. This verifies the
    // isReferralsPage exemption added in Task 7.
    const response = await page.goto("/dashboard/provider/referrals");
    // Should not be redirected to billing checkout
    expect(page.url()).not.toContain("/billing/checkout");
    // The response should be 200 (page exists) or 401/redirect to login (no auth),
    // but NOT a redirect to billing. If the user is not authenticated at all,
    // they'd be redirected to login, which is fine — the point is no billing redirect.
    if (response) {
      expect(response.status()).not.toBe(307); // 307 is the billing redirect
    }
  });
});
```

- [ ] **Step 2: Run E2E test**

Run: `cd britv3.0 && npx playwright test tests/e2e/pricing-page.spec.ts --reporter=line 2>&1 | tail -30`
Expected: ALL PASS (or reasonable failures to fix)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/pricing-page.spec.ts
git commit -m "test(e2e): add pricing page E2E tests — role tabs, prices, billing toggle"
```

---

### Task 9: Final Verification

- [ ] **Step 1: Run full lint**

Run: `cd britv3.0 && pnpm lint 2>&1 | tail -20`
Expected: No new lint errors

- [ ] **Step 2: Run full build**

Run: `cd britv3.0 && pnpm build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: Run all unit tests**

Run: `cd britv3.0 && pnpm vitest run 2>&1 | tail -30`
Expected: ALL PASS

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "chore: fix lint and build issues from Wave 1 pricing foundation"
```

---

### Task 10: Update TODOS.md

> These TODOs were identified during the engineering review and approved for deferral.

- [ ] **Step 1: Add the following TODOs to TODOS.md**

```markdown
## Wave 1 Pricing Foundation — Deferred TODOs

### Error logging in getUserEntitlements
**What:** Add error logging when the Supabase query in `getUserEntitlements` fails.
**Why:** Currently returns empty entitlements silently on DB errors — indistinguishable from "no subscription". A console.error or Sentry breadcrumb would make outages debuggable.
**Depends on:** Sentry integration (if available). Can use console.error as interim.
**Where to start:** `src/services/billing/entitlements-service.ts` — wrap the Supabase query in try/catch.

### Quota enforcement for feature limits
**What:** Add usage tracking + enforcement for quantitative limits (3 quotes/month, 25 listings, etc).
**Why:** Entitlements are currently boolean (has/doesn't have), not quantitative. The "3 quotes" in QUOTES_BASIC is display text only — nothing enforces the count.
**Depends on:** Quote and listing features being built. Requires a `usage_counts` table.
**Where to start:** Add `getFeatureLimit(planId, feature): number | 'unlimited'` to `plan-entitlements.ts`. Build enforcement layer when quote/listing features land.

### Env var rename coordination
**What:** Document the full old → new env var mapping for the plan ID rename.
**Why:** billing-config.ts changed env var names (STRIPE_AGENT_BASIC_PRICE_ID → STRIPE_AGENT_PERF_PRICE_ID, etc). All deployment environments need simultaneous update.
**Mapping:**
- `STRIPE_AGENT_BASIC_PRICE_ID` → `STRIPE_AGENT_PERF_PRICE_ID`
- `STRIPE_AGENT_BASIC_ANNUAL_PRICE_ID` → `STRIPE_AGENT_PERF_ANNUAL_PRICE_ID`
- `STRIPE_PROVIDER_STARTER_PRICE_ID` → `STRIPE_PROVIDER_MEMBER_PRICE_ID`
- `STRIPE_PROVIDER_STARTER_ANNUAL_PRICE_ID` → `STRIPE_PROVIDER_MEMBER_ANNUAL_PRICE_ID`
- `STRIPE_PROVIDER_GROWTH_PRICE_ID` → `STRIPE_PROVIDER_PRO_PRICE_ID`
- `STRIPE_PROVIDER_GROWTH_ANNUAL_PRICE_ID` → `STRIPE_PROVIDER_PRO_ANNUAL_PRICE_ID`
- NEW: `STRIPE_PROVIDER_ELITE_PRICE_ID`, `STRIPE_PROVIDER_ELITE_ANNUAL_PRICE_ID`
**Where to start:** Update `.env.example`, Vercel project settings, and any staging env configs.

### Stripe $0 subscription manual verification
**What:** Manually verify in Stripe test mode that a £0 price ID creates a real subscription.
**Why:** The agent Performance plan is £0. If Stripe doesn't fire `checkout.session.completed` for $0, the user gets no subscription row and middleware blocks their dashboard.
**Verify:** (1) $0 checkout creates a subscription object, (2) webhook fires, (3) row created with status='active'.
**Depends on:** Stripe test mode price IDs being configured.

### /api/billing/plans response shape change
**What:** Document that the public `/api/billing/plans` API response changes with new plan names and prices.
**Why:** Any consumers of this API (future mobile app, external docs, partner integrations) need to handle the new plan structure.
**Where to start:** The endpoint auto-updates from PLANS_BY_ROLE — no code change needed. Document the breaking change in API changelog if one exists.
```

- [ ] **Step 2: Commit**

```bash
git add TODOS.md
git commit -m "docs: add Wave 1 pricing deferred TODOs from engineering review"
```
