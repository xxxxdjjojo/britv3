import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  TrendingUp,
  Thermometer,
  Filter,
  Download,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SoldPricesPageProps = Readonly<{
  params: Promise<{ area: string }>;
}>;

function formatAreaName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: SoldPricesPageProps): Promise<Metadata> {
  const { area } = await params;
  const areaName = formatAreaName(area);
  return {
    title: `Sold Prices in ${areaName} | Britestate`,
    description: `View recent property sold prices, market trends, and transaction data in ${areaName}. Historical land registry data powered by Britestate.`,
  };
}

const MOCK_SALES = [
  { address: "14 London Road", postcode: "TW7 5BJ", type: "Terraced", typeBg: "bg-blue-50 dark:bg-blue-900/20", typeText: "text-blue-600 dark:text-blue-400", beds: 3, price: "£485,000", date: "Dec 15, 2025", vsAsking: -1.8 },
  { address: "3 Worton Gardens", postcode: "TW7 6EL", type: "Semi-detached", typeBg: "bg-amber-50 dark:bg-amber-900/20", typeText: "text-amber-600 dark:text-amber-400", beds: 4, price: "£672,000", date: "Nov 28, 2025", vsAsking: 1.2 },
  { address: "Flat 8, Syon Lodge", postcode: "TW7 5QE", type: "Flat", typeBg: "bg-purple-50 dark:bg-purple-900/20", typeText: "text-purple-600 dark:text-purple-400", beds: 2, price: "£345,000", date: "Nov 10, 2025", vsAsking: -3.1 },
  { address: "22 Shrewsbury Walk", postcode: "TW7 7AA", type: "Detached", typeBg: "bg-emerald-50 dark:bg-emerald-900/20", typeText: "text-emerald-600 dark:text-emerald-400", beds: 5, price: "£780,000", date: "Oct 22, 2025", vsAsking: 0.5 },
  { address: "9 Linkfield Road", postcode: "TW7 6QG", type: "Terraced", typeBg: "bg-blue-50 dark:bg-blue-900/20", typeText: "text-blue-600 dark:text-blue-400", beds: 2, price: "£395,000", date: "Oct 05, 2025", vsAsking: -2.0 },
  { address: "Flat 12, Thames Court", postcode: "TW7 6DA", type: "Flat", typeBg: "bg-purple-50 dark:bg-purple-900/20", typeText: "text-purple-600 dark:text-purple-400", beds: 1, price: "£320,000", date: "Sep 18, 2025", vsAsking: -4.5 },
  { address: "47 St Johns Road", postcode: "TW7 6NL", type: "Semi-detached", typeBg: "bg-amber-50 dark:bg-amber-900/20", typeText: "text-amber-600 dark:text-amber-400", beds: 3, price: "£540,000", date: "Sep 02, 2025", vsAsking: 1.8 },
  { address: "1 Busch Close", postcode: "TW7 6BN", type: "Detached", typeBg: "bg-emerald-50 dark:bg-emerald-900/20", typeText: "text-emerald-600 dark:text-emerald-400", beds: 4, price: "£725,000", date: "Aug 14, 2025", vsAsking: -0.7 },
  { address: "Flat 3, Ivybridge House", postcode: "TW7 4EE", type: "Flat", typeBg: "bg-purple-50 dark:bg-purple-900/20", typeText: "text-purple-600 dark:text-purple-400", beds: 2, price: "£362,000", date: "Jul 29, 2025", vsAsking: -2.8 },
  { address: "18 Twickenham Road", postcode: "TW7 6DA", type: "Terraced", typeBg: "bg-blue-50 dark:bg-blue-900/20", typeText: "text-blue-600 dark:text-blue-400", beds: 3, price: "£498,000", date: "Jul 11, 2025", vsAsking: 0.3 },
  { address: "55 London Road", postcode: "TW7 5AG", type: "Semi-detached", typeBg: "bg-amber-50 dark:bg-amber-900/20", typeText: "text-amber-600 dark:text-amber-400", beds: 4, price: "£615,000", date: "Jun 23, 2025", vsAsking: 2.0 },
  { address: "Flat 6, Nazareth House", postcode: "TW7 5BS", type: "Flat", typeBg: "bg-purple-50 dark:bg-purple-900/20", typeText: "text-purple-600 dark:text-purple-400", beds: 1, price: "£328,000", date: "Jun 05, 2025", vsAsking: -5.0 },
  { address: "31 Swan Street", postcode: "TW7 6RJ", type: "Terraced", typeBg: "bg-blue-50 dark:bg-blue-900/20", typeText: "text-blue-600 dark:text-blue-400", beds: 2, price: "£410,000", date: "May 19, 2025", vsAsking: -1.1 },
  { address: "8 Northumberland Place", postcode: "TW7 7QR", type: "Detached", typeBg: "bg-emerald-50 dark:bg-emerald-900/20", typeText: "text-emerald-600 dark:text-emerald-400", beds: 5, price: "£765,000", date: "Apr 30, 2025", vsAsking: 1.5 },
  { address: "Flat 19, Brentside Park", postcode: "TW7 5DQ", type: "Flat", typeBg: "bg-purple-50 dark:bg-purple-900/20", typeText: "text-purple-600 dark:text-purple-400", beds: 2, price: "£355,000", date: "Mar 12, 2025", vsAsking: -3.7 },
  { address: "26 Mill Plat", postcode: "TW7 6ES", type: "Terraced", typeBg: "bg-blue-50 dark:bg-blue-900/20", typeText: "text-blue-600 dark:text-blue-400", beds: 3, price: "£505,000", date: "Feb 22, 2025", vsAsking: 0.8 },
  { address: "12 Park Road", postcode: "TW7 5AH", type: "Semi-detached", typeBg: "bg-amber-50 dark:bg-amber-900/20", typeText: "text-amber-600 dark:text-amber-400", beds: 3, price: "£555,000", date: "Jan 15, 2025", vsAsking: -0.4 },
] as const;

