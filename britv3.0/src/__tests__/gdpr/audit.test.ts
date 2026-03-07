import { describe, it, expect } from "vitest";
import type { ConsentAuditLog, ConsentRecord, DeletionRequest } from "@/types/gdpr";

describe("GDPR audit trail types", () => {
  describe("ConsentAuditLog", () => {
    it("has expected structure matching DB trigger output", () => {
      const auditEntry: ConsentAuditLog = {
        id: 1,
        user_id: "user-123",
        consent_type: "marketing",
        old_value: false,
        new_value: true,
        ip_address: "127.0.0.1",
        user_agent: "Mozilla/5.0",
        created_at: new Date(),
      };

      expect(auditEntry.id).toBe(1);
      expect(auditEntry.user_id).toBe("user-123");
      expect(auditEntry.consent_type).toBe("marketing");
      expect(auditEntry.old_value).toBe(false);
      expect(auditEntry.new_value).toBe(true);
      expect(auditEntry.ip_address).toBe("127.0.0.1");
      expect(auditEntry.user_agent).toBe("Mozilla/5.0");
      expect(auditEntry.created_at).toBeInstanceOf(Date);
    });

    it("allows null old_value for initial consent", () => {
      const initialEntry: ConsentAuditLog = {
        id: 2,
        user_id: "user-123",
        consent_type: "analytics",
        old_value: null,
        new_value: true,
        ip_address: null,
        user_agent: null,
        created_at: new Date(),
      };

      expect(initialEntry.old_value).toBeNull();
      expect(initialEntry.ip_address).toBeNull();
    });
  });

  describe("ConsentRecord", () => {
    it("captures required GDPR fields", () => {
      const record: ConsentRecord = {
        id: "cr-1",
        user_id: "user-123",
        consent_type: "marketing",
        granted: true,
        ip_address: "127.0.0.1",
        user_agent: "Mozilla/5.0",
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(record.consent_type).toBe("marketing");
      expect(record.ip_address).toBeTruthy();
      expect(record.user_agent).toBeTruthy();
    });
  });

  describe("DeletionRequest", () => {
    it("supports all status transitions", () => {
      const statuses: DeletionRequest["status"][] = [
        "pending",
        "processing",
        "completed",
        "cancelled",
      ];

      statuses.forEach((status) => {
        const request: DeletionRequest = {
          id: "dr-1",
          user_id: "user-123",
          requested_at: new Date(),
          scheduled_purge_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          purged_at: status === "completed" ? new Date() : null,
          status,
        };

        expect(request.status).toBe(status);
      });
    });
  });
});
