/**
 * Tests 1-2: agent-lead-service
 * - updateLeadStage() happy path
 * - stale updated_at -> 409-style PGRST116 error
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";
import { updateLeadStage } from "@/services/agent/agent-lead-service";

describe("updateLeadStage", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it("Test 1: happy path — updates stage and returns updated lead", async () => {
    const leadId = "lead-001";
    const agentId = "agent-001";
    const newStage = "qualified" as const;

    const mockCurrentLead = { stage: "new_enquiry" };
    const mockUpdatedLead = {
      id: leadId,
      agent_id: agentId,
      contact_name: "Alice Smith",
      stage: newStage,
      updated_at: new Date().toISOString(),
    };
    const mockActivity = {
      id: "act-001",
      lead_id: leadId,
      actor_id: agentId,
      activity_type: "stage_changed",
      description: "Stage changed",
      metadata: {},
      created_at: new Date().toISOString(),
    };

    // First call: fetch current stage
    // Second call: update stage
    // Third call: addLeadActivity insert
    let callCount = 0;
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      callCount++;
      const builder = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      if (table === "agent_leads" && callCount === 1) {
        // fetch current stage
        builder.single.mockResolvedValue({ data: mockCurrentLead, error: null });
      } else if (table === "agent_leads" && callCount === 2) {
        // update
        builder.single.mockResolvedValue({ data: mockUpdatedLead, error: null });
      } else if (table === "agent_lead_activities") {
        // insert activity
        builder.single.mockResolvedValue({ data: mockActivity, error: null });
      }

      return builder;
    });

    const result = await updateLeadStage(
      mockClient as never,
      leadId,
      agentId,
      newStage,
    );

    expect(result).toMatchObject({ id: leadId, stage: newStage });
  });

  it("Test 2: stale updated_at — throws 409-style error when PGRST116 returned with knownAt", async () => {
    const leadId = "lead-001";
    const agentId = "agent-001";
    const newStage = "qualified" as const;
    const knownAt = "2026-03-01T10:00:00Z";

    let callCount = 0;
    mockClient.from = vi.fn().mockImplementation((table: string) => {
      callCount++;
      const builder = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      if (table === "agent_leads" && callCount === 1) {
        // fetch current stage succeeds
        builder.single.mockResolvedValue({
          data: { stage: "new_enquiry" },
          error: null,
        });
      } else if (table === "agent_leads" && callCount === 2) {
        // update returns PGRST116 (0 rows — stale knownAt)
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
      updateLeadStage(
        mockClient as never,
        leadId,
        agentId,
        newStage,
        undefined,
        knownAt,
      ),
    ).rejects.toThrow("updated by another user");
  });
});
