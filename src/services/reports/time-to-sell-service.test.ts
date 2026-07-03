import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import {
  TIME_TO_SELL_MIN_PAIRS,
  buildTimeToSellEdition,
  getTimeToSellEdition,
} from "./time-to-sell-service";

const mockCreateClient = vi.mocked(createClient);

type RawRow = Parameters<typeof buildTimeToSellEdition>[0][number];

/** Raw snapshot-row fixture matching the time_to_sell_snapshots columns. */
function rawRow(overrides: Partial<RawRow> = {}): RawRow {
  return {
    period: "2026-Q2",
    area_level: "national",
    area_id: "uk",
    area_name: "United Kingdom",
    median_days: 174,
    sample_n: 120,
    suppressed: false,
    methodology_version: 1,
    refreshed_at: "2026-07-02T10:00:00Z",
    ...overrides,
  };
}

function district(slug: string, name: string, days: number | null, opts: Partial<RawRow> = {}) {
  return rawRow({
    area_level: "district",
    area_id: slug,
    area_name: name,
    median_days: days,
    sample_n: 40,
    ...opts,
  });
}

describe("buildTimeToSellEdition", () => {
  it("returns null for an empty row set (empty-table safety)", () => {
    expect(buildTimeToSellEdition([])).toBeNull();
  });

  it("keeps the national row even when suppressed — its sample_n is the coverage context", () => {
    const edition = buildTimeToSellEdition([
      rawRow({ median_days: null, sample_n: 0, suppressed: true }),
    ]);

    expect(edition).not.toBeNull();
    expect(edition!.national?.suppressed).toBe(true);
    expect(edition!.national?.visible).toBe(false);
    expect(edition!.national?.sampleN).toBe(0);
    expect(edition!.national?.medianDays).toBeNull();
  });

  it("computes visible = !suppressed on every row", () => {
    const edition = buildTimeToSellEdition([
      rawRow({ suppressed: false }),
      district("thin", "Thin District", 90, { suppressed: true, sample_n: 4 }),
    ]);

    expect(edition!.national?.visible).toBe(true);
    // Suppressed districts never enter the visible list.
    expect(edition!.districts).toHaveLength(0);
  });

  it("sorts visible districts by median days ascending — fastest first", () => {
    const edition = buildTimeToSellEdition([
      rawRow(),
      district("slowtown", "Slowtown", 240),
      district("fastford", "Fastford", 110),
      district("midham", "Midham", 180),
    ]);

    expect(edition!.districts.map((d) => d.areaName)).toEqual([
      "Fastford",
      "Midham",
      "Slowtown",
    ]);
  });

  it("tie-breaks equal medians alphabetically by name", () => {
    const edition = buildTimeToSellEdition([
      district("zebra", "Zebra District", 150),
      district("aardvark", "Aardvark District", 150),
    ]);

    expect(edition!.districts.map((d) => d.areaName)).toEqual([
      "Aardvark District",
      "Zebra District",
    ]);
  });

  it("never lists suppressed districts — counts them in suppressedCount and coverage", () => {
    const edition = buildTimeToSellEdition([
      rawRow(),
      district("ealing", "Ealing", 130),
      district("thin", "Thin District", 88, { suppressed: true, sample_n: 4 }),
      district("thin2", "Thinner District", null, { suppressed: true, sample_n: 1 }),
    ]);

    expect(edition!.districts).toHaveLength(1);
    expect(edition!.districts[0].areaId).toBe("ealing");
    expect(edition!.suppressedCount).toBe(2);
    expect(edition!.coverage).toEqual({
      districtsPublished: 1,
      districtsSuppressed: 2,
    });
  });

  it("today's prod state: single suppressed zero-sample national row builds an honest empty edition", () => {
    const edition = buildTimeToSellEdition([
      rawRow({ median_days: null, sample_n: 0, suppressed: true }),
    ]);

    expect(edition!.period).toBe("2026-Q2");
    expect(edition!.districts).toHaveLength(0);
    expect(edition!.coverage).toEqual({
      districtsPublished: 0,
      districtsSuppressed: 0,
    });
  });

  it("discloses the same threshold the refresh function enforces", () => {
    expect(TIME_TO_SELL_MIN_PAIRS).toBe(15);
  });
});

describe("getTimeToSellEdition", () => {
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
        {
          data: [{ period: "2026-Q2" }, { period: "2026-Q1" }, { period: "2026-Q2" }],
          error: null,
        },
        { data: [rawRow()], error: null },
      ) as never,
    );

    const result = await getTimeToSellEdition();
    expect(result.period).toBe("2026-Q2");
    expect(result.availablePeriods).toEqual(["2026-Q2", "2026-Q1"]);
    expect(result.edition?.national?.medianDays).toBe(174);
  });

  it("returns a null edition (with availablePeriods) for an unknown period", async () => {
    mockCreateClient.mockResolvedValue(
      clientWith(
        { data: [{ period: "2026-Q2" }], error: null },
        { data: [rawRow()], error: null },
      ) as never,
    );

    const result = await getTimeToSellEdition("2027-Q1");
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

    const result = await getTimeToSellEdition();
    expect(result).toEqual({ edition: null, period: null, availablePeriods: [] });
  });

  it("never throws — returns empty result when the client itself throws", async () => {
    mockCreateClient.mockRejectedValue(new Error("no cookies"));
    const result = await getTimeToSellEdition();
    expect(result.edition).toBeNull();
  });

  it("returns empty when the table has no rows at all", async () => {
    mockCreateClient.mockResolvedValue(
      clientWith({ data: [], error: null }, { data: [], error: null }) as never,
    );
    const result = await getTimeToSellEdition();
    expect(result.edition).toBeNull();
    expect(result.availablePeriods).toEqual([]);
  });
});
