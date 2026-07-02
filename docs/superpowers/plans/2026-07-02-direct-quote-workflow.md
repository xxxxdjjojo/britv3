# Direct-to-Trader Quote Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "Get a quote" on any trader surface opens a targeted quote form in one click, submits into the unified RFQ pipeline visible ONLY to that trader, notifies him, and notifies the homeowner when his quote arrives.

**Architecture:** Reuse the existing `service_requests` → `quotes` → accept → booking pipeline. Make `target_provider_id` (added decorative in PR #146) enforced at RLS + every query + notification fan-out. Rework `QuoteModal` to submit into `/api/rfq/create` (guest branch via service-role) instead of the dead `provider_leads` table. Consume the `?intent=quote` param on the profile to auto-open the modal.

**Tech Stack:** Next.js 16 App Router, Supabase (RLS, migrations), Zod, Inngest, Vitest, Playwright. Worktree: `/Users/jojominime/Documents/britv3main/wt-direct-quote`, branch `feat/direct-quote-workflow`.

**Spec:** `docs/superpowers/specs/2026-07-02-direct-quote-workflow-design.md`

**Load-bearing facts (verified against this branch):**
- `service_provider_details` PK is `user_id` — there is **no `id` column**. `ServiceProviderPublicProfile.id` is a phantom (undefined at runtime). Always use `provider.user_id`. `target_provider_id` references `service_provider_details.user_id`.
- `rfqCreateSchema` already accepts `source`/`target_provider_id`/`listing_id` (`src/lib/validators/marketplace-schemas.ts:127-129`); `createRfq` already inserts them (`src/services/marketplace/rfq-service.ts:62-64`). Columns exist via `supabase/migrations/20260630210216_local_experts_for_property.sql:161-164` (already applied to prod).
- RFQ validation requires: title ≥10 chars, description ≥50 chars, valid UK postcode, category enum. The current modal has NO postcode field and only 20-char description min — the modal must gain a postcode field, 50-char min, and category values (enum, not display strings).
- `createPlatformEvent` (`src/services/notifications/notification-service.ts:51`) fires `sendCriticalEmail` for `quote_received`, but `dispatchCriticalEmail` (:278) only resolves recipients for `maintenance_request` and conversation entities — an `rfq` branch must be added, and `getUserEntityIds` (:222) does not include `service_requests` so the feed would not show it — must be added.
- Tests: Vitest, `pnpm test` from repo root; run a single file with `pnpm vitest run <path>`. Commit style: Conventional Commits, no attribution footer.
- All commands run in `/Users/jojominime/Documents/britv3main/wt-direct-quote`.

---

## Task 1: Migration — guest contact columns, nullable user_id, targeted RLS

**Files:**
- Create: `supabase/migrations/<generated>_direct_quote_targeting.sql` (use `supabase migration new direct_quote_targeting` to generate the timestamp; NEVER hand-pick)

- [ ] **Step 1: Generate the migration file**

Run: `supabase migration new direct_quote_targeting`
Expected: creates `supabase/migrations/20260702XXXXXX_direct_quote_targeting.sql`

- [ ] **Step 2: Write the migration**

```sql
-- ===========================================================================
-- Direct-to-trader quote requests: make target_provider_id ENFORCED and
-- support guest (logged-out) submissions.
--
-- 1. Guest contact columns + nullable user_id (guests have no account).
-- 2. RLS: a targeted RFQ is visible ONLY to its target provider; broadcast
--    RFQs (target_provider_id IS NULL) keep existing visibility.
-- 3. FK + index for target_provider_id (added bare in 20260630210216).
-- ===========================================================================

-- 1. Guest support -----------------------------------------------------------
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;

ALTER TABLE public.service_requests
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_owner_or_guest_check;
ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_owner_or_guest_check
  CHECK (user_id IS NOT NULL OR contact_email IS NOT NULL);

COMMENT ON COLUMN public.service_requests.contact_email IS
  'Guest submissions only (user_id IS NULL): where quotes are emailed.';

-- 2. Targeting integrity -----------------------------------------------------
ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_target_provider_fk;
ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_target_provider_fk
  FOREIGN KEY (target_provider_id)
  REFERENCES public.service_provider_details(user_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS service_requests_target_provider_idx
  ON public.service_requests (target_provider_id)
  WHERE target_provider_id IS NOT NULL;

-- 3. RLS: targeted RFQs visible only to their target provider ----------------
DROP POLICY IF EXISTS "Verified providers can view open RFQs"
  ON public.service_requests;
CREATE POLICY "Verified providers can view open RFQs"
  ON public.service_requests FOR SELECT
  TO authenticated
  USING (
    status = 'open'
    AND (target_provider_id IS NULL OR target_provider_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.provider_verification_status = 'verified'
    )
  );
```

**IMPORTANT:** Before writing, read the original policy body in `supabase/migrations/002_marketplace.sql:715-724` and reproduce its verification predicate EXACTLY (the block above is the expected shape — if the original differs, e.g. checks a different column, keep the original predicate and only add the `target_provider_id` conjunct). Guest rows (`user_id IS NULL`) are inserted via service-role only — no anon INSERT policy is added, and the "Users can manage own RFQs" policy is untouched (`user_id = auth.uid()` is simply false for NULL).

- [ ] **Step 3: Verify migration hygiene**

Run: `pnpm check:migrations`
Expected: PASS (no colliding prefixes)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(marketplace): migration for enforced RFQ targeting + guest contact columns"
```

*(Applying to prod happens in Task 10, after CI is green.)*

---

## Task 2: Schemas — guest RFQ schema (red → green)

**Files:**
- Modify: `src/lib/validators/marketplace-schemas.ts:104-159`
- Test: `src/__tests__/marketplace/rfq-guest-schema.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import {
  rfqCreateSchema,
  rfqGuestCreateSchema,
} from "@/lib/validators/marketplace-schemas";

const VALID_BASE = {
  service_category: "plumber",
  title: "Fix leaking kitchen tap",
  description:
    "The kitchen mixer tap has been dripping constantly for a week and the base is now leaking into the cupboard below.",
  property_postcode: "SW1A 1AA",
  urgency_level: "normal",
  target_provider_id: "123e4567-e89b-12d3-a456-426614174000",
  source: "trader_profile_modal",
};

describe("rfqGuestCreateSchema", () => {
  it("accepts a valid guest submission with contact details", () => {
    const result = rfqGuestCreateSchema.safeParse({
      ...VALID_BASE,
      contact_name: "Jane Smith",
      contact_email: "jane@example.com",
      contact_phone: "+44 7700 900000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a guest submission without an email", () => {
    const result = rfqGuestCreateSchema.safeParse({
      ...VALID_BASE,
      contact_name: "Jane Smith",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = rfqGuestCreateSchema.safeParse({
      ...VALID_BASE,
      contact_name: "Jane Smith",
      contact_email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("still enforces base RFQ rules (budget ordering)", () => {
    const result = rfqGuestCreateSchema.safeParse({
      ...VALID_BASE,
      contact_name: "Jane Smith",
      contact_email: "jane@example.com",
      budget_min: 500,
      budget_max: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe("rfqCreateSchema (unchanged behaviour)", () => {
  it("still accepts a valid authed submission", () => {
    expect(rfqCreateSchema.safeParse(VALID_BASE).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/__tests__/marketplace/rfq-guest-schema.test.ts`
Expected: FAIL — `rfqGuestCreateSchema` is not exported.

- [ ] **Step 3: Implement**

In `marketplace-schemas.ts`, restructure the RFQ schema: the current `rfqCreateSchema` is `z.object({...}).refine(...).refine(...)` — a ZodEffects that cannot be `.extend()`ed. Extract the inner object, keep both refines as a shared helper:

```typescript
/** RFQ (service request) creation form — base object (pre-refinement) */
const rfqCreateBaseSchema = z.object({
  service_category: z.enum(SERVICE_CATEGORIES),
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description must be at most 5000 characters"),
  property_address: z.string().optional(),
  property_postcode: z
    .string()
    .regex(UK_POSTCODE_REGEX, "Enter a valid UK postcode"),
  preferred_start_date: z.coerce.date().optional(),
  urgency_level: z
    .enum(["low", "normal", "high", "emergency"])
    .default("normal"),
  budget_min: z.number().min(0).optional(),
  budget_max: z.number().min(0).optional(),
  // Attribution (e.g. launched from the property page's local traders section).
  source: z.string().max(80).optional(),
  target_provider_id: z.string().regex(UUID_REGEX, "Invalid provider id").optional(),
  listing_id: z.string().regex(UUID_REGEX, "Invalid listing id").optional(),
});

function withRfqRefinements<T extends typeof rfqCreateBaseSchema | ReturnType<typeof rfqCreateBaseSchema.extend>>(
  schema: T,
) {
  return schema
    .refine(
      (data) => {
        if (data.budget_min != null && data.budget_max != null) {
          return data.budget_max >= data.budget_min;
        }
        return true;
      },
      {
        message: "Maximum budget must be greater than or equal to minimum",
        path: ["budget_max"],
      },
    )
    .refine(
      (data) => {
        if (data.preferred_start_date) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return data.preferred_start_date >= today;
        }
        return true;
      },
      {
        message: "Preferred start date cannot be in the past",
        path: ["preferred_start_date"],
      },
    );
}

export const rfqCreateSchema = withRfqRefinements(rfqCreateBaseSchema);
export type RfqCreateInput = z.infer<typeof rfqCreateSchema>;

/** Guest (logged-out) RFQ submission — base fields + contact details */
export const rfqGuestCreateSchema = withRfqRefinements(
  rfqCreateBaseSchema.extend({
    contact_name: z
      .string()
      .min(2, "Enter your full name")
      .max(100),
    contact_email: z.string().email("Enter a valid email address"),
    contact_phone: z.string().max(30).optional(),
  }),
);
export type RfqGuestCreateInput = z.infer<typeof rfqGuestCreateSchema>;
```

If the generic `withRfqRefinements` fights the type-checker, duplicate the two `.refine()` chains on each schema literally — working duplication beats a clever generic.

- [ ] **Step 4: Run tests to verify pass, plus the pre-existing marketplace schema tests**

Run: `pnpm vitest run src/__tests__/marketplace/rfq-guest-schema.test.ts && pnpm vitest run src/__tests__ --dir src/__tests__/marketplace 2>/dev/null || pnpm vitest run src/__tests__/marketplace`
Expected: PASS, and no regressions in existing marketplace tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators/marketplace-schemas.ts src/__tests__/marketplace/rfq-guest-schema.test.ts
git commit -m "feat(marketplace): guest RFQ schema with contact details"
```

---

## Task 3: Service layer — createGuestRfq + targeted distribution filters (red → green)

**Files:**
- Modify: `src/services/marketplace/rfq-service.ts` (add `createGuestRfq`; modify `listProviderMatchedRfqs:150-182` and `matchProvidersForRfq:196-296`)
- Modify: `src/services/provider/provider-job-service.ts:197-294` (`getProviderLeads`) and its `ProviderLead` type (same file, near top — find `type ProviderLead` / exported type)
- Test: `src/__tests__/marketplace/rfq-targeting.test.ts` (create)

Follow the existing supabase-mock style used in `src/__tests__` marketplace/provider service tests (chainable query builder mocks). The test below uses a minimal chainable mock; adapt to the codebase's established mock helper if one exists (search `src/__tests__` for `mockSupabase` first and reuse it).

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock inngest + geocoding so createGuestRfq is unit-testable
vi.mock("@/inngest/client", () => ({
  inngest: { send: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("@/services/geocoding/postcodes-io", () => ({
  geocodePostcode: vi.fn().mockResolvedValue({ longitude: -0.1, latitude: 51.5 }),
}));

import {
  createGuestRfq,
  listProviderMatchedRfqs,
  matchProvidersForRfq,
} from "@/services/marketplace/rfq-service";

/** Chainable supabase query mock that records calls and resolves `result`. */
function chainMock(result: unknown) {
  const chain: Record<string, unknown> = {};
  const handler = vi.fn(() => chain);
  for (const m of [
    "select", "insert", "update", "eq", "in", "is", "or", "not",
    "gte", "gt", "contains", "order", "range", "limit",
  ]) {
    chain[m] = handler;
  }
  chain.single = vi.fn().mockResolvedValue(result);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return { chain, handler };
}

const GUEST_INPUT = {
  service_category: "plumber",
  title: "Fix leaking kitchen tap",
  description:
    "The kitchen mixer tap has been dripping constantly for a week and the base is now leaking into the cupboard below.",
  property_postcode: "SW1A 1AA",
  urgency_level: "normal" as const,
  target_provider_id: "123e4567-e89b-12d3-a456-426614174000",
  source: "trader_profile_modal",
  contact_name: "Jane Smith",
  contact_email: "jane@example.com",
};

describe("createGuestRfq", () => {
  it("inserts with null user_id and guest contact fields", async () => {
    const inserted: Record<string, unknown>[] = [];
    const { chain } = chainMock({ data: { id: "rfq-1" }, error: null });
    (chain.insert as ReturnType<typeof vi.fn>).mockImplementation(
      (row: Record<string, unknown>) => {
        inserted.push(row);
        return chain;
      },
    );
    const supabase = { from: vi.fn(() => chain) };

    await createGuestRfq(supabase as never, GUEST_INPUT);

    expect(inserted[0]).toMatchObject({
      user_id: null,
      contact_name: "Jane Smith",
      contact_email: "jane@example.com",
      target_provider_id: GUEST_INPUT.target_provider_id,
      source: "trader_profile_modal",
      status: "open",
    });
  });
});

describe("listProviderMatchedRfqs targeting filter", () => {
  it("applies an or-filter limiting to broadcast or own-targeted RFQs", async () => {
    const providerChain = chainMock({
      data: { services: ["plumber"] },
      error: null,
    });
    const rfqCalls: unknown[][] = [];
    const rfqChain = chainMock({ data: [], error: null, count: 0 });
    (rfqChain.chain.or as ReturnType<typeof vi.fn>).mockImplementation(
      (...args: unknown[]) => {
        rfqCalls.push(args);
        return rfqChain.chain;
      },
    );
    const supabase = {
      from: vi.fn((table: string) =>
        table === "service_provider_details" ? providerChain.chain : rfqChain.chain,
      ),
    };

    await listProviderMatchedRfqs(supabase as never, "provider-1");

    expect(rfqCalls.flat().join(" ")).toContain("target_provider_id.is.null");
    expect(rfqCalls.flat().join(" ")).toContain("target_provider_id.eq.provider-1");
  });
});

describe("matchProvidersForRfq targeted short-circuit", () => {
  it("returns only the target provider for a targeted RFQ", async () => {
    const rfqChain = chainMock({
      data: {
        id: "rfq-1",
        service_category: "plumber",
        property_postcode: "SW1A 1AA",
        target_provider_id: "target-provider-uuid",
      },
      error: null,
    });
    const targetChain = chainMock({
      data: { user_id: "target-provider-uuid", business_name: "Richards Plumbing" },
      error: null,
    });
    let call = 0;
    const supabase = {
      from: vi.fn(() => (call++ === 0 ? rfqChain.chain : targetChain.chain)),
    };

    const matched = await matchProvidersForRfq(supabase as never, "rfq-1");

    expect(matched).toHaveLength(1);
    expect(matched[0].user_id).toBe("target-provider-uuid");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/__tests__/marketplace/rfq-targeting.test.ts`
Expected: FAIL — `createGuestRfq` not exported; or-filter/short-circuit missing.

- [ ] **Step 3: Implement in `rfq-service.ts`**

Add `createGuestRfq` after `createRfq` (mirror its body — the only differences are the schema, `user_id: null`, and the contact columns):

```typescript
import type { RfqGuestCreateInput } from "@/lib/validators/marketplace-schemas";
import { rfqGuestCreateSchema } from "@/lib/validators/marketplace-schemas";

/**
 * Create an RFQ on behalf of a logged-out guest.
 * MUST be called with the service-role (admin) client — there is deliberately
 * no anon INSERT policy on service_requests. Quotes reach the guest by email.
 */
export async function createGuestRfq(
  supabase: SupabaseClient,
  data: RfqGuestCreateInput,
): Promise<ServiceRequest> {
  const parsed = rfqGuestCreateSchema.parse(data);

  const geo = await geocodePostcode(parsed.property_postcode);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_EXPIRY_DAYS);

  const { data: rfq, error } = await supabase
    .from("service_requests")
    .insert({
      user_id: null,
      contact_name: parsed.contact_name,
      contact_email: parsed.contact_email,
      contact_phone: parsed.contact_phone ?? null,
      service_category: parsed.service_category,
      title: parsed.title,
      description: parsed.description,
      property_address: parsed.property_address ?? null,
      property_postcode: parsed.property_postcode,
      property_location: geo
        ? `POINT(${geo.longitude} ${geo.latitude})`
        : null,
      preferred_start_date: parsed.preferred_start_date?.toISOString() ?? null,
      urgency_level: parsed.urgency_level,
      budget_min: parsed.budget_min ?? null,
      budget_max: parsed.budget_max ?? null,
      source: parsed.source ?? null,
      target_provider_id: parsed.target_provider_id ?? null,
      listing_id: parsed.listing_id ?? null,
      attachments: [],
      status: "open" as const,
      expires_at: expiresAt.toISOString(),
      view_count: 0,
      quote_count: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create guest RFQ: ${error.message}`);
  }

  await inngest.send({
    name: "marketplace/rfq.created",
    data: { rfqId: rfq.id },
  });

  return rfq as ServiceRequest;
}
```

In `listProviderMatchedRfqs`, add the targeting filter to the query (after `.in(...)`):

```typescript
  const { data, error, count } = await supabase
    .from("service_requests")
    .select("*", { count: "exact" })
    .eq("status", "open")
    .in("service_category", categories)
    .or(`target_provider_id.is.null,target_provider_id.eq.${providerId}`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
```

In `matchProvidersForRfq`, add the short-circuit immediately after the RFQ load (before the broadcast provider query):

```typescript
  // Targeted RFQ: the buyer chose a specific trader — notify ONLY them.
  if (rfq.target_provider_id) {
    const { data: target } = await supabase
      .from("service_provider_details")
      .select("user_id, business_name")
      .eq("user_id", rfq.target_provider_id)
      .single();

    if (!target) return [];
    return [
      {
        user_id: target.user_id as string,
        business_name: target.business_name as string,
        score: SCORE_CATEGORY_MATCH + SCORE_POSTCODE_OVERLAP + SCORE_PROXIMITY,
      },
    ];
  }
```

- [ ] **Step 4: Implement `getProviderLeads` targeting in `provider-job-service.ts`**

Find the exported `ProviderLead` type in the same file and add `isDirect: boolean;` to it. Then in `getProviderLeads`:

Replace the query section (step 3 in the function, lines ~227-246) — targeted-at-me leads must appear regardless of the 48h window and regardless of category filter, everyone else's targeted leads must never appear:

```typescript
    // 3. Query open service_requests matching provider's categories.
    //    Broadcast leads (no target) respect the 48h freshness window;
    //    leads targeted at THIS provider always show; leads targeted at
    //    another provider never show.
    let query = supabase
      .from("service_requests")
      .select(
        `
        id,
        service_category,
        title,
        description,
        budget_min,
        budget_max,
        property_postcode,
        urgency_level,
        status,
        created_at,
        target_provider_id
      `,
      )
      .eq("status", "open")
      .in("service_category", services)
      .or(
        `and(target_provider_id.is.null,created_at.gte.${cutoff}),target_provider_id.eq.${providerId}`,
      )
      .order("created_at", { ascending: false });
```

(Remove the old standalone `.gte("created_at", cutoff)` — it moved inside the or-branch.)

In the row-mapping (step 4), add the flag:

```typescript
        return {
          id: row["id"] as string,
          clientName: "Client",
          serviceCategory: row["service_category"] as string,
          title: (row["title"] as string | null) ?? "",
          description: (row["description"] as string | null) ?? "",
          location: postcode,
          inServiceArea:
            serviceAreas.size > 0 && serviceAreas.has(outwardCode(postcode)),
          isDirect: row["target_provider_id"] === providerId,
          status: "new",
          budgetMinPence: toPence(row["budget_min"] as number | null),
          budgetMaxPence: toPence(row["budget_max"] as number | null),
          createdAt,
          expiresAt,
        };
```

And re-order the final return so direct requests lead:

```typescript
    // 5. Direct requests first, then in-area, then the rest (recency within each)
    return [
      ...leads.filter((l) => l.isDirect),
      ...leads.filter((l) => !l.isDirect && l.inServiceArea),
      ...leads.filter((l) => !l.isDirect && !l.inServiceArea),
    ];
```

Then check every consumer of `ProviderLead` for exhaustive object literals that now miss `isDirect` (run `pnpm tsc --noEmit` or the build; fix by adding the field). Consumers: `src/components/dashboard/provider/JobLeadsClient.tsx`, `src/app/(protected)/dashboard/provider/jobs/leads/page.tsx`, `src/app/(protected)/dashboard/provider/field/jobs/page.tsx`, and any test fixtures.

Add to `src/__tests__/marketplace/rfq-targeting.test.ts` (or a sibling `provider-leads-targeted.test.ts` if provider-service tests live elsewhere — match existing layout) a test asserting the or-filter string contains both branches and that `isDirect` leads sort first (mock two rows, one targeted, one broadcast-older).

- [ ] **Step 5: Run tests to verify pass**

Run: `pnpm vitest run src/__tests__/marketplace/rfq-targeting.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/services/marketplace/rfq-service.ts src/services/provider/provider-job-service.ts src/__tests__/marketplace/rfq-targeting.test.ts
git commit -m "feat(marketplace): guest RFQ creation + enforced targeting in distribution queries"
```

---

## Task 4: API route — guest branch on /api/rfq/create (red → green)

**Files:**
- Modify: `src/app/api/rfq/create/route.ts`
- Test: `src/__tests__/api/rfq-create-guest.test.ts` (create; check for an existing api-route test pattern under `src/__tests__/api/` and mirror it)

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const createRfq = vi.fn().mockResolvedValue({ id: "rfq-1" });
const createGuestRfq = vi.fn().mockResolvedValue({ id: "rfq-2" });
vi.mock("@/services/marketplace/rfq-service", () => ({
  createRfq: (...a: unknown[]) => createRfq(...a),
  createGuestRfq: (...a: unknown[]) => createGuestRfq(...a),
}));

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => getUser() },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ admin: true })),
}));

import { POST } from "@/app/api/rfq/create/route";

const GUEST_BODY = {
  service_category: "plumber",
  title: "Fix leaking kitchen tap",
  description:
    "The kitchen mixer tap has been dripping constantly for a week and the base is now leaking into the cupboard below.",
  property_postcode: "SW1A 1AA",
  urgency_level: "normal",
  target_provider_id: "123e4567-e89b-12d3-a456-426614174000",
  source: "trader_profile_modal",
  contact_name: "Jane Smith",
  contact_email: "jane@example.com",
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/rfq/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  createRfq.mockClear();
  createGuestRfq.mockClear();
});

describe("POST /api/rfq/create", () => {
  it("uses the authed path when a user is present", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const res = await POST(makeRequest(GUEST_BODY));
    expect(res.status).toBe(201);
    expect(createRfq).toHaveBeenCalled();
    expect(createGuestRfq).not.toHaveBeenCalled();
  });

  it("uses the guest path (admin client) when logged out", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(makeRequest(GUEST_BODY));
    expect(res.status).toBe(201);
    expect(createGuestRfq).toHaveBeenCalled();
    expect(createRfq).not.toHaveBeenCalled();
  });

  it("silently accepts but drops honeypot submissions", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(makeRequest({ ...GUEST_BODY, company: "spambot ltd" }));
    expect(res.status).toBe(201);
    expect(createGuestRfq).not.toHaveBeenCalled();
  });

  it("rejects a guest submission without contact email", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { contact_email: _drop, ...noEmail } = GUEST_BODY;
    const res = await POST(makeRequest(noEmail));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/__tests__/api/rfq-create-guest.test.ts`
Expected: FAIL — guest branch doesn't exist (currently returns 401 for no user).

- [ ] **Step 3: Implement the route**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRfq, createGuestRfq } from "@/services/marketplace/rfq-service";
import { createInMemoryRateLimiter } from "@/lib/rate-limit-memory";

// Guests: 5 quote requests per hour per IP. Authed users are covered by RLS.
const guestRateLimiter = createInMemoryRateLimiter(5, 60 * 60 * 1000);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();

    if (user) {
      const rfq = await createRfq(supabase, user.id, body);
      return NextResponse.json({ data: rfq }, { status: 201 });
    }

    // ---- Guest path (service-role; no anon RLS insert exists) ----
    // Honeypot: real users never see/fill the `company` field. Pretend success.
    if (typeof body.company === "string" && body.company.trim() !== "") {
      return NextResponse.json({ data: { id: null } }, { status: 201 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const { success } = guestRateLimiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const admin = createAdminClient();
    const rfq = await createGuestRfq(admin, body);
    return NextResponse.json({ data: rfq }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create RFQ";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
```

**Check `src/lib/rate-limit-memory.ts` first** for the actual return shape of `createInMemoryRateLimiter(...)` — if `.limit()` is async or returns a different shape, adapt the call (and if an Upstash-based limiter is the established pattern for API routes, prefer that; search `src/app/api` for `rate` usages and copy the dominant pattern).

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/__tests__/api/rfq-create-guest.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/rfq/create/route.ts src/__tests__/api/rfq-create-guest.test.ts
git commit -m "feat(api): guest branch on /api/rfq/create with honeypot + rate limit"
```

---

## Task 5: Notifications — quote_received emission + rfq recipient resolution + provider email (red → green)

**Files:**
- Modify: `src/services/marketplace/quote-service.ts:19-129` (`createQuote`)
- Modify: `src/services/provider/provider-quote-service.ts:234-268` (`sendQuote`)
- Modify: `src/services/notifications/notification-service.ts` (`dispatchCriticalEmail:278-337`, `getUserEntityIds:222-268`)
- Modify: `src/services/notifications/email-service.ts` (add `sendGuestQuoteEmail`, `sendProviderRfqEmail`)
- Modify: `src/inngest/functions/rfq-notify-providers.ts` (direct-request copy + real email fallback)
- Test: `src/__tests__/marketplace/quote-received-notify.test.ts` (create)

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const createPlatformEvent = vi.fn().mockResolvedValue({ id: 1 });
vi.mock("@/services/notifications/notification-service", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    createPlatformEvent: (...a: unknown[]) => createPlatformEvent(...a),
  };
});
vi.mock("@/lib/marketplace/quote-signer", () => ({
  signQuote: vi.fn(() => "sig"),
}));

beforeEach(() => {
  createPlatformEvent.mockClear();
  process.env.QUOTE_SIGNING_SECRET = "test-secret";
});

// Chainable mock as in Task 3 — reuse/import the shared helper if one exists.
function chainMock(results: Record<string, unknown>) { /* same shape as Task 3 */ }

describe("createQuote emits quote_received", () => {
  it("fires a quote_received platform event for the RFQ after insert", async () => {
    // Arrange mocked supabase so provider lookup, duplicate check, insert,
    // and RFQ count-update all succeed (see Task 3 mock style).
    // Act: call createQuote(...)
    // Assert:
    expect(createPlatformEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        event_type: "quote_received",
        entity_type: "rfq",
      }),
    );
  });
});

describe("sendQuote emits quote_received", () => {
  it("fires a quote_received platform event when a draft quote is sent", async () => {
    // Arrange mocked supabase: fetch returns a draft quote with
    // service_request_id "rfq-9"; update returns sent quote.
    // Act: call sendQuote(...)
    // Assert createPlatformEvent called with entity_id "rfq-9".
  });
});
```

(The executor fills the two Arrange/Act bodies using the exact chainMock pattern from Task 3 — the assertions above are the contract. Write them fully; no stubs left in the committed test.)

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/__tests__/marketplace/quote-received-notify.test.ts`
Expected: FAIL — no `createPlatformEvent` call exists in either path.

- [ ] **Step 3: Implement emission in both quote paths**

In `quote-service.ts` `createQuote`, after the quote insert succeeds and the RFQ counters update (after line ~126), add:

```typescript
  // Notify the homeowner their quote has arrived (in-app + critical email).
  // Guests (user_id NULL) are emailed directly. Failures never block creation.
  try {
    await createPlatformEvent(supabase, {
      event_type: "quote_received",
      entity_type: "rfq",
      entity_id: service_request_id,
      actor_id: providerId,
      metadata: {
        quote_id: quote.id,
        total_amount: totalAmount,
      },
    });
  } catch (notifyError) {
    console.error("[quote-service] quote_received event failed", notifyError);
  }
```

with `import { createPlatformEvent } from "@/services/notifications/notification-service";` at the top. Mirror the same block at the end of `sendQuote` in `provider-quote-service.ts` (entity_id = `quote.service_request_id`, actor_id = `providerId`, metadata = `{ quote_id: quoteId, total_amount: quote.total_amount }`), and delete the stale `TODO: fire Inngest event` comment (:231-232) since this supersedes it.

- [ ] **Step 4: Implement `rfq` recipient resolution + guest email in `notification-service.ts`**

In `dispatchCriticalEmail`, add an `rfq` branch BEFORE the default conversation branch:

```typescript
    } else if (event.entity_type === "rfq") {
      const { data: rfq } = await supabase
        .from("service_requests")
        .select("user_id, contact_email, contact_name, title")
        .eq("id", event.entity_id)
        .single();

      if (rfq?.user_id && rfq.user_id !== event.actor_id) {
        recipientIds.push(rfq.user_id);
      } else if (!rfq?.user_id && rfq?.contact_email) {
        // Guest RFQ: no account — email the captured address directly.
        const subject = getEmailSubject(event);
        await sendCriticalEmail(rfq.contact_email, subject, event);
        return;
      }
    } else {
```

In `getUserEntityIds`, add before the final `return entityIds;`:

```typescript
  // Service requests (RFQs) owned by the user — so quote_received events surface
  const { data: rfqs } = await supabase
    .from("service_requests")
    .select("id")
    .eq("user_id", userId);

  if (rfqs) {
    entityIds.push(...rfqs.map((r) => r.id));
  }
```

- [ ] **Step 5: Implement direct-request notification in `rfq-notify-providers.ts`**

The `matchProvidersForRfq` short-circuit (Task 3) already narrows fan-out to the target. Improve the copy + make the email fallback real. In Step 2 of the function, select `target_provider_id` too:

```typescript
        const { data: rfq } = await supabase
          .from("service_requests")
          .select("title, service_category, target_provider_id")
          .eq("id", rfqId)
          .single();
```

and vary the notification copy:

```typescript
        const isDirect = Boolean(rfq.target_provider_id);
        // inside the provider loop:
            .insert({
              user_id: provider.user_id,
              type: "rfq_match",
              title: isDirect
                ? "You've received a direct quote request"
                : "New quote request matches your services",
              body: isDirect
                ? `A customer chose you specifically for "${rfq.title}" -- respond with a quote to win the job.`
                : `"${rfq.title}" in ${rfq.service_category} -- submit a quote to win this job.`,
              link: `/dashboard/provider/jobs/leads`,
              read: false,
            })
```

(NOTE: the old link `/dashboard/service_provider/rfqs/${rfqId}` — verify against the route tree; `src/app/(protected)/dashboard/provider/jobs/leads/page.tsx` exists on this branch, so `/dashboard/provider/jobs/leads` is the safe target. Confirm with `ls "src/app/(protected)/dashboard/provider/jobs/leads"`.)

Replace the Step-4 email stub body (the `TODO: Resend integration deferred` block, :125-128) with a real send using a new helper. In `email-service.ts`, add (mirror `sendCriticalEmail`'s Resend usage at :96+, including the rate limiter and `getResend()` null-guard):

```typescript
/**
 * Notify a provider of an unread RFQ lead by email (Inngest fallback).
 */
export async function sendProviderRfqEmail(
  to: string,
  rfqTitle: string,
  isDirect: boolean,
): Promise<SendEmailResult> {
  const { success } = await emailRateLimiter.limit(to);
  if (!success) return { sent: false, rateLimited: true };

  const resend = getResend();
  if (!resend) return { sent: false, error: "Email service not configured" };

  const subject = isDirect
    ? "You've received a direct quote request"
    : "New job lead matching your services";
  // Reuse the existing send/from/reply-to conventions in this file verbatim.
  // Body: title + CTA link to /dashboard/provider/jobs/leads.
  // (Copy the html/text construction style used by sendCriticalEmail.)
  ...
}
```

Then in the Inngest function Step 4, for each `unreadEmails` entry call `sendProviderRfqEmail(u.email, rfq.title, Boolean(rfq.target_provider_id))` and count successes. The executor reads `sendCriticalEmail`'s full body first and reproduces its exact Resend invocation pattern (from-address, error handling) — do not invent a new pattern.

- [ ] **Step 6: Run tests + full marketplace/provider suites**

Run: `pnpm vitest run src/__tests__/marketplace/quote-received-notify.test.ts && pnpm vitest run src/__tests__/marketplace src/__tests__/notifications src/__tests__/provider 2>/dev/null; pnpm vitest run src/services 2>/dev/null || true`
Expected: new test PASS; zero regressions in existing notification/quote tests (some suites may live under different dirs — run `pnpm test` if unsure).

- [ ] **Step 7: Commit**

```bash
git add src/services/marketplace/quote-service.ts src/services/provider/provider-quote-service.ts src/services/notifications/ src/inngest/functions/rfq-notify-providers.ts src/__tests__/marketplace/quote-received-notify.test.ts
git commit -m "feat(notifications): emit quote_received on both quote paths + direct-request provider notify + real email fallback"
```

---

## Task 6: Jobs board exclusion + dashboard "Direct request" badge

**Files:**
- Modify: `src/app/(main)/jobs/page.tsx:82-90` (query)
- Modify: `src/components/dashboard/provider/JobLeadsClient.tsx` (badge)

- [ ] **Step 1: Exclude targeted RFQs from the public jobs board**

In the query chain at `jobs/page.tsx:82`, add `.is("target_provider_id", null)` after `.eq("status", "open")`:

```typescript
    .from("service_requests")
    .select(
      "id, title, service_category, property_postcode, urgency_level, budget_min, budget_max, status, expires_at, quote_count, created_at",
      { count: "exact" },
    )
    .eq("status", "open")
    .is("target_provider_id", null)
    .gt("expires_at", new Date().toISOString())
```

- [ ] **Step 2: Badge direct requests in the provider leads UI**

Read `src/components/dashboard/provider/JobLeadsClient.tsx`, find where each lead card renders its header/badges (it already renders an `inServiceArea` indicator — match that pattern), and add, gated on `lead.isDirect`:

```tsx
{lead.isDirect && (
  <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-xs font-semibold text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary-light">
    Direct request
  </span>
)}
```

Match the file's existing badge classes exactly (copy an existing badge's className and only change semantics if the above drifts from local style). If `field/jobs/page.tsx` renders leads independently, add the same badge there.

- [ ] **Step 3: Verify with build + existing tests**

Run: `pnpm vitest run src/__tests__/provider 2>/dev/null; pnpm build 2>&1 | tail -20`
Expected: no test regressions; build compiles (full gate runs again in Task 9).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(main)/jobs/page.tsx" src/components/dashboard/provider/
git commit -m "feat(marketplace): exclude targeted RFQs from public jobs board + badge direct requests"
```

---

## Task 7: RequestQuoteModal — RFQ-backed modal + intent=quote auto-open (red → green)

**Files:**
- Modify: `src/components/providers/QuoteModal.tsx` (rework submit + fields; keep filename/component name `QuoteModal` — 2 call sites, no churn)
- Modify: `src/components/providers/ProviderSidebar.tsx` (pass `provider.user_id`, categories; auto-open on `?intent=quote`)
- Modify: `src/components/providers/ServicesTabWithModal.tsx` (pass-through of new props — read it first; it currently passes `providerId providerName serviceNames`)
- Modify: `src/components/providers/TradespersonProfile.tsx:108-114,142-144` (prop threading)
- Test: `src/__tests__/providers/QuoteModal.test.tsx` (REPLACE the stale commented-out placeholder file)
- Test: `src/__tests__/providers/quote-intent-autopen.test.tsx` (create)

**Modal contract:**
- Props gain: `providerUserId: string` (the `service_provider_details.user_id` — replaces misuse of phantom `provider.id`), `categories: string[]` (raw enum values e.g. `"plumber"`), `source?: string` (default `"trader_profile_modal"`).
- Step 1 (job details): category select (label = humanised, value = enum), postcode input (NEW, required, UK format), description (min 50 — update copy + counter), preferred date, budget band select (unchanged UI), timeline select (unchanged UI).
- Logged-in user (`useAuth()` from `@/hooks/useAuth` returns `user`): Step 1's button reads "Submit Request" and submits directly — contact step never shows.
- Guest: Step 2 collects name/email/phone + a visually-hidden honeypot input `name="company"` (`className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true"`).
- Submit: `POST /api/rfq/create` JSON:

```typescript
const BUDGET_BAND_VALUES: Record<string, { min?: number; max?: number }> = {
  "Under £200": { max: 200 },
  "£200 – £500": { min: 200, max: 500 },
  "£500 – £1,000": { min: 500, max: 1000 },
  "£1,000 – £5,000": { min: 1000, max: 5000 },
  "£5,000+": { min: 5000 },
};
const TIMELINE_TO_URGENCY: Record<string, "low" | "normal" | "high"> = {
  ASAP: "high",
  "This week": "normal",
  "This month": "normal",
  Flexible: "low",
};

const payload = {
  service_category: formData.serviceCategory || categories[0] || "other",
  title: `${humanise(formData.serviceCategory || categories[0] || "other")} needed in ${formData.postcode.trim().toUpperCase()}`,
  description: formData.description.trim(),
  property_postcode: formData.postcode.trim(),
  preferred_start_date: formData.preferredDate || undefined,
  urgency_level: TIMELINE_TO_URGENCY[formData.timeline] ?? "normal",
  budget_min: BUDGET_BAND_VALUES[formData.budget]?.min,
  budget_max: BUDGET_BAND_VALUES[formData.budget]?.max,
  target_provider_id: providerUserId,
  source,
  ...(user
    ? {}
    : {
        contact_name: formData.name.trim(),
        contact_email: formData.email.trim(),
        contact_phone: formData.phone.trim() || undefined,
        company: formData.company, // honeypot passthrough
      }),
};

const res = await fetch("/api/rfq/create", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
});
```

where `humanise = (c: string) => c.replace(/_/g, " ").replace(/^\w/, (m) => m.toUpperCase())`. On `!res.ok`, parse `{error}` and set `submitError` (visible, retryable). On success → confirmation step: logged-in copy links to `/dashboard/rfqs` ("Track it in your dashboard" — verify that route exists with `ls "src/app/(protected)/dashboard/rfqs"`; if only `/create` exists, link to `/dashboard` and note it), guest copy says quotes will arrive at their email.
- Confirmation title stays honest: "Request sent to {providerName}".

**Auto-open contract (ProviderSidebar):**

```tsx
import { useSearchParams } from "next/navigation";
// inside component:
const searchParams = useSearchParams();
const [quoteOpen, setQuoteOpen] = useState(false);
useEffect(() => {
  if (searchParams.get("intent") === "quote") setQuoteOpen(true);
}, [searchParams]);
```

`useSearchParams` in a client component needs a `Suspense` boundary above it for static rendering; the profile page is dynamic (cookie-bound Supabase fetch) so it works, BUT wrap `<ProviderSidebar/>` usage in `TradespersonProfile.tsx` with `<Suspense fallback={null}>` anyway to keep `pnpm build` happy on both routes. ProviderSidebar must also now pass `providerUserId={provider.user_id}` and `categories={provider.services ?? []}` to the modal.

- [ ] **Step 1: Write the failing tests**

`QuoteModal.test.tsx` (replace stale file; use the project's existing component-test setup — check a neighbouring `.test.tsx` under `src/__tests__/providers/` or `src/__tests__/components/` for the render/mocking conventions, e.g. how `useAuth` and `fetch` are mocked):

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => mockUseAuth() }));

import { QuoteModal } from "@/components/providers/QuoteModal";

const BASE_PROPS = {
  providerUserId: "prov-user-1",
  providerName: "Richards Plumbing",
  categories: ["plumber", "handyman"],
  open: true,
  onOpenChange: vi.fn(),
};

function fillStepOne() {
  fireEvent.change(screen.getByLabelText(/postcode/i), {
    target: { value: "SW1A 1AA" },
  });
  fireEvent.change(screen.getByLabelText(/budget/i), {
    target: { value: "£200 – £500" },
  });
  fireEvent.change(screen.getByLabelText(/timeline/i), {
    target: { value: "ASAP" },
  });
  fireEvent.change(screen.getByLabelText(/describe the work/i), {
    target: {
      value:
        "The kitchen mixer tap has been dripping constantly for a week and the base is now leaking into the cupboard below.",
    },
  });
}

describe("QuoteModal (targeted RFQ)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "rfq-1" } }),
    }) as never;
  });

  it("submits directly with target_provider_id when logged in (no contact step)", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });
    render(<QuoteModal {...BASE_PROPS} />);
    fillStepOne();
    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.target_provider_id).toBe("prov-user-1");
    expect(body.property_postcode).toBe("SW1A 1AA");
    expect(body.contact_email).toBeUndefined();
    expect(await screen.findByText(/request sent/i)).toBeInTheDocument();
  });

  it("collects contact details for guests before submitting", async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(<QuoteModal {...BASE_PROPS} />);
    fillStepOne();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Jane Smith" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.contact_email).toBe("jane@example.com");
    expect(body.target_provider_id).toBe("prov-user-1");
  });

  it("shows a visible error when the API rejects", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Enter a valid UK postcode" }),
    });
    render(<QuoteModal {...BASE_PROPS} />);
    fillStepOne();
    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));
    expect(
      await screen.findByText(/enter a valid uk postcode/i),
    ).toBeInTheDocument();
  });
});
```

`quote-intent-autopen.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("intent=quote"),
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

import ProviderSidebar from "@/components/providers/ProviderSidebar";

const PROVIDER = {
  id: "phantom",
  user_id: "prov-user-1",
  slug: "richards-plumbing",
  business_name: "Richards Plumbing",
  services: ["plumber"],
  // ...fill remaining ServiceProviderPublicProfile fields with nulls/defaults
} as never;

describe("?intent=quote auto-open", () => {
  it("opens the quote modal on mount when intent=quote is present", () => {
    render(<ProviderSidebar provider={PROVIDER} />);
    expect(
      screen.getByText(/what do you need help with/i),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/__tests__/providers/QuoteModal.test.tsx src/__tests__/providers/quote-intent-autopen.test.tsx`
Expected: FAIL — new props/fields/behaviour don't exist.

- [ ] **Step 3: Implement**

Rework `QuoteModal.tsx` per the contract above (keep the 3-step Dialog structure, visual style, and reset-on-close behaviour; the diff is: props, new postcode field, category select with enum values + humanised labels, description min 50, `useAuth` gate on step 2, fetch-based submit, honeypot input on step 2, confirmation copy split by auth state). Update `ProviderSidebar.tsx` (auto-open effect + new props + keep `id="quote"` anchor so hero CTA still scrolls). Update `ServicesTabWithModal.tsx` call site: it listens for `data-quote-service` clicks and renders the modal — thread `providerUserId`/`categories` through (read the file; `TradespersonProfile.tsx:108-114` currently passes `providerId={provider.id}` — change to `providerUserId={provider.user_id}` and add `categories={provider.services ?? []}`; keep `initialService` behaviour). Wrap the sidebar in Suspense in `TradespersonProfile.tsx`:

```tsx
<aside className="lg:w-[380px]">
  <Suspense fallback={null}>
    <ProviderSidebar provider={provider} />
  </Suspense>
</aside>
```

(`import { Suspense } from "react";`)

Delete nothing else. The `provider_leads` insert disappears with the submit rework — that is the intended retirement of the black-hole path.

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/__tests__/providers/`
Expected: PASS (all provider component tests, old and new).

- [ ] **Step 5: Commit**

```bash
git add src/components/providers/ src/__tests__/providers/
git commit -m "feat(providers): QuoteModal submits targeted RFQs + auto-opens on intent=quote"
```

---

## Task 8: CTA sweep (red → green)

**Files:**
- Modify: `src/components/providers/ProviderSearchCard.tsx:182-187`
- Modify: `src/app/(main)/marketplace/[slug]/ProviderProfile.tsx:129-134`
- Modify: `src/app/(main)/post-a-job/page.tsx` + `src/components/marketplace/RFQCreateForm.tsx` (prefill props)
- Modify: `src/components/providers/SpecialistSidebar.tsx` (+ its callers if props change): conveyancers/surveyors/mortgage-brokers/architects pages
- Modify: `src/components/messaging/MessageThread.tsx:41-46,246-257` (remove dead pill)
- Modify: `src/app/(protected)/dashboard/broker/products/page.tsx:332-337` (remove dead button)
- Test: `src/__tests__/navigation/quote-cta-integrity.test.tsx` (create)

- [ ] **Step 1: Write the failing CTA integrity test**

Model on `src/__tests__/navigation/tradesperson-profile-links.test.ts` (READ IT FIRST and reuse its helpers/render approach). Contract:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { tradespersonProfilePath } from "@/lib/providers/profile-path";

// 1. ProviderSearchCard "Get a Quote" carries intent=quote to the canonical profile
//    render <ProviderSearchCard provider={fixture}/> and assert:
//    screen.getByRole("link", { name: /get a quote/i }) has href
//    tradespersonProfilePath(fixture.slug, { intent: "quote" })
//
// 2. Marketplace ProviderProfile "Request Quote" links to the canonical profile
//    with intent=quote — NOT back to /marketplace?category=...
//    assert href startsWith "/services/pro/" and includes "intent=quote"
//
// 3. FeaturedExpertCard keeps intent=quote (guard against regression)
//
// 4. MessageThread renders NO "Request Quote" control (dead pill removed)
//
// 5. Static source guard: read the SpecialistSidebar/SpecialistHero sources with
//    fs and assert they no longer contain `href="#quote"` pointing at a formless
//    anchor (i.e. the string `ctaHref="#quote"` is gone from the four specialist
//    pages OR SpecialistSidebar contains a QuoteModal/enquiry form).
```

Write these as five real `it()` blocks with real fixtures (copy fixture shapes from existing tests of the same components; ProviderSearchCard and FeaturedExpertCard both have existing tests — find them with `grep -rl "ProviderSearchCard\|FeaturedExpertCard" src/__tests__`).

- [ ] **Step 2: Run to verify failure**

Run: `pnpm vitest run src/__tests__/navigation/quote-cta-integrity.test.tsx`
Expected: FAIL on items 1, 2, 4, 5 (item 3 may already pass — that's fine, it's a regression guard).

- [ ] **Step 3: Implement the sweep**

a. **ProviderSearchCard** — change the Get a Quote anchor to:
```tsx
<a
  href={tradespersonProfilePath(provider.slug, { intent: "quote" })}
  ...same classes...
>
  Get a Quote
</a>
```
(It currently appends `#services`; `intent=quote` supersedes it — one click now opens the modal.)

b. **Marketplace ProviderProfile** — replace the circular `Link href={"/marketplace?category=" + services[0]}` on the "Request Quote" button with `tradespersonProfilePath(slug, { intent: "quote" })`. The component receives the provider — confirm it has `slug`; if it only has services/name, extend the props from the page (`src/app/(main)/marketplace/[slug]/page.tsx` has the slug param).

c. **post-a-job prefill** — `page.tsx` is a server component; give it searchParams:
```tsx
type SearchParams = Promise<{ service?: string; postcode?: string }>;
export default async function PostAJobPage({ searchParams }: { searchParams: SearchParams }) {
  const { service, postcode } = await searchParams;
  ...
  <RFQCreateForm defaultCategory={validCategory(service)} defaultPostcode={postcode} />
```
where `validCategory` returns the value only if it's one of the category enum keys (import `CATEGORY_LABELS` — the page/form already use it). Add `defaultPostcode?: string` to `RFQCreateForm` props and seed the postcode field's default value (react-hook-form `defaultValues`).

d. **Specialists** — FIRST verify data source: `sed -n '1,60p' "src/app/(main)/conveyancers/[slug]/page.tsx"`. These pages fetch from `service_provider_details` (categories `conveyancing`/`surveying`/`mortgage_broker`/`architect` are in the enum). If so: add the QuoteModal to `SpecialistSidebar` exactly like ProviderSidebar (a `useState` + CTA onClick + `<QuoteModal providerUserId={...} providerName={...} categories={[category]} .../>`), replacing the self-anchoring dead `#quote` href; thread `user_id` through from each specialist page. Keep each vertical's CTA label ("Get a Quote" / "Book Survey" / "Get Free Advice"). If the data source turns out NOT to be provider rows with a `user_id` (unexpected), fall back to keeping the CTA but pointing it at `/post-a-job?service=<category>` and record the finding in the PR description.

e. **MessageThread** — delete the "Request Quote" pill from the quick-actions array (:41-46) and its render (:246-257 covers the array render; just remove the entry). Rationale for removal, not wiring: the thread component has no counterpart provider slug/user_id in its props, and the modal is one click away on the profile — record in commit message.

f. **Broker products** — delete the dead "Request Quote" `<Button>` (or, if the surrounding card is meaningless without it, wire it to the product's provider profile if a slug exists in the row data — read the page first; deletion with rationale is acceptable).

- [ ] **Step 4: Run the new test + the full navigation guard suite**

Run: `pnpm vitest run src/__tests__/navigation/`
Expected: PASS — including the pre-existing link-integrity suites (they enforce every href resolves; the sweep must not break them).

- [ ] **Step 5: Commit**

```bash
git add src/components/ src/app/ src/__tests__/navigation/quote-cta-integrity.test.tsx
git commit -m "feat(marketplace): one-click quote CTAs everywhere + specialist enquiry + post-a-job prefill + remove dead quote buttons"
```

---

## Task 9: Full gates + adversarial review

- [ ] **Step 1: Full test suite** — `pnpm test` → expect 0 failures (per standing feedback: a failing file touching our changes is OUR bug). Do not run concurrent builds/vitest in parallel (CPU-starvation false failures — known gotcha).
- [ ] **Step 2: Lint** — `pnpm lint` → 0 errors.
- [ ] **Step 3: Build** — `pnpm build` → exit 0. Read the real error after "Running TypeScript" if it fails; OTel warnings are noise.
- [ ] **Step 4: Adversarial design-parity review** — dispatch a reviewer subagent over `git diff main...HEAD` checking: no reworded labels/dropped data on touched surfaces, no fabricated numbers/fake buttons, modal copy honest (no "within 24 hours" promises we can't keep — reword confirmation to what the system actually does), every changed line traces to the spec.
- [ ] **Step 5: Fix findings, re-run gates, commit fixes.**

---

## Task 10: Prod migration + PR + live verification

- [ ] **Step 1: Check `provider_leads` on prod** — via Supabase MCP `execute_sql`: `SELECT count(*), min(created_at), max(created_at) FROM provider_leads;`. If real (non-test) rows exist, write + run a one-time backfill INSERT into `service_requests` (targeted, guest-contact mapped, source `'provider_leads_backfill'`); if empty/test noise, document in PR body.
- [ ] **Step 2: Apply the Task-1 migration to prod** via Supabase MCP `apply_migration` (project `ynkqzzpcbpphjczmrfva`), then reconcile the migration ledger (established pattern: verify with `list_migrations`). Verify RLS live: as provider A, a service_request targeted at provider B must return 0 rows.
- [ ] **Step 3: Push + PR** — `git push -u origin feat/direct-quote-workflow`; open PR to `main` titled `feat: direct-to-trader quote workflow (targeted RFQs end-to-end)`; body = summary, spec link, screenshots, test plan, provider_leads disposition. CI must be green (app-ci is PR-only; lint is a hard gate).
- [ ] **Step 4: Squash-merge once green** (Branch & Landing Discipline: same-day landing).
- [ ] **Step 5: Live verification with Playwright screenshots (375/768/1440)** against the prod deploy:
  1. Trader search card → click "Get a Quote" → modal open on profile (1 click).
  2. Submit as logged-in demo user → confirmation.
  3. Log in as the targeted trader (e.g. seeded `@seed.britestate.test` provider or `test-provider@britestate.test` / `TestPassword123!`) → leads page shows "Direct request" badge; verify a DIFFERENT provider does NOT see it; verify `/jobs` doesn't list it.
  4. Trader sends a quote → homeowner's notification bell/feed shows quote_received.
  5. Sponsored FeaturedExpertCard click → modal auto-open.
  Save screenshots and send to user. Map/WebGL not involved; plain Playwright is fine.
- [ ] **Step 6: Update memory** (`project_direct_quote_workflow.md` + MEMORY.md pointer) with outcome + gotchas.

---

## Self-review notes (spec coverage)

- Spec §A (1-click + intent consumption) → Tasks 7, 8a-b. ✓
- Spec §B (migration, guest API, distribution filters) → Tasks 1, 2, 3, 4, 6. ✓
- Spec §C (notifications both directions, guest email, provider email stub replaced) → Task 5. ✓
- Spec §D (full CTA sweep incl. specialists, MessageThread, broker, post-a-job params, provider_leads disposition) → Tasks 8, 10.1. ✓
- Spec §E (analytics source attribution) → source field threaded through modal/API (Tasks 4, 7); placement events untouched. ✓
- Spec §F (TDD, full gates, parity review, live screenshots) → every task red-first; Tasks 9, 10.5. ✓
- Spec §G (worktree, prod migration via MCP, PR) → header + Task 10. ✓
