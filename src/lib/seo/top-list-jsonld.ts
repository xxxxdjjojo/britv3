/**
 * Structured data + robots helpers for Top Properties list pages.
 *
 * The ItemList is built from exactly the items rendered on the page — never
 * from a larger, hidden set — so the structured data always matches visible
 * content (a Google spam-policy requirement for ranked lists).
 */

import { appBaseUrl } from "@/config/brand";
import type { TopListCategory, TopListItem } from "@/lib/top-properties/types";

const BASE_URL = appBaseUrl();

export function buildTopListItemListJsonLd(
  category: TopListCategory,
  items: TopListItem[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category.title,
    description: category.metaDescription,
    numberOfItems: items.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.rank,
      url: `${BASE_URL}/properties/${item.listingSlug}`,
      name: item.title,
    })),
  };
}

/**
 * Robots directive for a list page: thin lists (below the category's
 * indexability threshold) are noindexed but still followed, so link equity
 * flows to the property pages without exposing a thin indexable page.
 */
export function topListRobots(isIndexable: boolean): {
  index: boolean;
  follow: boolean;
} {
  return { index: isIndexable, follow: true };
}
