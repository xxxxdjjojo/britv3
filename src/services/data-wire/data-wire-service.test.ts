import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { buildPressPack } from "@/content/data-wire/templates";
import type { RealityGapLeagueEntry } from "@/services/reports/reality-gap-service";
import {
  buildChartUrls,
  buildPackHtml,
  buildWireAreas,
  getWireAreas,
  type WireArea,
} from "./data-wire-service";

const mockCreateClient = vi.mocked(createClient);

/** Raw reality_gap_snapshots district row for the mocked query. */
function rawDistrict(
  areaId: string,
  areaName: string,
  gap: number | null,
  overrides: Record<string, unknown> = {},
) {
  return {
    period: "2026-Q2",
    area_level: "district",
    area_id: areaId,
    area_name: areaName,
    property_type: "all",
    tier: "area_median",
    median_asking_pounds: 300000,
    median_sold_pounds: 290000,
    gap_pct: gap,
    sample_asking_n: 40,
    sample_sold_n: 400,
    suppressed: false,
    methodology_version: 1,
    refreshed_at: "2026-07-02T10:00:00Z",
    ...overrides,
  };
}

function clientWith(rows: unknown[]) {
  return {
    from: vi.fn(() => ({
      select: vi.fn((columns: string) => {
        if (columns === "period") {
          return {
            order: vi.fn(() => ({
              limit: vi.fn(async () => ({
                data: rows.map((r) => ({ period: (r as { period: string }).period })),
                error: null,
              })),
            })),
          };
        }
        return { eq: vi.fn(async () => ({ data: rows, error: null })) };
      }),
    })),
  };
}

function leagueEntry(
  overrides: Partial<RealityGapLeagueEntry> = {},
): RealityGapLeagueEntry {
  return {
    period: "2026-Q2",
    areaLevel: "district",
    areaId: "ealing",
    areaName: "Ealing",
    propertyType: "all",
    tier: "area_median",
    medianAskingPounds: 300000,
    medianSoldPounds: 290000,
    gapPct: 3.4,
    sampleAskingN: 40,
    sampleSoldN: 400,
    suppressed: false,
    visible: true,
    methodologyVersion: 1,
    refreshedAt: "2026-07-02T10:00:00Z",
    rank: 1,
    ...overrides,
  };
}

function wireArea(overrides: Partial<WireArea> = {}): WireArea {
  return {
    areaId: "ealing",
    areaName: "Ealing",
    period: "2026-Q2",
    gapPct: 3.4,
    medianAskingPounds: 300000,
    medianSoldPounds: 290000,
    sampleAskingN: 40,
    sampleSoldN: 400,
    rank: 1,
    totalRanked: 2,
    ...overrides,
  };
}

describe("buildWireAreas (pure)", () => {
  it("maps league entries with totalRanked and falls back to areaId for a null name", () => {
    const areas = buildWireAreas([
      leagueEntry({ rank: 1 }),
      leagueEntry({ areaId: "hounslow", areaName: null, rank: 2, gapPct: -5.1 }),
    ]);
    expect(areas).toHaveLength(2);
    expect(areas[0]).toMatchObject({ areaId: "ealing", rank: 1, totalRanked: 2 });
    expect(areas[1]).toMatchObject({ areaName: "hounslow", rank: 2, gapPct: -5.1 });
  });

  it("drops entries missing a median (nothing to quote)", () => {
    const areas = buildWireAreas([
      leagueEntry({ rank: 1 }),
      leagueEntry({ areaId: "camden", rank: 2, medianSoldPounds: null }),
    ]);
    expect(areas.map((a) => a.areaId)).toEqual(["ealing"]);
  });
});

describe("getWireAreas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns visible districts ranked by |gap| ascending and excludes suppressed rows", async () => {
    mockCreateClient.mockResolvedValue(
      clientWith([
        rawDistrict("hounslow", "Hounslow", -6.2),
        rawDistrict("ealing", "Ealing", 2.1),
        rawDistrict("camden", "Camden", 9.9, { suppressed: true }),
        // National row must never appear as a wire area.
        rawDistrict("uk", "United Kingdom", 4, { area_level: "national" }),
      ]) as never,
    );

    const result = await getWireAreas();
    expect(result.period).toBe("2026-Q2");
    expect(result.areas.map((a) => a.areaId)).toEqual(["ealing", "hounslow"]);
    expect(result.areas[0].rank).toBe(1);
    expect(result.areas[1].rank).toBe(2);
    expect(result.areas[0].totalRanked).toBe(2);
    expect(result.areas.some((a) => a.areaId === "camden")).toBe(false);
  });

  it("never throws — returns an empty result when the client fails", async () => {
    mockCreateClient.mockRejectedValue(new Error("no cookies"));
    const result = await getWireAreas();
    expect(result).toEqual({ period: null, availablePeriods: [], areas: [] });
  });
});

describe("buildPackHtml (pure)", () => {
  const chartUrls = {
    league: "https://truedeed.co.uk/api/og/league?area=Ealing&rank=1&gapPct=3.4",
    report: "https://truedeed.co.uk/api/og/report?title=T&stat=%2B3.4%25",
  };
  const meta = { areaName: "Ealing", period: "2026-Q2" };

  function packFor(area: WireArea) {
    return buildPressPack({
      areaName: area.areaName,
      areaId: area.areaId,
      period: area.period,
      gapPct: area.gapPct,
      medianAsking: area.medianAskingPounds,
      medianSold: area.medianSoldPounds,
      sampleAsking: area.sampleAskingN,
      sampleSold: area.sampleSoldN,
      rank: area.rank,
      totalRanked: area.totalRanked,
    });
  }

  it("embeds headline, paragraphs, boilerplate, attribution, charts and a plain-text block", () => {
    const pack = packFor(wireArea());
    const html = buildPackHtml(pack, chartUrls, meta);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain(pack.headline);
    expect(html).toContain("HM Land Registry Price Paid Data");
    expect(html).toContain("Data: TrueDeed (truedeed.co.uk/reports/reality-gap)");
    expect(html).toContain('src="https://truedeed.co.uk/api/og/league?area=Ealing&amp;rank=1&amp;gapPct=3.4"');
    expect(html).toContain("<pre");
  });

  it("escapes interpolated strings (XSS hygiene)", () => {
    const hostile = wireArea({
      areaName: '<script>alert("x")</script>',
      areaId: "hostile",
    });
    const html = buildPackHtml(packFor(hostile), chartUrls, {
      areaName: hostile.areaName,
      period: "2026-Q2",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("buildChartUrls (pure)", () => {
  it("builds absolute league and report OG URLs from the area", () => {
    const area = wireArea({ gapPct: -1.3 });
    const urls = buildChartUrls(
      area,
      "Headline here",
      (path) => `https://truedeed.co.uk${path}`,
    );
    expect(urls.league).toBe(
      "https://truedeed.co.uk/api/og/league?area=Ealing&rank=1&gapPct=-1.3",
    );
    expect(urls.report).toContain("https://truedeed.co.uk/api/og/report?");
    // URLSearchParams encodes spaces as "+".
    expect(urls.report).toContain("title=Headline+here");
    expect(urls.report).toContain("edition=2026-Q2");
  });
});
