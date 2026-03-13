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
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search providers by name…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1B4D3E] focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                  ? "bg-[#1B4D3E] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {cat === "all" ? "All Categories" : formatCategory(cat)}
            </button>
          ))}
        </div>
      )}

      {/* Provider list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center dark:border-slate-800">
          <p className="text-sm text-slate-500">No providers found.</p>
          {providers.length === 0 && (
            <p className="mt-1 text-xs text-slate-400">
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
                    ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                    : "border-slate-200 bg-white hover:border-[#1B4D3E]/30 dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {provider.business_name}
                    </p>
                    {isAssigned && (
                      <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {provider.category && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                        {formatCategory(provider.category)}
                      </span>
                    )}
                    {provider.average_rating != null && (
                      <span className="flex items-center gap-0.5 text-amber-600">
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
                      ? "border border-green-600 text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                      : "bg-[#1B4D3E] text-white hover:bg-[#1B4D3E]/90"
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
