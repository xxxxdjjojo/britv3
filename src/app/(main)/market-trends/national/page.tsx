import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, TrendingUp } from "lucide-react";
import { getNationalTrends, getRegionalTrends } from "@/services/areas/market-trends-service";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { safeJsonLd } from "@/lib/seo/safe-json-ld";
import { DataAttribution } from "@/components/areas/DataAttribution";
import { InternalLinkCard } from "@/components/areas/InternalLinkCard";
import { HistoricalPriceChartClient } from "@/components/charts/HistoricalPriceChartClient";

export const metadata: Metadata = {
  title: "UK House Prices & National Market Trends 2026 | Britestate",
  description:
    "Explore UK national property market data: average house prices, regional comparisons, first-time buyer stats and historical price trends from 1995 to 2026.",
  openGraph: {
    title: "UK House Prices & National Market Trends 2026 | Britestate",
    description:
      "Live UK property market data: average prices, transactions, affordability ratios and 30-year historical trends.",
    url: "https://britestate.co.uk/market-trends/national",
    siteName: "Britestate",
    type: "website",
  },
};

const REGION_CITY_MAP: Record<string, string> = {
  "london": "london",
  "south-east": "brighton",
  "south-west": "bristol",
  "east-of-england": "cambridge",
  "east-midlands": "nottingham",
  "west-midlands": "birmingham",
  "yorkshire-and-the-humber": "leeds",
  "north-west": "manchester",
  "north-east": "newcastle",
  "wales": "cardiff",
  "scotland": "edinburgh",
  "northern-ireland": "belfast",
};

