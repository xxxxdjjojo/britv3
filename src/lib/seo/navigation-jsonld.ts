import { NAV_ITEMS } from "@/config/navigation";
import { appBaseUrl } from "@/config/brand";

const BASE_URL = appBaseUrl();

/**
 * Resolve a representative URL for a nav item.
 * - If the item has a direct `href`, use it.
 * - If the item has sections, use the first link of the first section.
 */
function resolveUrl(item: (typeof NAV_ITEMS)[number]): string {
  if (item.href) {
    return `${BASE_URL}${item.href}`;
  }
  if (item.sections && item.sections.length > 0) {
    const firstLink = item.sections[0].links[0];
    if (firstLink) {
      return `${BASE_URL}${firstLink.href}`;
    }
  }
  return BASE_URL;
}

/**
 * SiteNavigationElement JSON-LD structured data for search engines.
 * Generated from the centralized NAV_ITEMS config.
 */
export const siteNavigationJsonLd = {
  "@context": "https://schema.org" as const,
  "@type": "SiteNavigationElement" as const,
  name: NAV_ITEMS.map((item) => item.label),
  url: NAV_ITEMS.map((item) => resolveUrl(item)),
};
