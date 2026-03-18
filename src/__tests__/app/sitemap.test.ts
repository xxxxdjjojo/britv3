import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Supabase server client before importing sitemap
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock next/headers (required by the real createClient)
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}));

import sitemap from "@/app/sitemap";
import { createClient } from "@/lib/supabase/server";

const mockCreateClient = vi.mocked(createClient);

function makeMockSupabase(fromImpl: ReturnType<typeof vi.fn>) {
  return { from: fromImpl } as unknown as Awaited<ReturnType<typeof createClient>>;
}

describe("sitemap.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes the homepage with priority 1.0", async () => {
    mockCreateClient.mockResolvedValue(
      makeMockSupabase(vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })),
    );

    const result = await sitemap();
    const homepage = result.find((r) => r.url === "https://britestate.co.uk");
    expect(homepage).toBeDefined();
    expect(homepage!.priority).toBe(1.0);
    expect(homepage!.changeFrequency).toBe("daily");
  });

  it("includes weekly static routes at priority 0.8", async () => {
    mockCreateClient.mockResolvedValue(
      makeMockSupabase(vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })),
    );

    const result = await sitemap();
    const aboutRoute = result.find((r) => r.url === "https://britestate.co.uk/about");
    expect(aboutRoute).toBeDefined();
    expect(aboutRoute!.priority).toBe(0.8);
    expect(aboutRoute!.changeFrequency).toBe("weekly");
  });

  it("includes legal routes at priority 0.3", async () => {
    mockCreateClient.mockResolvedValue(
      makeMockSupabase(vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })),
    );

    const result = await sitemap();
    const terms = result.find((r) => r.url === "https://britestate.co.uk/legal/terms");
    expect(terms).toBeDefined();
    expect(terms!.priority).toBe(0.3);
    expect(terms!.changeFrequency).toBe("monthly");
  });

  it("includes service category routes at priority 0.7", async () => {
    mockCreateClient.mockResolvedValue(
      makeMockSupabase(vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })),
    );

    const result = await sitemap();
    const plumbers = result.find(
      (r) => r.url === "https://britestate.co.uk/services/plumbers",
    );
    expect(plumbers).toBeDefined();
    expect(plumbers!.priority).toBe(0.7);
    expect(plumbers!.changeFrequency).toBe("weekly");
  });

  it("generates dynamic property routes from Supabase data", async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "listings") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { slug: "2-bed-flat-london", updated_at: "2025-06-01T00:00:00Z" },
                { slug: "3-bed-house-manchester", updated_at: "2025-06-02T00:00:00Z" },
              ],
              error: null,
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    });

    mockCreateClient.mockResolvedValue(makeMockSupabase(mockFrom));

    const result = await sitemap();
    const propRoute = result.find(
      (r) => r.url === "https://britestate.co.uk/properties/2-bed-flat-london",
    );
    expect(propRoute).toBeDefined();
    expect(propRoute!.priority).toBe(0.8);
    expect(propRoute!.changeFrequency).toBe("daily");
  });

  it("generates dynamic blog routes from Supabase data", async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "cms_articles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { slug: "buying-guide", updated_at: "2025-05-01T00:00:00Z" },
              ],
              error: null,
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    });

    mockCreateClient.mockResolvedValue(makeMockSupabase(mockFrom));

    const result = await sitemap();
    const blogRoute = result.find(
      (r) => r.url === "https://britestate.co.uk/blog/buying-guide",
    );
    expect(blogRoute).toBeDefined();
    expect(blogRoute!.priority).toBe(0.6);
    expect(blogRoute!.changeFrequency).toBe("weekly");
  });

  it("returns static routes when Supabase fails (graceful degradation)", async () => {
    mockCreateClient.mockRejectedValue(new Error("Connection refused"));

    const result = await sitemap();

    // Static routes should still be present
    const homepage = result.find((r) => r.url === "https://britestate.co.uk");
    expect(homepage).toBeDefined();

    // Service categories should still be present
    const plumbers = result.find(
      (r) => r.url === "https://britestate.co.uk/services/plumbers",
    );
    expect(plumbers).toBeDefined();

    // No dynamic property or blog routes
    const propertyRoutes = result.filter((r) => r.url.includes("/properties/"));
    expect(propertyRoutes).toHaveLength(0);
  });

  it("includes pricing and how-it-works at priority 0.5", async () => {
    mockCreateClient.mockResolvedValue(
      makeMockSupabase(vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })),
    );

    const result = await sitemap();
    const pricing = result.find((r) => r.url === "https://britestate.co.uk/pricing");
    expect(pricing).toBeDefined();
    expect(pricing!.priority).toBe(0.5);
    expect(pricing!.changeFrequency).toBe("monthly");
  });
});
