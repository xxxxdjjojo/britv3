import { describe, it, expect } from "vitest";
import { buildAreaCard } from "./area-detail-service";

describe("buildAreaCard", () => {
  it("maps flat/house pence rows to card shape + confidence", () => {
    const card = buildAreaCard({
      flat: {
        median_price_pence: 40000000,
        p10_price_pence: 30000000,
        p90_price_pence: 55000000,
        transaction_count: 42,
        latest_transaction_date: "2026-05-01",
      },
      house: {
        median_price_pence: 70000000,
        p10_price_pence: 50000000,
        p90_price_pence: 95000000,
        transaction_count: 8,
        latest_transaction_date: "2026-04-01",
      },
    });
    expect(card.flat.median).toBe(400000);
    expect(card.flat.p10).toBe(300000);
    expect(card.flat.confidence).toBe("High");
    expect(card.flat.insufficient).toBe(false);
    expect(card.house.confidence).toBe("Low");
  });

  it("flags insufficient on count 0", () => {
    const card = buildAreaCard({
      flat: { transaction_count: 0 },
      house: { transaction_count: 0 },
    });
    expect(card.flat.insufficient).toBe(true);
    expect(card.flat.median).toBeNull();
  });
});
