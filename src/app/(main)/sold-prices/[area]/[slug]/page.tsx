import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { History, MapPin, Share2, Heart, ExternalLink, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapEmbedClient } from "@/components/maps/MapEmbedClient";
import { getPropertySoldPrice } from "@/services/areas/sold-prices-service";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { DataAttribution } from "@/components/areas/DataAttribution";
import { AreaSearchCTA } from "@/components/areas/AreaSearchCTA";

export const revalidate = 3600; // ISR: re-generate every hour

type SoldPriceSlugProps = Readonly<{
  params: Promise<{ area: string; slug: string }>;
}>;

const SLUG_PATTERN = /^[a-z0-9-]{1,120}$/;

export async function generateMetadata({ params }: SoldPriceSlugProps): Promise<Metadata> {
  const { area, slug } = await params;
  if (!SLUG_PATTERN.test(area) || !SLUG_PATTERN.test(slug)) {
    notFound();
  }
  const property = await getPropertySoldPrice(slug);
  if (!property) return { title: "Property Not Found | Britestate" };
  return {
    title: `${property.address} Sold Price History | Britestate`,
    description: `See the full sold price history for ${property.address}. Last sold for £${property.lastPrice.toLocaleString()}.`,
    alternates: { canonical: `/sold-prices/${area}/${slug}` },
    openGraph: {
      title: `${property.address} Sold Price History | Britestate`,
      description: `See the full sold price history for ${property.address}. Last sold for £${property.lastPrice.toLocaleString()}.`,
      url: `/sold-prices/${area}/${slug}`,
      type: "website",
    },
  };
}

export default async function SoldPricesSlugPage({ params }: SoldPriceSlugProps) {
  const { area, slug } = await params;
  if (!SLUG_PATTERN.test(area) || !SLUG_PATTERN.test(slug)) {
    notFound();
  }
  const property = await getPropertySoldPrice(slug);

  if (!property) {
    notFound();
  }

  const { address, postcode, propertyType, lastPrice, lastDate, growth, estimatedValue, history, nearby, areaGrowth, areaName, coordinates } = property;

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Sold Prices", path: "/sold-prices" },
              { name: areaName, path: `/sold-prices/${area}` },
              { name: address, path: `/sold-prices/${area}/${slug}` },
            ])
          ),
        }}
      />

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-primary/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <nav className="text-sm text-primary/60 flex items-center gap-2" aria-label="Breadcrumb">
            <Link href="/sold-prices" className="hover:text-primary">Sold Prices</Link>
            <span>›</span>
            <Link href={`/sold-prices/${area}`} className="hover:text-primary capitalize">{area.replace(/-/g, " ")}</Link>
            <span>›</span>
            <span className="text-on-surface font-medium truncate max-w-[200px]">{address}</span>
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
                    <p className="text-lg text-primary/70 mt-1">{postcode} · {propertyType}</p>
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
                    <p className="text-xs text-[--color-on-surface-variant] font-medium uppercase tracking-wide mb-1">Last Sold Price</p>
                    <p className="text-2xl font-black text-primary font-heading">£{lastPrice.toLocaleString()}</p>
                    <p className="text-xs text-[--color-on-surface-variant] mt-1">{lastDate}</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 p-5 border-l-4 border-[--color-success]">
                    <p className="text-xs text-[--color-on-surface-variant] font-medium uppercase tracking-wide mb-1">Market Performance</p>
                    <p className="text-2xl font-black text-[--color-success]">{growth}</p>
                    <p className="text-xs text-[--color-on-surface-variant] mt-1">Since last purchase</p>
                  </div>
                  <div className="rounded-xl bg-primary/5 p-5">
                    <p className="text-xs text-[--color-on-surface-variant] font-medium uppercase tracking-wide mb-1">Estimated Value</p>
                    <p className="text-2xl font-black text-primary font-heading">{estimatedValue}</p>
                    <p className="text-xs text-[--color-on-surface-variant] mt-1">Britestate estimate</p>
                    <p className="text-[10px] text-[--color-on-surface-variant] mt-1 italic">
                      This is an automated estimate based on historical transactions and market trends. It is not a formal valuation. For a professional valuation, contact a RICS-qualified surveyor.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price History Card */}
            <div className="rounded-xl bg-white shadow-sm border border-primary/10 p-6 sm:p-8">
              <h2 className="font-bold text-xl text-on-surface font-heading flex items-center gap-2 mb-6">
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
                        <span className="text-xs font-medium text-[--color-success] bg-brand-primary-lighter px-2 py-1 rounded-full">
                          {entry.change}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <DataAttribution
                source="HM Land Registry Price Paid Data"
                lastUpdated="Open Government Licence v3.0"
                className="mt-6"
              />
            </div>

            {/* Nearby Sold Prices */}
            {nearby.length > 0 && (
              <div className="rounded-xl bg-white shadow-sm border border-primary/10 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-xl text-on-surface font-heading">Nearby Sold Prices</h2>
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
                        <TableCell>
                          <Link
                            href={`/sold-prices/${property.areaSlug}/${item.slug}`}
                            className="hover:text-primary transition-colors"
                          >
                            {item.address}
                          </Link>
                        </TableCell>
                        <TableCell className="font-bold text-primary text-right">{item.price}</TableCell>
                        <TableCell className="text-[--color-on-surface-variant] text-right">{item.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <AreaSearchCTA areaName={areaName} citySlug={area} />
          </div>

          {/* ── Sidebar (1/3) ── */}
          <div className="space-y-6">

            {/* Map Card */}
            <div className="rounded-xl bg-white shadow-sm border border-primary/10 p-4 overflow-hidden">
              <div className="h-64 rounded-lg overflow-hidden relative">
                <MapEmbedClient
                  latitude={coordinates.lat}
                  longitude={coordinates.lng}
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
            </div>

            {/* Sticky Valuation CTA */}
            <div className="rounded-xl bg-primary text-white p-6 shadow-xl sticky top-24">
              <h3 className="text-xl font-bold mb-4">Thinking of selling?</h3>
              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <p className="text-sm text-white/80">
                  Local prices in {areaName} have increased by{" "}
                  <span className="font-bold text-[--color-success]">{areaGrowth}%</span> in the last 12 months
                </p>
              </div>
              <button className="w-full bg-white text-primary font-bold py-3 rounded-lg hover:bg-[--color-surface-container-low] transition-all flex items-center justify-center gap-2">
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
