import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, TrendingUp, ArrowRight, Search } from "lucide-react";
import { getMarketKPIs } from "@/services/areas/market-trends-service";

export const metadata: Metadata = {
  title: "Browse UK Property Areas | Britestate",
  description:
    "Explore property markets across the UK. Find area guides, average prices, transport links, and local market insights for every city and borough.",
};

const UK_CITIES = [
  {
    slug: "london",
    name: "London",
    avgPrice: "725,400",
    change: "+4.2%",
    listings: "12,400",
    positive: true,
    description: "The UK's largest property market, from Zone 1 penthouses to outer-borough family homes.",
    highlight: "Most Popular",
    highlightColor: "bg-brand-primary",
  },
  {
    slug: "manchester",
    name: "Manchester",
    avgPrice: "284,600",
    change: "+6.8%",
    listings: "4,200",
    positive: true,
    description: "One of the UK's fastest-growing cities with strong rental yields and regeneration zones.",
    highlight: "Fastest Growing",
    highlightColor: "bg-brand-primary",
  },
  {
    slug: "birmingham",
    name: "Birmingham",
    avgPrice: "245,800",
    change: "+5.1%",
    listings: "3,800",
    positive: true,
    description: "The UK's second city — excellent value with major infrastructure investment underway.",
  },
  {
    slug: "edinburgh",
    name: "Edinburgh",
    avgPrice: "338,200",
    change: "+3.9%",
    listings: "1,900",
    positive: true,
    description: "Scotland's capital combines historic architecture with a vibrant modern property market.",
  },
  {
    slug: "bristol",
    name: "Bristol",
    avgPrice: "382,100",
    change: "+4.5%",
    listings: "2,100",
    positive: true,
    description: "A tech and creative hub with strong demand from professionals and families alike.",
  },
  {
    slug: "leeds",
    name: "Leeds",
    avgPrice: "258,300",
    change: "+5.7%",
    listings: "2,800",
    positive: true,
    description: "A major financial centre with excellent connectivity and a diverse housing stock.",
  },
  {
    slug: "oxford",
    name: "Oxford",
    avgPrice: "531,000",
    change: "+2.8%",
    listings: "980",
    positive: true,
    description: "Premium university city with strong rental demand and limited housing supply.",
  },
  {
    slug: "cambridge",
    name: "Cambridge",
    avgPrice: "548,400",
    change: "+3.2%",
    listings: "870",
    positive: true,
    description: "World-class university city with a booming tech sector driving property demand.",
  },
  {
    slug: "liverpool",
    name: "Liverpool",
    avgPrice: "201,500",
    change: "+7.2%",
    listings: "2,600",
    positive: true,
    description: "Exceptional rental yields and regeneration-driven capital growth across the waterfront.",
    highlight: "Best Yields",
    highlightColor: "bg-brand-primary-light",
  },
  {
    slug: "glasgow",
    name: "Glasgow",
    avgPrice: "189,600",
    change: "+6.1%",
    listings: "2,300",
    positive: true,
    description: "Scotland's largest city offering outstanding value and a vibrant cultural scene.",
  },
  {
    slug: "nottingham",
    name: "Nottingham",
    avgPrice: "221,400",
    change: "+4.8%",
    listings: "1,700",
    positive: true,
    description: "Strong student and professional rental demand underpins the local property market.",
  },
  {
    slug: "sheffield",
    name: "Sheffield",
    avgPrice: "214,200",
    change: "+5.3%",
    listings: "1,900",
    positive: true,
    description: "An affordable city with growing tech and creative industries and excellent green spaces.",
  },
] as const;

const FEATURED_AREAS = [
  { slug: "london/islington", name: "Islington", city: "London", avgPrice: "780,000", tag: "Trending" },
  { slug: "manchester/ancoats", name: "Ancoats", city: "Manchester", avgPrice: "295,000", tag: "New Builds" },
  { slug: "bristol/clifton", name: "Clifton", city: "Bristol", avgPrice: "520,000", tag: "Premium" },
  { slug: "edinburgh/leith", name: "Leith", city: "Edinburgh", avgPrice: "285,000", tag: "Regeneration" },
] as const;

