import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  PoundSterling,
  Receipt,
  Home,
  Flame,
  Snowflake,
  ArrowRight,
  ChevronRight,
  Download,
  MapPin,
} from "lucide-react";
import { getRegionalTrends, getMarketKPIs, HOT_MARKETS, COLD_MARKETS, YIELD_RANKINGS } from "@/services/areas/market-trends-service";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { DataAttribution } from "@/components/areas/DataAttribution";
import { InternalLinkCard } from "@/components/areas/InternalLinkCard";

export const metadata: Metadata = {
  title: "UK Property Market Trends | Britestate",
  description:
    "Live UK property market data, regional price trends, and expert analysis. Track house prices, transaction volumes, and market indicators.",
  openGraph: {
    title: "UK Property Market Trends | Britestate",
    description:
      "Live UK property market data, regional price trends, and expert analysis. Track house prices, transaction volumes, and market indicators.",
    url: "https://britestate.co.uk/market-trends",
    siteName: "Britestate",
    type: "website",
  },
};

const KPI_ICONS: Record<string, typeof PoundSterling> = {
  "Avg. House Price": PoundSterling,
  "Monthly Transactions": Receipt,
  "Avg. Days to Sell": BarChart3,
  "Asking vs Sold Gap": Home,
};

const REGION_SELECTOR_LABELS = [
  "London",
  "South East",
  "South West",
  "East of England",
  "East Midlands",
  "West Midlands",
  "Yorkshire and the Humber",
  "North West",
  "North East",
  "Wales",
  "Scotland",
  "Northern Ireland",
];

const REGION_CITY_LINKS: Record<string, { city: string; href: string }> = {
  London: { city: "London", href: "/areas/london" },
  "South East": { city: "Brighton", href: "/areas/brighton" },
  "South West": { city: "Bristol", href: "/areas/bristol" },
  "East of England": { city: "Cambridge", href: "/areas/cambridge" },
  "East Midlands": { city: "Nottingham", href: "/areas/nottingham" },
  "West Midlands": { city: "Birmingham", href: "/areas/birmingham" },
  "Yorkshire and the Humber": { city: "Leeds", href: "/areas/leeds" },
  "North West": { city: "Manchester", href: "/areas/manchester" },
  "North East": { city: "Newcastle", href: "/areas/newcastle" },
  Wales: { city: "Cardiff", href: "/areas/cardiff" },
  Scotland: { city: "Edinburgh", href: "/areas/edinburgh" },
  "Northern Ireland": { city: "Belfast", href: "/areas/belfast" },
};

