/**
 * Tests 5-6: agent-sale-service
 * Test 5: non-adjacent stage transition rejected
 * Test 6: stale updated_at -> 409-style error on updateSaleStage()
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";
import {
  ALLOWED_TRANSITIONS,
  updateSaleStage,
} from "@/services/agent/agent-sale-service";
import type { SaleStage } from "@/types/agent";

describe("ALLOWED_TRANSITIONS", () => {
  it("Test 5: non-adjacent transition from offer_accepted to searches is rejected", async () => {
    // offer_accepted can only go to memorandum_of_sale, not searches directly
    const currentStage: SaleStage = "offer_accepted";
    const nonAdjacentStage: SaleStage = "searches";

    const allowed = ALLOWED_TRANSITIONS[currentStage];
    expect(allowed).not.toContain(nonAdjacentStage);
  });

  it("Test 5b: updateSaleStage throws for non-adjacent transition", async () => {
    const mockClient = createMockSupabaseClient();
    const progressionId = "prog-001";
    const agentId = "agent-001";
    // offer_accepted -> searches is skipping stages (invalid)
    const nonAdjacentStage: SaleStage = "searches";

    mockClient.from = vi.fn().mockImplementation(() => {
      const builder = {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { stage: "offer_accepted" },
          error: null,
        }),
      };
      return builder;
    });

    await expect(
      updateSaleStage(
        mockClient as never,
        progressionId,
        agentId,
        nonAdjacentStage,
      ),
    ).rejects.toThrow(/Invalid stage transition/);
  });

  it("Test 5c: non-adjacent skip from offer_accepted to completion is rejected", async () => {
    const mockClient = createMockSupabaseClient();
    const progressionId = "prog-001";
    const agentId = "agent-001";
    const skippedStage: SaleStage = "completion";

    mockClient.from = vi.fn().mockImplementation(() => {
      const builder = {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { stage: "offer_accepted" },
          error: null,
        }),
      };
      return builder;
    });

    await expect(
      updateSaleStage(
        mockClient as never,
        progressionId,
        agentId,
        skippedStage,
      ),
    ).rejects.toThrow(/Invalid stage transition/);
  });
});

describe("updateSaleStage — stale concurrency", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it("Test 6: stale updated_at — throws 409-style error when PGRST116 returned with knownAt", async () => {
    const progressionId = "prog-001";
    const agentId = "agent-001";
    const newStage: SaleStage = "memorandum_of_sale"; // valid adjacent stage
    const knownAt = "2026-03-01T10:00:00Z";

    let callCount = 0;
    mockClient.from = vi.fn().mockImplementation(() => {
      callCount++;
      const builder = {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      if (callCount === 1) {
        // fetch current stage
        builder.single.mockResolvedValue({
          data: { stage: "offer_accepted" },
          error: null,
        });
      } else {
        // update returns PGRST116 because knownAt doesn't match
        builder.single.mockResolvedValue({
          data: null,
          error: {
            message: "The result contains 0 rows",
            code: "PGRST116",
          },
        });
      }

      return builder;
    });

    await expect(
      updateSaleStage(
        mockClient as never,
        progressionId,
        agentId,
        newStage,
        undefined,
        knownAt,
      ),
    ).rejects.toThrow("updated by another user");
  });
});
