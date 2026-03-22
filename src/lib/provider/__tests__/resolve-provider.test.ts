import { describe, it, expect, vi } from "vitest";
import { resolveProviderId } from "../resolve-provider";

function mockSupabase(
  user: { id: string } | null,
  providerRow: Record<string, unknown> | null,
  error: { message: string } | null = null,
) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: providerRow,
            error,
          }),
        }),
      }),
    }),
  } as unknown;
}

describe("resolveProviderId", () => {
  it("returns provider id and business name from service_provider_details", async () => {
    const supabase = mockSupabase(
      { id: "user-1" },
      { id: "provider-1", business_name: "Steve's Plumbing" },
    );
    const result = await resolveProviderId(supabase as any);
    expect(result.providerId).toBe("provider-1");
    expect(result.userId).toBe("user-1");
    expect(result.businessName).toBe("Steve's Plumbing");
  });

  it("returns empty string for null business_name", async () => {
    const supabase = mockSupabase(
      { id: "user-1" },
      { id: "provider-1", business_name: null },
    );
    const result = await resolveProviderId(supabase as any);
    expect(result.businessName).toBe("");
  });

  it("throws when not authenticated", async () => {
    const supabase = mockSupabase(null, null);
    await expect(resolveProviderId(supabase as any)).rejects.toThrow("Not authenticated");
  });

  it("throws when no provider profile exists", async () => {
    const supabase = mockSupabase({ id: "user-1" }, null);
    await expect(resolveProviderId(supabase as any)).rejects.toThrow("Provider profile not found");
  });

  it("throws on database error", async () => {
    const supabase = mockSupabase({ id: "user-1" }, null, { message: "DB error" });
    await expect(resolveProviderId(supabase as any)).rejects.toThrow("Provider profile not found");
  });
});
