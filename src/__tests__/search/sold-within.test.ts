import { describe, expect, it } from "vitest";
import { computeSoldSince, DEFAULT_SOLD_WITHIN } from "@/lib/search/sold-within";

describe("computeSoldSince", () => {
  it("returns null for 'all'", () => {
    const now = new Date("2026-06-19T12:00:00Z");
    expect(computeSoldSince("all", now)).toBeNull();
  });

  it("returns 3 months ago ISO date for '3m'", () => {
    const now = new Date("2026-06-19T12:00:00Z");
    expect(computeSoldSince("3m", now)).toBe("2026-03-19");
  });

  it("returns 6 months ago ISO date for '6m'", () => {
    const now = new Date("2026-06-19T12:00:00Z");
    expect(computeSoldSince("6m", now)).toBe("2025-12-19");
  });

  it("returns 12 months ago ISO date for '12m'", () => {
    const now = new Date("2026-01-15T00:00:00Z");
    expect(computeSoldSince("12m", now)).toBe("2025-01-15");
  });

  it("DEFAULT_SOLD_WITHIN is 'all'", () => {
    expect(DEFAULT_SOLD_WITHIN).toBe("all");
  });
});
