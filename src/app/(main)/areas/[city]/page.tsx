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
      <header className="relative min-h-[65vh] flex flex-col justify-end overflow-hidden bg-brand-primary">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-1/4 left-1/3 size-64 rounded-full bg-white/5" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-8 text-sm text-white/60" aria-label="Breadcrumb">
            <Link href="/areas" className="hover:text-white transition-colors">Guides</Link>
            <span>/</span>
            <Link href="/areas" className="hover:text-white transition-colors">United Kingdom</Link>
            <span>/</span>
            <span className="text-white font-semibold">{city_data.name}</span>
          </nav>

          <h1 className="font-heading text-[56px] leading-none font-black text-white mb-5 max-md:text-[40px]" style={{ letterSpacing: "-0.02em" }}>
            {city_data.name}
          </h1>
          <p className="text-lg text-white/75 mb-10 max-w-xl leading-relaxed">{city_data.description}</p>

          {/* Glassmorphism search bar */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 flex items-center gap-4 max-w-2xl shadow-xl">
            <MapPin className="size-5 text-white/50 flex-shrink-0" />
            <input
              type="text"
              placeholder={`Search areas in ${city_data.name}...`}
              className="flex-1 text-white placeholder-white/40 bg-transparent outline-none text-sm"
              readOnly
            />
            <Link
              href={`/search?city=${city_data.slug}`}
              className="bg-white text-brand-primary px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[--color-surface-container-low] transition-colors flex-shrink-0"
            >
              Search
            </Link>
          </div>
        </div>
      </header>

      {/* ── Stats Bar (3 cards) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div key={stat.label} className="bg-surface-container-lowest rounded-2xl shadow-md p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[--color-on-surface-variant] mb-2">{stat.label}</p>
              <p className="text-3xl font-black text-brand-primary font-heading">{stat.value}</p>
              {stat.subIcon ? (
                <p className="text-[--color-success] font-bold flex items-center gap-1 mt-1.5 text-sm">
                  <TrendingUp className="size-4" /> {stat.sub} YoY
                </p>
              ) : (
                <p className="text-sm text-[--color-on-surface-variant] mt-1.5">{stat.sub}</p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3">
          <DataAttribution source="HM Land Registry" lastUpdated="March 2026" methodology="Median prices" />
        </div>
      </section>

      <main className="bg-surface-container-lowest max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 pb-28">

        {/* ── 5-Year Price Trend ── */}
        <section>
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-8">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-1">Price Trends</p>
                <h2 className="text-xl font-black font-heading text-on-surface" style={{ letterSpacing: "-0.02em" }}>5-Year Price Trend</h2>
                <p className="text-sm text-[--color-on-surface-variant] mt-1">Average property prices in {city_data.name}</p>
              </div>
              {/* Property type toggle pills */}
              <div className="flex gap-2">
                {["All", "Flat", "Terraced"].map((type, i) => (
                  <span
                    key={type}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold cursor-pointer transition-colors ${
                      i === 0
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "text-[--color-on-surface-variant] hover:text-brand-primary"
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
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-2">Explore Local Areas</p>
              <h2 className="text-3xl font-black font-heading" style={{ letterSpacing: "-0.02em" }}>Popular Boroughs</h2>
            </div>
            <Link
              href={`/areas/${city_data.slug}/all`}
              className="text-brand-primary font-bold flex items-center gap-1 hover:gap-2 transition-all text-sm"
            >
              View all boroughs <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {(city_data.boroughs.length > 0 ? city_data.boroughs : neighbourhoods.slice(0, 4).map((n) => ({
              name: n.name,
              slug: n.slug,
              avgPrice: n.avgPriceFormatted,
              description: n.description,
            }))).slice(0, 4).map((borough) => (
              <Link
                key={borough.name}
                href={`/areas/${city_data.slug}/${borough.slug}`}
                className="group bg-surface-container-lowest rounded-2xl p-4 hover:shadow-md transition-all"
              >
                {/* Image placeholder */}
                <div className="h-24 w-full rounded-xl overflow-hidden bg-surface-container-low mb-3 group-hover:scale-[1.02] transition-transform duration-300" />
                <p className="font-black text-on-surface font-heading">{borough.name}</p>
                <p className="text-sm text-[--color-on-surface-variant] mt-0.5">Avg {borough.avgPrice}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Properties For Sale ── */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-2">Browse</p>
              <h2 className="text-3xl font-black font-heading" style={{ letterSpacing: "-0.02em" }}>Properties For Sale</h2>
            </div>
          </div>
          <AreaSearchCTA areaName={city_data.name} citySlug={city_data.slug} variant="hero" />
        </section>

        {/* ── Transport & Connectivity ── */}
        <section className="bg-brand-primary text-white p-8 lg:p-12 rounded-3xl overflow-hidden relative">
          <div className="pointer-events-none absolute top-0 right-0 size-72 rounded-full bg-white/5 -mr-36 -mt-36" />
          <div className="pointer-events-none absolute bottom-0 left-0 size-48 rounded-full bg-white/5 -ml-24 -mb-24" />
          <div className="relative z-10 grid lg:grid-cols-2 gap-10">
            <div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Getting Around</p>
              <h2 className="text-2xl font-black font-heading mb-4" style={{ letterSpacing: "-0.02em" }}>Transport &amp; Connectivity</h2>
              <p className="text-white/75 mb-8 leading-relaxed">
                {city_data.name}&apos;s transport network provides outstanding connectivity across the region,
                with multiple options for commuters and travellers.
              </p>
              <div className="space-y-4">
                {city_data.transport.slice(0, 3).map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-white/75">{item.name}</span>
                      <span className="font-bold text-white">{item.detail}</span>
                    </div>
                    <div className="bg-white/10 rounded-full h-1.5">
                      <div className="bg-white/50 h-1.5 rounded-full" style={{ width: "70%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 content-start">
              {city_data.transport.slice(0, 4).map((item) => (
                <div key={item.name} className="bg-white/10 border border-white/10 rounded-2xl p-5">
                  <Train className="size-5 mb-3 text-white/60" />
                  <p className="font-bold text-sm">{item.name}</p>
                  <p className="text-xs text-white/50 mt-0.5">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Local Services (6-icon grid) ── */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">Amenities</p>
          <h2 className="text-3xl font-black font-heading mb-8" style={{ letterSpacing: "-0.02em" }}>Local Services</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {LOCAL_SERVICES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="group bg-surface-container-lowest rounded-2xl p-6 hover:shadow-md transition-all text-center cursor-default"
              >
                <div className="size-12 rounded-2xl bg-brand-primary/5 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors flex items-center justify-center mx-auto mb-3">
                  <Icon className="size-5" />
                </div>
                <p className="text-sm font-bold text-on-surface">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Internal Links ── */}
        <section>
          <h2 className="text-2xl font-black font-heading mb-6" style={{ letterSpacing: "-0.02em" }}>Explore More</h2>
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
        <section className="rounded-3xl bg-brand-primary text-white p-10 md:p-14 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Stay Informed</p>
            <h2 className="text-3xl md:text-4xl font-black font-heading mb-4 leading-tight" style={{ letterSpacing: "-0.02em" }}>
              Stay ahead of the {city_data.name} market
            </h2>
            <p className="text-white/75 mb-8 leading-relaxed">
              Weekly price alerts, off-market opportunities and investment insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/15 outline-none"
              />
              <button className="bg-white text-brand-primary font-bold px-8 py-4 rounded-xl hover:bg-[--color-surface-container-low] transition-colors">
                Join the Waitlist
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
