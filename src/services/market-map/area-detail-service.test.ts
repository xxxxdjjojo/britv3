import { describe, it, expect } from "vitest";
import { buildAreaDetail } from "./area-detail-service";
import type { RawAreaDetail } from "./types";

const base: RawAreaDetail = {
  area_id: "ZZS01",
  geography_level: "lsoa",
  date_from: "2023-06-18",
  date_to: "2026-06-18",
  overall: {
    median_pence: 45_000_000,
    p10_pence: 25_700_000,
    p90_pence: 64_300_000,
    count: 60,
    latest_date: "2025-12-15",
  },
  flat: { median_pence: 30_000_000, count: 30, latest_date: "2025-12-15" },
  house: { median_pence: 60_000_000, count: 30, latest_date: "2025-12-15" },
};

describe("buildAreaDetail", () => {
  it("converts pence to integer pounds for every segment", () => {
    const d = buildAreaDetail(base);
    expect(d.overall.median).toBe(450_000);
    expect(d.overall.p10).toBe(257_000);
    expect(d.overall.p90).toBe(643_000);
    expect(d.flat.median).toBe(300_000);
    expect(d.house.median).toBe(600_000);
  });

  it("grades confidence per segment from transaction count", () => {
    const d = buildAreaDetail(base);
    expect(d.overall.confidence).toBe("High"); // 60
    expect(d.flat.confidence).toBe("High"); // 30
    expect(d.house.confidence).toBe("High"); // 30
  });

  it("maps a null median to null pounds and Insufficient confidence (never 0)", () => {
    const raw: RawAreaDetail = {
      ...base,
      flat: { median_pence: null, count: 0, latest_date: null },
    };
    const d = buildAreaDetail(raw);
    expect(d.flat.median).toBeNull();
    expect(d.flat.transaction_count).toBe(0);
    expect(d.flat.confidence).toBe("Insufficient");
    expect(d.flat.latest_transaction_date).toBeNull();
  });

  it("classifies confidence bands at the boundaries", () => {
    const mk = (count: number): RawAreaDetail => ({
      ...base,
      house: { median_pence: 60_000_000, count, latest_date: "2025-12-15" },
    });
    expect(buildAreaDetail(mk(29)).house.confidence).toBe("Medium");
    expect(buildAreaDetail(mk(10)).house.confidence).toBe("Medium");
    expect(buildAreaDetail(mk(9)).house.confidence).toBe("Low");
    expect(buildAreaDetail(mk(5)).house.confidence).toBe("Low");
    expect(buildAreaDetail(mk(4)).house.confidence).toBe("Insufficient");
  });

  it("passes through identifiers and the date window", () => {
    const d = buildAreaDetail(base);
    expect(d.area_id).toBe("ZZS01");
    expect(d.geography_level).toBe("lsoa");
    expect(d.date_from).toBe("2023-06-18");
    expect(d.date_to).toBe("2026-06-18");
  });
});
