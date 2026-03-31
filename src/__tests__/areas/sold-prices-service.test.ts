/**
 * TDD tests for src/services/areas/sold-prices-service.ts
 *
 * Tests the Supabase-backed sold prices service layer:
 * - getAreaSoldPrices
 * - getPropertySoldPrice
 * - getSoldPriceStats
 * - searchSoldPrices
 * - getRegionalAverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";
import type { SoldPriceRecord, SoldPriceDetail } from "@/types/areas";

// ---------------------------------------------------------------------------
// Mock Supabase server client
// ---------------------------------------------------------------------------

const mockClient = createMockSupabaseClient();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => mockClient),
}));

// ---------------------------------------------------------------------------
// Import service under test (after mocks are wired)
// ---------------------------------------------------------------------------

import {
  getAreaSoldPrices,
  getPropertySoldPrice,
  getSoldPriceStats,
  searchSoldPrices,
  getRegionalAverage,
} from "@/services/areas/sold-prices-service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSoldPriceRow(overrides: Partial<SoldPriceRecord> = {}): SoldPriceRecord {
  return {
    id: "sp-001",
    slug: "14-south-street-tw7-7bg",
    address: "14 South Street",
    postcode: "TW7 7BG",
    propertyType: "T",
    propertyTypeLabel: "Terraced",
    beds: 3,
    price: 485000,
    priceFormatted: "\u00A3485,000",
    date: "2026-01-15",
    dateFormatted: "15 Jan 2026",
    oldNew: "N",
    tenure: "F",
    tenureLabel: "Freehold",
    vsAsking: -2,
    areaSlug: "isleworth",
    ...overrides,
  };
}

function makeSoldPriceDetail(overrides: Partial<SoldPriceDetail> = {}): SoldPriceDetail {
  return {
    address: "14 South Street",
    postcode: "TW7 7BG",
    propertyType: "Terraced",
    lastPrice: 485000,
    lastDate: "2026-01-15",
    growth: "+3.2%",
    estimatedValue: "\u00A3500,000",
    coordinates: { lat: 51.468, lng: -0.325 },
    history: [
      { price: 485000, date: "2026-01-15", change: "+3.2%" },
      { price: 470000, date: "2023-06-10", change: null },
    ],
    nearby: [
      { address: "16 South Street", price: "\u00A3495,000", date: "2025-11-03", slug: "16-south-street-tw7-7bg" },
    ],
    areaSlug: "isleworth",
    areaName: "Isleworth",
    areaGrowth: "+2.8%",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helpers to configure the mock query chain
// ---------------------------------------------------------------------------

type ChainResult = { data: unknown; error: unknown; count?: number | null };

function configureFromChain(result: ChainResult) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: vi.fn((resolve: (v: ChainResult) => void) => resolve(result)),
  };
  mockClient.from.mockReturnValue(chain);
  return chain;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sold-prices-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // getAreaSoldPrices
  // -------------------------------------------------------------------------

  describe("getAreaSoldPrices", () => {
    it("returns SoldPriceRecord[] sorted by date DESC for a known area", async () => {
      const older = makeSoldPriceRow({ id: "sp-002", date: "2025-06-01" });
      const newer = makeSoldPriceRow({ id: "sp-001", date: "2026-01-15" });
      configureFromChain({ data: [newer, older], error: null });

      const result = await getAreaSoldPrices("isleworth");

      // Should return records
      expect(result.records).toHaveLength(2);
      // First record should be the most recent
      expect(result.records[0].date).toBe("2026-01-15");
      expect(result.records[1].date).toBe("2025-06-01");

      // Should have queried via supabase
      expect(mockClient.from).toHaveBeenCalled();
    });

    it("returns empty array for unknown area", async () => {
      configureFromChain({ data: [], error: null });

      const result = await getAreaSoldPrices("unknown-area");

      expect(result.records).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("each record matches the SoldPriceRecord shape", async () => {
      const record = makeSoldPriceRow();
      configureFromChain({ data: [record], error: null });

      const result = await getAreaSoldPrices("isleworth");
      const first = result.records[0];

      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("slug");
      expect(first).toHaveProperty("address");
      expect(first).toHaveProperty("postcode");
      expect(first).toHaveProperty("propertyType");
      expect(first).toHaveProperty("propertyTypeLabel");
      expect(first).toHaveProperty("beds");
      expect(first).toHaveProperty("price");
      expect(first).toHaveProperty("priceFormatted");
      expect(first).toHaveProperty("date");
      expect(first).toHaveProperty("dateFormatted");
      expect(first).toHaveProperty("oldNew");
      expect(first).toHaveProperty("tenure");
      expect(first).toHaveProperty("tenureLabel");
      expect(first).toHaveProperty("areaSlug");
    });
  });

  // -------------------------------------------------------------------------
  // getPropertySoldPrice
  // -------------------------------------------------------------------------

  describe("getPropertySoldPrice", () => {
    it("returns SoldPriceDetail with history for a known slug", async () => {
      const detail = makeSoldPriceDetail();
      configureFromChain({ data: detail, error: null });

      const result = await getPropertySoldPrice("14-south-street-tw7-7bg");

      expect(result).not.toBeNull();
      expect(result!.address).toBe("14 South Street");
      expect(result!.postcode).toBe("TW7 7BG");
      expect(result!.lastPrice).toBe(485000);
      expect(result!.history).toHaveLength(2);
      expect(result!.history[0].price).toBe(485000);
      expect(result!.nearby).toHaveLength(1);
    });

    it("returns null for nonexistent slug", async () => {
      configureFromChain({ data: null, error: null });

      const result = await getPropertySoldPrice("nonexistent");

      expect(result).toBeNull();
    });

    it("detail includes coordinates and area context", async () => {
      const detail = makeSoldPriceDetail();
      configureFromChain({ data: detail, error: null });

      const result = await getPropertySoldPrice("14-south-street-tw7-7bg");

      expect(result).not.toBeNull();
      expect(result!.coordinates).toEqual({ lat: 51.468, lng: -0.325 });
      expect(result!.areaSlug).toBe("isleworth");
      expect(result!.areaName).toBe("Isleworth");
      expect(result!.areaGrowth).toBe("+2.8%");
    });
  });

  // -------------------------------------------------------------------------
  // getSoldPriceStats
  // -------------------------------------------------------------------------

  describe("getSoldPriceStats", () => {
    it("returns stats with avgPrice, totalTransactions, yoyChange, avgVsAsking", async () => {
      const stats = {
        avgPrice: 520000,
        totalTransactions: 142,
        yoyChange: 3.2,
        avgVsAsking: -2.1,
      };
      mockClient.rpc.mockResolvedValue({ data: stats, error: null });

      const result = await getSoldPriceStats("isleworth");

      expect(result).toEqual(
        expect.objectContaining({
          avgPrice: expect.any(Number),
          totalTransactions: expect.any(Number),
          yoyChange: expect.any(Number),
          avgVsAsking: expect.any(Number),
        }),
      );
      expect(result.avgPrice).toBe(520000);
      expect(result.totalTransactions).toBe(142);
    });

    it("returns zeroed stats for an empty area", async () => {
      const zeroStats = {
        avgPrice: 0,
        totalTransactions: 0,
        yoyChange: 0,
        avgVsAsking: 0,
      };
      mockClient.rpc.mockResolvedValue({ data: zeroStats, error: null });

      const result = await getSoldPriceStats("empty-area");

      expect(result.avgPrice).toBe(0);
      expect(result.totalTransactions).toBe(0);
      expect(result.yoyChange).toBe(0);
      expect(result.avgVsAsking).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // searchSoldPrices
  // -------------------------------------------------------------------------

  describe("searchSoldPrices", () => {
    it("returns matching records for a postcode prefix like SW1A", async () => {
      const records = [
        makeSoldPriceRow({ id: "sp-100", postcode: "SW1A 1AA", address: "10 Downing Street" }),
        makeSoldPriceRow({ id: "sp-101", postcode: "SW1A 2PW", address: "Buckingham Palace" }),
      ];
      configureFromChain({ data: records, error: null });

      const result = await searchSoldPrices("SW1A");

      expect(result.records).toHaveLength(2);
      expect(result.records[0].postcode).toContain("SW1A");
    });

    it("returns empty array for empty query string", async () => {
      const result = await searchSoldPrices("");

      expect(result).toEqual({ records: [], total: 0 });
      // Should not query the database for empty search
      expect(mockClient.from).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // getRegionalAverage
  // -------------------------------------------------------------------------

  describe("getRegionalAverage", () => {
    it("returns yearly averages for a valid postcode prefix and property type", async () => {
      const averages = [
        { year: 2024, avgPrice: 480000 },
        { year: 2025, avgPrice: 510000 },
        { year: 2026, avgPrice: 520000 },
      ];
      mockClient.rpc.mockResolvedValue({ data: averages, error: null });

      const result = await getRegionalAverage("SW1A", "F");

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty("year");
      expect(result[0]).toHaveProperty("avgPrice");
      expect(result[0].year).toBe(2024);
    });

    it("returns empty array for unknown postcode prefix", async () => {
      mockClient.rpc.mockResolvedValue({ data: [], error: null });

      const result = await getRegionalAverage("XX99");

      expect(result).toEqual([]);
    });
  });
});
