import { describe, it, expect } from "vitest";
import { tenancySchema } from "@/types/landlord";

/**
 * Unit tests for tenancy form validation using the Zod schema.
 */

describe("tenancySchema validation", () => {
  it("should accept valid complete tenancy data", () => {
    const result = tenancySchema.safeParse({
      tenant_name: "John Smith",
      tenant_email: "john@example.com",
      tenant_phone: "07700 900000",
      lease_start_date: "2026-01-01",
      lease_end_date: "2027-01-01",
      rent_amount: 1200,
      rent_frequency: "monthly",
      deposit_amount: 1200,
      deposit_scheme: "DPS",
      notes: "First tenancy",
    });
    expect(result.success).toBe(true);
  });

  it("should accept minimal required fields only", () => {
    const result = tenancySchema.safeParse({
      tenant_name: "Jane Doe",
      lease_start_date: "2026-06-01",
      rent_amount: 800,
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing tenant_name", () => {
    const result = tenancySchema.safeParse({
      lease_start_date: "2026-01-01",
      rent_amount: 1200,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const names = result.error.issues.map((i) => i.path[0]);
      expect(names).toContain("tenant_name");
    }
  });

  it("should reject empty tenant_name", () => {
    const result = tenancySchema.safeParse({
      tenant_name: "",
      lease_start_date: "2026-01-01",
      rent_amount: 1200,
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing lease_start_date", () => {
    const result = tenancySchema.safeParse({
      tenant_name: "John",
      rent_amount: 1200,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const names = result.error.issues.map((i) => i.path[0]);
      expect(names).toContain("lease_start_date");
    }
  });

  it("should reject invalid email format", () => {
    const result = tenancySchema.safeParse({
      tenant_name: "John",
      tenant_email: "not-an-email",
      lease_start_date: "2026-01-01",
      rent_amount: 1200,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path[0] === "tenant_email");
      expect(emailIssue).toBeDefined();
    }
  });

  it("should accept empty email string", () => {
    const result = tenancySchema.safeParse({
      tenant_name: "John",
      tenant_email: "",
      lease_start_date: "2026-01-01",
      rent_amount: 1200,
    });
    expect(result.success).toBe(true);
  });

  it("should reject zero rent amount", () => {
    const result = tenancySchema.safeParse({
      tenant_name: "John",
      lease_start_date: "2026-01-01",
      rent_amount: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative rent amount", () => {
    const result = tenancySchema.safeParse({
      tenant_name: "John",
      lease_start_date: "2026-01-01",
      rent_amount: -500,
    });
    expect(result.success).toBe(false);
  });

  it("should coerce string rent amount to number", () => {
    const result = tenancySchema.safeParse({
      tenant_name: "John",
      lease_start_date: "2026-01-01",
      rent_amount: "1200",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rent_amount).toBe(1200);
      expect(typeof result.data.rent_amount).toBe("number");
    }
  });

  it("should default rent_frequency to monthly", () => {
    const result = tenancySchema.safeParse({
      tenant_name: "John",
      lease_start_date: "2026-01-01",
      rent_amount: 1200,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rent_frequency).toBe("monthly");
    }
  });

  it("should accept weekly rent_frequency", () => {
    const result = tenancySchema.safeParse({
      tenant_name: "John",
      lease_start_date: "2026-01-01",
      rent_amount: 300,
      rent_frequency: "weekly",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid rent_frequency", () => {
    const result = tenancySchema.safeParse({
      tenant_name: "John",
      lease_start_date: "2026-01-01",
      rent_amount: 1200,
      rent_frequency: "daily",
    });
    expect(result.success).toBe(false);
  });

  it("should accept non-negative deposit_amount of 0", () => {
    const result = tenancySchema.safeParse({
      tenant_name: "John",
      lease_start_date: "2026-01-01",
      rent_amount: 1200,
      deposit_amount: 0,
    });
    expect(result.success).toBe(true);
  });
});
