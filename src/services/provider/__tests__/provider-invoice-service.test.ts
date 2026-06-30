/**
 * Tests for provider-invoice-service: server-side total recompute and the
 * draft→sent transition that unlocks customer payment.
 */

import { describe, expect, it, vi } from "vitest";

import {
  invoiceTotalPence,
  sendInvoice,
} from "../provider-invoice-service";
import type { InvoiceLineItem } from "@/types/provider-dashboard";

describe("invoiceTotalPence", () => {
  it("sums line-item totals in pence with explicit VAT", () => {
    const items: InvoiceLineItem[] = [
      { name: "A", quantity: 1, unit_price_pence: 10000, total_pence: 10000, vat_rate: 0.2 },
    ];
    expect(invoiceTotalPence(items)).toBe(12000);
  });

  it("treats vat_rate 0 as no VAT", () => {
    const items: InvoiceLineItem[] = [
      { name: "A", quantity: 1, unit_price_pence: 10000, total_pence: 10000, vat_rate: 0 },
    ];
    expect(invoiceTotalPence(items)).toBe(10000);
  });

  it("returns 0 for no items", () => {
    expect(invoiceTotalPence([])).toBe(0);
  });
});

type InvoiceRow = { id: string; provider_id: string; status: string };

function makeSupabase(existing: InvoiceRow | null, updated?: InvoiceRow) {
  const updateChain = {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: updated ?? existing, error: null }),
  };
  const selectChain = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: existing, error: null }),
  };
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue(selectChain),
      update: vi.fn().mockReturnValue(updateChain),
    }),
  };
}

describe("sendInvoice", () => {
  it("transitions a draft invoice to sent", async () => {
    const supabase = makeSupabase(
      { id: "inv-1", provider_id: "p-1", status: "draft" },
      { id: "inv-1", provider_id: "p-1", status: "sent" },
    );
    const result = await sendInvoice(supabase as never, "p-1", "inv-1");
    expect(result.status).toBe("sent");
  });

  it("re-sends an overdue invoice without downgrading it to sent", async () => {
    const supabase = makeSupabase(
      { id: "inv-1", provider_id: "p-1", status: "overdue" },
      { id: "inv-1", provider_id: "p-1", status: "overdue" },
    );
    const result = await sendInvoice(supabase as never, "p-1", "inv-1");
    expect(result.status).toBe("overdue");
  });

  it("rejects an already-paid invoice", async () => {
    const supabase = makeSupabase({ id: "inv-1", provider_id: "p-1", status: "paid" });
    await expect(sendInvoice(supabase as never, "p-1", "inv-1")).rejects.toThrow(/already paid/i);
  });

  it("rejects a cancelled invoice", async () => {
    const supabase = makeSupabase({ id: "inv-1", provider_id: "p-1", status: "cancelled" });
    await expect(sendInvoice(supabase as never, "p-1", "inv-1")).rejects.toThrow(/cancelled/i);
  });

  it("throws when the invoice is not found", async () => {
    const supabase = makeSupabase(null);
    await expect(sendInvoice(supabase as never, "p-1", "inv-1")).rejects.toThrow(/not found/i);
  });
});
