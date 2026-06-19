/**
 * Tests for provider-onsite-payment-service.
 *
 * Functions under contract:
 *  - createOnsitePaymentIntent(providerId, invoiceId, supabase)
 *  - confirmOnsitePayment(providerId, paymentIntentId, supabase)
 *
 * All monetary amounts are in pence (GBP × 100).
 * Platform fee is 2.5%.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/services/provider/provider-invoice-service");

// ---------------------------------------------------------------------------
// Mock @/lib/stripe (server-only singleton used by the service)
// ---------------------------------------------------------------------------

const mockPaymentIntentsCreate = vi.fn();
const mockPaymentIntentsRetrieve = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(() => ({
    paymentIntents: {
      create: mockPaymentIntentsCreate,
      retrieve: mockPaymentIntentsRetrieve,
    },
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type InvoiceRow = {
  id: string;
  provider_id: string;
  status: string;
  total_amount: number;
  stripe_payment_intent_id: string | null;
  booking_id: string | null;
};

type StripeConnectRow = {
  provider_id: string;
  stripe_account_id: string;
  charges_enabled: boolean;
};

function makeInvoice(overrides?: Partial<InvoiceRow>): InvoiceRow {
  return {
    id: "inv-uuid-1",
    provider_id: "provider-uuid-1",
    status: "sent",
    total_amount: 100, // £100.00 → 10000 pence
    stripe_payment_intent_id: null,
    booking_id: "booking-uuid-1",
    ...overrides,
  };
}

function makeStripeConnectRow(overrides?: Partial<StripeConnectRow>): StripeConnectRow {
  return {
    provider_id: "provider-uuid-1",
    stripe_account_id: "acct_test_1",
    charges_enabled: true,
    ...overrides,
  };
}

/**
 * Build a minimal Supabase mock that supports the query chains needed by the service:
 *  - provider_invoices: select / eq / maybeSingle, and update / eq / neq / maybeSingle
 *  - stripe_connect_accounts: select / eq / maybeSingle
 */
