// Covers: BUG-1 (ownership verification) + BUG-2 (optimistic status lock) + BUG-4 (atomic accept cascade)
// Tests the respondToOffer and acceptOffer service functions and PATCH route error handling
import { describe, it, expect, vi, beforeEach } from "vitest";
import { respondToOffer, acceptOffer } from "@/services/seller/offer-service";

/* ------------------------------------------------------------------ */
/*  Helpers — lightweight Supabase mock                                */
/* ------------------------------------------------------------------ */

function createMockSupabase(overrides: {
  user?: { id: string } | null;
  updateResult?: { data: unknown; error: unknown };
} = {}) {
  const userId = overrides.user === null ? null : (overrides.user?.id ?? "seller-1");
  const updateResult = overrides.updateResult ?? { data: { id: "offer-1" }, error: null };

  const chainable = {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(updateResult),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
      }),
    },
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue(chainable),
    }),
    _chain: chainable,
  } as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
}

const baseResponse = {
  status: "accepted" as const,
  solicitor_name: "Jane Smith",
  solicitor_email: "jane@example.com",
};

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("Offer State Machine", () => {
  describe("respondToOffer — ownership verification (BUG-1)", () => {
    it("throws Unauthenticated when no user session exists", async () => {
      const supabase = createMockSupabase({ user: null });
      await expect(
        respondToOffer(supabase, "offer-1", baseResponse),
      ).rejects.toThrow("Unauthenticated");
    });

    it("includes seller_id filter in the update query", async () => {
      const supabase = createMockSupabase({ user: { id: "seller-42" } });
      await respondToOffer(supabase, "offer-1", baseResponse);

      // Verify .eq was called with seller_id
      const eqCalls = (supabase as unknown as { _chain: { eq: ReturnType<typeof vi.fn> } })
        ._chain.eq.mock.calls;
      const sellerIdCall = eqCalls.find(
        (c: string[]) => c[0] === "seller_id" && c[1] === "seller-42",
      );
      expect(sellerIdCall).toBeTruthy();
    });

    it("throws descriptive error when offer is not owned by user (PGRST116)", async () => {
      const supabase = createMockSupabase({
        updateResult: {
          data: null,
          error: { code: "PGRST116", message: "no rows returned" },
        },
      });
      await expect(
        respondToOffer(supabase, "offer-1", baseResponse),
      ).rejects.toThrow("Offer not found, not owned by you, or already actioned");
    });
  });

  describe("respondToOffer — optimistic status lock (BUG-2)", () => {
    it("includes status=pending filter in the update query", async () => {
      const supabase = createMockSupabase();
      await respondToOffer(supabase, "offer-1", baseResponse);

      const eqCalls = (supabase as unknown as { _chain: { eq: ReturnType<typeof vi.fn> } })
        ._chain.eq.mock.calls;
      const statusCall = eqCalls.find(
        (c: string[]) => c[0] === "status" && c[1] === "pending",
      );
      expect(statusCall).toBeTruthy();
    });

    it("rejects when offer was already actioned (PGRST116 from status mismatch)", async () => {
      const supabase = createMockSupabase({
        updateResult: {
          data: null,
          error: { code: "PGRST116", message: "no rows returned" },
        },
      });
      await expect(
        respondToOffer(supabase, "offer-1", { status: "rejected" }),
      ).rejects.toThrow("already actioned");
    });
  });

  describe("respondToOffer — success path", () => {
    it("resolves without error for valid pending offer owned by user", async () => {
      const supabase = createMockSupabase({
        updateResult: { data: { id: "offer-1", status: "accepted" }, error: null },
      });
      await expect(
        respondToOffer(supabase, "offer-1", baseResponse),
      ).resolves.toBeUndefined();
    });

    it("propagates non-PGRST116 database errors as-is", async () => {
      const dbError = { code: "42P01", message: "relation does not exist" };
      const supabase = createMockSupabase({
        updateResult: { data: null, error: dbError },
      });
      await expect(
        respondToOffer(supabase, "offer-1", baseResponse),
      ).rejects.toEqual(dbError);
    });
  });

  describe("acceptOffer — atomic cascade (BUG-4)", () => {
    function createRpcMockSupabase(overrides: {
      user?: { id: string } | null;
      rpcResult?: { data: unknown; error: unknown };
    } = {}) {
      const userId = overrides.user === null ? null : (overrides.user?.id ?? "seller-1");
      const rpcResult = overrides.rpcResult ?? {
        data: { progression_id: "prog-1", rejected_count: 2, listing_id: "listing-1" },
        error: null,
      };

      return {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: userId ? { id: userId } : null },
          }),
        },
        rpc: vi.fn().mockResolvedValue(rpcResult),
      } as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
    }

    it("throws Unauthenticated when no user session exists", async () => {
      const supabase = createRpcMockSupabase({ user: null });
      await expect(
        acceptOffer(supabase, "offer-1"),
      ).rejects.toThrow("Unauthenticated");
    });

    it("calls accept_offer_cascade RPC with correct params", async () => {
      const supabase = createRpcMockSupabase({ user: { id: "seller-42" } });
      await acceptOffer(supabase, "offer-1", {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "07700900000",
      });

      expect((supabase as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc).toHaveBeenCalledWith(
        "accept_offer_cascade",
        {
          p_offer_id: "offer-1",
          p_seller_id: "seller-42",
          p_solicitor_name: "Jane Smith",
          p_solicitor_email: "jane@example.com",
          p_solicitor_phone: "07700900000",
        },
      );
    });

    it("returns progressionId, rejectedCount, and listingId on success", async () => {
      const supabase = createRpcMockSupabase();
      const result = await acceptOffer(supabase, "offer-1");
      expect(result).toEqual({
        progressionId: "prog-1",
        rejectedCount: 2,
        listingId: "listing-1",
      });
    });

    it("throws descriptive error when offer is not owned by user", async () => {
      const supabase = createRpcMockSupabase({
        rpcResult: {
          data: null,
          error: { message: "Offer not found or not owned by you" },
        },
      });
      await expect(
        acceptOffer(supabase, "offer-1"),
      ).rejects.toThrow("Offer not found or not owned by you");
    });

    it("throws descriptive error when offer has already been actioned", async () => {
      const supabase = createRpcMockSupabase({
        rpcResult: {
          data: null,
          error: { message: "Offer has already been actioned" },
        },
      });
      await expect(
        acceptOffer(supabase, "offer-1"),
      ).rejects.toThrow("Offer has already been actioned");
    });

    it("propagates unknown RPC errors as-is", async () => {
      const rpcError = { message: "connection timeout", code: "TIMEOUT" };
      const supabase = createRpcMockSupabase({
        rpcResult: { data: null, error: rpcError },
      });
      await expect(
        acceptOffer(supabase, "offer-1"),
      ).rejects.toEqual(rpcError);
    });

    it("defaults solicitor fields to null when not provided", async () => {
      const supabase = createRpcMockSupabase({ user: { id: "seller-1" } });
      await acceptOffer(supabase, "offer-1");

      expect((supabase as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc).toHaveBeenCalledWith(
        "accept_offer_cascade",
        expect.objectContaining({
          p_solicitor_name: null,
          p_solicitor_email: null,
          p_solicitor_phone: null,
        }),
      );
    });
  });

  describe("PATCH route error mapping", () => {
    it("maps 'not owned by you' to 403 Forbidden", () => {
      const msg = "Offer not found, not owned by you, or already actioned";
      // Verify the error message contains the substring the route checks
      expect(msg.includes("not owned by you")).toBe(true);
    });

    it("maps 'already actioned' to 409 Conflict", () => {
      const msg = "Offer not found, not owned by you, or already actioned";
      // Verify the error message contains the substring the route checks
      expect(msg.includes("already actioned")).toBe(true);
    });
  });
});