export default async function NationalMarketTrendsPage() {
  const [national, regions] = await Promise.all([getNationalTrends(), getRegionalTrends()]);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Market Trends", path: "/market-trends" },
    { name: "National", path: "/market-trends/national" },
  ]);

  const formatNumber = (n: number) => n.toLocaleString("en-GB");
  const formatPrice = (n: number) => `£${(n / 1000).toFixed(0)}k`;

  return (
    <div className="bg-[#faf9f8] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />

      {/* ── Page Hero ── */}
      <header className="bg-brand-primary relative overflow-hidden pt-14 pb-20 px-4">
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 size-72 rounded-full bg-white/5" />
        <div className="relative z-10 max-w-7xl mx-auto sm:px-6 lg:px-8 pb-10">
          <nav className="mb-6 text-xs text-white/60" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li>/</li>
              <li><Link href="/market-trends" className="hover:text-white transition-colors">Market Trends</Link></li>
              <li>/</li>
              <li className="text-white font-semibold">National</li>
            </ol>
          </nav>
          <span className="inline-block bg-white/10 text-white/75 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">National Overview</span>
          <h1 className="text-[2.5rem] sm:text-[3.5rem] font-black text-white font-heading leading-none mb-4" style={{ letterSpacing: "-0.02em" }}>
            UK National Property Market
          </h1>
          <p className="text-white/70 text-base max-w-2xl">
            Comprehensive data on UK house prices, transaction volumes, affordability and regional trends — updated monthly.
          </p>
          <div className="mt-4">
            <DataAttribution
              source="Halifax, Nationwide, HMRC, Land Registry"
              lastUpdated="March 2026"
              className="text-white/40"
            />
          </div>
        </div>
      </header>

      {/* National KPI row */}
      <section className="max-w-7xl mx-auto px-6 -mt-8 relative z-10 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "UK Avg Price", value: national.avgPriceFormatted, sub: national.yoyChangeFormatted + " YoY", up: national.yoyChange >= 0 },
            { label: "YoY Change", value: national.yoyChangeFormatted, sub: "Annual growth", up: national.yoyChange >= 0 },
            { label: "Monthly Transactions", value: formatNumber(national.monthlyTransactions), sub: "Completions", up: true },
            { label: "Avg Days to Sell", value: String(national.avgDaysToSell), sub: "Across all regions", up: false },
            { label: "Affordability Ratio", value: String(national.affordabilityRatio) + "×", sub: "Price-to-income", up: false },
            { label: "Active Listings", value: formatNumber(national.activeListings), sub: "On market now", up: true },
          ].map(({ label, value, sub, up }) => (
            <div
              key={label}
              className="bg-white rounded-2xl shadow-md p-4 flex flex-col gap-1"
            >
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{label}</span>
              <span className="text-xl font-black text-neutral-950 font-heading leading-none mt-1">{value}</span>
              <span className={`text-xs font-semibold mt-0.5 ${up ? "text-emerald-600" : "text-red-500"}`}>{sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* First-Time Buyer stats */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-2">Getting on the Ladder</p>
        <h2 className="text-xl font-black text-neutral-950 font-heading mb-5" style={{ letterSpacing: "-0.02em" }}>First-Time Buyers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Avg FTB Price", value: `£${formatNumber(national.ftbAvgPrice)}` },
            { label: "Avg Deposit Required", value: `£${formatNumber(national.ftbAvgDeposit)}` },
            { label: "Avg FTB Age", value: `${national.ftbAvgAge} years old` },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-1"
            >
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{label}</span>
              <span className="text-2xl font-black text-brand-primary font-heading mt-1">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Historical price chart */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-1">Long-Term Trend</p>
              <h2 className="text-xl font-black text-neutral-950 font-heading" style={{ letterSpacing: "-0.02em" }}>
                UK Average House Price: 1995–2026
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">Nominal prices, not inflation-adjusted</p>
            </div>
          </div>
          <HistoricalPriceChartClient data={national.historicalPrices} />
          <DataAttribution
            source="Halifax HPI, Nationwide HPI, Land Registry UK HPI"
            methodology="Mix-adjusted average"
            className="mt-3"
          />
        </div>
      </section>

      {/* Regional comparison table */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-2">By Region</p>
        <h2 className="text-xl font-black text-neutral-950 font-heading mb-5" style={{ letterSpacing: "-0.02em" }}>Regional Comparison</h2>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f4f3f2] bg-[#faf9f8]">
                  <th className="text-left px-4 py-3 font-bold text-neutral-500 text-xs uppercase tracking-wider">Region</th>
                  <th className="text-right px-4 py-3 font-bold text-neutral-500 text-xs uppercase tracking-wider">Avg Price</th>
                  <th className="text-right px-4 py-3 font-bold text-neutral-500 text-xs uppercase tracking-wider">YoY</th>
                  <th className="text-right px-4 py-3 font-bold text-neutral-500 text-xs uppercase tracking-wider hidden sm:table-cell">Transactions</th>
                  <th className="text-right px-4 py-3 font-bold text-neutral-500 text-xs uppercase tracking-wider hidden md:table-cell">Days to Sell</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r, i) => {
                  const citySlug = REGION_CITY_MAP[r.slug] ?? r.slug;
                  return (
                    <tr
                      key={r.slug}
                      className={`border-b border-[#f4f3f2] last:border-0 hover:bg-brand-primary/5 transition-colors ${i % 2 === 0 ? "" : "bg-[#faf9f8]/60"}`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/areas/${citySlug}`}
                          className="font-semibold text-neutral-950 hover:text-brand-primary transition-colors"
                        >
                          {r.region}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-neutral-800">
                        {r.avgPriceFormatted}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${r.yoyChange >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {r.yoyChangeFormatted}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-500 hidden sm:table-cell">
                        {formatNumber(r.transactionsLast12m)}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-500 hidden md:table-cell">
                        {r.avgDaysToSell} days
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <DataAttribution source="HMRC, Land Registry" lastUpdated="March 2026" className="mt-2" />
      </section>

      {/* Data sources */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-xl font-black font-heading mb-5" style={{ letterSpacing: "-0.02em" }}>Data Sources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ["Halifax House Price Index", "Monthly, released mid-month"],
            ["Nationwide House Price Index", "Monthly, released end-of-month"],
            ["HMRC Transaction Data", "Monthly, 1-month lag"],
            ["HM Land Registry UK HPI", "Monthly, 2-month lag"],
          ].map(([title, desc]) => (
            <div key={title} className="bg-white rounded-2xl p-5 text-sm">
              <p className="font-bold text-neutral-950">{title}</p>
              <p className="text-neutral-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Internal links */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-xl font-black font-heading mb-5" style={{ letterSpacing: "-0.02em" }}>Explore More</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InternalLinkCard
            href="/market-trends"
            title="Regional Market Trends"
            description="Compare performance across all UK regions"
            icon={<TrendingUp className="size-5" />}
          />
          <InternalLinkCard
            href="/areas"
            title="Area Guides Hub"
            description="Explore local insights for hundreds of UK areas"
            icon={<MapPin className="size-5" />}
          />
        </div>
      </section>
    </div>
  );
}
