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
    mockedCreateClient.mockResolvedValue(mockSupabase as ReturnType<Awaited<typeof createClient>>);
  });

  it("inserts roles into user_roles table and sets active_role", async () => {
    const mockFrom = vi.fn();
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_roles") {
        return { insert: mockInsert };
      }
      if (table === "profiles") {
        return { update: mockUpdate };
      }
      return {};
    });

    mockSupabase.from = mockFrom;

    const result = await selectRoles("user-123", ["homebuyer", "landlord"]);

    expect(result.error).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith("user_roles");
    expect(mockInsert).toHaveBeenCalledWith([
      { user_id: "user-123", role: "homebuyer" },
      { user_id: "user-123", role: "landlord" },
    ]);
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockUpdate).toHaveBeenCalledWith({ active_role: "homebuyer" });
  });

  it("rejects empty role selection", async () => {
    const result = await selectRoles("user-123", []);

    expect(result.error).toBeTruthy();
    expect(result.error?.message).toMatch(/at least one role/i);
  });

  it("handles duplicate roles by deduplicating", async () => {
    const mockFrom = vi.fn();
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_roles") {
        return { insert: mockInsert };
      }
      if (table === "profiles") {
        return { update: mockUpdate };
      }
      return {};
    });

    mockSupabase.from = mockFrom;

    await selectRoles("user-123", ["homebuyer", "homebuyer", "renter"]);

    expect(mockInsert).toHaveBeenCalledWith([
      { user_id: "user-123", role: "homebuyer" },
      { user_id: "user-123", role: "renter" },
    ]);
  });
});
