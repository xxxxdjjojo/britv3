import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  BarChart3,
  Clock,
  PoundSterling,
} from "lucide-react";
import { getCityData, getAllCitySlugs } from "@/services/areas/area-data-service";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { safeJsonLd } from "@/lib/seo/safe-json-ld";
import { AreaSearchCTA } from "@/components/areas/AreaSearchCTA";
import { DataAttribution } from "@/components/areas/DataAttribution";
import { InternalLinkCard } from "@/components/areas/InternalLinkCard";
import { AreaPriceTrendClient } from "@/components/charts/AreaPriceTrendClient";

export const revalidate = 86400;

export async function generateStaticParams() {
  return getAllCitySlugs().map((city) => ({ city }));
}

type StatsPageProps = Readonly<{ params: Promise<{ city: string }> }>;

export async function generateMetadata({ params }: StatsPageProps): Promise<Metadata> {
  const { city } = await params;
  const data = await getCityData(city);
  if (!data) return {};
  return {
    title: `${data.name} House Prices & Statistics | Property Market Data | Britestate`,
    description: `Average house prices in ${data.name}: ${data.avgPriceFormatted}. View property market statistics, price trends, and transaction volumes. Data from HM Land Registry.`,
    openGraph: {
      title: `${data.name} Property Statistics`,
      description: `Market data and price statistics for ${data.name}`,
      type: "website",
    },
    alternates: { canonical: `/areas/${city}/stats` },
  };
}

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}m`;
  if (n >= 1_000) return `£${Math.round(n / 1_000).toLocaleString()}k`;
  return `£${n.toLocaleString()}`;
}

export default async function AreaStatsPage({ params }: StatsPageProps) {
  const { city } = await params;

  if (city !== city.toLowerCase()) {
    redirect(`/areas/${city.toLowerCase()}/stats`);
  }

  const city_data = await getCityData(city);
  if (!city_data) notFound();

  // Affordability ratio: median price ÷ median UK household income (£38,700 for 2026)
  const UK_MEDIAN_INCOME = 38_700;
  const affordabilityRatio = (city_data.medianPrice / UK_MEDIAN_INCOME).toFixed(1);

  const isPositiveYoy = city_data.yoyChange >= 0;

  const kpiCards = [
    {
      label: "Avg Asking Price",
      value: city_data.avgPriceFormatted,
      sub: "Active listings",
      icon: PoundSterling,
      highlight: false,
    },
    {
      label: "Median Sold Price",
      value: formatPrice(city_data.medianPrice),
      sub: "Based on completions",
      icon: BarChart3,
      highlight: false,
    },
    {
      label: "YoY Price Change",
      value: city_data.yoyChangeFormatted,
      sub: "Last 12 months",
      icon: isPositiveYoy ? TrendingUp : TrendingDown,
      highlight: true,
      positive: isPositiveYoy,
    },
    {
      label: "Transactions (12m)",
      value: city_data.transactionsLast12m.toLocaleString(),
      sub: "Completed sales",
      icon: Building2,
      highlight: false,
    },
    {
      label: "Avg Days to Sell",
      value: `${city_data.avgDaysToSell}`,
      sub: "Days on market",
      icon: Clock,
      highlight: false,
    },
    {
      label: "Affordability Ratio",
      value: `${affordabilityRatio}x`,
      sub: "Price-to-income ratio",
      icon: PoundSterling,
      highlight: false,
    },
  ] as const;

  const propertyTypeLabels: Record<string, string> = {
    D: "Detached",
    S: "Semi-Detached",
    T: "Terraced",
    F: "Flat / Apartment",
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Areas", path: "/areas" },
    { name: city_data.name, path: `/areas/${city_data.slug}` },
    { name: "Statistics", path: `/areas/${city_data.slug}/stats` },
  ]);

  const datasetJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${city_data.name} Property Market Statistics`,
    description: `House price data and market statistics for ${city_data.name}, including average prices by property type, year-on-year changes, and transaction volumes.`,
    url: `https://britestate.co.uk/areas/${city_data.slug}/stats`,
    creator: {
      "@type": "Organization",
      name: "Britestate",
      url: "https://britestate.co.uk",
    },
    license: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    isBasedOn: "https://landregistry.data.gov.uk/",
    keywords: ["house prices", "property statistics", city_data.name, city_data.region, "UK property"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(datasetJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-24">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[--color-on-surface-variant]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/areas" className="hover:text-primary">Areas</Link>
          <span>/</span>
          <Link href={`/areas/${city_data.slug}`} className="hover:text-primary">{city_data.name}</Link>
          <span>/</span>
          <span className="text-on-surface font-medium">Statistics</span>
        </nav>

        {/* Page header */}
        <header>
          <h1 className="text-4xl font-bold font-heading text-on-surface mb-2">
            {city_data.name} Property Statistics
          </h1>
          <p className="text-[--color-on-surface-variant] text-lg">
            Live market data, price breakdowns and transaction volumes for {city_data.name}.
          </p>
          <div className="mt-4">
            <DataAttribution source="HM Land Registry" lastUpdated="March 2026" methodology="Median prices based on completed sales registered with HMLR" />
          </div>
        </header>

        {/* KPI Row — 6 cards */}
        <section aria-label="Key market indicators">
          <h2 className="text-xl font-bold font-heading text-on-surface mb-5">Key Market Indicators</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              const isHighlight = "highlight" in card && card.highlight;
              const isPositive = "positive" in card ? card.positive : true;
              return (
                <div
                  key={card.label}
                  className="bg-surface-container-lowest rounded-2xl border border-primary/10 p-5 shadow-sm"
                >
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center mb-3 ${
                    isHighlight
                      ? isPositive
                        ? "bg-brand-primary-lighter text-[--color-success]"
                        : "bg-rose-50 text-rose-600"
                      : "bg-primary/5 text-primary"
                  }`}>
                    <Icon className="size-4" />
                  </div>
                  <p className="text-xs text-[--color-on-surface-variant] mb-1 leading-tight">{card.label}</p>
                  <p className={`text-2xl font-bold font-heading leading-none ${
                    isHighlight
                      ? isPositive
                        ? "text-[--color-success]"
                        : "text-rose-600"
                      : "text-on-surface"
                  }`}>
                    {card.value}
                  </p>
                  <p className="text-xs text-[--color-on-surface-variant] mt-1">{card.sub}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Price by Property Type */}
        <section aria-label="Price by property type">
          <h2 className="text-xl font-bold font-heading text-on-surface mb-5">
            Average Price by Property Type
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(["D", "S", "T", "F"] as const).map((code) => {
              const price = city_data.priceByType[code];
              const label = propertyTypeLabels[code];
              return (
                <div
                  key={code}
                  className="bg-surface-container-lowest rounded-2xl border border-primary/10 p-6 shadow-sm"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center mb-4">
                    <Building2 className="size-5 text-primary" />
                  </div>
                  <p className="text-sm text-[--color-on-surface-variant] mb-1">{label}</p>
                  <p className="text-2xl font-bold font-heading text-on-surface">
                    {formatPrice(price)}
                  </p>
                  <p className="text-xs text-[--color-on-surface-variant] mt-1">Average asking price</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Price Trend Chart */}
        <section aria-label="Price trend chart">
          <div className="bg-surface-container-lowest rounded-2xl border border-primary/10 p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold font-heading text-on-surface">
                  5-Year Price Trend
                </h2>
                <p className="text-sm text-[--color-on-surface-variant] mt-1">
                  Average property prices in {city_data.name} over time
                </p>
              </div>
              <div className="flex gap-2">
                {["All", "Flat", "Terraced"].map((type, i) => (
                  <span
                    key={type}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold cursor-pointer ${
                      i === 0
                        ? "bg-primary/10 text-primary"
                        : "text-[--color-on-surface-variant] hover:text-primary"
                    }`}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
            <AreaPriceTrendClient />
          </div>
        </section>

        {/* Data Attribution */}
        <div>
          <DataAttribution
            source="HM Land Registry"
            lastUpdated="March 2026"
            methodology="Price Paid Data — contains HM Land Registry data © Crown copyright and database right 2026. This data is licensed under the Open Government Licence v3.0."
          />
        </div>

        {/* Internal Links */}
        <section aria-label="Explore more">
          <h2 className="text-xl font-bold font-heading text-on-surface mb-5">Explore More</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InternalLinkCard
              title={`${city_data.name} Area Guide`}
              description="Schools, transport, local amenities and neighbourhood profiles"
              href={`/areas/${city_data.slug}`}
            />
            <InternalLinkCard
              title={`Sold Prices in ${city_data.name}`}
              description="Recent property transactions and historic price data"
              href={`/sold-prices/${city_data.slug}`}
            />
            <InternalLinkCard
              title="UK Market Trends"
              description="National and regional property market analysis and forecasts"
              href="/market-trends"
            />
          </div>
        </section>

        {/* Search CTA */}
        <section>
          <AreaSearchCTA areaName={city_data.name} citySlug={city_data.slug} variant="hero" />
        </section>

      </div>
    </>
  );
}
