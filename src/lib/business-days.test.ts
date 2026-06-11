/**
 * Tests for business-days (TDD RED — module not yet implemented)
 *
 * Pins the contract of @/lib/business-days:
 *  1. getEnglandWalesBankHolidays(): Promise<string[]> ("YYYY-MM-DD")
 *     - Upstash cache hit (getCached) short-circuits fetch
 *     - cache miss → fetches https://www.gov.uk/bank-holidays.json,
 *       extracts england-and-wales dates only, caches for 7 days (604800s)
 *     - fetch failure / non-OK → falls back to the bundled snapshot
 *       (non-empty string[] of ISO dates), never throws
 *  2. addBusinessDays(date, days, holidays): Date — PURE and synchronous,
 *     holidays injected; skips Saturdays, Sundays, and provided holidays.
 *     All date maths is UTC-based (assertions use toISOString()).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/cache/redis", () => ({
  getCached: vi.fn(),
  setCache: vi.fn().mockResolvedValue(undefined),
}));

import { getCached, setCache } from "@/lib/cache/redis";
import {
  getEnglandWalesBankHolidays,
  addBusinessDays,
} from "@/lib/business-days";

// ---------------------------------------------------------------------------
// Fixtures & helpers
// ---------------------------------------------------------------------------

const SEVEN_DAYS_SECONDS = 604800;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Build a Date at UTC midnight from "YYYY-MM-DD". */
const utc = (isoDate: string): Date => new Date(`${isoDate}T00:00:00.000Z`);

/** Extract the UTC calendar date from a Date. */
const iso = (d: Date): string => d.toISOString().slice(0, 10);

function govUkResponse(ewDates: string[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      "england-and-wales": {
        division: "england-and-wales",
        events: ewDates.map((date) => ({
          title: "Bank holiday",
          date,
          notes: "",
          bunting: true,
        })),
      },
      scotland: {
        division: "scotland",
        events: [
          { title: "St Andrew's Day", date: "2026-11-30", notes: "", bunting: true },
        ],
      },
      "northern-ireland": {
        division: "northern-ireland",
        events: [
          { title: "St Patrick's Day", date: "2026-03-17", notes: "", bunting: true },
        ],
      },
    }),
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  // Default: cache miss
  vi.mocked(getCached).mockResolvedValue(null);
  vi.mocked(setCache).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// 1. getEnglandWalesBankHolidays — caching
// ---------------------------------------------------------------------------

describe("getEnglandWalesBankHolidays — caching", () => {
  it("returns the cached dates without calling fetch on a cache hit", async () => {
    // Arrange
    const cached = ["2026-12-25", "2026-12-28"];
    vi.mocked(getCached).mockResolvedValue(cached as never);

    // Act
    const result = await getEnglandWalesBankHolidays();

    // Assert
    expect(result).toEqual(cached);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches gov.uk bank-holidays.json on a cache miss", async () => {
    // Arrange
    fetchMock.mockResolvedValue(govUkResponse(["2026-12-25", "2026-12-28"]));

    // Act
    await getEnglandWalesBankHolidays();

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestedUrl).toContain("gov.uk/bank-holidays.json");
  });

  it("extracts only england-and-wales dates from the payload", async () => {
    // Arrange
    fetchMock.mockResolvedValue(govUkResponse(["2026-12-25", "2026-12-28"]));

    // Act
    const result = await getEnglandWalesBankHolidays();

    // Assert
    expect(result).toEqual(["2026-12-25", "2026-12-28"]);
    // Scotland / NI dates must not leak in
    expect(result).not.toContain("2026-11-30");
    expect(result).not.toContain("2026-03-17");
  });

  it("caches the fetched dates with a 7-day TTL (604800 seconds)", async () => {
    // Arrange
    fetchMock.mockResolvedValue(govUkResponse(["2026-12-25"]));

    // Act
    await getEnglandWalesBankHolidays();

    // Assert
    expect(setCache).toHaveBeenCalledWith(
      expect.any(String),
      expect.anything(),
      SEVEN_DAYS_SECONDS,
    );
  });
});

// ---------------------------------------------------------------------------
// 2. getEnglandWalesBankHolidays — snapshot fallback
// ---------------------------------------------------------------------------

describe("getEnglandWalesBankHolidays — bundled snapshot fallback", () => {
  it("falls back to the bundled snapshot when fetch rejects", async () => {
    // Arrange
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    // Act
    const result = await getEnglandWalesBankHolidays();

    // Assert — non-empty array of ISO date strings, no throw
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    for (const date of result) {
      expect(date).toMatch(ISO_DATE_RE);
    }
  });

  it("falls back to the bundled snapshot on a non-OK response (500)", async () => {
    // Arrange
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    // Act
    const result = await getEnglandWalesBankHolidays();

    // Assert
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    for (const date of result) {
      expect(date).toMatch(ISO_DATE_RE);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. addBusinessDays — pure, sync, holidays injected
// ---------------------------------------------------------------------------

describe("addBusinessDays", () => {
  it("Fri 2026-06-12 + 5 business days (no holidays) → Fri 2026-06-19", () => {
    // Arrange
    const start = utc("2026-06-12");

    // Act
    const result = addBusinessDays(start, 5, []);

    // Assert
    expect(iso(result)).toBe("2026-06-19");
  });

  it("skips weekends: Thu 2026-06-11 + 2 → Mon 2026-06-15", () => {
    // Arrange
    const start = utc("2026-06-11");

    // Act
    const result = addBusinessDays(start, 2, []);

    // Assert
    expect(iso(result)).toBe("2026-06-15");
  });

  it("skips injected holidays: Mon 2026-08-24 + 1 with ['2026-08-25'] → Wed 2026-08-26", () => {
    // Arrange
    const start = utc("2026-08-24");

    // Act
    const result = addBusinessDays(start, 1, ["2026-08-25"]);

    // Assert
    expect(iso(result)).toBe("2026-08-26");
  });

  it("Christmas span: Wed 2026-12-23 + 5 with ['2026-12-25','2026-12-28'] → Fri 2027-01-01", () => {
    // Arrange — only the injected holidays count (pure function):
    // Thu 24 (1), Fri 25 holiday, Sat 26/Sun 27 weekend, Mon 28 holiday,
    // Tue 29 (2), Wed 30 (3), Thu 31 (4), Fri 2027-01-01 (5).
    const start = utc("2026-12-23");

    // Act
    const result = addBusinessDays(start, 5, ["2026-12-25", "2026-12-28"]);

    // Assert
    expect(iso(result)).toBe("2027-01-01");
  });

  it("+0 returns the same calendar day", () => {
    // Arrange
    const start = utc("2026-06-12");

    // Act
    const result = addBusinessDays(start, 0, ["2026-06-12"]);

    // Assert
    expect(iso(result)).toBe("2026-06-12");
  });

  it("throws on negative days", () => {
    // Arrange
    const start = utc("2026-06-12");

    // Act + Assert
    expect(() => addBusinessDays(start, -1, [])).toThrow();
  });

  it("is pure — does not mutate the input date", () => {
    // Arrange
    const start = utc("2026-06-12");
    const before = start.getTime();

    // Act
    addBusinessDays(start, 5, ["2026-06-15"]);

    // Assert
    expect(start.getTime()).toBe(before);
  });
});
