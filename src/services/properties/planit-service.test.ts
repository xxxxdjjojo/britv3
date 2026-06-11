/**
 * Tests for planit-service.ts (TDD RED — service not yet implemented)
 *
 * Pins the contract of fetchNearbyPlanningApplications:
 *  1. Happy path — PlanIt records transformed, statuses normalised
 *     case-insensitively, sorted by start_date descending
 *  2. Links — source_url preferred, link fallback; records without a uid
 *     or any usable url are skipped
 *  3. Caching — cache hit short-circuits fetch; success writes planit:* key
 *     with 24h TTL
 *  4. 429 rate limit — returns null, writes planit:ratelimited with
 *     Retry-After TTL; existing ratelimited flag short-circuits fetch
 *  5. Timeout / errors — abort, 500, malformed JSON, schema garbage all
 *     return null without throwing
 *  6. Kill switch — PLANIT_API_KEY === "disabled" returns null, no fetch
 *  7. Request shape — planit.org.uk/api/applics/json with lat/lng/krad
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
import { fetchNearbyPlanningApplications } from "@/services/properties/planit-service";
import type { PlanningApplication } from "@/services/properties/planit-service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const LAT = 51.5074;
const LNG = -0.1278;

type PlanItRecord = Record<string, unknown>;

function makeRecord(overrides: PlanItRecord = {}): PlanItRecord {
  return {
    uid: "WEST/2025/0001",
    description: "Single storey rear extension",
    address: "1 Test Street, London SW1A 1AA",
    app_state: "Permitted",
    app_type: "Full",
    start_date: "2025-01-15",
    decided_date: "2025-03-01",
    source_url: "https://idoxpa.westminster.gov.uk/online-applications/WEST20250001",
    link: "https://www.planit.org.uk/planapplic/WEST/2025/0001/",
    distance: 0.21,
    area_name: "Westminster",
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => body,
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  // Default: cache miss everywhere (including the ratelimited flag)
  vi.mocked(getCached).mockResolvedValue(null);
  vi.mocked(setCache).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// 1. Happy path
// ---------------------------------------------------------------------------

describe("fetchNearbyPlanningApplications — happy path", () => {
  it("transforms PlanIt records, normalises statuses case-insensitively, and sorts by start_date descending", async () => {
    // Arrange — 3 records deliberately out of date order, mixed-case states
    const records = [
      makeRecord({
        uid: "A/1",
        app_state: "Permitted",
        start_date: "2025-01-15",
        decided_date: "2025-03-01",
      }),
      makeRecord({
        uid: "B/2",
        app_state: "undecided",
        start_date: "2025-06-02",
        decided_date: null,
        description: "Loft conversion with dormer",
        address: "2 Test Street, London SW1A 1AA",
        app_type: "Householder",
        distance: 0.4,
        area_name: "Camden",
        source_url: "https://council.example.gov.uk/planning/B2",
      }),
      makeRecord({
        uid: "C/3",
        app_state: "REJECTED",
        start_date: "2025-03-20",
      }),
    ];
    fetchMock.mockResolvedValue(jsonResponse({ records }));

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);

    // Sorted by start_date descending
    expect(result!.map((r) => r.reference)).toEqual(["B/2", "C/3", "A/1"]);

    // Statuses normalised case-insensitively
    expect(result!.map((r) => r.status)).toEqual([
      "Undecided",
      "Rejected",
      "Permitted",
    ]);

    // Full field mapping for one record
    const newest: PlanningApplication = result![0];
    expect(newest).toMatchObject({
      reference: "B/2",
      description: "Loft conversion with dormer",
      address: "2 Test Street, London SW1A 1AA",
      status: "Undecided",
      app_type: "Householder",
      start_date: "2025-06-02",
      decided_date: null,
      url: "https://council.example.gov.uk/planning/B2",
      distance_km: 0.4,
      authority: "Camden",
    });
  });

  it("normalises an unrecognised app_state to 'Other'", async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      jsonResponse({ records: [makeRecord({ app_state: "something weird" })] }),
    );

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result).toHaveLength(1);
    expect(result![0].status).toBe("Other");
  });
});

// ---------------------------------------------------------------------------
// 2. Links (critical)
// ---------------------------------------------------------------------------

describe("fetchNearbyPlanningApplications — links render properly", () => {
  it("uses source_url (council link) when present", async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      jsonResponse({
        records: [
          makeRecord({
            source_url: "https://council.example.gov.uk/planning/123",
            link: "https://www.planit.org.uk/planapplic/123/",
          }),
        ],
      }),
    );

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result![0].url).toBe("https://council.example.gov.uk/planning/123");
  });

  it("falls back to link when source_url is absent", async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      jsonResponse({
        records: [
          makeRecord({
            source_url: null,
            link: "https://www.planit.org.uk/planapplic/XYZ/9/",
          }),
        ],
      }),
    );

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result![0].url).toBe("https://www.planit.org.uk/planapplic/XYZ/9/");
  });

  it("every returned item has a non-empty url", async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      jsonResponse({
        records: [
          makeRecord({ uid: "A/1" }),
          makeRecord({ uid: "B/2", source_url: null }),
        ],
      }),
    );

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result!.length).toBeGreaterThan(0);
    for (const app of result!) {
      expect(typeof app.url).toBe("string");
      expect(app.url.length).toBeGreaterThan(0);
    }
  });

  it("skips records missing a uid", async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      jsonResponse({
        records: [makeRecord({ uid: null }), makeRecord({ uid: "KEEP/1" })],
      }),
    );

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result).toHaveLength(1);
    expect(result![0].reference).toBe("KEEP/1");
  });

  it("skips records with no usable url (no source_url, link, or url)", async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      jsonResponse({
        records: [
          makeRecord({ uid: "NOURL/1", source_url: null, link: null, url: null }),
          makeRecord({ uid: "KEEP/2" }),
        ],
      }),
    );

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result).toHaveLength(1);
    expect(result![0].reference).toBe("KEEP/2");
  });
});

// ---------------------------------------------------------------------------
// 3. Caching
// ---------------------------------------------------------------------------

describe("fetchNearbyPlanningApplications — caching", () => {
  it("returns the cached array without calling fetch on a cache hit", async () => {
    // Arrange
    const cached: PlanningApplication[] = [
      {
        reference: "CACHED/1",
        description: "Cached app",
        address: "1 Cache Road",
        status: "Permitted",
        app_type: "Full",
        start_date: "2025-02-01",
        decided_date: "2025-04-01",
        url: "https://council.example.gov.uk/planning/CACHED1",
        distance_km: 0.1,
        authority: "Westminster",
      },
    ];
    vi.mocked(getCached).mockImplementation(async (key: string) =>
      key === "planit:ratelimited" ? null : (cached as never),
    );

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result).toEqual(cached);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("writes the result to cache with a planit: key and 24h TTL on fetch success", async () => {
    // Arrange
    fetchMock.mockResolvedValue(jsonResponse({ records: [makeRecord()] }));

    // Act
    await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(setCache).toHaveBeenCalledWith(
      expect.stringMatching(/^planit:/),
      expect.anything(),
      86400,
    );
  });
});

// ---------------------------------------------------------------------------
// 4. 429 rate limit
// ---------------------------------------------------------------------------

describe("fetchNearbyPlanningApplications — 429 rate limiting", () => {
  it("returns null on 429 and sets planit:ratelimited with the Retry-After TTL", async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      jsonResponse({}, 429, { "Retry-After": "120" }),
    );

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result).toBeNull();
    expect(setCache).toHaveBeenCalledWith(
      "planit:ratelimited",
      expect.anything(),
      120,
    );
  });

  it("returns null without calling fetch when the ratelimited flag is cached", async () => {
    // Arrange
    vi.mocked(getCached).mockImplementation(async (key: string) =>
      key === "planit:ratelimited" ? (true as never) : null,
    );

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 5. Timeout / errors
// ---------------------------------------------------------------------------

describe("fetchNearbyPlanningApplications — timeouts and errors", () => {
  it("returns null when fetch rejects (e.g. AbortError timeout)", async () => {
    // Arrange
    const abortError = new DOMException("The operation was aborted.", "AbortError");
    fetchMock.mockRejectedValue(abortError);

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result).toBeNull();
  });

  it("returns null on a non-OK response (500)", async () => {
    // Arrange
    fetchMock.mockResolvedValue(jsonResponse({}, 500));

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result).toBeNull();
  });

  it("returns null when the body is malformed JSON (json() throws)", async () => {
    // Arrange
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => {
        throw new SyntaxError("Unexpected token < in JSON");
      },
    });

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result).toBeNull();
  });

  it("returns null when records is not an array", async () => {
    // Arrange
    fetchMock.mockResolvedValue(jsonResponse({ records: "nope" }));

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result).toBeNull();
  });

  it("returns null on a schema-garbage body", async () => {
    // Arrange
    fetchMock.mockResolvedValue(jsonResponse({ totally: "unrelated", shape: 42 }));

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6. Kill switch
// ---------------------------------------------------------------------------

describe("fetchNearbyPlanningApplications — kill switch", () => {
  it("returns null without calling fetch when PLANIT_API_KEY is 'disabled'", async () => {
    // Arrange
    vi.stubEnv("PLANIT_API_KEY", "disabled");

    // Act
    const result = await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 7. Request shape
// ---------------------------------------------------------------------------

describe("fetchNearbyPlanningApplications — request shape", () => {
  it("calls the PlanIt applics JSON endpoint with lat, lng, and krad query params", async () => {
    // Arrange
    fetchMock.mockResolvedValue(jsonResponse({ records: [makeRecord()] }));

    // Act
    await fetchNearbyPlanningApplications(LAT, LNG);

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestedUrl).toContain("planit.org.uk/api/applics/json");

    const parsed = new URL(requestedUrl);
    expect(parsed.searchParams.get("lat")).toBe(String(LAT));
    expect(parsed.searchParams.get("lng")).toBe(String(LNG));
    expect(parsed.searchParams.get("krad")).toBe("0.5");
  });
});
