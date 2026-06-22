/**
 * Tests for rent affordability calculator.
 * @vitest-environment node
 */

import { describe, it, expect } from "vitest";
import {
  calculateRentAffordability,
  validateAffordabilityInput,
} from "@/lib/properties/rent-affordability";

describe("calculateRentAffordability", () => {
  it("returns 30% of take-home for zero debt/outgoings", () => {
    const result = calculateRentAffordability({
      monthlyTakeHome: 3000,
      essentialOutgoings: 0,
      existingDebt: 0,
    });
    expect(result.maxRent).toBe(900); // 30% of 3000
  });

  it("reduces max rent for existing debt", () => {
    const result = calculateRentAffordability({
      monthlyTakeHome: 3000,
      essentialOutgoings: 0,
      existingDebt: 400,
    });
    // 30% of 3000 = 900; debt reduction = 400 * 0.75 = 300
    expect(result.maxRent).toBe(600);
  });

  it("clamps to zero when debt exceeds benchmark", () => {
    const result = calculateRentAffordability({
      monthlyTakeHome: 1000,
      essentialOutgoings: 0,
      existingDebt: 1000,
    });
    expect(result.maxRent).toBe(0);
  });

  it("calculates weekly equivalent", () => {
    const result = calculateRentAffordability({
      monthlyTakeHome: 3000,
      essentialOutgoings: 0,
      existingDebt: 0,
    });
    expect(result.maxRentWeekly).toBeCloseTo(207.69, 1); // 900 / 4.333
  });

  it("calculates ratio as percentage of take-home", () => {
    const result = calculateRentAffordability({
      monthlyTakeHome: 3000,
      essentialOutgoings: 0,
      existingDebt: 0,
    });
    expect(result.ratio).toBe(30); // 900/3000 * 100
  });

  it("flags stretched when ratio exceeds 35%", () => {
    // Low income → 30% is a high proportion
    const result = calculateRentAffordability({
      monthlyTakeHome: 1000,
      essentialOutgoings: 0,
      existingDebt: 0,
    });
    // maxRent = 300, ratio = 30%, not stretched
    expect(result.isStretched).toBe(false);
  });

  it("calculates recommended deposit as 5 weeks rent", () => {
    const result = calculateRentAffordability({
      monthlyTakeHome: 3000,
      essentialOutgoings: 0,
      existingDebt: 0,
    });
    // 5 weeks = 900 / 4.333 * 5 ≈ 1038
    expect(result.recommendedDeposit).toBeCloseTo(1038, -1);
  });

  it("calculates recommended holding deposit as 1 week rent", () => {
    const result = calculateRentAffordability({
      monthlyTakeHome: 3000,
      essentialOutgoings: 0,
      existingDebt: 0,
    });
    // 1 week = 900 / 4.333 ≈ 207
    expect(result.recommendedHoldingDeposit).toBeCloseTo(207, -1);
  });

  it("handles zero take-home gracefully", () => {
    const result = calculateRentAffordability({
      monthlyTakeHome: 0,
      essentialOutgoings: 0,
      existingDebt: 0,
    });
    expect(result.maxRent).toBe(0);
    expect(result.ratio).toBe(0);
    expect(result.isStretched).toBe(false);
  });

  it("calculates disposable income after rent and commitments", () => {
    const result = calculateRentAffordability({
      monthlyTakeHome: 3000,
      essentialOutgoings: 600,
      existingDebt: 200,
    });
    // maxRent = 900 - 150 = 750
    // disposable = 3000 - 750 - 600 - 200 = 1450
    expect(result.maxRent).toBe(750);
    expect(result.disposableAfterRent).toBe(1450);
  });
});

describe("validateAffordabilityInput", () => {
  it("returns no errors for valid positive inputs", () => {
    const errors = validateAffordabilityInput({
      monthlyTakeHome: 3000,
      essentialOutgoings: 600,
      existingDebt: 200,
    });
    expect(errors.monthlyTakeHome).toBe("");
    expect(errors.essentialOutgoings).toBe("");
    expect(errors.existingDebt).toBe("");
  });

  it("errors on missing take-home", () => {
    const errors = validateAffordabilityInput({});
    expect(errors.monthlyTakeHome).toBe("Enter your monthly take-home pay");
  });

  it("errors on zero take-home", () => {
    const errors = validateAffordabilityInput({ monthlyTakeHome: 0 });
    expect(errors.monthlyTakeHome).toBe("Income must be greater than zero");
  });

  it("errors on negative take-home", () => {
    const errors = validateAffordabilityInput({ monthlyTakeHome: -500 });
    expect(errors.monthlyTakeHome).toBe("Income cannot be negative");
  });

  it("errors on negative outgoings", () => {
    const errors = validateAffordabilityInput({
      monthlyTakeHome: 3000,
      essentialOutgoings: -100,
    });
    expect(errors.essentialOutgoings).toBe("Outgoings cannot be negative");
  });

  it("errors on negative debt", () => {
    const errors = validateAffordabilityInput({
      monthlyTakeHome: 3000,
      existingDebt: -50,
    });
    expect(errors.existingDebt).toBe("Debt cannot be negative");
  });
});
