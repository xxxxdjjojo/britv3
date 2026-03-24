import { describe, it, expect, vi, afterEach } from "vitest";
import {
  scoreActionItems,
  type ActionItemInput,
  type ScoredActionItem,
} from "@/services/landlord/action-items-service";

describe("scoreActionItems", () => {
  afterEach(() => vi.useRealTimers());

  it("returns empty array when no issues exist", () => {
    const result = scoreActionItems({
      overdueRents: [],
      expiringCompliance: [],
      endingTenancies: [],
      openMaintenance: [],
    });
    expect(result).toEqual([]);
  });

  it("ranks expired compliance above late rent", () => {
    vi.useFakeTimers({ now: new Date("2026-03-15T00:00:00Z") });
    const result = scoreActionItems({
      overdueRents: [
        { tenantName: "J Smith", propertyAddress: "1 Oak St", amount: 950, daysDue: 3, propertyId: "p1" },
      ],
      expiringCompliance: [
        { category: "gas_safety", propertyAddress: "2 Elm Rd", daysUntilExpiry: -5, propertyId: "p2" },
      ],
      endingTenancies: [],
      openMaintenance: [],
    });
    expect(result[0].type).toBe("compliance");
    expect(result[1].type).toBe("arrears");
  });

  it("returns max 5 items sorted by priority", () => {
    const result = scoreActionItems({
      overdueRents: Array.from({ length: 10 }, (_, i) => ({
        tenantName: `Tenant ${i}`, propertyAddress: `Addr ${i}`,
        amount: 800 + i * 50, daysDue: i + 1, propertyId: `p${i}`,
      })),
      expiringCompliance: [],
      endingTenancies: [],
      openMaintenance: [],
    });
    expect(result.length).toBeLessThanOrEqual(5);
    // Highest daysDue should be first (most overdue = highest priority)
    expect(result[0].daysDue).toBeGreaterThanOrEqual(result[1].daysDue ?? 0);
  });

  it("includes emergency maintenance as highest priority", () => {
    const result = scoreActionItems({
      overdueRents: [
        { tenantName: "J Smith", propertyAddress: "1 Oak St", amount: 950, daysDue: 3, propertyId: "p1" },
      ],
      expiringCompliance: [],
      endingTenancies: [],
      openMaintenance: [
        { title: "Boiler failure", propertyAddress: "3 Birch Cl", priority: "emergency", propertyId: "p3", requestId: "r1" },
      ],
    });
    expect(result[0].type).toBe("maintenance");
  });

  it("includes tenancy ending within 60 days", () => {
    vi.useFakeTimers({ now: new Date("2026-03-01T00:00:00Z") });
    const result = scoreActionItems({
      overdueRents: [],
      expiringCompliance: [],
      endingTenancies: [
        { tenantName: "A Jones", propertyAddress: "4 Pine Ave", daysUntilEnd: 45, propertyId: "p4", tenancyId: "t1", currentRent: 1000 },
      ],
      openMaintenance: [],
    });
    expect(result[0].type).toBe("tenancy");
  });
});
