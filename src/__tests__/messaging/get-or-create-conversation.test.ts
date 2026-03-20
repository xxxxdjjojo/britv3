import { describe, it, expect, vi } from "vitest";
import { getOrCreateConversation } from "@/services/messaging/message-service";

describe("getOrCreateConversation", () => {
  it("creates a new conversation when none exists (uses maybeSingle, not single)", () => {
    // When .single() is used on an empty result, Supabase throws PGRST116.
    // With .maybeSingle(), it returns { data: null, error: null } — clean.
    // We verify the query builder calls .maybeSingle() instead of .single().

    const insertResult = { id: "new-conv-id" };

    // Track which method gets called on the select chain
    let calledMaybeSingle = false;
    let calledSingle = false;

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockImplementation(() => {
                  calledMaybeSingle = true;
                  return Promise.resolve({ data: null, error: null });
                }),
                single: vi.fn().mockImplementation(() => {
                  calledSingle = true;
                  // .single() on empty result returns PGRST116 error
                  return Promise.resolve({
                    data: null,
                    error: { code: "PGRST116", message: "No rows found" },
                  });
                }),
              }),
            }),
          }),
          // For the insert chain
          single: vi.fn().mockResolvedValue({ data: insertResult, error: null }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: insertResult, error: null }),
          }),
        }),
      }),
    };

    return getOrCreateConversation(
      mockSupabase as never,
      "user-1",
      "user-2",
      "general",
    ).then((result) => {
      expect(result.id).toBe("new-conv-id");
      // The critical assertion: should use maybeSingle, NOT single, for existence check
      expect(calledMaybeSingle).toBe(true);
      expect(calledSingle).toBe(false);
    });
  });
});