function makeSupabaseMock(opts: {
  invoice?: InvoiceRow | null;
  invoiceError?: { message: string } | null;
  stripeConnect?: StripeConnectRow | null;
  stripeConnectError?: { message: string } | null;
  updateInvoiceData?: InvoiceRow | null;
  updateInvoiceError?: { message: string } | null;
}) {
  const {
    invoice = makeInvoice(),
    invoiceError = null,
    stripeConnect = makeStripeConnectRow(),
    stripeConnectError = null,
    updateInvoiceData = invoice,
    updateInvoiceError = null,
  } = opts;

  // Update chain for provider_invoices
  const updateChain = {
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: updateInvoiceData, error: updateInvoiceError }),
  };
  // Wire update().eq() back to the same chain
  const invoiceUpdate = vi.fn().mockReturnValue(updateChain);

  // Select chain for provider_invoices
  const invoiceSelectChain = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: invoice, error: invoiceError }),
  };

  // Select chain for stripe_connect_accounts
  const stripeSelectChain = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: stripeConnect, error: stripeConnectError }),
  };

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "provider_invoices") {
        return {
          select: vi.fn().mockReturnValue(invoiceSelectChain),
          update: invoiceUpdate,
        };
      }
      if (table === "stripe_connect_accounts") {
        return { select: vi.fn().mockReturnValue(stripeSelectChain) };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Import subject under test (after mocks are set up)
// ---------------------------------------------------------------------------

import {
  createOnsitePaymentIntent,
  confirmOnsitePayment,
} from "../provider-onsite-payment-service";
import { markInvoicePaid } from "../provider-invoice-service";

const mockMarkInvoicePaid = vi.mocked(markInvoicePaid);

// ---------------------------------------------------------------------------
// Default Stripe mock responses
// ---------------------------------------------------------------------------

const defaultPaymentIntent = {
  id: "pi_test_123",
  client_secret: "pi_test_123_secret_xyz",
  amount: 10000,
  currency: "gbp",
  status: "requires_payment_method",
  metadata: {
    invoice_id: "inv-uuid-1",
    provider_id: "provider-uuid-1",
    booking_id: "booking-uuid-1",
  },
};

// ---------------------------------------------------------------------------
// createOnsitePaymentIntent
// ---------------------------------------------------------------------------

describe("createOnsitePaymentIntent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPaymentIntentsCreate.mockResolvedValue(defaultPaymentIntent);
    mockPaymentIntentsRetrieve.mockResolvedValue(defaultPaymentIntent);
    mockMarkInvoicePaid.mockResolvedValue({} as never);
  });

  it("creates PaymentIntent with correct amount from invoice total (£100 → 10000 pence)", async () => {
    const supabase = makeSupabaseMock({});
    await createOnsitePaymentIntent("provider-uuid-1", "inv-uuid-1", supabase as never);

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 10000 }),
      expect.anything(),
    );
  });

  it("applies 2.5% platform fee", async () => {
    const supabase = makeSupabaseMock({});
    await createOnsitePaymentIntent("provider-uuid-1", "inv-uuid-1", supabase as never);

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        application_fee_amount: 250, // 2.5% of 10000
      }),
      expect.anything(),
    );
  });

  it("sets transfer_data.destination to provider's Stripe account", async () => {
    const supabase = makeSupabaseMock({});
    await createOnsitePaymentIntent("provider-uuid-1", "inv-uuid-1", supabase as never);

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        transfer_data: { destination: "acct_test_1" },
      }),
      expect.anything(),
    );
  });

  it("rejects if invoice not owned by provider", async () => {
    const supabase = makeSupabaseMock({
      invoice: makeInvoice({ provider_id: "provider-uuid-other" }),
    });

    await expect(
      createOnsitePaymentIntent("provider-uuid-1", "inv-uuid-1", supabase as never),
    ).rejects.toThrow(/not owned/i);
  });

  it("rejects if invoice status is not 'sent'", async () => {
    const supabase = makeSupabaseMock({
      invoice: makeInvoice({ status: "draft" }),
    });

    await expect(
      createOnsitePaymentIntent("provider-uuid-1", "inv-uuid-1", supabase as never),
    ).rejects.toThrow(/status/i);
  });

  it("rejects if charges not enabled for provider", async () => {
    const supabase = makeSupabaseMock({
      stripeConnect: makeStripeConnectRow({ charges_enabled: false }),
    });

    await expect(
      createOnsitePaymentIntent("provider-uuid-1", "inv-uuid-1", supabase as never),
    ).rejects.toThrow(/not enabled/i);
  });

  it("returns existing PaymentIntent if invoice already has one (idempotent)", async () => {
    const existingPiId = "pi_already_exists";
    const existingSecret = "pi_already_exists_secret";
    const supabase = makeSupabaseMock({
      invoice: makeInvoice({ stripe_payment_intent_id: existingPiId }),
    });
    mockPaymentIntentsRetrieve.mockResolvedValue({
      ...defaultPaymentIntent,
      id: existingPiId,
      client_secret: existingSecret,
    });

    const result = await createOnsitePaymentIntent(
      "provider-uuid-1",
      "inv-uuid-1",
      supabase as never,
    );

    expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
    expect(mockPaymentIntentsRetrieve).toHaveBeenCalledWith(existingPiId, expect.anything());
    expect(result.clientSecret).toBe(existingSecret);
    expect(result.paymentIntentId).toBe(existingPiId);
  });

  it("updates invoice with stripe_payment_intent_id after creating PaymentIntent", async () => {
    const supabase = makeSupabaseMock({});
    await createOnsitePaymentIntent("provider-uuid-1", "inv-uuid-1", supabase as never);

    // Verify update was called on provider_invoices
    const fromCalls = (supabase.from as ReturnType<typeof vi.fn>).mock.calls;
    const invoiceCalls = fromCalls.filter(([t]: string[]) => t === "provider_invoices");
    // Should have a select call and an update call
    expect(invoiceCalls.length).toBeGreaterThanOrEqual(2);
  });

  it("returns OnsitePaymentIntent with correct shape", async () => {
    const supabase = makeSupabaseMock({});
    const result = await createOnsitePaymentIntent(
      "provider-uuid-1",
      "inv-uuid-1",
      supabase as never,
    );

    expect(result).toMatchObject({
      clientSecret: defaultPaymentIntent.client_secret,
      paymentIntentId: defaultPaymentIntent.id,
      amountPence: 10000,
      invoiceId: "inv-uuid-1",
    });
  });
});

// ---------------------------------------------------------------------------
// confirmOnsitePayment
// ---------------------------------------------------------------------------

describe("confirmOnsitePayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMarkInvoicePaid.mockResolvedValue({} as never);
  });

  it("marks invoice paid when PaymentIntent status is 'succeeded'", async () => {
    const succeededPI = {
      ...defaultPaymentIntent,
      status: "succeeded",
    };
    mockPaymentIntentsRetrieve.mockResolvedValue(succeededPI);

    const supabase = makeSupabaseMock({});
    await confirmOnsitePayment("provider-uuid-1", "pi_test_123", supabase as never);

    expect(mockMarkInvoicePaid).toHaveBeenCalledWith(
      supabase,
      "provider-uuid-1",
      "inv-uuid-1",
      expect.any(String),
    );
  });

  it("does not mark invoice paid when PaymentIntent status is not 'succeeded'", async () => {
    const pendingPI = {
      ...defaultPaymentIntent,
      status: "requires_payment_method",
    };
    mockPaymentIntentsRetrieve.mockResolvedValue(pendingPI);

    const supabase = makeSupabaseMock({});
    await confirmOnsitePayment("provider-uuid-1", "pi_test_123", supabase as never);

    expect(mockMarkInvoicePaid).not.toHaveBeenCalled();
  });

  it("returns PaymentConfirmation with correct shape", async () => {
    const succeededPI = {
      ...defaultPaymentIntent,
      status: "succeeded",
    };
    mockPaymentIntentsRetrieve.mockResolvedValue(succeededPI);

    const supabase = makeSupabaseMock({});
    const result = await confirmOnsitePayment("provider-uuid-1", "pi_test_123", supabase as never);

    expect(result).toMatchObject({
      status: "succeeded",
      invoiceId: "inv-uuid-1",
    });
    expect(result.paidAt === null || typeof result.paidAt === "string").toBe(true);
  });
});
