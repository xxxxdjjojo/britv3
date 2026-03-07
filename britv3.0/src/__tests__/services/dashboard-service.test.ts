import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../mocks/supabase";
import {
  createMockDashboardData,
  createMockActivityLogEntry,
} from "../fixtures/dashboard";

// Mock redis module -- must come before imports that use it
const mockGetCached = vi.fn();
const mockSetCache = vi.fn();
const mockInvalidateCache = vi.fn();

vi.mock("@/lib/cache/redis", () => ({
  getCached: (...args: unknown[]) => mockGetCached(...args),
  setCache: (...args: unknown[]) => mockSetCache(...args),
  invalidateCache: (...args: unknown[]) => mockInvalidateCache(...args),
}));

import {
  getDashboardData,
  invalidateDashboardCache,
  getActivityLog,
  logActivity,
} from "@/services/dashboard/dashboard-service";

describe("dashboard-service", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // getDashboardData -- cache hit
  // -------------------------------------------------------------------------

  describe("getDashboardData - cache hit", () => {
    it("returns cached data without DB query when cache is populated", async () => {
      const cachedData = createMockDashboardData("homebuyer");
      mockGetCached.mockResolvedValue(cachedData);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getDashboardData(mockClient as any, "user-1", "homebuyer");

      expect(result.cached).toBe(true);
      expect(result.data).toEqual(cachedData);

      // Should NOT have called supabase.from (no DB query)
      expect(mockClient.from).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // getDashboardData -- cache miss
  // -------------------------------------------------------------------------

  describe("getDashboardData - cache miss", () => {
    it("queries DB and sets cache with 300s TTL on cache miss", async () => {
      mockGetCached.mockResolvedValue(null);
      mockSetCache.mockResolvedValue(undefined);

      // Mock the from() builder to return empty data for all tables
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn((resolve: (val: { data: null; error: null; count: number }) => void) =>
          resolve({ data: null, error: null, count: 0 }),
        ),
      };
      mockClient.from.mockReturnValue(mockBuilder);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getDashboardData(mockClient as any, "user-1", "homebuyer");

      expect(result.cached).toBe(false);
      expect(result.data.role).toBe("homebuyer");

      // Should have queried the database
      expect(mockClient.from).toHaveBeenCalled();

      // Should have set cache with 300s TTL
      expect(mockSetCache).toHaveBeenCalledWith(
        "dashboard:user-1",
        expect.objectContaining({ role: "homebuyer" }),
        300,
      );
    });
  });

  // -------------------------------------------------------------------------
  // getDashboardData -- role-specific shapes
  // -------------------------------------------------------------------------

  describe("getDashboardData - role-specific data", () => {
    beforeEach(() => {
      mockGetCached.mockResolvedValue(null);
      mockSetCache.mockResolvedValue(undefined);

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn((resolve: (val: { data: null; error: null; count: number }) => void) =>
          resolve({ data: null, error: null, count: 0 }),
        ),
      };
      mockClient.from.mockReturnValue(mockBuilder);
    });

    it("returns homebuyer-shaped data for homebuyer role", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getDashboardData(mockClient as any, "user-1", "homebuyer");

      expect(result.data.role).toBe("homebuyer");
      if (result.data.role === "homebuyer") {
        expect(result.data).toHaveProperty("saved_properties_count");
        expect(result.data).toHaveProperty("active_searches_count");
        expect(result.data).toHaveProperty("upcoming_viewings");
        expect(result.data).toHaveProperty("recent_activity");
      }
    });

    it("returns provider-shaped data for service_provider role", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getDashboardData(mockClient as any, "user-1", "service_provider");

      expect(result.data.role).toBe("service_provider");
      if (result.data.role === "service_provider") {
        expect(result.data).toHaveProperty("verification_status");
        expect(result.data).toHaveProperty("active_jobs_count");
        expect(result.data).toHaveProperty("average_rating");
        expect(result.data).toHaveProperty("total_earnings");
        expect(result.data).toHaveProperty("pending_quotes_count");
        expect(result.data).toHaveProperty("recent_activity");
      }
    });
  });

  // -------------------------------------------------------------------------
  // invalidateDashboardCache
  // -------------------------------------------------------------------------

  describe("invalidateDashboardCache", () => {
    it("calls Redis del with correct key pattern", async () => {
      mockInvalidateCache.mockResolvedValue(undefined);

      await invalidateDashboardCache("user-42");

      expect(mockInvalidateCache).toHaveBeenCalledWith("dashboard:user-42");
    });
  });

  // -------------------------------------------------------------------------
  // getActivityLog
  // -------------------------------------------------------------------------

  describe("getActivityLog", () => {
    it("returns paginated entries with nextCursor when more exist", async () => {
      const entries = Array.from({ length: 21 }, (_, i) =>
        createMockActivityLogEntry({
          id: i + 1,
          created_at: new Date(`2026-01-${String(20 - i).padStart(2, "0")}T10:00:00Z`),
        }),
      );

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: (val: { data: typeof entries; error: null }) => void) =>
          resolve({ data: entries, error: null }),
        ),
      };
      mockClient.from.mockReturnValue(mockBuilder);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getActivityLog(mockClient as any, "user-1");

      // Should return exactly 20 entries (default limit), not 21
      expect(result.entries).toHaveLength(20);
      // Should have a nextCursor since there were more entries
      expect(result.nextCursor).not.toBeNull();
    });

    it("returns entries before cursor date when cursor is provided", async () => {
      const entries = [
        createMockActivityLogEntry({
          id: 5,
          created_at: new Date("2026-01-14T10:00:00Z"),
        }),
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: (val: { data: typeof entries; error: null }) => void) =>
          resolve({ data: entries, error: null }),
        ),
      };
      mockClient.from.mockReturnValue(mockBuilder);

      const cursor = "2026-01-15T10:00:00Z";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getActivityLog(mockClient as any, "user-1", cursor);

      expect(result.entries).toHaveLength(1);
      // lt should have been called with the cursor
      expect(mockBuilder.lt).toHaveBeenCalledWith("created_at", cursor);
      // No more entries, so nextCursor should be null
      expect(result.nextCursor).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // logActivity
  // -------------------------------------------------------------------------

  describe("logActivity", () => {
    it("inserts a single row into activity_log", async () => {
      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: (val: { data: null; error: null }) => void) =>
          resolve({ data: null, error: null }),
        ),
      };
      mockClient.from.mockReturnValue(mockBuilder);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await logActivity(mockClient as any, "user-1", "property_saved", "Saved a property", {
        property_id: "prop-001",
      });

      expect(mockClient.from).toHaveBeenCalledWith("activity_log");
      expect(mockBuilder.insert).toHaveBeenCalledWith({
        user_id: "user-1",
        event_type: "property_saved",
        description: "Saved a property",
        metadata: { property_id: "prop-001" },
      });
    });
  });
});
