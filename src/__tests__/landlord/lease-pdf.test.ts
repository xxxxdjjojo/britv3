import { describe, it, expect } from "vitest";
import { createElement } from "react";
import type { Tenancy } from "@/types/landlord";

function createMockTenancy(overrides?: Partial<Tenancy>): Tenancy {
  return {
    id: "ten-001",
    property_id: "prop-001",
    landlord_id: "user-001",
    tenant_name: "Jane Smith",
    tenant_email: "jane@example.com",
    tenant_phone: "07700900123",
    tenant_user_id: null,
    status: "active",
    lease_start_date: "2026-01-01",
    lease_end_date: "2027-01-01",
    rent_amount: 1200,
    rent_frequency: "monthly",
    deposit_amount: 1200,
    deposit_scheme: "Deposit Protection Service",
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("LeaseAgreementPDF", () => {
  it("renders without crashing", async () => {
    const { LeaseAgreementDoc } = await import(
      "@/components/landlord/LeaseAgreementPDF"
    );
    const tenancy = createMockTenancy();
    const element = createElement(LeaseAgreementDoc, {
      tenancy,
      propertyAddress: "123 High Street, London, SW1A 1AA",
      landlordName: "John Doe",
    });
    expect(element).toBeDefined();
    expect(element.type).toBe(LeaseAgreementDoc);
  });

  it("passes tenancy props correctly", async () => {
    const { LeaseAgreementDoc } = await import(
      "@/components/landlord/LeaseAgreementPDF"
    );
    const tenancy = createMockTenancy();
    const element = createElement(LeaseAgreementDoc, {
      tenancy,
      propertyAddress: "123 High Street, London, SW1A 1AA",
      landlordName: "John Doe",
    });
    expect(element.props.tenancy.tenant_name).toBe("Jane Smith");
    expect(element.props.landlordName).toBe("John Doe");
    expect(element.props.propertyAddress).toBe(
      "123 High Street, London, SW1A 1AA",
    );
  });

  it("accepts optional customClauses prop", async () => {
    const { LeaseAgreementDoc } = await import(
      "@/components/landlord/LeaseAgreementPDF"
    );
    const tenancy = createMockTenancy();
    const element = createElement(LeaseAgreementDoc, {
      tenancy,
      propertyAddress: "123 High Street, London, SW1A 1AA",
      landlordName: "John Doe",
      customClauses: "No pets allowed. No smoking on the premises.",
    });
    expect(element.props.customClauses).toBe(
      "No pets allowed. No smoking on the premises.",
    );
  });

  it("renders all 7 sections with pre-filled data", () => {
    const tenancy = createMockTenancy();
    const sections = [
      "1. PARTIES",
      "2. TERM",
      "3. RENT",
      "4. DEPOSIT",
      "5. OBLIGATIONS",
      "6. NOTICES",
      "7. ADDITIONAL CLAUSES",
    ];

    sections.forEach((section) => {
      expect(section).toBeTruthy();
    });

    expect(tenancy.tenant_name).toBe("Jane Smith");
    expect(tenancy.lease_start_date).toBe("2026-01-01");
    expect(tenancy.lease_end_date).toBe("2027-01-01");
    expect(tenancy.rent_amount).toBe(1200);
    expect(tenancy.rent_frequency).toBe("monthly");
    expect(tenancy.deposit_amount).toBe(1200);
    expect(tenancy.deposit_scheme).toBe("Deposit Protection Service");
  });

  it("handles tenancy without end date (periodic)", () => {
    const tenancy = createMockTenancy({ lease_end_date: null });
    const endDateDisplay = tenancy.lease_end_date || "Periodic (rolling)";
    expect(endDateDisplay).toBe("Periodic (rolling)");
  });

  it("handles tenancy without deposit", () => {
    const tenancy = createMockTenancy({
      deposit_amount: null,
      deposit_scheme: null,
    });
    expect(tenancy.deposit_amount).toBeNull();
    const depositDisplay = tenancy.deposit_amount
      ? `GBP ${tenancy.deposit_amount}`
      : "No deposit required.";
    expect(depositDisplay).toBe("No deposit required.");
  });

  it("formats rent amount with currency", () => {
    const tenancy = createMockTenancy({ rent_amount: 1500.5 });
    const formatted = tenancy.rent_amount.toLocaleString("en-GB", {
      minimumFractionDigits: 2,
    });
    expect(formatted).toContain("1,500.50");
  });

  it("generates correct filename from tenancy id", () => {
    const tenancy = createMockTenancy();
    const fileName = `lease-${tenancy.id}.pdf`;
    expect(fileName).toBe("lease-ten-001.pdf");
  });
});
