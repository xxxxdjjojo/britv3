/**
 * Tests for provider-invoice-service.
 *
 * Functions under contract:
 *  - generateInvoice(supabase, providerId, input)
 *  - getInvoicesByProvider(supabase, providerId, status?)
 *  - markInvoicePaid(supabase, providerId, invoiceId, paidAt?)
 *  - updateInvoice(supabase, providerId, invoiceId, updates)
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import {
  generateInvoice,
  getInvoicesByProvider,
  markInvoicePaid,
  updateInvoice,
} from "../provider-invoice-service";

import type { CreateInvoiceInput } from "../provider-invoice-service";
import type { InvoiceLineItem } from "@/types/provider-dashboard";

// ---------------------------------------------------------------------------
// Helpers to build a chainable Supabase query mock
// ---------------------------------------------------------------------------

function makeQueryMock(resolveValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from", "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "in", "not", "gte", "lte", "gt", "lt",
    "order", "limit", "range", "maybeSingle", "single",
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  (chain["maybeSingle"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain["single"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain as unknown as { then: Promise<unknown>["then"] }).then = Promise.resolve(
    resolveValue,
  ).then.bind(Promise.resolve(resolveValue));
  return chain as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PROVIDER_ID = "prov-001";
const CLIENT_ID = "client-001";

/** Line items without explicit vat_rate (should default to 20%). */
const lineItemsNoVat: InvoiceLineItem[] = [
  { name: "Plumbing repair", quantity: 1, unit_price_pence: 20000, total_pence: 20000 },
  { name: "Call-out fee", quantity: 1, unit_price_pence: 5000, total_pence: 5000 },
];
// subtotal = 25000, default VAT = 20% => vat_amount = 5000, total = 30000

/** Line items with explicit per-item vat_rate. */
const lineItemsWithVat: InvoiceLineItem[] = [
  { name: "Labour", quantity: 2, unit_price_pence: 10000, total_pence: 20000, vat_rate: 0.2 },
  { name: "Materials (zero-rated)", quantity: 1, unit_price_pence: 8000, total_pence: 8000, vat_rate: 0 },
];
// subtotal = 28000, VAT = 20000*0.2 + 8000*0 = 4000, total = 32000

