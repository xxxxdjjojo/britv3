import { describe, it, expect } from "vitest";
import {
  rfqCreateSchema,
  rfqGuestCreateSchema,
} from "@/lib/validators/marketplace-schemas";

const VALID_BASE = {
  service_category: "plumber",
  title: "Fix leaking kitchen tap",
  description:
    "The kitchen mixer tap has been dripping constantly for a week and the base is now leaking into the cupboard below.",
  property_postcode: "SW1A 1AA",
  urgency_level: "normal",
  target_provider_id: "123e4567-e89b-12d3-a456-426614174000",
  source: "trader_profile_modal",
};

describe("rfqGuestCreateSchema", () => {
  it("accepts a valid guest submission with contact details", () => {
    const result = rfqGuestCreateSchema.safeParse({
      ...VALID_BASE,
      contact_name: "Jane Smith",
      contact_email: "jane@example.com",
      contact_phone: "+44 7700 900000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a guest submission without an email", () => {
    const result = rfqGuestCreateSchema.safeParse({
      ...VALID_BASE,
      contact_name: "Jane Smith",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = rfqGuestCreateSchema.safeParse({
      ...VALID_BASE,
      contact_name: "Jane Smith",
      contact_email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("still enforces base RFQ rules (budget ordering)", () => {
    const result = rfqGuestCreateSchema.safeParse({
      ...VALID_BASE,
      contact_name: "Jane Smith",
      contact_email: "jane@example.com",
      budget_min: 500,
      budget_max: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe("rfqCreateSchema (unchanged behaviour)", () => {
  it("still accepts a valid authed submission", () => {
    expect(rfqCreateSchema.safeParse(VALID_BASE).success).toBe(true);
  });
});
