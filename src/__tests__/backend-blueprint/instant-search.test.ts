import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cache/redis", () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
  createRateLimiter: vi.fn(() => ({
    limit: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

const mockSelect = vi.fn();
const mockIlike = vi.fn();
const mockLimit = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({
        ilike: mockIlike.mockReturnValue({
          limit: mockLimit,
        }),
      }),
    })),
  }),
}));

import { getCached, setCache } from "@/lib/cache/redis";

const mockGetCached = getCached as unknown as ReturnType<typeof vi.fn>;
const mockSetCache = setCache as unknown as ReturnType<typeof vi.fn>;

describe("Instant Search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cached results on Redis hit", async () => {
    const cached = [
      { listing_id: "1", title: "London Flat", slug: "london-flat", price: 350000 },
    ];
    mockGetCached.mockResolvedValue(cached);

    const { GET } = await import("@/app/api/search/instant/route");
    const request = new Request("http://localhost:3000/api/search/instant?q=london");
    const response = await GET(request);
    const data = await response.json();

    expect(data.results).toEqual(cached);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("returns empty array for query shorter than 2 chars", async () => {
    const { GET } = await import("@/app/api/search/instant/route");
    const request = new Request("http://localhost:3000/api/search/instant?q=a");
    const response = await GET(request);
    const data = await response.json();

    expect(data.results).toEqual([]);
  });

  it("returns empty array for missing query", async () => {
    const { GET } = await import("@/app/api/search/instant/route");
    const request = new Request("http://localhost:3000/api/search/instant?q=");
    const response = await GET(request);
    const data = await response.json();

    expect(data.results).toEqual([]);
  });
});
