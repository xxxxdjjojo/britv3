/**
 * Schema-drift guard tests for provider-quote-service.
 *
 * The real public.quotes table (002_marketplace.sql) has columns:
 *   service_request_id, validity_date, total_amount — and NO subtotal,
 *   notes, request_id, or valid_until. These tests assert that createQuote
 *   and updateQuote write/read the REAL columns and never the drifted ones.
 */

import { describe, expect, it, vi } from "vitest";

import { createQuote, updateQuote } from "../provider-quote-service";

const PROVIDER_ID = "provider-uuid-1";
const QUOTE_ID = "quote-uuid-1";

const DRIFTED_KEYS = ["request_id", "valid_until", "subtotal", "notes"];

const validInput = {
  service_request_id: "rfq-1",
  line_items: [
    {
      name: "Pipe repair",
      quantity: 1,
      unit_price_pence: 15000,
      total_pence: 15000,
    },
  ],
  valid_until_days: 14,
};

function makeInsertSpy(captured: { value: Record<string, unknown> | null }) {
  return vi.fn().mockImplementation((data: Record<string, unknown>) => {
    captured.value = data;
    return {
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: QUOTE_ID,
            provider_id: PROVIDER_ID,
            service_request_id: "rfq-1",
            quote_number: "QT-2026-0001",
            line_items: validInput.line_items,
            total_amount: 15000,
            status: "draft",
            validity_date: null,
            created_at: "2026-01-01",
            updated_at: "2026-01-01",
          },
          error: null,
        }),
      }),
    };
  });
}

describe("provider-quote-service column correctness", () => {
  it("createQuote inserts service_request_id, validity_date, total_amount and no drifted keys", async () => {
    const captured: { value: Record<string, unknown> | null } = { value: null };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "quotes") {
          return {
            // generateQuoteNumber count query
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
            }),
            insert: makeInsertSpy(captured),
          };
        }
        return {};
      }),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    await createQuote(supabase, PROVIDER_ID, validInput);

    expect(captured.value).not.toBeNull();
    const keys = Object.keys(captured.value!);
    expect(keys).toContain("service_request_id");
    expect(keys).toContain("validity_date");
    expect(keys).toContain("total_amount");
    expect(captured.value!.service_request_id).toBe("rfq-1");
    expect(captured.value!.total_amount).toBe(15000);
    for (const drifted of DRIFTED_KEYS) {
      expect(keys).not.toContain(drifted);
    }
  });

  it("updateQuote patches validity_date / total_amount and no drifted keys", async () => {
    const captured: { value: Record<string, unknown> | null } = { value: null };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "quotes") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: QUOTE_ID,
                      provider_id: PROVIDER_ID,
                      service_request_id: "rfq-1",
                      status: "draft",
                      total_amount: 15000,
                      validity_date: null,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
            update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
              captured.value = data;
              return {
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({
                        data: {
                          id: QUOTE_ID,
                          provider_id: PROVIDER_ID,
                          service_request_id: "rfq-1",
                          status: "draft",
                          total_amount: 20000,
                          validity_date: "2026-02-01",
                        },
                        error: null,
                      }),
                    }),
                  }),
                }),
              };
            }),
          };
        }
        return {};
      }),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    await updateQuote(supabase, PROVIDER_ID, QUOTE_ID, {
      line_items: [
        {
          name: "Bigger job",
          quantity: 1,
          unit_price_pence: 20000,
          total_pence: 20000,
        },
      ],
      valid_until_days: 30,
    });

    expect(captured.value).not.toBeNull();
    const keys = Object.keys(captured.value!);
    expect(keys).toContain("validity_date");
    expect(keys).toContain("total_amount");
    for (const drifted of DRIFTED_KEYS) {
      expect(keys).not.toContain(drifted);
    }
  });
});
