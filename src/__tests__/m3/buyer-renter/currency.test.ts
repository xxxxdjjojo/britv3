/**
 * M3-A8 — Currency conversion helpers.
 *
 * The AI-match preferences form converts GBP <-> pence at its boundary
 * (gbpToPence / penceToGBP from "@/lib/currency"). These pure helpers are the
 * deterministic piece of that form's logic.
 */

import { describe, it, expect } from "vitest";

import { penceToGBP, gbpToPence } from "@/lib/currency";

describe("penceToGBP", () => {
  it("converts a pence integer to a GBP float", () => {
    expect(penceToGBP(125_000)).toBe(1_250);
  });

  it("preserves sub-pound precision", () => {
    expect(penceToGBP(125_050)).toBe(1_250.5);
  });

  it("maps zero to zero", () => {
    expect(penceToGBP(0)).toBe(0);
  });
});

describe("gbpToPence", () => {
  it("converts a GBP float to a pence integer", () => {
    expect(gbpToPence(1_250.5)).toBe(125_050);
  });

  it("rounds to the nearest pence (no floating-point drift)", () => {
    expect(gbpToPence(19.99)).toBe(1_999);
    expect(gbpToPence(0.1 + 0.2)).toBe(30); // 0.30000000000000004 → 30
  });

  it("maps zero to zero", () => {
    expect(gbpToPence(0)).toBe(0);
  });
});

describe("round-trip", () => {
  it("gbpToPence ∘ penceToGBP is the identity for whole pence", () => {
    for (const pence of [0, 1, 999, 125_000, 5_000_000]) {
      expect(gbpToPence(penceToGBP(pence))).toBe(pence);
    }
  });
});
