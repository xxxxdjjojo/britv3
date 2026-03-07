import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  }),
}));

import {
  createDeletionRequest,
  hasPendingDeletion,
} from "@/services/gdpr/consent-service";

describe("deletion-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDeletionRequest", () => {
    it("creates request with correct purge date (30 days)", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "del-1",
              user_id: "user-123",
              status: "pending",
              scheduled_purge_at: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000,
              ).toISOString(),
            },
            error: null,
          }),
        }),
      });
      mockFrom.mockReturnValue({ insert: mockInsert });

      const result = await createDeletionRequest("user-123");

      expect(mockFrom).toHaveBeenCalledWith("deletion_requests");
      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();

      const insertData = mockInsert.mock.calls[0][0];
      expect(insertData).toHaveProperty("user_id", "user-123");
      expect(insertData).toHaveProperty("status", "pending");
      expect(insertData).toHaveProperty("scheduled_purge_at");

      const purgeDate = new Date(insertData.scheduled_purge_at);
      const now = new Date();
      const diffDays = (purgeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(29.9);
      expect(diffDays).toBeLessThanOrEqual(30.1);
    });
  });

  describe("hasPendingDeletion", () => {
    it("prevents duplicate pending requests", async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "del-1", status: "pending" },
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await hasPendingDeletion("user-123");
      expect(result).toBe(true);
    });

    it("returns false when no pending request exists", async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await hasPendingDeletion("user-123");
      expect(result).toBe(false);
    });
  });
});
