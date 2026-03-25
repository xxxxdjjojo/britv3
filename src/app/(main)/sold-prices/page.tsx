import type { Metadata } from "next";
import Link from "next/link";
import { Search, TrendingUp, MapPin, Sparkles } from "lucide-react";
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
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Page Header */}
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
          <TrendingUp className="size-8" />
        </div>
        <h1 className="font-heading text-4xl font-bold text-neutral-900 sm:text-5xl">
          UK Property Sold Prices
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          Explore recent property transactions, price trends, and market data
          across the UK — powered by Land Registry records.
        </p>
      </div>

      {/* Search */}
      <div className="mx-auto mt-10 max-w-xl">
        <Link
          href="/search"
          className="flex w-full items-center rounded-xl border border-neutral-200 bg-white py-4 shadow-sm transition-all hover:ring-2 hover:ring-brand-primary/20"
          aria-label="Search sold prices"
        >
          <div className="flex items-center justify-center pl-4 pr-3 text-neutral-400">
            <Search className="size-5" />
          </div>
          <span className="flex-1 text-neutral-400">
            Enter a town, city, or postcode...
          </span>
          <div className="flex items-center pr-4">
            <span className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-sm font-bold text-white">
              <Sparkles className="size-4" />
              Search
            </span>
          </div>
        </Link>
      </div>

      {/* Popular Areas Grid */}
      <section className="mt-16">
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Popular Areas
        </h2>
        <p className="mt-2 text-neutral-500">
          Select an area to view recent sold prices and market trends.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularAreas.map((area) => (
            <Link
              key={area.slug}
              href={`/sold-prices/${area.slug}`}
              className="group rounded-xl border border-neutral-200 p-5 transition-all hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-2 text-brand-primary">
                <MapPin className="size-4" />
                <span className="font-heading text-lg font-bold">
                  {area.label}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold text-neutral-900">
                  {area.avgPrice}
                </span>
                <span className="text-neutral-400">
                  {area.transactions} sales
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Browse All CTA */}
      <div className="mt-12 text-center">
        <Link
          href="/areas"
          className="inline-flex items-center gap-2 font-semibold text-brand-primary hover:underline"
        >
          Browse all areas
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