const QUARTERLY_TRENDS = [
  { quarter: "Q1 2025", avgPrice: "£467,200", transactions: 68, change: -1.2 },
  { quarter: "Q4 2024", avgPrice: "£472,900", transactions: 74, change: 2.8 },
  { quarter: "Q3 2024", avgPrice: "£460,100", transactions: 81, change: 1.5 },
  { quarter: "Q2 2024", avgPrice: "£453,300", transactions: 77, change: -0.6 },
  { quarter: "Q1 2024", avgPrice: "£456,000", transactions: 64, change: 3.1 },
  { quarter: "Q4 2023", avgPrice: "£442,300", transactions: 71, change: -2.1 },
] as const;

const CHART_BARS = [
  { year: "2015", height: "40%", label: "£340k" },
  { year: "2016", height: "45%", label: "£365k" },
  { year: "2017", height: "42%", label: "£355k" },
  { year: "2018", height: "55%", label: "£390k" },
  { year: "2019", height: "65%", label: "£415k" },
  { year: "2020", height: "70%", label: "£430k" },
  { year: "2021", height: "68%", label: "£425k" },
  { year: "2022", height: "80%", label: "£460k" },
  { year: "2023", height: "90%", label: "£495k" },
  { year: "2024", height: "100%", label: "£542k" },
] as const;

function VsAskingBadge({ value }: Readonly<{ value: number }>) {
  if (value > 0) {
    return <span className="font-medium text-green-600">+{value}%</span>;
  }
  if (value < 0) {
    return <span className="font-medium text-red-500">{value}%</span>;
  }
  return <span className="font-medium text-neutral-400">0.0%</span>;
}

