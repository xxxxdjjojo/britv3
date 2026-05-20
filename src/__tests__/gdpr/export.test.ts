import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAdminFrom } = vi.hoisted(() => ({
  mockAdminFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: mockAdminFrom,
  }),
}));

import { exportUserData } from "@/services/gdpr/export-service";

describe("export-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exportUserData", () => {
    it("returns correct JSON structure with all user tables", async () => {
      const tableData: Record<string, unknown> = {
        profiles: { display_name: "Test User" },
        user_roles: [{ role: "homebuyer" }],
        consent_records: [{ consent_type: "marketing", granted: true }],
        consent_audit_log: [{ consent_type: "marketing", old_value: false, new_value: true }],
        auth_audit_log: [{ event_type: "login" }],
        provider_verifications: [],
        deletion_requests: [],
      };

      mockAdminFrom.mockImplementation((table: string) => {
        const data = tableData[table];
        const isArray = Array.isArray(data);
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(() => {
              if (isArray) {
                return Promise.resolve({ data, error: null });
              }
              return {
                single: vi.fn().mockResolvedValue({ data, error: null }),
              };
            }),
            // conversations query uses .select(...).or(...) — return a
            // thenable resolving to the array result for the table.
            or: vi.fn().mockResolvedValue({ data: isArray ? data : [], error: null }),
            single: vi.fn().mockResolvedValue({ data: isArray ? null : data, error: null }),
          }),
        };
      });

      const result = await exportUserData("user-123");

      expect(result).toHaveProperty("exported_at");
      expect(result).toHaveProperty("user_id", "user-123");
      expect(result).toHaveProperty("profile");
      expect(result).toHaveProperty("roles");
      expect(result).toHaveProperty("consent");
      expect(result).toHaveProperty("consent_history");
      expect(result).toHaveProperty("auth_events");
      expect(result).toHaveProperty("verifications");
      expect(result).toHaveProperty("deletion_requests");
    });

    it("handles user with no data gracefully", async () => {
      mockAdminFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: (resolve: (v: { data: never[]; error: null }) => void) =>
              resolve({ data: [], error: null }),
          }),
          // conversations query uses .select(...).or(...)
          or: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      const result = await exportUserData("user-empty");

      expect(result.user_id).toBe("user-empty");
      expect(result.roles).toEqual([]);
      expect(result.consent).toEqual([]);
    });
  });
});