export default async function MarketTrendsPage() {
  const [regions, kpis] = await Promise.all([getRegionalTrends(), getMarketKPIs()]);

  // Build bar chart data from top 6 regions by price (descending)
  const sortedByPrice = [...regions].sort((a, b) => b.avgPrice - a.avgPrice);
  const top6 = sortedByPrice.slice(0, 6);
  const maxPrice = top6[0]?.avgPrice ?? 1;
  const barChartData = top6.map((r) => ({
    region: r.region.replace("Yorkshire and the Humber", "Yorkshire").replace("East of England", "East Eng.").replace(" Midlands", " Mid."),
    price: r.avgPriceFormatted,
    height: `${Math.round((r.avgPrice / maxPrice) * 100)}%`,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Market Trends", path: "/market-trends" },
            ])
          ),
        }}
      />

      {/* Header Section */}
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-2 text-sm text-[--color-on-surface-variant]">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-primary font-medium">Market Trends</span>
          </nav>
          <h1 className="font-heading text-3xl font-bold text-on-surface">
            UK Property Market Trends
          </h1>
          <p className="mt-1 text-[--color-on-surface-variant]">
            Real-time data from Land Registry &amp; ONS. Updated March 2026.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select className="appearance-none rounded-xl border border-primary/20 bg-surface-container-lowest px-4 py-2.5 pr-10 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20">
            <option>United Kingdom (National)</option>
            {REGION_SELECTOR_LABELS.map((region) => (
              <option key={region}>{region}</option>
            ))}
          </select>
          <button className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition-colors hover:bg-primary/90">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </header>

      {/* National Trends Link */}
      <div className="mb-6">
        <Link
          href="/market-trends/national"
          className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-xl px-4 py-2 font-semibold hover:bg-primary/20 transition-colors text-sm"
        >
          View UK National Trends <ArrowRight className="size-4" />
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="mb-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = KPI_ICONS[kpi.label] ?? PoundSterling;
          return (
            <div key={kpi.label} className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[--color-on-surface-variant]">
                  {kpi.label}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-bold font-heading text-on-surface">{kpi.value}</div>
              <div
                className={`mt-2 flex items-center gap-1 text-sm font-semibold ${
                  kpi.trend === "up"
                    ? "text-[--color-success]"
                    : kpi.trend === "down"
                      ? "text-error"
                      : "text-[--color-on-surface-variant]"
                }`}
              >
                {kpi.trend === "up" && <TrendingUp className="h-4 w-4" />}
                {kpi.trend === "down" && <TrendingDown className="h-4 w-4" />}
                {kpi.trend === "neutral" && <Minus className="h-4 w-4" />}
                <span>{kpi.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Data Attribution */}
      <DataAttribution
        source="HM Land Registry UK House Price Index, ONS"
        lastUpdated="March 2026"
        methodology="Median prices used for all averages"
        className="mb-8"
      />

      {/* Regional Selector Pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {REGION_SELECTOR_LABELS.map((region, i) => (
          <span
            key={region}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              i === 0
                ? "bg-primary text-white"
                : "bg-primary/5 text-[--color-on-surface-variant] hover:bg-primary/10 hover:text-primary"
            }`}
          >
            {region}
          </span>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Average Prices by Region Bar Chart */}
        <div className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-on-surface font-heading">Average Price by Region</h2>
            <Link
              href="#"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              View Details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex h-64 items-end justify-between gap-4 px-4">
            {barChartData.map((bar) => (
              <div key={bar.region} className="group flex flex-1 flex-col items-center gap-3">
                <div className="relative w-full rounded-t-md bg-primary/5" style={{ height: "100%" }}>
                  <div
                    className="absolute bottom-0 w-full rounded-t-md bg-primary/30 transition-colors group-hover:bg-primary"
                    style={{ height: bar.height }}
                  />
                  <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg bg-on-surface px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
                    {bar.price}
                  </div>
                </div>
                <span className="text-center text-[10px] font-bold uppercase tracking-tighter text-[--color-on-surface-variant]">
                  {bar.region}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hot/Cold Markets */}
        <div className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6">
          <h2 className="text-lg font-bold text-on-surface font-heading mb-6">Market Heat Index</h2>
          <div className="space-y-6">
            {/* Hot Zones */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-bold uppercase text-error">
                  <Flame className="h-4 w-4" /> Hot Zones
                </span>
                <span className="text-xs font-medium text-[--color-on-surface-variant]">Fastest Growth</span>
              </div>
              <div className="space-y-3">
                {HOT_MARKETS.slice(0, 3).map((market) => (
                  <div
                    key={market.city}
                    className="flex items-center justify-between rounded-xl bg-primary/5 p-3"
                  >
                    <span className="text-sm font-semibold text-on-surface">{market.city}</span>
                    <span className="inline-flex items-center rounded-full bg-brand-primary-lighter px-2.5 py-0.5 text-sm font-bold text-[--color-success]">
                      {market.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cold Zones */}
            <div className="border-t border-primary/5 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-bold uppercase text-brand-accent">
                  <Snowflake className="h-4 w-4" /> Cold Zones
                </span>
                <span className="text-xs font-medium text-[--color-on-surface-variant]">Stagnant</span>
              </div>
              <div className="space-y-3">
                {COLD_MARKETS.slice(0, 3).map((market) => (
                  <div
                    key={market.city}
                    className="flex items-center justify-between rounded-xl bg-primary/5 p-3"
                  >
                    <span className="text-sm font-semibold text-on-surface">{market.city}</span>
                    <span className="inline-flex items-center rounded-full bg-error-light px-2.5 py-0.5 text-sm font-bold text-error">
                      {market.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Data Tables Section */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Average Prices by Region Table */}
        <div className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6">
          <h2 className="text-lg font-bold text-on-surface font-heading mb-1">Average Prices by Region</h2>
          <p className="text-sm text-[--color-on-surface-variant] mb-5">Latest regional average house prices</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10">
                  <th className="pb-3 text-left font-semibold text-[--color-on-surface-variant]">Region</th>
                  <th className="pb-3 text-right font-semibold text-[--color-on-surface-variant]">Avg Price</th>
                  <th className="pb-3 text-right font-semibold text-[--color-on-surface-variant]">YoY Change</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((row) => (
                  <tr key={row.region} className="border-b border-primary/5 last:border-0 hover:bg-primary/5 transition-colors">
                    <td className="py-2.5 font-medium text-on-surface">{row.region}</td>
                    <td className="py-2.5 text-right text-on-surface">{row.avgPriceFormatted}</td>
                    <td className="py-2.5 text-right font-semibold text-[--color-success]">
                      {row.yoyChangeFormatted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction Volumes Table */}
        <div className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6">
          <h2 className="text-lg font-bold text-on-surface font-heading mb-1">Transaction Volumes</h2>
          <p className="text-sm text-[--color-on-surface-variant] mb-5">Annual completed sales by region</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10">
                  <th className="pb-3 text-left font-semibold text-[--color-on-surface-variant]">Region</th>
                  <th className="pb-3 text-right font-semibold text-[--color-on-surface-variant]">Volume (12m)</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((row) => (
                  <tr key={row.region} className="border-b border-primary/5 last:border-0 hover:bg-primary/5 transition-colors">
                    <td className="py-2.5 font-medium text-on-surface">{row.region}</td>
                    <td className="py-2.5 text-right text-on-surface">
                      {row.transactionsLast12m.toLocaleString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Time to Sell Table */}
        <div className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6">
          <h2 className="text-lg font-bold text-on-surface font-heading mb-1">Time to Sell</h2>
          <p className="text-sm text-[--color-on-surface-variant] mb-5">Average days on market by region</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10">
                  <th className="pb-3 text-left font-semibold text-[--color-on-surface-variant]">Region</th>
                  <th className="pb-3 text-right font-semibold text-[--color-on-surface-variant]">Avg Days</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((row) => (
                  <tr key={row.region} className="border-b border-primary/5 last:border-0 hover:bg-primary/5 transition-colors">
                    <td className="py-2.5 font-medium text-on-surface">{row.region}</td>
                    <td className="py-2.5 text-right text-on-surface">{row.avgDaysToSell}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asking vs Sold Price Gap Table */}
        <div className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6">
          <h2 className="text-lg font-bold text-on-surface font-heading mb-1">Asking vs Sold Price Gap</h2>
          <p className="text-sm text-[--color-on-surface-variant] mb-5">Difference between asking and final sale price</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10">
                  <th className="pb-3 text-left font-semibold text-[--color-on-surface-variant]">Region</th>
                  <th className="pb-3 text-right font-semibold text-[--color-on-surface-variant]">Gap %</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((row) => (
                  <tr key={row.region} className="border-b border-primary/5 last:border-0 hover:bg-primary/5 transition-colors">
                    <td className="py-2.5 font-medium text-on-surface">{row.region}</td>
                    <td className="py-2.5 text-right font-semibold text-error">
                      {row.askingVsSoldGapFormatted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SVG Charts */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-on-surface font-heading">Asking vs. Sold Price Trend</h2>
              <p className="text-sm text-[--color-on-surface-variant] mt-0.5">Market negotiation leverage indicator</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-[--color-on-surface-variant]">Asking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[--color-success]" />
                <span className="text-[--color-on-surface-variant]">Sold</span>
              </div>
            </div>
          </div>
          <div className="relative h-48 w-full">
            <svg
              className="h-full w-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 400 100"
            >
              <line className="text-primary/10" stroke="currentColor" strokeWidth="1" x1="0" x2="400" y1="0" y2="0" />
              <line className="text-primary/10" stroke="currentColor" strokeWidth="1" x1="0" x2="400" y1="50" y2="50" />
              <line className="text-primary/10" stroke="currentColor" strokeWidth="1" x1="0" x2="400" y1="100" y2="100" />
              <path d="M0,40 C50,30 100,50 150,45 S250,20 300,35 S400,25 400,25" fill="none" stroke="var(--color-brand-primary)" strokeWidth="2" />
              <path d="M0,50 C50,45 100,60 150,55 S250,35 300,45 S400,38 400,38" fill="none" stroke="var(--color-success)" strokeWidth="2" />
            </svg>
            <div className="mt-4 flex justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-[--color-on-surface-variant]">
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
            </div>
          </div>
        </div>

        {/* Monthly Transaction Volume Chart */}
        <div className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-on-surface font-heading">Monthly Transaction Volume</h2>
              <p className="text-sm text-[--color-on-surface-variant] mt-0.5">Total completed sales per month</p>
            </div>
            <span className="rounded-full bg-primary/5 text-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              YTD 2026
            </span>
          </div>
          <div className="relative h-48 w-full">
            <svg
              className="h-full w-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 400 100"
            >
              <defs>
                <linearGradient id="areaGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,80 Q50,60 100,75 T200,50 T300,70 T400,40 L400,100 L0,100 Z" fill="url(#areaGrad)" />
              <path d="M0,80 Q50,60 100,75 T200,50 T300,70 T400,40" fill="none" stroke="var(--color-brand-primary)" strokeWidth="3" />
            </svg>
            <div className="mt-4 flex justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-[--color-on-surface-variant]">
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
            </div>
          </div>
        </div>
      </div>

      {/* MoM and YoY Comparison Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6">
          <h2 className="text-lg font-bold text-on-surface font-heading mb-1">Month-on-Month Change</h2>
          <p className="text-sm text-[--color-on-surface-variant] mb-5">February 2026 vs March 2026</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-primary/5 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-[--color-on-surface-variant]">Avg Price</p>
              <p className="mt-1 text-xl font-bold text-on-surface">+1.2%</p>
              <div className="mt-1 flex items-center justify-center gap-1 text-sm text-[--color-success]">
                <TrendingUp className="h-3 w-3" />
                <span>£3,500</span>
              </div>
            </div>
            <div className="rounded-xl bg-primary/5 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-[--color-on-surface-variant]">Transactions</p>
              <p className="mt-1 text-xl font-bold text-on-surface">+5.5%</p>
              <div className="mt-1 flex items-center justify-center gap-1 text-sm text-[--color-success]">
                <TrendingUp className="h-3 w-3" />
                <span>+4,800</span>
              </div>
            </div>
            <div className="rounded-xl bg-primary/5 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-[--color-on-surface-variant]">Days to Sell</p>
              <p className="mt-1 text-xl font-bold text-on-surface">-1 day</p>
              <div className="mt-1 flex items-center justify-center gap-1 text-sm text-[--color-success]">
                <TrendingUp className="h-3 w-3" />
                <span>Faster</span>
              </div>
            </div>
            <div className="rounded-xl bg-primary/5 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-[--color-on-surface-variant]">Price Gap</p>
              <p className="mt-1 text-xl font-bold text-on-surface">-0.1%</p>
              <div className="mt-1 flex items-center justify-center gap-1 text-sm text-[--color-on-surface-variant]">
                <Minus className="h-3 w-3" />
                <span>Unchanged</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6">
          <h2 className="text-lg font-bold text-on-surface font-heading mb-1">Year-on-Year Change</h2>
          <p className="text-sm text-[--color-on-surface-variant] mb-5">March 2025 vs March 2026</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-primary/5 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-[--color-on-surface-variant]">Avg Price</p>
              <p className="mt-1 text-xl font-bold text-on-surface">+3.8%</p>
              <div className="mt-1 flex items-center justify-center gap-1 text-sm text-[--color-success]">
                <TrendingUp className="h-3 w-3" />
                <span>£10,900</span>
              </div>
            </div>
            <div className="rounded-xl bg-primary/5 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-[--color-on-surface-variant]">Transactions</p>
              <p className="mt-1 text-xl font-bold text-on-surface">+12%</p>
              <div className="mt-1 flex items-center justify-center gap-1 text-sm text-[--color-success]">
                <TrendingUp className="h-3 w-3" />
                <span>+9,900</span>
              </div>
            </div>
            <div className="rounded-xl bg-primary/5 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-[--color-on-surface-variant]">Days to Sell</p>
              <p className="mt-1 text-xl font-bold text-on-surface">-3 days</p>
              <div className="mt-1 flex items-center justify-center gap-1 text-sm text-[--color-success]">
                <TrendingUp className="h-3 w-3" />
                <span>Faster</span>
              </div>
            </div>
            <div className="rounded-xl bg-primary/5 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-[--color-on-surface-variant]">Price Gap</p>
              <p className="mt-1 text-xl font-bold text-on-surface">-0.3%</p>
              <div className="mt-1 flex items-center justify-center gap-1 text-sm text-[--color-success]">
                <TrendingUp className="h-3 w-3" />
                <span>Narrowing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Commentary Section */}
      <section className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-6 font-heading text-2xl font-bold text-on-surface">
            Expert Market Commentary
          </h2>
          <div className="overflow-hidden rounded-xl bg-surface-container-lowest border border-primary/10 shadow-sm">
            <div className="p-8">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                  Analysis
                </span>
                <span className="text-xs font-medium text-[--color-on-surface-variant]">8 Mar 2026</span>
              </div>
              <h3 className="mb-4 text-xl font-bold leading-tight text-on-surface font-heading">
                Spring 2026 Market Outlook: Sustained Growth Amid Evolving Buyer Confidence
              </h3>
              <div className="space-y-4 text-sm leading-relaxed text-[--color-on-surface-variant]">
                <p>
                  The UK property market enters spring 2026 in its strongest position in three
                  years. Average house prices have risen 3.8% year-on-year to reach
                  {"\u00a0"}£298,000, driven by a combination of stabilised mortgage rates, pent-up
                  demand from first-time buyers, and limited new housing supply. Transaction
                  volumes are up 12% compared to March 2025, signalling renewed confidence
                  across most regions.
                </p>
                <p>
                  Regional disparities remain pronounced. London continues to lag behind the
                  national average in price growth at just 2.1%, while cities such as Manchester
                  (+7.2%), Birmingham (+6.8%), and Leeds (+6.4%) are outperforming. The
                  East and West Midlands continue to offer the best value for buyers, with
                  average days to sell falling below the national average of 28 days. The North
                  West stands out with the fastest average sale time of just 24 days, driven by
                  strong demand in Manchester and Liverpool.
                </p>
                <p>
                  Looking ahead, the Bank of England&apos;s anticipated rate cut in Q2 2026 could
                  further stimulate demand. However, affordability remains a constraint in the
                  South East, where the asking-to-sold price gap of -2.1% suggests buyers
                  retain negotiating power. We expect continued moderate growth through H1 2026,
                  with the rental market also tightening as landlord supply continues to
                  contract in the face of higher regulatory requirements.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  MT
                </div>
                <div>
                  <div className="text-sm font-bold text-on-surface">Dr. Marcus Thorne</div>
                  <div className="text-xs text-[--color-on-surface-variant]">Chief Economist, Britestate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Local Authority Heat Rankings */}
        <div>
          <h2 className="mb-6 font-heading text-2xl font-bold text-on-surface">
            Local Authority Heat
          </h2>
          <div className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6">
            <div className="mb-6 flex border-b border-primary/5">
              <button className="flex-1 border-b-2 border-primary pb-3 text-sm font-bold text-primary">
                Highest Yield
              </button>
              <button className="flex-1 pb-3 text-sm font-bold text-[--color-on-surface-variant] hover:text-[--color-on-surface-variant] transition-colors">
                Fastest Sales
              </button>
            </div>
            <div className="space-y-4">
              {YIELD_RANKINGS.slice(0, 4).map((item) => {
                const barWidth = `${Math.round((item.yield / (YIELD_RANKINGS[0]?.yield ?? 10)) * 100)}%`;
                const rankLabel = item.rank.padStart(2, "0");
                return (
                  <div key={item.rank} className="flex items-center gap-4">
                    <div className="w-6 text-lg font-bold text-[--color-on-surface-variant]">{rankLabel}</div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-on-surface">{item.area}</div>
                      <div className="text-xs text-[--color-on-surface-variant]">
                        Yield: {item.yield}% &bull; {item.detail}
                      </div>
                    </div>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-primary/10">
                      <div className="h-full bg-[--color-success]" style={{ width: barWidth }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <Link
              href="#"
              className="mt-8 flex w-full items-center justify-center rounded-xl border border-primary/20 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
            >
              View Full Rankings
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Internal Region Links */}
      <section className="mb-8">
        <h2 className="mb-4 font-heading text-xl font-bold text-on-surface">
          Explore Area Guides by Region
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {regions.map((r) => {
            const cityLink = REGION_CITY_LINKS[r.region];
            if (!cityLink) return null;
            return (
              <InternalLinkCard
                key={r.region}
                title={`${r.region} Area Guide`}
                description={`Avg price ${r.avgPriceFormatted} · ${r.yoyChangeFormatted} YoY · Major city: ${cityLink.city}`}
                href={cityLink.href}
                icon={<MapPin className="size-5" />}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
