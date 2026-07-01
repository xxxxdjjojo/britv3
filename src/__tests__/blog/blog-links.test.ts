import { describe, expect, it } from "vitest";
import {
  BLOG_CATEGORIES,
  categoryToSlug,
  getAllSlugs,
  getPostsByCategory,
  getRelatedPosts,
} from "@/content/blog";

describe("blog links and helpers", () => {
  it("getAllSlugs returns 32 entries", () => {
    expect(getAllSlugs()).toHaveLength(32);
  });

  it("categoryToSlug round-trips for every category", () => {
    for (const category of BLOG_CATEGORIES) {
      const slug = categoryToSlug(category);
      const match = BLOG_CATEGORIES.find((c) => categoryToSlug(c) === slug);
      expect(match, `${category} → ${slug} did not round-trip`).toBe(category);
    }
  });

  it("category slugs are unique", () => {
    const slugs = BLOG_CATEGORIES.map(categoryToSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("getPostsByCategory only returns posts in that category", () => {
    for (const category of BLOG_CATEGORIES) {
      for (const post of getPostsByCategory(category)) {
        expect(post.category).toBe(category);
      }
    }
  });

  it("getRelatedPosts never returns the current slug", () => {
    for (const slug of getAllSlugs()) {
      const related = getRelatedPosts(slug);
      expect(related.map((p) => p.slug)).not.toContain(slug);
      expect(related.length).toBeLessThanOrEqual(3);
    }
  });
});
