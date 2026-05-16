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
    const source = readFileSync(STRIPE_WEBHOOK_ROUTE, "utf8");

    expect(source).not.toContain("ignoreDuplicates: true");
    expect(source).toContain("claim_billing_event");
    expect(source).toContain("mark_billing_event_processed");
    expect(source).toContain("mark_billing_event_failed");
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
    const source = readFileSync(STRIPE_WEBHOOK_ROUTE, "utf8");

    expect(source).toContain("idempotencyKey");
    expect(source).toContain("referral-credit");
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
