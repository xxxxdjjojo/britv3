import type { Metadata } from "next";
import { CATEGORIES } from "./categories";
import { getFeaturedProviders } from "./featured-providers";
import { HubHero } from "@/components/marketplace/hub/HubHero";
import { CategoryGrid } from "@/components/marketplace/hub/CategoryGrid";
import { FeaturedProviders } from "@/components/marketplace/hub/FeaturedProviders";
import {
  HowItWorks,
  TrustBand,
  FinalCta,
} from "@/components/marketplace/hub/HubBands";

const SITE_URL = "https://www.truedeed.co.uk";
const PAGE_PATH = "/marketplace";
const TITLE = "Find Verified Tradespeople & Property Professionals | TrueDeed";
const DESCRIPTION =
  "Hire ID-checked plumbers, electricians, builders, estate agents, mortgage brokers, conveyancers and surveyors across the UK. Real customer reviews, transparent ratings.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}${PAGE_PATH}`,
    siteName: "TrueDeed",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

function CollectionJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "TrueDeed Service Marketplace",
    description: DESCRIPTION,
    url: `${SITE_URL}${PAGE_PATH}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: CATEGORIES.map((category, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: category.label,
        url: `${SITE_URL}${category.href}`,
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD is built from a static, trusted config — safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function MarketplaceLandingPage() {
  const featured = await getFeaturedProviders();

  return (
    <div className="bg-white dark:bg-slate-950">
      <CollectionJsonLd />
      <HubHero />
      <CategoryGrid />
      <FeaturedProviders providers={featured} />
      <HowItWorks />
      <TrustBand />
      <FinalCta />
    </div>
  );
}
