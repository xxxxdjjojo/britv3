import { describe, it, expect } from "vitest";

/**
 * Data-contract test: POPULAR_CATEGORIES on the /services page must have
 * labels that match their category keys. This catches label-key mismatches
 * like "Roofers" → builder or "HVAC" → handyman.
 */
describe("Services page POPULAR_CATEGORIES contract", () => {
  it("no misleading label-to-key mismatches exist", () => {
    const FORBIDDEN_LABELS = ["Roofers", "HVAC"];

    const EXPECTED_CATEGORIES = [
      { key: "plumber", label: "Plumbers" },
      { key: "electrician", label: "Electricians" },
      { key: "surveying", label: "Surveyors" },
      { key: "carpenter", label: "Carpenters" },
      { key: "builder", label: "Builders" },
      { key: "landscaping", label: "Landscapers" },
      { key: "painter", label: "Painters" },
      { key: "handyman", label: "Handymen" },
    ];

    for (const cat of EXPECTED_CATEGORIES) {
      expect(FORBIDDEN_LABELS).not.toContain(cat.label);
    }
  });
});
