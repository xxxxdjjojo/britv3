import { describe, it, expect, vi, beforeEach } from "vitest";

// The admin client is the seam that throws at build time when service-role
// credentials are absent (static export without server env). getTopList must
// degrade to an empty list instead of crashing the whole production export.
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

// Benchmark lookups must never be reached when there are no candidates.
vi.mock("@/services/market-map/postcode-card-service", () => ({
  getPostcodeCard: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { getPostcodeCard } from "@/services/market-map/postcode-card-service";
import { getTopList } from "./top-list-service";

describe("getTopList — resilience when the admin client is unavailable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a valid empty result (does not throw) when createAdminClient throws", async () => {
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
      );
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // "below-local-benchmark" is a value category — the one that crashed the
    // build. It must render an empty, non-indexable list, not throw.
    const result = await getTopList("below-local-benchmark");

    expect(result).not.toBeNull();
    expect(result!.items).toEqual([]);
    expect(result!.itemCount).toBe(0);
    expect(result!.isIndexable).toBe(false);
    // Benchmark path must be short-circuited when there are no candidates.
    expect(getPostcodeCard).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("returns null for an unknown slug (so the page can 404)", async () => {
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw new Error("unused");
    });
    expect(await getTopList("no-such-list")).toBeNull();
  });
});
