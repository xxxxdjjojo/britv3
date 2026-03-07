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
  initializeConsent,
  getConsent,
  updateConsent,
} from "@/services/gdpr/consent-service";

describe("consent-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initializeConsent", () => {
    it("creates consent records for all 3 types", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            { id: "1", consent_type: "marketing", granted: true },
            { id: "2", consent_type: "analytics", granted: false },
            { id: "3", consent_type: "third_party", granted: false },
          ],
          error: null,
        }),
      });
      mockFrom.mockReturnValue({ insert: mockInsert });

      const result = await initializeConsent(
        "user-123",
        { marketing: true, analytics: false, third_party: false },
        "127.0.0.1",
        "Mozilla/5.0",
      );

      expect(mockFrom).toHaveBeenCalledWith("consent_records");
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(3);
    });

    it("passes ip_address and user_agent for audit compliance", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      mockFrom.mockReturnValue({ insert: mockInsert });

      await initializeConsent(
        "user-123",
        { marketing: true, analytics: true, third_party: false },
        "192.168.1.1",
        "TestAgent",
      );

      const insertedRows = mockInsert.mock.calls[0][0];
      expect(insertedRows).toHaveLength(3);
      expect(insertedRows[0]).toMatchObject({
        ip_address: "192.168.1.1",
        user_agent: "TestAgent",
      });
    });
  });

  describe("getConsent", () => {
    it("returns all consent records for user", async () => {
      const mockRecords = [
        { id: "1", user_id: "user-123", consent_type: "marketing", granted: true },
        { id: "2", user_id: "user-123", consent_type: "analytics", granted: false },
        { id: "3", user_id: "user-123", consent_type: "third_party", granted: false },
      ];

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
        }),
      });

      const result = await getConsent("user-123");

      expect(result.data).toHaveLength(3);
      expect(result.error).toBeNull();
    });
  });

  describe("updateConsent", () => {
    it("upserts consent record correctly", async () => {
      const mockUpsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "1", consent_type: "marketing", granted: false },
            error: null,
          }),
        }),
      });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const result = await updateConsent(
        "user-123",
        "marketing",
        false,
        "127.0.0.1",
        "Mozilla/5.0",
      );

      expect(mockUpsert).toHaveBeenCalled();
      const upsertData = mockUpsert.mock.calls[0][0];
      expect(upsertData).toMatchObject({
        user_id: "user-123",
        consent_type: "marketing",
        granted: false,
        ip_address: "127.0.0.1",
        user_agent: "Mozilla/5.0",
      });
      expect(result.error).toBeNull();
    });
  });
});
