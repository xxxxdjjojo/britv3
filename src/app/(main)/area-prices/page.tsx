/**
 * Area Prices — free, postcode-first sold-price lookup.
 * Route: /area-prices
 *
 * Server shell (metadata + heading + indexable SEO content); the interactive
 * search + map live in the AreaPricesExplorer client component, with a
 * server-rendered methodology / popular-areas / FAQ section beneath it so
 * crawlers see substantive content.
 */

import type { Metadata } from "next";
import { AreaPricesExplorer } from "./AreaPricesExplorer";
import { AreaPricesSeoContent, AREA_PRICES_FAQ } from "./AreaPricesSeoContent";
import { brandConfig, appUrl } from "@/config/brand";
import { faqJsonLd } from "@/lib/seo/faq-jsonld";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { safeJsonLd } from "@/lib/seo/safe-json-ld";

const TITLE = `Area Prices — What Homes Sell For Near You | ${brandConfig.displayName}`;
const DESCRIPTION =
  "Enter your postcode to see the typical (median) sold price for your area, split by flats and houses, from HM Land Registry data. Free, no sign-up.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/area-prices" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: appUrl("/area-prices"),
  },
};

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Area Prices",
  description: DESCRIPTION,
  url: appUrl("/area-prices"),
  isPartOf: {
    "@type": "WebSite",
    name: brandConfig.displayName,
    url: appUrl("/"),
  },
  about: {
    "@type": "Dataset",
    name: "HM Land Registry Price Paid Data — area medians",
    description:
      "Median residential sold prices for England and Wales, split by flats and houses, derived from HM Land Registry Price Paid Data.",
    license: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    creator: { "@type": "GovernmentOrganization", name: "HM Land Registry" },
    spatialCoverage: "England and Wales",
  },
};

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Area Prices", path: "/area-prices" },
]);

export default function AreaPricesPage() {
  return (
    <main className="min-h-[calc(100dvh-3.5rem)] bg-gradient-to-b from-brand-primary-lighter/50 via-brand-primary-lighter/15 to-transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd(AREA_PRICES_FAQ)) }}
      />
      <AreaPricesExplorer />
      <AreaPricesSeoContent />
    </main>
  );
}
