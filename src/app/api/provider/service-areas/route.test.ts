import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "@/__tests__/mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("GET /api/provider/service-areas", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 401 when not authenticated", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const mockClient = createMockSupabaseClient();
    mockClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    vi.mocked(createClient).mockResolvedValue(mockClient as never);

    const { GET } = await import("./route");
    const res = await GET();

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 200 with service areas on happy path", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const mockClient = createMockSupabaseClient();

    // Auth returns a valid user
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    // First from() call: service_provider_details — return a profile
    const providerProfileBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "provider-1" },
        error: null,
      }),
    };

    // Second from() call: provider_service_areas — return rows
    const serviceAreasBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{ id: "area-1", provider_id: "provider-1", zone_type: "radius" }],
        error: null,
      }),
    };

    mockClient.from
      .mockReturnValueOnce(providerProfileBuilder as never)
      .mockReturnValueOnce(serviceAreasBuilder as never);

    vi.mocked(createClient).mockResolvedValue(mockClient as never);

    const { GET } = await import("./route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("area-1");
  });

  it("returns 200 with empty array when no service areas exist", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const mockClient = createMockSupabaseClient();

    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-2" } },
      error: null,
    });

    const providerProfileBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    const serviceAreasBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    mockClient.from
      .mockReturnValueOnce(providerProfileBuilder as never)
      .mockReturnValueOnce(serviceAreasBuilder as never);

    vi.mocked(createClient).mockResolvedValue(mockClient as never);

    const { GET } = await import("./route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("returns structured DATABASE_ERROR on Supabase failure", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const mockClient = createMockSupabaseClient();

    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-3" } },
      error: null,
    });

    const providerProfileBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "provider-3" }, error: null }),
    };

    const serviceAreasBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "relation does not exist", code: "42P01" },
      }),
    };

    mockClient.from
      .mockReturnValueOnce(providerProfileBuilder as never)
      .mockReturnValueOnce(serviceAreasBuilder as never);

    vi.mocked(createClient).mockResolvedValue(mockClient as never);

    const { GET } = await import("./route");
    const res = await GET();

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("DATABASE_ERROR");
    expect(body.error.message).toBe("A database error occurred. Please try again.");
  });
});
