import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { limitMock } = vi.hoisted(() => ({
  limitMock: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: () => ({ limit: limitMock }),
}));

vi.mock("@/services/reports/reality-gap-service", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getRealityGapEdition: vi.fn(),
}));

import { getRealityGapEdition } from "@/services/reports/reality-gap-service";
import { GET } from "@/app/api/reports/reality-gap/csv/route";

const mockGet = vi.mocked(getRealityGapEdition);

function csvRequest(query = ""): NextRequest {
  return new NextRequest(`http://localhost/api/reports/reality-gap/csv${query}`);
}

function row(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

describe("GET /api/reports/reality-gap/csv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    limitMock.mockResolvedValue({ success: true });
  });

  it("streams only non-suppressed rows with the edition-named filename", async () => {
    mockGet.mockResolvedValue({
      edition: null,
      period: "2026-Q2",
      availablePeriods: ["2026-Q2"],
      rows: [
        row(),
        row({
          areaLevel: "district",
          areaId: "thin",
          areaName: "Thin District",
          propertyType: "all",
          suppressed: true,
          visible: false,
        }),
      ],
    } as never);

    const response = await GET(csvRequest("?edition=2026-Q2"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="truedeed-reality-gap-2026-Q2.csv"',
    );

    const body = await response.text();
    expect(body).toContain('"uk"');
    expect(body).not.toContain("Thin District");
    // header + exactly one published row
    expect(body.trim().split("\r\n")).toHaveLength(2);
    expect(mockGet).toHaveBeenCalledWith("2026-Q2");
  });

  it("returns 429 when the rate limit trips", async () => {
    limitMock.mockResolvedValue({ success: false });
    const response = await GET(csvRequest());
    expect(response.status).toBe(429);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed edition", async () => {
    const response = await GET(csvRequest("?edition=DROP%20TABLE"));
    expect(response.status).toBe(400);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("returns 404 when the edition has no rows", async () => {
    mockGet.mockResolvedValue({
      edition: null,
      period: null,
      availablePeriods: [],
      rows: [],
    } as never);
    const response = await GET(csvRequest("?edition=2031-Q1"));
    expect(response.status).toBe(404);
  });
});
