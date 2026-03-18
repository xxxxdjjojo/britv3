import { SITE_NAME, SITE_URL } from "@/lib/seo/config";

/**
 * Returns a schema.org Organization JSON-LD object for Britestate.
 */
export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_NAME,
    "url": SITE_URL,
    "logo": `${SITE_URL}/icons/icon-512.png`,
    "description": "The UK's intelligent property platform. Find, compare, and transact with AI-powered matching.",
    "sameAs": [
      "https://twitter.com/britestate",
      "https://www.linkedin.com/company/britestate",
    ],
  };
}

/**
 * Returns a schema.org WebSite JSON-LD object with a SearchAction for Britestate.
 */
export function buildWebSiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": SITE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Returns a schema.org BreadcrumbList JSON-LD object for the given items.
 */
export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url,
    })),
  };
}
