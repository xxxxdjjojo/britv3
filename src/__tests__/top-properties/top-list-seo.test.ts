import { describe, expect, it } from "vitest";

import { appBaseUrl } from "@/config/brand";
import {
  buildTopListItemListJsonLd,
  topListRobots,
} from "@/lib/seo/top-list-jsonld";
import { getTopListCategory } from "@/lib/top-properties/top-list-config";
import { makeItem } from "./fixtures";

const BASE = appBaseUrl();

describe("buildTopListItemListJsonLd", () => {
  const category = getTopListCategory("most-expensive-homes")!;

  it("emits an ItemList that matches the visible ranked items exactly", () => {
    const items = [
      makeItem({ rank: 1, listingSlug: "penthouse-mayfair-sale", title: "Mayfair Penthouse" }),
      makeItem({ rank: 2, listingSlug: "villa-hampstead-sale", title: "Hampstead Villa" }),
    ];
    const jsonLd = buildTopListItemListJsonLd(category, items) as {
      "@context": string;
      "@type": string;
      name: string;
      numberOfItems: number;
      itemListOrder: string;
      itemListElement: {
        "@type": string;
        position: number;
        url: string;
        name: string;
      }[];
    };

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("ItemList");
    expect(jsonLd.name).toBe(category.title);
    expect(jsonLd.numberOfItems).toBe(2);
    expect(jsonLd.itemListElement).toHaveLength(2);
    expect(jsonLd.itemListElement[0]).toMatchObject({
      "@type": "ListItem",
      position: 1,
      url: `${BASE}/properties/penthouse-mayfair-sale`,
      name: "Mayfair Penthouse",
    });
    expect(jsonLd.itemListElement[1].position).toBe(2);
  });

  it("never emits structured data for items that are not passed (no hidden content)", () => {
    const jsonLd = buildTopListItemListJsonLd(category, []) as {
      numberOfItems: number;
      itemListElement: unknown[];
    };
    expect(jsonLd.numberOfItems).toBe(0);
    expect(jsonLd.itemListElement).toHaveLength(0);
  });
});

describe("topListRobots", () => {
  it("allows indexing for lists meeting the threshold", () => {
    expect(topListRobots(true)).toEqual({ index: true, follow: true });
  });

  it("noindexes thin lists but still follows links", () => {
    expect(topListRobots(false)).toEqual({ index: false, follow: true });
  });
});
