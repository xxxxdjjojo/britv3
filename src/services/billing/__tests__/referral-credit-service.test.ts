import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { applyReferralCredit } from "../referral-credit-service";

vi.mock("server-only", () => ({}));

function makeSupabaseClient() {
  const rpc = vi.fn().mockImplementation((name: string) => {
    if (name === "claim_referral_credit") {
      return Promise.resolve({
        data: {
          credit_id: "credit_123",
          referral_id: "referral_123",
          member_id: "referrer_123",
          credit_months: 1,
          idempotency_key: "referral-credit:referral_123:referrer_123",
        },
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  });
  const subscription = {
    stripe_customer_id: "cus_referrer_123",
    price_amount: 2_500,
    currency: "gbp",
  };
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.maybeSingle = vi.fn().mockResolvedValue({
    data: subscription,
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
      p_error_details: { message: "Stripe temporarily unavailable" },
    });
    expect(createBalanceTransaction).toHaveBeenCalledTimes(2);
    expect(createBalanceTransaction.mock.calls[0][2]).toEqual({
      idempotencyKey: "referral-credit:referral_123:referrer_123",
    });
    expect(createBalanceTransaction.mock.calls[1][2]).toEqual({
      idempotencyKey: "referral-credit:referral_123:referrer_123",
    });
    expect(rpc).toHaveBeenCalledWith("mark_referral_credit_applied", {
      p_credit_id: "credit_123",
      p_stripe_balance_transaction_id: "cbtxn_123",
    });
  });
});