export default async function AreasPage() {
  const kpis = await getMarketKPIs();

  return (
    <>
      {/* ── Hero ── */}
      <header className="bg-gradient-to-br from-brand-primary-dark to-brand-primary py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-heading leading-tight">
            Explore UK Property Areas
          </h1>
          <p className="text-lg text-neutral-300 mb-10 max-w-2xl mx-auto">
            In-depth area guides with average prices, market trends, transport links, schools, and local services — for every UK city and neighbourhood.
          </p>
          <div className="flex items-center bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-xl mx-auto p-1.5">
            <MapPin className="size-5 text-neutral-400 mx-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search a city, postcode or area..."
              className="flex-grow text-neutral-700 dark:text-neutral-200 bg-transparent py-3 pr-2 focus:outline-none text-base"
              readOnly
            />
            <button className="bg-brand-primary text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-brand-primary/90 transition-colors">
              <Search className="size-4" />
              Search
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">

        {/* ── Featured Neighbourhoods ── */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold font-heading">Trending Neighbourhoods</h2>
              <p className="text-neutral-500 mt-1">Areas seeing the highest search activity this month</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_AREAS.map((area) => (
              <Link
                key={area.slug}
                href={`/areas/${area.slug}`}
                className="group relative rounded-2xl overflow-hidden bg-neutral-800 aspect-[4/5] flex flex-col justify-end hover:shadow-xl transition-shadow"
              >
                <div className="absolute inset-0 bg-neutral-300 opacity-60 group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-x-0 top-4 px-4 flex justify-between items-start z-10">
                  <span className="bg-brand-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {area.tag}
                  </span>
                </div>
                <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pt-12">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">{area.city}</p>
                  <h3 className="text-white text-xl font-bold mb-1">{area.name}</h3>
                  <p className="text-white/80 text-sm">Avg. &pound;{area.avgPrice}</p>
                  <div className="mt-3 flex items-center gap-1 text-brand-primary text-sm font-semibold">
                    View area guide <ArrowRight className="size-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── UK Cities Grid ── */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl font-bold font-heading">Browse by City</h2>
            <p className="text-neutral-500 mt-1">
              Comprehensive property market data for every major UK city
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {UK_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/areas/${city.slug}`}
                className="group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                {/* City image placeholder */}
                <div className="relative rounded-xl overflow-hidden mb-5 h-36 bg-neutral-200 dark:bg-neutral-800">
                  {"highlight" in city && city.highlight && (
                    <span className={`absolute top-3 left-3 ${city.highlightColor} text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider z-10`}>
                      {city.highlight}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white">
                    <MapPin className="size-3.5" />
                    <span className="text-xs font-semibold">{city.listings} listings</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold font-heading">{city.name}</h3>
                  <div className="flex items-center gap-1 text-sm font-semibold text-success">
                    <TrendingUp className="size-3.5" />
                    {city.change}
                  </div>
                </div>

                <p className="text-neutral-500 text-sm mb-4 leading-relaxed">{city.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Avg Price</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">&pound;{city.avgPrice}</p>
                  </div>
                  <div className="flex items-center gap-1 text-brand-primary text-sm font-semibold group-hover:gap-2 transition-all">
                    View guide <ArrowRight className="size-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Market Overview Banner ── */}
        <section className="bg-brand-primary rounded-3xl p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center overflow-hidden relative">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -mr-36 -mt-36" />
          <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full -mb-24" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-heading">
              UK Property Market Report 2026
            </h2>
            <p className="text-white/80 mb-6 leading-relaxed">
              National prices up 4.8% year-on-year. Northern cities outperforming London for capital growth. Rental demand at record highs.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/market-trends"
                className="inline-flex items-center gap-2 bg-white text-brand-primary px-6 py-3 rounded-xl font-bold hover:bg-neutral-100 transition-colors"
              >
                View Market Trends <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/sold-prices"
                className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/30 px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors"
              >
                Sold Prices <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">{kpi.label}</p>
                <p className="text-white text-xl font-bold">{kpi.value}</p>
                <p className="text-white/70 text-xs mt-0.5">{kpi.change}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </>
  );
}
