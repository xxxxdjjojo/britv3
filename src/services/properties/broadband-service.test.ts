import { describe, it, expect, vi, beforeEach } from "vitest";

const maybeSingleMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: maybeSingleMock }),
      }),
    }),
  }),
}));

import { normalisePostcode, getBroadbandCoverage } from "./broadband-service";

describe("normalisePostcode", () => {
  it("uppercases and strips all whitespace to the table key form", () => {
    expect(normalisePostcode("al10 0aa")).toBe("AL100AA");
    expect(normalisePostcode("  TW7 9AB ")).toBe("TW79AB");
  });
});

describe("getBroadbandCoverage", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
  });

  it("maps a coverage row to widget percentages", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        sfbb_pct: 100,
        ufbb_pct: 33.3,
        gigabit_pct: 33.3,
        below_uso_pct: 0,
      },
      error: null,
    });

    expect(await getBroadbandCoverage("AL10 0AL")).toEqual({
      superfastPct: 100,
      ultrafastPct: 33.3,
      gigabitPct: 33.3,
      belowUsoPct: 0,
    });
  });

  it("coerces numeric strings and treats empty as null", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        sfbb_pct: "100.0",
        ufbb_pct: "",
        gigabit_pct: null,
        below_uso_pct: "0",
      },
      error: null,
    });

    expect(await getBroadbandCoverage("AL10 0AA")).toEqual({
      superfastPct: 100,
      ultrafastPct: null,
      gigabitPct: null,
      belowUsoPct: 0,
    });
  });

  it("returns null when the postcode is not covered", async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
    expect(await getBroadbandCoverage("ZZ99 9ZZ")).toBeNull();
  });

  it("returns null on a lookup error", async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: { code: "PGRST" } });
    expect(await getBroadbandCoverage("AL10 0AA")).toBeNull();
  });

  it("returns null for an empty postcode without querying", async () => {
    expect(await getBroadbandCoverage("   ")).toBeNull();
    expect(maybeSingleMock).not.toHaveBeenCalled();
  });
});
