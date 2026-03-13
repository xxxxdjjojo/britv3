/**
 * Test stubs for portfolio-service covering LD-01 KPI aggregation.
 * These are Wave 0 stubs — implementation ships in plan 14-02.
 */
import { describe, it } from "vitest";

describe("portfolio-service", () => {
  describe("getPortfolioKPIs", () => {
    it.todo("returns correct property count, occupancy rate and monthly rent");
    it.todo(
      "returns compliance_alerts count for documents expiring within 30 days",
    );
    it.todo(
      "returns open_maintenance count from maintenance_requests with open status",
    );
    it.todo("throws authentication error when user is not authenticated");
  });
});
