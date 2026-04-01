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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="max-w-7xl mx-auto px-6 pt-6 pb-2 text-sm text-[--color-on-surface-variant]" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
          <li>/</li>
          <li><Link href="/market-trends" className="hover:text-primary transition-colors">Market Trends</Link></li>
          <li>/</li>
          <li className="text-on-surface font-medium">National</li>
        </ol>
      </nav>

      {/* Header */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold font-heading text-on-surface tracking-tight">
              UK National Property Market
            </h1>
            <p className="mt-2 text-[--color-on-surface-variant] text-sm max-w-2xl">
              Comprehensive data on UK house prices, transaction volumes, affordability and regional trends — updated monthly.
            </p>
          </div>
          <DataAttribution
            source="Halifax, Nationwide, HMRC, Land Registry"
            lastUpdated="March 2026"
            className="sm:text-right"
          />
        </div>
      </section>

      {/* National KPI row */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
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
              className="bg-surface-container-lowest border border-primary/10 rounded-xl p-4 shadow-sm flex flex-col gap-1"
            >
              <span className="text-[11px] text-[--color-on-surface-variant] font-semibold uppercase tracking-wide">{label}</span>
              <span className="text-xl font-bold font-heading text-on-surface leading-none">{value}</span>
              <span className={`text-xs font-semibold ${up ? "text-[--color-success]" : "text-red-500"}`}>{sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* First-Time Buyer stats */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        <h2 className="text-xl font-bold font-heading text-on-surface mb-4">First-Time Buyers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Avg FTB Price", value: `£${formatNumber(national.ftbAvgPrice)}` },
            { label: "Avg Deposit Required", value: `£${formatNumber(national.ftbAvgDeposit)}` },
            { label: "Avg FTB Age", value: `${national.ftbAvgAge} years old` },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-primary/5 border border-primary/10 rounded-xl p-5 flex flex-col gap-1"
            >
              <span className="text-xs text-[--color-on-surface-variant] font-medium uppercase tracking-wide">{label}</span>
              <span className="text-2xl font-extrabold text-primary">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Historical price chart */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <div className="bg-surface-container-lowest border border-primary/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-on-surface">
                UK Average House Price: 1995–2026
              </h2>
              <p className="text-xs text-[--color-on-surface-variant] mt-0.5">Nominal prices, not inflation-adjusted</p>
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
        <h2 className="text-xl font-bold font-heading text-on-surface mb-4">Regional Comparison</h2>
        <div className="bg-surface-container-lowest border border-primary/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-primary/5">
                  <th className="text-left px-4 py-3 font-semibold text-[--color-on-surface-variant] text-[--color-on-surface-variant]">Region</th>
                  <th className="text-right px-4 py-3 font-semibold text-[--color-on-surface-variant] text-[--color-on-surface-variant]">Avg Price</th>
                  <th className="text-right px-4 py-3 font-semibold text-[--color-on-surface-variant] text-[--color-on-surface-variant]">YoY</th>
                  <th className="text-right px-4 py-3 font-semibold text-[--color-on-surface-variant] text-[--color-on-surface-variant] hidden sm:table-cell">Transactions</th>
                  <th className="text-right px-4 py-3 font-semibold text-[--color-on-surface-variant] text-[--color-on-surface-variant] hidden md:table-cell">Days to Sell</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r, i) => {
                  const citySlug = REGION_CITY_MAP[r.slug] ?? r.slug;
                  return (
                    <tr
                      key={r.slug}
                      className={`border-b border-primary/5 last:border-0 hover:bg-primary/5 transition-colors ${i % 2 === 0 ? "" : "bg-[#faf9f8]"}`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/areas/${citySlug}`}
                          className="font-semibold text-on-surface hover:text-primary transition-colors"
                        >
                          {r.region}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-on-surface text-on-surface">
                        {r.avgPriceFormatted}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${r.yoyChange >= 0 ? "text-[--color-success]" : "text-red-500"}`}>
                        {r.yoyChangeFormatted}
                      </td>
                      <td className="px-4 py-3 text-right text-[--color-on-surface-variant] text-[--color-on-surface-variant] hidden sm:table-cell">
                        {formatNumber(r.transactionsLast12m)}
                      </td>
                      <td className="px-4 py-3 text-right text-[--color-on-surface-variant] text-[--color-on-surface-variant] hidden md:table-cell">
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
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold font-heading mb-4 text-on-surface">Data Sources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[--color-on-surface-variant]">
          <div><strong>Halifax House Price Index</strong> — Monthly, released mid-month</div>
          <div><strong>Nationwide House Price Index</strong> — Monthly, released end-of-month</div>
          <div><strong>HMRC Transaction Data</strong> — Monthly, 1-month lag</div>
          <div><strong>HM Land Registry UK HPI</strong> — Monthly, 2-month lag</div>
        </div>
      </section>

      {/* Internal links */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-xl font-bold font-heading mb-4 text-on-surface">Explore More</h2>
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
    </>
  );
}
