import { describe, it, expect } from "vitest";

type ListingType = "sale" | "rent";

function formatPrice(price: number, listingType?: ListingType): string {
  if (listingType === "rent") {
    return `\u00A3${price.toLocaleString("en-GB")}/mo`;
  }
  return `\u00A3${price.toLocaleString("en-GB")}`;
}

describe("formatPrice", () => {
  it("returns sale format for sale listings", () => {
    expect(formatPrice(450000, "sale")).toBe("£450,000");
  });

  it("returns monthly format for rent listings", () => {
    expect(formatPrice(1850, "rent")).toBe("£1,850/mo");
  });

  it("returns sale format for large numbers", () => {
    expect(formatPrice(1200000, "sale")).toBe("£1,200,000");
  });

  it("returns sale format when no listing type is provided (backward compatible)", () => {
    expect(formatPrice(450000)).toBe("£450,000");
  });
});
