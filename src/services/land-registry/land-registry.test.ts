import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPricePaidData,
  getAreaPriceTrend,
  getPricePaidSummary,
} from "./land-registry";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

/**
 * Creates a Supabase-like query chain that is both chainable and thenable.
 */
function createQueryChain(data: unknown[] | null, error: unknown = null) {
  const result = { data, error };
  const chain: Record<string, unknown> = {};

  const methods = ["select", "eq", "gte", "lte", "ilike", "not", "in", "order", "limit", "neq"];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  chain.then = (resolve: (val: unknown) => void, reject?: (err: unknown) => void) => {
    return Promise.resolve(result).then(resolve, reject);
  };

  return chain;
}

describe("getPricePaidData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns records filtered by postcode prefix", async () => {
    const records = [
      {
        transaction_id: "txn-1",
        price: 350000,
        date_of_transfer: "2025-06-15",
        postcode: "SW1A 1AA",
        property_type: "F",
        old_new: "N",
        duration: "L",
        paon: "10",
        saon: "Flat 2",
        street: "Downing Street",
        locality: "",
        town: "London",
        district: "Westminster",
        county: "Greater London",
        ppd_category: "A",
        record_status: "A",
      },
    ];

    mockFrom.mockImplementation(() => createQueryChain(records));

    const result = await getPricePaidData("SW1A 1AA");
    expect(result.length).toBe(1);
    expect(result[0].postcode).toBe("SW1A 1AA");
    expect(result[0].price).toBe(350000);
  });

  it("returns empty array for unknown postcode", async () => {
    mockFrom.mockImplementation(() => createQueryChain([]));

    const result = await getPricePaidData("ZZ99 9ZZ");
    expect(result).toEqual([]);
  });

  it("returns empty array on error", async () => {
    mockFrom.mockImplementation(() =>
      createQueryChain(null, { message: "DB error" }),
    );

    const result = await getPricePaidData("SW1A 1AA");
    expect(result).toEqual([]);
  });
});

describe("getAreaPriceTrend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns yearly aggregates", async () => {
    const records = [
      { price: 300000, date_of_transfer: "2023-03-15" },
      { price: 350000, date_of_transfer: "2023-07-20" },
      { price: 400000, date_of_transfer: "2024-01-10" },
      { price: 450000, date_of_transfer: "2024-06-05" },
    ];

    mockFrom.mockImplementation(() => createQueryChain(records));

    const result = await getAreaPriceTrend("SW1A 1AA");
    expect(result.length).toBe(2);

    const year2023 = result.find((t) => t.year === 2023);
    expect(year2023).toBeDefined();
    expect(year2023!.averagePrice).toBe(325000);
    expect(year2023!.transactionCount).toBe(2);

    const year2024 = result.find((t) => t.year === 2024);
    expect(year2024).toBeDefined();
    expect(year2024!.averagePrice).toBe(425000);
    expect(year2024!.transactionCount).toBe(2);
  });

  it("defaults to 5 years", async () => {
    mockFrom.mockImplementation(() => createQueryChain([]));

    await getAreaPriceTrend("E1 6AN");
    // Verify gte was called (checking the chain was used)
    const chain = mockFrom.mock.results[0].value;
    expect(chain.gte).toHaveBeenCalled();
  });

  it("returns empty array when no data", async () => {
    mockFrom.mockImplementation(() => createQueryChain([]));

    const result = await getAreaPriceTrend("ZZ99 9ZZ");
    expect(result).toEqual([]);
  });

  it("sorts results by year ascending", async () => {
    const records = [
      { price: 400000, date_of_transfer: "2024-01-10" },
      { price: 300000, date_of_transfer: "2022-03-15" },
      { price: 350000, date_of_transfer: "2023-07-20" },
    ];

    mockFrom.mockImplementation(() => createQueryChain(records));

    const result = await getAreaPriceTrend("SW1A 1AA");
    expect(result[0].year).toBeLessThan(result[result.length - 1].year);
  });
});

describe("getPricePaidSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("combines recent sales, area trend, and average price", async () => {
    const recentRecords = [
      {
        transaction_id: "txn-1",
        price: 300000,
        date_of_transfer: "2025-01-15",
        postcode: "E1 6AN",
        property_type: "F",
        old_new: "N",
        duration: "L",
        paon: "5",
        saon: "",
        street: "High Street",
        locality: "",
        town: "London",
        district: "Tower Hamlets",
        county: "Greater London",
        ppd_category: "A",
        record_status: "A",
      },
      {
        transaction_id: "txn-2",
        price: 400000,
        date_of_transfer: "2025-02-20",
        postcode: "E1 7BB",
        property_type: "T",
        old_new: "N",
        duration: "F",
        paon: "12",
        saon: "",
        street: "Commercial Road",
        locality: "",
        town: "London",
        district: "Tower Hamlets",
        county: "Greater London",
        ppd_category: "A",
        record_status: "A",
      },
    ];

    // Both getPricePaidData and getAreaPriceTrend call supabase.from
    // They run in parallel, so mockFrom will be called multiple times
    mockFrom.mockImplementation(() => createQueryChain(recentRecords));

    const result = await getPricePaidSummary("E1 6AN");
    expect(result.recentSales.length).toBe(2);
    expect(result.averagePrice).toBe(350000);
    expect(result).toHaveProperty("areaTrend");
  });

  it("returns zero average when no sales data", async () => {
    mockFrom.mockImplementation(() => createQueryChain([]));

    const result = await getPricePaidSummary("ZZ99 9ZZ");
    expect(result.recentSales).toEqual([]);
    expect(result.averagePrice).toBe(0);
  });
});
