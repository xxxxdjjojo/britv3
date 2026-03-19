import { describe, it, expect } from "vitest";
import { sanitizeAiInput } from "@/lib/ai/sanitize";

describe("sanitizeAiInput", () => {
  it("strips control characters except newlines and tabs", () => {
    const input = "Hello\x00World\x01\nNew line\tTabbed";
    const result = sanitizeAiInput(input);
    expect(result).toBe("HelloWorld\nNew line\tTabbed");
  });

  it("trims input to max length", () => {
    const input = "a".repeat(20_000);
    const result = sanitizeAiInput(input, { maxLength: 10_000 });
    expect(result.length).toBe(10_000);
  });

  it("uses default max length of 10000", () => {
    const input = "a".repeat(15_000);
    const result = sanitizeAiInput(input);
    expect(result.length).toBe(10_000);
  });

  it("passes through clean input unchanged", () => {
    const input = "Generate a quote for plumbing repair in London";
    expect(sanitizeAiInput(input)).toBe(input);
  });

  it("strips null bytes from JSON-embedded strings", () => {
    const input = JSON.stringify({ description: "Fix\x00 the\x00 sink" });
    const result = sanitizeAiInput(input);
    expect(result).toBe(JSON.stringify({ description: "Fix the sink" }));
  });
});

import { QuoteDraftSchema, AgentProposalSchema } from "@/lib/ai/schemas";

describe("QuoteDraftSchema", () => {
  it("validates correct quote draft", () => {
    const valid = {
      line_items: [{ description: "Fix sink", amount: 150 }],
      total: 150,
      estimated_duration: "2 hours",
      scope_of_work: "Replace kitchen sink tap and seal joints",
    };
    expect(QuoteDraftSchema.parse(valid)).toEqual(valid);
  });

  it("rejects quote with negative amount", () => {
    const invalid = {
      line_items: [{ description: "Fix sink", amount: -150 }],
      total: -150,
      estimated_duration: "2 hours",
      scope_of_work: "Fix",
    };
    expect(() => QuoteDraftSchema.parse(invalid)).toThrow();
  });

  it("rejects quote with empty line items", () => {
    const invalid = {
      line_items: [],
      total: 0,
      estimated_duration: "2 hours",
      scope_of_work: "Fix",
    };
    expect(() => QuoteDraftSchema.parse(invalid)).toThrow();
  });
});

describe("AgentProposalSchema", () => {
  it("validates correct proposal", () => {
    const valid = {
      valuation_range: { low: 250000, high: 300000 },
      comparable_properties: [{ address: "1 Test St", price: 275000, date: "2026-01-15" }],
      marketing_strategy: "Premium listing on all portals",
      fee_structure: "1.5% + VAT",
    };
    expect(AgentProposalSchema.parse(valid)).toEqual(valid);
  });

  it("rejects proposal with invalid date format", () => {
    const invalid = {
      valuation_range: { low: 250000, high: 300000 },
      comparable_properties: [{ address: "1 Test St", price: 275000, date: "January 2026" }],
      marketing_strategy: "Strategy",
      fee_structure: "Fee",
    };
    expect(() => AgentProposalSchema.parse(invalid)).toThrow();
  });
});
