import { describe, expect, it } from "vitest";

import {
  CARD_PREVIEW_SIZE,
  LIST_PAGE_SIZE,
  MIN_ITEMS_TO_INDEX,
  TOP_LIST_CATEGORIES,
  TOP_LIST_DISCLAIMER,
  getAllTopListSlugs,
  getRelatedCategories,
  getTopListCategory,
} from "@/lib/top-properties/top-list-config";

describe("top-list config integrity", () => {
  it("has unique, URL-safe slugs", () => {
    const slugs = getAllTopListSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("every category carries complete, unique SEO copy", () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const c of TOP_LIST_CATEGORIES) {
      expect(c.title.length).toBeGreaterThan(10);
      expect(c.intro.length).toBeGreaterThan(80);
      expect(c.methodology.length).toBeGreaterThan(80);
      expect(c.metaDescription.length).toBeGreaterThan(50);
      expect(c.metaDescription.length).toBeLessThanOrEqual(170);
      expect(c.badgeLabel.length).toBeGreaterThan(2);
      titles.add(c.title);
      descriptions.add(c.metaDescription);
    }
    expect(titles.size).toBe(TOP_LIST_CATEGORIES.length);
    expect(descriptions.size).toBe(TOP_LIST_CATEGORIES.length);
  });

  it("never labels a home 'undervalued' — the honest copy is 'below the local benchmark'", () => {
    for (const c of TOP_LIST_CATEGORIES) {
      const copy = [
        c.title,
        c.intro,
        c.methodology,
        c.metaDescription,
        c.badgeLabel,
      ]
        .join(" ")
        .toLowerCase();
      expect(copy).not.toContain("undervalued");
    }
  });

  it("enforces the thin-page threshold on every category", () => {
    expect(MIN_ITEMS_TO_INDEX).toBeGreaterThanOrEqual(5);
    for (const c of TOP_LIST_CATEGORIES) {
      expect(c.minItemsToIndex).toBeGreaterThanOrEqual(5);
    }
    expect(CARD_PREVIEW_SIZE).toBeGreaterThanOrEqual(3);
    expect(LIST_PAGE_SIZE).toBeGreaterThanOrEqual(10);
  });

  it("includes the valuation-led flagship and the London city list", () => {
    expect(getTopListCategory("below-local-benchmark")?.kind).toBe("value");
    expect(getTopListCategory("top-homes-in-london")?.city).toBe("london");
    expect(getTopListCategory("nonexistent-list")).toBeNull();
  });

  it("disclaimer states the data sources and that rankings are not financial advice", () => {
    expect(TOP_LIST_DISCLAIMER).toContain("not financial advice");
    expect(TOP_LIST_DISCLAIMER.toLowerCase()).toContain("listing data");
  });

  it("relates every category to every other (internal cross-linking)", () => {
    const related = getRelatedCategories("below-local-benchmark");
    expect(related).toHaveLength(TOP_LIST_CATEGORIES.length - 1);
    expect(related.map((c) => c.slug)).not.toContain("below-local-benchmark");
  });
});
