import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSavedProperties } from "./saved-properties-service";

/**
 * Builds a Supabase client mock whose
 * `.from(...).select(...).eq(...).order(...)` chain resolves to `{ data, error }`.
 */
function clientReturning(rows: unknown[]): SupabaseClient {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };
  return { from: vi.fn().mockReturnValue(chain) } as unknown as SupabaseClient;
}

describe("getSavedProperties", () => {
  it("returns listing:null and property:null when the listings embed is hidden by RLS", async () => {
    // Real production state: a saved listing that went under_offer / sold / withdrawn.
    // RLS hides the listings row from a non-owner, so PostgREST returns a null embed.
    const client = clientReturning([
      {
        id: "s1",
        user_id: "u1",
        listing_id: "l1",
        notes: null,
        created_at: "2026-01-01",
        listings: null,
      },
    ]);

    const result = await getSavedProperties(client, "u1");

    expect(result).toHaveLength(1);
    expect(result[0].listing).toBeNull();
    expect(result[0].property).toBeNull();
  });

  it("maps the nested property out of the listings embed when present", async () => {
    const client = clientReturning([
      {
        id: "s2",
        user_id: "u1",
        listing_id: "l2",
        notes: null,
        created_at: "2026-01-02",
        listings: {
          id: "l2",
          status: "active",
          favorite_count: 0,
          properties: { id: "p2", title: "Maple House" },
        },
      },
    ]);

    const result = await getSavedProperties(client, "u1");

    expect(result[0].listing?.id).toBe("l2");
    expect(result[0].property?.title).toBe("Maple House");
  });
});
