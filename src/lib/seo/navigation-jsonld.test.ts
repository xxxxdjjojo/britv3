import { describe, expect, it } from "vitest";
import { siteNavigationJsonLd } from "./navigation-jsonld";

describe("siteNavigationJsonLd", () => {
  it("has @type SiteNavigationElement", () => {
    expect(siteNavigationJsonLd["@type"]).toBe("SiteNavigationElement");
  });

  it("has @context https://schema.org", () => {
    expect(siteNavigationJsonLd["@context"]).toBe("https://schema.org");
  });

  it("contains all 6 nav item names", () => {
    const names = siteNavigationJsonLd.name as string[];
    expect(names).toHaveLength(6);
    expect(names).toContain("Buy");
    expect(names).toContain("Rent");
    expect(names).toContain("Services");
    expect(names).toContain("Tools & Valuations");
    expect(names).toContain("Advice");
    expect(names).toContain("List / Sell");
  });

  it("has all URLs as absolute (start with http)", () => {
    const urls = siteNavigationJsonLd.url as string[];
    for (const url of urls) {
      expect(url).toMatch(/^https?:\/\//);
    }
  });

  it("maps each nav item to a URL (same count)", () => {
    const names = siteNavigationJsonLd.name as string[];
    const urls = siteNavigationJsonLd.url as string[];
    expect(urls).toHaveLength(names.length);
  });

  it("uses the first link href for items with sections", () => {
    const urls = siteNavigationJsonLd.url as string[];
    // Buy's first section first link is /search?type=buy
    expect(urls[0]).toContain("/search?type=buy");
  });
});
