/**
 * Test 3: agent-team-service
 * - getTeamMemberRole() for 4 scenarios: owner, admin, viewer, stranger
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";
import { getTeamMemberRole } from "@/services/agent/agent-team-service";

describe("getTeamMemberRole", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  it("Test 3a: returns 'owner' when userId === agentId (no DB call needed)", async () => {
    const agentId = "agent-001";
    const result = await getTeamMemberRole(
      mockClient as never,
      agentId,
      agentId, // same ID
    );
    expect(result).toBe("owner");
    // Should not hit the DB
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("Test 3b: returns 'admin' role when DB returns { role: 'admin' }", async () => {
    const agentId = "agent-001";
    const userId = "user-admin";

    const queryBuilder = mockClient.from("agent_team_members");
    (queryBuilder.single as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    const result = await getTeamMemberRole(
      mockClient as never,
      agentId,
      userId,
    );
    expect(result).toBe("admin");
  });

  it("Test 3c: returns 'viewer' role when DB returns { role: 'viewer' }", async () => {
    const agentId = "agent-001";
    const userId = "user-viewer";

    const queryBuilder = mockClient.from("agent_team_members");
    (queryBuilder.single as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { role: "viewer" },
      error: null,
    });

    const result = await getTeamMemberRole(
      mockClient as never,
      agentId,
      userId,
    );
    expect(result).toBe("viewer");
  });

  it("Test 3d: returns null when DB returns PGRST116 (user is not a member)", async () => {
    const agentId = "agent-001";
    const userId = "user-stranger";

    const queryBuilder = mockClient.from("agent_team_members");
    (queryBuilder.single as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: "The result contains 0 rows", code: "PGRST116" },
    });

    const result = await getTeamMemberRole(
      mockClient as never,
      agentId,
      userId,
    );
    expect(result).toBeNull();
  });
});
