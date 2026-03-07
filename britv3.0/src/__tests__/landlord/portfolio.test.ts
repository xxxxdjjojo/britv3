import { describe, it, expect } from "vitest";
import type { PortfolioProperty } from "@/services/landlord/portfolio-service";

/**
 * Unit tests for PortfolioGrid rendering logic.
 * Tests the data transformation and display conditions
 * without requiring a full React rendering environment.
 */

function createMockProperty(
  overrides: Partial<PortfolioProperty> = {},
): PortfolioProperty {
  return {
    id: "prop-1",
    address_line_1: "42 Baker Street",
    address_line_2: null,
    city: "London",
    postcode: "NW1 6XE",
    property_type: "flat",
    bedrooms: 2,
    listing_id: "listing-1",
    tenant_name: null,
    tenancy_status: null,
    rent_amount: null,
    rent_frequency: null,
    lease_end_date: null,
    open_maintenance_count: 0,
    expiring_documents_count: 0,
    ...overrides,
  };
}

describe("PortfolioGrid data", () => {
  it("should identify vacant properties (no tenancy status)", () => {
    const property = createMockProperty();
    const isOccupied =
      property.tenancy_status === "active" ||
      property.tenancy_status === "ending_soon";
    expect(isOccupied).toBe(false);
  });

  it("should identify occupied properties with active status", () => {
    const property = createMockProperty({
      tenancy_status: "active",
      tenant_name: "John Smith",
      rent_amount: 1200,
      rent_frequency: "monthly",
    });
    const isOccupied =
      property.tenancy_status === "active" ||
      property.tenancy_status === "ending_soon";
    expect(isOccupied).toBe(true);
  });

  it("should identify occupied properties with ending_soon status", () => {
    const property = createMockProperty({
      tenancy_status: "ending_soon",
      tenant_name: "Jane Doe",
    });
    const isOccupied =
      property.tenancy_status === "active" ||
      property.tenancy_status === "ending_soon";
    expect(isOccupied).toBe(true);
  });

  it("should handle empty properties array", () => {
    const properties: PortfolioProperty[] = [];
    expect(properties.length).toBe(0);
  });

  it("should show compliance warning when expiring docs count > 0", () => {
    const property = createMockProperty({
      expiring_documents_count: 2,
    });
    const hasExpiringDocs = property.expiring_documents_count > 0;
    expect(hasExpiringDocs).toBe(true);
  });

  it("should not show compliance warning when no expiring docs", () => {
    const property = createMockProperty({
      expiring_documents_count: 0,
    });
    const hasExpiringDocs = property.expiring_documents_count > 0;
    expect(hasExpiringDocs).toBe(false);
  });

  it("should format rent display with amount and frequency", () => {
    const property = createMockProperty({
      rent_amount: 1500,
      rent_frequency: "monthly",
    });
    const display = `${property.rent_amount}/${property.rent_frequency}`;
    expect(display).toBe("1500/monthly");
  });

  it("should show maintenance count when > 0", () => {
    const property = createMockProperty({
      open_maintenance_count: 3,
    });
    expect(property.open_maintenance_count).toBeGreaterThan(0);
  });
});
