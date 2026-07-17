import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const routeMocks = vi.hoisted(() => ({
  advanceReferralStatus: vi.fn(),
  constructEvent: vi.fn(),
  createClient: vi.fn(),
  resolveInternalPlanId: vi.fn(() => "agent-pro"),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: routeMocks.constructEvent },
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: routeMocks.createClient,
}));

vi.mock("next/cache", () => ({
  revalidateTag: routeMocks.revalidateTag,
}));

vi.mock("@/lib/billing-config", () => ({
  resolveInternalPlanId: routeMocks.resolveInternalPlanId,
}));

vi.mock("@/lib/referral-tiers", () => ({
  TIER_CONFIGS: {},
}));

vi.mock("@/services/referrals/unified-referral-service", () => ({
  advanceReferralStatus: routeMocks.advanceReferralStatus,
}));

const ROOT = process.cwd();
const STRIPE_WEBHOOK_ROUTE = join(ROOT, "src/app/api/webhooks/stripe/route.ts");
const STRIPE_EVENT_PROCESSOR = join(ROOT, "src/services/billing/stripe-event-processor.ts");
const REFERRAL_CREDIT_SERVICE = join(ROOT, "src/services/billing/referral-credit-service.ts");
const BILLING_EVENTS_HELPER = join(ROOT, "src/services/billing/billing-events.ts");
const MIGRATIONS_DIR = join(ROOT, "supabase/migrations");

function readMigrationSources(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => readFileSync(join(MIGRATIONS_DIR, file), "utf8"))
    .join("\n");
}

type BillingEventClaim = {
  status: string;
  should_process: boolean;
};

type DbError = {
  message: string;
};

function makeSubscriptionDeletedEvent(id = "evt_subscription_deleted") {
  return {
    id,
    type: "customer.subscription.deleted",
    data: {
      object: {
        id: "sub_test_123",
        customer: "cus_test_123",
      },
    },
  };
}

function makeUnhandledEvent(id = "evt_unhandled_type") {
  return {
    id,
    type: "customer.tax_id.created", // a real Stripe event type we don't handle
    data: {
      object: { id: "txi_test_123", customer: "cus_test123" },
    },
  };
}

async function importStripeWebhookRoute(options: {
  event: ReturnType<typeof makeSubscriptionDeletedEvent>;
  claimResult: { data: BillingEventClaim | null; error: DbError | null };
}) {
  vi.resetModules();
  routeMocks.advanceReferralStatus.mockReset();
  routeMocks.constructEvent.mockReset();
  routeMocks.createClient.mockReset();
  routeMocks.resolveInternalPlanId.mockReset();
  routeMocks.resolveInternalPlanId.mockReturnValue("agent-pro");
  routeMocks.revalidateTag.mockReset();

  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key";

  const subscriptionUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const subscriptionUpdate = vi.fn(() => ({ eq: subscriptionUpdateEq }));
  const subscriptionLookupMaybeSingle = vi.fn().mockResolvedValue({
    data: { user_id: "user_test_123" },
    error: null,
  });
  const subscriptionLookupEq = vi.fn(() => ({ maybeSingle: subscriptionLookupMaybeSingle }));
  const subscriptionSelect = vi.fn(() => ({ eq: subscriptionLookupEq }));

  const billingEventClaimMaybeSingle = vi.fn().mockResolvedValue(options.claimResult);
  const markBillingEventProcessed = vi.fn().mockResolvedValue({ error: null });
  const markBillingEventFailed = vi.fn().mockResolvedValue({ error: null });
  const rpc = vi.fn((functionName: string) => {
    if (functionName === "claim_billing_event") {
      return { maybeSingle: billingEventClaimMaybeSingle };
    }

    if (functionName === "mark_billing_event_processed") {
      return markBillingEventProcessed();
    }

    if (functionName === "mark_billing_event_failed") {
      return markBillingEventFailed();
    }

    return Promise.resolve({ error: null });
  });

  const updateUserById = vi.fn().mockResolvedValue({ data: {}, error: null });
  const supabase = {
    auth: { admin: { updateUserById } },
    rpc,
    from: vi.fn((table: string) => {
      if (table === "subscriptions") {
        return {
          update: subscriptionUpdate,
          select: subscriptionSelect,
        };
      }

      return {};
    }),
  };

  routeMocks.constructEvent.mockReturnValue(options.event);
  routeMocks.createClient.mockReturnValue(supabase);

  vi.doMock(join(ROOT, "src/lib/stripe.ts"), () => ({
    getStripe: () => ({
      webhooks: { constructEvent: routeMocks.constructEvent },
    }),
  }));
  vi.doMock("@supabase/supabase-js", () => ({
    createClient: routeMocks.createClient,
  }));
  vi.doMock("next/cache", () => ({
    revalidateTag: routeMocks.revalidateTag,
  }));
  vi.doMock(join(ROOT, "src/lib/billing-config.ts"), () => ({
    resolveInternalPlanId: routeMocks.resolveInternalPlanId,
  }));
  vi.doMock(join(ROOT, "src/lib/referral-tiers.ts"), () => ({
    TIER_CONFIGS: {},
  }));
  vi.doMock(join(ROOT, "src/services/referrals/unified-referral-service.ts"), () => ({
    advanceReferralStatus: routeMocks.advanceReferralStatus,
  }));

  const route = await import("./route");

  return {
    POST: route.POST,
    mocks: {
      billingEventClaimMaybeSingle,
      createClient: routeMocks.createClient,
      markBillingEventProcessed,
      markBillingEventFailed,
      revalidateTag: routeMocks.revalidateTag,
      rpc,
      subscriptionUpdate,
      subscriptionUpdateEq,
    },
  };
}

