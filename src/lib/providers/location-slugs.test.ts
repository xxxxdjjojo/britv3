import { describe, it, expect } from "vitest";
import { isLocationSlug } from "./location-slugs";

describe("isLocationSlug", () => {
  it.each([
    "london",
    "manchester",
    "birmingham",
    "south-london",
    "east-anglia",
    "north-west",
    "home-counties",
    "central-london",
  ])("returns true for known location '%s'", (slug) => {
    expect(isLocationSlug(slug)).toBe(true);
  });

  it.each([
    "premier-plumbing",
    "abc-roofing",
    "quick-fix",
    "smith-electricals",
    "bright-sparks",
    "top-notch",
    "handy-andy",
  ])("returns false for business slug '%s'", (slug) => {
    expect(isLocationSlug(slug)).toBe(false);
  });

  it("returns false for slugs with digits", () => {
    expect(isLocationSlug("247-plumbing")).toBe(false);
  });

  it("returns false for long provider slugs", () => {
    expect(isLocationSlug("smith-plumbing-and-heating-london")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isLocationSlug("")).toBe(false);
  });
});
