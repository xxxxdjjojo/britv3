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
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "UK Property Market Trends | Britestate",
  description:
    "Live UK property market data, regional price trends, and expert analysis. Track house prices, transaction volumes, and market indicators.",
};

const regions = [
  "London",
  "South East",
  "South West",
  "East",
  "Midlands",
  "North West",
  "North East",
  "Yorkshire",
  "Scotland",
  "Wales",
  "Northern Ireland",
];

const kpiCards: ReadonlyArray<{
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: typeof PoundSterling;
}> = [
  {
    label: "Avg. House Price",
    value: "\u00a3298,000",
    change: "+3.8% YoY",
    trend: "up",
    icon: PoundSterling,
  },
  {
    label: "Monthly Transactions",
    value: "92,400",
    change: "+12% YoY",
    trend: "up",
    icon: Receipt,
  },
  {
    label: "Avg. Days to Sell",
    value: "28",
    change: "-3 days",
    trend: "up",
    icon: BarChart3,
  },
  {
    label: "Asking vs Sold Gap",
    value: "-2.1%",
    change: "Stable",
    trend: "neutral",
    icon: Home,
  },
];

const regionalPrices = [
  { region: "London", avgPrice: "\u00a3532,000", yoyChange: "+2.4%" },
  { region: "South East", avgPrice: "\u00a3395,000", yoyChange: "+3.1%" },
  { region: "South West", avgPrice: "\u00a3320,000", yoyChange: "+4.2%" },
  { region: "East of England", avgPrice: "\u00a3340,000", yoyChange: "+3.5%" },
  { region: "Midlands", avgPrice: "\u00a3280,000", yoyChange: "+5.1%" },
  { region: "North West", avgPrice: "\u00a3210,000", yoyChange: "+6.8%" },
  { region: "North East", avgPrice: "\u00a3165,000", yoyChange: "+4.9%" },
  { region: "Yorkshire", avgPrice: "\u00a3195,000", yoyChange: "+5.3%" },
  { region: "Scotland", avgPrice: "\u00a3190,000", yoyChange: "+3.7%" },
  { region: "Wales", avgPrice: "\u00a3230,000", yoyChange: "+4.5%" },
  { region: "Northern Ireland", avgPrice: "\u00a3178,000", yoyChange: "+5.8%" },
];

const transactionVolumes = [
  { month: "October 2025", volume: "88,200" },
  { month: "November 2025", volume: "85,400" },
  { month: "December 2025", volume: "72,100" },
  { month: "January 2026", volume: "79,800" },
  { month: "February 2026", volume: "87,600" },
  { month: "March 2026", volume: "92,400" },
];

const timeToSell = [
  { region: "London", avgDays: "34" },
  { region: "South East", avgDays: "30" },
  { region: "South West", avgDays: "32" },
  { region: "Midlands", avgDays: "26" },
  { region: "North West", avgDays: "24" },
  { region: "North East", avgDays: "28" },
  { region: "Yorkshire", avgDays: "27" },
  { region: "Scotland", avgDays: "22" },
  { region: "Wales", avgDays: "29" },
  { region: "Northern Ireland", avgDays: "31" },
];

const askingVsSoldGap = [
  { region: "London", gap: "-3.2%" },
  { region: "South East", gap: "-2.8%" },
  { region: "South West", gap: "-2.5%" },
  { region: "Midlands", gap: "-1.9%" },
  { region: "North West", gap: "-1.4%" },
  { region: "North East", gap: "-1.7%" },
  { region: "Yorkshire", gap: "-1.6%" },
  { region: "Scotland", gap: "-1.2%" },
  { region: "Wales", gap: "-2.0%" },
  { region: "Northern Ireland", gap: "-2.3%" },
];

const hotMarkets = [
  { city: "Bristol", change: "+8.2%" },
  { city: "Manchester", change: "+7.1%" },
  { city: "Birmingham", change: "+6.5%" },
];

const coldMarkets = [
  { city: "Aberdeen", change: "-2.1%" },
  { city: "Middlesbrough", change: "-1.8%" },
  { city: "Stoke-on-Trent", change: "-1.2%" },
];

const barChartData = [
  { region: "London", price: "\u00a3532k", height: "100%" },
  { region: "S. East", price: "\u00a3395k", height: "74%" },
  { region: "Midlands", price: "\u00a3280k", height: "53%" },
  { region: "N. West", price: "\u00a3210k", height: "39%" },
  { region: "Wales", price: "\u00a3230k", height: "43%" },
  { region: "Scotland", price: "\u00a3190k", height: "36%" },
];

