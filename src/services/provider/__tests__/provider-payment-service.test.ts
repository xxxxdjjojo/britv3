/**
 * Tests for provider-payment-service.
 *
 * Functions under contract:
 *  - getStripeBalance(providerId: string, client: SupabaseClient)
 *  - getPayoutHistory(providerId: string, limit: number, client: SupabaseClient)
 *  - getTransactionDetail(transactionId: string, providerId: string, client: SupabaseClient)
 *
 * Note: All monetary amounts are expressed in pence (GBP × 100).
 * Stripe Connect is used for payouts. Platform fee is 2.5%.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

// ---------------------------------------------------------------------------
// Mock Stripe
// ---------------------------------------------------------------------------

vi.mock("stripe", () => {
  const mockBalance = {
    available: [{ amount: 12500, currency: "gbp" }],
    pending: [{ amount: 5000, currency: "gbp" }],
    livemode: false,
    object: "balance" as const,
    connect_reserved: [],
    instant_available: [],
  };

  const mockPayouts = {
    data: [
      {
        id: "po_test_1",
        amount: 10000,
        currency: "gbp",
        status: "paid",
        created: 1700000000,
        arrival_date: 1700086400,
        destination: { last4: "1234", object: "bank_account" },
        object: "payout" as const,
        automatic: true,
        balance_transaction: "txn_1",
        description: null,
        failure_balance_transaction: null,
        failure_code: null,
        failure_message: null,
        livemode: false,
        metadata: {},
        method: "standard" as const,
        original_payout: null,
        reversed_by: null,
        source_type: "card" as const,
        statement_descriptor: null,
        type: "bank_account" as const,
      },
    ],
    has_more: false,
    object: "list" as const,
    url: "/v1/payouts",
  };

  const mockCharge = {
    id: "ch_test_txn1",
    amount: 10000,
    currency: "gbp",
    status: "succeeded",
    created: 1700000000,
    billing_details: { name: "Test Client", email: null, phone: null, address: null },
    payment_intent: "pi_test_1",
    object: "charge" as const,
    livemode: false,
  };

  // Map provider IDs to stripe account IDs via the supabase mock
  // provider-uuid-1    → acct_test_1 (active)
  // provider-uuid-new  → acct_test_new (new, no activity)
  // provider-uuid-no-stripe → no account in DB (throws)
  // txn-uuid-other-provider → acct_test_other

  const mockStripeInstance = {
    accounts: {
      create: vi.fn().mockResolvedValue({ id: "acct_new_created" }),
    },
    accountLinks: {
      create: vi.fn().mockResolvedValue({ url: "https://connect.stripe.com/setup/s/test" }),
    },
    balance: {
      retrieve: vi.fn().mockImplementation(
        (_params: { stripeAccount?: string } | undefined) => {
          const accountId = _params?.stripeAccount;
          if (accountId === "acct_test_new") {
            return Promise.resolve({
              ...mockBalance,
              available: [{ amount: 0, currency: "gbp" }],
              pending: [{ amount: 0, currency: "gbp" }],
            });
          }
          return Promise.resolve(mockBalance);
        },
      ),
    },
    payouts: {
      list: vi.fn().mockImplementation(
        (_params: Record<string, unknown>, _opts: { stripeAccount?: string } | undefined) => {
          const accountId = _opts?.stripeAccount;
          if (accountId === "acct_test_new") {
            return Promise.resolve({ data: [], has_more: false, object: "list", url: "/v1/payouts" });
          }
          // Respect limit parameter
          const limit = typeof _params?.limit === "number" ? _params.limit : 20;
          return Promise.resolve({
            ...mockPayouts,
            data: mockPayouts.data.slice(0, limit),
          });
        },
      ),
    },
    charges: {
      retrieve: vi.fn().mockImplementation(
        (chargeId: string, _opts: { stripeAccount?: string } | undefined) => {
          if (chargeId === "txn-uuid-1") {
            return Promise.resolve({ ...mockCharge, id: chargeId });
          }
          if (chargeId === "nonexistent-txn") {
            const err = new Error("No such charge") as Error & { code?: string; type?: string };
            err.code = "resource_missing";
            err.type = "StripeInvalidRequestError";
            // Make it an instance check-friendly error
            return Promise.reject(
              Object.assign(new Error("No such charge"), {
                code: "resource_missing",
                type: "StripeInvalidRequestError",
                constructor: { name: "StripeInvalidRequestError" },
              }),
            );
          }
          return Promise.resolve({ ...mockCharge, id: chargeId });
        },
      ),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
    errors: {
      StripeConnectionError: class StripeConnectionError extends Error {
        type = "StripeConnectionError";
      },
      StripeInvalidRequestError: class StripeInvalidRequestError extends Error {
        type = "StripeInvalidRequestError";
        code?: string;
        constructor(message: string, code?: string) {
          super(message);
          this.code = code;
        }
      },
    },
  };

  function MockStripe() {
    return mockStripeInstance;
  }
  // Attach errors as static properties so `Stripe.errors.X` works
  Object.assign(MockStripe, {
    errors: mockStripeInstance.errors,
  });

  return {
    default: MockStripe,
  };
});

// ---------------------------------------------------------------------------
// Mock Supabase client — keyed by provider ID
// ---------------------------------------------------------------------------

function makeSupabaseMock(
  providerId: string,
  overrides?: {
    invoiceData?: Record<string, unknown> | null;
    invoiceError?: { message: string } | null;
  },
) {
  // stripe_connect_accounts lookup
  const stripeAccountMap: Record<string, { stripe_account_id: string; provider_id: string } | null> = {
    "provider-uuid-1": { stripe_account_id: "acct_test_1", provider_id: "provider-uuid-1" },
    "provider-uuid-new": { stripe_account_id: "acct_test_new", provider_id: "provider-uuid-new" },
    "provider-uuid-no-stripe": null,
    "provider-uuid-other": { stripe_account_id: "acct_test_other", provider_id: "provider-uuid-other" },
  };

  const stripeRow = stripeAccountMap[providerId] ?? null;

  const mockMaybeSingle = vi.fn().mockResolvedValue({ data: stripeRow, error: null });

  // Invoice query chain mock
  const invoiceData = overrides?.invoiceData ?? null;
  const invoiceError = overrides?.invoiceError ?? null;
  const invoiceMaybeSingle = vi.fn().mockResolvedValue({ data: invoiceData, error: invoiceError });

  const invoiceSelectChain = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: invoiceMaybeSingle,
  };

  const stripeSelectChain = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: mockMaybeSingle,
  };

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "stripe_connect_accounts") {
        return { select: vi.fn().mockReturnValue(stripeSelectChain) };
      }
      if (table === "provider_invoices") {
        return { select: vi.fn().mockReturnValue(invoiceSelectChain) };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };
}

import {
  getPayoutHistory,
  getStripeBalance,
  getTransactionDetail,
} from "../provider-payment-service";

// ---------------------------------------------------------------------------
// getStripeBalance
// ---------------------------------------------------------------------------

describe("getStripeBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the Stripe Connect balance with the correct shape", async () => {
    const client = makeSupabaseMock("provider-uuid-1");
    const result = await getStripeBalance("provider-uuid-1", client as never);

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
    const client = makeSupabaseMock("provider-uuid-1");
    const result = await getStripeBalance("provider-uuid-1", client as never);
    expect(result.currency).toBe("gbp");
  });

  it("returns zero balances (not null) when provider has no Stripe activity", async () => {
    const client = makeSupabaseMock("provider-uuid-new");
    const result = await getStripeBalance("provider-uuid-new", client as never);

    expect(result).toEqual(
      expect.objectContaining({
        availablePence: 0,
        pendingPence: 0,
      }),
    );
  });

  it("throws when the provider has no connected Stripe account", async () => {
    const client = makeSupabaseMock("provider-uuid-no-stripe");
    await expect(
      getStripeBalance("provider-uuid-no-stripe", client as never),
    ).rejects.toThrow();
  });

  it("availablePence and pendingPence are non-negative integers", async () => {
    const client = makeSupabaseMock("provider-uuid-1");
    const result = await getStripeBalance("provider-uuid-1", client as never);
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an array of payout records with the correct shape", async () => {
    const client = makeSupabaseMock("provider-uuid-1");
    const result = await getPayoutHistory("provider-uuid-1", 10, client as never);

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
    const client = makeSupabaseMock("provider-uuid-1");
    const result = await getPayoutHistory("provider-uuid-1", 5, client as never);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("returns payouts ordered by initiatedAt descending (most recent first)", async () => {
    const client = makeSupabaseMock("provider-uuid-1");
    const result = await getPayoutHistory("provider-uuid-1", 20, client as never);

    for (let i = 1; i < result.length; i++) {
      expect(result[i].initiatedAt <= result[i - 1].initiatedAt).toBe(true);
    }
  });

  it("returns an empty array (not null) when no payouts have been made", async () => {
    const client = makeSupabaseMock("provider-uuid-new");
    const result = await getPayoutHistory("provider-uuid-new", 10, client as never);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getTransactionDetail
// ---------------------------------------------------------------------------

describe("getTransactionDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a full transaction detail object with the correct shape", async () => {
    const client = makeSupabaseMock("provider-uuid-1");
    const result = await getTransactionDetail(
      "txn-uuid-1",
      "provider-uuid-1",
      client as never,
    );

    // Assert required scalar fields
    expect(result).not.toBeNull();
    if (result === null) return;
    expect(result.id).toEqual(expect.any(String));
    expect(result.type).toEqual(expect.any(String));
    expect(result.grossAmountPence).toEqual(expect.any(Number));
    expect(result.platformFeePence).toEqual(expect.any(Number));
    expect(result.netAmountPence).toEqual(expect.any(Number));
    expect(result.currency).toEqual(expect.any(String));
    expect(result.status).toEqual(expect.any(String));
    expect(result.createdAt).toEqual(expect.any(String));
    // Nullable fields — may be null or string
    expect(result.jobId === null || typeof result.jobId === "string").toBe(true);
    expect(result.clientName === null || typeof result.clientName === "string").toBe(true);
    expect(result.stripePaymentIntentId === null || typeof result.stripePaymentIntentId === "string").toBe(true);
  });

  it("ensures netAmountPence equals grossAmountPence minus platformFeePence", async () => {
    const client = makeSupabaseMock("provider-uuid-1");
    const result = await getTransactionDetail(
      "txn-uuid-1",
      "provider-uuid-1",
      client as never,
    );

    if (result !== null) {
      expect(result.netAmountPence).toBe(
        result.grossAmountPence - result.platformFeePence,
      );
    }
  });

  it("platformFeePence is approximately 2.5% of grossAmountPence", async () => {
    const client = makeSupabaseMock("provider-uuid-1");
    const result = await getTransactionDetail(
      "txn-uuid-1",
      "provider-uuid-1",
      client as never,
    );

    if (result !== null && result.grossAmountPence > 0) {
      const expectedFee = Math.round(result.grossAmountPence * 0.025);
      // Allow ±1 pence rounding tolerance
      expect(Math.abs(result.platformFeePence - expectedFee)).toBeLessThanOrEqual(1);
    }
  });

  it("returns null when the transaction does not exist", async () => {
    // nonexistent-txn → Stripe throws resource_missing, service returns null
    const client = makeSupabaseMock("provider-uuid-1");
    const result = await getTransactionDetail(
      "nonexistent-txn",
      "provider-uuid-1",
      client as never,
    );
    expect(result).toBeNull();
  });

  it("throws an authorization error when the transaction belongs to a different provider", async () => {
    // Invoice row exists but belongs to a different provider
    const client = makeSupabaseMock("provider-uuid-1", {
      invoiceData: {
        id: "txn-uuid-other-provider",
        provider_id: "provider-uuid-other",
        status: "paid",
        total_amount: 10000,
        stripe_payment_intent_id: "pi_other",
        created_at: new Date().toISOString(),
        bookings: null,
      },
      invoiceError: null,
    });

    await expect(
      getTransactionDetail("txn-uuid-other-provider", "provider-uuid-1", client as never),
    ).rejects.toThrow();
  });
});
