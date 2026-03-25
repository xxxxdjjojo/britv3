import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SavedSearch } from "@/types/property";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { SavedSearchCard } from "@/components/listings/SavedSearchCard";

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
            <SavedSearchCard key={search.id} search={search} />
          ))}
        </div>
      )}
    </div>
  );
}