const yieldRankings = [
  { rank: "01", area: "Liverpool (City Centre)", detail: "Yield: 7.9% \u2022 L1 Postcode", barWidth: "90%" },
  { rank: "02", area: "Middlesbrough", detail: "Yield: 7.6% \u2022 TS1 Postcode", barWidth: "85%" },
  { rank: "03", area: "Sunderland", detail: "Yield: 7.4% \u2022 SR1 Postcode", barWidth: "82%" },
  { rank: "04", area: "Glasgow (East End)", detail: "Yield: 7.1% \u2022 G40 Postcode", barWidth: "78%" },
];

export default function MarketTrendsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <nav className="mb-2 flex text-sm text-neutral-500">
            <Link href="/" className="hover:text-brand-primary">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-brand-primary">Market Trends</span>
          </nav>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            UK Property Market Trends
          </h1>
          <p className="mt-1 text-neutral-500">
            Real-time data from Land Registry &amp; ONS. Updated March 2026.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select className="appearance-none rounded-lg border border-neutral-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary">
            <option>United Kingdom (National)</option>
            {regions.map((region) => (
              <option key={region}>{region}</option>
            ))}
          </select>
          <button className="flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 font-medium text-white shadow-lg shadow-brand-primary/20 transition-colors hover:bg-brand-primary/90">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="border-neutral-200">
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium uppercase tracking-wider text-neutral-500">
                  {kpi.label}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-neutral-900">{kpi.value}</div>
              <div
                className={`mt-2 flex items-center gap-1 text-sm font-semibold ${
                  kpi.trend === "up"
                    ? "text-green-600"
                    : kpi.trend === "down"
                      ? "text-red-600"
                      : "text-neutral-400"
                }`}
              >
                {kpi.trend === "up" && <TrendingUp className="h-4 w-4" />}
                {kpi.trend === "down" && <TrendingDown className="h-4 w-4" />}
                {kpi.trend === "neutral" && <Minus className="h-4 w-4" />}
                <span>{kpi.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Regional Selector Pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {regions.map((region, i) => (
          <span
            key={region}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              i === 0
                ? "bg-brand-primary text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {region}
          </span>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Average Prices by Region Bar Chart */}
        <Card className="border-neutral-200 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Average Price by Region</CardTitle>
              <Link
                href="#"
                className="flex items-center gap-1 text-sm font-semibold text-brand-primary"
              >
                View Details <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-end justify-between gap-4 px-4">
              {barChartData.map((bar) => (
                <div key={bar.region} className="group flex flex-1 flex-col items-center gap-3">
                  <div className="relative w-full rounded-t-md bg-neutral-100">
                    <div
                      className="absolute bottom-0 w-full rounded-t-md bg-brand-primary/40 transition-colors group-hover:bg-brand-primary"
                      style={{ height: bar.height }}
                    />
                    <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded bg-neutral-800 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {bar.price}
                    </div>
                  </div>
                  <span className="text-center text-[10px] font-bold uppercase tracking-tighter text-neutral-400">
                    {bar.region}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hot/Cold Markets */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Market Heat Index</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hot Zones */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-bold uppercase text-red-500">
                  <Flame className="h-4 w-4" /> Hot Zones
                </span>
                <span className="text-xs font-medium text-neutral-400">Fastest Growth</span>
              </div>
              <div className="space-y-3">
                {hotMarkets.map((market) => (
                  <div
                    key={market.city}
                    className="flex items-center justify-between rounded-lg bg-neutral-50 p-3"
                  >
                    <span className="text-sm font-semibold text-neutral-900">{market.city}</span>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-bold text-green-600">
                      {market.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cold Zones */}
            <div className="border-t border-neutral-100 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-bold uppercase text-blue-500">
                  <Snowflake className="h-4 w-4" /> Cold Zones
                </span>
                <span className="text-xs font-medium text-neutral-400">Stagnant</span>
              </div>
              <div className="space-y-3">
                {coldMarkets.map((market) => (
                  <div
                    key={market.city}
                    className="flex items-center justify-between rounded-lg bg-neutral-50 p-3"
                  >
                    <span className="text-sm font-semibold text-neutral-900">{market.city}</span>
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-bold text-red-600">
                      {market.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Data Tables Section */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Average Prices by Region Table */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Average Prices by Region</CardTitle>
            <CardDescription>Latest regional average house prices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-3 text-left font-semibold text-neutral-500">Region</th>
                    <th className="pb-3 text-right font-semibold text-neutral-500">Avg Price</th>
                    <th className="pb-3 text-right font-semibold text-neutral-500">YoY Change</th>
                  </tr>
                </thead>
                <tbody>
                  {regionalPrices.map((row) => (
                    <tr key={row.region} className="border-b border-neutral-100 last:border-0">
                      <td className="py-2.5 font-medium text-neutral-900">{row.region}</td>
                      <td className="py-2.5 text-right text-neutral-700">{row.avgPrice}</td>
                      <td className="py-2.5 text-right font-semibold text-green-600">
                        {row.yoyChange}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Volumes Table */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Transaction Volumes</CardTitle>
            <CardDescription>Monthly completed sales, last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-3 text-left font-semibold text-neutral-500">Month</th>
                    <th className="pb-3 text-right font-semibold text-neutral-500">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionVolumes.map((row) => (
                    <tr key={row.month} className="border-b border-neutral-100 last:border-0">
                      <td className="py-2.5 font-medium text-neutral-900">{row.month}</td>
                      <td className="py-2.5 text-right text-neutral-700">{row.volume}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Time to Sell Table */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Time to Sell</CardTitle>
            <CardDescription>Average days on market by region</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-3 text-left font-semibold text-neutral-500">Region</th>
                    <th className="pb-3 text-right font-semibold text-neutral-500">Avg Days</th>
                  </tr>
                </thead>
                <tbody>
                  {timeToSell.map((row) => (
                    <tr key={row.region} className="border-b border-neutral-100 last:border-0">
                      <td className="py-2.5 font-medium text-neutral-900">{row.region}</td>
                      <td className="py-2.5 text-right text-neutral-700">{row.avgDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Asking vs Sold Price Gap Table */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Asking vs Sold Price Gap</CardTitle>
            <CardDescription>Difference between asking and final sale price</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-3 text-left font-semibold text-neutral-500">Region</th>
                    <th className="pb-3 text-right font-semibold text-neutral-500">Gap %</th>
                  </tr>
                </thead>
                <tbody>
                  {askingVsSoldGap.map((row) => (
                    <tr key={row.region} className="border-b border-neutral-100 last:border-0">
                      <td className="py-2.5 font-medium text-neutral-900">{row.region}</td>
                      <td className="py-2.5 text-right font-semibold text-red-600">{row.gap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asking vs Sold Price Chart (SVG) */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="border-neutral-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Asking vs. Sold Price Trend</CardTitle>
                <CardDescription>Market negotiation leverage indicator</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-brand-primary" />
                  <span className="text-neutral-600">Asking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-neutral-600">Sold</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-48 w-full">
              <svg
                className="h-full w-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 400 100"
              >
                <line className="text-neutral-100" stroke="currentColor" strokeWidth="1" x1="0" x2="400" y1="0" y2="0" />
                <line className="text-neutral-100" stroke="currentColor" strokeWidth="1" x1="0" x2="400" y1="50" y2="50" />
                <line className="text-neutral-100" stroke="currentColor" strokeWidth="1" x1="0" x2="400" y1="100" y2="100" />
                <path d="M0,40 C50,30 100,50 150,45 S250,20 300,35 S400,25 400,25" fill="none" className="stroke-brand-primary" strokeWidth="2" />
                <path d="M0,50 C50,45 100,60 150,55 S250,35 300,45 S400,38 400,38" fill="none" className="stroke-green-500" strokeWidth="2" />
              </svg>
              <div className="mt-4 flex justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Transaction Volume Chart */}
        <Card className="border-neutral-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Monthly Transaction Volume</CardTitle>
                <CardDescription>Total completed sales per month</CardDescription>
              </div>
              <span className="rounded bg-neutral-100 px-2 py-1 text-[10px] font-bold text-neutral-600">
                YTD 2026
              </span>
            </div>
          </CardHeader>
          <CardContent>
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
                <path d="M0,80 Q50,60 100,75 T200,50 T300,70 T400,40" fill="none" className="stroke-brand-primary" strokeWidth="3" />
              </svg>
              <div className="mt-4 flex justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MoM and YoY Comparison Cards */}
      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Month-on-Month Change</CardTitle>
            <CardDescription>February 2026 vs March 2026</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-neutral-50 p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Avg Price</p>
                <p className="mt-1 text-xl font-bold text-neutral-900">+1.2%</p>
                <div className="mt-1 flex items-center justify-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>\u00a33,500</span>
                </div>
              </div>
              <div className="rounded-lg bg-neutral-50 p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Transactions</p>
                <p className="mt-1 text-xl font-bold text-neutral-900">+5.5%</p>
                <div className="mt-1 flex items-center justify-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+4,800</span>
                </div>
              </div>
              <div className="rounded-lg bg-neutral-50 p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Days to Sell</p>
                <p className="mt-1 text-xl font-bold text-neutral-900">-1 day</p>
                <div className="mt-1 flex items-center justify-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>Faster</span>
                </div>
              </div>
              <div className="rounded-lg bg-neutral-50 p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Price Gap</p>
                <p className="mt-1 text-xl font-bold text-neutral-900">-0.1%</p>
                <div className="mt-1 flex items-center justify-center gap-1 text-sm text-neutral-400">
                  <Minus className="h-3 w-3" />
                  <span>Unchanged</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Year-on-Year Change</CardTitle>
            <CardDescription>March 2025 vs March 2026</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-neutral-50 p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Avg Price</p>
                <p className="mt-1 text-xl font-bold text-neutral-900">+3.8%</p>
                <div className="mt-1 flex items-center justify-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>\u00a310,900</span>
                </div>
              </div>
              <div className="rounded-lg bg-neutral-50 p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Transactions</p>
                <p className="mt-1 text-xl font-bold text-neutral-900">+12%</p>
                <div className="mt-1 flex items-center justify-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+9,900</span>
                </div>
              </div>
              <div className="rounded-lg bg-neutral-50 p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Days to Sell</p>
                <p className="mt-1 text-xl font-bold text-neutral-900">-3 days</p>
                <div className="mt-1 flex items-center justify-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>Faster</span>
                </div>
              </div>
              <div className="rounded-lg bg-neutral-50 p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Price Gap</p>
                <p className="mt-1 text-xl font-bold text-neutral-900">-0.3%</p>
                <div className="mt-1 flex items-center justify-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>Narrowing</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Commentary Section */}
      <section className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-6 font-heading text-2xl font-bold text-neutral-900">
            Expert Market Commentary
          </h2>
          <Card className="overflow-hidden border-neutral-200">
            <CardContent className="p-0">
              <div className="p-8">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                    Analysis
                  </span>
                  <span className="text-xs font-medium text-neutral-400">8 Mar 2026</span>
                </div>
                <h3 className="mb-4 text-xl font-bold leading-tight text-neutral-900">
                  Spring 2026 Market Outlook: Sustained Growth Amid Evolving Buyer Confidence
                </h3>
                <div className="space-y-4 text-sm leading-relaxed text-neutral-600">
                  <p>
                    The UK property market enters spring 2026 in its strongest position in three
                    years. Average house prices have risen 3.8% year-on-year to reach
                    {"\u00a0"}\u00a3298,000, driven by a combination of stabilised mortgage rates, pent-up
                    demand from first-time buyers, and limited new housing supply. Transaction
                    volumes are up 12% compared to March 2025, signalling renewed confidence
                    across most regions.
                  </p>
                  <p>
                    Regional disparities remain pronounced. London continues to lag behind the
                    national average in price growth at just 2.4%, while cities such as Bristol
                    (+8.2%), Manchester (+7.1%), and Birmingham (+6.5%) are outperforming. The
                    Midlands and North West continue to offer the best value for buyers, with
                    average days to sell falling below the national average of 28 days. Scotland
                    stands out with the fastest average sale time of just 22 days, largely due to
                    its distinct conveyancing process.
                  </p>
                  <p>
                    Looking ahead, the Bank of England&apos;s anticipated rate cut in Q2 2026 could
                    further stimulate demand. However, affordability remains a constraint in the
                    South East, where the asking-to-sold price gap of -2.8% suggests buyers
                    retain negotiating power. We expect continued moderate growth through H1 2026,
                    with the rental market also tightening as landlord supply continues to
                    contract in the face of higher regulatory requirements.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 text-sm font-bold text-neutral-600">
                    MT
                  </div>
                  <div>
                    <div className="text-sm font-bold text-neutral-900">Dr. Marcus Thorne</div>
                    <div className="text-xs text-neutral-500">Chief Economist, Britestate</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Local Authority Heat Rankings */}
        <div>
          <h2 className="mb-6 font-heading text-2xl font-bold text-neutral-900">
            Local Authority Heat
          </h2>
          <Card className="border-neutral-200">
            <CardContent>
              <div className="mb-6 flex border-b border-neutral-100">
                <button className="flex-1 border-b-2 border-brand-primary pb-3 text-sm font-bold text-brand-primary">
                  Highest Yield
                </button>
                <button className="flex-1 pb-3 text-sm font-bold text-neutral-400">
                  Fastest Sales
                </button>
              </div>
              <div className="space-y-4">
                {yieldRankings.map((item) => (
                  <div key={item.rank} className="flex items-center gap-4">
                    <div className="w-6 text-lg font-bold text-neutral-300">{item.rank}</div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-neutral-900">{item.area}</div>
                      <div className="text-xs text-neutral-500">{item.detail}</div>
                    </div>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full bg-green-500" style={{ width: item.barWidth }} />
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="#"
                className="mt-8 flex w-full items-center justify-center rounded-lg border border-neutral-200 py-3 text-sm font-bold text-neutral-600 transition-colors hover:bg-neutral-50"
              >
                View Full Rankings
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
