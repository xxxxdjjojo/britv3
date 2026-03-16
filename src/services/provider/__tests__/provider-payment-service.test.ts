/**
 * Contract stubs for provider-payment-service.
 *
 * These tests document the expected API surface and return shapes that
 * Wave 2 must implement. They are intentionally NOT passing — the service
 * file does not exist yet. Do not make these pass until Wave 2.
 *
 * Functions under contract:
 *  - getStripeBalance(providerId: string, client: SupabaseClient)
 *  - getPayoutHistory(providerId: string, limit: number, client: SupabaseClient)
 *  - getTransactionDetail(transactionId: string, providerId: string, client: SupabaseClient)
 *
 * Note: All monetary amounts are expressed in pence (GBP × 100).
 * Stripe Connect is used for payouts. Platform fee is 2.5%.
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

// @ts-expect-error — service not yet implemented (Wave 2)
import {
  getPayoutHistory,
  getStripeBalance,
  getTransactionDetail,
} from "../provider-payment-service";

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

const mockClient = {} as ReturnType<typeof import("@supabase/supabase-js").createClient>;

// ---------------------------------------------------------------------------
// getStripeBalance
// ---------------------------------------------------------------------------

describe("getStripeBalance", () => {
  it("returns the Stripe Connect balance with the correct shape", async () => {
    const result = await getStripeBalance("provider-uuid-1", mockClient);

    expect(result).toEqual(
      expect.objectContaining({
        /**
         * Available balance — funds that can be paid out immediately, in pence.
         * Maps to Stripe balance.available[].amount
         */
        availablePence: expect.any(Number),
        /**
         * Pending balance — funds in transit (not yet settled), in pence.
         * Maps to Stripe balance.pending[].amount
         */
        pendingPence: expect.any(Number),
        /** ISO 4217 currency code, always "gbp" for UK providers */
        currency: expect.any(String),
        /**
         * Next scheduled payout date (ISO 8601 date string).
         * Null if no payout is scheduled.
         */
        nextPayoutDate: expect.anything(),
        /** Next scheduled payout amount in pence. Null if not scheduled. */
        nextPayoutAmountPence: expect.anything(),
      }),
    );
  });

  it("returns currency 'gbp' for all UK providers", async () => {
    const result = await getStripeBalance("provider-uuid-1", mockClient);
    expect(result.currency).toBe("gbp");
  });

  it("returns zero balances (not null) when provider has no Stripe activity", async () => {
    const result = await getStripeBalance("provider-uuid-new", mockClient);

    expect(result).toEqual(
      expect.objectContaining({
        availablePence: 0,
        pendingPence: 0,
      }),
    );
  });

  it("throws when the provider has no connected Stripe account", async () => {
    await expect(
      getStripeBalance("provider-uuid-no-stripe", mockClient),
    ).rejects.toThrow();
  });

  it("availablePence and pendingPence are non-negative integers", async () => {
    const result = await getStripeBalance("provider-uuid-1", mockClient);
    expect(result.availablePence).toBeGreaterThanOrEqual(0);
    expect(result.pendingPence).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.availablePence)).toBe(true);
    expect(Number.isInteger(result.pendingPence)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getPayoutHistory
// ---------------------------------------------------------------------------

describe("getPayoutHistory", () => {
  it("returns an array of payout records with the correct shape", async () => {
    const result = await getPayoutHistory("provider-uuid-1", 10, mockClient);

    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      expect(result[0]).toEqual(
        expect.objectContaining({
          /** Payout id (Stripe payout id or internal id) */
          id: expect.any(String),
          /** Amount paid out in pence */
          amountPence: expect.any(Number),
          /** ISO 4217 currency code */
          currency: expect.any(String),
          /**
           * Payout status:
           * 'paid' | 'pending' | 'in_transit' | 'failed' | 'cancelled'
           */
          status: expect.any(String),
          /** ISO 8601 date when payout was initiated */
          initiatedAt: expect.any(String),
          /** ISO 8601 date when payout arrived in bank (null if not yet arrived) */
          arrivedAt: expect.anything(),
          /** Bank account last 4 digits (masked) */
          bankLast4: expect.anything(),
        }),
      );
    }
  });

  it("respects the limit parameter", async () => {
    const result = await getPayoutHistory("provider-uuid-1", 5, mockClient);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("returns payouts ordered by initiatedAt descending (most recent first)", async () => {
    const result = await getPayoutHistory("provider-uuid-1", 20, mockClient);

    for (let i = 1; i < result.length; i++) {
      expect(result[i].initiatedAt <= result[i - 1].initiatedAt).toBe(true);
    }
  });

  it("returns an empty array (not null) when no payouts have been made", async () => {
    const result = await getPayoutHistory("provider-uuid-new", 10, mockClient);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getTransactionDetail
// ---------------------------------------------------------------------------

describe("getTransactionDetail", () => {
  it("returns a full transaction detail object with the correct shape", async () => {
    const result = await getTransactionDetail(
      "txn-uuid-1",
      "provider-uuid-1",
      mockClient,
    );

    expect(result).toEqual(
      expect.objectContaining({
        /** Transaction id */
        id: expect.any(String),
        /**
         * Transaction type:
         * 'job_payment' | 'platform_fee' | 'refund' | 'payout' | 'adjustment'
         */
        type: expect.any(String),
        /** Gross amount in pence (before platform fee) */
        grossAmountPence: expect.any(Number),
        /** Platform fee deducted (2.5%), in pence */
        platformFeePence: expect.any(Number),
        /** Net amount credited to provider in pence */
        netAmountPence: expect.any(Number),
        /** ISO 4217 currency code */
        currency: expect.any(String),
        /**
         * Transaction status:
         * 'pending' | 'completed' | 'failed' | 'refunded'
         */
        status: expect.any(String),
        /** ISO 8601 timestamp */
        createdAt: expect.any(String),
        /** Reference to the related job (null for non-job transactions) */
        jobId: expect.anything(),
        /** Client name associated with the transaction */
        clientName: expect.anything(),
        /** Stripe charge / payment intent id for reconciliation */
        stripePaymentIntentId: expect.anything(),
      }),
    );
  });

  it("ensures netAmountPence equals grossAmountPence minus platformFeePence", async () => {
    const result = await getTransactionDetail(
      "txn-uuid-1",
      "provider-uuid-1",
      mockClient,
    );

    if (result !== null) {
      expect(result.netAmountPence).toBe(
        result.grossAmountPence - result.platformFeePence,
      );
    }
  });

  it("platformFeePence is approximately 2.5% of grossAmountPence", async () => {
    const result = await getTransactionDetail(
      "txn-uuid-1",
      "provider-uuid-1",
      mockClient,
    );

    if (result !== null && result.grossAmountPence > 0) {
      const expectedFee = Math.round(result.grossAmountPence * 0.025);
      // Allow ±1 pence rounding tolerance
      expect(Math.abs(result.platformFeePence - expectedFee)).toBeLessThanOrEqual(1);
    }
  });

  it("returns null when the transaction does not exist", async () => {
    const result = await getTransactionDetail(
      "nonexistent-txn",
      "provider-uuid-1",
      mockClient,
    );
    expect(result).toBeNull();
  });

  it("throws an authorization error when the transaction belongs to a different provider", async () => {
    await expect(
      getTransactionDetail("txn-uuid-other-provider", "provider-uuid-1", mockClient),
    ).rejects.toThrow();
  });
});
