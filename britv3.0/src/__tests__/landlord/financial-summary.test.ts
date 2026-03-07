import { describe, it, expect } from "vitest";
import { resolvePeriodPreset } from "@/services/landlord/financial-service";

describe("resolvePeriodPreset", () => {
  it("resolves this_month to start of current month", () => {
    const { start, end } = resolvePeriodPreset("this_month");
    const now = new Date();
    const expectedStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    expect(start).toBe(expectedStart);
    expect(end).toBe(now.toISOString().slice(0, 10));
  });

  it("resolves this_quarter to start of current quarter", () => {
    const { start } = resolvePeriodPreset("this_quarter");
    const now = new Date();
    const quarterStart = Math.floor(now.getMonth() / 3) * 3;
    const expectedStart = new Date(now.getFullYear(), quarterStart, 1)
      .toISOString()
      .slice(0, 10);
    expect(start).toBe(expectedStart);
  });

  it("resolves ytd to January 1st of current year", () => {
    const { start } = resolvePeriodPreset("ytd");
    const now = new Date();
    const expectedStart = new Date(now.getFullYear(), 0, 1)
      .toISOString()
      .slice(0, 10);
    expect(start).toBe(expectedStart);
  });

  it("resolves last_12_months to 12 months ago", () => {
    const { start, end } = resolvePeriodPreset("last_12_months");
    const now = new Date();
    const past = new Date(
      now.getFullYear(),
      now.getMonth() - 12,
      now.getDate(),
    );
    expect(start).toBe(past.toISOString().slice(0, 10));
    expect(end).toBe(now.toISOString().slice(0, 10));
  });

  it("defaults unknown preset to current month", () => {
    const { start } = resolvePeriodPreset("unknown_preset");
    const now = new Date();
    const expectedStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    expect(start).toBe(expectedStart);
  });
});

describe("GBP currency formatting", () => {
  const gbpFormatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  it("formats positive income correctly", () => {
    expect(gbpFormatter.format(1200)).toMatch(/1,200/);
  });

  it("formats zero correctly", () => {
    expect(gbpFormatter.format(0)).toMatch(/0/);
  });

  it("formats negative net income correctly", () => {
    const formatted = gbpFormatter.format(-500);
    expect(formatted).toMatch(/500/);
  });

  it("formats large amounts with commas", () => {
    expect(gbpFormatter.format(25000)).toMatch(/25,000/);
  });
});
