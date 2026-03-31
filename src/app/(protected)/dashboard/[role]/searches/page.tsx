import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { SavedSearch } from "@/types/property";
import { Button } from "@/components/ui/button";
import {
  Search,
  Bell,
  Sparkles,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { SavedSearchActions } from "@/components/listings/SavedSearchActions";

function formatFilters(filters: SavedSearch["filters"]): string {
  const parts: string[] = [];

  if (filters.listing_type) {
    parts.push(filters.listing_type === "sale" ? "For Sale" : "To Rent");
  }
  if (filters.min_bedrooms) {
    parts.push(`${filters.min_bedrooms}+ beds`);
  }
  if (filters.min_price || filters.max_price) {
    const min = filters.min_price
      ? `\u00A3${(filters.min_price / 1000).toFixed(0)}K`
      : "";
    const max = filters.max_price
      ? `\u00A3${(filters.max_price / 1000).toFixed(0)}K`
      : "";
    if (min && max) {
      parts.push(`${min} \u2013 ${max}`);
    } else if (min) {
      parts.push(`${min}+`);
    } else {
      parts.push(`Up to ${max}`);
    }
  }
  if (filters.property_type && filters.property_type.length > 0) {
    parts.push(
      filters.property_type.map((t) => t.replace(/_/g, " ")).join(", "),
    );
  }

  return parts.length > 0 ? parts.join(" · ") : "All properties";
}


export const metadata = {
  title: "Saved Searches — Britestate",
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
  const count = searches.length;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ── Page description ─────────────────────────────────────────── */}
      <p className="max-w-2xl leading-relaxed text-neutral-500">
        Manage your bespoke property notifications. Our algorithm monitors the
        market 24/7 to ensure you never miss a property that fits your
        requirements.
      </p>

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {count === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 rounded-2xl bg-white py-16 text-center shadow-sm">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#f4f3f2]">
            <Bell className="size-8 text-emerald-900" strokeWidth={1.25} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-heading text-xl font-bold text-neutral-900">
              No saved searches yet
            </h3>
            <p className="max-w-sm text-sm text-neutral-500">
              Save a search from the property search page and we&apos;ll send
              you alerts when new matches are listed.
            </p>
          </div>
          <Link href="/search">
            <Button className="mt-2 gap-2 rounded-xl bg-brand-primary-dark text-white hover:opacity-90">
              <Search className="size-4" strokeWidth={1.25} />
              Start a Search
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* ── Search cards grid ────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            {searches.map((search) => {
              const newCount = search.new_results_count ?? 0;
              return (
                <div
                  key={search.id}
                  className="flex h-full flex-col rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Header */}
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-secondary-dark">
                        Search Criteria
                      </span>
                      <h3 className="font-heading text-xl font-bold text-neutral-900">
                        {search.name}
                      </h3>
                      <p className="text-xs font-medium text-neutral-500">
                        {formatFilters(search.filters)}
                      </p>
                    </div>

                    {newCount > 0 ? (
                      <div className="flex shrink-0 items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                        <Sparkles className="size-4" strokeWidth={1.5} />
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          {newCount} new{" "}
                          {newCount === 1 ? "property" : "properties"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex shrink-0 items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-500">
                        <Bell className="size-4" strokeWidth={1.5} />
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          No new matches
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="mb-8 mt-auto grid grid-cols-2 gap-8">
                    {/* Alert frequency */}
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                        Alert Frequency
                      </label>
                      <div className="flex rounded-lg bg-[#f4f3f2] p-1">
                        {(["instant", "daily", "weekly"] as const).map(
                          (freq) => (
                            <span
                              key={freq}
                              className={`flex-1 rounded-md py-1.5 text-center text-[11px] font-bold transition-all ${
                                search.alert_frequency === freq
                                  ? "bg-white text-brand-primary-dark shadow-sm"
                                  : "text-neutral-500"
                              }`}
                            >
                              {freq.toUpperCase()}
                            </span>
                          ),
                        )}
                      </div>
                    </div>

                    {/* Last activity */}
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                        Last Activity
                      </label>
                      <p className="py-1.5 text-sm font-medium text-neutral-900">
                        {formatRelativeTime(String(search.created_at))}
                      </p>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between border-t border-neutral-100 pt-6">
                    {/* SavedSearchActions renders Run + Delete buttons */}
                    <SavedSearchActions search={search} />

                    <Link href={`/search?saved=${search.id}`}>
                      <button
                        type="button"
                        className="flex items-center gap-3 font-heading text-sm font-bold text-brand-primary-dark transition-transform hover:translate-x-1"
                        aria-label={`View results for ${search.name}`}
                      >
                        View Results
                        <ArrowRight className="size-4" strokeWidth={1.5} />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* ── Create new search card ──────────────────────────────── */}
            <Link href="/search" aria-label="Start a new saved search">
              <div className="flex h-full min-h-[220px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-neutral-200 p-8 text-center transition-all hover:border-brand-primary-dark/40 hover:bg-brand-primary-dark/[0.02]">
                <div className="flex size-16 items-center justify-center rounded-full bg-[#f4f3f2] text-neutral-400 transition-colors hover:bg-brand-primary-dark/5 hover:text-brand-primary-dark">
                  <PlusCircle className="size-8" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-neutral-900">
                    Start a New Hunt
                  </h4>
                  <p className="mt-1 max-w-[200px] text-sm text-neutral-500">
                    Define new parameters for your property search.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
