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
  MapPin,
  ArrowRight,
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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6 flex text-sm text-[--color-on-surface-variant]">
        <ol className="flex items-center gap-2">
          <li>
            <Link className="hover:text-primary transition-colors" href="/">
              Home
            </Link>
          </li>
          <li>
            <ChevronRight className="size-4" />
          </li>
          <li>
            <Link className="hover:text-primary transition-colors" href="/sold-prices">
              Sold Prices
            </Link>
          </li>
          <li>
            <ChevronRight className="size-4" />
          </li>
          <li className="font-medium text-on-surface">
            {areaName}
          </li>
        </ol>
      </nav>

      {/* Hero / Search */}
      <div className="mb-10">
        <h1 className="mb-3 font-heading text-4xl font-bold text-on-surface">
          Property Sold Prices in{" "}
          <span className="text-primary">{areaName}</span>
        </h1>
        <p className="text-[--color-on-surface-variant] mb-6 max-w-xl">
          Recent transactions and price history from HM Land Registry.
        </p>
        <div className="flex flex-col items-end gap-4 md:flex-row max-w-2xl">
          <div className="w-full flex-1 relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[--color-on-surface-variant]" />
            <input
              className="w-full rounded-xl border border-[--color-outline-variant] bg-surface-container-lowest py-4 pl-12 pr-4 shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Enter postcode, street or town..."
              type="text"
              defaultValue={areaName}
              readOnly
            />
          </div>
          <button className="flex h-[56px] items-center gap-2 rounded-xl bg-primary px-8 font-semibold text-white transition-all hover:bg-primary/90">
            Update Results
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[--color-on-surface-variant]">
            Average Sold Price
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-bold font-heading text-primary">{stats.avgPrice}</h3>
            {stats.yoyChange !== undefined && (
              <span className="flex items-center text-sm font-medium text-[--color-success]">
                <TrendingUp className="size-3 mr-0.5" /> {stats.yoyChange}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-[--color-on-surface-variant]">Past 12 months</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[--color-on-surface-variant]">
            Total Transactions
          </p>
          <h3 className="text-3xl font-bold font-heading text-on-surface mt-2">{stats.totalTransactions}</h3>
          <p className="mt-2 text-xs text-[--color-on-surface-variant]">
            Last 12 months volume
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[--color-on-surface-variant]">
            Avg Price vs Asking
          </p>
          <h3 className="text-3xl font-bold font-heading text-error mt-2">{stats.avgVsAsking}</h3>
          <p className="mt-2 text-xs text-[--color-on-surface-variant]">
            Below asking on average
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-primary/10 shadow-sm p-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[--color-on-surface-variant]">
            Market Temperature
          </p>
          <div className="flex items-center gap-2 mt-2">
            <h3 className="text-3xl font-bold font-heading text-primary">
              Balanced
            </h3>
            <Thermometer className="size-5 text-primary" />
          </div>
          <p className="mt-2 text-xs text-[--color-on-surface-variant]">
            Neutral buyer/seller leverage
          </p>
        </div>
      </div>

      <DataAttribution
        source="HM Land Registry Price Paid Data"
        lastUpdated="March 2026"
        methodology="Transactions registered in the last 2-3 months may not yet appear"
        className="mb-8"
      />

      {/* Main Content: Table + Map */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Table Section */}
        <div className="space-y-6 lg:col-span-2">
          <div className="overflow-hidden rounded-xl bg-surface-container-lowest border border-primary/10 shadow-sm">
            <div className="flex flex-row items-center justify-between border-b border-primary/5 px-6 py-4">
              <h2 className="text-lg font-bold text-on-surface">
                Recent Sales in {areaName}
              </h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors">
                  <Filter className="size-3.5" /> Filter
                </button>
                <button className="flex items-center gap-1 rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors">
                  <Download className="size-3.5" /> Export
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-primary/5 text-xs uppercase tracking-wider text-[--color-on-surface-variant]">
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
                <tbody className="divide-y divide-primary/5">
                  {records.map((r) => (
                    <SoldPriceRow key={r.id} record={r} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-primary/5 p-4">
              <span className="text-xs text-[--color-on-surface-variant]">
                Showing 1-{records.length} of {total} results
              </span>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border border-primary/20 p-2 disabled:opacity-50"
                  disabled
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button className="rounded-lg border border-primary/20 p-2 hover:bg-primary/5 transition-colors">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>

          <AreaSearchCTA areaName={areaName} citySlug={area} />

          {/* Price Trend Chart */}
          <div className="rounded-xl bg-surface-container-lowest border border-primary/10 shadow-sm p-6">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-on-surface font-heading">Price Trend (10 Years)</h2>
                <p className="text-sm text-[--color-on-surface-variant] mt-0.5">
                  Historical market performance in {areaName}
                </p>
              </div>
              <div className="flex gap-2 text-xs font-medium items-center">
                <span className="size-3 rounded-full bg-primary inline-block" />
                <span className="text-[--color-on-surface-variant]">Avg. Sold Price</span>
              </div>
            </div>
            <div className="relative flex h-64 items-end justify-between px-2">
              {/* Grid lines */}
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                <div className="h-px w-full border-t border-primary/5" />
                <div className="h-px w-full border-t border-primary/5" />
                <div className="h-px w-full border-t border-primary/5" />
                <div className="h-px w-full border-t border-primary/5" />
              </div>
              {/* Bars */}
              <div className="relative flex h-full w-full items-end gap-1 pt-4">
                {CHART_BARS.map((bar, i) => (
                  <div
                    key={bar.year}
                    className={`group relative flex-1 rounded-t transition-all ${
                      i === CHART_BARS.length - 1
                        ? "bg-primary"
                        : i === CHART_BARS.length - 2
                          ? "bg-primary/30 hover:bg-primary/50"
                          : "bg-primary/20 hover:bg-primary/40"
                    }`}
                    style={{ height: bar.height }}
                  >
                    {i === CHART_BARS.length - 1 && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-primary px-2 py-1 text-[10px] font-bold text-white shadow-lg">
                        {bar.label} (2024)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-between px-2 text-[10px] font-bold uppercase tracking-widest text-[--color-on-surface-variant]">
              {CHART_BARS.map((bar) => (
                <span key={bar.year}>{bar.year}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Map Side Panel */}
        <div className="lg:col-span-1">
          <div className="flex h-full flex-col overflow-hidden rounded-xl bg-surface-container-lowest border border-primary/10 shadow-sm">
            <div className="border-b border-primary/5 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-on-surface">Map View</h2>
                <span className="text-xs font-bold text-primary cursor-pointer hover:underline">
                  Expand Map
                </span>
              </div>
              <p className="text-sm text-[--color-on-surface-variant] mt-0.5">
                Viewing {areaName} area markers
              </p>
            </div>
            <div className="relative min-h-[500px] flex-1 bg-primary/5">
              {/* Map placeholder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[--color-on-surface-variant]">
                <MapPin className="size-10 text-primary/20" />
                <p className="text-sm font-medium">
                  Map view — coming soon
                </p>
              </div>
            </div>
            <div className="bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-xs text-[--color-on-surface-variant]">
                <MapPin className="size-4 shrink-0 text-primary/40" />
                Prices shown are approximate based on public land registry data.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Internal links */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InternalLinkCard
          title={`Properties for sale in ${areaName}`}
          description={`Browse current listings in ${areaName}`}
          href={`/search?city=${area}&type=buy`}
          icon={<ArrowRight className="size-5" />}
        />
        <InternalLinkCard
          title={`Properties to rent in ${areaName}`}
          description={`Find rentals in ${areaName}`}
          href={`/search?city=${area}&type=rent`}
          icon={<ArrowRight className="size-5" />}
        />
        <InternalLinkCard
          title={`${areaName} Area Guide`}
          description={`Schools, transport, and local insights`}
          href={`/areas/${area}`}
          icon={<MapPin className="size-5" />}
        />
      </div>
    </main>
  );
}
