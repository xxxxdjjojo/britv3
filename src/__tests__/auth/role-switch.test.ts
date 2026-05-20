import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";

const mockSupabase = createMockSupabaseClient();

vi.mock("@/lib/supabase/server", () => {
  const client = createMockSupabaseClient();
  return {
    createClient: vi.fn().mockResolvedValue(client),
  };
});

import { createClient } from "@/lib/supabase/server";
import { switchRole, getUserRoles, getActiveRole } from "@/services/auth/role-service";

const mockedCreateClient = vi.mocked(createClient);

describe("switchRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateClient.mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  it("calls switch_role_atomic RPC with user id and role", async () => {
    // Service now delegates to a single atomic RPC that verifies role
    // ownership, updates profiles.active_role, and writes an audit entry —
    // all in one transaction.
    const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
    mockSupabase.rpc = mockRpc;

    const result = await switchRole("user-123", "landlord");

    expect(result.error).toBeNull();
    expect(mockRpc).toHaveBeenCalledWith("switch_role_atomic", {
      p_user_id: "user-123",
      p_role: "landlord",
    });
  });

  it("rejects if user does not have the requested role", async () => {
    // The RPC raises a Postgres exception when the user lacks the role.
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "User does not have role: agent" },
    });
    mockSupabase.rpc = mockRpc;

    const result = await switchRole("user-123", "agent");

    expect(result.error).toBeTruthy();
    expect(result.error?.message).toMatch(/does not have.*role/i);
  });
});

describe("getUserRoles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateClient.mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  it("returns all roles for a user", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            { id: "1", user_id: "user-123", role: "homebuyer", granted_at: new Date().toISOString() },
            { id: "2", user_id: "user-123", role: "landlord", granted_at: new Date().toISOString() },
          ],
          error: null,
        }),
      }),
    });

    mockSupabase.from = mockFrom;

    const result = await getUserRoles("user-123");

    expect(result.data).toHaveLength(2);
    expect(result.data?.map((r) => r.role)).toEqual(["homebuyer", "landlord"]);
  });
});

describe("getActiveRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateClient.mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  it("returns the current active role from profile", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { active_role: "homebuyer" },
            error: null,
          }),
        }),
      }),
    });

    mockSupabase.from = mockFrom;

    const result = await getActiveRole("user-123");

    expect(result.data).toBe("homebuyer");
    expect(result.error).toBeNull();
  });
});
