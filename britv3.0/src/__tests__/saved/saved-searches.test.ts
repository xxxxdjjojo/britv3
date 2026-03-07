/**
 * Tests for saved searches service.
 * Verifies CRUD operations, filters stored as JSONB, and alert preferences.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SearchFilters } from "@/types/search";

/** Create a chainable Supabase mock for saved_searches table. */
function createChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const methods = ["insert", "select", "update", "delete", "eq", "order", "single", "maybeSingle"];
  for (const method of methods) {
    if (method === "single" || method === "maybeSingle") {
      chain[method] = vi.fn().mockResolvedValue(result);
    } else if (method === "order") {
      chain[method] = vi.fn().mockReturnValue(Object.assign(Promise.resolve(result), chain));
    } else {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
  }
  return chain;
}

const mockFilters: SearchFilters = {
  listing_type: "sale",
  min_price: 200000,
  max_price: 500000,
  min_bedrooms: 2,
  property_type: ["semi_detached", "terraced"],
};

const mockSavedSearch = {
  id: "search-001",
  user_id: "user-001",
  name: "My 2-bed search",
  filters: mockFilters,
  alerts_enabled: true,
  alert_frequency: "daily",
  last_alerted_at: null,
  new_results_count: 0,
  created_at: "2026-03-01T10:00:00Z",
  updated_at: "2026-03-01T10:00:00Z",
};

function createSupabaseMock(opts?: {
  insertResult?: { data: unknown; error: unknown };
  selectResult?: { data: unknown; error: unknown };
  deleteResult?: { data: unknown; error: unknown };
  updateResult?: { data: unknown; error: unknown };
}) {
  const insertChain = createChain(
    opts?.insertResult ?? { data: mockSavedSearch, error: null }
  );

  const listChain = createChain(
    opts?.selectResult ?? { data: [mockSavedSearch], error: null }
  );

  const deleteChain = createChain(
    opts?.deleteResult ?? { data: null, error: null }
  );

  const updateChain = createChain(
    opts?.updateResult ?? { data: { ...mockSavedSearch, alerts_enabled: false }, error: null }
  );

  const from = vi.fn().mockImplementation(() => {
    return {
      insert: insertChain.insert,
      select: (...args: unknown[]) => {
        if (typeof args[0] === "string" && args[0] === "*") {
          return listChain;
        }
        return insertChain;
      },
      delete: deleteChain.delete,
      update: updateChain.update,
      eq: listChain.eq,
    };
  });

  const rpc = vi.fn().mockReturnValue({
    then: vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ data: null, error: null });
      return { catch: vi.fn() };
    }),
  });

  return { supabase: { from, rpc } as unknown, from, rpc };
}

describe("saved-searches-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("saveSearch", () => {
    it("inserts into saved_searches with filters as JSONB", async () => {
      const { saveSearch } = await import(
        "@/services/saved/saved-searches-service"
      );
      const { supabase, from } = createSupabaseMock();

      const result = await saveSearch(
        supabase as never,
        "user-001",
        "My 2-bed search",
        mockFilters,
        { enabled: true, frequency: "daily" },
      );

      expect(from).toHaveBeenCalledWith("saved_searches");
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("filters");
    });

    it("stores alert preferences", async () => {
      const { saveSearch } = await import(
        "@/services/saved/saved-searches-service"
      );
      const { supabase } = createSupabaseMock();

      const result = await saveSearch(
        supabase as never,
        "user-001",
        "My search",
        mockFilters,
        { enabled: true, frequency: "weekly" },
      );

      expect(result).toHaveProperty("alerts_enabled");
      expect(result).toHaveProperty("alert_frequency");
    });
  });

  describe("deleteSearch", () => {
    it("deletes the saved_searches record", async () => {
      const { deleteSearch } = await import(
        "@/services/saved/saved-searches-service"
      );
      const { supabase, from } = createSupabaseMock();

      await deleteSearch(supabase as never, "user-001", "search-001");

      expect(from).toHaveBeenCalledWith("saved_searches");
    });
  });

  describe("getSavedSearches", () => {
    it("returns all saved searches for the user", async () => {
      const { getSavedSearches } = await import(
        "@/services/saved/saved-searches-service"
      );
      const { supabase } = createSupabaseMock();

      const result = await getSavedSearches(supabase as never, "user-001");

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("filters");
      expect(result[0]).toHaveProperty("name");
    });
  });

  describe("updateAlertPreferences", () => {
    it("updates alert settings on a saved search", async () => {
      const { updateAlertPreferences } = await import(
        "@/services/saved/saved-searches-service"
      );
      const { supabase, from } = createSupabaseMock();

      await updateAlertPreferences(supabase as never, "user-001", "search-001", {
        alerts_enabled: false,
        alert_frequency: "weekly",
      });

      expect(from).toHaveBeenCalledWith("saved_searches");
    });
  });
});
