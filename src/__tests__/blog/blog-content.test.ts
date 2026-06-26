import { describe, expect, it } from "vitest";
import {
  BLOG_CATEGORIES,
  getAllPosts,
  getPostBySlug,
} from "@/content/blog";
import type { ArticleBlock } from "@/content/blog/types";

const EXPECTED_SLUGS = [
  "stamp-duty-first-time-buyer-guide-2026",
  "winning-offer-competitive-market",
  "renters-rights-bill-explained-2026",
  "tenant-deposit-protection-guide",
  "sell-your-home-faster-guide",
  "home-improvements-add-value",
  "hmo-licensing-landlord-guide-2026",
  "landlord-tax-changes-2026",
  "uk-property-market-forecast-2026",
  "fastest-rising-house-prices-2026",
  "leasehold-reform-act-flat-owners",
  "conveyancing-timeline-explained",
  "buy-to-let-still-worth-it-2026",
  "rental-yield-vs-capital-growth",
] as const;

describe("blog content integrity", () => {
  const posts = getAllPosts();

  it("ships exactly the 14 expected posts", () => {
    expect(posts).toHaveLength(14);
  });

  it("resolves each expected slug via getPostBySlug", () => {
    for (const slug of EXPECTED_SLUGS) {
      expect(getPostBySlug(slug), `missing post: ${slug}`).toBeDefined();
    }
    expect(new Set(posts.map((p) => p.slug))).toEqual(new Set(EXPECTED_SLUGS));
  });

  it("has unique slugs", () => {
    const slugs = posts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every post has all required fields populated", () => {
    for (const post of posts) {
      expect(post.title.length, post.slug).toBeGreaterThan(0);
      expect(post.excerpt.length, post.slug).toBeGreaterThan(0);
      expect(post.dateLabel.length, post.slug).toBeGreaterThan(0);
      expect(post.readTime.length, post.slug).toBeGreaterThan(0);
      expect(post.heroAlt.length, post.slug).toBeGreaterThan(0);
      expect(post.author.name.length, post.slug).toBeGreaterThan(0);
      expect(post.author.initials.length, post.slug).toBeGreaterThan(0);
      expect(post.body.length, post.slug).toBeGreaterThan(0);
      expect(post.seo.title.length, post.slug).toBeGreaterThan(0);
      // ISO 8601 date
      expect(post.date, post.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("every post has a valid category from BLOG_CATEGORIES", () => {
    for (const post of posts) {
      expect(BLOG_CATEGORIES, post.slug).toContain(post.category);
    }
  });

  it("every seo.description is 160 characters or fewer", () => {
    for (const post of posts) {
      expect(
        post.seo.description.length,
        `${post.slug}: ${post.seo.description.length} chars`,
      ).toBeLessThanOrEqual(160);
    }
  });

  it("every heroImage path begins with /blog/", () => {
    for (const post of posts) {
      expect(post.heroImage, post.slug).toMatch(/^\/blog\//);
    }
  });

  it("every cta block links to an internal href", () => {
    const ctaBlocks = posts.flatMap((post) =>
      post.body.filter(
        (block: ArticleBlock): block is Extract<ArticleBlock, { type: "cta" }> =>
          block.type === "cta",
      ),
    );

    expect(ctaBlocks.length).toBeGreaterThan(0);
    for (const cta of ctaBlocks) {
      expect(cta.href, cta.label).toMatch(/^\//);
      expect(cta.label.length).toBeGreaterThan(0);
      expect(cta.text.length).toBeGreaterThan(0);
    }
  });
});
