const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Britestate",
  legalName: "Britestate Ltd",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  contactPoint: { "@type": "ContactPoint", contactType: "customer service", url: `${BASE_URL}/contact` },
};

export const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Britestate",
  url: BASE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};
