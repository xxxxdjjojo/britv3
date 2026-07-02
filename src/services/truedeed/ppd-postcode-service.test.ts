import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

import {
  buildRecentSales,
  buildSectorTrend,
  getRecentSalesForPostcode,
  getSectorTrend,
  TREND_MIN_TOTAL_SALES,
  type PpdRecentSaleRow,
  type PpdTrendRow,
} from "./ppd-postcode-service";

const NOW = new Date("2026-07-02T12:00:00Z");

function trendRow(date: string, pricePounds: number): PpdTrendRow {
  return { price_pence: pricePounds * 100, transfer_date: date };
}

/** n sales in the given month at the given prices (pounds). */
function monthOfSales(month: string, pricesPounds: number[]): PpdTrendRow[] {
  return pricesPounds.map((p, i) =>
    trendRow(`${month}-${String((i % 27) + 1).padStart(2, "0")}`, p),
  );
}

describe("buildSectorTrend", () => {
  it("buckets by calendar month and takes the median (odd count)", () => {
    const rows = monthOfSales("2026-06", [100_000, 300_000, 200_000]);
    const trend = buildSectorTrend(rows, NOW, "M1 4");

    expect(trend.months).toEqual([{ month: "2026-06", median: 200_000, count: 3 }]);
    expect(trend.totalCount).toBe(3);
    expect(trend.sector).toBe("M1 4");
  });

  it("averages the two middle values for an even count", () => {
    const rows = monthOfSales("2026-05", [100_000, 200_000, 400_000, 300_000]);
    const trend = buildSectorTrend(rows, NOW);

    expect(trend.months[0].median).toBe(250_000);
  });

  it("omits empty months entirely (no zero-filled fabrication) and sorts ascending", () => {
    const rows = [
      ...monthOfSales("2026-06", [250_000]),
      ...monthOfSales("2026-01", [210_000, 230_000]),
      // 2026-02..05 have no sales at all.
    ];
    const trend = buildSectorTrend(rows, NOW);

    expect(trend.months.map((m) => m.month)).toEqual(["2026-01", "2026-06"]);
    expect(trend.months.map((m) => m.count)).toEqual([2, 1]);
  });

  it("excludes rows outside the trailing 12 calendar months and rows missing price/date", () => {
    const rows: PpdTrendRow[] = [
      trendRow("2024-06-01", 999_999), // too old
      trendRow("2026-08-01", 999_999), // in the future
      { price_pence: null, transfer_date: "2026-06-01" },
      { price_pence: 100, transfer_date: null },
      trendRow("2026-06-15", 200_000), // the only qualifying row
    ];
    const trend = buildSectorTrend(rows, NOW);

    expect(trend.months).toEqual([{ month: "2026-06", median: 200_000, count: 1 }]);
    expect(trend.totalCount).toBe(1);
  });

  it(`self-gates: insufficient below ${TREND_MIN_TOTAL_SALES} total sales, sufficient at the threshold`, () => {
    const below = buildSectorTrend(
      monthOfSales("2026-06", Array.from({ length: TREND_MIN_TOTAL_SALES - 1 }, () => 200_000)),
      NOW,
    );
    const atThreshold = buildSectorTrend(
      [
        ...monthOfSales("2026-05", Array.from({ length: 15 }, () => 210_000)),
        ...monthOfSales("2026-06", Array.from({ length: 15 }, () => 200_000)),
      ],
      NOW,
    );

    expect(below.insufficient).toBe(true);
    expect(atThreshold.totalCount).toBe(TREND_MIN_TOTAL_SALES);
    expect(atThreshold.insufficient).toBe(false);
  });

  it("returns an insufficient empty trend for no rows", () => {
    const trend = buildSectorTrend([], NOW);
    expect(trend).toEqual({ sector: null, months: [], totalCount: 0, insufficient: true });
  });
});

describe("buildRecentSales", () => {
  const row: PpdRecentSaleRow = {
    ppd_tuid: "{TUID-1}",
    price_pence: 31_450_000,
    transfer_date: "2026-03-14",
    property_type: "T",
    street: "ACACIA AVENUE",
    paon: "12",
    new_build: false,
  };

  it("maps a raw row to pounds, label and a title-cased address", () => {
    expect(buildRecentSales([row])).toEqual([
      {
        id: "{TUID-1}",
        pricePounds: 314_500,
        date: "2026-03-14",
        propertyTypeLabel: "Terraced",
        street: "12 Acacia Avenue",
        newBuild: false,
      },
    ]);
  });

  it("labels every PPD property_type code honestly", () => {
    const labels = ["D", "S", "T", "F", "O", null].map(
      (code) =>
        buildRecentSales([{ ...row, property_type: code }])[0].propertyTypeLabel,
    );
    expect(labels).toEqual([
      "Detached",
      "Semi-detached",
      "Terraced",
      "Flat/maisonette",
      "Other",
      "Other",
    ]);
  });

  it("drops rows without a real price or date and flags new builds", () => {
    const sales = buildRecentSales([
      { ...row, price_pence: null },
      { ...row, transfer_date: null },
      { ...row, ppd_tuid: "{TUID-2}", new_build: true, paon: null, street: null },
    ]);

    expect(sales).toHaveLength(1);
    expect(sales[0]).toMatchObject({ id: "{TUID-2}", newBuild: true, street: "" });
  });
});

describe("IO functions never throw", () => {
  beforeEach(() => {
    fromMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("getRecentSalesForPostcode returns [] on a query error and for invalid postcodes", async () => {
    const limit = vi.fn(async () => ({ data: null, error: { message: "boom" } }));
    const order = vi.fn(() => ({ limit }));
    const neq = vi.fn(() => ({ order }));
    const eq = vi.fn(() => ({ neq }));
    const select = vi.fn(() => ({ eq }));
    fromMock.mockReturnValue({ select });

    await expect(getRecentSalesForPostcode("m1  1ae")).resolves.toEqual([]);
    expect(eq).toHaveBeenCalledWith("postcode", "M1 1AE"); // normalised
    await expect(getRecentSalesForPostcode("not a postcode")).resolves.toEqual([]);
  });

  it("getSectorTrend derives the sector and returns an insufficient trend on error", async () => {
    const limit = vi.fn(async () => ({ data: null, error: { message: "boom" } }));
    const neq = vi.fn(() => ({ limit }));
    const gte = vi.fn(() => ({ neq }));
    const like = vi.fn(() => ({ gte }));
    const select = vi.fn(() => ({ like }));
    fromMock.mockReturnValue({ select });

    const trend = await getSectorTrend("DA1 1AA");

    expect(like).toHaveBeenCalledWith("postcode", "DA1 1%");
    expect(trend).toMatchObject({ sector: "DA1 1", insufficient: true, months: [] });
    await expect(getSectorTrend("nope")).resolves.toMatchObject({ insufficient: true });
  });
});
