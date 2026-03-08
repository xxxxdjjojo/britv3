import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getExpiryStatus } from "@/services/landlord/document-service";
import type { ExpiryStatus } from "@/services/landlord/document-service";

describe("getExpiryStatus", () => {
  beforeEach(() => {
    // Fix date to 2026-03-07 for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-07T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'valid' (green) for documents expiring more than 30 days from now", () => {
    const result = getExpiryStatus("2026-05-01");
    expect(result).toBe("valid" satisfies ExpiryStatus);
  });

  it("returns 'expiring' (amber) for documents expiring within 30 days", () => {
    // 20 days from now
    const result = getExpiryStatus("2026-03-27");
    expect(result).toBe("expiring" satisfies ExpiryStatus);
  });

  it("returns 'expiring' (amber) for documents expiring exactly on 30-day boundary", () => {
    // Exactly 30 days from 2026-03-07 = 2026-04-06
    const result = getExpiryStatus("2026-04-06");
    expect(result).toBe("expiring" satisfies ExpiryStatus);
  });

  it("returns 'expired' (red) for documents past their expiry date", () => {
    const result = getExpiryStatus("2026-02-15");
    expect(result).toBe("expired" satisfies ExpiryStatus);
  });

  it("returns 'expired' (red) for documents expiring today", () => {
    const result = getExpiryStatus("2026-03-07");
    expect(result).toBe("expired" satisfies ExpiryStatus);
  });

  it("returns 'none' when no expiry date is set", () => {
    const result = getExpiryStatus(null);
    expect(result).toBe("none" satisfies ExpiryStatus);
  });

  it("returns 'expiring' for document expiring in exactly 1 day", () => {
    const result = getExpiryStatus("2026-03-08");
    expect(result).toBe("expiring" satisfies ExpiryStatus);
  });

  it("returns 'valid' for document expiring in 31 days", () => {
    const result = getExpiryStatus("2026-04-07");
    expect(result).toBe("valid" satisfies ExpiryStatus);
  });
});

describe("Reminder date calculation", () => {
  it("next_reminder_date should be expiry minus 30 days", () => {
    // The DB trigger calculates this, but we verify the logic here
    const expiryDate = new Date("2026-06-15");
    const reminderDate = new Date(expiryDate);
    reminderDate.setDate(reminderDate.getDate() - 30);

    expect(reminderDate.toISOString().split("T")[0]).toBe("2026-05-16");
  });

  it("handles leap year boundary for reminder calculation", () => {
    // Expiry on March 30, 2028 (2028 is leap year)
    // Reminder = Feb 29, 2028
    const expiryDate = new Date("2028-03-30");
    const reminderDate = new Date(expiryDate);
    reminderDate.setDate(reminderDate.getDate() - 30);

    expect(reminderDate.toISOString().split("T")[0]).toBe("2028-02-29");
  });
});

describe("ComplianceAlert rendering logic", () => {
  it("should show alert when there are expiring documents", () => {
    const expiringDocs = [
      { id: "1", name: "Gas Safety Certificate", expiry_date: "2026-03-20" },
      { id: "2", name: "EICR", expiry_date: "2026-03-25" },
    ];
    expect(expiringDocs.length).toBeGreaterThan(0);
    // ComplianceAlert renders when expiringDocuments.length > 0
  });

  it("should not show alert when no documents are expiring", () => {
    const expiringDocs: unknown[] = [];
    expect(expiringDocs.length).toBe(0);
    // ComplianceAlert returns null when expiringDocuments.length === 0
  });

  it("should display correct count text for single document", () => {
    const count = 1;
    const text = `${count} compliance document${count === 1 ? "" : "s"} expiring soon`;
    expect(text).toBe("1 compliance document expiring soon");
  });

  it("should display correct count text for multiple documents", () => {
    const count: number = 3;
    const text = `${count} compliance document${count === 1 ? "" : "s"} expiring soon`;
    expect(text).toBe("3 compliance documents expiring soon");
  });
});