export default async function SoldPricesPage({ params }: SoldPricesPageProps) {
  const { area } = await params;
  const areaName = formatAreaName(area);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4 flex text-sm text-neutral-500">
        <ol className="flex items-center space-x-2">
          <li>
            <Link className="hover:text-brand-primary" href="/">
              Home
            </Link>
          </li>
          <li>
            <ChevronRight className="size-4" />
          </li>
          <li>
            <Link className="hover:text-brand-primary" href="/sold-prices/isleworth">
              Sold Prices
            </Link>
          </li>
          <li>
            <ChevronRight className="size-4" />
          </li>
          <li className="font-medium text-neutral-900 dark:text-white">
            {areaName}
          </li>
        </ol>
      </nav>

      {/* Hero / Search */}
      <div className="mb-8">
        <div className="flex flex-col items-end gap-4 md:flex-row">
          <div className="w-full flex-1">
            <h1 className="mb-6 font-heading text-3xl font-bold">
              Property Sold Prices in{" "}
              <span className="text-brand-primary">{areaName}</span>
            </h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
              <input
                className="w-full rounded-xl border border-neutral-200 bg-white py-4 pl-12 pr-4 shadow-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-brand-primary dark:border-neutral-700 dark:bg-neutral-900"
                placeholder="Enter postcode, street or town..."
                type="text"
                defaultValue={`${areaName}, TW7`}
                readOnly
              />
            </div>
          </div>
          <button className="flex h-[60px] items-center gap-2 rounded-xl bg-brand-primary px-8 py-4 font-semibold text-white transition-all hover:bg-brand-primary-light">
            Update Results
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-neutral-200 shadow-sm dark:border-neutral-700">
          <CardContent className="p-6">
            <p className="mb-1 text-sm font-medium text-neutral-500">
              Average Sold Price
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">£467,000</h3>
              <span className="flex items-center text-sm font-medium text-green-500">
                <TrendingUp className="size-3" /> 4.2%
              </span>
            </div>
            <p className="mt-2 text-xs text-neutral-400">Past 12 months</p>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 shadow-sm dark:border-neutral-700">
          <CardContent className="p-6">
            <p className="mb-1 text-sm font-medium text-neutral-500">
              Total Transactions
            </p>
            <h3 className="text-2xl font-bold">284</h3>
            <p className="mt-2 text-xs text-neutral-400">
              Last 12 months volume
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 shadow-sm dark:border-neutral-700">
          <CardContent className="p-6">
            <p className="mb-1 text-sm font-medium text-neutral-500">
              Avg Price vs Asking
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-red-500">-2.3%</h3>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Below asking on average
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 shadow-sm dark:border-neutral-700">
          <CardContent className="p-6">
            <p className="mb-1 text-sm font-medium text-neutral-500">
              Market Temperature
            </p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-brand-primary">
                Balanced
              </h3>
              <Thermometer className="size-5 text-brand-primary" />
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Neutral buyer/seller leverage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Table + Map */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Table Section */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden border-neutral-200 shadow-sm dark:border-neutral-700">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
              <CardTitle className="text-lg font-bold">
                Recent Sales in {areaName}
              </CardTitle>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
                  <Filter className="size-3.5" /> Filter
                </button>
                <button className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
                  <Download className="size-3.5" /> Export
                </button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500 dark:bg-neutral-800/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Address</th>
                    <th className="px-6 py-4 font-semibold">Type &amp; Beds</th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Sold Date
                    </th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Sold Price
                    </th>
                    <th className="px-6 py-4 text-right font-semibold">
                      vs Asking
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {MOCK_SALES.map((sale, i) => (
                    <tr
                      key={`${sale.postcode}-${i}`}
                      className="transition-colors even:bg-neutral-50 hover:bg-neutral-100 dark:even:bg-neutral-800/20 dark:hover:bg-neutral-800/30"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium">{sale.address}</div>
                        <div className="text-xs uppercase text-neutral-400">
                          {sale.postcode}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${sale.typeBg} ${sale.typeText}`}
                          >
                            {sale.type}
                          </span>
                          <span className="text-neutral-500">
                            {sale.beds} Bed
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-neutral-500">
                        {sale.date}
                      </td>
                      <td className="px-6 py-4 text-right font-bold">
                        {sale.price}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <VsAskingBadge value={sale.vsAsking} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-neutral-100 p-4 dark:border-neutral-800">
              <span className="text-xs text-neutral-500">
                Showing 1-{MOCK_SALES.length} of 284 results
              </span>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border border-neutral-200 p-2 disabled:opacity-50 dark:border-neutral-700"
                  disabled
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button className="rounded-lg border border-neutral-200 p-2 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </Card>

          {/* Price Trend Chart */}
          <Card className="border-neutral-200 p-6 shadow-sm dark:border-neutral-700">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Price Trend (10 Years)</h2>
                <p className="text-sm text-neutral-500">
                  Historical market performance in TW7
                </p>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-2 text-xs font-medium">
                  <span className="size-3 rounded-full bg-brand-primary" /> Avg.
                  Sold Price
                </span>
              </div>
            </div>
            <div className="relative flex h-64 items-end justify-between px-2">
              {/* Grid lines */}
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                <div className="h-px w-full border-t border-neutral-100 dark:border-neutral-800" />
                <div className="h-px w-full border-t border-neutral-100 dark:border-neutral-800" />
                <div className="h-px w-full border-t border-neutral-100 dark:border-neutral-800" />
                <div className="h-px w-full border-t border-neutral-100 dark:border-neutral-800" />
              </div>
              {/* Bars */}
              <div className="relative flex h-full w-full items-end gap-1 pt-4">
                {CHART_BARS.map((bar, i) => (
                  <div
                    key={bar.year}
                    className={`group relative flex-1 rounded-t transition-all ${
                      i === CHART_BARS.length - 1
                        ? "bg-brand-primary"
                        : i === CHART_BARS.length - 2
                          ? "bg-brand-primary/30 hover:bg-brand-primary/50"
                          : "bg-brand-primary/20 hover:bg-brand-primary/40"
                    }`}
                    style={{ height: bar.height }}
                  >
                    {i === CHART_BARS.length - 1 && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-brand-primary px-2 py-1 text-[10px] font-bold text-white shadow-lg">
                        {bar.label} (2024)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-between px-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              {CHART_BARS.map((bar) => (
                <span key={bar.year}>{bar.year}</span>
              ))}
            </div>
          </Card>
        </div>

        {/* Map Side Panel */}
        <div className="lg:col-span-1">
          <Card className="flex h-full flex-col overflow-hidden border-neutral-200 shadow-sm dark:border-neutral-700">
            <CardHeader className="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Map View</CardTitle>
                <span className="text-xs font-bold text-brand-primary">
                  Expand Map
                </span>
              </div>
              <p className="text-sm text-neutral-500">
                Viewing TW7 area markers
              </p>
            </CardHeader>
            <div className="relative min-h-[500px] flex-1 bg-neutral-200 dark:bg-neutral-800">
              {/* Map placeholder */}
              <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                <p className="text-sm font-medium">
                  Map view -- coming soon
                </p>
              </div>
            </div>
            <div className="bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Info className="size-4 shrink-0" />
                Prices shown are approximate based on public land registry data.
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sold Prices Over Time - Quarterly Table */}
      <Card className="border-neutral-200 shadow-sm dark:border-neutral-700">
        <CardHeader className="border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <CardTitle className="text-lg font-bold">
            Sold Prices Over Time
          </CardTitle>
          <p className="text-sm text-neutral-500">
            Quarterly average sold prices in {areaName}
          </p>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500 dark:bg-neutral-800/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Quarter</th>
                <th className="px-6 py-4 text-right font-semibold">
                  Avg. Sold Price
                </th>
                <th className="px-6 py-4 text-right font-semibold">
                  Transactions
                </th>
                <th className="px-6 py-4 text-right font-semibold">
                  Change (QoQ)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {QUARTERLY_TRENDS.map((row) => (
                <tr
                  key={row.quarter}
                  className="transition-colors even:bg-neutral-50 hover:bg-neutral-100 dark:even:bg-neutral-800/20 dark:hover:bg-neutral-800/30"
                >
                  <td className="px-6 py-4 font-medium">{row.quarter}</td>
                  <td className="px-6 py-4 text-right font-bold">
                    {row.avgPrice}
                  </td>
                  <td className="px-6 py-4 text-right text-neutral-500">
                    {row.transactions}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <VsAskingBadge value={row.change} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
