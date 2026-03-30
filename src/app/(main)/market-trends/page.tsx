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
    <div className="bg-[#faf9f8] min-h-screen">
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

      {/* ── Page Hero ── */}
      <header className="bg-brand-primary relative overflow-hidden pt-14 px-4 pb-20">
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 size-64 rounded-full bg-white/5" />
        <div className="relative z-10 max-w-7xl mx-auto sm:px-6 lg:px-8">
          <nav className="mb-6 flex text-sm text-white/60">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-white font-semibold">Market Trends</span>
          </nav>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-block bg-white/10 text-white/75 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">Live Data</span>
              <h1 className="font-heading text-[2.5rem] md:text-[3.5rem] font-black text-white leading-none" style={{ letterSpacing: "-0.02em" }}>
                UK Property Market Trends
              </h1>
              <p className="mt-3 text-white/70 max-w-xl">
                Real-time data from Land Registry &amp; ONS. Updated March 2026.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <select className="appearance-none rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 pr-10 text-sm font-medium text-white outline-none backdrop-blur-sm focus:border-white/30">
                <option>United Kingdom (National)</option>
                {REGION_SELECTOR_LABELS.map((region) => (
                  <option key={region}>{region}</option>
                ))}
              </select>
              <button className="flex items-center gap-2 rounded-xl bg-white text-brand-primary px-5 py-2.5 font-bold text-sm transition-colors hover:bg-neutral-50">
                <Download className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 py-8">

        {/* National Trends Link */}
        <div className="-mt-10 relative z-10">
          <Link
            href="/market-trends/national"
            className="inline-flex items-center gap-2 bg-white text-brand-primary shadow-md rounded-2xl px-5 py-3 font-bold text-sm hover:shadow-lg transition-shadow"
          >
            View UK National Trends <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = KPI_ICONS[kpi.label] ?? PoundSterling;
            return (
              <div key={kpi.label} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    {kpi.label}
                  </span>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                    <Icon className="size-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-neutral-950 font-heading">{kpi.value}</div>
                <div
                  className={`mt-2 flex items-center gap-1 text-sm font-semibold ${
                    kpi.trend === "up"
                      ? "text-emerald-600"
                      : kpi.trend === "down"
                        ? "text-red-600"
                        : "text-neutral-400"
                  }`}
                >
                  {kpi.trend === "up" && <TrendingUp className="size-4" />}
                  {kpi.trend === "down" && <TrendingDown className="size-4" />}
                  {kpi.trend === "neutral" && <Minus className="size-4" />}
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
        />

        {/* Regional Selector Pills */}
        <div className="flex flex-wrap gap-2">
          {REGION_SELECTOR_LABELS.map((region, i) => (
            <span
              key={region}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors cursor-pointer ${
                i === 0
                  ? "bg-brand-primary text-white"
                  : "bg-white text-neutral-600 hover:bg-brand-primary/10 hover:text-brand-primary shadow-sm"
              }`}
            >
              {region}
            </span>
          ))}
        </div>

        {/* Main Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Average Prices by Region Bar Chart */}
          <div className="bg-white rounded-2xl shadow-sm p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black font-heading" style={{ letterSpacing: "-0.02em" }}>Average Price by Region</h2>
              <Link href="#" className="flex items-center gap-1 text-sm font-bold text-brand-primary">
                View Details <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="flex h-64 items-end justify-between gap-3 px-2">
              {barChartData.map((bar) => (
                <div key={bar.region} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="relative w-full rounded-t-xl bg-[#f4f3f2]" style={{ height: "100%" }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-xl bg-brand-primary/30 transition-colors group-hover:bg-brand-primary"
                      style={{ height: bar.height }}
                    />
                    <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg bg-neutral-950 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
                      {bar.price}
                    </div>
                  </div>
                  <span className="text-center text-[10px] font-bold uppercase tracking-tighter text-neutral-400">
                    {bar.region}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hot/Cold Markets */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-black font-heading mb-5" style={{ letterSpacing: "-0.02em" }}>Market Heat Index</h2>
            <div className="space-y-6">
              {/* Hot Zones */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs font-bold uppercase text-red-500">
                    <Flame className="size-4" /> Hot Zones
                  </span>
                  <span className="text-xs font-medium text-neutral-400">Fastest Growth</span>
                </div>
                <div className="space-y-2">
                  {HOT_MARKETS.slice(0, 3).map((market) => (
                    <div
                      key={market.city}
                      className="flex items-center justify-between rounded-xl bg-[#faf9f8] p-3"
                    >
                      <span className="text-sm font-bold text-neutral-950">{market.city}</span>
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        {market.change}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cold Zones */}
              <div className="border-t border-[#f4f3f2] pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs font-bold uppercase text-blue-500">
                    <Snowflake className="size-4" /> Cold Zones
                  </span>
                  <span className="text-xs font-medium text-neutral-400">Stagnant</span>
                </div>
                <div className="space-y-2">
                  {COLD_MARKETS.slice(0, 3).map((market) => (
                    <div
                      key={market.city}
                      className="flex items-center justify-between rounded-xl bg-[#faf9f8] p-3"
                    >
                      <span className="text-sm font-bold text-neutral-950">{market.city}</span>
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600">
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Average Prices by Region Table */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-black font-heading mb-1" style={{ letterSpacing: "-0.02em" }}>Average Prices by Region</h2>
            <p className="text-xs text-neutral-400 mb-5">Latest regional average house prices</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f4f3f2]">
                    <th className="pb-3 text-left font-bold text-neutral-400 text-xs uppercase tracking-wider">Region</th>
                    <th className="pb-3 text-right font-bold text-neutral-400 text-xs uppercase tracking-wider">Avg Price</th>
                    <th className="pb-3 text-right font-bold text-neutral-400 text-xs uppercase tracking-wider">YoY Change</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((row) => (
                    <tr key={row.region} className="border-b border-[#f4f3f2] last:border-0 hover:bg-[#faf9f8] transition-colors">
                      <td className="py-2.5 font-semibold text-neutral-950">{row.region}</td>
                      <td className="py-2.5 text-right text-neutral-700">{row.avgPriceFormatted}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-600">
                        {row.yoyChangeFormatted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transaction Volumes Table */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-black font-heading mb-1" style={{ letterSpacing: "-0.02em" }}>Transaction Volumes</h2>
            <p className="text-xs text-neutral-400 mb-5">Annual completed sales by region</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f4f3f2]">
                    <th className="pb-3 text-left font-bold text-neutral-400 text-xs uppercase tracking-wider">Region</th>
                    <th className="pb-3 text-right font-bold text-neutral-400 text-xs uppercase tracking-wider">Volume (12m)</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((row) => (
                    <tr key={row.region} className="border-b border-[#f4f3f2] last:border-0 hover:bg-[#faf9f8] transition-colors">
                      <td className="py-2.5 font-semibold text-neutral-950">{row.region}</td>
                      <td className="py-2.5 text-right text-neutral-700">
                        {row.transactionsLast12m.toLocaleString("en-GB")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Time to Sell Table */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-black font-heading mb-1" style={{ letterSpacing: "-0.02em" }}>Time to Sell</h2>
            <p className="text-xs text-neutral-400 mb-5">Average days on market by region</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f4f3f2]">
                    <th className="pb-3 text-left font-bold text-neutral-400 text-xs uppercase tracking-wider">Region</th>
                    <th className="pb-3 text-right font-bold text-neutral-400 text-xs uppercase tracking-wider">Avg Days</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((row) => (
                    <tr key={row.region} className="border-b border-[#f4f3f2] last:border-0 hover:bg-[#faf9f8] transition-colors">
                      <td className="py-2.5 font-semibold text-neutral-950">{row.region}</td>
                      <td className="py-2.5 text-right text-neutral-700">{row.avgDaysToSell}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Asking vs Sold Price Gap Table */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-black font-heading mb-1" style={{ letterSpacing: "-0.02em" }}>Asking vs Sold Price Gap</h2>
            <p className="text-xs text-neutral-400 mb-5">Difference between asking and final sale price</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f4f3f2]">
                    <th className="pb-3 text-left font-bold text-neutral-400 text-xs uppercase tracking-wider">Region</th>
                    <th className="pb-3 text-right font-bold text-neutral-400 text-xs uppercase tracking-wider">Gap %</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((row) => (
                    <tr key={row.region} className="border-b border-[#f4f3f2] last:border-0 hover:bg-[#faf9f8] transition-colors">
                      <td className="py-2.5 font-semibold text-neutral-950">{row.region}</td>
                      <td className="py-2.5 text-right font-bold text-red-500">
                        {row.askingVsSoldGapFormatted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Asking vs Sold Price Chart + Transaction Volume Chart */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black font-heading" style={{ letterSpacing: "-0.02em" }}>Asking vs. Sold Price Trend</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Market negotiation leverage indicator</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-brand-primary inline-block" />
                  <span className="text-neutral-500 font-medium">Asking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-neutral-500 font-medium">Sold</span>
                </div>
              </div>
            </div>
            <div className="relative h-48 w-full">
              <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 100">
                <line stroke="#f4f3f2" strokeWidth="1" x1="0" x2="400" y1="0" y2="0" />
                <line stroke="#f4f3f2" strokeWidth="1" x1="0" x2="400" y1="50" y2="50" />
                <line stroke="#f4f3f2" strokeWidth="1" x1="0" x2="400" y1="100" y2="100" />
                <path d="M0,40 C50,30 100,50 150,45 S250,20 300,35 S400,25 400,25" fill="none" stroke="#1B4D3E" strokeWidth="2.5" />
                <path d="M0,50 C50,45 100,60 150,55 S250,35 300,45 S400,38 400,38" fill="none" stroke="#10b981" strokeWidth="2.5" />
              </svg>
              <div className="mt-4 flex justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                {["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((m) => <span key={m}>{m}</span>)}
              </div>
            </div>
          </div>

          {/* Monthly Transaction Volume Chart */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black font-heading" style={{ letterSpacing: "-0.02em" }}>Monthly Transaction Volume</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Total completed sales per month</p>
              </div>
              <span className="rounded-lg bg-[#f4f3f2] px-2 py-1 text-[10px] font-bold text-neutral-500">YTD 2026</span>
            </div>
            <div className="relative h-48 w-full">
              <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 100">
                <defs>
                  <linearGradient id="areaGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#1B4D3E" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#1B4D3E" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,80 Q50,60 100,75 T200,50 T300,70 T400,40 L400,100 L0,100 Z" fill="url(#areaGrad)" />
                <path d="M0,80 Q50,60 100,75 T200,50 T300,70 T400,40" fill="none" stroke="#1B4D3E" strokeWidth="3" />
              </svg>
              <div className="mt-4 flex justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                {["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((m) => <span key={m}>{m}</span>)}
              </div>
            </div>
          </div>
        </div>

        {/* MoM and YoY Comparison Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[
            {
              title: "Month-on-Month Change",
              subtitle: "February 2026 vs March 2026",
              items: [
                { label: "Avg Price", value: "+1.2%", sub: "£3,500", icon: TrendingUp, color: "text-emerald-600" },
                { label: "Transactions", value: "+5.5%", sub: "+4,800", icon: TrendingUp, color: "text-emerald-600" },
                { label: "Days to Sell", value: "-1 day", sub: "Faster", icon: TrendingUp, color: "text-emerald-600" },
                { label: "Price Gap", value: "-0.1%", sub: "Unchanged", icon: Minus, color: "text-neutral-400" },
              ],
            },
            {
              title: "Year-on-Year Change",
              subtitle: "March 2025 vs March 2026",
              items: [
                { label: "Avg Price", value: "+3.8%", sub: "£10,900", icon: TrendingUp, color: "text-emerald-600" },
                { label: "Transactions", value: "+12%", sub: "+9,900", icon: TrendingUp, color: "text-emerald-600" },
                { label: "Days to Sell", value: "-3 days", sub: "Faster", icon: TrendingUp, color: "text-emerald-600" },
                { label: "Price Gap", value: "-0.3%", sub: "Narrowing", icon: TrendingUp, color: "text-emerald-600" },
              ],
            },
          ].map(({ title, subtitle, items }) => (
            <div key={title} className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-black font-heading mb-0.5" style={{ letterSpacing: "-0.02em" }}>{title}</h2>
              <p className="text-xs text-neutral-400 mb-5">{subtitle}</p>
              <div className="grid grid-cols-2 gap-3">
                {items.map(({ label, value, sub, icon: Icon, color }) => (
                  <div key={label} className="rounded-2xl bg-[#faf9f8] p-4 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
                    <p className="mt-1.5 text-xl font-black text-neutral-950 font-heading">{value}</p>
                    <div className={`mt-1 flex items-center justify-center gap-1 text-xs font-semibold ${color}`}>
                      <Icon className="size-3" />
                      <span>{sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Market Commentary Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-2">Analysis</p>
            <h2 className="font-heading text-2xl font-black mb-5" style={{ letterSpacing: "-0.02em" }}>
              Expert Market Commentary
            </h2>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-8">
                <div className="mb-4 flex items-center gap-2">
                  <span className="rounded-lg bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                    Analysis
                  </span>
                  <span className="text-xs font-medium text-neutral-400">8 Mar 2026</span>
                </div>
                <h3 className="mb-5 text-xl font-black leading-tight text-neutral-950 font-heading" style={{ letterSpacing: "-0.01em" }}>
                  Spring 2026 Market Outlook: Sustained Growth Amid Evolving Buyer Confidence
                </h3>
                <div className="space-y-4 text-sm leading-relaxed text-neutral-600">
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
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#f4f3f2] text-sm font-black text-neutral-600">
                    MT
                  </div>
                  <div>
                    <div className="text-sm font-black text-neutral-950">Dr. Marcus Thorne</div>
                    <div className="text-xs text-neutral-500">Chief Economist, Britestate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Local Authority Heat Rankings */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-2">Rankings</p>
            <h2 className="font-heading text-2xl font-black mb-5" style={{ letterSpacing: "-0.02em" }}>
              Local Authority Heat
            </h2>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="mb-5 flex border-b border-[#f4f3f2]">
                <button className="flex-1 border-b-2 border-brand-primary pb-3 text-sm font-black text-brand-primary">
                  Highest Yield
                </button>
                <button className="flex-1 pb-3 text-sm font-bold text-neutral-400">
                  Fastest Sales
                </button>
              </div>
              <div className="space-y-4">
                {YIELD_RANKINGS.slice(0, 4).map((item) => {
                  const barWidth = `${Math.round((item.yield / (YIELD_RANKINGS[0]?.yield ?? 10)) * 100)}%`;
                  const rankLabel = item.rank.padStart(2, "0");
                  return (
                    <div key={item.rank} className="flex items-center gap-4">
                      <div className="w-6 text-sm font-black text-neutral-300 font-heading">{rankLabel}</div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-neutral-950">{item.area}</div>
                        <div className="text-xs text-neutral-500">
                          Yield: {item.yield}% &bull; {item.detail}
                        </div>
                      </div>
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#f4f3f2]">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: barWidth }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link
                href="#"
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#f4f3f2] py-3 text-sm font-bold text-neutral-600 transition-colors hover:bg-brand-primary/10 hover:text-brand-primary"
              >
                View Full Rankings
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Internal Region Links */}
        <section className="pb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-2">Explore Local</p>
          <h2 className="font-heading text-xl font-black mb-5" style={{ letterSpacing: "-0.02em" }}>
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
    </div>
  );
}
