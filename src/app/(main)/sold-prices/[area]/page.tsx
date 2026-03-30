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
import { getAreaSoldPrices, getSoldPriceStats } from "@/services/areas/sold-prices-service";
import { soldPricesDatasetJsonLd } from "@/lib/seo/area-jsonld";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { SoldPriceRow } from "@/components/areas/SoldPriceRow";
import { DataAttribution } from "@/components/areas/DataAttribution";
import { AreaSearchCTA } from "@/components/areas/AreaSearchCTA";
import { InternalLinkCard } from "@/components/areas/InternalLinkCard";

type SoldPricesPageProps = Readonly<{
  params: Promise<{ area: string }>;
}>;

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

export async function generateMetadata({
  params,
}: SoldPricesPageProps): Promise<Metadata> {
  const { area } = await params;
  const areaName = area.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  return {
    title: `Sold Prices in ${areaName} | Britestate`,
    description: `View recent property sold prices, market trends, and transaction data in ${areaName}. Historical land registry data powered by Britestate.`,
    alternates: { canonical: `/sold-prices/${area}` },
    openGraph: {
      title: `Sold Prices in ${areaName} | Britestate`,
      description: `View recent property sold prices, market trends, and transaction data in ${areaName}. Historical land registry data powered by Britestate.`,
      url: `/sold-prices/${area}`,
      type: "website",
    },
  };
}

