import { describe, expect, test } from "vitest";
import {
  detectDuplicate,
  detectPriceAnomaly,
  flagListing,
} from "./moderation-service";

describe("detectPriceAnomaly", () => {
  test("flags price as anomaly when too low for a house", () => {
    const result = detectPriceAnomaly(100, "house", "london");
    expect(result).not.toBeNull();
    expect(result?.reason).toBe("price_anomaly");
  });

  test("flags price as anomaly when too high for a flat", () => {
    const result = detectPriceAnomaly(10_000_000, "flat", "london");
    expect(result).not.toBeNull();
    expect(result?.reason).toBe("price_anomaly");
  });

  test("returns null for a reasonable flat price in london", () => {
    const result = detectPriceAnomaly(250_000, "flat", "london");
    expect(result).toBeNull();
  });

  test("returns null for a reasonable house price", () => {
    const result = detectPriceAnomaly(350_000, "house");
    expect(result).toBeNull();
  });

  test("returns null for a reasonable bungalow price", () => {
    const result = detectPriceAnomaly(300_000, "bungalow");
    expect(result).toBeNull();
  });

  test("flags price as anomaly when zero", () => {
    const result = detectPriceAnomaly(0, "flat");
    expect(result).not.toBeNull();
  });

  test("includes severity in anomaly flag", () => {
    const result = detectPriceAnomaly(100, "house", "london");
    expect(result?.severity).toBeDefined();
  });

  test("uses fallback range for unknown property type", () => {
    const result = detectPriceAnomaly(250_000, "unknown_type");
    expect(result).toBeNull();
  });
});

describe("detectDuplicate", () => {
  test("returns high score for identical addresses", () => {
    const result = detectDuplicate("10 Baker Street, London", [
      "10 Baker Street, London",
    ]);
    expect(result.isDuplicate).toBe(true);
    expect(result.score).toBeGreaterThan(0.9);
  });

  test("returns high score for very similar addresses", () => {
    const result = detectDuplicate("10 baker street london", [
      "10 Baker Street, London, NW1",
    ]);
    expect(result.isDuplicate).toBe(true);
    expect(result.score).toBeGreaterThan(0.7);
  });

  test("returns low score for different addresses", () => {
    const result = detectDuplicate("25 Oxford Road, Manchester", [
      "10 Baker Street, London",
    ]);
    expect(result.isDuplicate).toBe(false);
    expect(result.score).toBeLessThan(0.6);
  });

  test("returns not duplicate for empty existing addresses list", () => {
    const result = detectDuplicate("10 Baker Street, London", []);
    expect(result.isDuplicate).toBe(false);
    expect(result.score).toBe(0);
  });

  test("returns the matched address when duplicate found", () => {
    const existing = ["10 Baker Street, London"];
    const result = detectDuplicate("10 Baker Street, London", existing);
    expect(result.matchedAddress).toBe("10 Baker Street, London");
  });
});

describe("flagListing", () => {
  test("returns profanity flag for profane title", () => {
    const result = flagListing({
      title: "shit house for sale",
      description: "Nice property",
      price: 250_000,
      property_type: "house",
      address: "10 Baker Street, London",
    });
    expect(result.flags.some((f) => f.reason === "profanity")).toBe(true);
  });

  test("returns profanity flag for profane description", () => {
    const result = flagListing({
      title: "Nice house for sale",
      description: "this is a damn great place to live",
      price: 250_000,
      property_type: "house",
      address: "10 Baker Street, London",
    });
    expect(result.flags.some((f) => f.reason === "profanity")).toBe(true);
  });

  test("returns price_anomaly flag for unreasonably low price", () => {
    const result = flagListing({
      title: "House for sale",
      description: "Great location",
      price: 100,
      property_type: "house",
      address: "10 Baker Street, London",
    });
    expect(result.flags.some((f) => f.reason === "price_anomaly")).toBe(true);
  });

  test("returns no flags for clean and reasonably priced listing", () => {
    const result = flagListing({
      title: "Lovely house for sale in London",
      description: "Spacious family home with garden",
      price: 450_000,
      property_type: "house",
      address: "10 Baker Street, London",
    });
    expect(result.flags).toHaveLength(0);
  });

  test("returns multiple flags when both profanity and price anomaly found", () => {
    const result = flagListing({
      title: "shit property",
      description: "cheap",
      price: 1,
      property_type: "flat",
      address: "5 Test Road, Manchester",
    });
    expect(result.flags.length).toBeGreaterThanOrEqual(2);
  });
});
