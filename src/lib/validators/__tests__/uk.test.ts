import { describe, it, expect } from "vitest";
import {
  validateCompaniesHouseNumber,
  validateUTR,
  validateUKPhone,
  validatePostcodeDistrict,
  normalizePostcodeDistrict,
  validateVATNumber,
} from "../uk";

describe("validateCompaniesHouseNumber", () => {
  it("accepts valid 8-digit numbers", () => {
    expect(validateCompaniesHouseNumber("01234567")).toBe(true);
  });
  it("accepts Scottish companies (SC prefix)", () => {
    expect(validateCompaniesHouseNumber("SC123456")).toBe(true);
  });
  it("accepts NI companies", () => {
    expect(validateCompaniesHouseNumber("NI012345")).toBe(true);
  });
  it("accepts LLPs (OC prefix)", () => {
    expect(validateCompaniesHouseNumber("OC123456")).toBe(true);
  });
  it("normalizes lowercase to uppercase", () => {
    expect(validateCompaniesHouseNumber("sc123456")).toBe(true);
  });
  it("rejects 7 characters", () => {
    expect(validateCompaniesHouseNumber("1234567")).toBe(false);
  });
  it("rejects 9 characters", () => {
    expect(validateCompaniesHouseNumber("123456789")).toBe(false);
  });
  it("rejects empty string", () => {
    expect(validateCompaniesHouseNumber("")).toBe(false);
  });
  it("rejects special characters", () => {
    expect(validateCompaniesHouseNumber("0123-567")).toBe(false);
  });
});

describe("validateUTR", () => {
  it("accepts valid 10-digit UTR", () => {
    expect(validateUTR("1234567890")).toBe(true);
  });
  it("rejects 9 digits", () => {
    expect(validateUTR("123456789")).toBe(false);
  });
  it("rejects letters", () => {
    expect(validateUTR("12345678AB")).toBe(false);
  });
  it("rejects empty", () => {
    expect(validateUTR("")).toBe(false);
  });
  it("strips spaces", () => {
    expect(validateUTR("12345 67890")).toBe(true);
  });
});

describe("validateUKPhone", () => {
  it("accepts +44 format", () => {
    expect(validateUKPhone("+447911123456")).toBe(true);
  });
  it("accepts 07 format", () => {
    expect(validateUKPhone("07911123456")).toBe(true);
  });
  it("accepts landline", () => {
    expect(validateUKPhone("02012345678")).toBe(true);
  });
  it("rejects US numbers", () => {
    expect(validateUKPhone("+12125551234")).toBe(false);
  });
  it("rejects empty", () => {
    expect(validateUKPhone("")).toBe(false);
  });
});

describe("validatePostcodeDistrict", () => {
  it("accepts SW1", () => {
    expect(validatePostcodeDistrict("SW1")).toBe(true);
  });
  it("accepts M14", () => {
    expect(validatePostcodeDistrict("M14")).toBe(true);
  });
  it("accepts EC1", () => {
    expect(validatePostcodeDistrict("EC1")).toBe(true);
  });
  it("accepts B1", () => {
    expect(validatePostcodeDistrict("B1")).toBe(true);
  });
  it("rejects full postcodes", () => {
    expect(validatePostcodeDistrict("SW1A 1AA")).toBe(false);
  });
  it("rejects empty", () => {
    expect(validatePostcodeDistrict("")).toBe(false);
  });
});

describe("normalizePostcodeDistrict", () => {
  it("uppercases", () => {
    expect(normalizePostcodeDistrict("sw1")).toBe("SW1");
  });
  it("extracts district from full postcode", () => {
    expect(normalizePostcodeDistrict("SW1A 1AA")).toBe("SW1A");
  });
  it("trims whitespace", () => {
    expect(normalizePostcodeDistrict(" M14 ")).toBe("M14");
  });
});

describe("validateVATNumber", () => {
  it("accepts GB format", () => {
    expect(validateVATNumber("GB123456789")).toBe(true);
  });
  it("accepts without prefix", () => {
    expect(validateVATNumber("123456789")).toBe(true);
  });
  it("rejects too short", () => {
    expect(validateVATNumber("12345")).toBe(false);
  });
});
