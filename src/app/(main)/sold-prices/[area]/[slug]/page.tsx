import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { History, MapPin, Share2, Heart, ExternalLink, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapEmbedClient } from "@/components/maps/MapEmbedClient";

export const dynamic = "force-dynamic";

type SoldPriceSlugProps = Readonly<{
  params: Promise<{ area: string; slug: string }>;
}>;

// Mock data — in production this would query: SELECT * FROM sold_prices WHERE slug = $1
const MOCK_PROPERTIES: Record<string, {
  address: string;
  postcode: string;
  type: string;
  lastPrice: number;
  lastDate: string;
  growth: string;
  estimatedValue: string;
  history: Array<{ price: number; date: string; change: string | null }>;
  nearby: Array<{ address: string; price: string; date: string }>;
  areaGrowth: string;
  area: string;
}> = {
  "14-south-street-isleworth-tw7-7bg": {
    address: "14 South Street, Isleworth",
    postcode: "TW7 7BG",
    type: "Terraced",
    lastPrice: 485000,
    lastDate: "Dec 2025",
    growth: "+18.4%",
    estimatedValue: "£512,000",
    history: [
      { price: 485000, date: "Dec 2025", change: null },
      { price: 409500, date: "Mar 2019", change: "+18.4%" },
      { price: 352000, date: "Jul 2014", change: "+16.3%" },
      { price: 210000, date: "Nov 2008", change: "+67.6%" },
    ],
    nearby: [
      { address: "22 South Street, TW7 7BG", price: "£465,000", date: "Oct 2025" },
      { address: "9 South Street, TW7 7BA", price: "£498,000", date: "Sep 2025" },
      { address: "31 South Street, TW7 7BH", price: "£452,000", date: "Aug 2025" },
      { address: "5 South Street, TW7 7BA", price: "£471,500", date: "Jul 2025" },
      { address: "18 South Street, TW7 7BG", price: "£489,000", date: "Jun 2025" },
      { address: "4 Mill Plat, TW7 6ES", price: "£508,000", date: "May 2025" },
    ],
    areaGrowth: "3.8",
    area: "Isleworth",
  },
};

const fetchPropertyBySlug = cache(async (slug: string) => {
  return MOCK_PROPERTIES[slug] ?? null;
});

const SLUG_PATTERN = /^[a-z0-9-]{1,120}$/;

export async function generateMetadata({ params }: SoldPriceSlugProps): Promise<Metadata> {
  const { area, slug } = await params;
  if (!SLUG_PATTERN.test(area) || !SLUG_PATTERN.test(slug)) {
    notFound();
  }
  const property = await fetchPropertyBySlug(slug);
  if (!property) return { title: "Property Not Found" };
  return {
    title: `${property.address} Sold Price History`,
    description: `See the full sold price history for ${property.address}. Last sold for £${property.lastPrice.toLocaleString()}.`,
    alternates: { canonical: `/sold-prices/${area}/${slug}` },
  };
}

