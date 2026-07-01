import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

import { getAllSlugs, getPostBySlug } from "@/content/blog";
import {
  FTB_HUB_KEY,
  FTB_HUB_MEMBER_SLUGS,
  JOURNEY_STAGES,
  getHubPosts,
  getHubPostsByStage,
} from "@/content/blog/hub";
import type { ArticleBlock } from "@/content/blog/types";

// next/link needs an app-router context we don't have in a unit test; render it
// as a plain anchor so we can assert the hrefs that reach the DOM.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => createElement("a", { href, ...rest }, children),
}));

const APP_MAIN = join(process.cwd(), "src", "app", "(main)");

/**
 * True dead-link check against the real route tree. `/blog/<slug>` resolves via
 * the content module (the `[slug]` dynamic route); everything else must have a
 * concrete `page.tsx` under the (main) route group.
 */
function routeExists(href: string): boolean {
  const pathname = href.split(/[?#]/)[0];
  if (pathname === "/") return existsSync(join(APP_MAIN, "page.tsx"));

  const blogArticle = pathname.match(/^\/blog\/([a-z0-9-]+)$/);
  if (blogArticle) {
    const slug = blogArticle[1];
    if (getAllSlugs().includes(slug)) return true;
    // static blog sub-pages (e.g. the hub landing) have a concrete folder
    return existsSync(join(APP_MAIN, "blog", slug, "page.tsx"));
  }

  const segments = pathname.replace(/^\//, "").split("/");
  return existsSync(join(APP_MAIN, ...segments, "page.tsx"));
}

function internalHrefs(blocks: readonly ArticleBlock[]): string[] {
  const hrefs: string[] = [];
  for (const block of blocks) {
    if (block.type === "cta") hrefs.push(block.href);
    if (block.type === "links") {
      for (const item of block.items) hrefs.push(item.href);
    }
  }
  return hrefs.filter((h) => h.startsWith("/"));
}

function siblingBlogLinks(
  blocks: readonly ArticleBlock[],
  selfSlug: string,
): string[] {
  return internalHrefs(blocks)
    .map((h) => h.match(/^\/blog\/([a-z0-9-]+)$/)?.[1])
    .filter((s): s is string => Boolean(s) && s !== selfSlug);
}

const TOOL_OR_SEARCH = /^\/(tools\/|search|properties|area-prices|new-homes)/;

describe("first-time-buyer hub — membership", () => {
  it("defines exactly 20 members", () => {
    expect(FTB_HUB_MEMBER_SLUGS).toHaveLength(20);
    expect(new Set(FTB_HUB_MEMBER_SLUGS).size).toBe(20);
  });

  it("every member slug resolves to a real post", () => {
    for (const slug of FTB_HUB_MEMBER_SLUGS) {
      expect(getPostBySlug(slug), `missing hub post: ${slug}`).toBeDefined();
    }
  });

  it("getHubPosts returns the 20 members and each is tagged hub", () => {
    const posts = getHubPosts();
    expect(posts).toHaveLength(20);
    for (const post of posts) {
      expect(post.hub, post.slug).toBe(FTB_HUB_KEY);
      expect(JOURNEY_STAGES, post.slug).toContain(post.journeyStage);
    }
  });

  it("only hub members carry the hub tag", () => {
    for (const slug of getAllSlugs()) {
      const post = getPostBySlug(slug)!;
      if (post.hub === FTB_HUB_KEY) {
        expect(FTB_HUB_MEMBER_SLUGS, slug).toContain(slug);
      }
    }
  });

  it("getHubPostsByStage covers all 20 across the journey stages", () => {
    const byStage = getHubPostsByStage();
    const total = JOURNEY_STAGES.reduce(
      (n, stage) => n + byStage[stage].length,
      0,
    );
    expect(total).toBe(20);
    for (const stage of JOURNEY_STAGES) {
      for (const post of byStage[stage]) {
        expect(post.journeyStage).toBe(stage);
      }
    }
  });
});

describe("first-time-buyer hub — internal linking web", () => {
  it("each member links to >=3 other hub articles", () => {
    for (const post of getHubPosts()) {
      const siblings = siblingBlogLinks(post.body, post.slug).filter((s) =>
        FTB_HUB_MEMBER_SLUGS.includes(s),
      );
      expect(
        new Set(siblings).size,
        `${post.slug} has too few hub cross-links`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("each member links to >=1 TrueDeed tool or property-search route", () => {
    for (const post of getHubPosts()) {
      const hasTool = internalHrefs(post.body).some((h) =>
        TOOL_OR_SEARCH.test(h),
      );
      expect(hasTool, `${post.slug} has no tool/search CTA`).toBe(true);
    }
  });
});

describe("first-time-buyer hub — FAQ + schema", () => {
  it("each member has an FAQ block with >=5 non-empty Q&As", () => {
    for (const post of getHubPosts()) {
      const faq = post.body.find(
        (b): b is Extract<ArticleBlock, { type: "faq" }> => b.type === "faq",
      );
      expect(faq, `${post.slug} missing FAQ block`).toBeDefined();
      expect(faq!.items.length, post.slug).toBeGreaterThanOrEqual(5);
      for (const qa of faq!.items) {
        expect(qa.question.trim().length, post.slug).toBeGreaterThan(0);
        expect(qa.answer.trim().length, post.slug).toBeGreaterThan(0);
      }
    }
  });

  it("a FAQPage JSON-LD payload can be built from the FAQ block", () => {
    const post = getHubPosts()[0];
    const faq = post.body.find(
      (b): b is Extract<ArticleBlock, { type: "faq" }> => b.type === "faq",
    )!;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.items.map((qa) => ({
        "@type": "Question",
        name: qa.question,
        acceptedAnswer: { "@type": "Answer", text: qa.answer },
      })),
    };
    const serialized = JSON.stringify(jsonLd);
    expect(serialized).toContain('"@type":"FAQPage"');
    expect(serialized).toContain('"@type":"Question"');
    expect(serialized).toContain(faq.items[0].question);
  });
});

describe("first-time-buyer hub — SEO invariants", () => {
  it("seo.title <=60 and seo.description <=160 for every member", () => {
    for (const post of getHubPosts()) {
      expect(post.seo.title.length, `${post.slug} title`).toBeLessThanOrEqual(
        60,
      );
      expect(
        post.seo.description.length,
        `${post.slug} description`,
      ).toBeLessThanOrEqual(160);
    }
  });

  it("every member has at least one h2 and keywords", () => {
    for (const post of getHubPosts()) {
      const h2s = post.body.filter((b) => b.type === "h2");
      expect(h2s.length, post.slug).toBeGreaterThanOrEqual(4);
      expect(post.keywords.length, post.slug).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("blog — no dead internal links (all posts)", () => {
  it("every internal cta/links href resolves to a real route", () => {
    for (const slug of getAllSlugs()) {
      const post = getPostBySlug(slug)!;
      for (const href of internalHrefs(post.body)) {
        expect(routeExists(href), `${slug}: dead link ${href}`).toBe(true);
      }
    }
  });
});

describe("ArticleBody renders hub links as anchors", () => {
  it("renders every internal href from a hub post as an <a href>", async () => {
    const { ArticleBody } = await import("@/components/blog/ArticleBody");
    const post = getHubPosts()[0];
    const html = renderToStaticMarkup(
      createElement(ArticleBody, { blocks: post.body }),
    );
    for (const href of internalHrefs(post.body)) {
      expect(html, `missing rendered link ${href}`).toContain(`href="${href}"`);
    }
  });
});
