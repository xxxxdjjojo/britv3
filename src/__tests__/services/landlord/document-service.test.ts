/**
 * Test stubs for document-service covering LD-06 compliance summary.
 * These are Wave 0 stubs — implementation ships in plan 14-06.
 */
import { describe, it } from "vitest";

describe("document-service", () => {
  describe("getComplianceSummary", () => {
    it.todo("returns documents grouped as expired / expiring_soon / valid");
    it.todo("expiring_soon = expiry_date within 30 days from today");
    it.todo("expired = expiry_date before today");
  });
});