export default async function SoldPricesSlugPage({ params }: SoldPriceSlugProps) {
  const { area, slug } = await params;
  if (!SLUG_PATTERN.test(area) || !SLUG_PATTERN.test(slug)) {
    notFound();
  }
  const property = await fetchPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  const { address, postcode, type, lastPrice, lastDate, growth, estimatedValue, history, nearby, areaGrowth } = property;

  return (
    <>
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-primary/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <nav className="text-sm text-primary/60 flex items-center gap-2" aria-label="Breadcrumb">
            <Link href="/sold-prices" className="hover:text-primary">Sold Prices</Link>
            <span>›</span>
            <Link href={`/sold-prices/${area}`} className="hover:text-primary capitalize">{area.replace(/-/g, " ")}</Link>
            <span>›</span>
            <span className="text-neutral-800 font-medium truncate max-w-[200px]">{address}</span>
          </nav>
          <div className="flex-shrink-0">
            <input
              type="text"
              placeholder="Search address or postcode..."
              className="rounded-full bg-primary/5 h-10 px-4 text-sm outline-none hidden sm:block w-56"
              readOnly
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── Main (2/3) ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Hero Card */}
            <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-primary/10">
              {/* 16:9 image placeholder */}
              <div className="aspect-video bg-primary/10 flex items-center justify-center">
                <MapPin className="size-12 text-primary/30" />
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                  <div>
                    <h1 className="text-3xl font-black text-primary font-heading leading-tight">{address}</h1>
                    <p className="text-lg text-primary/70 mt-1">{postcode} · {type}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="border border-primary/20 rounded-lg px-4 py-2 text-sm flex items-center gap-2 hover:bg-primary/5 transition-colors">
                      <Share2 className="size-4" /> Share
                    </button>
                    <button className="border border-primary/20 rounded-lg px-4 py-2 text-sm flex items-center gap-2 hover:bg-primary/5 transition-colors">
                      <Heart className="size-4" /> Save
                    </button>
                  </div>
                </div>

                {/* 3 stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-primary/5 p-5">
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-1">Last Sold Price</p>
                    <p className="text-2xl font-black text-primary font-heading">£{lastPrice.toLocaleString()}</p>
                    <p className="text-xs text-neutral-500 mt-1">{lastDate}</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 p-5 border-l-4 border-emerald-500">
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-1">Market Performance</p>
                    <p className="text-2xl font-black text-emerald-700">{growth}</p>
                    <p className="text-xs text-neutral-500 mt-1">Since last purchase</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 p-5">
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide mb-1">Estimated Value</p>
                    <p className="text-2xl font-black text-primary font-heading">{estimatedValue}</p>
                    <p className="text-xs text-neutral-500 mt-1">Britestate estimate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price History Card */}
            <div className="rounded-xl bg-white shadow-sm border border-primary/10 p-6 sm:p-8">
              <h2 className="font-bold text-xl text-neutral-900 font-heading flex items-center gap-2 mb-6">
                <History className="size-5 text-primary" /> Price History
              </h2>
              {/* Vertical timeline */}
              <div className="relative space-y-6 before:absolute before:left-3 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-primary/10">
                {history.map((entry, i) => (
                  <div key={entry.date} className="relative pl-10">
                    {/* Timeline dot */}
                    <span
                      className={`absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-white ${
                        i === 0
                          ? "bg-primary"
                          : i === 1
                            ? "bg-primary/40"
                            : "bg-primary/20"
                      }`}
                    />
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-bold text-lg text-primary">£{entry.price.toLocaleString()}</p>
                        <p className="text-sm text-primary/60">{entry.date}</p>
                      </div>
                      {entry.change && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          {entry.change}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby Sold Prices */}
            {nearby.length > 0 && (
              <div className="rounded-xl bg-white shadow-sm border border-primary/10 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-xl text-neutral-900 font-heading">Nearby Sold Prices</h2>
                  <Link href={`/sold-prices/${area}`} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                    View all on map <ExternalLink className="size-3" />
                  </Link>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Sold Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nearby.map((item) => (
                      <TableRow key={item.address} className="hover:bg-primary/5 transition-colors">
                        <TableCell>{item.address}</TableCell>
                        <TableCell className="font-bold text-primary text-right">{item.price}</TableCell>
                        <TableCell className="text-neutral-500 text-right">{item.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* ── Sidebar (1/3) ── */}
          <div className="space-y-6">

            {/* Map Card */}
            <div className="rounded-xl bg-white shadow-sm border border-primary/10 p-4 overflow-hidden">
              <div className="h-64 rounded-lg overflow-hidden relative">
                <MapEmbedClient
                  latitude={51.4754}
                  longitude={-0.3368}
                  zoom={16}
                  className="w-full h-full"
                  grayscale
                />
                <div className="absolute top-3 left-3 bg-primary text-white rounded px-3 py-1 text-[10px] font-bold shadow">
                  {postcode}
                </div>
              </div>
              <button className="w-full bg-primary text-white rounded-lg py-3 font-bold mt-4 hover:bg-primary/90 transition-colors text-sm">
                View Street View
              </button>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <span>🚂</span> Isleworth Station — 0.4 mi
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <span>🎓</span> Outstanding school — 0.3 mi
                </div>
              </div>
            </div>

            {/* Sticky Valuation CTA */}
            <div className="rounded-xl bg-primary text-white p-6 shadow-xl sticky top-24">
              <h3 className="text-xl font-bold mb-4">Thinking of selling?</h3>
              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <p className="text-sm text-white/80">
                  Local prices in {property.area} have increased by{" "}
                  <span className="font-bold text-emerald-300">{areaGrowth}%</span> in the last 12 months
                </p>
              </div>
              <button className="w-full bg-white text-primary font-bold py-3 rounded-lg hover:bg-neutral-100 transition-all flex items-center justify-center gap-2">
                <TrendingUp className="size-4" /> Get a free valuation
              </button>
              <p className="text-center text-xs text-white/60 mt-4">Trusted by 10,000+ homeowners</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