export default async function SoldPricesPage({ params }: SoldPricesPageProps) {
  const { area } = await params;
  const areaName = area.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

  const { records, total } = await getAreaSoldPrices(area);
  const stats = await getSoldPriceStats(area);

  return (
    <div className="bg-[#faf9f8] min-h-screen">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(soldPricesDatasetJsonLd(areaName, area, total)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Sold Prices", path: "/sold-prices" },
              { name: areaName, path: `/sold-prices/${area}` },
            ])
          ),
        }}
      />

      {/* ── Page Hero ── */}
      <header className="bg-brand-primary relative overflow-hidden pt-16 pb-20 px-4">
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 size-64 rounded-full bg-white/5" />
        <div className="relative z-10 max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6 flex text-sm text-white/60">
            <ol className="flex items-center gap-2">
              <li><Link className="hover:text-white transition-colors" href="/">Home</Link></li>
              <li><ChevronRight className="size-3.5" /></li>
              <li><Link className="hover:text-white transition-colors" href="/sold-prices/london">Sold Prices</Link></li>
              <li><ChevronRight className="size-3.5" /></li>
              <li className="font-semibold text-white">{areaName}</li>
            </ol>
          </nav>
          <span className="inline-block bg-white/10 text-white/75 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">Land Registry Data</span>
          <h1 className="font-heading text-[2.5rem] md:text-[3.5rem] font-black text-white mb-4 leading-none" style={{ letterSpacing: "-0.02em" }}>
            Sold Prices in{" "}
            <span className="text-brand-secondary">{areaName}</span>
          </h1>
          <p className="text-white/70 text-base max-w-xl mb-8">Recent property sales data from HM Land Registry. Updated monthly.</p>

          {/* Search bar */}
          <div className="flex flex-col items-stretch gap-3 md:flex-row max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/40" />
              <input
                className="w-full rounded-2xl bg-white/10 border border-white/15 py-4 pl-12 pr-4 text-white placeholder-white/40 outline-none backdrop-blur-sm focus:border-white/30 transition-all"
                placeholder="Enter postcode, street or town..."
                type="text"
                defaultValue={areaName}
                readOnly
              />
            </div>
            <button className="flex items-center justify-center gap-2 rounded-2xl bg-white text-brand-primary px-8 py-4 font-bold transition-all hover:bg-neutral-50 text-sm">
              Update Results
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 -mt-10 relative z-10">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Average Sold Price</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-2xl font-black font-heading">{stats.avgPrice}</h3>
              {stats.yoyChange !== undefined && (
                <span className="flex items-center text-xs font-bold text-emerald-600">
                  <TrendingUp className="size-3 mr-0.5" /> {stats.yoyChange}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-neutral-400">Past 12 months</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Total Transactions</p>
            <h3 className="text-2xl font-black font-heading mt-2">{stats.totalTransactions}</h3>
            <p className="mt-2 text-xs text-neutral-400">Last 12 months volume</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Avg Price vs Asking</p>
            <h3 className="text-2xl font-black font-heading text-red-500 mt-2">{stats.avgVsAsking}</h3>
            <p className="mt-2 text-xs text-neutral-400">Below asking on average</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Market Temperature</p>
            <div className="flex items-center gap-2 mt-2">
              <h3 className="text-2xl font-black font-heading text-brand-primary">Balanced</h3>
              <Thermometer className="size-5 text-brand-primary" />
            </div>
            <p className="mt-2 text-xs text-neutral-400">Neutral buyer/seller leverage</p>
          </div>
        </div>

        <DataAttribution
          source="HM Land Registry Price Paid Data"
          lastUpdated="March 2026"
          methodology="Transactions registered in the last 2-3 months may not yet appear"
        />

        {/* Main Content: Table + Map */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Table Section */}
          <div className="space-y-6 lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex flex-row items-center justify-between px-6 py-4 border-b border-[#f4f3f2]">
                <h2 className="text-lg font-black font-heading">Recent Sales in {areaName}</h2>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 rounded-xl bg-[#f4f3f2] px-3 py-1.5 text-xs font-bold hover:bg-brand-primary/10 transition-colors">
                    <Filter className="size-3.5" /> Filter
                  </button>
                  <button className="flex items-center gap-1 rounded-xl bg-[#f4f3f2] px-3 py-1.5 text-xs font-bold hover:bg-brand-primary/10 transition-colors">
                    <Download className="size-3.5" /> Export
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#faf9f8] text-xs uppercase tracking-wider text-neutral-400">
                    <tr>
                      <th className="px-6 py-4 font-bold">Address</th>
                      <th className="px-6 py-4 font-bold">Type &amp; Beds</th>
                      <th className="px-6 py-4 text-right font-bold">Sold Date</th>
                      <th className="px-6 py-4 text-right font-bold">Sold Price</th>
                      <th className="px-6 py-4 text-right font-bold">vs Asking</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4f3f2]">
                    {records.map((r) => (
                      <SoldPriceRow key={r.id} record={r} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-[#f4f3f2] p-4">
                <span className="text-xs text-neutral-400">
                  Showing 1–{records.length} of {total} results
                </span>
                <div className="flex gap-2">
                  <button className="rounded-xl bg-[#f4f3f2] p-2 disabled:opacity-40" disabled>
                    <ChevronLeft className="size-4" />
                  </button>
                  <button className="rounded-xl bg-[#f4f3f2] p-2 hover:bg-brand-primary/10 transition-colors">
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            <AreaSearchCTA areaName={areaName} citySlug={area} />

            {/* Price Trend Chart */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black font-heading">Price Trend (10 Years)</h2>
                  <p className="text-sm text-neutral-500 mt-0.5">Historical market performance in {areaName}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                  <span className="size-3 rounded-full bg-brand-primary inline-block" /> Avg. Sold Price
                </div>
              </div>
              <div className="relative flex h-64 items-end justify-between px-2">
                {/* Grid lines */}
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                  {[0,1,2,3].map((i) => <div key={i} className="h-px w-full bg-[#f4f3f2]" />)}
                </div>
                {/* Bars */}
                <div className="relative flex h-full w-full items-end gap-1 pt-4">
                  {CHART_BARS.map((bar, i) => (
                    <div
                      key={bar.year}
                      className={`group relative flex-1 rounded-t-lg transition-all ${
                        i === CHART_BARS.length - 1
                          ? "bg-brand-primary"
                          : i === CHART_BARS.length - 2
                            ? "bg-brand-primary/35 hover:bg-brand-primary/55"
                            : "bg-brand-primary/15 hover:bg-brand-primary/35"
                      }`}
                      style={{ height: bar.height }}
                    >
                      {i === CHART_BARS.length - 1 && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-brand-primary px-2 py-1 text-[10px] font-bold text-white shadow-lg">
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
            </div>
          </div>

          {/* Map Side Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
              <div className="px-6 py-4 border-b border-[#f4f3f2]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black font-heading">Map View</h2>
                  <span className="text-xs font-bold text-brand-primary cursor-pointer hover:underline">Expand Map</span>
                </div>
                <p className="text-sm text-neutral-400 mt-0.5">Viewing {areaName} area markers</p>
              </div>
              <div className="relative min-h-[500px] flex-1 bg-[#f4f3f2]">
                <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                  <p className="text-sm font-medium">Map view — coming soon</p>
                </div>
              </div>
              <div className="bg-[#faf9f8] p-4">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Info className="size-4 shrink-0" />
                  Prices shown are approximate based on public land registry data.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4">
          <InternalLinkCard
            title={`Properties for sale in ${areaName}`}
            description={`Browse current listings in ${areaName}`}
            href={`/search?city=${area}&type=buy`}
          />
          <InternalLinkCard
            title={`Properties to rent in ${areaName}`}
            description={`Find rentals in ${areaName}`}
            href={`/search?city=${area}&type=rent`}
          />
          <InternalLinkCard
            title={`${areaName} Area Guide`}
            description="Schools, transport, and local insights"
            href={`/areas/${area}`}
          />
        </div>
      </main>
    </div>
  );
}
