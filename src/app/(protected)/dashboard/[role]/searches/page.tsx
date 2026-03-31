import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { SavedSearch } from "@/types/property";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Bell,
  BellOff,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  Clock,
  ArrowRight,
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
      filters.property_type
        .map((t) => t.replace(/_/g, " "))
        .join(", "),
    );
  }

  return parts.length > 0 ? parts.join(" · ") : "All properties";
}

function formatFrequency(freq: string): string {
  switch (freq) {
    case "instant":
      return "Instant alerts";
    case "daily":
      return "Daily digest";
    case "weekly":
      return "Weekly digest";
    default:
      return `${freq} alerts`;
  }
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
  const activeAlerts = searches.filter((s) => s.alerts_enabled).length;

  return (
    <div className="flex flex-col gap-8">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900">
          Saved Searches & Alerts
        </h1>
        <p className="text-sm text-neutral-500">
          {count === 0
            ? "Save searches to get notified when new properties match your criteria"
            : `${count} ${count === 1 ? "search" : "searches"} saved · ${activeAlerts} alert${activeAlerts !== 1 ? "s" : ""} active`}
        </p>
      </div>

      {/* ── Summary stats — shown when there are searches ────────────── */}
      {count > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryTile
            icon={<Search className="size-5 text-brand-primary" strokeWidth={1.25} />}
            label="Total Searches"
            value={count}
          />
          <SummaryTile
            icon={<Bell className="size-5 text-success" strokeWidth={1.25} />}
            label="Active Alerts"
            value={activeAlerts}
            valueColor="text-success"
          />
          <SummaryTile
            icon={<Sparkles className="size-5 text-brand-secondary" strokeWidth={1.25} />}
            label="New Matches"
            value={searches.reduce((sum, s) => sum + (s.new_results_count ?? 0), 0)}
            valueColor="text-brand-secondary"
          />
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {count === 0 ? (
        <Card className="overflow-hidden rounded-2xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-primary-lighter">
              <Bell
                className="size-8 text-brand-primary"
                strokeWidth={1.25}
              />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-lg font-semibold text-neutral-900">
                No saved searches yet
              </h3>
              <p className="max-w-sm text-sm text-neutral-500">
                Save a search from the property search page and we&apos;ll send
                you alerts when new matches are listed.
              </p>
            </div>
            <Link href="/search">
              <Button className="mt-2 gap-2 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-light">
                <Search className="size-4" strokeWidth={1.25} />
                Start a Search
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* ── Search list ───────────────────────────────────────────── */
        <div className="flex flex-col gap-3">
          {searches.map((search) => (
            <Card
              key={search.id}
              className="overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="flex items-start justify-between gap-4 p-5">
                {/* Left: icon + content */}
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  {/* Search icon container */}
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary-lighter">
                    <SlidersHorizontal
                      className="size-5 text-brand-primary"
                      strokeWidth={1.25}
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {/* Name + new badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-sm font-semibold text-neutral-900 truncate">
                        {search.name}
                      </h3>
                      {(search.new_results_count ?? 0) > 0 && (
                        <Badge className="bg-brand-primary text-white text-xs font-medium">
                          {search.new_results_count} new
                        </Badge>
                      )}
                    </div>

                    {/* Filters summary */}
                    <p className="text-xs text-neutral-500 truncate">
                      {formatFilters(search.filters)}
                    </p>

                    {/* Location (if set via q param) */}
                    {"q" in search.filters && Boolean((search.filters as Record<string, unknown>).q) && (
                      <p className="flex items-center gap-1 text-xs text-neutral-500">
                        <MapPin className="size-3 shrink-0" strokeWidth={1.25} />
                        {String((search.filters as Record<string, unknown>).q)}
                      </p>
                    )}

                    {/* Alert status + frequency */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {search.alerts_enabled ? (
                        <Badge
                          variant="outline"
                          className="gap-1.5 border-success/30 bg-success-light text-success text-xs font-medium"
                        >
                          <Bell className="size-3" strokeWidth={1.25} />
                          {formatFrequency(search.alert_frequency)}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1.5 border-neutral-200 bg-neutral-50 text-neutral-400 text-xs font-medium"
                        >
                          <BellOff className="size-3" strokeWidth={1.25} />
                          Alerts off
                        </Badge>
                      )}

                      {/* Last updated */}
                      <span className="flex items-center gap-1 text-xs text-neutral-400">
                        <Clock className="size-3" strokeWidth={1.25} />
                        {formatRelativeTime(String(search.created_at))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: actions + view link */}
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/search?saved=${search.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 px-2 text-xs text-brand-primary hover:text-brand-primary"
                      aria-label={`View results for ${search.name}`}
                    >
                      View results
                      <ArrowRight className="size-3" strokeWidth={1.25} />
                    </Button>
                  </Link>
                  <SavedSearchActions search={search} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary tile sub-component
// ---------------------------------------------------------------------------

function SummaryTile({
  icon,
  label,
  value,
  valueColor = "text-neutral-900",
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  value: number;
  valueColor?: string;
}>) {
  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-50">
          {icon}
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-medium text-neutral-500">{label}</p>
          <p className={`font-heading text-xl font-bold tracking-tight ${valueColor}`}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
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

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
