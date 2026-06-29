import { describe, expect, test } from "vitest";
import { developmentLeadSchema } from "./lead-schema";

const VALID_UUID = "b0000000-0000-0000-0000-000000000001";

function base(overrides: Record<string, unknown> = {}) {
  return {
    developmentId: VALID_UUID,
    leadType: "register_interest",
    name: "Jane Buyer",
    email: "jane@example.com",
    ...overrides,
  };
}

describe("developmentLeadSchema", () => {
  test("accepts a minimal valid lead", () => {
    const result = developmentLeadSchema.safeParse(base());
    expect(result.success).toBe(true);
  });

  test("rejects a missing name", () => {
    const result = developmentLeadSchema.safeParse(base({ name: "" }));
    expect(result.success).toBe(false);
  });

  test("rejects an invalid email", () => {
    const result = developmentLeadSchema.safeParse(base({ email: "not-an-email" }));
    expect(result.success).toBe(false);
  });

  test("rejects a non-uuid development id", () => {
    const result = developmentLeadSchema.safeParse(base({ developmentId: "dev-1" }));
    expect(result.success).toBe(false);
  });

  test("rejects an unknown lead type", () => {
    const result = developmentLeadSchema.safeParse(base({ leadType: "spam" }));
    expect(result.success).toBe(false);
  });

  test("coerces a numeric budget string", () => {
    const result = developmentLeadSchema.safeParse(base({ budget: "350000" }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.budget).toBe(350000);
  });

  test("accepts full qualification + utm payload", () => {
    const result = developmentLeadSchema.safeParse(
      base({
        leadType: "book_viewing",
        phone: "07700900000",
        buyerStatus: "first_time_buyer",
        budget: 320000,
        mortgagePosition: "agreement_in_principle",
        hasPropertyToSell: true,
        preferredPlot: "P03",
        sourceRoute: "/new-homes/edgbaston-gardens",
        utm: { source: "google", medium: "cpc" },
      }),
    );
    expect(result.success).toBe(true);
  });
});
