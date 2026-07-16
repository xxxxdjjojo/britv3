/**
 * Tests for processStripeEvent — the shared dispatcher used by both the
 * Stripe webhook route and the DLQ replay function.
 *
 * Scope (per Sprint 0 Stream B): branch routing, throw-on-DB-failure, and
 * the unhandled-type no-op. Stream D will add per-branch coverage.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// next/cache: no-op revalidateTag inside tests.
// ---------------------------------------------------------------------------

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

const { inngestSend } = vi.hoisted(() => ({
  inngestSend: vi.fn().mockResolvedValue({ ids: ["inngest-referral-credit"] }),
}));

vi.mock("@/inngest/client", () => ({
  inngest: { send: inngestSend },
}));

// ---------------------------------------------------------------------------
// SUT imported after mocks
// ---------------------------------------------------------------------------

import { processStripeEvent } from "../stripe-event-processor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type EqResult = { data: unknown; error: { message: string } | null };

/**
 * Build a minimal Supabase mock that records the table touched and what the
 * final `eq(...)` (or `.maybeSingle()`) call resolves to.
 *
 * Each `from()` invocation pulls the next pre-queued result off the array.
 * Anything not queued resolves to `{ data: null, error: null }`.
 */
function makeSupabaseMock(results: EqResult[] = []) {
  const calls: { table: string }[] = [];
  const rpc = vi.fn().mockImplementation(() => Promise.resolve(nextResult()));
  let cursor = 0;

  function nextResult(): EqResult {
    const r = results[cursor];
    cursor += 1;
    return r ?? { data: null, error: null };
  }

  function makeBuilder() {
    const builder: Record<string, unknown> = {};
    const chainable = [
      "select",
      "insert",
      "update",
      "upsert",
      "delete",
      "eq",
      "in",
      "neq",
      "order",
      "range",
      "limit",
      "offset",
    ];
    for (const m of chainable) {
      builder[m] = vi.fn(() => builder);
    }
    builder["single"] = vi.fn().mockImplementation(() => Promise.resolve(nextResult()));
    builder["maybeSingle"] = vi.fn().mockImplementation(() => Promise.resolve(nextResult()));
    builder["then"] = vi.fn((resolve: (v: EqResult) => unknown) => resolve(nextResult()));
    return builder;
  }

  const from = vi.fn((table: string) => {
    calls.push({ table });
    return makeBuilder();
  });

  return {
    client: {
      from,
      rpc,
      auth: { admin: { updateUserById: vi.fn().mockResolvedValue({}) } },
    } as unknown as SupabaseClient,
    calls,
    rpc,
  };
}

