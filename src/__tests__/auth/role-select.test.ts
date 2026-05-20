import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";

const mockSupabase = createMockSupabaseClient();

vi.mock("@/lib/supabase/server", () => {
  const client = createMockSupabaseClient();
  return {
    createClient: vi.fn().mockResolvedValue(client),
  };
});

// Override: we'll replace the mock return per test
import { createClient } from "@/lib/supabase/server";
import { selectRoles } from "@/services/auth/role-service";

const mockedCreateClient = vi.mocked(createClient);

describe("selectRoles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateClient.mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  it("calls select_roles_atomic RPC with user id and roles", async () => {
    // Service now delegates to a single atomic RPC that upserts user_roles,
    // sets active_role, and writes the audit entry in one transaction.
    const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
    mockSupabase.rpc = mockRpc;

    const result = await selectRoles("user-123", ["homebuyer", "landlord"]);

    expect(result.error).toBeNull();
    expect(mockRpc).toHaveBeenCalledWith("select_roles_atomic", {
      p_user_id: "user-123",
      p_roles: ["homebuyer", "landlord"],
    });
  });

  it("rejects empty role selection", async () => {
    const result = await selectRoles("user-123", []);

    expect(result.error).toBeTruthy();
    expect(result.error?.message).toMatch(/at least one role/i);
  });

  it("handles duplicate roles by deduplicating", async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
    mockSupabase.rpc = mockRpc;

    await selectRoles("user-123", ["homebuyer", "homebuyer", "renter"]);

    expect(mockRpc).toHaveBeenCalledWith("select_roles_atomic", {
      p_user_id: "user-123",
      p_roles: ["homebuyer", "renter"],
    });
  });
});
