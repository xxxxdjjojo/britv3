import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import {
  buildRealityGapCsv,
  buildRealityGapEdition,
  formatGapPct,
  getRealityGapEdition,
  sampleN,
} from "./reality-gap-service";

const mockCreateClient = vi.mocked(createClient);

type RawRow = Parameters<typeof buildRealityGapEdition>[0][number];

/** Raw snapshot-row fixture matching the reality_gap_snapshots columns. */
function rawRow(overrides: Partial<RawRow> = {}): RawRow {
  return {
    period: "2026-Q2",
    area_level: "national",
    area_id: "uk",
    area_name: "United Kingdom",
    property_type: "all",
    tier: "area_median",
    median_asking_pounds: 315000,
    median_sold_pounds: 300000,
    gap_pct: 5,
    sample_asking_n: 250,
    sample_sold_n: 900000,
    suppressed: false,
    methodology_version: 1,
    refreshed_at: "2026-07-02T10:00:00Z",
    ...overrides,
  };
}

function district(slug: string, name: string, gap: number | null, opts: Partial<RawRow> = {}) {
  return rawRow({
    area_level: "district",
    area_id: slug,
    area_name: name,
    gap_pct: gap,
    sample_asking_n: 40,
    sample_sold_n: 400,
    ...opts,
  });
}

describe("buildRealityGapEdition", () => {
  it("returns null for an empty row set", () => {
    expect(buildRealityGapEdition([])).toBeNull();
  });

  it("keeps the matched_pair and area_median tiers strictly separate", () => {
    const edition = buildRealityGapEdition([
      rawRow({ tier: "area_median", gap_pct: 5 }),
      rawRow({
        tier: "matched_pair",
        gap_pct: 2.4,
        sample_asking_n: 12,
        sample_sold_n: 12,
      }),
    ]);

    expect(edition).not.toBeNull();
    expect(edition!.tiers.area_median.national.all?.gapPct).toBe(5);
    expect(edition!.tiers.matched_pair.national.all?.gapPct).toBe(2.4);
    // Neither tier group contains the other's row.
    expect(edition!.tiers.area_median.national.all?.tier).toBe("area_median");
    expect(edition!.tiers.matched_pair.national.all?.tier).toBe("matched_pair");
  });

  it("computes visible = !suppressed on every row", () => {
    const edition = buildRealityGapEdition([
      rawRow({ suppressed: false }),
      rawRow({ property_type: "flat", suppressed: true, sample_asking_n: 3 }),
    ]);

    expect(edition!.tiers.area_median.national.all?.visible).toBe(true);
    expect(edition!.tiers.area_median.national.flat?.visible).toBe(false);
  });

  it("ranks the league by absolute gap ascending — smallest gap is rank 1", () => {
    const edition = buildRealityGapEdition([
      district("manchester", "Manchester", 8.2),
      district("ealing", "Ealing", -1.1),
      district("leeds", "Leeds", 3.4),
    ]);

    expect(edition!.league.map((e) => [e.rank, e.areaName])).toEqual([
      [1, "Ealing"],
      [2, "Leeds"],
      [3, "Manchester"],
    ]);
  });

  it("never ranks suppressed districts and counts them instead", () => {
    const edition = buildRealityGapEdition([
      district("ealing", "Ealing", 2.0),
      district("thin", "Thin District", 0.1, { suppressed: true, sample_asking_n: 4 }),
      district("thin2", "Thinner District", null, { suppressed: true, sample_asking_n: 1 }),
    ]);

    expect(edition!.league).toHaveLength(1);
    expect(edition!.league[0].areaId).toBe("ealing");
    expect(edition!.suppressedDistrictCount).toBe(2);
  });

  it("excludes matched_pair districts from the league even when visible", () => {
    const edition = buildRealityGapEdition([
      district("ealing", "Ealing", 9.9, { tier: "matched_pair" }),
    ]);
    expect(edition!.league).toHaveLength(0);
  });
});

