"use client";

import { useState, useMemo } from "react";
import { Search, Star, CheckCircle2, MapPin } from "lucide-react";

export type ProviderResult = {
  id: string;
  business_name: string;
  category: string | null;
  average_rating: number | null;
  city: string | null;
};

type Props = Readonly<{
  maintenanceCategory: string;
  propertyPostcode: string;
  currentAssignedId?: string;
  providers: ProviderResult[];
  onAssign: (providerId: string) => void;
  isAssigning: boolean;
}>;

const CATEGORY_LABELS: Record<string, string> = {
  plumber: "Plumbing",
  electrician: "Electrical",
  gas_engineer: "Gas / Heating",
  builder: "Building",
  general: "General",
  locksmith: "Locksmith",
  glazier: "Glazing",
  decorator: "Decorating",
};

/**
 * TradesPersonAssignModal
 * Searchable list of marketplace providers for assigning to a maintenance
 * request. Not a modal — an inline search-and-select component.
 */
export function TradesPersonAssignModal({
  currentAssignedId,
  providers,
  onAssign,
  isAssigning,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = useMemo(() => {
    const cats = new Set(providers.map((p) => p.category ?? "general"));
    return ["all", ...Array.from(cats)];
  }, [providers]);

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.business_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [providers, searchQuery, categoryFilter]);

  function formatCategory(cat: string | null) {
    if (!cat) return "General";
    return CATEGORY_LABELS[cat] ?? cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search providers by name…"
          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-500 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
        />
      </div>

      {/* Category chips */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                categoryFilter === cat
                  ? "bg-brand-primary text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-600"
              }`}
            >
              {cat === "all" ? "All Categories" : formatCategory(cat)}
            </button>
          ))}
        </div>
      )}

      {/* Provider list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-neutral-200 py-8 text-center dark:border-neutral-900">
          <p className="text-sm text-neutral-500">No providers found.</p>
          {providers.length === 0 && (
            <p className="mt-1 text-xs text-neutral-500">
              Marketplace providers will appear here once registered.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((provider) => {
            const isAssigned = provider.id === currentAssignedId;
            return (
              <div
                key={provider.id}
                className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
                  isAssigned
                    ? "border-success/30 bg-success-light dark:border-success/30 dark:bg-success/10"
                    : "border-neutral-200 bg-white hover:border-brand-primary/30 dark:border-neutral-900 dark:bg-neutral-900"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {provider.business_name}
                    </p>
                    {isAssigned && (
                      <CheckCircle2 className="size-4 shrink-0 text-success" />
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    {provider.category && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-900">
                        {formatCategory(provider.category)}
                      </span>
                    )}
                    {provider.average_rating != null && (
                      <span className="flex items-center gap-0.5 text-warning">
                        <Star className="size-3 fill-current" />
                        {provider.average_rating.toFixed(1)}
                      </span>
                    )}
                    {provider.city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="size-3" />
                        {provider.city}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isAssigning}
                  onClick={() => onAssign(provider.id)}
                  className={`ml-4 shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                    isAssigned
                      ? "border border-success text-success hover:bg-success-light dark:text-success dark:hover:bg-success/10"
                      : "bg-brand-primary text-white hover:bg-brand-primary/90"
                  }`}
                >
                  {isAssigned ? "Reassign" : "Assign"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
