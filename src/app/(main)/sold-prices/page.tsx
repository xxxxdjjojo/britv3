import type { Metadata } from "next";
import Link from "next/link";
import { Search, TrendingUp, MapPin, ArrowRight } from "lucide-react";
import { getAreaSlugsWithSoldPrices, getAreaSoldPriceSummary } from "@/services/areas/mock-data/sold-prices";

export const metadata: Metadata = {
  title: "Sold Prices | Britestate",
  description:
    "Browse property sold prices across the UK. View recent transactions, price trends, and market data by area — powered by Land Registry records.",
};

function slugToLabel(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function SoldPricesIndexPage() {
  const areaSlugs = getAreaSlugsWithSoldPrices();
  const popularAreas = areaSlugs.map((slug) => {
    const summary = getAreaSoldPriceSummary(slug);
    return {
      slug,
      label: slugToLabel(slug),
      avgPrice: summary.avgPrice > 0 ? `£${summary.avgPrice.toLocaleString("en-GB")}` : "N/A",
      transactions: summary.totalTransactions.toLocaleString("en-GB"),
    };
  });

  return (
    <>
      {/* Hero */}
      <header className="bg-gradient-to-br from-primary via-primary to-[#003629] py-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full -ml-28 -mb-28 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-white/10 text-white">
            <TrendingUp className="size-8" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
            UK Property Sold Prices
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Explore recent property transactions, price trends, and market data
            across the UK — powered by Land Registry records.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Search */}
        <div className="mx-auto max-w-xl mb-14">
          <Link
            href="/search"
            className="flex w-full items-center rounded-2xl border border-primary/20 bg-white py-4 shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-primary/20"
            aria-label="Search sold prices"
          >
            <div className="flex items-center justify-center pl-4 pr-3 text-neutral-400">
              <Search className="size-5" />
            </div>
            <span className="flex-1 text-neutral-400">
              Enter a town, city, or postcode...
            </span>
            <div className="flex items-center pr-4">
              <span className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">
                Search
              </span>
            </div>
          </Link>
        </div>

        {/* Popular Areas Grid */}
        <section>
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-bold text-neutral-900">
              Popular Areas
            </h2>
            <p className="mt-2 text-neutral-500">
              Select an area to view recent sold prices and market trends.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popularAreas.map((area) => (
              <Link
                key={area.slug}
                href={`/sold-prices/${area.slug}`}
                className="group rounded-xl border border-primary/10 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30"
              >
                <div className="mb-3 flex items-center gap-2 text-primary">
                  <MapPin className="size-4" />
                  <span className="font-heading text-lg font-bold">
                    {area.label}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-sm mb-3">
                  <span className="font-semibold text-neutral-900">
                    {area.avgPrice}
                  </span>
                  <span className="text-neutral-400">
                    {area.transactions} sales
                  </span>
                </div>
                <div className="flex items-center gap-1 text-primary text-xs font-semibold group-hover:gap-2 transition-all">
                  View prices <ArrowRight className="size-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Browse All CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/areas"
            className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
          >
            Browse all areas
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
    </>
  );
}
