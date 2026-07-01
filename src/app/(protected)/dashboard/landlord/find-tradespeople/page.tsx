"use client";

/**
 * Find Tradespeople (9.22)
 * Landlord-context browse page for maintenance and repair tradespeople,
 * filtered by relevant service categories from the marketplace.
 * Includes client-side category chips for filtering.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { tradespersonProfilePath } from "@/lib/providers/profile-path";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Star,
  Wrench,
  ExternalLink,
  AlertCircle,
  Filter,
} from "lucide-react";
import type { ServiceCategory } from "@/types/marketplace";

// -- Constants ---------------------------------------------------------------

const TRADESPERSON_CATEGORIES: ServiceCategory[] = [
  "plumber",
  "electrician",
  "handyman",
  "cleaning",
  "locksmith",
  "pest_control",
];

const CATEGORY_LABELS: Partial<Record<ServiceCategory, string>> = {
  plumber: "Plumber",
  electrician: "Electrician",
  handyman: "Handyman / Builder",
  cleaning: "Cleaning",
  locksmith: "Locksmith",
  pest_control: "Pest Control",
};

// -- Types -------------------------------------------------------------------

type Tradesperson = {
  user_id: string;
  business_name: string;
  business_description: string | null;
  services: ServiceCategory[];
  slug: string;
  years_in_business: number;
  completed_jobs_count: number;
};

// -- Helpers -----------------------------------------------------------------

function StarRating({ count = 0 }: Readonly<{ count?: number }>) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i <= Math.min(5, Math.ceil(count / 5))
              ? "fill-warning text-warning"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function categoryLabel(cat: ServiceCategory): string {
  return CATEGORY_LABELS[cat] ?? cat.replace(/_/g, " ");
}

// -- Page component ----------------------------------------------------------

type CategoryFilter = ServiceCategory | "all";

export default function FindTradespeopleePage() {
  const [tradespeople, setTradespeople] = useState<Tradesperson[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);

  const loadTradespeople = useCallback(async () => {
    setLoading(true);

    try {
      const supabase = createClient();

      // Query providers with any tradesperson service category.
      // Supabase supports the && (overlap) operator for array fields via .overlaps().
      const { data, error: queryError } = await supabase
        .from("service_provider_details")
        .select(
          "user_id, business_name, business_description, services, slug, years_in_business, completed_jobs_count",
        )
        .overlaps("services", TRADESPERSON_CATEGORIES)
        .order("completed_jobs_count", { ascending: false })
        .limit(50);

      if (queryError) {
        // Graceful empty state — Epic 4 table may not yet be deployed
        console.warn("Could not fetch tradespeople:", queryError.message);
        setTradespeople([]);
      } else {
        setTradespeople((data ?? []) as Tradesperson[]);
      }
    } catch (err) {
      console.warn("Find tradespeople fetch failed:", err);
      setTradespeople([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTradespeople();
  }, [loadTradespeople]);

  // Client-side filtering: category chip + search query
  const filtered = tradespeople.filter((t) => {
    const matchesCategory =
      activeCategory === "all" || t.services.includes(activeCategory);

    const matchesSearch =
      !searchQuery ||
      t.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.business_description ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight font-heading">
          Find Tradespeople
        </h1>
        <p className="text-sm text-muted-foreground">
          Find verified tradespeople for maintenance and repairs across your
          portfolio
        </p>
      </div>

      {/* Search + quick link */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tradespeople..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/dashboard/landlord/maintenance" />}
        >
          <AlertCircle className="mr-1.5 size-4" />
          Report a maintenance issue
        </Button>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        {(["all", ...TRADESPERSON_CATEGORIES] as CategoryFilter[]).map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-border bg-background text-muted-foreground hover:border-brand-primary/50 hover:text-foreground"
              }`}
            >
              {cat === "all" ? "All" : categoryLabel(cat)}
            </button>
          ),
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="h-5 w-2/3 rounded bg-muted" />
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-8 w-24 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Wrench className="size-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-muted-foreground">
                {tradespeople.length === 0
                  ? "Coming soon — tradespeople will be listed here once they register"
                  : `No ${activeCategory === "all" ? "" : categoryLabel(activeCategory) + " "}tradespeople match your search`}
              </p>
              {tradespeople.length > 0 && activeCategory !== "all" && (
                <button
                  onClick={() => setActiveCategory("all")}
                  className="mt-2 text-sm text-brand-primary underline-offset-2 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tradesperson cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((person) => {
            // Determine primary tradesperson category
            const primaryCat =
              person.services.find((s) => TRADESPERSON_CATEGORIES.includes(s))
              ?? person.services[0];

            return (
              <Card key={person.user_id} className="flex flex-col justify-between">
                <CardContent className="flex flex-col gap-3 pt-4">
                  {/* Name + category */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold leading-tight">
                        {person.business_name}
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {primaryCat ? categoryLabel(primaryCat) : "Tradesperson"}
                      </Badge>
                    </div>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary-lighter">
                      <Wrench className="size-5 text-brand-primary" />
                    </div>
                  </div>

                  {/* Description */}
                  {person.business_description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {person.business_description}
                    </p>
                  )}

                  {/* All offered services */}
                  <div className="flex flex-wrap gap-1">
                    {person.services
                      .filter((s) => TRADESPERSON_CATEGORIES.includes(s))
                      .map((s) => (
                        <Badge
                          key={s}
                          variant="secondary"
                          className="text-xs"
                        >
                          {categoryLabel(s)}
                        </Badge>
                      ))}
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <StarRating count={person.completed_jobs_count} />
                    <span>{person.completed_jobs_count} jobs</span>
                    <span>
                      {person.years_in_business} yr
                      {person.years_in_business !== 1 ? "s" : ""} exp
                    </span>
                  </div>

                  {/* View Profile button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 w-fit"
                    render={
                      <Link
                        href={tradespersonProfilePath(person.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <ExternalLink className="mr-1.5 size-3.5" />
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