describe("formatGapPct / sampleN", () => {
  it("formats signed one-decimal percentages", () => {
    expect(formatGapPct(4.25)).toBe("+4.3%");
    expect(formatGapPct(-1.3)).toBe("−1.3%");
    expect(formatGapPct(0)).toBe("0.0%");
  });

  it("sampleN is the binding (smaller) sample", () => {
    expect(sampleN({ sampleAskingN: 12, sampleSoldN: 900 })).toBe(12);
  });
});

describe("buildRealityGapCsv", () => {
  const visible = {
    period: "2026-Q2",
    areaLevel: "national" as const,
    areaId: "uk",
    areaName: "United Kingdom",
    propertyType: "all" as const,
    tier: "area_median" as const,
    medianAskingPounds: 315000,
    medianSoldPounds: 300000,
    gapPct: 5,
    sampleAskingN: 250,
    sampleSoldN: 900000,
    suppressed: false,
    visible: true,
    methodologyVersion: 1,
    refreshedAt: "2026-07-02T10:00:00Z",
  };

  it("serialises only non-suppressed rows with quoted cells", () => {
    const csv = buildRealityGapCsv([
      visible,
      { ...visible, propertyType: "flat", suppressed: true, visible: false },
    ]);

    expect(csv).toContain('"uk"');
    expect(csv).toContain('"315000"');
    expect(csv).not.toContain('"flat"');
    // header + exactly one data row
    expect(csv.trim().split("\r\n")).toHaveLength(2);
  });

  it("neutralises formula-triggering cells", () => {
    const csv = buildRealityGapCsv([{ ...visible, areaName: "=SUM(A1)" }]);
    expect(csv).toContain("\"'=SUM(A1)\"");
  });
});

describe("getRealityGapEdition", () => {
  function clientWith(
    periods: { data: unknown; error: unknown },
    rows: { data: unknown; error: unknown },
  ) {
    return {
      from: vi.fn(() => ({
        select: vi.fn((columns: string) => {
          if (columns === "period") {
            return {
              order: vi.fn(() => ({ limit: vi.fn(async () => periods) })),
            };
          }
          return { eq: vi.fn(async () => rows) };
        }),
      })),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves the latest period by default and returns the built edition", async () => {
    mockCreateClient.mockResolvedValue(
      clientWith(
        { data: [{ period: "2026-Q2" }, { period: "2026-Q1" }, { period: "2026-Q2" }], error: null },
        { data: [rawRow()], error: null },
      ) as never,
    );

    const result = await getRealityGapEdition();
    expect(result.period).toBe("2026-Q2");
    expect(result.availablePeriods).toEqual(["2026-Q2", "2026-Q1"]);
    expect(result.edition?.tiers.area_median.national.all?.gapPct).toBe(5);
    expect(result.rows).toHaveLength(1);
  });

  it("returns a null edition (with availablePeriods) for an unknown period", async () => {
    mockCreateClient.mockResolvedValue(
      clientWith(
        { data: [{ period: "2026-Q2" }], error: null },
        { data: [rawRow()], error: null },
      ) as never,
    );

    const result = await getRealityGapEdition("2027-Q1");
    expect(result.edition).toBeNull();
    expect(result.period).toBeNull();
    expect(result.availablePeriods).toEqual(["2026-Q2"]);
  });

  it("never throws — returns empty result on query error", async () => {
    mockCreateClient.mockResolvedValue(
      clientWith(
        { data: null, error: { message: "boom" } },
        { data: null, error: null },
      ) as never,
    );

    const result = await getRealityGapEdition();
    expect(result).toEqual({ edition: null, period: null, availablePeriods: [], rows: [] });
  });

  it("never throws — returns empty result when the client itself throws", async () => {
    mockCreateClient.mockRejectedValue(new Error("no cookies"));
    const result = await getRealityGapEdition();
    expect(result.edition).toBeNull();
  });

  it("returns empty when the table has no rows at all", async () => {
    mockCreateClient.mockResolvedValue(
      clientWith({ data: [], error: null }, { data: [], error: null }) as never,
    );
    const result = await getRealityGapEdition();
    expect(result.edition).toBeNull();
    expect(result.availablePeriods).toEqual([]);
  });
});