function makeStripeWebhookRequest() {
  return new Request("https://britestate.test/api/webhooks/stripe", {
    method: "POST",
    body: "{}",
    headers: {
      "stripe-signature": "sig_test",
    },
  });
}

describe("Stripe webhook idempotency contract", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("claims webhook events with processed state instead of ignoreDuplicates", () => {
    const routeSource = readFileSync(STRIPE_WEBHOOK_ROUTE, "utf8");
    const helperSource = readFileSync(BILLING_EVENTS_HELPER, "utf8");

    expect(routeSource).not.toContain("ignoreDuplicates: true");
    // Idempotency RPCs are invoked via the shared billing-events helper
    // module, called by both the route and the DLQ replay function.
    expect(helperSource).toContain("claim_billing_event");
    expect(helperSource).toContain("mark_billing_event_processed");
    expect(helperSource).toContain("mark_billing_event_failed");
    expect(routeSource).toContain("claimBillingEvent");
    expect(routeSource).toContain("markBillingEventProcessed");
    expect(routeSource).toContain("markBillingEventFailed");
  });

  it("stores processed_at as completion time and tracks attempts", () => {
    const migration = readMigrationSources();

    expect(migration).toMatch(/processed_at\s+TIMESTAMPTZ\b(?!\s+NOT NULL\s+DEFAULT now\(\))/i);
    expect(migration).toContain("attempt_count");
    expect(migration).toContain("last_error");
  });

  it("matches subscription upsert conflict target with a database uniqueness guarantee", () => {
    const migration = readMigrationSources();

    expect(migration).toMatch(/UNIQUE\s*\(\s*user_id\s*\)/i);
  });

  it("uses deterministic Stripe idempotency keys for referral balance credits", () => {
    // PR4 moved the Stripe balance-transaction call into a durable Inngest
    // worker. The processor no longer performs the credit inline — it dispatches
    // a durable event so the live webhook and the DLQ replay path converge on
    // the same worker, which applies the credit with a stable idempotency key.
    const processorSource = readFileSync(STRIPE_EVENT_PROCESSOR, "utf8");
    const creditServiceSource = readFileSync(REFERRAL_CREDIT_SERVICE, "utf8");

    // Processor dispatches the durable event instead of calling Stripe inline.
    expect(processorSource).toContain("billing/referral.credit-requested");

    // The durable worker service builds/uses the deterministic idempotency key
    // (persisted on the credit row so DLQ replay reuses the SAME key — no
    // double-apply). The stable key is "referral-credit:<referralId>:<referrerId>".
    expect(creditServiceSource).toContain("idempotencyKey");
    expect(creditServiceSource).toContain("idempotency_key");

    // The stable key format itself is defined in the DB function that mints it.
    const migration = readMigrationSources();
    expect(migration).toContain("'referral-credit:'");
  });

  it("does not dispatch a duplicate event that was already processed", async () => {
    const event = makeSubscriptionDeletedEvent("evt_duplicate_without_user");
    const { POST, mocks } = await importStripeWebhookRoute({
      event,
      claimResult: {
        data: { status: "processed", should_process: false },
        error: null,
      },
    });

    const response = await POST(makeStripeWebhookRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ received: true, duplicate: true });
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled();
    expect(mocks.markBillingEventProcessed).not.toHaveBeenCalled();
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("returns 200 (NOT 500) for unhandled event types and marks them processed", async () => {
    // Stripe sends dozens of event types we don't handle — they must still
    // return 200 so Stripe doesn't retry them indefinitely. The default branch
    // in stripe-event-processor.ts logs and returns undefined userId without
    // throwing.
    const event = makeUnhandledEvent("evt_unhandled_customer_tax_id");
    const { POST, mocks } = await importStripeWebhookRoute({
      event,
      claimResult: {
        data: { status: "claimed", should_process: true },
        error: null,
      },
    });

    const response = await POST(makeStripeWebhookRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(mocks.markBillingEventProcessed).toHaveBeenCalledTimes(1);
    expect(mocks.markBillingEventFailed).not.toHaveBeenCalled();
    // No subscription mutation expected for an unhandled type
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled();
  });

  it("stops processing when the idempotency claim write fails", async () => {
    const event = makeSubscriptionDeletedEvent("evt_claim_error");
    const { POST, mocks } = await importStripeWebhookRoute({
      event,
      claimResult: {
        data: null,
        error: { message: "billing_events insert failed" },
      },
    });

    const response = await POST(makeStripeWebhookRequest());

    expect(response.status).toBe(500);
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled();
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });
});