const stripeStub = {} as unknown as Stripe;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("processStripeEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dispatches customer.subscription.deleted to the cancel branch", async () => {
    const { client, calls } = makeSupabaseMock([
      // 1. update subscriptions → no error
      { data: null, error: null },
      // 2. select subscription user_id (for force_refresh) → no user found
      { data: null, error: null },
    ]);

    const event = {
      id: "evt_test_001",
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_123", customer: "cus_123" } },
    } as unknown as Stripe.Event;

    const result = await processStripeEvent(client, stripeStub, event);

    expect(result).toEqual({ userId: null });
    // Both "subscriptions" reads/writes are recorded.
    expect(calls.some((c) => c.table === "subscriptions")).toBe(true);
  });

  it("throws when subscriptions update fails (DB error path)", async () => {
    const { client } = makeSupabaseMock([
      // First .eq()/awaited update on subscriptions returns an error.
      { data: null, error: { message: "deadlock detected" } },
    ]);

    const event = {
      id: "evt_test_002",
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_456", customer: "cus_456" } },
    } as unknown as Stripe.Event;

    await expect(processStripeEvent(client, stripeStub, event)).rejects.toThrow(
      /Failed to cancel subscription: deadlock detected/,
    );
  });

  it("returns without throwing for unhandled event types", async () => {
    const { client, calls } = makeSupabaseMock();

    const event = {
      id: "evt_test_003",
      type: "invoice.upcoming",
      data: { object: { id: "in_999" } },
    } as unknown as Stripe.Event;

    const result = await processStripeEvent(client, stripeStub, event);

    expect(result).toEqual({ userId: null });
    // No table accessed for unhandled types.
    expect(calls.length).toBe(0);
  });

  it("does not convert or credit a provider referral at checkout completion", async () => {
    const { client, calls } = makeSupabaseMock([
      { data: null, error: null },
      { data: null, error: null },
    ]);
    const createBalanceTransaction = vi.fn();
    const stripe = {
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({
          id: "sub_provider_123",
          customer: "cus_provider_123",
          status: "active",
          cancel_at_period_end: false,
          items: {
            data: [{
              current_period_end: 1_800_000_000,
              price: { id: "price_provider", unit_amount: 2_500, currency: "gbp" },
            }],
          },
        }),
      },
      customers: { createBalanceTransaction },
    } as unknown as Stripe;
    const event = {
      id: "evt_checkout_provider",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_provider",
          mode: "subscription",
          subscription: "sub_provider_123",
          customer: "cus_provider_123",
          metadata: { user_id: "provider_123", role: "service_provider" },
        },
      },
    } as unknown as Stripe.Event;

    await processStripeEvent(client, stripe, event);

    expect(calls.map(({ table }) => table)).not.toContain("referrals");
    expect(calls.map(({ table }) => table)).not.toContain("referral_rewards");
    expect(createBalanceTransaction).not.toHaveBeenCalled();
  });

  it("converts and records one referrer credit on the first positive paid provider invoice", async () => {
    const { client, rpc } = makeSupabaseMock([
      { data: null, error: null },
      {
        data: { user_id: "provider_123", role: "service_provider" },
        error: null,
      },
      {
        data: {
          id: "referral_123",
          referrer_id: "referrer_123",
          provider_state: "gate_complete",
        },
        error: null,
      },
      { data: "converted", error: null },
      { data: "credit_123", error: null },
      { data: { user_id: "provider_123" }, error: null },
      { data: null, error: null },
    ]);
    const event = {
      id: "evt_invoice_provider_first_paid",
      type: "invoice.payment_succeeded",
      data: {
        object: {
          id: "in_provider_first_paid",
          customer: "cus_provider_123",
          status: "paid",
          amount_paid: 2_500,
          billing_reason: "subscription_create",
          parent: {
            type: "subscription_details",
            subscription_details: { subscription: "sub_provider_123" },
          },
        },
      },
    } as unknown as Stripe.Event;

    await processStripeEvent(client, stripeStub, event);

    expect(rpc).toHaveBeenNthCalledWith(1, "advance_provider_referral", {
      p_referral_id: "referral_123",
      p_referred_profile_id: "provider_123",
      p_target_state: "converted",
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "issue_referral_credit", {
      p_referral_id: "referral_123",
      p_member_id: "referrer_123",
      p_credit_months: 1,
    });
    expect(inngestSend).toHaveBeenCalledWith({
      name: "billing/referral.credit-requested",
      data: { creditId: "credit_123" },
    });
  });

  it("does not convert a referral for a zero-value provider invoice", async () => {
    const { client, rpc } = makeSupabaseMock([
      { data: null, error: null },
      { data: null, error: null },
    ]);
    const event = {
      id: "evt_invoice_provider_zero",
      type: "invoice.payment_succeeded",
      data: {
        object: {
          id: "in_provider_zero",
          customer: "cus_provider_123",
          status: "paid",
          amount_paid: 0,
          billing_reason: "subscription_create",
        },
      },
    } as unknown as Stripe.Event;

    await processStripeEvent(client, stripeStub, event);

    expect(rpc).not.toHaveBeenCalled();
    expect(inngestSend).not.toHaveBeenCalled();
  });

  it("does not convert a one-off invoice for a customer who also has a provider subscription", async () => {
    const { client, rpc } = makeSupabaseMock([
      { data: null, error: null },
      {
        data: { user_id: "provider_123", role: "service_provider" },
        error: null,
      },
      {
        data: {
          id: "referral_123",
          referrer_id: "referrer_123",
          provider_state: "gate_complete",
        },
        error: null,
      },
      { data: "converted", error: null },
      { data: "credit_123", error: null },
      { data: { user_id: "provider_123" }, error: null },
      { data: null, error: null },
    ]);
    const event = {
      id: "evt_invoice_provider_one_off",
      type: "invoice.payment_succeeded",
      data: {
        object: {
          id: "in_provider_one_off",
          customer: "cus_provider_123",
          status: "paid",
          amount_paid: 2_500,
          billing_reason: "manual",
          parent: null,
        },
      },
    } as unknown as Stripe.Event;

    await processStripeEvent(client, stripeStub, event);

    expect(rpc).not.toHaveBeenCalled();
    expect(inngestSend).not.toHaveBeenCalled();
  });
});
