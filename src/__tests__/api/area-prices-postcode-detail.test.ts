import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks (PPD service + rate limiter) — installed before the route handler
// imports its dependencies.
// ---------------------------------------------------------------------------

const { limitMock } = vi.hoisted(() => ({
  limitMock: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: () => ({ limit: limitMock }),
}));

vi.mock("@/services/truedeed/ppd-postcode-service", () => ({
  getRecentSalesForPostcode: vi.fn(),
  getSectorTrend: vi.fn(),
}));

import {
  getRecentSalesForPostcode,
  getSectorTrend,
} from "@/services/truedeed/ppd-postcode-service";
import { GET } from "@/app/api/area-prices/postcode-detail/route";

const mockRecentSales = vi.mocked(getRecentSalesForPostcode);
const mockSectorTrend = vi.mocked(getSectorTrend);

function getRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/area-prices/postcode-detail${query}`);
}

const SALE = {
  id: "{TUID-1}",
  pricePounds: 314_500,
  date: "2026-03-14",
  propertyTypeLabel: "Terraced",
  street: "12 Acacia Avenue",
  newBuild: false,
};

const TREND = {
  sector: "M1 1",
  months: [{ month: "2026-06", median: 250_000, count: 31 }],
  totalCount: 31,
  insufficient: false,
};

describe("GET /api/area-prices/postcode-detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    limitMock.mockResolvedValue({ success: true });
  });

  it("returns recent sales + trend for a valid postcode", async () => {
    mockRecentSales.mockResolvedValue([SALE]);
    mockSectorTrend.mockResolvedValue(TREND);

    const res = await GET(getRequest("?postcode=M1+1AE"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ recentSales: [SALE], trend: TREND });
    expect(mockRecentSales).toHaveBeenCalledWith("M1 1AE");
    expect(mockSectorTrend).toHaveBeenCalledWith("M1 1AE");
  });

  it("returns 400 and never queries for a missing or malformed postcode", async () => {
    const missing = await GET(getRequest(""));
    const malformed = await GET(getRequest("?postcode=not-a-postcode"));
    const outwardOnly = await GET(getRequest("?postcode=M1"));

    expect(missing.status).toBe(400);
    expect(malformed.status).toBe(400);
    expect(outwardOnly.status).toBe(400);
    expect(mockRecentSales).not.toHaveBeenCalled();
    expect(mockSectorTrend).not.toHaveBeenCalled();
  });

  it("returns 429 when rate-limited", async () => {
    limitMock.mockResolvedValueOnce({ success: false });

    const res = await GET(getRequest("?postcode=M1+1AE"));

    expect(res.status).toBe(429);
    expect(mockRecentSales).not.toHaveBeenCalled();
  });
});
