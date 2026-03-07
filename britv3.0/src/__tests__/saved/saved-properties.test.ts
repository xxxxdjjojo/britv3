/**
 * Tests for saved properties (shortlist) service.
 * Verifies save/unsave operations, duplicate handling, and favorite_count tracking.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

/** Create a fully chainable Supabase mock that returns the specified result at chain end. */
function createChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const methods = ["insert", "select", "delete", "eq", "order", "single", "maybeSingle"];
  for (const method of methods) {
    if (method === "single" || method === "maybeSingle") {
      chain[method] = vi.fn().mockResolvedValue(result);
    } else if (method === "order") {
      // order() can be a terminal (for getSavedProperties) or chained
      chain[method] = vi.fn().mockImplementation(() => {
        // Return a thenable that also has chain methods
        const thenableChain = {
          ...chain,
          then: (resolve: (v: unknown) => void) => {
            resolve(result);
            return { catch: vi.fn() };
          },
        };
        // Make it a proper promise-like
        return Object.assign(Promise.resolve(result), thenableChain);
      });
    } else {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
  }
  return chain;
}

function createSupabaseMock(opts?: {
  insertResult?: { data: unknown; error: unknown };
  selectResult?: { data: unknown; error: unknown };
  deleteResult?: { data: unknown; error: unknown };
  listResult?: { data: unknown; error: unknown };
  maybeSingleResult?: { data: unknown; error: unknown };
}) {
  const savedRecord = {
    id: "saved-001",
    user_id: "user-001",
    listing_id: "listing-001",
    notes: null,
    created_at: "2026-03-01T10:00:00Z",
  };

  const insertChain = createChain(
    opts?.insertResult ?? { data: savedRecord, error: null }
  );

  const listChain = createChain(
    opts?.listResult ?? {
      data: [
        {
          ...savedRecord,
          listings: {
            id: "listing-001",
            property_id: "property-001",
            properties: { id: "property-001", title: "Test" },
          },
        },
      ],
      error: null,
    }
  );

  const deleteChain = createChain(
    opts?.deleteResult ?? { data: null, error: null }
  );

  const checkChain = createChain(
    opts?.maybeSingleResult ?? { data: savedRecord, error: null }
  );

  // Track which operation is intended based on chained methods
  let callCount = 0;
  const from = vi.fn().mockImplementation(() => {
    callCount++;
    // Return an object that determines chain based on first method called
    return {
      insert: insertChain.insert,
      select: (...args: unknown[]) => {
        // If called with "*" and a nested select pattern, it's for listing
        if (typeof args[0] === "string" && args[0].includes("listings")) {
          return listChain;
        }
        // If called with "id", it's for isPropertySaved
        if (typeof args[0] === "string" && args[0] === "id") {
          return checkChain;
        }
        return insertChain;
      },
      delete: deleteChain.delete,
      eq: insertChain.eq,
    };
  });

  const rpc = vi.fn().mockReturnValue({
    then: vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ data: null, error: null });
      return { catch: vi.fn() };
    }),
  });

  return {
    supabase: { from, rpc } as unknown,
    from,
    rpc,
    savedRecord,
  };
}

describe("saved-properties-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("saveProperty", () => {
    it("inserts into saved_properties table", async () => {
      const { saveProperty } = await import(
        "@/services/saved/saved-properties-service"
      );
      const { supabase, from } = createSupabaseMock();

      await saveProperty(supabase as never, "user-001", "listing-001");

      expect(from).toHaveBeenCalledWith("saved_properties");
    });

    it("handles duplicate save gracefully (no throw)", async () => {
      const { saveProperty } = await import(
        "@/services/saved/saved-properties-service"
      );
      const { supabase } = createSupabaseMock({
        insertResult: {
          data: null,
          error: { message: "duplicate key", code: "23505" },
        },
      });

      // Should NOT throw on duplicate
      await expect(
        saveProperty(supabase as never, "user-001", "listing-001"),
      ).resolves.not.toThrow();
    });

    it("increments favorite_count via RPC", async () => {
      const { saveProperty } = await import(
        "@/services/saved/saved-properties-service"
      );
      const { supabase, rpc } = createSupabaseMock();

      await saveProperty(supabase as never, "user-001", "listing-001");

      expect(rpc).toHaveBeenCalledWith("increment_favorite_count", {
        p_listing_id: "listing-001",
        p_delta: 1,
      });
    });
  });

  describe("unsaveProperty", () => {
    it("deletes the saved_properties record", async () => {
      const { unsaveProperty } = await import(
        "@/services/saved/saved-properties-service"
      );
      const { supabase, from } = createSupabaseMock();

      await unsaveProperty(supabase as never, "user-001", "listing-001");

      expect(from).toHaveBeenCalledWith("saved_properties");
    });

    it("decrements favorite_count via RPC", async () => {
      const { unsaveProperty } = await import(
        "@/services/saved/saved-properties-service"
      );
      const { supabase, rpc } = createSupabaseMock();

      await unsaveProperty(supabase as never, "user-001", "listing-001");

      expect(rpc).toHaveBeenCalledWith("increment_favorite_count", {
        p_listing_id: "listing-001",
        p_delta: -1,
      });
    });
  });

  describe("getSavedProperties", () => {
    it("returns joined listing data for the user", async () => {
      const { getSavedProperties } = await import(
        "@/services/saved/saved-properties-service"
      );
      const { supabase } = createSupabaseMock();

      const result = await getSavedProperties(supabase as never, "user-001");

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("listing_id");
    });
  });

  describe("isPropertySaved", () => {
    it("returns true when property is saved", async () => {
      const { isPropertySaved } = await import(
        "@/services/saved/saved-properties-service"
      );
      const { supabase } = createSupabaseMock();

      const result = await isPropertySaved(supabase as never, "user-001", "listing-001");

      expect(result).toBe(true);
    });

    it("returns false when property is not saved", async () => {
      const { isPropertySaved } = await import(
        "@/services/saved/saved-properties-service"
      );
      const { supabase } = createSupabaseMock({
        maybeSingleResult: { data: null, error: null },
      });

      const result = await isPropertySaved(supabase as never, "user-001", "listing-999");

      expect(result).toBe(false);
    });
  });
});
