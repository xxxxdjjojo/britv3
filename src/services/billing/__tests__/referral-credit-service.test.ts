import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { applyReferralCredit } from "../referral-credit-service";

vi.mock("server-only", () => ({}));

const { posthogCapture } = vi.hoisted(() => ({ posthogCapture: vi.fn() }));
vi.mock("@/lib/analytics/posthog-server", () => ({
  posthogServer: { capture: posthogCapture },
}));

function makeSupabaseClient() {
  let snapshot: Record<string, unknown> | null = null;
  const rpc = vi.fn().mockImplementation((name: string, args: Record<string, unknown>) => {
    if (name === "claim_referral_credit") {
      return Promise.resolve({
        data: {
          credit_id: "credit_123",
          referral_id: "referral_123",
          member_id: "referrer_123",
          credit_months: 1,
          status: "applying",
          idempotency_key: "referral-credit:referral_123:referrer_123",
          ...snapshot,
        },
        error: null,
      });
    }
    if (name === "snapshot_referral_credit_billing") {
      snapshot ??= {
        stripe_customer_id: args.p_stripe_customer_id,
        amount_pence: args.p_amount_pence,
        currency: args.p_currency,
      };
      return Promise.resolve({ data: snapshot, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  });
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.maybeSingle = vi.fn()
    .mockResolvedValueOnce({
      data: {
        stripe_customer_id: "cus_referrer_original",
        price_amount: 120_000,
        currency: "gbp",
        billing_interval: "year",
        billing_interval_count: 1,
      },
      error: null,
    })
    .mockResolvedValueOnce({
      data: {
        stripe_customer_id: "cus_referrer_mutated",
        price_amount: 3_000,
        currency: "usd",
        billing_interval: "month",
        billing_interval_count: 1,
      },
      error: null,
    });

  return {
    client: {
      rpc,
      from: vi.fn(() => builder),
    } as unknown as SupabaseClient,
    rpc,
  };
}

describe("applyReferralCredit", () => {
  it("persists a failed attempt and retries Stripe with the same idempotency key", async () => {
    const { client, rpc } = makeSupabaseClient();
    const createBalanceTransaction = vi
      .fn()
      .mockRejectedValueOnce(new Error("Stripe temporarily unavailable"))
      .mockResolvedValueOnce({ id: "cbtxn_123" });
    const stripe = {
      customers: { createBalanceTransaction },
    } as unknown as Stripe;

    await expect(
      applyReferralCredit(client, stripe, "credit_123"),
    ).rejects.toThrow("Stripe temporarily unavailable");
    await expect(
      applyReferralCredit(client, stripe, "credit_123"),
    ).resolves.toEqual({ status: "applied", transactionId: "cbtxn_123" });

    expect(rpc).toHaveBeenCalledWith("mark_referral_credit_failed", {
      p_credit_id: "credit_123",
      p_application_token: expect.any(String),
      p_error_details: { message: "Stripe temporarily unavailable" },
    });
    expect(createBalanceTransaction).toHaveBeenCalledTimes(2);
    expect(createBalanceTransaction.mock.calls[0].slice(0, 2)).toEqual([
      "cus_referrer_original",
      expect.objectContaining({ amount: -10_000, currency: "gbp" }),
    ]);
    expect(createBalanceTransaction.mock.calls[1].slice(0, 2)).toEqual([
      "cus_referrer_original",
      expect.objectContaining({ amount: -10_000, currency: "gbp" }),
    ]);
    expect(createBalanceTransaction.mock.calls[0][2]).toEqual({
      idempotencyKey: "referral-credit:referral_123:referrer_123",
    });
    expect(createBalanceTransaction.mock.calls[1][2]).toEqual({
      idempotencyKey: "referral-credit:referral_123:referrer_123",
    });
    expect(rpc).toHaveBeenCalledTimes(5);
    expect(rpc.mock.calls.filter(([name]) => name === "snapshot_referral_credit_billing"))
      .toHaveLength(1);
    expect(rpc).toHaveBeenCalledWith("mark_referral_credit_applied", {
      p_credit_id: "credit_123",
      p_application_token: expect.any(String),
      p_stripe_balance_transaction_id: "cbtxn_123",
    });
    expect(posthogCapture).toHaveBeenCalledWith(expect.objectContaining({
      event: "credit_applied",
      distinctId: "referrer_123",
    }));
    const appliedCallOrder = rpc.mock.invocationCallOrder.at(-1) ?? 0;
    expect(posthogCapture.mock.invocationCallOrder[0]).toBeGreaterThan(
      appliedCallOrder,
    );
  });
});
