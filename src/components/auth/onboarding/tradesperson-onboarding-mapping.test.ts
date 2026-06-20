import { describe, it, expect } from "vitest";

import {
  buildProviderRow,
  type ProviderOnboardingForm,
} from "./tradesperson-onboarding-mapping";

function form(overrides: Partial<ProviderOnboardingForm> = {}): ProviderOnboardingForm {
  return {
    tradeCategories: [],
    qualifications: "",
    insuranceNumber: "",
    companyNumber: "",
    accreditations: [],
    responseTime: "24h",
    ...overrides,
  };
}

describe("buildProviderRow", () => {
  it("maps trade labels to the correct service_category enum values", () => {
    const row = buildProviderRow(
      form({ tradeCategories: ["Plumber", "Electrician", "Carpenter"] }),
    );
    expect(row.services).toEqual(["plumber", "electrician", "carpenter"]);
  });

  it("maps Surveyor to surveying and Conveyancer to conveyancing", () => {
    const row = buildProviderRow(form({ tradeCategories: ["Surveyor", "Conveyancer"] }));
    expect(row.services).toEqual(["surveying", "conveyancing"]);
  });

  it("maps Gas Engineer to plumber and de-dupes against an existing plumber", () => {
    const row = buildProviderRow(form({ tradeCategories: ["Plumber", "Gas Engineer"] }));
    expect(row.services).toEqual(["plumber"]);
  });

  it("maps Roofer and Builder to builder (de-duped)", () => {
    const row = buildProviderRow(form({ tradeCategories: ["Builder", "Roofer"] }));
    expect(row.services).toEqual(["builder"]);
  });

  it("maps Painter & Decorator to painter and Plasterer to plasterer", () => {
    const row = buildProviderRow(
      form({ tradeCategories: ["Painter & Decorator", "Plasterer"] }),
    );
    expect(row.services).toEqual(["painter", "plasterer"]);
  });

  it("falls back to [\"other\"] when no trades map", () => {
    const row = buildProviderRow(form({ tradeCategories: [] }));
    expect(row.services).toEqual(["other"]);
  });

  it("maps response time values to response_time_hours", () => {
    expect(buildProviderRow(form({ responseTime: "same_day" })).response_time_hours).toBe(4);
    expect(buildProviderRow(form({ responseTime: "24h" })).response_time_hours).toBe(24);
    expect(buildProviderRow(form({ responseTime: "48h" })).response_time_hours).toBe(48);
    expect(buildProviderRow(form({ responseTime: "1_week" })).response_time_hours).toBe(168);
  });

  it("maps a non-empty qualifications string to a sanitized array", () => {
    const row = buildProviderRow(form({ qualifications: "  NVQ Level 3  " }));
    expect(row.qualifications).toEqual(["NVQ Level 3"]);
  });

  it("maps an empty qualifications string to an empty array", () => {
    expect(buildProviderRow(form({ qualifications: "   " })).qualifications).toEqual([]);
  });

  it("maps a non-empty insurance number to insurance_details jsonb", () => {
    const row = buildProviderRow(form({ insuranceNumber: " POL-123 " }));
    expect(row.insurance_details).toEqual({ policy_number: "POL-123" });
  });

  it("maps an empty insurance number to null insurance_details", () => {
    expect(buildProviderRow(form({ insuranceNumber: "" })).insurance_details).toBeNull();
  });

  it("passes accreditations through unchanged", () => {
    const accreditations = ["Gas Safe", "NICEIC"];
    expect(buildProviderRow(form({ accreditations })).accreditations).toEqual(accreditations);
  });

  it("sets company_number only when a non-empty value is provided", () => {
    expect(buildProviderRow(form({ companyNumber: "09876543" })).company_number).toBe(
      "09876543",
    );
    expect("company_number" in buildProviderRow(form({ companyNumber: "" }))).toBe(false);
  });

  it("does not set companies_house_* fields (DB trigger owns them)", () => {
    const row = buildProviderRow(form({ companyNumber: "09876543" }));
    expect("companies_house_status" in row).toBe(false);
    expect("companies_house_verified_at" in row).toBe(false);
  });
});
