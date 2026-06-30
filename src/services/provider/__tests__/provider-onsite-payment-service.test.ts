/**
 * Tests for provider-onsite-payment-service.
 *
 * Functions under contract:
 *  - createOnsitePaymentIntent(providerId, invoiceId, supabase)
 *  - confirmOnsitePayment(providerId, paymentIntentId, supabase)
 *
 * All monetary amounts are in pence.
 * Platform commission is 0% (subscription-only monetisation) — no application
 * fee is taken and the full amount settles to the trader's connected account.
 * The payable amount is recomputed from line items, not the total_amount column.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
// Keep the real invoiceTotalPence (used to recompute the charge amount); mock
// only the DB-writing markInvoicePaid.
vi.mock("@/services/provider/provider-invoice-service", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../provider-invoice-service")
  >();
  return { ...actual, markInvoicePaid: vi.fn() };
});

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

type InvoiceLineItem = {
  name: string;
  quantity: number;
  unit_price_pence: number;
  total_pence: number;
  vat_rate?: number;
};

type InvoiceRow = {
  id: string;
  provider_id: string;
  status: string;
  line_items: InvoiceLineItem[];
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
    // £100.00 → 10000 pence, recomputed from line items (vat_rate 0 keeps total = subtotal)
    line_items: [
      { name: "Labour", quantity: 1, unit_price_pence: 10000, total_pence: 10000, vat_rate: 0 },
    ],
    total_amount: 10000,
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
  createInvoicePaymentIntentForCustomer,
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

  it("creates PaymentIntent with amount recomputed from line items (£100 → 10000 pence)", async () => {
    const supabase = makeSupabaseMock({});
    await createOnsitePaymentIntent("provider-uuid-1", "inv-uuid-1", supabase as never);

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 10000 }),
    );
  });

  it("takes 0% platform commission — no application_fee_amount", async () => {
    const supabase = makeSupabaseMock({});
    await createOnsitePaymentIntent("provider-uuid-1", "inv-uuid-1", supabase as never);

    const [params] = mockPaymentIntentsCreate.mock.calls[0] as [Record<string, unknown>];
    expect(params.application_fee_amount).toBeUndefined();
  });

  it("routes the full amount to the trader via a platform destination charge", async () => {
    const supabase = makeSupabaseMock({});
    await createOnsitePaymentIntent("provider-uuid-1", "inv-uuid-1", supabase as never);

    const [params, options] = mockPaymentIntentsCreate.mock.calls[0] as [
      Record<string, unknown>,
      unknown,
    ];
    // Destination charge: full amount transferred to the trader's connected account.
    expect(params.transfer_data).toEqual({ destination: "acct_test_1" });
    expect(params.on_behalf_of).toBe("acct_test_1");
    // PI is created on the platform account (no per-account scope), so the
    // platform webhook + platform publishable key handle it.
    expect(options).toBeUndefined();
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
    expect(mockPaymentIntentsRetrieve).toHaveBeenCalledWith(existingPiId);
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
// createInvoicePaymentIntentForCustomer (pay-by-token)
// ---------------------------------------------------------------------------

describe("createInvoicePaymentIntentForCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPaymentIntentsCreate.mockResolvedValue(defaultPaymentIntent);
    mockPaymentIntentsRetrieve.mockResolvedValue(defaultPaymentIntent);
  });

  it("creates a PaymentIntent for a sent invoice without a provider ownership check", async () => {
    const supabase = makeSupabaseMock({});
    const result = await createInvoicePaymentIntentForCustomer(
      "inv-uuid-1",
      supabase as never,
    );

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 10000,
        transfer_data: { destination: "acct_test_1" },
      }),
    );
    expect(result.amountPence).toBe(10000);
  });

  it("takes 0% commission — no application_fee_amount", async () => {
    const supabase = makeSupabaseMock({});
    await createInvoicePaymentIntentForCustomer("inv-uuid-1", supabase as never);
    const [params] = mockPaymentIntentsCreate.mock.calls[0] as [Record<string, unknown>];
    expect(params.application_fee_amount).toBeUndefined();
  });

  it("rejects an already-paid invoice", async () => {
    const supabase = makeSupabaseMock({ invoice: makeInvoice({ status: "paid" }) });
    await expect(
      createInvoicePaymentIntentForCustomer("inv-uuid-1", supabase as never),
    ).rejects.toThrow(/already been paid/i);
  });

  it("rejects an invoice that is not yet sent", async () => {
    const supabase = makeSupabaseMock({ invoice: makeInvoice({ status: "draft" }) });
    await expect(
      createInvoicePaymentIntentForCustomer("inv-uuid-1", supabase as never),
    ).rejects.toThrow(/not ready for payment/i);
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
