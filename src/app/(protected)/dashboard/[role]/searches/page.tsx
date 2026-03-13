import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SavedSearch } from "@/types/property";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Bell } from "lucide-react";
import { SavedSearchActions } from "@/components/listings/SavedSearchActions";

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
      ? `\u00A3${(filters.min_price / 1000).toFixed(0)}K`
      : "";
    const max = filters.max_price
      ? `\u00A3${(filters.max_price / 1000).toFixed(0)}K`
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

export const metadata = {
  title: "Saved Searches - Britestate",
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Saved Searches</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {searches.length}{" "}
          {searches.length === 1 ? "search" : "searches"} saved
        </p>
      </div>

      {searches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-neutral-100">
              <Search className="size-8 text-neutral-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-neutral-900">
              No saved searches
            </h3>
            <p className="mt-2 max-w-md text-sm text-neutral-500">
              Save a search from the search page to get alerts when new
              properties match your criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {searches.map((search) => (
            <Card key={search.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium text-neutral-900">
                      {search.name}
                    </h3>
                    {search.new_results_count > 0 && (
                      <Badge className="bg-brand-accent text-white">
                        {search.new_results_count} new
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-neutral-500">
                    {formatFilters(search.filters)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {search.alerts_enabled ? (
                      <Badge
                        variant="outline"
                        className="gap-1 text-xs text-green-600"
                      >
                        <Bell className="size-3" />
                        {search.alert_frequency} alerts
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-neutral-400">
                        Alerts off
                      </Badge>
                    )}
                  </div>
                </div>

                <SavedSearchActions search={search} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
