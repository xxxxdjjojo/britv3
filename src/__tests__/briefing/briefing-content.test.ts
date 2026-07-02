import { describe, expect, it } from "vitest";
import { BRIEFING_EDITIONS, getBriefingEdition } from "@/content/briefing";

/**
 * Content contract for Independent Agent Briefing editions:
 * sourced, dated, and legally hedged (the CAT claim is alleged, not proven).
 */
describe("briefing editions content", () => {
  it("has at least one published edition", () => {
    expect(BRIEFING_EDITIONS.length).toBeGreaterThan(0);
  });

  it("has unique slugs", () => {
    const slugs = BRIEFING_EDITIONS.map((edition) => edition.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(BRIEFING_EDITIONS.map((edition) => [edition.slug, edition] as const))(
    "%s has a valid ISO date",
    (_slug, edition) => {
      expect(edition.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(edition.date).getTime())).toBe(false);
    },
  );

  it.each(BRIEFING_EDITIONS.map((edition) => [edition.slug, edition] as const))(
    "%s has a non-empty body with non-empty sections",
    (_slug, edition) => {
      expect(edition.body.length).toBeGreaterThan(0);
      for (const section of edition.body) {
        expect(section.heading.length).toBeGreaterThan(0);
        expect(section.paragraphs.length).toBeGreaterThan(0);
        for (const paragraph of section.paragraphs) {
          expect(paragraph.trim().length).toBeGreaterThan(0);
        }
      }
    },
  );

  it("every source url is https", () => {
    for (const edition of BRIEFING_EDITIONS) {
      for (const section of edition.body) {
        for (const source of section.sources ?? []) {
          expect(
            source.url,
            `${edition.slug} → "${section.heading}" → ${source.label}`,
          ).toMatch(/^https:\/\//);
          expect(source.label.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("is sorted newest first", () => {
    const dates = BRIEFING_EDITIONS.map((edition) => edition.date);
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(dates).toEqual(sorted);
  });

  describe("edition 1 (CAT certification hearing) legal red lines", () => {
    const edition = getBriefingEdition("edition-1-cat-certification-hearing");

    it("exists", () => {
      expect(edition).toBeDefined();
    });

    it("uses alleged-language when discussing the claim", () => {
      const bodyText = (edition?.body ?? [])
        .flatMap((section) => section.paragraphs)
        .join(" ");
      expect(bodyText).toContain("alleges");
    });

    it("cites at least one source", () => {
      const sources = (edition?.body ?? []).flatMap(
        (section) => section.sources ?? [],
      );
      expect(sources.length).toBeGreaterThan(0);
    });
  });

  describe("getBriefingEdition", () => {
    it("returns undefined for unknown slugs", () => {
      expect(getBriefingEdition("not-a-real-edition")).toBeUndefined();
    });
  });
});
