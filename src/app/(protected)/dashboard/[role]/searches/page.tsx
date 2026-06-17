import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SavedSearch } from "@/types/property";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { SavedSearchActions } from "@/components/listings/SavedSearchActions";
import { ArrowRight, Bell, Compass, Plus } from "lucide-react";

function formatFilters(filters: SavedSearch["filters"]): string {
  const parts: string[] = [];

  if (filters.listing_type) {
    parts.push(filters.listing_type === "sale" ? "Sale" : "Rent");
  }
  if (filters.min_bedrooms) {
    parts.push(`${filters.min_bedrooms}+ beds`);
  }
  if (filters.min_price || filters.max_price) {
    const min = filters.min_price
      ? `£${(filters.min_price / 1000).toFixed(0)}K`
      : "";
    const max = filters.max_price
      ? `£${(filters.max_price / 1000).toFixed(0)}K`
      : "";
    if (min && max) {
      parts.push(`${min}-${max}`);
    } else if (min) {
      parts.push(`${min}+`);
    } else {
      parts.push(`Up to ${max}`);
    }
  }
  if (filters.property_type && filters.property_type.length > 0) {
    parts.push(filters.property_type.join(", "));
  }

  return parts.length > 0 ? parts.join(", ") : "All properties";
}

const ALERT_FREQUENCIES: SavedSearch["alert_frequency"][] = [
  "instant",
  "daily",
  "weekly",
];

const FREQUENCY_LABELS: Record<SavedSearch["alert_frequency"], string> = {
  instant: "Instant",
  daily: "Daily",
  weekly: "Weekly",
};

function formatLastActivity(date: Date | null): string {
  if (!date) {
    return "No new activity yet";
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

type RecommendedProperty = Readonly<{
  title: string;
  location: string;
  price: string;
}>;

const RECOMMENDED: readonly RecommendedProperty[] = [
  { title: "The Glass Pavilion", location: "Surrey Hills", price: "£3,450,000" },
  { title: "Coastal Retreat", location: "St Ives", price: "£1,850,000" },
  { title: "Wapping Foundry Loft", location: "East London", price: "£980,000" },
];

export const metadata = {
  title: "Saved Searches & Alerts - Britestate",
  description: "Manage your saved property searches and alerts",
};

export default async function SavedSearchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: savedSearches } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const searches = (savedSearches ?? []) as SavedSearch[];

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Saved Searches &amp; Alerts
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Manage your bespoke property notifications. Our algorithm scans the
            market 24/7 so you never miss a sanctuary that fits your criteria.
          </p>
        </div>
        <Link
          href="/search"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-dark"
        >
          <Plus className="size-4" />
          Create New Alert
        </Link>
      </header>

      {searches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-primary/10">
            <Compass className="size-8 text-brand-primary" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-bold text-neutral-900">
            Start a New Hunt
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
            Define new parameters for your future residence and we&apos;ll alert
            you the moment a match appears.
          </p>
          <Link
            href="/search"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-dark"
          >
            <Plus className="size-4" />
            Create New Alert
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {searches.map((search) => (
            <article
              key={search.id}
              className="flex flex-col rounded-xl border border-border bg-surface p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                    Search Criteria
                  </p>
                  <h3 className="mt-2 truncate font-heading text-xl font-bold text-neutral-900">
                    {search.name}
                  </h3>
                  <p className="mt-1 truncate text-sm text-neutral-500">
                    {formatFilters(search.filters)}
                  </p>
                </div>
                {search.new_results_count > 0 ? (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-primary">
                    {search.new_results_count} New Properties
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    No New Matches
                  </span>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                    Alert Frequency
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-neutral-100 p-1">
                    {ALERT_FREQUENCIES.map((frequency) => {
                      const isActive =
                        search.alerts_enabled &&
                        search.alert_frequency === frequency;
                      return (
                        <span
                          key={frequency}
                          className={
                            isActive
                              ? "inline-flex items-center gap-1 rounded-full bg-brand-primary px-2.5 py-1 text-xs font-semibold text-white"
                              : "rounded-full px-2.5 py-1 text-xs font-medium text-neutral-500"
                          }
                        >
                          {isActive && <Bell className="size-3" />}
                          {FREQUENCY_LABELS[frequency]}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                    Last Activity
                  </p>
                  <p className="mt-2 text-sm font-medium text-neutral-700">
                    {formatLastActivity(search.last_alerted_at)}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
                <SavedSearchActions search={search} />
                <Link
                  href="/search"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary transition-colors hover:text-brand-primary-dark"
                >
                  View Results
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          ))}

          {/* Start a New Hunt tile */}
          <Link
            href="/search"
            className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface p-6 text-center transition-colors hover:border-brand-primary/40 hover:bg-brand-primary/5"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-primary/10 transition-colors group-hover:bg-brand-primary/20">
              <Plus className="size-6 text-brand-primary" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-bold text-neutral-900">
              Start a New Hunt
            </h3>
            <p className="mt-2 max-w-xs text-sm text-neutral-500">
              Define new parameters for your future residence.
            </p>
          </Link>
        </div>
      )}

      {/* Recommended for You */}
      <section className="space-y-5">
        <SectionHeader
          title="Recommended for You"
          action={{ label: "Explore All Recommendations", href: "/search" }}
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {RECOMMENDED.map((property) => (
            <Link
              key={property.title}
              href="/search"
              className="group overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-brand-primary/10 via-neutral-100 to-brand-primary/5" />
              <div className="p-4">
                <h3 className="font-heading text-base font-bold text-neutral-900">
                  {property.title}
                </h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
                  {property.location}
                </p>
                <p className="mt-2 text-sm font-semibold text-brand-primary">
                  {property.price}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
