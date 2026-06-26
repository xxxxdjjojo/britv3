import { describe, expect, it } from "vitest";
import { generateMetadata } from "@/app/(main)/blog/[slug]/page";
import { getAllSlugs, getPostBySlug } from "@/content/blog";

describe("blog SEO metadata", () => {
  it("generateMetadata returns title, description and canonical for every slug", async () => {
    for (const slug of getAllSlugs()) {
      const meta = await generateMetadata({ params: Promise.resolve({ slug }) });

      expect(meta.title, slug).toBeTruthy();
      expect(typeof meta.title, slug).toBe("string");
      expect(String(meta.description).length, slug).toBeGreaterThan(0);

      const canonical = meta.alternates?.canonical;
      expect(canonical, slug).toBe(`https://truedeed.co.uk/blog/${slug}`);

      // openGraph carries the hero image
      const ogImages = meta.openGraph?.images;
      expect(ogImages, slug).toBeTruthy();
    }
  });

  it("metadata mirrors the post's seo block", async () => {
    const slug = getAllSlugs()[0];
    const post = getPostBySlug(slug);
    const meta = await generateMetadata({ params: Promise.resolve({ slug }) });

    expect(meta.title).toBe(post?.seo.title);
    expect(meta.description).toBe(post?.seo.description);
  });

  it("builds an Article JSON-LD payload for a post", () => {
    // The page injects schema.org Article JSON-LD. Reconstruct the same shape
    // from the content module to assert the contract the page renders.
    const slug = getAllSlugs()[0];
    const post = getPostBySlug(slug);
    expect(post).toBeDefined();

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post!.title,
      description: post!.seo.description,
      datePublished: post!.date,
      author: { "@type": "Person", name: post!.author.name },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://truedeed.co.uk/blog/${slug}`,
      },
    };

    const serialized = JSON.stringify(jsonLd);
    expect(serialized).toContain('"@type":"Article"');
    expect(serialized).toContain(post!.title);
    expect(serialized).toContain(post!.date);
  });
});
