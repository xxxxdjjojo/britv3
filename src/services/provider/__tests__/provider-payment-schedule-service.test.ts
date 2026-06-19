/**
 * Tests for provider-payment-schedule-service.
 *
 * Functions under contract:
 *  - createPaymentSchedule(providerId, bookingId, quoteId, milestones, totalPence, supabase)
 *  - getPaymentSchedule(bookingId, providerId, supabase)
 *  - invoiceMilestone(scheduleId, providerId, clientId, supabase)
 *  - markMilestonePaid(scheduleId, providerId, supabase)
 *
 * All monetary values are in pence (integer).
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock generateInvoice from invoice service
// ---------------------------------------------------------------------------

vi.mock("@/services/provider/provider-invoice-service", () => ({
  generateInvoice: vi.fn(),
}));

// Grab the mocked reference after hoisting
import * as invoiceServiceModule from "@/services/provider/provider-invoice-service";
const mockGenerateInvoice = vi.mocked(invoiceServiceModule.generateInvoice);

// ---------------------------------------------------------------------------
// Helpers / fixtures
// ---------------------------------------------------------------------------

const PROVIDER_ID = "provider-uuid-1";
const BOOKING_ID = "booking-uuid-1";
const QUOTE_ID = "quote-uuid-1";
const CLIENT_ID = "client-uuid-1";

const MILESTONE_1 = { label: "Deposit", amountPence: 5000, dueAt: "2026-04-01T00:00:00Z" };
const MILESTONE_2 = { label: "Completion", amountPence: 10000, dueAt: "2026-05-01T00:00:00Z" };
const TOTAL_PENCE = 15000;

function makeMilestoneRow(
  overrides: Partial<{
    id: string;
    booking_id: string | null;
    quote_id: string | null;
    provider_id: string;
    milestone_label: string;
    amount_pence: number;
    due_at: string | null;
    status: string;
    invoice_id: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }> = {},
) {
  return {
    id: "schedule-uuid-1",
    booking_id: BOOKING_ID,
    quote_id: QUOTE_ID,
    provider_id: PROVIDER_ID,
    milestone_label: "Deposit",
    amount_pence: 5000,
    due_at: "2026-04-01T00:00:00Z",
    status: "pending",
    invoice_id: null,
    sort_order: 0,
    created_at: "2026-03-22T00:00:00Z",
    updated_at: "2026-03-22T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Supabase mock factory
// ---------------------------------------------------------------------------

function makeSupabaseMock(options: {
  insertResult?: unknown[] | null;
  insertError?: { message: string } | null;
  selectRows?: unknown[] | null;
  selectError?: { message: string } | null;
  singleRow?: unknown | null;
  singleError?: { message: string } | null;
  updateRow?: unknown | null;
  updateError?: { message: string } | null;
  countResult?: number | null;
  countError?: { message: string } | null;
} = {}) {
  const {
    insertResult = null,
    insertError = null,
    selectRows = null,
    selectError = null,
    singleRow = null,
    singleError = null,
    updateRow = null,
    updateError = null,
    countResult = 0,
    countError = null,
  } = options;

  const mockSingle = vi.fn().mockResolvedValue({ data: singleRow, error: singleError });
  const mockMaybeSingle = vi.fn().mockResolvedValue({ data: singleRow, error: singleError });

  const insertChain = {
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  };

  const updateChain = {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: updateRow, error: updateError }),
    }),
  };

  const orderChain = {
    order: vi.fn().mockResolvedValue({ data: selectRows, error: selectError }),
  };

  const selectChain = {
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: selectRows, error: selectError }),
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  };

  // For insert returning multiple rows
  const insertSelectChain = {
    select: vi.fn().mockResolvedValue({ data: insertResult, error: insertError }),
  };

  // For count queries
  const countChain = {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ count: countResult, error: countError }),
  };

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "payment_schedules") {
        return {
          insert: vi.fn().mockReturnValue(insertSelectChain),
          select: vi.fn().mockReturnValue(selectChain),
          update: vi.fn().mockReturnValue(updateChain),
        };
      }
      if (table === "provider_invoices") {
        return {
          select: vi.fn().mockReturnValue(countChain),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return {
        insert: vi.fn().mockReturnValue(insertSelectChain),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        update: vi.fn().mockReturnValue(updateChain),
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Import service under test
// ---------------------------------------------------------------------------

import {
  createPaymentSchedule,
  getPaymentSchedule,
  invoiceMilestone,
  markMilestonePaid,
} from "../provider-payment-schedule-service";

// ---------------------------------------------------------------------------
// createPaymentSchedule
// ---------------------------------------------------------------------------

describe("createPaymentSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates milestones that sum to total — returns all milestones with correct sort_order", async () => {
    const milestones = [MILESTONE_1, MILESTONE_2];
    const insertedRows = [
      makeMilestoneRow({ milestone_label: "Deposit", amount_pence: 5000, sort_order: 0 }),
      makeMilestoneRow({
        id: "schedule-uuid-2",
        milestone_label: "Completion",
        amount_pence: 10000,
        sort_order: 1,
        due_at: "2026-05-01T00:00:00Z",
      }),
    ];

    const supabase = makeSupabaseMock({ insertResult: insertedRows });

    const result = await createPaymentSchedule(
      PROVIDER_ID,
      BOOKING_ID,
      QUOTE_ID,
      milestones,
      TOTAL_PENCE,
      supabase as never,
    );

    expect(result).toHaveLength(2);
    expect(result[0].sortOrder).toBe(0);
    expect(result[1].sortOrder).toBe(1);
    expect(result[0].milestoneLabel).toBe("Deposit");
    expect(result[1].milestoneLabel).toBe("Completion");
  });

  it("rejects if milestones sum doesn't match total (off by > 1p)", async () => {
    const milestones = [
      { label: "Deposit", amountPence: 5000 },
      { label: "Completion", amountPence: 9998 }, // sum = 14998, diff = 2 > 1
    ];

    const supabase = makeSupabaseMock();

    await expect(
      createPaymentSchedule(
        PROVIDER_ID,
        BOOKING_ID,
        QUOTE_ID,
        milestones,
        TOTAL_PENCE,
        supabase as never,
      ),
    ).rejects.toThrow(/sum/i);
  });

  it("rejects if milestones array is empty", async () => {
    const supabase = makeSupabaseMock();

    await expect(
      createPaymentSchedule(
        PROVIDER_ID,
        BOOKING_ID,
        QUOTE_ID,
        [],
        TOTAL_PENCE,
        supabase as never,
      ),
    ).rejects.toThrow(/empty/i);
  });
});

// ---------------------------------------------------------------------------
// getPaymentSchedule
// ---------------------------------------------------------------------------

describe("getPaymentSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns milestones sorted by sort_order", async () => {
    const rows = [
      makeMilestoneRow({ sort_order: 0, milestone_label: "Deposit" }),
      makeMilestoneRow({ id: "s2", sort_order: 1, milestone_label: "Completion" }),
    ];

    const supabase = makeSupabaseMock({ selectRows: rows });

    const result = await getPaymentSchedule(BOOKING_ID, PROVIDER_ID, supabase as never);

    expect(result).toHaveLength(2);
    expect(result[0].sortOrder).toBe(0);
    expect(result[1].sortOrder).toBe(1);
    expect(result[0].bookingId).toBe(BOOKING_ID);
  });
});

// ---------------------------------------------------------------------------
// invoiceMilestone
// ---------------------------------------------------------------------------

describe("invoiceMilestone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates invoice and updates status to 'invoiced'", async () => {
    const pendingMilestone = makeMilestoneRow({ status: "pending", invoice_id: null });
    const invoicedMilestone = makeMilestoneRow({
      status: "invoiced",
      invoice_id: "invoice-uuid-1",
    });
    const mockInvoice = {
      id: "invoice-uuid-1",
      provider_id: PROVIDER_ID,
      booking_id: BOOKING_ID,
      client_id: CLIENT_ID,
      invoice_number: "INV-2026-0001",
      line_items: [
        { name: "Deposit", quantity: 1, unit_price_pence: 5000, total_pence: 5000 },
      ],
      subtotal: 5000,
      vat_amount: 1000,
      total_amount: 6000,
      currency: "GBP",
      status: "draft" as const,
      due_date: "2026-04-01",
      paid_at: null,
      stripe_payment_intent_id: null,
      notes: null,
      created_at: "2026-03-22T00:00:00Z",
      updated_at: "2026-03-22T00:00:00Z",
    };

    mockGenerateInvoice.mockResolvedValue(mockInvoice);

    // Build a supabase mock that returns pendingMilestone on select/single,
    // then invoicedMilestone on update/select/single
    const mockUpdateSingle = vi.fn().mockResolvedValue({ data: invoicedMilestone, error: null });
    const mockSelectSingle = vi.fn().mockResolvedValue({ data: pendingMilestone, error: null });

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "payment_schedules") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: mockSelectSingle,
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnValue({
                single: mockUpdateSingle,
              }),
            }),
          };
        }
        return {};
      }),
    };

    const result = await invoiceMilestone(
      "schedule-uuid-1",
      PROVIDER_ID,
      CLIENT_ID,
      supabase as never,
    );

    expect(mockGenerateInvoice).toHaveBeenCalledOnce();
    expect(result.status).toBe("invoiced");
    expect(result.invoiceId).toBe("invoice-uuid-1");
  });

  it("rejects if status is not 'pending' (prevents double-invoicing)", async () => {
    const invoicedMilestone = makeMilestoneRow({ status: "invoiced", invoice_id: "inv-1" });

    const mockSelectSingle = vi
      .fn()
      .mockResolvedValue({ data: invoicedMilestone, error: null });

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "payment_schedules") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: mockSelectSingle,
            }),
          };
        }
        return {};
      }),
    };

    await expect(
      invoiceMilestone("schedule-uuid-1", PROVIDER_ID, CLIENT_ID, supabase as never),
    ).rejects.toThrow(/pending/i);
  });
});

// ---------------------------------------------------------------------------
// markMilestonePaid
// ---------------------------------------------------------------------------

describe("markMilestonePaid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates status to 'paid'", async () => {
    const invoicedMilestone = makeMilestoneRow({
      status: "invoiced",
      invoice_id: "invoice-uuid-1",
    });
    const paidMilestone = makeMilestoneRow({
      status: "paid",
      invoice_id: "invoice-uuid-1",
    });

    const mockSelectSingle = vi
      .fn()
      .mockResolvedValue({ data: invoicedMilestone, error: null });
    const mockUpdateSingle = vi.fn().mockResolvedValue({ data: paidMilestone, error: null });

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "payment_schedules") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: mockSelectSingle,
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnValue({
                single: mockUpdateSingle,
              }),
            }),
          };
        }
        return {};
      }),
    };

    const result = await markMilestonePaid("schedule-uuid-1", PROVIDER_ID, supabase as never);

    expect(result.status).toBe("paid");
  });

  it("rejects if status is not 'invoiced'", async () => {
    const pendingMilestone = makeMilestoneRow({ status: "pending" });

    const mockSelectSingle = vi
      .fn()
      .mockResolvedValue({ data: pendingMilestone, error: null });

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "payment_schedules") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: mockSelectSingle,
            }),
          };
        }
        return {};
      }),
    };

    await expect(
      markMilestonePaid("schedule-uuid-1", PROVIDER_ID, supabase as never),
    ).rejects.toThrow(/invoiced/i);
  });
});
