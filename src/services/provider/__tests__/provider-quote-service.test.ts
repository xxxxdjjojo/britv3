/**
 * Tests for provider-quote-service.
 *
 * Functions under contract:
 *  - createQuote(supabase, providerId, input)
 *  - getQuotesByProvider(supabase, providerId, status?)
 *  - updateQuote(supabase, providerId, quoteId, updates)
 *  - sendQuote(supabase, providerId, quoteId)
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import {
  createQuote,
  getQuotesByProvider,
  updateQuote,
  sendQuote,
} from "../provider-quote-service";

import type {
  CreateQuoteInput,
  QuoteLineItem,
} from "../provider-quote-service";

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

const validLineItems: QuoteLineItem[] = [
  { name: "Boiler repair", description: "Fix leak", quantity: 1, unit_price_pence: 15000, total_pence: 15000 },
  { name: "Parts", quantity: 2, unit_price_pence: 3000, total_pence: 6000 },
];

const singleLineItem: QuoteLineItem[] = [
  { name: "Drain unblock", quantity: 1, unit_price_pence: 8000, total_pence: 8000 },
];

function makeDraftQuote(overrides: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  return {
    id: "quote-001",
    provider_id: PROVIDER_ID,
    request_id: null,
    quote_number: `QT-${new Date().getFullYear()}-0001`,
    line_items: validLineItems,
    subtotal: 21000,
    total_amount: 21000,
    status: "draft",
    valid_until: null,
    notes: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// createQuote
// ---------------------------------------------------------------------------

describe("createQuote", () => {
  it("returns correct shape with draft status", async () => {
    const draft = makeDraftQuote();
    // First call: select count for quote number generation (thenable)
    // Second call: insert().select().single()
    const countChain = makeQueryMock({ count: 0, error: null });
    const insertChain = makeQueryMock({ data: draft, error: null });

    // We need a client that routes different from() calls differently.
    // For simplicity, use a sequential mock: first from() for count, second for insert.
    let callCount = 0;
    const client = makeQueryMock({ data: draft, error: null });
    const origFrom = client.from as ReturnType<typeof vi.fn>;
    origFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return countChain;
      return insertChain;
    });

    const input: CreateQuoteInput = { line_items: validLineItems };
    const result = await createQuote(client, PROVIDER_ID, input);

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        provider_id: PROVIDER_ID,
        status: "draft",
        quote_number: expect.stringMatching(/^QT-\d{4}-\d{4}$/),
        subtotal: expect.any(Number),
        total_amount: expect.any(Number),
        line_items: expect.any(Array),
      }),
    );
  });

  it("generates quote number in QT-YYYY-NNNN format", async () => {
    const year = new Date().getFullYear();
    const draft = makeDraftQuote({ quote_number: `QT-${year}-0003` });
    const countChain = makeQueryMock({ count: 2, error: null });
    const insertChain = makeQueryMock({ data: draft, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: draft, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? countChain : insertChain;
    });

    const result = await createQuote(client, PROVIDER_ID, { line_items: singleLineItem });
    expect(result.quote_number).toBe(`QT-${year}-0003`);
  });

  it("throws on empty line_items array", async () => {
    const client = makeQueryMock({ data: null, error: null });
    await expect(
      createQuote(client, PROVIDER_ID, { line_items: [] }),
    ).rejects.toThrow("line_items must be a non-empty array");
  });

  it("throws on empty line item name", async () => {
    const client = makeQueryMock({ data: null, error: null });
    const badItems: QuoteLineItem[] = [
      { name: "", quantity: 1, unit_price_pence: 1000, total_pence: 1000 },
    ];
    await expect(
      createQuote(client, PROVIDER_ID, { line_items: badItems }),
    ).rejects.toThrow("line_items[0].name is required");
  });

  it("throws when quantity < 1", async () => {
    const client = makeQueryMock({ data: null, error: null });
    const badItems: QuoteLineItem[] = [
      { name: "Widget", quantity: 0, unit_price_pence: 1000, total_pence: 0 },
    ];
    await expect(
      createQuote(client, PROVIDER_ID, { line_items: badItems }),
    ).rejects.toThrow("line_items[0].quantity must be >= 1");
  });

  it("throws when unit_price_pence < 0", async () => {
    const client = makeQueryMock({ data: null, error: null });
    const badItems: QuoteLineItem[] = [
      { name: "Widget", quantity: 1, unit_price_pence: -100, total_pence: -100 },
    ];
    await expect(
      createQuote(client, PROVIDER_ID, { line_items: badItems }),
    ).rejects.toThrow("line_items[0].unit_price_pence must be >= 0");
  });

  it("computes subtotal correctly from line items", async () => {
    // subtotal = sum of total_pence = 15000 + 6000 = 21000
    const expectedSubtotal = 21000;
    const draft = makeDraftQuote({ subtotal: expectedSubtotal, total_amount: expectedSubtotal });

    const countChain = makeQueryMock({ count: 0, error: null });
    const insertChain = makeQueryMock({ data: draft, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: draft, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? countChain : insertChain;
    });

    // Verify that insert is called with correct subtotal
    const result = await createQuote(client, PROVIDER_ID, { line_items: validLineItems });
    expect(result.subtotal).toBe(expectedSubtotal);
    expect(result.total_amount).toBe(expectedSubtotal);

    // Also verify the insert payload
    const insertFn = insertChain.insert as ReturnType<typeof vi.fn>;
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: expectedSubtotal,
        total_amount: expectedSubtotal,
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// getQuotesByProvider
// ---------------------------------------------------------------------------

describe("getQuotesByProvider", () => {
  it("returns array of quotes for a provider", async () => {
    const quotes = [makeDraftQuote(), makeDraftQuote({ id: "quote-002", quote_number: "QT-2026-0002" })];
    const mapped = quotes.map((q) => ({
      ...q,
      service_requests: null,
    }));
    const client = makeQueryMock({ data: mapped, error: null });

    const result = await getQuotesByProvider(client, PROVIDER_ID);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        provider_id: PROVIDER_ID,
        service_request: null,
      }),
    );
  });

  it("returns empty array for new provider with no quotes", async () => {
    const client = makeQueryMock({ data: [], error: null });
    const result = await getQuotesByProvider(client, PROVIDER_ID);
    expect(result).toEqual([]);
  });

  it("returns empty array when data is null", async () => {
    const client = makeQueryMock({ data: null, error: null });
    const result = await getQuotesByProvider(client, PROVIDER_ID);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// sendQuote
// ---------------------------------------------------------------------------

describe("sendQuote", () => {
  it("transitions status from draft to sent", async () => {
    const draftQuote = makeDraftQuote({ status: "draft" });
    const sentQuote = { ...draftQuote, status: "sent" };

    // First from() = fetch existing (maybeSingle), second from() = update
    const fetchChain = makeQueryMock({ data: draftQuote, error: null });
    const updateChain = makeQueryMock({ data: sentQuote, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: sentQuote, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchChain : updateChain;
    });

    const result = await sendQuote(client, PROVIDER_ID, "quote-001");
    expect(result.status).toBe("sent");
  });

  it("throws if quote is not in draft status (already sent)", async () => {
    const sentQuote = makeDraftQuote({ status: "sent" });
    const fetchChain = makeQueryMock({ data: sentQuote, error: null });

    const client = makeQueryMock({ data: sentQuote, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => fetchChain);

    await expect(
      sendQuote(client, PROVIDER_ID, "quote-001"),
    ).rejects.toThrow("Quote cannot be sent: current status is 'sent'");
  });

  it("throws if quote not found", async () => {
    const fetchChain = makeQueryMock({ data: null, error: null });
    const client = makeQueryMock({ data: null, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => fetchChain);

    await expect(
      sendQuote(client, PROVIDER_ID, "nonexistent"),
    ).rejects.toThrow("Quote not found");
  });
});

// ---------------------------------------------------------------------------
// updateQuote
// ---------------------------------------------------------------------------

describe("updateQuote", () => {
  it("allows changing line items on draft quote", async () => {
    const draftQuote = makeDraftQuote({ status: "draft" });
    const newItems: QuoteLineItem[] = [
      { name: "New item", quantity: 3, unit_price_pence: 5000, total_pence: 15000 },
    ];
    const updatedQuote = { ...draftQuote, line_items: newItems, subtotal: 15000, total_amount: 15000 };

    const fetchChain = makeQueryMock({ data: draftQuote, error: null });
    const updateChain = makeQueryMock({ data: updatedQuote, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: updatedQuote, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchChain : updateChain;
    });

    const result = await updateQuote(client, PROVIDER_ID, "quote-001", {
      line_items: newItems,
    });
    expect(result.line_items).toEqual(newItems);
    expect(result.subtotal).toBe(15000);
  });

  it("throws when updating a non-draft quote", async () => {
    const sentQuote = makeDraftQuote({ status: "sent" });
    const fetchChain = makeQueryMock({ data: sentQuote, error: null });

    const client = makeQueryMock({ data: sentQuote, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => fetchChain);

    await expect(
      updateQuote(client, PROVIDER_ID, "quote-001", { notes: "updated" }),
    ).rejects.toThrow("Quote cannot be updated: current status is 'sent'");
  });

  it("throws when quote not found", async () => {
    const fetchChain = makeQueryMock({ data: null, error: null });
    const client = makeQueryMock({ data: null, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => fetchChain);

    await expect(
      updateQuote(client, PROVIDER_ID, "nonexistent", { notes: "test" }),
    ).rejects.toThrow("Quote not found");
  });

  it("recomputes subtotal when line items change", async () => {
    const draftQuote = makeDraftQuote({ status: "draft" });
    const newItems: QuoteLineItem[] = [
      { name: "Item A", quantity: 1, unit_price_pence: 10000, total_pence: 10000 },
      { name: "Item B", quantity: 2, unit_price_pence: 2500, total_pence: 5000 },
    ];
    const updatedQuote = { ...draftQuote, line_items: newItems, subtotal: 15000, total_amount: 15000 };

    const fetchChain = makeQueryMock({ data: draftQuote, error: null });
    const updateChain = makeQueryMock({ data: updatedQuote, error: null });

    let callCount = 0;
    const client = makeQueryMock({ data: updatedQuote, error: null });
    (client.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? fetchChain : updateChain;
    });

    await updateQuote(client, PROVIDER_ID, "quote-001", { line_items: newItems });

    // Verify update was called with recomputed subtotal (10000 + 5000 = 15000)
    const updateFn = updateChain.update as ReturnType<typeof vi.fn>;
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 15000,
        total_amount: 15000,
      }),
    );
  });
});