function makeInvoice(overrides: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  const year = new Date().getFullYear();
  return {
    id: "inv-001",
    provider_id: PROVIDER_ID,
    booking_id: null,
    client_id: CLIENT_ID,
    invoice_number: `INV-${year}-0001`,
    line_items: lineItemsNoVat,
    subtotal: 25000,
    vat_amount: 5000,
    total_amount: 30000,
    currency: "gbp",
    status: "draft",
    due_date: null,
    paid_at: null,
    stripe_payment_intent_id: null,
    notes: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// generateInvoice
// ---------------------------------------------------------------------------

describe("generateInvoice", () => {
  it("returns correct shape with draft status", async () => {
    const invoice = makeInvoice();
    const countChain = makeQueryMock({ count: 0, error: null });
    const insertChain = makeQueryMock({ data: invoice, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: invoice, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? countChain : insertChain;
    });

    const input: CreateInvoiceInput = {
      client_id: CLIENT_ID,
      line_items: lineItemsNoVat,
    };

    const result = await generateInvoice(client, PROVIDER_ID, input);
    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        provider_id: PROVIDER_ID,
        client_id: CLIENT_ID,
        status: "draft",
        invoice_number: expect.stringMatching(/^INV-\d{4}-\d{4}$/),
        subtotal: expect.any(Number),
        vat_amount: expect.any(Number),
        total_amount: expect.any(Number),
        currency: "gbp",
        paid_at: null,
      }),
    );
  });

  it("calculates VAT at 20% by default when no per-item vat_rate", async () => {
    const invoice = makeInvoice({
      subtotal: 25000,
      vat_amount: 5000,
      total_amount: 30000,
    });

    const countChain = makeQueryMock({ count: 0, error: null });
    const insertChain = makeQueryMock({ data: invoice, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: invoice, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? countChain : insertChain;
    });

    await generateInvoice(client, PROVIDER_ID, {
      client_id: CLIENT_ID,
      line_items: lineItemsNoVat,
    });

    // Verify insert was called with correct VAT (20% of 25000 = 5000)
    const insertFn = insertChain.insert as ReturnType<typeof vi.fn>;
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 25000,
        vat_amount: 5000,
        total_amount: 30000,
      }),
    );
  });

  it("uses per-item vat_rate when provided", async () => {
    // Labour: 20000 * 0.2 = 4000 VAT, Materials: 8000 * 0 = 0 VAT
    // subtotal = 28000, vat = 4000, total = 32000
    const invoice = makeInvoice({
      line_items: lineItemsWithVat,
      subtotal: 28000,
      vat_amount: 4000,
      total_amount: 32000,
    });

    const countChain = makeQueryMock({ count: 0, error: null });
    const insertChain = makeQueryMock({ data: invoice, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: invoice, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? countChain : insertChain;
    });

    await generateInvoice(client, PROVIDER_ID, {
      client_id: CLIENT_ID,
      line_items: lineItemsWithVat,
    });

    const insertFn = insertChain.insert as ReturnType<typeof vi.fn>;
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 28000,
        vat_amount: 4000,
        total_amount: 32000,
      }),
    );
  });

  it("computes subtotal from line items correctly", async () => {
    const items: InvoiceLineItem[] = [
      { name: "A", quantity: 1, unit_price_pence: 10000, total_pence: 10000 },
      { name: "B", quantity: 3, unit_price_pence: 2000, total_pence: 6000 },
      { name: "C", quantity: 1, unit_price_pence: 4500, total_pence: 4500 },
    ];
    // subtotal = 10000 + 6000 + 4500 = 20500
    // default VAT = 20% of 20500 = 4100
    // total = 24600
    const invoice = makeInvoice({
      line_items: items,
      subtotal: 20500,
      vat_amount: 4100,
      total_amount: 24600,
    });

    const countChain = makeQueryMock({ count: 0, error: null });
    const insertChain = makeQueryMock({ data: invoice, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: invoice, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? countChain : insertChain;
    });

    await generateInvoice(client, PROVIDER_ID, {
      client_id: CLIENT_ID,
      line_items: items,
    });

    const insertFn = insertChain.insert as ReturnType<typeof vi.fn>;
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 20500,
        vat_amount: 4100,
        total_amount: 24600,
      }),
    );
  });

  it("total = subtotal + vat_amount", async () => {
    const invoice = makeInvoice();
    const countChain = makeQueryMock({ count: 0, error: null });
    const insertChain = makeQueryMock({ data: invoice, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: invoice, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? countChain : insertChain;
    });

    await generateInvoice(client, PROVIDER_ID, {
      client_id: CLIENT_ID,
      line_items: lineItemsNoVat,
    });

    const insertFn = insertChain.insert as ReturnType<typeof vi.fn>;
    const insertCall = insertFn.mock.calls[0][0];
    expect(insertCall.total_amount).toBe(insertCall.subtotal + insertCall.vat_amount);
  });

  it("throws when client_id is missing", async () => {
    const client = makeQueryMock({ data: null, error: null });
    await expect(
      generateInvoice(client, PROVIDER_ID, {
        client_id: "",
        line_items: lineItemsNoVat,
      }),
    ).rejects.toThrow("client_id is required");
  });

  it("throws on empty line_items", async () => {
    const client = makeQueryMock({ data: null, error: null });
    await expect(
      generateInvoice(client, PROVIDER_ID, {
        client_id: CLIENT_ID,
        line_items: [],
      }),
    ).rejects.toThrow("line_items must be a non-empty array");
  });

  it("invoice number format is INV-YYYY-NNNN", async () => {
    const year = new Date().getFullYear();
    const invoice = makeInvoice({ invoice_number: `INV-${year}-0005` });

    const countChain = makeQueryMock({ count: 4, error: null });
    const insertChain = makeQueryMock({ data: invoice, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: invoice, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? countChain : insertChain;
    });

    const result = await generateInvoice(client, PROVIDER_ID, {
      client_id: CLIENT_ID,
      line_items: lineItemsNoVat,
    });

    expect(result.invoice_number).toMatch(/^INV-\d{4}-\d{4}$/);
    expect(result.invoice_number).toBe(`INV-${year}-0005`);

    // Verify the generated number was passed to insert
    const insertFn = insertChain.insert as ReturnType<typeof vi.fn>;
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        invoice_number: `INV-${year}-0005`,
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// getInvoicesByProvider
// ---------------------------------------------------------------------------

describe("getInvoicesByProvider", () => {
  it("returns array of invoices for a provider", async () => {
    const invoices = [
      makeInvoice({ id: "inv-001" }),
      makeInvoice({ id: "inv-002", status: "sent" }),
    ];
    const client = makeQueryMock({ data: invoices, error: null });

    const result = await getInvoicesByProvider(client, PROVIDER_ID);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  it("returns empty array for new provider with no invoices", async () => {
    const client = makeQueryMock({ data: [], error: null });
    const result = await getInvoicesByProvider(client, PROVIDER_ID);
    expect(result).toEqual([]);
  });

  it("returns empty array when data is null", async () => {
    const client = makeQueryMock({ data: null, error: null });
    const result = await getInvoicesByProvider(client, PROVIDER_ID);
    expect(result).toEqual([]);
  });

  it("filters by status when provided", async () => {
    const paidInvoices = [makeInvoice({ status: "paid" })];
    const client = makeQueryMock({ data: paidInvoices, error: null });

    const result = await getInvoicesByProvider(client, PROVIDER_ID, "paid");
    expect(result.length).toBe(1);

    // Verify eq was called with status filter
    const eqFn = client.eq as ReturnType<typeof vi.fn>;
    const statusCall = eqFn.mock.calls.find(
      (call: unknown[]) => call[0] === "status" && call[1] === "paid",
    );
    expect(statusCall).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// markInvoicePaid
// ---------------------------------------------------------------------------

describe("markInvoicePaid", () => {
  it("transitions status to paid", async () => {
    const paidInvoice = makeInvoice({ status: "paid", paid_at: new Date().toISOString() });
    const client = makeQueryMock({ data: paidInvoice, error: null });

    const result = await markInvoicePaid(client, PROVIDER_ID, "inv-001");
    expect(result.status).toBe("paid");
  });

  it("records paid_at timestamp", async () => {
    const paidAt = "2026-03-20T10:30:00.000Z";
    const paidInvoice = makeInvoice({ status: "paid", paid_at: paidAt });
    const client = makeQueryMock({ data: paidInvoice, error: null });

    const result = await markInvoicePaid(client, PROVIDER_ID, "inv-001", paidAt);
    expect(result.paid_at).toBe(paidAt);

    // Verify update was called with the provided paidAt
    const updateFn = client.update as ReturnType<typeof vi.fn>;
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "paid",
        paid_at: paidAt,
      }),
    );
  });

  it("defaults paid_at to current time when not provided", async () => {
    const paidInvoice = makeInvoice({ status: "paid", paid_at: expect.any(String) });
    const client = makeQueryMock({ data: paidInvoice, error: null });

    await markInvoicePaid(client, PROVIDER_ID, "inv-001");

    const updateFn = client.update as ReturnType<typeof vi.fn>;
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "paid",
        paid_at: expect.any(String),
      }),
    );
  });

  it("throws when invoice not found or already paid", async () => {
    // maybeSingle returns null when neq("status","paid") excludes the row
    const client = makeQueryMock({ data: null, error: null });

    await expect(
      markInvoicePaid(client, PROVIDER_ID, "inv-already-paid"),
    ).rejects.toThrow(
      "Invoice not found, does not belong to this provider, or is already marked as paid.",
    );
  });

  it("uses neq guard to prevent double-marking as paid", async () => {
    const paidInvoice = makeInvoice({ status: "paid" });
    const client = makeQueryMock({ data: paidInvoice, error: null });

    await markInvoicePaid(client, PROVIDER_ID, "inv-001");

    // Verify neq("status", "paid") was used in the query
    const neqFn = client.neq as ReturnType<typeof vi.fn>;
    expect(neqFn).toHaveBeenCalledWith("status", "paid");
  });
});

// ---------------------------------------------------------------------------
// updateInvoice
// ---------------------------------------------------------------------------

describe("updateInvoice", () => {
  it("allows updating notes on draft invoice", async () => {
    const draftInvoice = makeInvoice({ status: "draft" });
    const updated = { ...draftInvoice, notes: "Updated notes" };

    const fetchChain = makeQueryMock({ data: draftInvoice, error: null });
    const updateChain = makeQueryMock({ data: updated, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: updated, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchChain : updateChain;
    });

    const result = await updateInvoice(client, PROVIDER_ID, "inv-001", {
      notes: "Updated notes",
    });
    expect(result.notes).toBe("Updated notes");
  });

  it("throws when updating a non-draft invoice", async () => {
    const sentInvoice = makeInvoice({ status: "sent" });
    const fetchChain = makeQueryMock({ data: sentInvoice, error: null });
    const client = makeQueryMock({ data: sentInvoice, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => fetchChain);

    await expect(
      updateInvoice(client, PROVIDER_ID, "inv-001", { notes: "test" }),
    ).rejects.toThrow("Invoice cannot be updated: current status is 'sent'");
  });

  it("recomputes VAT and totals when line_items change", async () => {
    const draftInvoice = makeInvoice({ status: "draft" });
    const newItems: InvoiceLineItem[] = [
      { name: "New service", quantity: 1, unit_price_pence: 10000, total_pence: 10000 },
    ];
    // subtotal = 10000, default VAT 20% = 2000, total = 12000
    const updated = {
      ...draftInvoice,
      line_items: newItems,
      subtotal: 10000,
      vat_amount: 2000,
      total_amount: 12000,
    };

    const fetchChain = makeQueryMock({ data: draftInvoice, error: null });
    const updateChain = makeQueryMock({ data: updated, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: updated, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchChain : updateChain;
    });

    await updateInvoice(client, PROVIDER_ID, "inv-001", { line_items: newItems });

    const updateFn = updateChain.update as ReturnType<typeof vi.fn>;
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 10000,
        vat_amount: 2000,
        total_amount: 12000,
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Commission deduction concept (2.5% platform fee)
// ---------------------------------------------------------------------------

describe("commission deduction concept", () => {
  it("2.5% platform fee can be computed from invoice total", () => {
    const PLATFORM_COMMISSION_RATE = 0.025;

    // Invoice total: 30000 pence (GBP 300.00)
    const totalAmount = 30000;
    const commission = Math.round(totalAmount * PLATFORM_COMMISSION_RATE);
    const providerPayout = totalAmount - commission;

    expect(commission).toBe(750); // GBP 7.50
    expect(providerPayout).toBe(29250); // GBP 292.50
    expect(commission + providerPayout).toBe(totalAmount);
  });

  it("commission rounds to nearest pence", () => {
    const PLATFORM_COMMISSION_RATE = 0.025;

    // Odd amount that produces fractional pence
    const totalAmount = 33333; // GBP 333.33
    const commission = Math.round(totalAmount * PLATFORM_COMMISSION_RATE);

    // 33333 * 0.025 = 833.325 => rounds to 833
    expect(commission).toBe(833);
    expect(Number.isInteger(commission)).toBe(true);
  });
});
