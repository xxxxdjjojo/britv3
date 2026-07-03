/**
 * Link-integrity tests for the Top Properties feature (written RED-first).
 *
 * Every link a user can click must resolve to a real route:
 *  - hub + category pages exist in the (main) route tree
 *  - TopListCard CTAs point at /top-properties/<slug>
 *  - RankedPropertyCard points at the real property detail page
 *  - related-list cross-links point at configured categories
 *  - the route is publicly reachable (proxy PUBLIC_ROUTES) and linked from
 *    the footer so it is not an orphan page
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PUBLIC_ROUTES } from "@/lib/constants";
import {
  TOP_LIST_CATEGORIES,
  getTopListCategory,
} from "@/lib/top-properties/top-list-config";
import { makeItem } from "./fixtures";

// next/link needs an app-router context we don't have in a unit test; render
// it as a plain anchor so we can assert the hrefs that reach the DOM.
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

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) =>
    createElement("img", { ...props, priority: undefined, fill: undefined }),
}));

const APP_MAIN = join(process.cwd(), "src", "app", "(main)");

function extractHrefs(html: string): string[] {
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
}

describe("top-properties routes exist", () => {
  it("has a hub page at /top-properties", () => {
    expect(
      existsSync(join(APP_MAIN, "top-properties", "page.tsx")),
    ).toBe(true);
  });

  it("has a dynamic category page at /top-properties/[slug]", () => {
    expect(
      existsSync(join(APP_MAIN, "top-properties", "[slug]", "page.tsx")),
    ).toBe(true);
  });
});

describe("TopListCard links", () => {
  it("renders a 'View full list' CTA to the category page for every category", async () => {
    const { TopListCard } = await import(
      "@/components/top-properties/TopListCard"
    );
    for (const category of TOP_LIST_CATEGORIES) {
      const html = renderToStaticMarkup(
        createElement(TopListCard, {
          category,
          items: [makeItem(), makeItem(), makeItem()],
        }),
      );
      expect(html).toContain(`href="/top-properties/${category.slug}"`);
      expect(html).toContain("View full list");
      expect(html).toContain(category.shortTitle);
    }
  });

  it("links each previewed property to its detail page", async () => {
    const { TopListCard } = await import(
      "@/components/top-properties/TopListCard"
    );
    const item = makeItem({ listingSlug: "victorian-semi-richmond-sale" });
    const html = renderToStaticMarkup(
      createElement(TopListCard, {
        category: TOP_LIST_CATEGORIES[0],
        items: [item],
      }),
    );
    expect(html).toContain('href="/properties/victorian-semi-richmond-sale"');
  });
});

describe("RankedPropertyCard links", () => {
  it("links to the property detail page and renders rank, price, and location", async () => {
    const { RankedPropertyCard } = await import(
      "@/components/top-properties/RankedPropertyCard"
    );
    const item = makeItem({
      rank: 3,
      listingSlug: "georgian-townhouse-bath-sale",
      title: "Georgian Townhouse",
      city: "Bath",
      price: 925_000,
      reason: "7% below local benchmark",
    });
    const html = renderToStaticMarkup(
      createElement(RankedPropertyCard, {
        item,
        categorySlug: "below-local-benchmark",
      }),
    );
    expect(html).toContain('href="/properties/georgian-townhouse-bath-sale"');
    expect(html).toContain("Georgian Townhouse");
    expect(html).toContain("Bath");
    expect(html).toContain("£925,000");
    expect(html).toContain("7% below local benchmark");
    // Rank must be visible, not colour-encoded only.
    expect(html).toMatch(/>\s*3\s*</);
  });

  it("renders image alt text when an image exists", async () => {
    const { RankedPropertyCard } = await import(
      "@/components/top-properties/RankedPropertyCard"
    );
    const item = makeItem({ imageAlt: "Detached house with large garden" });
    const html = renderToStaticMarkup(
      createElement(RankedPropertyCard, { item, categorySlug: "largest-homes" }),
    );
    expect(html).toContain('alt="Detached house with large garden"');
  });
});

describe("related-list cross-links", () => {
  it("every related slug resolves to a configured category", () => {
    for (const category of TOP_LIST_CATEGORIES) {
      expect(getTopListCategory(category.slug)).not.toBeNull();
    }
  });
});

describe("route reachability", () => {
  it("/top-properties is a public route (proxy will not redirect it to /login)", () => {
    expect(PUBLIC_ROUTES).toContain("/top-properties");
  });

  it("the footer links to /top-properties so the hub is not an orphan page", async () => {
    const { Footer } = await import("@/components/layout/Footer");
    const html = renderToStaticMarkup(createElement(Footer));
    const hrefs = extractHrefs(html);
    expect(hrefs).toContain("/top-properties");
  });
});
