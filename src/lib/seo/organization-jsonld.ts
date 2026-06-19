import { appBaseUrl, brandConfig } from "@/config/brand";

const BASE_URL = appBaseUrl();

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: brandConfig.displayName,
  url: BASE_URL,
  logo: `${BASE_URL}${brandConfig.assets.logo}`,
  contactPoint: { "@type": "ContactPoint", contactType: "customer service", url: `${BASE_URL}/contact` },
};

export const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: brandConfig.displayName,
  url: BASE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};
