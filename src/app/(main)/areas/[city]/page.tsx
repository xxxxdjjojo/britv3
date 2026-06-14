import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  TrendingUp,
  MapPin,
  Train,
  Zap,
  Wifi,
  GraduationCap,
  ShoppingBag,
  Trees,
  ArrowRight,
} from "lucide-react";
import { AreaPriceTrendClient } from "@/components/charts/AreaPriceTrendClient";
import { getCityData, getAllCitySlugs, getNeighbourhoodsForCityData } from "@/services/areas/area-data-service";
import { cityPlaceJsonLd } from "@/lib/seo/area-jsonld";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { AreaSearchCTA } from "@/components/areas/AreaSearchCTA";
import { DataAttribution } from "@/components/areas/DataAttribution";
import { InternalLinkCard } from "@/components/areas/InternalLinkCard";

export const revalidate = 86400;

export async function generateStaticParams() {
  return getAllCitySlugs().map((city) => ({ city }));
}

type CityPageProps = Readonly<{ params: Promise<{ city: string }> }>;

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city } = await params;
  const data = await getCityData(city);
  if (!data) {
    return { title: "Area Not Found | Britestate" };
  }
  const title = `${data.name} Property Guide — House Prices, Schools & Area Info | Britestate`;
  const description = `Explore ${data.name} property market data. Average price ${data.avgPriceFormatted} (${data.yoyChangeFormatted} YoY), ${data.activeListings.toLocaleString()} active listings. Schools, transport and local area info.`;
  return {
    title,
    description,
    alternates: { canonical: `/areas/${data.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

const LOCAL_SERVICES = [
  { icon: ShoppingBag, label: "Shops & Retail" },
  { icon: GraduationCap, label: "Schools" },
  { icon: Train, label: "Transport" },
  { icon: Trees, label: "Green Spaces" },
  { icon: Wifi, label: "Connectivity" },
  { icon: Zap, label: "Utilities" },
];

export default async function CityAreaGuidePage({ params }: CityPageProps) {
  const { city } = await params;

  if (city !== city.toLowerCase()) {
    redirect(`/areas/${city.toLowerCase()}`);
  }

  const city_data = await getCityData(city);
  if (!city_data) notFound();

  const neighbourhoods = await getNeighbourhoodsForCityData(city);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cityPlaceJsonLd(city_data)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Areas", path: "/areas" },
              { name: city_data.name, path: `/areas/${city_data.slug}` },
            ])
          ),
        }}
      />

      {/* ── Hero (70vh) ── */}
      <header className="relative min-h-[70vh] flex flex-col justify-end overflow-hidden">
        {/* Background image placeholder */}
        <div className="absolute inset-0 bg-neutral-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-6 text-sm text-white/80" aria-label="Breadcrumb">
            <Link href="/areas" className="hover:text-white">Guides</Link>
            <span>/</span>
            <Link href="/areas" className="hover:text-white">United Kingdom</Link>
            <span>/</span>
            <span className="text-white font-medium">{city_data.name}</span>
          </nav>

          <h1 className="font-heading text-[60px] leading-none font-bold text-white mb-4 max-md:text-[40px]">
            {city_data.name}
          </h1>
          <p className="text-lg text-white/90 mb-10 max-w-xl">{city_data.description}</p>

          {/* Floating search bar */}
          <div className="bg-white rounded-2xl shadow-xl px-6 py-4 flex items-center gap-4 max-w-2xl">
            <MapPin className="size-5 text-neutral-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={`Search areas in ${city_data.name}...`}
              className="flex-1 text-neutral-700 outline-none text-sm"
              readOnly
            />
            <Link
              href={`/search?city=${city_data.slug}`}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              Search
            </Link>
          </div>
        </div>
      </header>

      {/* ── Stats Bar (3 cards) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              label: "Avg Property Price",
              value: city_data.avgPriceFormatted,
              sub: city_data.yoyChangeFormatted,
              subIcon: true,
            },
            {
              label: "Active Listings",
              value: city_data.activeListings.toLocaleString(),
              sub: "Properties available now",
              subIcon: false,
            },
            {
              label: "Avg Days to Sell",
              value: `${city_data.avgDaysToSell} days`,
              sub: "Faster than UK avg",
              subIcon: false,
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-primary/10 p-6">
              <p className="text-sm text-neutral-500 mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-primary font-heading">{stat.value}</p>
              {stat.subIcon ? (
                <p className="text-success font-bold flex items-center gap-1 mt-1 text-sm">
                  <TrendingUp className="size-4" /> {stat.sub} YoY
                </p>
              ) : (
                <p className="text-sm text-neutral-400 mt-1">{stat.sub}</p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <DataAttribution source="HM Land Registry" lastUpdated="March 2026" methodology="Median prices" />
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 pb-24">

        {/* ── 5-Year Price Trend ── */}
        <section>
          <div className="bg-white rounded-xl shadow-sm border border-primary/10 p-8">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold font-heading text-neutral-900">5-Year Price Trend</h2>
                <p className="text-sm text-neutral-500 mt-1">Average property prices in {city_data.name}</p>
              </div>
              {/* Property type toggle pills */}
              <div className="flex gap-2">
                {["All", "Flat", "Terraced"].map((type, i) => (
                  <span
                    key={type}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold cursor-pointer ${
                      i === 0
                        ? "bg-primary/10 text-primary"
                        : "text-neutral-400 hover:text-primary"
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

        {/* ── Popular Boroughs (4-col grid) ── */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-3xl font-bold font-heading">Popular Boroughs</h2>
            <Link
              href={`/areas/${city_data.slug}/all`}
              className="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all text-sm"
            >
              View all boroughs <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {(city_data.boroughs.length > 0 ? city_data.boroughs : neighbourhoods.slice(0, 4).map((n) => ({
              name: n.name,
              slug: n.slug,
              avgPrice: n.avgPriceFormatted,
              description: n.description,
            }))).slice(0, 4).map((borough) => (
              <Link
                key={borough.name}
                href={`/areas/${city_data.slug}/${borough.slug}`}
                className="group border border-primary/10 bg-white rounded-xl p-4 hover:shadow-md transition-all"
              >
                {/* Image placeholder */}
                <div className="h-24 w-full rounded-lg overflow-hidden bg-neutral-200 mb-3 group-hover:scale-[1.02] transition-transform duration-300" />
                <p className="font-bold text-neutral-900">{borough.name}</p>
                <p className="text-sm text-neutral-500">Avg {borough.avgPrice}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Properties For Sale ── */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold font-heading">Properties For Sale</h2>
          </div>
          <AreaSearchCTA areaName={city_data.name} citySlug={city_data.slug} variant="hero" />
        </section>

        {/* ── Transport & Connectivity ── */}
        <section className="bg-primary text-white p-8 lg:p-12 rounded-xl">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl font-bold font-heading mb-4">Transport &amp; Connectivity</h2>
              <p className="text-white/80 mb-8 leading-relaxed">
                {city_data.name}&apos;s transport network provides outstanding connectivity across the region,
                with multiple options for commuters and travellers.
              </p>
              <div className="space-y-3">
                {city_data.transport.slice(0, 3).map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/80">{item.name}</span>
                      <span className="font-bold">{item.detail}</span>
                    </div>
                    <div className="bg-white/10 rounded-full h-1">
                      <div
                        className="bg-white/60 h-1 rounded-full"
                        style={{ width: "70%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 content-start">
              {city_data.transport.slice(0, 4).map((item) => (
                <div
                  key={item.name}
                  className="bg-white/10 border border-white/10 rounded-lg p-4"
                >
                  <Train className="size-5 mb-2 text-white/70" />
                  <p className="font-bold text-sm">{item.name}</p>
                  <p className="text-xs text-white/60">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Local Services (6-icon grid) ── */}
        <section>
          <h2 className="text-3xl font-bold font-heading mb-8">Local Services</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {LOCAL_SERVICES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="group bg-white rounded-xl p-6 shadow-sm border border-primary/10 hover:border-primary transition-all text-center"
              >
                <div className="h-12 w-12 rounded-full bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center mx-auto mb-3">
                  <Icon className="size-5" />
                </div>
                <p className="text-sm font-bold text-neutral-800">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Internal Links ── */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold mb-6">Explore More</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InternalLinkCard
              title={`Sold Prices in ${city_data.name}`}
              description="Recent property transactions and price history"
              href={`/sold-prices/${city_data.slug}`}
            />
            <InternalLinkCard
              title={`${city_data.name} Statistics`}
              description="Detailed price breakdowns and market data"
              href={`/areas/${city_data.slug}/stats`}
            />
            <InternalLinkCard
              title="UK Market Trends"
              description="National and regional property market analysis"
              href="/market-trends"
            />
          </div>
        </section>

        {/* ── Newsletter CTA ── */}
        <section className="rounded-3xl bg-primary text-white p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
              Stay ahead of the {city_data.name} market
            </h2>
            <p className="text-white/80 mb-8">
              Weekly price alerts, off-market opportunities and investment insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-xl bg-white/10 text-white placeholder-white/50 border border-white/20 outline-none"
              />
              <button className="bg-white text-primary font-bold px-8 py-4 rounded-xl hover:bg-neutral-100 transition-colors">
                Join the Waitlist
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
